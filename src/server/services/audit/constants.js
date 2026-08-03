import { FALLBACK_STATUS_META } from './guidance-comparison-constants.js'

export const STATUS_META = {
  CONFLICTS: {
    severity: 1,
    label: 'Goes against the law',
    meaning:
      'This guidance tells people to do something the law does not allow.',
    tone: 'red',
    cta: 'Review conflicting pages'
  },
  GUIDANCE_MISSING: {
    severity: 2,
    label: 'No guidance for this law',
    meaning:
      'There is a law about this, but no guidance has been written for it.',
    tone: 'orange',
    cta: 'View laws without guidance'
  },
  GUIDANCE_INCOMPLETE: {
    severity: 3,
    label: 'Only part of the law',
    meaning: 'The guidance covers some of the law, but leaves parts out.',
    tone: 'yellow',
    cta: 'View pages with partial coverage'
  },
  NO_MATCH: {
    severity: 4,
    label: 'No law candidate',
    meaning:
      'We did not find a law proposition close enough to compare with this guidance.',
    tone: 'grey',
    cta: 'View unmatched guidance'
  },
  UNGROUNDED: {
    severity: 5,
    label: 'No law found',
    meaning:
      'This guidance does not seem to be based on any law we could find.',
    tone: 'grey',
    cta: 'View pages not based on law'
  },
  GUIDANCE_BROADER: {
    severity: 6,
    label: 'Goes beyond the law',
    meaning: 'The guidance matches the law and also adds extra advice.',
    tone: 'blue',
    cta: 'View pages with extra advice'
  },
  GROUNDED: {
    severity: 7,
    label: 'Matches the law',
    meaning: 'The guidance correctly matches the law.',
    tone: 'green',
    cta: 'View pages that match'
  }
}

/**
 * Shared label/tone metadata for pair relationships + proposition-level
 * fallback / processing states (overview, pages-list, page-detail).
 */
export const STATEMENT_STATUS_META = Object.freeze({
  ...STATUS_META,
  ...FALLBACK_STATUS_META
})

/**
 * Overview tile order for new guidance-comparison runs.
 * Units: guidance-proposition counts (except GUIDANCE_MISSING = law-side).
 * UNGROUNDED is omitted (rejected candidates → ONLY_UNGROUNDED_CANDIDATES).
 * NO_MATCH is omitted on the new path (→ NO_CANDIDATES_FOUND).
 */
export const OVERVIEW_STATUS_ORDER = [
  'CONFLICTS',
  'GUIDANCE_MISSING',
  'GUIDANCE_INCOMPLETE',
  'GUIDANCE_BROADER',
  'NO_CANDIDATES_FOUND',
  'ONLY_UNGROUNDED_CANDIDATES',
  'NOT_CHECKED',
  'PARTIAL',
  'FAILED',
  'INCONSISTENT_DATA',
  'GROUNDED'
]

/**
 * Legacy overview tile order (runs without match-summaries).
 * Includes NO_MATCH / UNGROUNDED from the old top-match projection.
 */
export const LEGACY_OVERVIEW_STATUS_ORDER = [
  'CONFLICTS',
  'GUIDANCE_MISSING',
  'GUIDANCE_INCOMPLETE',
  'NO_MATCH',
  'UNGROUNDED',
  'GUIDANCE_BROADER',
  'GROUNDED'
]

/** @deprecated Prefer OVERVIEW_STATUS_ORDER or LEGACY_OVERVIEW_STATUS_ORDER. */
export const STATUS_ORDER = LEGACY_OVERVIEW_STATUS_ORDER

/**
 * Pages-list / page-detail URL status filters.
 * Excludes synthetic law-side GUIDANCE_MISSING (no pages) and UNGROUNDED.
 * Includes new fallback keys and legacy NO_MATCH for old runs.
 */
export const PAGE_FILTER_STATUSES = [
  'CONFLICTS',
  'GUIDANCE_INCOMPLETE',
  'GUIDANCE_BROADER',
  'NO_CANDIDATES_FOUND',
  'ONLY_UNGROUNDED_CANDIDATES',
  'NOT_CHECKED',
  'PARTIAL',
  'FAILED',
  'INCONSISTENT_DATA',
  'NO_MATCH',
  'GROUNDED'
]

/**
 * Law to Guidance page-summary filters (new contract only).
 * Excludes law-side GUIDANCE_MISSING, UNGROUNDED, and legacy NO_MATCH.
 */
export const LAW_TO_GUIDANCE_FILTER_STATUSES = [
  'CONFLICTS',
  'GUIDANCE_BROADER',
  'GUIDANCE_INCOMPLETE',
  'GROUNDED',
  'ONLY_UNGROUNDED_CANDIDATES',
  'NO_CANDIDATES_FOUND',
  'NOT_CHECKED',
  'PARTIAL',
  'FAILED',
  'INCONSISTENT_DATA'
]

/**
 * Display columns for the Law to Guidance page-summary table.
 * Pair-relationship columns count distinct GPs with ≥1 matching pair.
 * Fallback columns use canonical proposition-level summary outcomes.
 */
export const LAW_TO_GUIDANCE_COLUMNS = Object.freeze([
  {
    key: 'totalGuidancePropositions',
    label: 'Total guidance propositions',
    kind: 'total'
  },
  { key: 'GROUNDED', label: 'Matches the law', kind: 'relationship' },
  {
    key: 'GUIDANCE_BROADER',
    label: 'Goes beyond the law',
    kind: 'relationship'
  },
  {
    key: 'GUIDANCE_INCOMPLETE',
    label: 'Covers only part of the law',
    kind: 'relationship'
  },
  { key: 'CONFLICTS', label: 'Goes against the law', kind: 'relationship' },
  {
    key: 'ONLY_UNGROUNDED_CANDIDATES',
    label: 'No comparable law found',
    kind: 'fallback'
  },
  {
    key: 'NO_CANDIDATES_FOUND',
    label: 'No law candidate found',
    kind: 'fallback'
  },
  { key: 'NOT_CHECKED', label: 'Not yet compared', kind: 'fallback' },
  { key: 'PARTIAL', label: 'Comparison incomplete', kind: 'fallback' },
  { key: 'FAILED', label: 'Comparison failed', kind: 'fallback' },
  { key: 'INCONSISTENT_DATA', label: 'Data issue', kind: 'fallback' }
])
