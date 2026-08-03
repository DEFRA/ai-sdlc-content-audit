/**
 * Overview / pages-list aggregation from guidance-comparison view-models.
 *
 * Units (do not conflate):
 * - statusCounts[relationship|fallback] — distinct guidance propositions
 * - pagesByStatus[status] — distinct pages with ≥1 matching proposition
 * - totalGuidancePropositions — distinct guidance proposition IDs
 * - lawsMissingGuidance — distinct law instruments (synthetic law-side gaps)
 * - comparison-pair counts are NOT produced here (page-detail owns those)
 *
 * Multi-relationship: a proposition with GROUNDED + CONFLICTS belongs once to
 * each relationship filter. Totals must not be summed from overlapping filters.
 *
 * Fallback states are mutually exclusive and only apply when fallbackKind !== NONE.
 * Guidance-side GUIDANCE_MISSING pair rows (rare) are not overview-categorised;
 * the GUIDANCE_MISSING overview tile remains the synthetic law-side metric.
 */

import {
  FALLBACK_KIND,
  FALLBACK_STATUS_META
} from './guidance-comparison-constants.js'

/** Pair-level relationship filters a completed proposition may join. */
const RELATIONSHIP_FILTER_STATUSES = new Set([
  'GROUNDED',
  'GUIDANCE_BROADER',
  'GUIDANCE_INCOMPLETE',
  'CONFLICTS'
])

/**
 * @param {object} params
 * @param {string} params.categoryId
 * @param {import('./guidance-comparison-types.js').GuidanceComparisonViewModel[]} params.guidanceComparisons
 * @param {string[]} params.pageIds — content_ids in category (stable order)
 * @param {object[]} params.lawSideMissingGuidance — synthetic GUIDANCE_MISSING rows
 * @param {(categoryId: string, lawPropositionId: string) => object|null} params.legislationPropositionForCategory
 * @param {string[]} params.overviewStatusKeys — keys to initialise in count maps
 * @returns {{
 *   statusCounts: Record<string, number>,
 *   pagesByStatus: Record<string, number>,
 *   totalGuidancePropositions: number,
 *   lawsMissingGuidance: number,
 *   pageStatusSets: Map<string, Set<string>>,
 *   conflictsCountByPage: Map<string, number>
 * }}
 */
export function buildGuidanceOverviewModel({
  categoryId,
  guidanceComparisons,
  pageIds,
  lawSideMissingGuidance,
  legislationPropositionForCategory,
  overviewStatusKeys
}) {
  const statusCounts = Object.fromEntries(
    overviewStatusKeys.map((status) => [status, 0])
  )
  const pagesByStatus = Object.fromEntries(
    overviewStatusKeys.map((status) => [status, 0])
  )
  /** @type {Map<string, Set<string>>} */
  const pageStatusSets = new Map()
  for (const pageId of pageIds) {
    pageStatusSets.set(pageId, new Set())
  }

  /** @type {Map<string, number>} distinct GPs with CONFLICTS per page */
  const conflictsCountByPage = new Map()
  for (const pageId of pageIds) {
    conflictsCountByPage.set(pageId, 0)
  }

  const scoped = guidanceComparisons.filter((vm) => {
    const gp = vm.guidanceProposition
    if (gp == null || gp.id == null) return false
    if (gp.category != null && gp.category !== categoryId) return false
    if (gp.content_id == null) return false
    return pageStatusSets.has(gp.content_id)
  })

  const seenGpIds = new Set()

  for (const vm of scoped) {
    const gp = vm.guidanceProposition
    if (seenGpIds.has(gp.id)) continue
    seenGpIds.add(gp.id)

    const memberships = membershipStatuses(vm)
    for (const status of memberships) {
      if (statusCounts[status] != null) {
        statusCounts[status] += 1
      }
      const pageSet = pageStatusSets.get(gp.content_id)
      if (pageSet) pageSet.add(status)
    }

    if (
      vm.fallbackKind === FALLBACK_KIND.NONE &&
      vm.comparisons.some((c) => c.relationship === 'CONFLICTS')
    ) {
      conflictsCountByPage.set(
        gp.content_id,
        (conflictsCountByPage.get(gp.content_id) ?? 0) + 1
      )
    }
  }

  for (const pageId of pageIds) {
    for (const status of pageStatusSets.get(pageId) ?? []) {
      if (pagesByStatus[status] != null) {
        pagesByStatus[status] += 1
      }
    }
  }

  // Law-side synthetic GUIDANCE_MISSING — distinct law instruments, not GPs.
  const missingLawIds = new Set()
  for (const m of lawSideMissingGuidance) {
    if (m.category != null && m.category !== categoryId) continue
    if (m.law_proposition_id == null) continue
    const lp = legislationPropositionForCategory(
      categoryId,
      m.law_proposition_id
    )
    if (!lp) continue
    missingLawIds.add(lp.source_record_id)
  }
  if (statusCounts.GUIDANCE_MISSING != null) {
    // Unit: synthetic missing law-proposition rows (established overview tile).
    statusCounts.GUIDANCE_MISSING = lawSideMissingGuidance.filter(
      (m) =>
        (m.category == null || m.category === categoryId) &&
        m.law_proposition_id != null
    ).length
  }

  return {
    statusCounts,
    pagesByStatus,
    totalGuidancePropositions: seenGpIds.size,
    lawsMissingGuidance: missingLawIds.size,
    pageStatusSets,
    conflictsCountByPage
  }
}

/**
 * Status keys this guidance proposition belongs to for overview/pages filters.
 * @param {import('./guidance-comparison-types.js').GuidanceComparisonViewModel} vm
 * @returns {string[]}
 */
export function membershipStatuses(vm) {
  if (vm.fallbackKind === FALLBACK_KIND.NONE) {
    const statuses = new Set()
    for (const comparison of vm.comparisons) {
      const relationship = comparison.relationship
      if (RELATIONSHIP_FILTER_STATUSES.has(relationship)) {
        statuses.add(relationship)
      }
    }
    return [...statuses]
  }

  if (
    vm.fallbackKind &&
    vm.fallbackKind !== FALLBACK_KIND.NONE &&
    FALLBACK_STATUS_META[vm.fallbackKind] != null
  ) {
    return [vm.fallbackKind]
  }

  // Defensive: treat unknown fallback as unavailable.
  return [FALLBACK_KIND.INCONSISTENT_DATA]
}
