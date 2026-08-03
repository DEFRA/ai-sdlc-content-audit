/**
 * Guidance-side comparison view-model (no UI).
 *
 * Input separation (do not mix):
 * - `guidance_proposition_law_comparisons` → reportable pair rows
 * - `guidance_proposition_match_summaries` → assessment / coverage / fallback
 * - `proposition_matches` guidance-side top matches → legacy compatibility only
 *   (never appended to comparisons[])
 * - `proposition_matches` with GUIDANCE_MISSING + null guidance id → law-side
 *   gaps only (`extractLawSideMissingGuidance`)
 *
 * Missing pair rows alone do not prove NO_CANDIDATES_FOUND — only the summary.
 *
 * @module create-guidance-comparison-view-model
 */

import {
  ASSESSMENT_STATUS,
  COVERAGE_RESULT,
  FALLBACK_KIND,
  REPORTABLE_RELATIONSHIP_SET
} from './guidance-comparison-constants.js'

import './guidance-comparison-types.js'

const RELATIONSHIP_UNGROUNDED = 'UNGROUNDED'
const RELATIONSHIP_GUIDANCE_MISSING = 'GUIDANCE_MISSING'

/**
 * @param {object} presentation
 * @returns {{
 *   guidanceComparisons: import('./guidance-comparison-types.js').GuidanceComparisonViewModel[],
 *   lawSideMissingGuidance: object[],
 *   diagnostics: string[]
 * }}
 */
export function buildGuidanceComparisonViewModels(presentation) {
  const guidancePropositions = presentation.guidance_propositions ?? []
  const summaries = presentation.guidance_proposition_match_summaries ?? []
  const comparisons = presentation.guidance_proposition_law_comparisons ?? []
  const legislationPropositions = presentation.legislation_propositions ?? []

  const globalDiagnostics = []
  const lawById = new Map(
    legislationPropositions
      .filter((lp) => lp?.id != null)
      .map((lp) => [lp.id, lp])
  )
  const gpById = new Map(
    guidancePropositions.filter((gp) => gp?.id != null).map((gp) => [gp.id, gp])
  )

  const summariesByGpId = groupBy(summaries, (s) => s?.guidance_proposition_id)
  const comparisonsByGpId = groupComparisonsPreservingOrder(comparisons)

  const guidanceComparisons = []
  for (const gp of guidancePropositions) {
    if (gp?.id == null) continue
    guidanceComparisons.push(
      buildOneGuidanceComparison({
        guidanceProposition: gp,
        summaryRows: summariesByGpId.get(gp.id) ?? [],
        comparisonRows: comparisonsByGpId.get(gp.id) ?? [],
        lawById,
        gpById
      })
    )
  }

  // Orphan comparisons (no matching guidance proposition entity).
  for (const [gpId, rows] of comparisonsByGpId) {
    if (gpById.has(gpId)) continue
    globalDiagnostics.push(
      `comparison records reference unknown guidance proposition: ${gpId} (${rows.length} row(s))`
    )
  }

  // Duplicate / missing summary coverage across the guidance set.
  for (const [gpId, rows] of summariesByGpId) {
    if (gpById.has(gpId)) continue
    globalDiagnostics.push(
      `summary references unknown guidance proposition: ${gpId}`
    )
    if (rows.length > 1) {
      globalDiagnostics.push(
        `duplicate summaries for unknown guidance proposition: ${gpId}`
      )
    }
  }

  return {
    guidanceComparisons,
    lawSideMissingGuidance: extractLawSideMissingGuidance(presentation),
    diagnostics: globalDiagnostics
  }
}

/**
 * Synthetic law-side GUIDANCE_MISSING rows from the legacy compatibility file.
 * Not guidance fallbacks; never mixed into guidanceComparisons[].comparisons.
 *
 * @param {object} presentation
 * @returns {object[]}
 */
export function extractLawSideMissingGuidance(presentation) {
  const matches = presentation.proposition_matches ?? []
  return matches.filter(
    (m) =>
      m?.relationship === RELATIONSHIP_GUIDANCE_MISSING &&
      m.guidance_proposition_id == null &&
      m.law_proposition_id != null
  )
}

/**
 * @param {object} params
 * @returns {import('./guidance-comparison-types.js').GuidanceComparisonViewModel}
 */
function buildOneGuidanceComparison({
  guidanceProposition,
  summaryRows,
  comparisonRows,
  lawById,
  gpById
}) {
  const diagnostics = []
  const gpId = guidanceProposition.id

  if (summaryRows.length === 0) {
    diagnostics.push(`missing match summary for guidance proposition ${gpId}`)
    return inconsistentView(guidanceProposition, [], diagnostics)
  }
  if (summaryRows.length > 1) {
    diagnostics.push(
      `duplicate match summaries for guidance proposition ${gpId} (${summaryRows.length})`
    )
    return inconsistentView(guidanceProposition, [], diagnostics)
  }

  const summary = summaryRows[0]
  const assessmentStatus = summary.assessment_status ?? null
  const coverageResult = summary.coverage_result ?? null

  const { pairs, pairDiagnostics } = normaliseComparisonRows(
    comparisonRows,
    lawById,
    gpById,
    gpId
  )
  diagnostics.push(...pairDiagnostics)

  const invariantDiagnostics = validateInvariants({
    gpId,
    assessmentStatus,
    coverageResult,
    summary,
    pairs
  })
  diagnostics.push(...invariantDiagnostics)

  if (diagnostics.length > 0) {
    return {
      guidanceProposition,
      assessmentStatus,
      coverageResult,
      comparisons: pairs,
      fallbackKind: FALLBACK_KIND.INCONSISTENT_DATA,
      diagnostics,
      reportableComparisonCount: summary.reportable_comparison_count ?? null,
      candidateCount: summary.candidate_count ?? null,
      ungroundedCandidateCount: summary.ungrounded_candidate_count ?? null
    }
  }

  return {
    guidanceProposition,
    assessmentStatus,
    coverageResult,
    comparisons: pairs,
    fallbackKind: deriveFallbackKind(assessmentStatus, coverageResult),
    diagnostics,
    reportableComparisonCount: summary.reportable_comparison_count ?? null,
    candidateCount: summary.candidate_count ?? null,
    ungroundedCandidateCount: summary.ungrounded_candidate_count ?? null
  }
}

function deriveFallbackKind(assessmentStatus, coverageResult) {
  if (assessmentStatus === ASSESSMENT_STATUS.NOT_CHECKED) {
    return FALLBACK_KIND.NOT_CHECKED
  }
  if (assessmentStatus === ASSESSMENT_STATUS.PARTIAL) {
    return FALLBACK_KIND.PARTIAL
  }
  if (assessmentStatus === ASSESSMENT_STATUS.FAILED) {
    return FALLBACK_KIND.FAILED
  }
  if (assessmentStatus === ASSESSMENT_STATUS.COMPLETE) {
    if (coverageResult === COVERAGE_RESULT.HAS_REPORTABLE_COMPARISON) {
      return FALLBACK_KIND.NONE
    }
    if (coverageResult === COVERAGE_RESULT.NO_CANDIDATES_FOUND) {
      return FALLBACK_KIND.NO_CANDIDATES_FOUND
    }
    if (coverageResult === COVERAGE_RESULT.ONLY_UNGROUNDED_CANDIDATES) {
      return FALLBACK_KIND.ONLY_UNGROUNDED_CANDIDATES
    }
    return FALLBACK_KIND.INCONSISTENT_DATA
  }
  return FALLBACK_KIND.INCONSISTENT_DATA
}

function validateInvariants({
  gpId,
  assessmentStatus,
  coverageResult,
  summary,
  pairs
}) {
  const diagnostics = []

  if (
    assessmentStatus === ASSESSMENT_STATUS.COMPLETE &&
    coverageResult === COVERAGE_RESULT.HAS_REPORTABLE_COMPARISON
  ) {
    const expected = summary.reportable_comparison_count
    if (expected !== pairs.length) {
      diagnostics.push(
        `reportable comparison count mismatch for ${gpId}: summary=${expected} assembled=${pairs.length}`
      )
    }
    if (pairs.length < 1) {
      diagnostics.push(
        `COMPLETE + HAS_REPORTABLE_COMPARISON requires at least one comparison for ${gpId}`
      )
    }
  }

  if (
    assessmentStatus === ASSESSMENT_STATUS.COMPLETE &&
    (coverageResult === COVERAGE_RESULT.NO_CANDIDATES_FOUND ||
      coverageResult === COVERAGE_RESULT.ONLY_UNGROUNDED_CANDIDATES) &&
    pairs.length > 0
  ) {
    diagnostics.push(
      `fallback coverage ${coverageResult} must not have reportable comparison rows for ${gpId}`
    )
  }

  return diagnostics
}

function normaliseComparisonRows(comparisonRows, lawById, gpById, gpId) {
  const diagnostics = []
  const seenPairKeys = new Set()
  /** @type {import('./guidance-comparison-types.js').GuidanceComparisonPairView[]} */
  const pairs = []

  for (const row of comparisonRows) {
    if (row?.guidance_proposition_id !== gpId) {
      diagnostics.push(`comparison ${row?.id} guidance id mismatch for ${gpId}`)
      continue
    }

    const relationship = row.relationship
    if (relationship === RELATIONSHIP_UNGROUNDED) {
      diagnostics.push(
        `UNGROUNDED must not appear in guidance-proposition-law-comparisons (${row.id})`
      )
      continue
    }
    if (!REPORTABLE_RELATIONSHIP_SET.has(relationship)) {
      diagnostics.push(
        `non-reportable relationship ${String(relationship)} in comparison ${row.id}`
      )
      continue
    }

    const lawId = row.law_proposition_id
    if (lawId == null) {
      diagnostics.push(`comparison ${row.id} missing law_proposition_id`)
      continue
    }

    const pairKey = `${gpId}\0${lawId}`
    if (seenPairKeys.has(pairKey)) {
      diagnostics.push(
        `duplicate comparison pair (${gpId}, ${lawId}); keeping first`
      )
      continue
    }
    seenPairKeys.add(pairKey)

    if (!gpById.has(gpId)) {
      diagnostics.push(
        `comparison ${row.id} references unknown guidance ${gpId}`
      )
    }

    const lawProposition = lawById.get(lawId) ?? null
    if (lawProposition == null) {
      diagnostics.push(
        `comparison ${row.id} references unknown law proposition ${lawId}`
      )
    }

    pairs.push({
      id: row.id,
      relationship,
      confidence: row.confidence ?? null,
      cosineScore:
        row.cosine_score === undefined || row.cosine_score === null
          ? null
          : row.cosine_score,
      bertScoreF1:
        row.bert_score_f1 === undefined || row.bert_score_f1 === null
          ? null
          : row.bert_score_f1,
      explanation: row.explanation ?? null,
      lawProposition
    })
  }

  return { pairs, pairDiagnostics: diagnostics }
}

function inconsistentView(guidanceProposition, comparisons, diagnostics) {
  return {
    guidanceProposition,
    assessmentStatus: null,
    coverageResult: null,
    comparisons,
    fallbackKind: FALLBACK_KIND.INCONSISTENT_DATA,
    diagnostics,
    reportableComparisonCount: null,
    candidateCount: null,
    ungroundedCandidateCount: null
  }
}

function groupBy(rows, keyFn) {
  const map = new Map()
  for (const row of rows) {
    const key = keyFn(row)
    if (key == null) continue
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(row)
  }
  return map
}

/** Preserve backend file order when grouping by guidance id. */
function groupComparisonsPreservingOrder(comparisons) {
  const map = new Map()
  for (const row of comparisons) {
    const gpId = row?.guidance_proposition_id
    if (gpId == null) continue
    if (!map.has(gpId)) map.set(gpId, [])
    map.get(gpId).push(row)
  }
  return map
}
