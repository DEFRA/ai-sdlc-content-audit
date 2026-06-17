import { vi } from 'vitest'

const fakeClient = {
  hset: vi.fn().mockResolvedValue(1),
  hmget: vi.fn().mockResolvedValue([]),
  hgetall: vi.fn().mockResolvedValue({}),
  del: vi.fn().mockResolvedValue(1),
  on: vi.fn()
}

vi.mock('../../../../../src/server/common/helpers/redis-client.js', () => ({
  buildRedisClient: vi.fn(() => fakeClient)
}))

const { feedbackRepository, _resetForTests } =
  await import('../../../../../src/server/services/feedback/repository.js')

describe('#feedbackRepository', () => {
  beforeEach(() => {
    _resetForTests(fakeClient)
    vi.clearAllMocks()
  })

  test('upsert HSETs the entry keyed by match id', async () => {
    const entry = { proposition_match_id: 7, choice: 'INTERESTED' }

    await feedbackRepository.upsert(7, entry)

    expect(fakeClient.hset).toHaveBeenCalledWith(
      'feedback:propositions',
      '7',
      JSON.stringify(entry)
    )
  })

  test('findByMatchIds HMGETs the requested fields and returns a Map of parsed entries', async () => {
    fakeClient.hmget.mockResolvedValueOnce([
      JSON.stringify({ proposition_match_id: 1, choice: 'INTERESTED' }),
      null,
      JSON.stringify({ proposition_match_id: 3, choice: 'AI_MISTAKE' })
    ])

    const result = await feedbackRepository.findByMatchIds([1, 2, 3])

    expect(fakeClient.hmget).toHaveBeenCalledWith(
      'feedback:propositions',
      '1',
      '2',
      '3'
    )
    expect(result.size).toBe(2)
    expect(result.get(1).choice).toBe('INTERESTED')
    expect(result.get(3).choice).toBe('AI_MISTAKE')
    expect(result.has(2)).toBe(false)
  })

  test('findByMatchIds returns an empty Map when called with no ids', async () => {
    const result = await feedbackRepository.findByMatchIds([])

    expect(fakeClient.hmget).not.toHaveBeenCalled()
    expect(result.size).toBe(0)
  })

  test('listAll HGETALLs the hash and parses every value', async () => {
    fakeClient.hgetall.mockResolvedValueOnce({
      1: JSON.stringify({ proposition_match_id: 1 }),
      2: JSON.stringify({ proposition_match_id: 2 })
    })

    const result = await feedbackRepository.listAll()

    expect(fakeClient.hgetall).toHaveBeenCalledWith('feedback:propositions')
    expect(result).toEqual([
      { proposition_match_id: 1 },
      { proposition_match_id: 2 }
    ])
  })

  test('clear DELs the hash', async () => {
    await feedbackRepository.clear()

    expect(fakeClient.del).toHaveBeenCalledWith('feedback:propositions')
  })
})
