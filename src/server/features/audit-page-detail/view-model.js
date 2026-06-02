import { auditService } from '../../services/audit/service.js'
import { propositionFeedbackWidget } from '../proposition-feedback/view-model.js'

function pct(value) {
  if (value == null) return '—'
  return `${Math.round(value * 100)}%`
}

export const auditPageDetailViewModel = {
  get(categoryId, pageId, query = {}) {
    const category = auditService.getCategory(categoryId)
    if (!category) return null

    const detail = auditService.getPageDetail(pageId)
    if (!detail) return null

    const submittedMatchId =
      query.feedback === 'success' && query.matchId != null
        ? Number(query.matchId)
        : null

    return {
      pageTitle: detail.page.title,
      category,
      page: detail.page,
      categoryId,
      pageId,
      correctness: pct(detail.correctness),
      completeness: pct(detail.completeness),
      statements: detail.statements,
      missingLaws: detail.missingLaws,
      hasStatements: detail.statements.length > 0,
      hasMissingLaws: detail.missingLaws.length > 0,
      backHref: `/audit/subjects/${categoryId}/pages`,
      feedbackWidget: propositionFeedbackWidget,
      submittedMatchId
    }
  }
}
