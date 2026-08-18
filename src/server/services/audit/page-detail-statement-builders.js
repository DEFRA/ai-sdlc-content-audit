/**
 * Shared statement-card field builders for page-detail pair and aggregated views.
 */

import { STATUS_META } from './constants.js'
import { FALLBACK_STATUS_META } from './guidance-comparison-constants.js'

export const STATEMENT_META = { ...STATUS_META, ...FALLBACK_STATUS_META }

/**
 * @param {object} params
 * @param {string} params.categoryId
 * @param {object} params.guidanceProposition
 * @param {object} params.comparison
 * @param {(categoryId: string, sourceRecordId: string) => object|null} params.legislationForCategory
 * @param {number} params.order
 * @returns {object}
 */
export function buildComparisonStatement({
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
  const sourceLocator =
    lawProposition?.fragment_locator ||
    lawProposition?.label ||
    lawProposition?.short_name ||
    null

  if (lawProposition?.source_record_id != null) {
    const law = legislationForCategory(
      categoryId,
      lawProposition.source_record_id
    )
    lawName = law?.name ?? null
    lawUrl = lawProposition.provision_url ?? law?.url ?? null
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
    lawPropositionId: lawProposition?.id ?? null,
    sourceLocator,
    explanation: comparison.explanation ?? null,
    confidence: comparison.confidence ?? null,
    feedbackEnabled: true,
    rowKind: 'comparison',
    accessibleName,
    order
  }
}

/**
 * @param {object} params
 * @param {object} params.guidanceProposition
 * @param {string} params.fallbackKind
 * @param {number} params.order
 * @returns {object}
 */
export function buildFallbackStatement({
  guidanceProposition,
  fallbackKind,
  order
}) {
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

/**
 * @param {import('./guidance-comparison-types.js').GuidanceComparisonViewModel[]} guidanceComparisons
 * @param {string} categoryId
 * @param {string} pageId
 */
export function scopeGuidanceComparisonsToPage(
  guidanceComparisons,
  categoryId,
  pageId
) {
  return guidanceComparisons.filter((vm) => {
    const gp = vm.guidanceProposition
    if (gp == null) return false
    if (gp.content_id !== pageId) return false
    if (gp.category != null && gp.category !== categoryId) return false
    return true
  })
}
