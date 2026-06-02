import { vi } from 'vitest'

const fakeClient = {
  rpush: vi.fn().mockResolvedValue(1),
  lrange: vi.fn().mockResolvedValue([]),
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

  test('append RPUSHes a JSON-serialised entry onto the feedback list', async () => {
    const entry = { id: 'abc', category_id: 1 }

    await feedbackRepository.append(entry)

    expect(fakeClient.rpush).toHaveBeenCalledWith(
      'feedback:entries',
      JSON.stringify(entry)
    )
  })

  test('listAll LRANGEs the full list and parses every entry', async () => {
    fakeClient.lrange.mockResolvedValueOnce([
      JSON.stringify({ id: 'a' }),
      JSON.stringify({ id: 'b' })
    ])

    const result = await feedbackRepository.listAll()

    expect(fakeClient.lrange).toHaveBeenCalledWith('feedback:entries', 0, -1)
    expect(result).toEqual([{ id: 'a' }, { id: 'b' }])
  })

  test('clear DELs the feedback list', async () => {
    await feedbackRepository.clear()

    expect(fakeClient.del).toHaveBeenCalledWith('feedback:entries')
  })
})
