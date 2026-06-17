import { vi } from 'vitest'

import { feedbackRepository } from '../../../../../src/server/services/feedback/repository.js'
import { feedbackService } from '../../../../../src/server/services/feedback/service.js'

describe('#feedbackService', () => {
  const saveInput = {
    categoryId: 1,
    pageId: 42,
    propositionMatchId: 7,
    currentStatus: 'CONFLICTS',
    choice: 'INTERESTED',
    comment: 'looks interesting'
  }

  beforeEach(() => {
    vi.spyOn(feedbackRepository, 'upsert').mockResolvedValue(undefined)
    vi.spyOn(feedbackRepository, 'findByMatchIds').mockResolvedValue(new Map())
    vi.spyOn(feedbackRepository, 'listAll').mockResolvedValue([])
    vi.spyOn(feedbackRepository, 'clear').mockResolvedValue(undefined)
  })

  describe('saveForMatch', () => {
    test('writes a self-describing entry with submitted_at and updated_at', async () => {
      const before = Math.floor(Date.now() / 1000)
      const entry = await feedbackService.saveForMatch(saveInput)
      const after = Math.floor(Date.now() / 1000)

      expect(entry).toMatchObject({
        category_id: 1,
        page_id: 42,
        proposition_match_id: 7,
        current_status: 'CONFLICTS',
        choice: 'INTERESTED',
        comment: 'looks interesting'
      })
      expect(entry.submitted_at).toBeGreaterThanOrEqual(before)
      expect(entry.submitted_at).toBeLessThanOrEqual(after)
      expect(entry.updated_at).toBeGreaterThanOrEqual(entry.submitted_at)
      expect(feedbackRepository.upsert).toHaveBeenCalledWith(7, entry)
    })

    test('stores an empty comment as null', async () => {
      const entry = await feedbackService.saveForMatch({
        ...saveInput,
        comment: ''
      })

      expect(entry.comment).toBeNull()
    })

    test('preserves the original submitted_at when updating an existing entry', async () => {
      feedbackRepository.findByMatchIds.mockResolvedValueOnce(
        new Map([
          [7, { proposition_match_id: 7, submitted_at: 1000, updated_at: 1500 }]
        ])
      )

      const entry = await feedbackService.saveForMatch(saveInput)

      expect(entry.submitted_at).toBe(1000)
      expect(entry.updated_at).toBeGreaterThan(1500)
    })
  })

  describe('findByMatchIds', () => {
    test('delegates to the repository', async () => {
      const stored = new Map([[1, { proposition_match_id: 1 }]])
      feedbackRepository.findByMatchIds.mockResolvedValueOnce(stored)

      const result = await feedbackService.findByMatchIds([1])

      expect(result).toBe(stored)
    })
  })

  describe('listAll', () => {
    test('returns whatever the repository has stored', async () => {
      const stored = [{ proposition_match_id: 1 }]
      feedbackRepository.listAll.mockResolvedValueOnce(stored)

      const result = await feedbackService.listAll()

      expect(result).toEqual(stored)
    })
  })

  describe('clear', () => {
    test('delegates to the repository', async () => {
      await feedbackService.clear()
      expect(feedbackRepository.clear).toHaveBeenCalled()
    })
  })
})
