import { RedisStore } from 'rate-limit-redis'
import Redis from 'ioredis'
import type { Store } from 'express-rate-limit'

/**
 * Creates the rate limit store.
 *
 * - No REDIS_URL → returns undefined (express-rate-limit uses its built-in MemoryStore).
 *   State resets on server restart and does NOT scale across processes.
 *
 * - REDIS_URL set → returns a RedisStore backed by ioredis.
 *   State survives restarts and is shared across all instances/processes.
 *   Redis connection errors are logged and do not crash the server.
 */
export function createRateLimitStore(): Store | undefined {
  if (!process.env.REDIS_URL) return undefined

  const client = new Redis(process.env.REDIS_URL, {
    // Don't block startup — connect in the background.
    lazyConnect: true,
    // Don't queue commands while offline; fail fast instead.
    enableOfflineQueue: false,
    // One retry per command, then reject. Avoids silent stalls.
    maxRetriesPerRequest: 1,
  })

  client.on('error', (err) => {
    console.error('[RateLimit] Redis error:', err.message)
  })

  client.on('connect', () => {
    console.info('[RateLimit] Redis connected — rate limit state is shared across instances.')
  })

  return new RedisStore({
    sendCommand: async (...args: string[]) => client.call(args[0], ...args.slice(1)) as Promise<number>,
    prefix: 'rl:derinator:',
  })
}
