import { feedbackRepository } from './repository.js'

export const feedbackService = {
  async saveForMatch({
    categoryId,
    pageId,
    propositionMatchId,
    currentStatus,
    choice,
    comment
  }) {
    return feedbackRepository.save({
      propositionMatchId,
      categoryId,
      pageId,
      currentStatus,
      choice,
      comment: comment || null
    })
  },
  async findByMatchIds(matchIds) {
    if (matchIds.length === 0) return new Map()
    const wanted = new Set(matchIds)
    const entries = await feedbackRepository.listAll()
    const found = new Map()
    for (const entry of entries) {
      if (wanted.has(entry.propositionMatchId)) {
        found.set(entry.propositionMatchId, entry)
      }
    }
    return found
  },
  async listAll() {
    return feedbackRepository.listAll()
  },
  async clear() {
    await feedbackRepository.clear()
  }
}
