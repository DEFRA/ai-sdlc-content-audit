import { vi } from 'vitest'

const fakeClient = {
  rpush: vi.fn().mockResolvedValue(1),
  lrange: vi.fn().mockResolvedValue([]),
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
    fakeClient.rpush.mockClear()
    fakeClient.lrange.mockClear()
    fakeClient.del.mockClear()
    fakeClient.lrange.mockResolvedValue([])
  })

  describe('POST /audit/.../propositions/{id}/feedback', () => {
    test('records the entry and 303-redirects back to the page detail', async () => {
      const { statusCode, headers } = await server.inject({
        method: 'POST',
        url: '/audit/subjects/1/pages/1/propositions/1/feedback',
        payload: 'suggested_status=GROUNDED&comment=hello',
        headers: { 'content-type': 'application/x-www-form-urlencoded' }
      })

      expect(statusCode).toBe(303)
      expect(headers.location).toBe(
        '/audit/subjects/1/pages/1?feedback=success&matchId=1#proposition-1'
      )

      const [key, json] = fakeClient.rpush.mock.calls[0]
      expect(key).toBe('feedback:entries')

      const entry = JSON.parse(json)
      expect(entry).toMatchObject({
        category_id: 1,
        page_id: 1,
        proposition_match_id: 1,
        suggested_status: 'GROUNDED',
        comment: 'hello'
      })
      expect(entry.current_status).toBeDefined()
      expect(entry.id).toBeDefined()
      expect(entry.submitted_at).toBeTypeOf('number')
    })

    test('accepts an empty payload as a bare disagreement flag', async () => {
      const { statusCode } = await server.inject({
        method: 'POST',
        url: '/audit/subjects/1/pages/1/propositions/1/feedback',
        payload: 'suggested_status=&comment=',
        headers: { 'content-type': 'application/x-www-form-urlencoded' }
      })

      expect(statusCode).toBe(303)

      const entry = JSON.parse(fakeClient.rpush.mock.calls[0][1])
      expect(entry.suggested_status).toBeNull()
      expect(entry.comment).toBeNull()
    })

    test('rejects an unknown status constant', async () => {
      const { statusCode } = await server.inject({
        method: 'POST',
        url: '/audit/subjects/1/pages/1/propositions/1/feedback',
        payload: 'suggested_status=NOT_A_STATUS',
        headers: { 'content-type': 'application/x-www-form-urlencoded' }
      })

      expect(statusCode).toBe(400)
      expect(fakeClient.rpush).not.toHaveBeenCalled()
    })

    test('returns 404 when the proposition match does not exist', async () => {
      const { statusCode } = await server.inject({
        method: 'POST',
        url: '/audit/subjects/1/pages/1/propositions/999999/feedback',
        payload: '',
        headers: { 'content-type': 'application/x-www-form-urlencoded' }
      })

      expect(statusCode).toBe(404)
      expect(fakeClient.rpush).not.toHaveBeenCalled()
    })
  })

  describe('audit page detail with widget included', () => {
    test('renders one widget per statement and shows the success banner after submission', async () => {
      const { statusCode, payload } = await server.inject({
        method: 'GET',
        url: '/audit/subjects/1/pages/2?feedback=success&matchId=1'
      })

      expect(statusCode).toBe(200)
      expect(payload).toContain('Flag this match for review')
      expect(payload).toContain('Suggested status (optional)')
      expect(payload).toContain('Comment (optional)')
      expect(payload).toContain('Submit review')
      expect(payload).toContain('Thank you. Your review has been recorded.')
      expect(payload).toContain(
        '/audit/subjects/1/pages/2/propositions/1/feedback'
      )
    })
  })

  describe('admin feedback', () => {
    test('GET /admin renders the entries returned by Redis', async () => {
      fakeClient.lrange.mockResolvedValue([
        JSON.stringify({
          id: 'abc',
          submitted_at: 1700000000,
          category_id: 1,
          page_id: 1,
          proposition_match_id: 1,
          current_status: 'CONFLICTS',
          suggested_status: 'GROUNDED',
          comment: 'mismatch'
        })
      ])

      const { statusCode, payload } = await server.inject({
        method: 'GET',
        url: '/admin'
      })

      expect(statusCode).toBe(200)
      expect(payload).toContain('Feedback admin')
      expect(payload).toContain('mismatch')
      expect(payload).toContain('/audit/subjects/1/pages/1#proposition-1')
    })

    test('GET /admin/feedback.json downloads the raw list as JSON', async () => {
      const stored = [{ id: 'abc', submitted_at: 1700000000 }]
      fakeClient.lrange.mockResolvedValue([JSON.stringify(stored[0])])

      const { statusCode, headers, payload } = await server.inject({
        method: 'GET',
        url: '/admin/feedback.json'
      })

      expect(statusCode).toBe(200)
      expect(headers['content-type']).toContain('application/json')
      expect(headers['content-disposition']).toContain('attachment')
      expect(JSON.parse(payload)).toEqual(stored)
    })

    test('POST /admin/clear deletes the Redis list and redirects with a success flag', async () => {
      const { statusCode, headers } = await server.inject({
        method: 'POST',
        url: '/admin/clear'
      })

      expect(statusCode).toBe(303)
      expect(headers.location).toBe('/admin?cleared=1')
      expect(fakeClient.del).toHaveBeenCalledWith('feedback:entries')
    })
  })
})
