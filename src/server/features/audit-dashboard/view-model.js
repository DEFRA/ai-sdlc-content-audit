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
  // Already 3dp in source data; render fixed-3dp for visual alignment.
  return v.toFixed(3)
}

export const auditDashboardViewModel = {
  get() {
    const rows = auditService.getDashboardPages().map((r) => ({
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
      suggestedAction: r.suggestedAction
    }))

    return {
      pageTitle: 'Content improvement dashboard',
      heading: 'Content improvement dashboard',
      flaggedCount: rows.length,
      tableRows: rows,
      hasResults: rows.length > 0
    }
  }
}
