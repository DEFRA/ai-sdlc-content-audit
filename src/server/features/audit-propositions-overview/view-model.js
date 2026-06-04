import { auditService } from '../../services/audit/service.js'
import { STATUS_ORDER, STATUS_META } from '../../services/audit/constants.js'

export const auditPropositionsOverviewViewModel = {
  get(categoryId) {
    const overview = auditService.getSubjectOverview(categoryId)
    if (!overview) return null

    const { category } = overview
    const lawsHref = `/audit/subjects/${category.id}/laws`

    const breakdownBoxes = STATUS_ORDER.map((status) => {
      const meta = STATUS_META[status]
      const count = overview.statusCounts[status] ?? 0
      let href = null
      if (count > 0) {
        href =
          status === 'GUIDANCE_MISSING'
            ? lawsHref
            : `/audit/subjects/${category.id}/pages?status=${status}`
      }

      let spread
      if (status === 'GUIDANCE_MISSING') {
        const laws = overview.lawsMissingGuidance
        spread = `We found ${count} propositions across ${laws} ${laws === 1 ? 'law' : 'laws'}`
      } else {
        const pages = overview.pagesByStatus[status] ?? 0
        spread = `We found ${count} propositions across ${pages} ${pages === 1 ? 'page' : 'pages'}`
      }

      return {
        status,
        title: meta.label,
        meaning: meta.meaning,
        tone: meta.tone,
        cta: meta.cta,
        count,
        spread,
        href
      }
    })

    return {
      pageTitle: `${category.title} — all propositions`,
      category,
      breakdownBoxes,
      pagesHref: `/audit/subjects/${category.id}/pages`,
      hasPagesInCategory: overview.pagesInCategory > 0
    }
  }
}
