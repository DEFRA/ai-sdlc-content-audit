import { auditService } from '../../services/audit/service.js'
import {
  PAGE_FILTER_STATUSES,
  STATUS_META
} from '../../services/audit/constants.js'

export const auditPagesListViewModel = {
  get(categoryId, statusFilter) {
    const category = auditService.getCategory(categoryId)
    if (!category) return null

    const rows = auditService.getRelevantPages(categoryId, statusFilter)

    const tableRows = rows.map((r) => ({
      page: { title: r.title, url: r.url },
      detailHref: statusFilter
        ? `/audit/subjects/${categoryId}/pages/${r.id}?status=${statusFilter}`
        : `/audit/subjects/${categoryId}/pages/${r.id}`,
      conflicts: r.conflictsCount
    }))

    const baseHref = `/audit/subjects/${categoryId}/pages`

    const filterOptions = [
      {
        key: null,
        label: 'All pages',
        tone: null,
        href: baseHref,
        active: !statusFilter
      },
      ...PAGE_FILTER_STATUSES.map((status) => ({
        key: status,
        label: STATUS_META[status].label,
        tone: STATUS_META[status].tone,
        href: `${baseHref}?status=${status}`,
        active: statusFilter === status
      }))
    ]

    const activeOption = statusFilter
      ? filterOptions.find((o) => o.key === statusFilter)
      : null

    return {
      pageTitle: `Guidance pages about ${category.title}`,
      heading: `Guidance pages about ${category.title}`,
      category,
      filterOptions,
      activeOption,
      clearFilterHref: baseHref,
      missingGuidanceHref: `/audit/subjects/${categoryId}/laws`,
      tableRows,
      hasResults: tableRows.length > 0
    }
  }
}
