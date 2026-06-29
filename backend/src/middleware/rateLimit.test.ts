import { describe, it, expect, beforeEach, vi } from 'vitest'
import { rateLimit } from './rateLimit'
import { Request, Response, NextFunction } from 'express'

// Mock request/response helpers
function createReq(ip = '127.0.0.1'): Request {
  return { ip } as Request
}

function createRes(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
  } as unknown as Response
  return res
}

function createNext(): NextFunction {
  return vi.fn() as unknown as NextFunction
}

describe('rateLimit', () => {
  beforeEach(() => {
    // Reset the internal Map by importing fresh — but since it's module-level,
    // we just test that it works within a single test
  })

  it('allows first request', () => {
    const req = createReq('test-ip-1')
    const res = createRes()
    const next = createNext()

    rateLimit(req, res, next)
    expect(next).toHaveBeenCalled()
  })

  it('allows requests within limit', () => {
    const ip = 'test-ip-within-limit'
    for (let i = 0; i < 9; i++) {
      const req = createReq(ip)
      const res = createRes()
      const next = createNext()
      rateLimit(req, res, next)
      expect(next).toHaveBeenCalled()
    }
  })

  it('blocks request over limit', () => {
    const ip = 'test-ip-over-limit'
    // Send 10 requests (the limit)
    for (let i = 0; i < 10; i++) {
      const req = createReq(ip)
      const res = createRes()
      const next = createNext()
      rateLimit(req, res, next)
    }

    // 11th request should be blocked
    const req = createReq(ip)
    const res = createRes()
    const next = createNext()
    rateLimit(req, res, next)

    expect(res.status).toHaveBeenCalledWith(429)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('Too many') })
    )
    expect(next).not.toHaveBeenCalled()
  })

  it('uses default IP when req.ip is undefined', () => {
    const req = { ip: undefined } as unknown as Request
    const res = createRes()
    const next = createNext()

    rateLimit(req, res, next)
    expect(next).toHaveBeenCalled()
  })
})
