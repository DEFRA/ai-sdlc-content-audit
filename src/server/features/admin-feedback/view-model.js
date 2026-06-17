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
    const rows = entries.map((entry) => ({
      id: entry.propositionMatchId,
      updatedAt: entry.updatedAt ? formatTimestamp(entry.updatedAt) : '—',
      currentStatusLabel: statusLabel(entry.currentStatus),
      choiceLabel: choiceLabel(entry.choice),
      comment: entry.comment,
      pageHref:
        `/audit/subjects/${entry.categoryId}/pages/${entry.pageId}` +
        `#completed-feedback-${entry.propositionMatchId}`
    }))

    return {
      pageTitle: 'Feedback admin',
      rows,
      hasRows: rows.length > 0,
      cleared: query.cleared === '1'
    }
  }
}
