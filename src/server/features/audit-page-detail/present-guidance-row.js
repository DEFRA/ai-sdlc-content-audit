/**
 * Presentation helpers for aggregated guidance-proposition rows.
 * Keeps enum-to-copy mapping out of Nunjucks templates.
 */

import {
  AGGREGATE_OUTCOME,
  AGGREGATE_OUTCOME_META
} from '../../services/audit/aggregate-guidance-outcome.js'
import { presentComparisonCard } from './present-comparison-card.js'

export { presentPairComparisonOutcome } from './present-comparison-card.js'

const OVERALL_OUTCOME_PREFIX = 'Overall guidance outcome'

/**
 * Short composition terms from existing reviewer vocabulary
 * (relationship enums / STATUS_META), not a second label system.
 */
const COMPOSITION_TERMS = Object.freeze({
  CONFLICTS: { singular: 'conflict', plural: 'conflicts' },
  GUIDANCE_MISSING: {
    singular: 'missing guidance',
    plural: 'missing guidance'
  },
  GUIDANCE_INCOMPLETE: { singular: 'incomplete', plural: 'incomplete' },
  GUIDANCE_BROADER: { singular: 'broader', plural: 'broader' },
  GROUNDED: { singular: 'grounded', plural: 'grounded' }
})

/** Severity-ordered composition keys (matches STATUS_META severity). */
const COMPOSITION_ORDER = Object.freeze([
  'CONFLICTS',
  'GUIDANCE_MISSING',
  'GUIDANCE_INCOMPLETE',
  'GUIDANCE_BROADER',
  'GROUNDED'
])

/** Assessed pair outcomes that are neither conflict nor supporting. */
const INCONCLUSIVE_RELATIONSHIPS = new Set([
  'GUIDANCE_INCOMPLETE',
  'GUIDANCE_BROADER',
  'GUIDANCE_MISSING'
])

/**
 * @param {string} aggregateOutcome
 * @returns {{ label: string, tone: string, govukTagClass: string, accessibleLabel: string }|null}
 */
export function presentGuidanceAggregateOutcome(aggregateOutcome) {
  const meta = AGGREGATE_OUTCOME_META[aggregateOutcome]
  if (meta == null) return null
  return {
    label: meta.label,
    tone: meta.tone,
    govukTagClass: `govuk-tag--${meta.tone}`,
    accessibleLabel: `${OVERALL_OUTCOME_PREFIX}: ${meta.label}`
  }
}

/**
 * Plain-text composition of pair outcomes + unassessed count.
 *
 * @param {readonly { status: string }[]} comparisons
 * @param {number} [unassessedCount]
 * @returns {string|null}
 */
export function buildAggregateCompositionText(
  comparisons,
  unassessedCount = 0
) {
  /** @type {Map<string, number>} */
  const counts = new Map()
  for (const comparison of comparisons) {
    const status = comparison.status
    if (!COMPOSITION_TERMS[status]) continue
    counts.set(status, (counts.get(status) ?? 0) + 1)
  }

  /** @type {string[]} */
  const parts = []
  for (const status of COMPOSITION_ORDER) {
    const count = counts.get(status)
    if (count == null || count < 1) continue
    parts.push(formatCompositionPart(count, COMPOSITION_TERMS[status]))
  }

  if (unassessedCount > 0) {
    parts.push(
      formatCompositionPart(unassessedCount, {
        singular: 'unassessed',
        plural: 'unassessed'
      })
    )
  }

  return parts.length > 0 ? parts.join(' · ') : null
}

/**
 * Processing / evidence explanation when the aggregate is not assessed.
 * Reuses FALLBACK meaning copy via primaryMeaning when present.
 *
 * @param {object} row
 * @param {string} row.aggregateOutcome
 * @param {string} [row.rowKind]
 * @param {string} [row.primaryMeaning]
 * @param {number} [row.pairCount]
 * @returns {string|null}
 */
export function buildProcessingExplanation(row) {
  if (row.aggregateOutcome !== AGGREGATE_OUTCOME.NOT_ASSESSED) return null

  if (row.rowKind === 'fallback' && row.primaryMeaning) {
    return row.primaryMeaning
  }

  if ((row.pairCount ?? 0) === 0) {
    return 'No reportable comparison outcomes are available.'
  }

  return null
}

/**
 * Concise explanation of what the aggregate means for this proposition.
 *
 * @param {object} params
 * @param {string} params.aggregateOutcome
 * @param {readonly { status: string }[]} params.comparisons
 * @param {string|null} [params.processingExplanation]
 * @returns {string|null}
 */
export function buildAggregateExplanation({
  aggregateOutcome,
  comparisons,
  processingExplanation = null
}) {
  if (aggregateOutcome === AGGREGATE_OUTCOME.NOT_ASSESSED) {
    return processingExplanation
  }

  if (aggregateOutcome === AGGREGATE_OUTCOME.CONFLICT_FOUND) {
    const conflictCount = comparisons.filter(
      (c) => c.status === 'CONFLICTS'
    ).length
    if (conflictCount === 1) {
      return '1 matched law proposition conflicts with this guidance.'
    }
    if (conflictCount > 1) {
      return `${conflictCount} matched law propositions conflict with this guidance.`
    }
    return 'One or more matched law propositions conflict with this guidance.'
  }

  if (aggregateOutcome === AGGREGATE_OUTCOME.SUPPORTING_LAW_FOUND) {
    const inconclusiveCount = comparisons.filter((c) =>
      INCONCLUSIVE_RELATIONSHIPS.has(c.status)
    ).length
    if (inconclusiveCount === 1) {
      return 'Supporting law was found; 1 other comparison remains inconclusive.'
    }
    if (inconclusiveCount > 1) {
      return `Supporting law was found; ${inconclusiveCount} other comparisons remain inconclusive.`
    }
    return 'Supporting law was found and no conflicting comparison was identified.'
  }

  if (aggregateOutcome === AGGREGATE_OUTCOME.NO_CONFIRMED_SUPPORT) {
    return 'No conflicting law was identified, but no supporting comparison was confirmed.'
  }

  return null
}

/**
 * @param {number} comparisonCount
 * @returns {string|null}
 */
export function buildComparisonCountText(comparisonCount) {
  if (comparisonCount < 1) return null
  if (comparisonCount === 1) return '1 law comparison'
  return `${comparisonCount} law comparisons`
}

/**
 * Stable native-details summary label (same open or closed).
 * Expanded state is conveyed by the browser, not by swapping copy.
 *
 * @param {number} comparisonCount
 * @returns {string|null}
 */
export function buildComparisonControlText(comparisonCount) {
  if (comparisonCount < 1) return null
  const noun = comparisonCount === 1 ? 'law comparison' : 'law comparisons'
  return `Review ${comparisonCount} ${noun}`
}

/**
 * Full presentation overlay for one guidance row (template-ready).
 *
 * @param {object} row
 * @param {{ statementNumber?: number }} [options]
 * @returns {object}
 */
export function presentGuidanceRow(row, options = {}) {
  const aggregate = presentGuidanceAggregateOutcome(row.aggregateOutcome) ?? {
    label: row.primaryLabel,
    tone: row.primaryTone ?? 'grey',
    govukTagClass: `govuk-tag--${row.primaryTone ?? 'grey'}`,
    accessibleLabel: `${OVERALL_OUTCOME_PREFIX}: ${row.primaryLabel}`
  }

  const comparisons = (row.comparisons ?? []).map((comparison, index) =>
    presentComparisonCard(comparison, {
      displayNumber: index + 1,
      showGuidanceText: false,
      headingLevel: 4
    })
  )
  const comparisonCount = comparisons.length
  const compositionText = buildAggregateCompositionText(
    comparisons,
    row.unassessedCount ?? 0
  )
  const processingExplanation = buildProcessingExplanation({
    ...row,
    pairCount: comparisonCount
  })
  const aggregateExplanation = buildAggregateExplanation({
    aggregateOutcome: row.aggregateOutcome,
    comparisons,
    processingExplanation
  })

  const statementNumber = options.statementNumber ?? (row.order ?? 0) + 1
  const rowId = row.id ?? `statement-${statementNumber}`
  const comparisonControlText = buildComparisonControlText(comparisonCount)

  return {
    ...row,
    comparisons,
    statementNumber,
    heading: `Guidance statement ${statementNumber}`,
    headingId: `guidance-heading-${rowId}`,
    propositionId: row.guidancePropositionId ?? null,
    aggregateLabel: aggregate.label,
    aggregateTone: aggregate.tone,
    aggregateGovukTagClass: aggregate.govukTagClass,
    aggregateAccessibleLabel: aggregate.accessibleLabel,
    compositionText,
    processingExplanation,
    aggregateExplanation,
    comparisonCount,
    comparisonCountText: buildComparisonCountText(comparisonCount),
    comparisonControlText,
    comparisonContainerId: `guidance-comparisons-${rowId}`,
    // Retained for any consumers still reading the accent token; parent chrome
    // no longer uses a coloured card border.
    aggregateBorderColour: toneBorderColour(aggregate.tone)
  }
}

/**
 * @param {string} tone
 * @returns {string}
 */
export function toneBorderColour(tone) {
  if (tone === 'red') return '#d4351c'
  if (tone === 'yellow') return '#ffdd00'
  if (tone === 'green') return '#00703c'
  if (tone === 'blue') return '#1d70b8'
  if (tone === 'orange') return '#f47738'
  return '#b1b4b6'
}

/**
 * @param {number} count
 * @param {{ singular: string, plural: string }} terms
 */
function formatCompositionPart(count, terms) {
  const word = count === 1 ? terms.singular : terms.plural
  return `${count} ${word}`
}
