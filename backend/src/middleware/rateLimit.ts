import rateLimit from 'express-rate-limit'
import { createRateLimitStore } from '../infrastructure/stores/rateLimitStore'

// Store is created once at startup.
// Swap out in infrastructure/stores/rateLimitStore.ts (e.g. Redis) without touching this file.
const store = createRateLimitStore()

/** Strict: 10 req/min — for character learning */
export const rateLimitLearn = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
  ...(store ? { store } : {}),
})

/** Relaxed: 30 req/min — for stats sync/game */
export const rateLimitStats = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
  ...(store ? { store } : {}),
})

/** Public: 60 req/min — for unauthenticated GET endpoints (characters list) */
export const rateLimitPublic = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
  ...(store ? { store } : {}),
})
