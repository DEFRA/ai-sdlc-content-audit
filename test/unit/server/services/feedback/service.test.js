import { vi } from 'vitest'

import { feedbackRepository } from '../../../../../src/server/services/feedback/repository.js'
import { feedbackService } from '../../../../../src/server/services/feedback/service.js'

describe('#feedbackService', () => {
  const recordInput = {
    categoryId: 1,
    pageId: 42,
    propositionMatchId: 7,
    currentStatus: 'CONFLICTS',
    suggestedStatus: 'GROUNDED',
    comment: 'looks wrong to me'
  }

  beforeEach(() => {
    vi.spyOn(feedbackRepository, 'append').mockResolvedValue(undefined)
    vi.spyOn(feedbackRepository, 'listAll').mockResolvedValue([])
    vi.spyOn(feedbackRepository, 'clear').mockResolvedValue(undefined)
  })

  describe('record', () => {
    test('writes a self-describing entry with a generated id and unix-seconds timestamp', async () => {
      const before = Math.floor(Date.now() / 1000)
      const entry = await feedbackService.record(recordInput)
      const after = Math.floor(Date.now() / 1000)

      expect(entry).toMatchObject({
        category_id: 1,
        page_id: 42,
        proposition_match_id: 7,
        current_status: 'CONFLICTS',
        suggested_status: 'GROUNDED',
        comment: 'looks wrong to me'
      })
      expect(entry.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      )
      expect(entry.submitted_at).toBeGreaterThanOrEqual(before)
      expect(entry.submitted_at).toBeLessThanOrEqual(after)
      expect(feedbackRepository.append).toHaveBeenCalledWith(entry)
    })

    test('stores empty optional fields as null', async () => {
      const entry = await feedbackService.record({
        ...recordInput,
        suggestedStatus: '',
        comment: ''
      })

      expect(entry.suggested_status).toBeNull()
      expect(entry.comment).toBeNull()
    })

    test('generates a fresh id for every submission', async () => {
      const first = await feedbackService.record(recordInput)
      const second = await feedbackService.record(recordInput)

      expect(first.id).not.toBe(second.id)
    })
  })

  describe('listAll', () => {
    test('returns whatever the repository has stored', async () => {
      const stored = [{ id: 'abc' }, { id: 'def' }]
      feedbackRepository.listAll.mockResolvedValue(stored)

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
