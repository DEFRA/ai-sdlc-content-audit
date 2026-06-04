import { auditService } from '../../services/audit/service.js'

export const auditSubjectSelectViewModel = {
  get() {
    const categories = auditService.getAllCategories().map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      href: `/audit/subjects/${c.id}`
    }))

    return {
      pageTitle: 'DEFRA guidance audit',
      heading: 'DEFRA guidance audit',
      intro:
        'We have checked GOV.UK guidance against the underlying legislation for the categories below. Pick a category to see what we found.',
      categories,
      hasCategories: categories.length > 0
    }
  }
}
