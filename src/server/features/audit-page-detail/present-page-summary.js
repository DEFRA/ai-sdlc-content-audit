/**
 * Page-level aggregate summary and outcome-filter presentation for the
 * aggregated Law to Guidance page detail.
 */

import {
  AGGREGATE_OUTCOME_META,
  AGGREGATE_OUTCOME_PRESENTATION_ORDER,
  aggregateOutcomeToQueryValue,
  queryValueToAggregateOutcome
} from '../../services/audit/aggregate-guidance-outcome.js'

/**
 * Count each guidance proposition once by its aggregateOutcome.
 *
 * @param {readonly { aggregateOutcome?: string }[]} rows
 * @returns {Record<string, number>}
 */
export function countGuidanceRowsByAggregateOutcome(rows) {
  /** @type {Record<string, number>} */
  const counts = {}
  for (const outcome of AGGREGATE_OUTCOME_PRESENTATION_ORDER) {
    counts[outcome] = 0
  }
  for (const row of rows) {
    const outcome = row.aggregateOutcome
    if (outcome != null && counts[outcome] != null) {
      counts[outcome] += 1
    }
  }
  return counts
}

/**
 * Parse `outcome` query values (single or repeated). Invalid values ignored.
 *
 * @param {object} query
 * @returns {string[]} domain aggregate outcomes
 */
export function parseAggregateOutcomeFilters(query) {
  const raw = query?.outcome
  const values = Array.isArray(raw) ? raw : raw != null ? [raw] : []
  /** @type {string[]} */
  const selected = []
  const seen = new Set()
  for (const value of values) {
    const outcome = queryValueToAggregateOutcome(value)
    if (outcome == null || seen.has(outcome)) continue
    seen.add(outcome)
    selected.push(outcome)
  }
  // Preserve task-priority order, not query order.
  return AGGREGATE_OUTCOME_PRESENTATION_ORDER.filter((outcome) =>
    seen.has(outcome)
  )
}

/**
 * @param {object} row
 * @param {readonly string[]} selectedOutcomes
 * @returns {boolean}
 */
export function guidanceRowMatchesAggregateOutcomes(row, selectedOutcomes) {
  if (selectedOutcomes.length === 0) return true
  return selectedOutcomes.includes(row.aggregateOutcome)
}

/**
 * @param {string} pageBaseHref
 * @param {readonly string[]} outcomes
 * @returns {string}
 */
export function buildOutcomeFilterHref(pageBaseHref, outcomes) {
  if (outcomes.length === 0) return pageBaseHref
  const params = new URLSearchParams()
  for (const outcome of outcomes) {
    params.append('outcome', aggregateOutcomeToQueryValue(outcome))
  }
  return `${pageBaseHref}?${params.toString()}`
}

/**
 * @param {number} totalGuidanceCount
 * @param {number} visibleGuidanceCount
 * @param {boolean} hasActiveFilters
 * @returns {string}
 */
export function buildGuidanceCountText(
  totalGuidanceCount,
  visibleGuidanceCount,
  hasActiveFilters
) {
  if (!hasActiveFilters) {
    return formatGuidanceStatements(totalGuidanceCount)
  }
  return `Showing ${visibleGuidanceCount} of ${totalGuidanceCount} guidance ${
    totalGuidanceCount === 1 ? 'statement' : 'statements'
  }`
}

/**
 * @param {object} params
 * @param {readonly { aggregateOutcome?: string }[]} params.allRows
 * @param {readonly string[]} params.selectedOutcomes
 * @param {string} params.pageBaseHref
 */
export function presentPageSummaryAndFilters({
  allRows,
  selectedOutcomes,
  pageBaseHref
}) {
  const aggregateOutcomeCounts = countGuidanceRowsByAggregateOutcome(allRows)
  const totalGuidanceCount = allRows.length
  const hasActiveFilters = selectedOutcomes.length > 0

  const outcomeItems = AGGREGATE_OUTCOME_PRESENTATION_ORDER.map((outcome) => {
    const meta = AGGREGATE_OUTCOME_META[outcome]
    const count = aggregateOutcomeCounts[outcome] ?? 0
    const queryValue = aggregateOutcomeToQueryValue(outcome)
    const selected = selectedOutcomes.includes(outcome)
    const countNoun = count === 1 ? 'statement' : 'statements'
    return {
      value: outcome,
      queryValue,
      label: meta.label,
      count,
      selected,
      summaryText: `${count} ${meta.label.toLowerCase()}`,
      // Compact visible count; fuller phrase for independent SR reading.
      checkboxLabel: `${meta.label} (${count})`,
      checkboxHtml: `${escapeHtml(meta.label)}<span aria-hidden="true"> (${count})</span><span class="govuk-visually-hidden">, ${count} guidance ${countNoun}</span>`
    }
  })

  const activeItems = selectedOutcomes.map((outcome) => {
    const meta = AGGREGATE_OUTCOME_META[outcome]
    const remaining = selectedOutcomes.filter((item) => item !== outcome)
    return {
      value: outcome,
      label: meta.label,
      removeHref: buildOutcomeFilterHref(pageBaseHref, remaining),
      removeAccessibleName: `Remove filter: ${meta.label}`
    }
  })

  return {
    summary: {
      totalGuidanceCount,
      aggregateOutcomeCounts,
      totalCountText: formatGuidanceStatements(totalGuidanceCount),
      outcomeItems
    },
    filters: {
      active: hasActiveFilters,
      selectedOutcomes,
      clearHref: pageBaseHref,
      formAction: pageBaseHref,
      checkboxItems: outcomeItems.map((item) => ({
        value: item.queryValue,
        html: item.checkboxHtml,
        checked: item.selected
      })),
      activeItems
    }
  }
}

/**
 * @param {number} count
 * @returns {string}
 */
function formatGuidanceStatements(count) {
  if (count === 1) return '1 guidance statement'
  return `${count} guidance statements`
}

/**
 * @param {string} value
 * @returns {string}
 */
function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
