import { auditService } from '../../services/audit/service.js'
import {
  LAW_TO_GUIDANCE_COLUMNS,
  LAW_TO_GUIDANCE_FILTER_STATUSES,
  STATEMENT_STATUS_META
} from '../../services/audit/constants.js'

const VIEW_CONTENT_REVIEW = 'content-review'
const VIEW_LAW_TO_GUIDANCE = 'law-to-guidance'

/** Default Law to Guidance sort: remediation categories first, then title. */
const LAW_TO_GUIDANCE_DEFAULT_SORT = Object.freeze([
  { key: 'CONFLICTS', direction: 'desc' },
  { key: 'GUIDANCE_BROADER', direction: 'desc' },
  { key: 'GUIDANCE_INCOMPLETE', direction: 'desc' },
  { key: 'ONLY_UNGROUNDED_CANDIDATES', direction: 'desc' },
  { key: 'NO_CANDIDATES_FOUND', direction: 'desc' },
  { key: 'title', direction: 'asc' }
])

function formatNumber(n) {
  if (n == null) return 'Not available'
  return n.toLocaleString('en-GB')
}

function relevanceDisplay(v) {
  if (v == null) return 'Not available'
  return v.toFixed(3)
}

function buildImprovementDashboard(categoryId) {
  const rows = auditService.getDashboardPages(categoryId).map((r) => ({
    title: r.title,
    url: r.url,
    detailHref: `/audit/subjects/${r.categoryId}/pages/${r.id}`,
    relevance: relevanceDisplay(r.relevanceScore),
    relevanceRaw: r.relevanceScore ?? -1,
    conflicts: r.conflictsCount,
    lastUpdated: r.lastUpdated ?? 'Not available',
    lastUpdatedRaw: r.lastUpdated ?? '',
    views: formatNumber(r.views),
    viewsRaw: r.views ?? -1,
    readingAge: formatNumber(r.readingAge),
    readingAgeRaw: r.readingAge ?? -1,
    wordCount: formatNumber(r.wordCount),
    wordCountRaw: r.wordCount ?? -1
  }))

  return {
    totalCount: rows.length,
    tableRows: rows,
    hasResults: rows.length > 0
  }
}

/**
 * @param {object} a
 * @param {object} b
 * @returns {number}
 */
export function compareLawToGuidanceRows(a, b) {
  for (const { key, direction } of LAW_TO_GUIDANCE_DEFAULT_SORT) {
    const av = a[key]
    const bv = b[key]
    if (av === bv) continue
    if (typeof av === 'string' || typeof bv === 'string') {
      const cmp = String(av ?? '').localeCompare(String(bv ?? ''), 'en-GB')
      return direction === 'asc' ? cmp : -cmp
    }
    if (av < bv) return direction === 'asc' ? -1 : 1
    if (av > bv) return direction === 'asc' ? 1 : -1
  }
  return 0
}

/**
 * @param {string} categoryId
 * @param {string|null} statusFilter
 */
function buildLawToGuidanceDashboard(categoryId, statusFilter) {
  const rows = auditService.getLawToGuidancePages(categoryId, statusFilter)
  if (rows == null) {
    return {
      available: false,
      hasResults: false,
      tableRows: [],
      columns: LAW_TO_GUIDANCE_COLUMNS,
      filterOptions: [],
      activeOption: null,
      clearFilterHref: null,
      emptyMessage:
        'Legal comparison summaries are not available for this category.'
    }
  }

  const baseHref = `/audit/subjects/${categoryId}`
  const viewQuery = `view=${VIEW_LAW_TO_GUIDANCE}`

  const sorted = [...rows].sort(compareLawToGuidanceRows)

  const tableRows = sorted.map((r) => {
    const pageHref = `/audit/subjects/${categoryId}/pages/${r.id}`
    const counts = {}
    for (const column of LAW_TO_GUIDANCE_COLUMNS) {
      const value = r[column.key] ?? 0
      const countHref =
        column.kind !== 'total' && value > 0
          ? `${pageHref}?status=${column.key}`
          : null
      counts[column.key] = { value, countHref }
    }
    return {
      id: r.id,
      title: r.title,
      url: r.url,
      detailHref: pageHref,
      counts,
      // Raw numeric fields for client sort (data-sort-value).
      ...Object.fromEntries(
        LAW_TO_GUIDANCE_COLUMNS.map((c) => [c.key, r[c.key] ?? 0])
      )
    }
  })

  const filterOptions = [
    {
      key: null,
      label: 'All pages',
      tone: null,
      href: `${baseHref}?${viewQuery}`,
      active: !statusFilter
    },
    ...LAW_TO_GUIDANCE_FILTER_STATUSES.map((status) => ({
      key: status,
      label: STATEMENT_STATUS_META[status].label,
      tone: STATEMENT_STATUS_META[status].tone,
      href: `${baseHref}?${viewQuery}&status=${status}`,
      active: statusFilter === status
    }))
  ]

  const activeOption = statusFilter
    ? filterOptions.find((o) => o.key === statusFilter)
    : null

  return {
    available: true,
    hasResults: tableRows.length > 0,
    tableRows,
    columns: LAW_TO_GUIDANCE_COLUMNS,
    filterOptions,
    activeOption,
    clearFilterHref: `${baseHref}?${viewQuery}`,
    emptyMessage: 'No guidance pages are available for review.'
  }
}

function resolveView(viewParam, statusFilter) {
  if (viewParam === VIEW_LAW_TO_GUIDANCE || statusFilter) {
    return VIEW_LAW_TO_GUIDANCE
  }
  if (viewParam === VIEW_CONTENT_REVIEW) {
    return VIEW_CONTENT_REVIEW
  }
  return VIEW_CONTENT_REVIEW
}

export const auditSubjectOverviewViewModel = {
  /**
   * @param {string} categoryId
   * @param {{ view?: string|null, status?: string|null }} [query]
   */
  get(categoryId, query = {}) {
    const overview = auditService.getSubjectOverview(categoryId)
    if (!overview) return null

    const { category } = overview
    const lawsHref = `/audit/subjects/${category.id}/laws`
    const statusFilter = query.status ?? null
    const activeView = resolveView(query.view ?? null, statusFilter)
    const pairsCsv = auditService.getPairsCsv(category.id)

    return {
      pageTitle: category.title,
      category,
      initialSearchTerm: category.title,
      expandedDescription: category.description,
      lawsFound: overview.lawsFound,
      lawsHref,
      totalPagesAudited: formatNumber(overview.totalPagesAudited),
      pagesInCategory: formatNumber(overview.pagesInCategory),
      pagesHref: `/audit/subjects/${category.id}/pages`,
      propositionsHref: `/audit/subjects/${category.id}/propositions`,
      pairsCsvHref: pairsCsv
        ? `/audit/subjects/${category.id}/pairs.csv`
        : null,
      hasPagesInCategory: overview.pagesInCategory > 0,
      usesGuidanceComparisonContract:
        overview.usesGuidanceComparisonContract === true,
      activeView,
      contentReviewViewHref: `/audit/subjects/${category.id}?view=${VIEW_CONTENT_REVIEW}`,
      lawToGuidanceViewHref: `/audit/subjects/${category.id}?view=${VIEW_LAW_TO_GUIDANCE}`,
      improvementDashboard: buildImprovementDashboard(category.id),
      lawToGuidanceDashboard: buildLawToGuidanceDashboard(
        category.id,
        statusFilter
      )
    }
  },

  /**
   * @param {string} categoryId
   * @returns {{ path: string, filename: string } | null}
   */
  getPairsCsv(categoryId) {
    return auditService.getPairsCsv(categoryId)
  }
}
