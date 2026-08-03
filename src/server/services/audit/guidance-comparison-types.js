/**
 * Validated shapes for the new Audit Assembler presentation arrays.
 *
 * Vanilla JS + JSDoc (no Zod). Runtime checks live in
 * `create-guidance-comparison-view-model.js`.
 */

/**
 * One distinct reportable guidance–law pair.
 * Source: `guidance-proposition-law-comparisons.json`
 *
 * @typedef {object} GuidancePropositionLawComparison
 * @property {string} id
 * @property {string} guidance_proposition_id
 * @property {string} law_proposition_id
 * @property {'GROUNDED'|'CONFLICTS'|'GUIDANCE_INCOMPLETE'|'GUIDANCE_BROADER'|'GUIDANCE_MISSING'} relationship
 * @property {string|null|undefined} [confidence]
 * @property {number|null|undefined} [cosine_score]
 * @property {number|null|undefined} [bert_score_f1]
 * @property {string|null|undefined} [explanation]
 * @property {string|undefined} [category]
 */

/**
 * Proposition-level match assessment / coverage.
 * Source: `guidance-proposition-match-summaries.json`
 *
 * @typedef {object} GuidancePropositionMatchSummary
 * @property {string} guidance_proposition_id
 * @property {'NOT_CHECKED'|'COMPLETE'|'PARTIAL'|'FAILED'} assessment_status
 * @property {'HAS_REPORTABLE_COMPARISON'|'ONLY_UNGROUNDED_CANDIDATES'|'NO_CANDIDATES_FOUND'|null} coverage_result
 * @property {number|null|undefined} [candidate_count]
 * @property {number|undefined} [reportable_comparison_count]
 * @property {number|undefined} [ungrounded_candidate_count]
 * @property {string|undefined} [failure_reason]
 * @property {string|undefined} [category]
 */

/**
 * Joined law proposition on a comparison row.
 *
 * @typedef {object} JoinedLawProposition
 * @property {string} id
 * @property {string} proposition_text
 * @property {string|null|undefined} [source_record_id]
 * @property {string|null|undefined} [short_name]
 * @property {string|null|undefined} [label]
 * @property {string|null|undefined} [fragment_locator]
 * @property {string|undefined} [category]
 */

/**
 * One joined reportable comparison in the guidance-side view-model.
 *
 * @typedef {object} GuidanceComparisonPairView
 * @property {string} id
 * @property {string} relationship
 * @property {string|null} confidence
 * @property {number|null} cosineScore
 * @property {number|null} bertScoreF1
 * @property {string|null} explanation
 * @property {JoinedLawProposition|null} lawProposition
 */

/**
 * Sole guidance-side source for the later UI increment.
 *
 * @typedef {object} GuidanceComparisonViewModel
 * @property {object} guidanceProposition
 * @property {string|null} assessmentStatus
 * @property {string|null} coverageResult
 * @property {GuidanceComparisonPairView[]} comparisons
 * @property {import('./guidance-comparison-constants.js').FallbackKind} fallbackKind
 * @property {string[]} diagnostics
 * @property {number|null} reportableComparisonCount
 * @property {number|null} candidateCount
 * @property {number|null} ungroundedCandidateCount
 */

export {}
