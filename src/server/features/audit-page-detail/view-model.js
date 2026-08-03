import { format } from 'date-fns'

import {
  PAGE_FILTER_STATUSES,
  STATEMENT_STATUS_META
} from '../../services/audit/constants.js'
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

const PAGE_FILTER_STATUS_SET = new Set(PAGE_FILTER_STATUSES)

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

function sortByEmissionOrder(a, b) {
  return (a.order ?? 0) - (b.order ?? 0)
}

export const auditPageDetailViewModel = {
  async get(categoryId, pageId, query = {}) {
    const category = auditService.getCategory(categoryId)
    if (!category) return null

    const detail = auditService.getPageDetail(categoryId, pageId)
    if (!detail) return null

    // Statements already come from guidance comparisons when the assembler
    // contract is present (see create-audit-service getPageDetail).
    const allDisplayed = detail.statements.filter((s) =>
      STATUS_RANK.has(s.status)
    )

    const statusCounts = {}
    for (const status of DISPLAYED_STATUSES) statusCounts[status] = 0
    for (const s of allDisplayed) {
      statusCounts[s.status] += 1
    }

    const pageBaseHref = `/audit/subjects/${categoryId}/pages/${pageId}`

    // Preserve any pages-list filter in the URL (e.g. UNGROUNDED) for back /
    // post-feedback navigation. Statement filtering only applies to statuses
    // shown on this page (DISPLAYED_STATUSES).
    const listStatusFilter =
      typeof query.status === 'string' &&
      PAGE_FILTER_STATUS_SET.has(query.status)
        ? query.status
        : null
    const statusFilter = STATUS_RANK.has(listStatusFilter)
      ? listStatusFilter
      : null

    const filterOptions = [
      {
        key: null,
        label: 'All statements',
        tone: null,
        count: null,
        href: pageBaseHref,
        active: !statusFilter
      },
      ...DISPLAYED_STATUSES.filter((status) => statusCounts[status] > 0).map(
        (status) => ({
          key: status,
          label: STATEMENT_STATUS_META[status].label,
          tone: STATEMENT_STATUS_META[status].tone,
          count: statusCounts[status],
          href: `${pageBaseHref}?status=${status}`,
          active: statusFilter === status
        })
      )
    ]

    const activeOption = statusFilter
      ? filterOptions.find((o) => o.key === statusFilter)
      : null

    const displayed = statusFilter
      ? allDisplayed.filter((s) => s.status === statusFilter)
      : allDisplayed

    let feedbackByMatchId = new Map()
    try {
      const feedbackIds = displayed
        .filter((s) => s.feedbackEnabled !== false)
        .map((s) => s.id)
      feedbackByMatchId = await feedbackService.findByMatchIds(feedbackIds)
    } catch {
      // Feedback backend unavailable — render audit content with all statements pending.
    }

    const pending = []
    const completed = []
    for (const statement of displayed) {
      const feedback =
        statement.feedbackEnabled === false
          ? null
          : decorateFeedback(feedbackByMatchId.get(statement.id))
      const row = { ...statement, feedback }
      if (feedback) {
        completed.push(row)
      } else {
        pending.push(row)
      }
    }

    // Preserve guidance-proposition / backend comparison order (do not
    // re-sort multi-hit pairs by status severity).
    pending.sort(sortByEmissionOrder)
    completed.sort(sortByEmissionOrder)

    const savedMatchId =
      query.feedback === 'saved' && query.matchId != null ? query.matchId : null

    const pagesListHref = listStatusFilter
      ? `/audit/subjects/${categoryId}/pages?status=${listStatusFilter}`
      : `/audit/subjects/${categoryId}/pages`

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
      backHref: pagesListHref,
      clearFilterHref: pageBaseHref,
      filterOptions,
      activeOption,
      statusFilter: listStatusFilter,
      feedbackWidget: propositionFeedbackWidget,
      savedMatchId
    }
  }
}
