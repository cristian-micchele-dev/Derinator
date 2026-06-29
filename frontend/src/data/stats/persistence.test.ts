// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getFingerprint,
  saveGameState,
  loadGameState,
  clearGameState,
  hasSeenOnboarding,
  markOnboardingSeen,
} from './persistence'
import { GAME_STATE_KEY } from './types'
import { saveStats, getDefaultStats } from './gameStats'

// Mock the API module — persistence.ts uses dynamic import('../api/api')
vi.mock('../api/api', () => ({
  syncStats: vi.fn().mockResolvedValue({}),
  fetchStats: vi.fn(),
}))

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
  vi.useRealTimers()
})

// ===================================================================
// getFingerprint
// ===================================================================
describe('getFingerprint', () => {
  it('generates and persists a fingerprint', () => {
    const fp1 = getFingerprint()
    expect(fp1).toBeTruthy()
    expect(fp1.length).toBeGreaterThan(10)
    // Second call returns same value
    expect(getFingerprint()).toBe(fp1)
  })
})

// ===================================================================
// saveGameState / loadGameState / clearGameState
// ===================================================================
describe('game state persistence', () => {
  const mockState = {
    history: [{ questionId: 1, answer: 'yes' as const }],
    selectedCategory: 'all',
    gameState: 'playing' as const,
    timestamp: Date.now(),
  }

  it('saveGameState persists to localStorage', () => {
    saveGameState(mockState)
    const stored = JSON.parse(localStorage.getItem(GAME_STATE_KEY)!)
    expect(stored).toEqual(mockState)
  })

  it('loadGameState returns saved state', () => {
    saveGameState(mockState)
    expect(loadGameState()).toEqual(mockState)
  })

  it('loadGameState returns null when nothing saved', () => {
    expect(loadGameState()).toBeNull()
  })

  it('loadGameState returns null when state is older than 24h', () => {
    const oldState = {
      ...mockState,
      timestamp: Date.now() - 25 * 60 * 60 * 1000,
    }
    saveGameState(oldState)
    expect(loadGameState()).toBeNull()
    expect(localStorage.getItem(GAME_STATE_KEY)).toBeNull()
  })

  it('loadGameState returns state saved 23h ago (within TTL)', () => {
    const recentState = {
      ...mockState,
      timestamp: Date.now() - 23 * 60 * 60 * 1000,
    }
    saveGameState(recentState)
    expect(loadGameState()).toEqual(recentState)
  })

  it('loadGameState returns null when stored data is corrupted', () => {
    localStorage.setItem(GAME_STATE_KEY, 'not json')
    expect(loadGameState()).toBeNull()
  })

  it('clearGameState removes the key', () => {
    saveGameState(mockState)
    clearGameState()
    expect(localStorage.getItem(GAME_STATE_KEY)).toBeNull()
  })
})

// ===================================================================
// Onboarding
// ===================================================================
describe('onboarding', () => {
  it('hasSeenOnboarding returns false by default', () => {
    expect(hasSeenOnboarding()).toBe(false)
  })

  it('markOnboardingSeen persists and hasSeenOnboarding returns true', () => {
    markOnboardingSeen()
    expect(hasSeenOnboarding()).toBe(true)
  })
})

// ===================================================================
// syncToServer (mocked API)
// ===================================================================
describe('syncToServer', () => {
  it('does not throw when API call succeeds', async () => {
    const { syncToServer } = await import('./persistence')
    await expect(syncToServer()).resolves.toBeUndefined()
  })
})

// ===================================================================
// loadFromServer (mocked API)
// ===================================================================
describe('loadFromServer', () => {
  it('returns false when API returns success: false', async () => {
    const { fetchStats } = await import('../api/api')
    vi.mocked(fetchStats).mockResolvedValueOnce({ success: false })

    const { loadFromServer } = await import('./persistence')
    const result = await loadFromServer()
    expect(result).toBe(false)
  })

  it('merges server stats with local when server has higher values', async () => {
    const localStats = getDefaultStats()
    localStats.derinatorWins = 2
    localStats.userWins = 5
    saveStats(localStats)

    const { fetchStats } = await import('../api/api')
    vi.mocked(fetchStats).mockResolvedValueOnce({
      success: true,
      data: {
        derinator_wins: 10,
        user_wins: 3,
        current_streak: 0,
        best_streak: 8,
        total_games: 20,
        achievements: [],
        hall_of_fame: [],
        daily_guessed: false,
        daily_guesses: 0,
      },
    })

    const { loadFromServer } = await import('./persistence')
    const result = await loadFromServer()
    expect(result).toBe(true)

    // Check merged stats: local wins when higher, server wins when higher
    const { loadStats } = await import('./gameStats')
    const merged = loadStats()
    expect(merged.derinatorWins).toBe(10) // server higher
    expect(merged.userWins).toBe(5) // local higher
    expect(merged.bestStreak).toBe(8) // server higher
  })

  it('returns false when fetchStats throws', async () => {
    const { fetchStats } = await import('../api/api')
    vi.mocked(fetchStats).mockRejectedValueOnce(new Error('Network error'))

    const { loadFromServer } = await import('./persistence')
    const result = await loadFromServer()
    expect(result).toBe(false)
  })
})
