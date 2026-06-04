import { auditService } from '../../services/audit/service.js'

export const auditLawsListViewModel = {
  get(categoryId) {
    const category = auditService.getCategory(categoryId)
    if (!category) return null

    const rows = auditService
      .getLawsForSubject(categoryId)
      .map((law) => ({
        name: law.name,
        url: law.url,
        propositionCount: law.propositionCount,
        propositionsWithGuidance: law.propositionsWithGuidance,
        conflictsCount: law.conflictsCount
      }))
      .sort((a, b) => a.name.localeCompare(b.name))

    return {
      pageTitle: `Laws about ${category.title}`,
      heading: `Laws about ${category.title}`,
      category,
      backHref: `/audit/subjects/${categoryId}`,
      rows,
      hasResults: rows.length > 0
    }
  }
}
