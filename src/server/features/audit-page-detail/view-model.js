import { auditService } from '../../services/audit/service.js'

function pct(value) {
  if (value == null) return '—'
  return `${Math.round(value * 100)}%`
}

export const auditPageDetailViewModel = {
  get(categoryId, pageId) {
    const category = auditService.getCategory(categoryId)
    if (!category) return null

    const detail = auditService.getPageDetail(pageId)
    if (!detail) return null

    return {
      pageTitle: detail.page.title,
      category,
      page: detail.page,
      correctness: pct(detail.correctness),
      completeness: pct(detail.completeness),
      statements: detail.statements,
      missingLaws: detail.missingLaws,
      hasStatements: detail.statements.length > 0,
      hasMissingLaws: detail.missingLaws.length > 0,
      backHref: `/audit/subjects/${categoryId}/pages`
    }
  }
}
