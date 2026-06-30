import rateLimit from 'express-rate-limit'

/** Strict: 10 req/min — for character learning */
export const rateLimitLearn = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
})

/** Relaxed: 30 req/min — for stats sync/game */
export const rateLimitStats = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
})
