/**
 * Presentation helpers for law-comparison (pair) cards.
 * Keeps enum/fallback copy out of Nunjucks.
 */

import { STATEMENT_STATUS_META } from '../../services/audit/constants.js'

const PAIR_OUTCOME_PREFIX = 'Law comparison outcome'
const ASSESSMENT_FALLBACK =
  'No assessment explanation is available for this comparison.'

/**
 * @param {object} comparison
 * @param {string} comparison.status
 * @param {string} [comparison.statusLabel]
 * @param {string} [comparison.statusTone]
 */
export function presentPairComparisonOutcome(comparison) {
  const meta = STATEMENT_STATUS_META[comparison.status]
  const label = comparison.statusLabel ?? meta?.label ?? comparison.status ?? ''
  const tone = comparison.statusTone ?? meta?.tone ?? 'grey'
  return {
    pairStatusLabel: label,
    pairGovukTagClass: `govuk-tag--${tone}`,
    pairAccessibleLabel: `${PAIR_OUTCOME_PREFIX}: ${label}`
  }
}

/**
 * @param {object} comparison
 * @param {object} [options]
 * @param {number} [options.displayNumber]
 * @param {boolean} [options.showGuidanceText]
 * @param {number} [options.headingLevel]
 * @returns {object}
 */
export function presentComparisonCard(comparison, options = {}) {
  const showGuidanceText = options.showGuidanceText ?? true
  const headingLevel = options.headingLevel ?? 3
  const displayNumber = options.displayNumber ?? (comparison.order ?? 0) + 1
  const pair = presentPairComparisonOutcome(comparison)

  if (comparison.rowKind === 'fallback') {
    return {
      ...comparison,
      ...pair,
      displayNumber,
      heading: comparison.statusLabel ?? pair.pairStatusLabel,
      headingId: `comparison-heading-${comparison.id}`,
      headingLevel,
      showGuidanceText,
      sourceTitle: null,
      sourceLocator: null,
      lawContentLabel: null,
      lawContent: null,
      assessmentHeading: 'Assessment',
      assessmentText: comparison.statusMeaning?.trim() || ASSESSMENT_FALLBACK,
      sourceUrl: null,
      sourceLinkText: null
    }
  }

  const sourceTitle = comparison.lawName ?? null
  const sourceLocator = comparison.sourceLocator ?? null
  const sourceUrl = comparison.lawUrl ?? null
  const explanation = comparison.explanation?.trim() || null

  return {
    ...comparison,
    ...pair,
    displayNumber,
    heading: `Law comparison ${displayNumber}`,
    headingId: `comparison-heading-${comparison.id}`,
    headingLevel,
    showGuidanceText,
    sourceTitle,
    sourceLocator,
    lawContentLabel: comparison.lawText ? 'Legal proposition' : null,
    lawContent: comparison.lawText ?? null,
    assessmentHeading: 'Assessment',
    assessmentText: explanation ?? ASSESSMENT_FALLBACK,
    sourceUrl,
    sourceLinkText: buildSourceLinkText(sourceUrl, sourceLocator)
  }
}

/**
 * @param {string|null} sourceUrl
 * @param {string|null} sourceLocator
 * @returns {string|null}
 */
function buildSourceLinkText(sourceUrl, sourceLocator) {
  if (sourceUrl == null || sourceUrl === '') return null
  const base = sourceLocator
    ? `View ${sourceLocator} in the source legislation`
    : 'View source law'
  // Matches the live-page link convention on this feature.
  return `${base} (opens in new tab)`
}
