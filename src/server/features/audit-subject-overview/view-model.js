import { auditService } from '../../services/audit/service.js'

function pct(v) {
  if (v == null) return 'Not available'
  return `${Math.round(v * 100)}%`
}

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
    correctness: pct(r.correctness),
    correctnessRaw: r.correctness ?? -1,
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

export const auditSubjectOverviewViewModel = {
  get(categoryId) {
    const overview = auditService.getSubjectOverview(categoryId)
    if (!overview) return null

    const { category } = overview
    const lawsHref = `/audit/subjects/${category.id}/laws`

    return {
      pageTitle: category.title,
      category,
      initialSearchTerm: category.title,
      expandedDescription: category.description,
      lawsFound: overview.lawsFound,
      lawsHref,
      totalPagesAudited: overview.totalPagesAudited,
      pagesInCategory: overview.pagesInCategory,
      pagesHref: `/audit/subjects/${category.id}/pages`,
      propositionsHref: `/audit/subjects/${category.id}/propositions`,
      hasPagesInCategory: overview.pagesInCategory > 0,
      improvementDashboard: buildImprovementDashboard(category.id)
    }
  }
}
