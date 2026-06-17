import { format } from 'date-fns'

import { auditService } from '../../services/audit/service.js'
import {
  DISPLAYED_STATUSES,
  FEEDBACK_CHOICES
} from '../../services/feedback/constants.js'
import { feedbackService } from '../../services/feedback/service.js'
import { propositionFeedbackWidget } from '../proposition-feedback/view-model.js'

const STATUS_RANK = new Map(
  DISPLAYED_STATUSES.map((status, index) => [status, index])
)

function formatTimestamp(epochSeconds) {
  return format(new Date(epochSeconds * 1000), 'd MMM yyyy, HH:mm')
}

function decorateFeedback(entry) {
  if (!entry) return null
  return {
    ...entry,
    choiceLabel: FEEDBACK_CHOICES[entry.choice]?.label ?? entry.choice,
    updatedAtLabel: entry.updatedAt ? formatTimestamp(entry.updatedAt) : null
  }
}

function sortByStatus(a, b) {
  return STATUS_RANK.get(a.status) - STATUS_RANK.get(b.status)
}

export const auditPageDetailViewModel = {
  async get(categoryId, pageId, query = {}) {
    const category = auditService.getCategory(categoryId)
    if (!category) return null

    const detail = auditService.getPageDetail(pageId)
    if (!detail) return null

    const displayed = detail.statements.filter((s) => STATUS_RANK.has(s.status))

    const feedbackByMatchId = await feedbackService.findByMatchIds(
      displayed.map((s) => s.id)
    )

    const pending = []
    const completed = []
    for (const statement of displayed) {
      const feedback = decorateFeedback(feedbackByMatchId.get(statement.id))
      const row = { ...statement, feedback }
      if (feedback) {
        completed.push(row)
      } else {
        pending.push(row)
      }
    }

    pending.sort(sortByStatus)
    completed.sort(sortByStatus)

    const savedMatchId =
      query.feedback === 'saved' && query.matchId != null
        ? Number(query.matchId)
        : null

    return {
      pageTitle: detail.page.title,
      category,
      page: detail.page,
      categoryId,
      pageId,
      pending,
      completed,
      hasPending: pending.length > 0,
      hasCompleted: completed.length > 0,
      backHref: `/audit/subjects/${categoryId}/pages`,
      feedbackWidget: propositionFeedbackWidget,
      savedMatchId
    }
  }
}
