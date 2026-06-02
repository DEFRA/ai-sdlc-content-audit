import { format } from 'date-fns'

import { STATUS_META } from '../../services/audit/constants.js'
import { feedbackService } from '../../services/feedback/service.js'

function statusLabel(value) {
  if (!value) return null
  return STATUS_META[value]?.label ?? value
}

function formatTimestamp(epochSeconds) {
  return format(new Date(epochSeconds * 1000), 'd MMM yyyy, HH:mm:ss')
}

export const adminFeedbackViewModel = {
  async get(query = {}) {
    const entries = await feedbackService.listAll()
    const rows = entries.map((entry) => ({
      id: entry.id,
      submittedAt: formatTimestamp(entry.submitted_at),
      currentStatusLabel: statusLabel(entry.current_status),
      suggestedStatusLabel: statusLabel(entry.suggested_status),
      comment: entry.comment,
      pageHref:
        `/audit/subjects/${entry.category_id}/pages/${entry.page_id}` +
        `#proposition-${entry.proposition_match_id}`
    }))

    return {
      pageTitle: 'Feedback admin',
      rows,
      hasRows: rows.length > 0,
      cleared: query.cleared === '1'
    }
  }
}
