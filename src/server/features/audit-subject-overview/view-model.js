import { auditService } from '../../services/audit/service.js'
import { STATUS_ORDER, STATUS_META } from '../../services/audit/constants.js'

// Severity 1 (CONFLICTS) is worst, 6 (GROUNDED) is best.
// Map each status to a "credit" toward the overall guidance score.
const SCORE_CREDIT = {
  GROUNDED: 1,
  GUIDANCE_BROADER: 0.9,
  GUIDANCE_INCOMPLETE: 0.4,
  UNGROUNDED: 0.2,
  GUIDANCE_MISSING: 0,
  CONFLICTS: 0
}

function computeGuidanceScore(statusCounts) {
  let total = 0
  let credit = 0
  for (const status of STATUS_ORDER) {
    const count = statusCounts[status] ?? 0
    total += count
    credit += count * (SCORE_CREDIT[status] ?? 0)
  }
  if (total === 0) return null
  return Math.round((credit / total) * 100)
}

function scoreBand(score) {
  if (score == null) return { label: 'No data', colour: 'grey' }
  if (score >= 75) return { label: 'Good', colour: 'green' }
  if (score >= 50) return { label: 'Mixed', colour: 'yellow' }
  if (score >= 25) return { label: 'Poor', colour: 'orange' }
  return { label: 'Very poor', colour: 'red' }
}

export const auditSubjectOverviewViewModel = {
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

    const guidanceScore = computeGuidanceScore(overview.statusCounts)
    const band = scoreBand(guidanceScore)

    return {
      pageTitle: category.title,
      category,
      initialSearchTerm: category.title,
      expandedDescription: category.description,
      lawsFound: overview.lawsFound,
      lawsHref,
      totalPagesAudited: overview.totalPagesAudited,
      pagesRelevant: overview.pagesRelevant,
      breakdownBoxes,
      pagesHref: `/audit/subjects/${category.id}/pages`,
      hasRelevantPages: overview.pagesRelevant > 0,
      guidanceScore,
      guidanceScoreDisplay: guidanceScore == null ? '—' : `${guidanceScore}%`,
      guidanceScoreBand: band
    }
  }
}
