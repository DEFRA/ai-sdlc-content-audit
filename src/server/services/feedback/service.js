import { feedbackRepository } from './repository.js'

function nowEpochSeconds() {
  return Math.floor(Date.now() / 1000)
}

export const feedbackService = {
  async saveForMatch({
    categoryId,
    pageId,
    propositionMatchId,
    currentStatus,
    choice,
    comment
  }) {
    const existing = (
      await feedbackRepository.findByMatchIds([propositionMatchId])
    ).get(propositionMatchId)
    const now = nowEpochSeconds()
    const entry = {
      proposition_match_id: propositionMatchId,
      category_id: categoryId,
      page_id: pageId,
      current_status: currentStatus,
      choice,
      comment: comment || null,
      submitted_at: existing?.submitted_at ?? now,
      updated_at: now
    }
    await feedbackRepository.upsert(propositionMatchId, entry)
    return entry
  },
  async findByMatchIds(matchIds) {
    return feedbackRepository.findByMatchIds(matchIds)
  },
  async listAll() {
    return feedbackRepository.listAll()
  },
  async clear() {
    await feedbackRepository.clear()
  }
}
