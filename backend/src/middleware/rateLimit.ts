import { Request, Response, NextFunction } from 'express'

interface RateLimitEntry {
  count: number
  resetTime: number
}

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000

function createLimiter(windowMs: number, maxRequests: number) {
  const requests = new Map<string, RateLimitEntry>()

  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of requests.entries()) {
      if (now > entry.resetTime) requests.delete(key)
    }
  }, CLEANUP_INTERVAL_MS).unref()

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || 'unknown'
    const now = Date.now()

    const entry = requests.get(key)
    if (!entry || now > entry.resetTime) {
      requests.set(key, { count: 1, resetTime: now + windowMs })
      res.setHeader('X-RateLimit-Remaining', maxRequests - 1)
      next()
      return
    }

    if (entry.count >= maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
      res.setHeader('Retry-After', retryAfter)
      res.status(429).json({ error: 'Too many requests, please try again later' })
      return
    }

    entry.count++
    res.setHeader('X-RateLimit-Remaining', maxRequests - entry.count)
    next()
  }
}

/** Strict: 10 req/min — for character learning */
export const rateLimit = createLimiter(60 * 1000, 10)

/** Relaxed: 30 req/min — for stats sync/game */
export const rateLimitStats = createLimiter(60 * 1000, 30)
