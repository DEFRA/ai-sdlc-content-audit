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
      pageTitle: 'Choose a category to audit',
      heading: 'Choose a category to audit',
      intro:
        'Pick one of the categories we have already checked. We will show you the laws we found and how well our guidance pages explain them.',
      categories,
      hasCategories: categories.length > 0
    }
  }
}
