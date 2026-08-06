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

import { FALLBACK_KIND } from './guidance-comparison-constants.js'
import {
  buildComparisonStatement,
  buildFallbackStatement,
  scopeGuidanceComparisonsToPage,
  statementStatusMeta
} from './page-detail-statement-builders.js'

export { statementStatusMeta }

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
  const scoped = scopeGuidanceComparisonsToPage(
    guidanceComparisons,
    categoryId,
    pageId
  )

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
