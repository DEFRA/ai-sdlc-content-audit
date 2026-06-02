import { auditService } from '../../services/audit/service.js'

function pct(value) {
  if (value == null) return '—'
  return `${Math.round(value * 100)}%`
}

function coverageTag(coverage) {
  if (coverage >= 0.8) return { text: 'Well covered', colour: 'green' }
  if (coverage >= 0.5) return { text: 'Partly covered', colour: 'yellow' }
  if (coverage > 0) return { text: 'Poorly covered', colour: 'orange' }
  return { text: 'Not covered', colour: 'red' }
}

export const auditLawsListViewModel = {
  get(categoryId) {
    const category = auditService.getCategory(categoryId)
    if (!category) return null

    const laws = auditService.getLawsForSubject()

    const rows = laws
      .map((law) => ({
        name: law.name,
        url: law.url,
        propositionCount: law.propositionCount,
        propositionsWithGuidance: law.propositionsWithGuidance,
        coverage: pct(law.coverage),
        coverageRaw: law.coverage,
        coverageTag: coverageTag(law.coverage),
        conflictsCount: law.conflictsCount
      }))
      .sort((a, b) => a.coverageRaw - b.coverageRaw)

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
