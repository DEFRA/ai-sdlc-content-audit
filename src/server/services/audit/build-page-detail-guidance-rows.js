/**
 * Page-detail guidance-proposition rows (aggregated view).
 *
 * One row per guidance proposition. Primary status = worst severity among
 * reportable pairs, or the proposition-level fallbackKind. Multi-pair rows
 * carry relationship chips; nested pair cards reuse the flat statement shape.
 */

import { FALLBACK_KIND } from './guidance-comparison-constants.js'
import {
  buildComparisonStatement,
  buildFallbackStatement,
  scopeGuidanceComparisonsToPage,
  STATEMENT_META
} from './page-detail-statement-builders.js'

/**
 * @param {object} params
 * @param {string} params.categoryId
 * @param {string} params.pageId
 * @param {import('./guidance-comparison-types.js').GuidanceComparisonViewModel[]} params.guidanceComparisons
 * @param {(categoryId: string, sourceRecordId: string) => object|null} params.legislationForCategory
 * @param {string|null} [params.statusFilter]
 * @returns {object[]}
 */
export function buildPageDetailGuidanceRows({
  categoryId,
  pageId,
  guidanceComparisons,
  legislationForCategory,
  statusFilter = null
}) {
  const scoped = scopeGuidanceComparisonsToPage(
    guidanceComparisons,
    categoryId,
    pageId
  )

  /** @type {object[]} */
  const rows = []
  let order = 0

  for (const vm of scoped) {
    rows.push(
      buildGuidanceRow({
        categoryId,
        vm,
        legislationForCategory,
        statusFilter,
        order: order++
      })
    )
  }

  rows.sort(compareGuidanceRows)
  return rows
}

/**
 * Wrap legacy 1:1 top-match statements as single-comparison guidance rows.
 *
 * @param {object[]} statements
 * @param {string|null} [statusFilter]
 * @returns {object[]}
 */
export function wrapLegacyStatementsAsGuidanceRows(
  statements,
  statusFilter = null
) {
  const rows = statements.map((statement, index) => {
    const meta = STATEMENT_META[statement.status]
    const comparison = {
      ...statement,
      dimmed: Boolean(statusFilter && statement.status !== statusFilter)
    }
    return {
      id: `legacy-${statement.id}`,
      guidancePropositionId: null,
      guidanceText: statement.guidanceText,
      primaryStatus: statement.status,
      primaryLabel: statement.statusLabel ?? meta?.label ?? statement.status,
      primaryMeaning: statement.statusMeaning ?? meta?.meaning ?? '',
      primaryTone: statement.statusTone ?? meta?.tone ?? 'grey',
      primarySeverity: statement.severity ?? meta?.severity ?? 99,
      chips: [],
      pairCount: 1,
      rowKind: 'comparison',
      comparisons: [comparison],
      order: statement.order ?? index
    }
  })

  rows.sort(compareGuidanceRows)
  return rows
}

/**
 * Whether a guidance row matches a status filter (distinct-GP semantics).
 *
 * @param {object} row
 * @param {string} status
 * @returns {boolean}
 */
export function guidanceRowMatchesStatus(row, status) {
  if (row.rowKind === 'fallback') {
    return row.primaryStatus === status
  }
  return row.comparisons.some((c) => c.status === status)
}

/**
 * Distinct-GP counts per displayed status for the filter bar.
 *
 * @param {object[]} rows
 * @param {readonly string[]} statuses
 * @returns {Record<string, number>}
 */
export function countGuidanceRowsByStatus(rows, statuses) {
  /** @type {Record<string, number>} */
  const counts = {}
  for (const status of statuses) counts[status] = 0

  for (const row of rows) {
    if (row.rowKind === 'fallback') {
      if (counts[row.primaryStatus] != null) {
        counts[row.primaryStatus] += 1
      }
      continue
    }

    const seen = new Set()
    for (const comparison of row.comparisons) {
      if (counts[comparison.status] == null) continue
      if (seen.has(comparison.status)) continue
      seen.add(comparison.status)
      counts[comparison.status] += 1
    }
  }

  return counts
}

function buildGuidanceRow({
  categoryId,
  vm,
  legislationForCategory,
  statusFilter,
  order
}) {
  const gp = vm.guidanceProposition

  if (vm.fallbackKind !== FALLBACK_KIND.NONE) {
    const fallback = buildFallbackStatement({
      guidanceProposition: gp,
      fallbackKind: vm.fallbackKind,
      order
    })
    return {
      id: gp.id,
      guidancePropositionId: gp.id,
      guidanceText: gp.proposition_text,
      primaryStatus: fallback.status,
      primaryLabel: fallback.statusLabel,
      primaryMeaning: fallback.statusMeaning,
      primaryTone: fallback.statusTone,
      primarySeverity: fallback.severity,
      chips: [],
      pairCount: 0,
      rowKind: 'fallback',
      comparisons: [],
      order
    }
  }

  const comparisons = vm.comparisons.map((comparison, index) => {
    const statement = buildComparisonStatement({
      categoryId,
      guidanceProposition: gp,
      comparison,
      legislationForCategory,
      order: index
    })
    return {
      ...statement,
      dimmed: Boolean(statusFilter && statement.status !== statusFilter)
    }
  })

  const sortedComparisons = sortComparisonsForDisplay(comparisons)
  const primary = pickPrimaryComparison(sortedComparisons)
  const chips = buildStatusChips(sortedComparisons)

  return {
    id: gp.id,
    guidancePropositionId: gp.id,
    guidanceText: gp.proposition_text,
    primaryStatus: primary.status,
    primaryLabel: primary.statusLabel,
    primaryMeaning: primary.statusMeaning,
    primaryTone: primary.statusTone,
    primarySeverity: primary.severity,
    chips,
    pairCount: sortedComparisons.length,
    rowKind: 'comparison',
    comparisons: sortedComparisons,
    order
  }
}

function pickPrimaryComparison(comparisons) {
  let best = comparisons[0]
  for (const comparison of comparisons) {
    if (comparison.severity < best.severity) best = comparison
  }
  return best
}

/**
 * Relationship histogram chips; omitted by caller when pairCount <= 1.
 * @param {object[]} comparisons
 */
function buildStatusChips(comparisons) {
  if (comparisons.length <= 1) return []

  /** @type {Map<string, { status: string, label: string, tone: string, severity: number, count: number }>} */
  const byStatus = new Map()
  for (const comparison of comparisons) {
    const existing = byStatus.get(comparison.status)
    if (existing) {
      existing.count += 1
      continue
    }
    byStatus.set(comparison.status, {
      status: comparison.status,
      label: comparison.statusLabel,
      tone: comparison.statusTone,
      severity: comparison.severity,
      count: 1
    })
  }

  return [...byStatus.values()].sort((a, b) => a.severity - b.severity)
}

function sortComparisonsForDisplay(comparisons) {
  return comparisons.slice().sort((a, b) => {
    if (a.dimmed !== b.dimmed) return a.dimmed ? 1 : -1
    if (a.severity !== b.severity) return a.severity - b.severity
    return (a.order ?? 0) - (b.order ?? 0)
  })
}

function compareGuidanceRows(a, b) {
  if (a.primarySeverity !== b.primarySeverity) {
    return a.primarySeverity - b.primarySeverity
  }
  return (a.order ?? 0) - (b.order ?? 0)
}
