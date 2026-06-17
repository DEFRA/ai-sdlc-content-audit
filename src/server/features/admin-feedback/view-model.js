import { format } from 'date-fns'

import { STATUS_META } from '../../services/audit/constants.js'
import { FEEDBACK_CHOICES } from '../../services/feedback/constants.js'
import { feedbackService } from '../../services/feedback/service.js'

function statusLabel(value) {
  if (!value) return null
  return STATUS_META[value]?.label ?? value
}

function choiceLabel(value) {
  if (!value) return null
  return FEEDBACK_CHOICES[value]?.label ?? value
}

function formatTimestamp(epochSeconds) {
  return format(new Date(epochSeconds * 1000), 'd MMM yyyy, HH:mm:ss')
}

export const adminFeedbackViewModel = {
  async get(query = {}) {
    const entries = await feedbackService.listAll()
    entries.sort((a, b) => (b.updated_at ?? 0) - (a.updated_at ?? 0))
    const rows = entries.map((entry) => ({
      id: entry.proposition_match_id,
      updatedAt: entry.updated_at ? formatTimestamp(entry.updated_at) : '—',
      currentStatusLabel: statusLabel(entry.current_status),
      choiceLabel: choiceLabel(entry.choice),
      comment: entry.comment,
      pageHref:
        `/audit/subjects/${entry.category_id}/pages/${entry.page_id}` +
        `#completed-feedback-${entry.proposition_match_id}`
    }))

    return {
      pageTitle: 'Feedback admin',
      rows,
      hasRows: rows.length > 0,
      cleared: query.cleared === '1'
    }
  }
}
