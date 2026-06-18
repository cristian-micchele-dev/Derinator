import { Request, Response, NextFunction } from 'express'

interface RateLimitEntry {
  count: number
  resetTime: number
}

const requests = new Map<string, RateLimitEntry>()
const WINDOW_MS = 60 * 1000 // 1 minute
const MAX_REQUESTS = 10 // 10 requests per minute

export function rateLimit(req: Request, res: Response, next: NextFunction): void {
  const key = req.ip || 'unknown'
  const now = Date.now()

  const entry = requests.get(key)
  if (!entry || now > entry.resetTime) {
    requests.set(key, { count: 1, resetTime: now + WINDOW_MS })
    next()
    return
  }

  if (entry.count >= MAX_REQUESTS) {
    res.status(429).json({ error: 'Too many requests, please try again later' })
    return
  }

  entry.count++
  next()
}
