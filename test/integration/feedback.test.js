const { createServer } = await import('../../src/server/server.js')

// Pipeline-native ids from the audit data (Esther output): category slug,
// page content_id, and a derived `m-` match id for a displayed statement
// (GROUNDED) on that page.
const CATEGORY_ID = 'slurry'
const PAGE_ID = '5fa75896-7631-11e4-a3cb-005056011aef'
const MATCH_ID = 'm-87695826'
const MISSING_MATCH_ID = 'm-nonexistent'

const feedbackUrl = (matchId = MATCH_ID) =>
  `/audit/subjects/${CATEGORY_ID}/pages/${PAGE_ID}/propositions/${matchId}/feedback`
const pageDetailUrl = (query = '') =>
  `/audit/subjects/${CATEGORY_ID}/pages/${PAGE_ID}${query}`

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
    fetchMock.resetMocks()
  })

  describe('POST /audit/.../propositions/{id}/feedback', () => {
    test('forwards a save to the backend and 303-redirects to the completed-feedback anchor', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({}), { status: 201 })

      const { statusCode, headers } = await server.inject({
        method: 'POST',
        url: feedbackUrl(),
        payload: 'choice=INTERESTED&comment=looks%20good',
        headers: { 'content-type': 'application/x-www-form-urlencoded' }
      })

      expect(statusCode).toBe(303)
      expect(headers.location).toBe(
        `${pageDetailUrl(`?feedback=saved&matchId=${MATCH_ID}`)}#completed-feedback-${MATCH_ID}`
      )

      expect(fetchMock).toHaveBeenCalledOnce()
      const [url, init] = fetchMock.mock.calls[0]
      expect(url).toBe('http://localhost:3001/feedback')
      expect(init.method).toBe('POST')
      const sent = JSON.parse(init.body)
      expect(sent).toMatchObject({
        propositionMatchId: MATCH_ID,
        categoryId: CATEGORY_ID,
        pageId: PAGE_ID,
        choice: 'INTERESTED',
        comment: 'looks good'
      })
      expect(sent.currentStatus).toBeDefined()
    })

    test('accepts an empty comment and sends null', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({}), { status: 201 })

      const { statusCode } = await server.inject({
        method: 'POST',
        url: feedbackUrl(),
        payload: 'choice=NOT_INTERESTED&comment=',
        headers: { 'content-type': 'application/x-www-form-urlencoded' }
      })

      expect(statusCode).toBe(303)
      const sent = JSON.parse(fetchMock.mock.calls[0][1].body)
      expect(sent.comment).toBeNull()
    })

    test('rejects an unknown choice without calling the backend', async () => {
      const { statusCode } = await server.inject({
        method: 'POST',
        url: feedbackUrl(),
        payload: 'choice=NOPE',
        headers: { 'content-type': 'application/x-www-form-urlencoded' }
      })

      expect(statusCode).toBe(400)
      expect(fetchMock).not.toHaveBeenCalled()
    })

    test('rejects a missing choice without calling the backend', async () => {
      const { statusCode } = await server.inject({
        method: 'POST',
        url: feedbackUrl(),
        payload: 'comment=hi',
        headers: { 'content-type': 'application/x-www-form-urlencoded' }
      })

      expect(statusCode).toBe(400)
      expect(fetchMock).not.toHaveBeenCalled()
    })

    test('returns 404 when the proposition match does not exist', async () => {
      const { statusCode } = await server.inject({
        method: 'POST',
        url: feedbackUrl(MISSING_MATCH_ID),
        payload: 'choice=INTERESTED',
        headers: { 'content-type': 'application/x-www-form-urlencoded' }
      })

      expect(statusCode).toBe(404)
      expect(fetchMock).not.toHaveBeenCalled()
    })
  })

  describe('GET audit page detail', () => {
    test('renders pending and completed sections with the three choices and a save banner', async () => {
      fetchMock.mockResponseOnce(JSON.stringify([]))

      const { statusCode, payload } = await server.inject({
        method: 'GET',
        url: pageDetailUrl(`?feedback=saved&matchId=${MATCH_ID}`)
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
      // The view-model fetches all entries from the backend, then filters by
      // match id. Return one entry whose id matches a displayed statement on
      // the page so it lands in the completed section.
      fetchMock.mockResponseOnce(
        JSON.stringify([
          {
            propositionMatchId: MATCH_ID,
            categoryId: CATEGORY_ID,
            pageId: PAGE_ID,
            currentStatus: 'GROUNDED',
            choice: 'AI_MISTAKE',
            comment: 'entry',
            submittedAt: 1700000000,
            updatedAt: 1700000500
          }
        ])
      )

      const { statusCode, payload } = await server.inject({
        method: 'GET',
        url: pageDetailUrl()
      })

      expect(statusCode).toBe(200)
      expect(payload).toContain(`id="completed-feedback-${MATCH_ID}"`)
      expect(payload).toContain('Update your feedback')
      expect(payload).toContain('Save changes')
    })
  })

  describe('admin feedback', () => {
    test('GET /admin renders the entries returned by the backend', async () => {
      fetchMock.mockResponseOnce(
        JSON.stringify([
          {
            propositionMatchId: MATCH_ID,
            categoryId: CATEGORY_ID,
            pageId: PAGE_ID,
            currentStatus: 'CONFLICTS',
            choice: 'AI_MISTAKE',
            comment: 'model hallucinated',
            submittedAt: 1700000000,
            updatedAt: 1700000000
          }
        ])
      )

      const { statusCode, payload } = await server.inject({
        method: 'GET',
        url: '/admin'
      })

      expect(statusCode).toBe(200)
      expect(payload).toContain('Feedback admin')
      expect(payload).toContain('model hallucinated')
      expect(payload).toContain('This is a mistake in the AI')
      expect(payload).toContain(
        `/audit/subjects/${CATEGORY_ID}/pages/${PAGE_ID}#completed-feedback-${MATCH_ID}`
      )
    })

    test('POST /admin/clear DELETEs the backend feedback and redirects with a success flag', async () => {
      fetchMock.mockImplementationOnce(
        async () => new Response(null, { status: 204 })
      )

      const { statusCode, headers } = await server.inject({
        method: 'POST',
        url: '/admin/clear'
      })

      expect(statusCode).toBe(303)
      expect(headers.location).toBe('/admin?cleared=1')
      const [url, init] = fetchMock.mock.calls[0]
      expect(url).toBe('http://localhost:3001/feedback')
      expect(init.method).toBe('DELETE')
    })
  })
})
