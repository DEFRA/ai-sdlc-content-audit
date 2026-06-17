export const FEEDBACK_HASH_KEY = 'feedback:propositions'

export const FEEDBACK_CHOICES = {
  INTERESTED: { label: 'I am interested in this' },
  NOT_INTERESTED: { label: 'I am not interested in this' },
  AI_MISTAKE: { label: 'This is a mistake in the AI' }
}

export const FEEDBACK_CHOICE_ORDER = [
  'INTERESTED',
  'NOT_INTERESTED',
  'AI_MISTAKE'
]

// Statuses surfaced on the audit page detail. The array order is also the
// display order for both the Pending and Completed sections.
export const DISPLAYED_STATUSES = [
  'CONFLICTS',
  'GUIDANCE_INCOMPLETE',
  'GROUNDED'
]
