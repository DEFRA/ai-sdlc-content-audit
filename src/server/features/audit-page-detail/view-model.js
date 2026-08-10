import { PAGE_FILTER_STATUSES } from '../../services/audit/constants.js'
import { auditService } from '../../services/audit/service.js'
import { presentGuidanceRow } from './present-guidance-row.js'
import {
  buildGuidanceCountText,
  guidanceRowMatchesAggregateOutcomes,
  parseAggregateOutcomeFilters,
  presentPageSummaryAndFilters
} from './present-page-summary.js'

export { presentGuidanceAggregateOutcome } from './present-guidance-row.js'
export {
  countGuidanceRowsByAggregateOutcome,
  parseAggregateOutcomeFilters,
  guidanceRowMatchesAggregateOutcomes
} from './present-page-summary.js'

const PAGE_FILTER_STATUS_SET = new Set(PAGE_FILTER_STATUSES)

export const auditPageDetailViewModel = {
  async get(categoryId, pageId, query = {}) {
    const category = auditService.getCategory(categoryId)
    if (!category) return null

    const detail = auditService.getPageDetail(categoryId, pageId)
    if (!detail) return null

    // Preserved only for pages-list / pairs navigation context. Aggregate
    // filtering uses `outcome=` and does not apply pair-relationship filters.
    const listStatusFilter =
      typeof query.status === 'string' &&
      PAGE_FILTER_STATUS_SET.has(query.status)
        ? query.status
        : null

    const allRows = auditService.getPageGuidanceRows(categoryId, pageId, null)
    if (!allRows) return null

    const selectedOutcomes = parseAggregateOutcomeFilters(query)
    const pageBaseHref = `/audit/subjects/${categoryId}/pages/${pageId}`

    const { summary, filters } = presentPageSummaryAndFilters({
      allRows,
      selectedOutcomes,
      pageBaseHref
    })

    const visibleRows = allRows.filter((row) =>
      guidanceRowMatchesAggregateOutcomes(row, selectedOutcomes)
    )

    const guidanceRows = visibleRows.map((row, index) =>
      presentGuidanceRow(row, { statementNumber: index + 1 })
    )

    const totalGuidanceCount = summary.totalGuidanceCount
    const visibleGuidanceCount = guidanceRows.length
    const hasActiveFilters = filters.active

    const pairsHref = listStatusFilter
      ? `${pageBaseHref}/pairs?status=${listStatusFilter}`
      : `${pageBaseHref}/pairs`

    const pagesListHref = listStatusFilter
      ? `/audit/subjects/${categoryId}/pages?status=${listStatusFilter}`
      : `/audit/subjects/${categoryId}/pages`

    return {
      pageTitle: detail.page.title,
      category,
      page: detail.page,
      categoryId,
      pageId,
      guidanceRows,
      hasGuidanceRows: guidanceRows.length > 0,
      hasGuidanceData: totalGuidanceCount > 0,
      hasFilteredResults: guidanceRows.length > 0,
      backHref: pagesListHref,
      pairsHref,
      summary,
      filters,
      totalGuidanceCount,
      visibleGuidanceCount,
      visibleCountText: buildGuidanceCountText(
        totalGuidanceCount,
        visibleGuidanceCount,
        hasActiveFilters
      ),
      statusFilter: listStatusFilter
    }
  }
}
