/**
 * Aggregate guidance-proposition outcome from pair-level line-item results.
 *
 * Deliberately not “worst status wins”: conflict overrides everything; a
 * supporting (green) relationship overrides yellow-only assessed outcomes.
 * Domain states are semantic; presentation label/tone live in META.
 */

import { REPORTABLE_RELATIONSHIP_SET } from './guidance-comparison-constants.js'

/** @typedef {'CONFLICT_FOUND'|'SUPPORTING_LAW_FOUND'|'NO_CONFIRMED_SUPPORT'|'NOT_ASSESSED'} AggregateOutcome */

export const AGGREGATE_OUTCOME = Object.freeze({
  CONFLICT_FOUND: 'CONFLICT_FOUND',
  SUPPORTING_LAW_FOUND: 'SUPPORTING_LAW_FOUND',
  NO_CONFIRMED_SUPPORT: 'NO_CONFIRMED_SUPPORT',
  NOT_ASSESSED: 'NOT_ASSESSED'
})

/**
 * Task-priority presentation order for summary, filters and active-filter UI:
 * conflicts → unresolved → supporting → unassessed.
 */
export const AGGREGATE_OUTCOME_PRESENTATION_ORDER = Object.freeze([
  AGGREGATE_OUTCOME.CONFLICT_FOUND,
  AGGREGATE_OUTCOME.NO_CONFIRMED_SUPPORT,
  AGGREGATE_OUTCOME.SUPPORTING_LAW_FOUND,
  AGGREGATE_OUTCOME.NOT_ASSESSED
])

export const AGGREGATE_OUTCOME_SET = new Set(
  AGGREGATE_OUTCOME_PRESENTATION_ORDER
)

/**
 * Presentation mapping for aggregate outcomes (labels + GOV.UK tag tones).
 * Kept separate from pair-level STATUS_META / FALLBACK_STATUS_META.
 */
export const AGGREGATE_OUTCOME_META = Object.freeze({
  CONFLICT_FOUND: {
    label: 'Conflict found',
    tone: 'red',
    severity: 1
  },
  SUPPORTING_LAW_FOUND: {
    label: 'Supporting law found',
    tone: 'green',
    severity: 7
  },
  NO_CONFIRMED_SUPPORT: {
    label: 'No confirmed support found',
    tone: 'yellow',
    severity: 3
  },
  NOT_ASSESSED: {
    label: 'Not assessed',
    tone: 'grey',
    severity: 12
  }
})

/**
 * Stable URL query value for an aggregate outcome (`conflict_found`).
 * @param {string} outcome
 * @returns {string}
 */
export function aggregateOutcomeToQueryValue(outcome) {
  return String(outcome).toLowerCase()
}

/**
 * Parse a query value into a domain aggregate outcome, or null if invalid.
 * @param {unknown} value
 * @returns {string|null}
 */
export function queryValueToAggregateOutcome(value) {
  if (typeof value !== 'string' || value === '') return null
  const outcome = value.toUpperCase()
  return AGGREGATE_OUTCOME_SET.has(outcome) ? outcome : null
}

/** Line-item relationships that count as red (conflict). */
const RED_RELATIONSHIPS = new Set(['CONFLICTS'])

/** Line-item relationships that count as green (supporting law). */
const GREEN_RELATIONSHIPS = new Set(['GROUNDED'])

/**
 * Classify a pair-level outcome for roll-up.
 * Reportable non-red/non-green relationships are assessed yellow-bucket.
 * Missing / unknown / non-reportable values are unassessed.
 *
 * @param {string|null|undefined} relationship
 * @returns {'red'|'green'|'yellow'|null} null = unassessed
 */
export function lineItemOutcomeBucket(relationship) {
  if (relationship == null || relationship === '') return null
  if (RED_RELATIONSHIPS.has(relationship)) return 'red'
  if (GREEN_RELATIONSHIPS.has(relationship)) return 'green'
  if (REPORTABLE_RELATIONSHIP_SET.has(relationship)) return 'yellow'
  return null
}

/**
 * Derive the guidance-proposition aggregate from line-item outcomes.
 *
 * @param {readonly (string|null|undefined)[]} lineItemOutcomes
 *   Pair `relationship` values (and null/undefined for unassessed slots).
 * @returns {{ outcome: AggregateOutcome, unassessedCount: number }}
 */
export function aggregateGuidanceOutcome(lineItemOutcomes) {
  let hasRed = false
  let hasGreen = false
  let hasAssessed = false
  let unassessedCount = 0

  for (const outcome of lineItemOutcomes) {
    const bucket = lineItemOutcomeBucket(outcome)
    if (bucket == null) {
      unassessedCount += 1
      continue
    }
    hasAssessed = true
    if (bucket === 'red') hasRed = true
    else if (bucket === 'green') hasGreen = true
  }

  if (hasRed) {
    return {
      outcome: AGGREGATE_OUTCOME.CONFLICT_FOUND,
      unassessedCount
    }
  }
  if (hasGreen) {
    return {
      outcome: AGGREGATE_OUTCOME.SUPPORTING_LAW_FOUND,
      unassessedCount
    }
  }
  if (hasAssessed) {
    return {
      outcome: AGGREGATE_OUTCOME.NO_CONFIRMED_SUPPORT,
      unassessedCount
    }
  }
  return {
    outcome: AGGREGATE_OUTCOME.NOT_ASSESSED,
    unassessedCount
  }
}

/**
 * Map an aggregate outcome to UI label / GOV.UK tag tone / sort severity.
 *
 * @param {AggregateOutcome} outcome
 * @returns {{ status: AggregateOutcome, label: string, tone: string, severity: number }}
 */
export function presentAggregateOutcome(outcome) {
  const meta = AGGREGATE_OUTCOME_META[outcome]
  if (meta == null) {
    throw new Error(`Unknown aggregate outcome: ${outcome}`)
  }
  return {
    status: outcome,
    label: meta.label,
    tone: meta.tone,
    severity: meta.severity
  }
}
