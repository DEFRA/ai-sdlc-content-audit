/**
 * Proposition-level assessment / coverage / fallback constants.
 *
 * Pair-level `relationship` values stay in `constants.js` (STATUS_META).
 * Reportable set is mirrored from Audit Assembler / Proposition Matcher —
 * see guidance-comparison.md.
 */

/** @typedef {'NOT_CHECKED'|'COMPLETE'|'PARTIAL'|'FAILED'} AssessmentStatus */
/** @typedef {'HAS_REPORTABLE_COMPARISON'|'ONLY_UNGROUNDED_CANDIDATES'|'NO_CANDIDATES_FOUND'} CoverageResult */
/**
 * @typedef {'NONE'|'NO_CANDIDATES_FOUND'|'ONLY_UNGROUNDED_CANDIDATES'|'NOT_CHECKED'|'PARTIAL'|'FAILED'|'INCONSISTENT_DATA'} FallbackKind
 */

export const ASSESSMENT_STATUS = Object.freeze({
  NOT_CHECKED: 'NOT_CHECKED',
  COMPLETE: 'COMPLETE',
  PARTIAL: 'PARTIAL',
  FAILED: 'FAILED'
})

export const COVERAGE_RESULT = Object.freeze({
  HAS_REPORTABLE_COMPARISON: 'HAS_REPORTABLE_COMPARISON',
  ONLY_UNGROUNDED_CANDIDATES: 'ONLY_UNGROUNDED_CANDIDATES',
  NO_CANDIDATES_FOUND: 'NO_CANDIDATES_FOUND'
})

export const FALLBACK_KIND = Object.freeze({
  NONE: 'NONE',
  NO_CANDIDATES_FOUND: 'NO_CANDIDATES_FOUND',
  ONLY_UNGROUNDED_CANDIDATES: 'ONLY_UNGROUNDED_CANDIDATES',
  NOT_CHECKED: 'NOT_CHECKED',
  PARTIAL: 'PARTIAL',
  FAILED: 'FAILED',
  INCONSISTENT_DATA: 'INCONSISTENT_DATA'
})

/** Frontend-facing reportable pair relationships (UNGROUNDED excluded). */
export const REPORTABLE_RELATIONSHIPS = Object.freeze([
  'GROUNDED',
  'GUIDANCE_BROADER',
  'GUIDANCE_INCOMPLETE',
  'CONFLICTS',
  'GUIDANCE_MISSING'
])

export const REPORTABLE_RELATIONSHIP_SET = new Set(REPORTABLE_RELATIONSHIPS)

/**
 * Proposition-level fallback / processing-state display metadata.
 *
 * Pair rows use STATUS_META relationship labels. These are not legal pair
 * outcomes: NOT_CHECKED / PARTIAL / FAILED / INCONSISTENT_DATA are processing
 * states; ONLY_UNGROUNDED_CANDIDATES ≠ NO_CANDIDATES_FOUND.
 */
export const FALLBACK_STATUS_META = Object.freeze({
  NO_CANDIDATES_FOUND: {
    severity: 4,
    label: 'No law candidate found',
    meaning:
      'The comparison process completed, but no candidate law proposition was found.',
    tone: 'grey',
    cta: 'View unmatched guidance'
  },
  ONLY_UNGROUNDED_CANDIDATES: {
    severity: 5,
    label: 'No comparable law found',
    meaning:
      'Candidate law propositions were checked, but none was considered a valid comparison.',
    tone: 'grey',
    cta: 'View pages not based on law'
  },
  NOT_CHECKED: {
    severity: 8,
    label: 'Not yet compared',
    meaning:
      'This guidance proposition has not yet completed the law-comparison process.',
    tone: 'grey',
    cta: null
  },
  PARTIAL: {
    severity: 9,
    label: 'Comparison incomplete',
    meaning:
      'Some comparison processing completed, but the result is not conclusive.',
    tone: 'yellow',
    cta: null
  },
  FAILED: {
    severity: 10,
    label: 'Comparison failed',
    meaning: 'The law-comparison process did not complete successfully.',
    tone: 'red',
    cta: null
  },
  INCONSISTENT_DATA: {
    severity: 11,
    label: 'Comparison unavailable',
    meaning:
      'The comparison data is incomplete or inconsistent and cannot be shown reliably.',
    tone: 'orange',
    cta: null
  }
})
