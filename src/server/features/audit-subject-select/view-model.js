import { auditService } from '../../services/audit/service.js'

export const auditSubjectSelectViewModel = {
  get(selectedId) {
    const subjects = auditService.getAllCategories().map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description
    }))

    const selectedNumeric = Number(selectedId)
    const selected = Number.isFinite(selectedNumeric)
      ? subjects.find((s) => s.id === selectedNumeric)
      : null

    const options = [
      { value: '', text: 'Choose a subject', selected: !selected },
      ...subjects.map((s) => ({
        value: String(s.id),
        text: s.title,
        selected: selected?.id === s.id
      }))
    ]

    return {
      pageTitle: 'Choose a subject to audit',
      heading: 'Choose a subject to audit',
      intro:
        'Pick one of the subjects we have already checked. We will show you the laws we found and how well our guidance pages explain them.',
      inputLabel: 'Subject',
      inputHint:
        'Only subjects we have already audited are listed here. Pick one to see what we found.',
      buttonText: 'Show what we audited',
      options,
      selected,
      subjectsCount: subjects.length,
      hasSubjects: subjects.length > 0
    }
  }
}
