import { vi } from 'vitest'

const fakeClient = {
  hset: vi.fn().mockResolvedValue(1),
  hmget: vi.fn().mockResolvedValue([]),
  hgetall: vi.fn().mockResolvedValue({}),
  del: vi.fn().mockResolvedValue(1),
  on: vi.fn()
}

vi.mock('../../src/server/common/helpers/redis-client.js', () => ({
  buildRedisClient: vi.fn(() => fakeClient)
}))

const { createServer } = await import('../../src/server/server.js')

describe('proposition feedback endpoints', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  beforeEach(() => {
    fakeClient.hset.mockClear()
    fakeClient.hmget.mockClear()
    fakeClient.hgetall.mockClear()
    fakeClient.del.mockClear()
    fakeClient.hmget.mockResolvedValue([])
    fakeClient.hgetall.mockResolvedValue({})
  })

  describe('POST /audit/.../propositions/{id}/feedback', () => {
    test('saves the feedback and 303-redirects to the completed-feedback anchor', async () => {
      const { statusCode, headers } = await server.inject({
        method: 'POST',
        url: '/audit/subjects/1/pages/1/propositions/1/feedback',
        payload: 'choice=INTERESTED&comment=looks%20good',
        headers: { 'content-type': 'application/x-www-form-urlencoded' }
      })

      expect(statusCode).toBe(303)
      expect(headers.location).toBe(
        '/audit/subjects/1/pages/1?feedback=saved&matchId=1#completed-feedback-1'
      )

      const [key, field, json] = fakeClient.hset.mock.calls[0]
      expect(key).toBe('feedback:propositions')
      expect(field).toBe('1')

      const entry = JSON.parse(json)
      expect(entry).toMatchObject({
        category_id: 1,
        page_id: 1,
        proposition_match_id: 1,
        choice: 'INTERESTED',
        comment: 'looks good'
      })
      expect(entry.current_status).toBeDefined()
      expect(entry.submitted_at).toBeTypeOf('number')
      expect(entry.updated_at).toBeTypeOf('number')
    })

    test('accepts an empty comment', async () => {
      const { statusCode } = await server.inject({
        method: 'POST',
        url: '/audit/subjects/1/pages/1/propositions/1/feedback',
        payload: 'choice=NOT_INTERESTED&comment=',
        headers: { 'content-type': 'application/x-www-form-urlencoded' }
      })

      expect(statusCode).toBe(303)
      const entry = JSON.parse(fakeClient.hset.mock.calls[0][2])
      expect(entry.choice).toBe('NOT_INTERESTED')
      expect(entry.comment).toBeNull()
    })

    test('rejects an unknown choice value', async () => {
      const { statusCode } = await server.inject({
        method: 'POST',
        url: '/audit/subjects/1/pages/1/propositions/1/feedback',
        payload: 'choice=NOPE',
        headers: { 'content-type': 'application/x-www-form-urlencoded' }
      })

      expect(statusCode).toBe(400)
      expect(fakeClient.hset).not.toHaveBeenCalled()
    })

    test('rejects a missing choice', async () => {
      const { statusCode } = await server.inject({
        method: 'POST',
        url: '/audit/subjects/1/pages/1/propositions/1/feedback',
        payload: 'comment=hi',
        headers: { 'content-type': 'application/x-www-form-urlencoded' }
      })

      expect(statusCode).toBe(400)
      expect(fakeClient.hset).not.toHaveBeenCalled()
    })

    test('returns 404 when the proposition match does not exist', async () => {
      const { statusCode } = await server.inject({
        method: 'POST',
        url: '/audit/subjects/1/pages/1/propositions/999999/feedback',
        payload: 'choice=INTERESTED',
        headers: { 'content-type': 'application/x-www-form-urlencoded' }
      })

      expect(statusCode).toBe(404)
      expect(fakeClient.hset).not.toHaveBeenCalled()
    })
  })

  describe('GET audit page detail', () => {
    test('renders pending and completed sections with the three choices and a save banner', async () => {
      const { statusCode, payload } = await server.inject({
        method: 'GET',
        url: '/audit/subjects/1/pages/2?feedback=saved&matchId=1'
      })

      expect(statusCode).toBe(200)
      expect(payload).toContain('Pending feedback')
      expect(payload).toContain('Completed feedback')
      expect(payload).toContain('I am interested in this')
      expect(payload).toContain('I am not interested in this')
      expect(payload).toContain('This is a mistake in the AI')
      expect(payload).toContain('Your feedback has been saved.')
      expect(payload).toContain('href="#pending-feedback"')
      expect(payload).toContain('href="#completed-feedback"')
    })

    test('moves a statement into the completed section once feedback exists for it', async () => {
      fakeClient.hmget.mockImplementation((_key, ...fields) =>
        Promise.resolve(
          fields.map((field, i) =>
            i === 0
              ? JSON.stringify({
                  proposition_match_id: Number(field),
                  category_id: 1,
                  page_id: 2,
                  current_status: 'CONFLICTS',
                  choice: 'AI_MISTAKE',
                  comment: 'wrong reading',
                  submitted_at: 1700000000,
                  updated_at: 1700000500
                })
              : null
          )
        )
      )

      const { statusCode, payload } = await server.inject({
        method: 'GET',
        url: '/audit/subjects/1/pages/2'
      })

      expect(statusCode).toBe(200)
      expect(payload).toMatch(/id="completed-feedback-\d+"/)
      expect(payload).toContain('Update your feedback')
      expect(payload).toContain('Save changes')
      expect(payload).toContain('wrong reading')
    })
  })

  describe('admin feedback', () => {
    test('GET /admin renders the entries from the feedback hash', async () => {
      fakeClient.hgetall.mockResolvedValueOnce({
        7: JSON.stringify({
          proposition_match_id: 7,
          category_id: 1,
          page_id: 1,
          current_status: 'CONFLICTS',
          choice: 'AI_MISTAKE',
          comment: 'model hallucinated',
          submitted_at: 1700000000,
          updated_at: 1700000000
        })
      })

      const { statusCode, payload } = await server.inject({
        method: 'GET',
        url: '/admin'
      })

      expect(statusCode).toBe(200)
      expect(payload).toContain('Feedback admin')
      expect(payload).toContain('model hallucinated')
      expect(payload).toContain('This is a mistake in the AI')
      expect(payload).toContain(
        '/audit/subjects/1/pages/1#completed-feedback-7'
      )
    })

    test('POST /admin/clear deletes the hash and redirects with a success flag', async () => {
      const { statusCode, headers } = await server.inject({
        method: 'POST',
        url: '/admin/clear'
      })

      expect(statusCode).toBe(303)
      expect(headers.location).toBe('/admin?cleared=1')
      expect(fakeClient.del).toHaveBeenCalledWith('feedback:propositions')
    })
  })
})
