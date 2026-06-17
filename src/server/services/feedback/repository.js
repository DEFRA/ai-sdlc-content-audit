import { config } from '../../../config/config.js'
import { buildRedisClient } from '../../common/helpers/redis-client.js'
import { FEEDBACK_HASH_KEY } from './constants.js'

let cachedClient = null

function getClient() {
  if (cachedClient) return cachedClient
  cachedClient = buildRedisClient(config.get('redis'))
  return cachedClient
}

function parseEntry(raw) {
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export const feedbackRepository = {
  async upsert(matchId, entry) {
    await getClient().hset(
      FEEDBACK_HASH_KEY,
      String(matchId),
      JSON.stringify(entry)
    )
  },
  async findByMatchIds(matchIds) {
    if (matchIds.length === 0) return new Map()
    const fields = matchIds.map((id) => String(id))
    const raw = await getClient().hmget(FEEDBACK_HASH_KEY, ...fields)
    const result = new Map()
    raw.forEach((value, i) => {
      const parsed = parseEntry(value)
      if (parsed) result.set(matchIds[i], parsed)
    })
    return result
  },
  async listAll() {
    const all = await getClient().hgetall(FEEDBACK_HASH_KEY)
    return Object.values(all ?? {})
      .map(parseEntry)
      .filter(Boolean)
  },
  async clear() {
    await getClient().del(FEEDBACK_HASH_KEY)
  }
}

export function _resetForTests(client) {
  cachedClient = client ?? null
}
