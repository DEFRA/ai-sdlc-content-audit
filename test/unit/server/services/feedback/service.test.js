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
    vi.spyOn(feedbackRepository, 'save').mockImplementation(async (entry) => ({
      ...entry,
      submittedAt: 1700000000,
      updatedAt: 1700000000
    }))
    vi.spyOn(feedbackRepository, 'listAll').mockResolvedValue([])
    vi.spyOn(feedbackRepository, 'clear').mockResolvedValue(undefined)
  })

  describe('saveForMatch', () => {
    test('forwards the camelCase entry to the repository and returns the saved record', async () => {
      const result = await feedbackService.saveForMatch(saveInput)

      expect(feedbackRepository.save).toHaveBeenCalledWith({
        propositionMatchId: 7,
        categoryId: 1,
        pageId: 42,
        currentStatus: 'CONFLICTS',
        choice: 'INTERESTED',
        comment: 'looks interesting'
      })
      expect(result.choice).toBe('INTERESTED')
      expect(result.submittedAt).toBe(1700000000)
    })

    test('sends an empty comment as null', async () => {
      await feedbackService.saveForMatch({ ...saveInput, comment: '' })

      const sent = feedbackRepository.save.mock.calls[0][0]
      expect(sent.comment).toBeNull()
    })
  })

  describe('findByMatchIds', () => {
    test('fetches all entries and returns a Map keyed by matchId for the requested ids', async () => {
      feedbackRepository.listAll.mockResolvedValueOnce([
        { propositionMatchId: 1, choice: 'INTERESTED' },
        { propositionMatchId: 2, choice: 'AI_MISTAKE' },
        { propositionMatchId: 9, choice: 'NOT_INTERESTED' }
      ])

      const result = await feedbackService.findByMatchIds([1, 9, 5])

      expect(result.size).toBe(2)
      expect(result.get(1).choice).toBe('INTERESTED')
      expect(result.get(9).choice).toBe('NOT_INTERESTED')
      expect(result.has(2)).toBe(false)
    })

    test('returns an empty Map without hitting the repository when called with no ids', async () => {
      const result = await feedbackService.findByMatchIds([])

      expect(feedbackRepository.listAll).not.toHaveBeenCalled()
      expect(result.size).toBe(0)
    })
  })

  describe('listAll', () => {
    test('delegates to the repository', async () => {
      const stored = [{ propositionMatchId: 1 }]
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
