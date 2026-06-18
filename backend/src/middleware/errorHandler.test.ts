import { describe, it, expect, vi } from 'vitest'
import { errorHandler, notFoundHandler } from './errorHandler'
import { Request, Response, NextFunction } from 'express'

function createRes(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response
  return res
}

function getJsonCall(res: Response): Record<string, unknown> {
  return (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0]
}

describe('errorHandler', () => {
  it('returns 500 for generic errors', () => {
    const res = createRes()
    const err = new Error('Something broke')

    errorHandler(err, {} as Request, res, vi.fn() as NextFunction)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Error interno del servidor' })
    )
  })

  it('uses err.status when available', () => {
    const res = createRes()
    const err = Object.assign(new Error('Not found'), { status: 404 })

    errorHandler(err, {} as Request, res, vi.fn() as NextFunction)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Not found' })
    )
  })

  it('includes stack trace in development mode', () => {
    const original = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    const res = createRes()
    const err = new Error('Dev error')

    errorHandler(err, {} as Request, res, vi.fn() as NextFunction)

    const call = getJsonCall(res)
    expect(call.stack).toBeDefined()

    process.env.NODE_ENV = original
  })

  it('excludes stack trace in production mode', () => {
    const original = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    const res = createRes()
    const err = new Error('Prod error')

    errorHandler(err, {} as Request, res, vi.fn() as NextFunction)

    const call = getJsonCall(res)
    expect(call.stack).toBeUndefined()

    process.env.NODE_ENV = original
  })
})

describe('notFoundHandler', () => {
  it('returns 404 with error message', () => {
    const res = createRes()
    notFoundHandler({} as Request, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ error: 'Ruta no encontrada' })
  })
})
