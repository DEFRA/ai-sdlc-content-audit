import { config } from '../../../config/config.js'

function baseUrl() {
  return config.get('backendUrl').replace(/\/$/, '')
}

async function send(method, path, body) {
  const response = await fetch(`${baseUrl()}${path}`, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(
      `Feedback backend ${method} ${path} failed: ${response.status} ${text}`
    )
  }

  if (response.status === 204) return null
  return response.json()
}

export const feedbackRepository = {
  save(entry) {
    return send('POST', '/feedback', entry)
  },
  listAll() {
    return send('GET', '/feedback')
  },
  async clear() {
    await send('DELETE', '/feedback')
  }
}
