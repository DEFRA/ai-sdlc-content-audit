import { config } from '../../../config/config.js'
import { buildRedisClient } from '../../common/helpers/redis-client.js'
import { FEEDBACK_LIST_KEY } from './constants.js'

let cachedClient = null

function getClient() {
  if (cachedClient) return cachedClient
  cachedClient = buildRedisClient(config.get('redis'))
  return cachedClient
}

export const feedbackRepository = {
  async append(entry) {
    await getClient().rpush(FEEDBACK_LIST_KEY, JSON.stringify(entry))
  },
  async listAll() {
    const raw = await getClient().lrange(FEEDBACK_LIST_KEY, 0, -1)
    return raw.map((value) => JSON.parse(value))
  },
  async clear() {
    await getClient().del(FEEDBACK_LIST_KEY)
  }
}

export function _resetForTests(client) {
  cachedClient = client ?? null
}
