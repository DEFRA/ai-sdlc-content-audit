/**
 * Page-detail statement rows from the guidance-comparison view-model.
 *
 * Pair rows = pair-level legal comparison outcomes (from comparisons[]).
 * Fallback rows = proposition-level assessment / coverage / processing state
 * (from fallbackKind). NOT_CHECKED, PARTIAL, FAILED and INCONSISTENT_DATA are
 * processing states, not legal conclusions. ONLY_UNGROUNDED_CANDIDATES differs
 * from NO_CANDIDATES_FOUND. Synthetic law-side GUIDANCE_MISSING is not built
 * here — it stays on the missingLaws path.
 */

import { STATUS_META } from './constants.js'
import {
  FALLBACK_KIND,
  FALLBACK_STATUS_META
} from './guidance-comparison-constants.js'

const STATEMENT_META = { ...STATUS_META, ...FALLBACK_STATUS_META }

/**
 * @param {object} params
 * @param {string} params.categoryId
 * @param {string} params.pageId
 * @param {import('./guidance-comparison-types.js').GuidanceComparisonViewModel[]} params.guidanceComparisons
 * @param {(categoryId: string, sourceRecordId: string) => object|null} params.legislationForCategory
 * @returns {object[]}
 */
export function buildStatementsFromGuidanceComparisons({
  categoryId,
  pageId,
  guidanceComparisons,
  legislationForCategory
}) {
  const scoped = guidanceComparisons.filter((vm) => {
    const gp = vm.guidanceProposition
    if (gp == null) return false
    if (gp.content_id !== pageId) return false
    if (gp.category != null && gp.category !== categoryId) return false
    return true
  })

  /** @type {object[]} */
  const statements = []
  let order = 0

  for (const vm of scoped) {
    if (vm.fallbackKind === FALLBACK_KIND.NONE) {
      for (const comparison of vm.comparisons) {
        statements.push(
          buildComparisonStatement({
            categoryId,
            guidanceProposition: vm.guidanceProposition,
            comparison,
            legislationForCategory,
            order: order++
          })
        )
      }
      continue
    }

    statements.push(
      buildFallbackStatement({
        guidanceProposition: vm.guidanceProposition,
        fallbackKind: vm.fallbackKind,
        order: order++
      })
    )
  }

  return statements
}

function buildComparisonStatement({
  categoryId,
  guidanceProposition,
  comparison,
  legislationForCategory,
  order
}) {
  const status = comparison.relationship
  const meta = STATEMENT_META[status]
  if (meta == null) {
    throw new Error(
      `Unknown comparison relationship for page detail: ${status}`
    )
  }

  const lawProposition = comparison.lawProposition
  let lawName = null
  let lawUrl = null
  const lawText = lawProposition?.proposition_text ?? null

  if (lawProposition?.source_record_id != null) {
    const law = legislationForCategory(
      categoryId,
      lawProposition.source_record_id
    )
    lawName = law?.name ?? null
    lawUrl = law?.url ?? null
  }

  const accessibleName = lawText
    ? `${meta.label}: ${guidanceProposition.proposition_text} — ${lawText}`
    : `${meta.label}: ${guidanceProposition.proposition_text}`

  return {
    id: comparison.id,
    status,
    guidanceText: guidanceProposition.proposition_text,
    statusLabel: meta.label,
    statusMeaning: meta.meaning,
    statusTone: meta.tone,
    severity: meta.severity,
    lawName,
    lawUrl,
    lawText,
    explanation: comparison.explanation ?? null,
    confidence: comparison.confidence ?? null,
    feedbackEnabled: true,
    rowKind: 'comparison',
    accessibleName,
    order
  }
}

function buildFallbackStatement({ guidanceProposition, fallbackKind, order }) {
  const meta = FALLBACK_STATUS_META[fallbackKind]
  if (meta == null) {
    throw new Error(`Unknown fallbackKind for page detail: ${fallbackKind}`)
  }

  const accessibleName = `${meta.label}: ${guidanceProposition.proposition_text}`

  return {
    id: `fb-${guidanceProposition.id}-${fallbackKind}`,
    status: fallbackKind,
    guidanceText: guidanceProposition.proposition_text,
    statusLabel: meta.label,
    statusMeaning: meta.meaning,
    statusTone: meta.tone,
    severity: meta.severity,
    lawName: null,
    lawUrl: null,
    lawText: null,
    explanation: null,
    confidence: null,
    feedbackEnabled: false,
    rowKind: 'fallback',
    accessibleName,
    order
  }
}

export function statementStatusMeta(status) {
  return STATEMENT_META[status] ?? null
}
