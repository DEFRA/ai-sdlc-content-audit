import { auditService } from '../../services/audit/service.js'
import { STATEMENT_STATUS_META } from '../../services/audit/constants.js'

export const auditPropositionsOverviewViewModel = {
  get(categoryId) {
    const overview = auditService.getSubjectOverview(categoryId)
    if (!overview) return null

    const { category } = overview
    const lawsHref = `/audit/subjects/${category.id}/laws`
    const statusOrder =
      overview.overviewStatusOrder ?? Object.keys(overview.statusCounts ?? {})

    const breakdownBoxes = statusOrder.map((status) => {
      const meta = STATEMENT_STATUS_META[status]
      const count = overview.statusCounts[status] ?? 0
      let href = null
      if (count > 0) {
        href =
          status === 'GUIDANCE_MISSING'
            ? lawsHref
            : `/audit/subjects/${category.id}/pages?status=${status}`
      }

      // Units in spread text:
      // - GUIDANCE_MISSING: law-proposition rows across distinct law instruments
      // - other statuses: distinct guidance propositions across distinct pages
      let spread
      if (status === 'GUIDANCE_MISSING') {
        const laws = overview.lawsMissingGuidance
        spread = `We found ${count} propositions across ${laws} ${laws === 1 ? 'law' : 'laws'}`
      } else {
        const pages = overview.pagesByStatus[status] ?? 0
        spread = `We found ${count} propositions across ${pages} ${pages === 1 ? 'page' : 'pages'}`
      }

      const accessibleLabel =
        status === 'GUIDANCE_MISSING'
          ? `${meta.label}: ${count} law propositions without guidance`
          : `${meta.label}: ${count} guidance propositions`

      return {
        status,
        title: meta.label,
        meaning: meta.meaning,
        tone: meta.tone,
        cta: meta.cta,
        count,
        spread,
        href,
        accessibleLabel
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
