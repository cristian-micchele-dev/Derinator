import { describe, it, expect, vi, beforeEach } from 'vitest'
import { syncStats, fetchStats, recordGame } from './api'
import type { ServerStats } from './api'

// ─── Mock fetch globally ───────────────────────────────────────────
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function mockOk(body: unknown) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  })
}

function mockError(status: number) {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve({ error: 'server error' }),
  })
}

const BASE_STATS: ServerStats = {
  fingerprint: 'test-fp-abc123',
  derinatorWins: 5,
  userWins: 3,
  currentStreak: 2,
  bestStreak: 4,
  totalGames: 8,
  achievements: [],
  hallOfFame: [],
  dailyGuessed: false,
  dailyGuesses: 0,
}

beforeEach(() => {
  mockFetch.mockReset()
})

// ─── syncStats ─────────────────────────────────────────────────────

describe('syncStats', () => {
  it('makes a POST request to /stats/sync', async () => {
    mockFetch.mockImplementationOnce(() => mockOk({ success: true, data: {} }))
    await syncStats(BASE_STATS)
    expect(mockFetch).toHaveBeenCalledOnce()
    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toContain('/stats/sync')
    expect(options.method).toBe('POST')
  })

  it('sends Content-Type: application/json header', async () => {
    mockFetch.mockImplementationOnce(() => mockOk({ success: true, data: {} }))
    await syncStats(BASE_STATS)
    const [, options] = mockFetch.mock.calls[0]
    expect(options.headers['Content-Type']).toBe('application/json')
  })

  it('sends Authorization header when token is provided', async () => {
    mockFetch.mockImplementationOnce(() => mockOk({ success: true, data: {} }))
    await syncStats(BASE_STATS, 'my-token-123')
    const [, options] = mockFetch.mock.calls[0]
    expect(options.headers['Authorization']).toBe('Bearer my-token-123')
  })

  it('does NOT send Authorization header when no token', async () => {
    mockFetch.mockImplementationOnce(() => mockOk({ success: true, data: {} }))
    await syncStats(BASE_STATS)
    const [, options] = mockFetch.mock.calls[0]
    expect(options.headers['Authorization']).toBeUndefined()
  })

  it('serializes stats in the request body', async () => {
    mockFetch.mockImplementationOnce(() => mockOk({ success: true, data: {} }))
    await syncStats(BASE_STATS)
    const [, options] = mockFetch.mock.calls[0]
    const body = JSON.parse(options.body)
    expect(body.fingerprint).toBe('test-fp-abc123')
    expect(body.derinatorWins).toBe(5)
    expect(body.dailyGuessed).toBe(false)
  })

  it('returns the parsed response on success', async () => {
    const serverResponse = { success: true, data: { fingerprint: 'test-fp-abc123' }, player_token: 'tok123' }
    mockFetch.mockImplementationOnce(() => mockOk(serverResponse))
    const result = await syncStats(BASE_STATS)
    expect(result.success).toBe(true)
    expect(result.player_token).toBe('tok123')
  })

  it('throws on non-ok response', async () => {
    mockFetch.mockImplementationOnce(() => mockError(401))
    await expect(syncStats(BASE_STATS)).rejects.toThrow('API error: 401')
  })

  it('throws on 500 error', async () => {
    mockFetch.mockImplementationOnce(() => mockError(500))
    await expect(syncStats(BASE_STATS)).rejects.toThrow('API error: 500')
  })

  it('passes an AbortSignal (timeout support)', async () => {
    mockFetch.mockImplementationOnce(() => mockOk({ success: true, data: {} }))
    await syncStats(BASE_STATS)
    const [, options] = mockFetch.mock.calls[0]
    expect(options.signal).toBeDefined()
    expect(options.signal).toBeInstanceOf(AbortSignal)
  })
})

// ─── fetchStats ────────────────────────────────────────────────────

describe('fetchStats', () => {
  it('makes a GET request to /stats/:fingerprint', async () => {
    mockFetch.mockImplementationOnce(() => mockOk({ success: true, data: {} }))
    await fetchStats('my-fp-001')
    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toContain('/stats/my-fp-001')
    expect(options?.method).toBeUndefined() // GET is implicit
  })

  it('URL-encodes the fingerprint', async () => {
    mockFetch.mockImplementationOnce(() => mockOk({ success: true, data: {} }))
    await fetchStats('fp with spaces')
    const [url] = mockFetch.mock.calls[0]
    expect(url).toContain('fp%20with%20spaces')
    expect(url).not.toContain('fp with spaces')
  })

  it('does not send Authorization header', async () => {
    mockFetch.mockImplementationOnce(() => mockOk({ success: true, data: {} }))
    await fetchStats('my-fp-001')
    const [, options] = mockFetch.mock.calls[0]
    expect(options?.headers?.['Authorization']).toBeUndefined()
  })

  it('returns parsed stats on success', async () => {
    const serverData = { success: true, data: { fingerprint: 'my-fp-001', derinator_wins: 10 } }
    mockFetch.mockImplementationOnce(() => mockOk(serverData))
    const result = await fetchStats('my-fp-001')
    expect(result.success).toBe(true)
    expect(result.data.fingerprint).toBe('my-fp-001')
  })

  it('throws on 404 (player not found)', async () => {
    mockFetch.mockImplementationOnce(() => mockError(404))
    await expect(fetchStats('unknown-fp')).rejects.toThrow('API error: 404')
  })

  it('throws on network error', async () => {
    mockFetch.mockImplementationOnce(() => Promise.reject(new Error('Network failure')))
    await expect(fetchStats('my-fp-001')).rejects.toThrow('Network failure')
  })

  it('passes an AbortSignal (timeout support)', async () => {
    mockFetch.mockImplementationOnce(() => mockOk({ success: true, data: {} }))
    await fetchStats('my-fp-001')
    const [, options] = mockFetch.mock.calls[0]
    expect(options.signal).toBeInstanceOf(AbortSignal)
  })
})

// ─── recordGame ────────────────────────────────────────────────────

describe('recordGame', () => {
  const GAME = {
    characterName: 'Goku',
    result: 'derinator_win' as const,
    questionsCount: 10,
    category: 'personajes',
  }

  it('makes a POST request to /stats/game', async () => {
    mockFetch.mockImplementationOnce(() => mockOk({ success: true }))
    await recordGame('my-fp-001', GAME, 'tok-xyz')
    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toContain('/stats/game')
    expect(options.method).toBe('POST')
  })

  it('sends the Bearer token in Authorization header', async () => {
    mockFetch.mockImplementationOnce(() => mockOk({ success: true }))
    await recordGame('my-fp-001', GAME, 'tok-xyz')
    const [, options] = mockFetch.mock.calls[0]
    expect(options.headers['Authorization']).toBe('Bearer tok-xyz')
  })

  it('sends fingerprint and game data in the body', async () => {
    mockFetch.mockImplementationOnce(() => mockOk({ success: true }))
    await recordGame('my-fp-001', GAME, 'tok-xyz')
    const [, options] = mockFetch.mock.calls[0]
    const body = JSON.parse(options.body)
    expect(body.fingerprint).toBe('my-fp-001')
    expect(body.characterName).toBe('Goku')
    expect(body.result).toBe('derinator_win')
    expect(body.questionsCount).toBe(10)
    expect(body.category).toBe('personajes')
  })

  it('returns success: true on success', async () => {
    mockFetch.mockImplementationOnce(() => mockOk({ success: true }))
    const result = await recordGame('my-fp-001', GAME, 'tok-xyz')
    expect(result.success).toBe(true)
  })

  it('throws on 401 (invalid token)', async () => {
    mockFetch.mockImplementationOnce(() => mockError(401))
    await expect(recordGame('my-fp-001', GAME, 'bad-token')).rejects.toThrow('API error: 401')
  })

  it('throws on 429 (rate limited)', async () => {
    mockFetch.mockImplementationOnce(() => mockError(429))
    await expect(recordGame('my-fp-001', GAME, 'tok-xyz')).rejects.toThrow('API error: 429')
  })
})
