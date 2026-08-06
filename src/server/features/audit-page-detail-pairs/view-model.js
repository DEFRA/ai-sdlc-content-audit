import {
  PAGE_FILTER_STATUSES,
  STATEMENT_STATUS_META
} from '../../services/audit/constants.js'
import { auditService } from '../../services/audit/service.js'
import { DISPLAYED_STATUSES } from '../../services/feedback/constants.js'

const STATUS_RANK = new Map(
  DISPLAYED_STATUSES.map((status, index) => [status, index])
)

const PAGE_FILTER_STATUS_SET = new Set(PAGE_FILTER_STATUSES)

function sortByEmissionOrder(a, b) {
  return (a.order ?? 0) - (b.order ?? 0)
}

export const auditPageDetailPairsViewModel = {
  async get(categoryId, pageId, query = {}) {
    const category = auditService.getCategory(categoryId)
    if (!category) return null

    const detail = auditService.getPageDetail(categoryId, pageId)
    if (!detail) return null

    const allDisplayed = detail.statements.filter((s) =>
      STATUS_RANK.has(s.status)
    )

    const statusCounts = {}
    for (const status of DISPLAYED_STATUSES) statusCounts[status] = 0
    for (const s of allDisplayed) {
      statusCounts[s.status] += 1
    }

    const pageBaseHref = `/audit/subjects/${categoryId}/pages/${pageId}`
    const pairsBaseHref = `${pageBaseHref}/pairs`

    const listStatusFilter =
      typeof query.status === 'string' &&
      PAGE_FILTER_STATUS_SET.has(query.status)
        ? query.status
        : null
    const statusFilter = STATUS_RANK.has(listStatusFilter)
      ? listStatusFilter
      : null

    const filterOptions = [
      {
        key: null,
        label: 'All matches',
        tone: null,
        count: null,
        href: pairsBaseHref,
        active: !statusFilter
      },
      ...DISPLAYED_STATUSES.filter((status) => statusCounts[status] > 0).map(
        (status) => ({
          key: status,
          label: STATEMENT_STATUS_META[status].label,
          tone: STATEMENT_STATUS_META[status].tone,
          count: statusCounts[status],
          href: `${pairsBaseHref}?status=${status}`,
          active: statusFilter === status
        })
      )
    ]

    const activeOption = statusFilter
      ? filterOptions.find((o) => o.key === statusFilter)
      : null

    const statements = (
      statusFilter
        ? allDisplayed.filter((s) => s.status === statusFilter)
        : allDisplayed
    )
      .slice()
      .map((s) => ({
        ...s,
        dimmed: false
      }))
    statements.sort(sortByEmissionOrder)

    const pagesListHref = listStatusFilter
      ? `/audit/subjects/${categoryId}/pages?status=${listStatusFilter}`
      : `/audit/subjects/${categoryId}/pages`

    const aggregatedHref = statusFilter
      ? `${pageBaseHref}?status=${statusFilter}`
      : pageBaseHref

    return {
      pageTitle: `${detail.page.title} — by match`,
      category,
      page: detail.page,
      categoryId,
      pageId,
      statements,
      hasStatements: statements.length > 0,
      backHref: pagesListHref,
      clearFilterHref: pairsBaseHref,
      aggregatedHref,
      filterOptions,
      activeOption,
      statusFilter: listStatusFilter
    }
  }
}
