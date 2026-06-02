import { randomUUID } from 'node:crypto'

import { feedbackRepository } from './repository.js'

function nowEpochSeconds() {
  return Math.floor(Date.now() / 1000)
}

export const feedbackService = {
  async record({
    categoryId,
    pageId,
    propositionMatchId,
    currentStatus,
    suggestedStatus,
    comment
  }) {
    const entry = {
      id: randomUUID(),
      submitted_at: nowEpochSeconds(),
      category_id: categoryId,
      page_id: pageId,
      proposition_match_id: propositionMatchId,
      current_status: currentStatus,
      suggested_status: suggestedStatus || null,
      comment: comment || null
    }
    await feedbackRepository.append(entry)
    return entry
  },
  async listAll() {
    return feedbackRepository.listAll()
  },
  async clear() {
    await feedbackRepository.clear()
  }
}
