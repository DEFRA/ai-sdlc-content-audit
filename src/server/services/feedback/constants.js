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

// Statuses surfaced on the audit page detail filter bar and statement list.
// Order is the preferred sort key when statements are ordered by status.
// Includes reportable pair relationships + proposition-level fallback kinds.
// UNGROUNDED is intentionally absent (rejected candidates are not pair rows).
// Synthetic law-side GUIDANCE_MISSING is not a guidance-side statement status.
export const DISPLAYED_STATUSES = [
  'CONFLICTS',
  'GUIDANCE_INCOMPLETE',
  'GUIDANCE_BROADER',
  'GUIDANCE_MISSING',
  'NO_CANDIDATES_FOUND',
  'ONLY_UNGROUNDED_CANDIDATES',
  'NO_MATCH',
  'NOT_CHECKED',
  'PARTIAL',
  'FAILED',
  'INCONSISTENT_DATA',
  'GROUNDED'
]
