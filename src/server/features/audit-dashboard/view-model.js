import { auditService } from '../../services/audit/service.js'

function pct(v) {
  if (v == null) return 'Not available'
  return `${Math.round(v * 100)}%`
}

function formatNumber(n) {
  if (n == null) return 'Not available'
  return n.toLocaleString('en-GB')
}

const CATEGORY_ID = 1

export const auditDashboardViewModel = {
  get() {
    const rows = auditService.getDashboardPages().map((r) => ({
      title: r.title,
      url: r.url,
      detailHref: `/audit/subjects/${CATEGORY_ID}/pages/${r.id}`,
      correctness: pct(r.correctness),
      completeness: pct(r.completeness),
      conflicts: r.conflictsCount,
      lastUpdated: r.lastUpdated ?? 'Not available',
      views: formatNumber(r.views),
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
