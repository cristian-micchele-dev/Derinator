import { describe, it, expect } from 'vitest'
import request from 'supertest'
import express from 'express'
import { rateLimitLearn, rateLimitStats } from './rateLimit'

function makeApp(middleware: express.RequestHandler) {
  const app = express()
  app.set('trust proxy', 1)
  app.get('/test', middleware, (_req, res) => res.status(200).json({ ok: true }))
  return app
}

describe('rateLimitLearn (10 req/min)', () => {
  it('allows requests within the limit', async () => {
    const app = makeApp(rateLimitLearn)
    const res = await request(app).get('/test')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
  })

  it('returns RateLimit-* standard headers', async () => {
    const app = makeApp(rateLimitLearn)
    const res = await request(app).get('/test')
    expect(res.headers).toHaveProperty('ratelimit-limit')
    expect(res.headers).toHaveProperty('ratelimit-remaining')
  })

  it('blocks after exceeding the limit', async () => {
    const app = makeApp(rateLimitLearn)
    // Exhaust all 10 slots
    for (let i = 0; i < 10; i++) {
      await request(app).get('/test').set('X-Forwarded-For', '10.0.0.1')
    }
    const res = await request(app).get('/test').set('X-Forwarded-For', '10.0.0.1')
    expect(res.status).toBe(429)
    expect(res.body).toMatchObject({ error: expect.stringContaining('Too many') })
  })
})

describe('rateLimitStats (30 req/min)', () => {
  it('allows requests within the limit', async () => {
    const app = makeApp(rateLimitStats)
    const res = await request(app).get('/test')
    expect(res.status).toBe(200)
  })

  it('blocks after exceeding the limit', async () => {
    const app = makeApp(rateLimitStats)
    for (let i = 0; i < 30; i++) {
      await request(app).get('/test').set('X-Forwarded-For', '10.0.0.2')
    }
    const res = await request(app).get('/test').set('X-Forwarded-For', '10.0.0.2')
    expect(res.status).toBe(429)
    expect(res.body).toMatchObject({ error: expect.stringContaining('Too many') })
  })
})
