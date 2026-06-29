import { Request, Response, NextFunction } from 'express'

interface RateLimitEntry {
  count: number
  resetTime: number
}

const requests = new Map<string, RateLimitEntry>()
const WINDOW_MS = 60 * 1000 // 1 minute
const MAX_REQUESTS = 10 // 10 requests per minute
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000 // clean expired entries every 5 minutes

// Prevent memory leak — remove entries whose window has already expired
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of requests.entries()) {
    if (now > entry.resetTime) requests.delete(key)
  }
}, CLEANUP_INTERVAL_MS).unref()

export function rateLimit(req: Request, res: Response, next: NextFunction): void {
  const key = req.ip || 'unknown'
  const now = Date.now()

  const entry = requests.get(key)
  if (!entry || now > entry.resetTime) {
    requests.set(key, { count: 1, resetTime: now + WINDOW_MS })
    res.setHeader('X-RateLimit-Remaining', MAX_REQUESTS - 1)
    next()
    return
  }

  if (entry.count >= MAX_REQUESTS) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
    res.setHeader('Retry-After', retryAfter)
    res.status(429).json({ error: 'Too many requests, please try again later' })
    return
  }

  entry.count++
  res.setHeader('X-RateLimit-Remaining', MAX_REQUESTS - entry.count)
  next()
}
