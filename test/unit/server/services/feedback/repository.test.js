import { feedbackRepository } from '../../../../../src/server/services/feedback/repository.js'

describe('#feedbackRepository', () => {
  beforeEach(() => {
    fetchMock.resetMocks()
  })

  test('save POSTs the entry as JSON to /feedback', async () => {
    const entry = { propositionMatchId: 7, choice: 'INTERESTED' }
    const returned = {
      ...entry,
      submittedAt: 1700000000,
      updatedAt: 1700000000
    }
    fetchMock.mockResponseOnce(JSON.stringify(returned), { status: 201 })

    const result = await feedbackRepository.save(entry)

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('http://localhost:3001/feedback')
    expect(init.method).toBe('POST')
    expect(init.headers['content-type']).toBe('application/json')
    expect(JSON.parse(init.body)).toEqual(entry)
    expect(result).toEqual(returned)
  })

  test('listAll GETs /feedback and returns the parsed array', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify([{ propositionMatchId: 1 }, { propositionMatchId: 2 }])
    )

    const result = await feedbackRepository.listAll()

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('http://localhost:3001/feedback')
    expect(init.method).toBe('GET')
    expect(result).toEqual([
      { propositionMatchId: 1 },
      { propositionMatchId: 2 }
    ])
  })

  test('clear DELETEs /feedback and resolves on 204', async () => {
    fetchMock.mockImplementationOnce(
      async () => new Response(null, { status: 204 })
    )

    await feedbackRepository.clear()

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('http://localhost:3001/feedback')
    expect(init.method).toBe('DELETE')
  })

  test('throws when the backend returns a non-2xx response', async () => {
    fetchMock.mockResponseOnce('boom', { status: 500 })

    await expect(feedbackRepository.listAll()).rejects.toThrow(/500/)
  })
})
