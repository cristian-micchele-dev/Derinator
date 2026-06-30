import { describe, it, expect, beforeEach } from 'vitest'
import {
  getDefaultStats,
  loadStats,
  saveStats,
  recordDerinatorWin,
  recordUserWin,
  recordDefeatedBy,
  getTopGuessedCharacters,
  getStatsDisplay,
} from './gameStats'
import { STATS_KEY } from './types'

beforeEach(() => {
  localStorage.clear()
})

// ===================================================================
// getDefaultStats
// ===================================================================
describe('getDefaultStats', () => {
  it('returns zeroed stats with empty structure', () => {
    const stats = getDefaultStats()
    expect(stats.derinatorWins).toBe(0)
    expect(stats.userWins).toBe(0)
    expect(stats.currentStreak).toBe(0)
    expect(stats.bestStreak).toBe(0)
    expect(stats.totalGames).toBe(0)
    expect(stats.mostDefeatedCharacter).toBe('')
    expect(stats.mostDefeatedCount).toBe(0)
    expect(stats.characterGuessCounts).toEqual({})
  })
})

// ===================================================================
// loadStats / saveStats
// ===================================================================
describe('loadStats', () => {
  it('returns defaults when localStorage is empty', () => {
    expect(loadStats()).toEqual(getDefaultStats())
  })

  it('merges stored data with defaults (forward-compatible)', () => {
    localStorage.setItem(STATS_KEY, JSON.stringify({ derinatorWins: 3 }))
    const stats = loadStats()
    expect(stats.derinatorWins).toBe(3)
    expect(stats.userWins).toBe(0) // default
    expect(stats.characterGuessCounts).toEqual({})
  })

  it('returns defaults when stored data is corrupted', () => {
    localStorage.setItem(STATS_KEY, '{invalid json')
    expect(loadStats()).toEqual(getDefaultStats())
  })
})

describe('saveStats', () => {
  it('persists stats to localStorage', () => {
    const stats = getDefaultStats()
    stats.derinatorWins = 5
    saveStats(stats)
    expect(JSON.parse(localStorage.getItem(STATS_KEY)!)).toEqual(stats)
  })
})

// ===================================================================
// recordDerinatorWin
// ===================================================================
describe('recordDerinatorWin', () => {
  it('increments derinatorWins, streak, and totalGames', () => {
    recordDerinatorWin('Goku')
    const stats = loadStats()
    expect(stats.derinatorWins).toBe(1)
    expect(stats.currentStreak).toBe(1)
    expect(stats.bestStreak).toBe(1)
    expect(stats.totalGames).toBe(1)
  })

  it('tracks character guess counts', () => {
    recordDerinatorWin('Goku')
    recordDerinatorWin('Goku')
    recordDerinatorWin('Naruto')
    const stats = loadStats()
    expect(stats.characterGuessCounts['Goku']).toBe(2)
    expect(stats.characterGuessCounts['Naruto']).toBe(1)
  })

  it('updates bestStreak when current streak is higher', () => {
    recordDerinatorWin('A')
    recordDerinatorWin('B')
    recordDerinatorWin('C')
    const stats = loadStats()
    expect(stats.bestStreak).toBe(3)
  })

  it('handles empty character name gracefully', () => {
    recordDerinatorWin('')
    const stats = loadStats()
    expect(stats.derinatorWins).toBe(1)
    expect(stats.characterGuessCounts).toEqual({})
  })
})

// ===================================================================
// recordUserWin
// ===================================================================
describe('recordUserWin', () => {
  it('increments userWins and totalGames, resets streak', () => {
    recordDerinatorWin('A') // streak = 1
    recordUserWin()
    const stats = loadStats()
    expect(stats.userWins).toBe(1)
    expect(stats.currentStreak).toBe(0)
    expect(stats.totalGames).toBe(2)
  })
})

// ===================================================================
// recordDefeatedBy
// ===================================================================
describe('recordDefeatedBy', () => {
  it('sets mostDefeatedCharacter when none set', () => {
    recordDefeatedBy('Goku')
    const stats = loadStats()
    expect(stats.mostDefeatedCharacter).toBe('Goku')
    expect(stats.mostDefeatedCount).toBe(1)
  })

  it('tracks most defeated across multiple characters', () => {
    recordDefeatedBy('Goku')
    recordDefeatedBy('Naruto')
    recordDefeatedBy('Naruto')
    const stats = loadStats()
    expect(stats.mostDefeatedCharacter).toBe('Naruto')
    expect(stats.mostDefeatedCount).toBe(2)
  })
})

// ===================================================================
// getTopGuessedCharacters
// ===================================================================
describe('getTopGuessedCharacters', () => {
  it('returns empty array when no games played', () => {
    expect(getTopGuessedCharacters()).toEqual([])
  })

  it('returns characters sorted by count descending', () => {
    recordDerinatorWin('Goku')
    recordDerinatorWin('Goku')
    recordDerinatorWin('Naruto')
    const top = getTopGuessedCharacters()
    expect(top[0]).toEqual({ name: 'Goku', count: 2 })
    expect(top[1]).toEqual({ name: 'Naruto', count: 1 })
  })

  it('respects limit parameter', () => {
    recordDerinatorWin('A')
    recordDerinatorWin('B')
    recordDerinatorWin('C')
    expect(getTopGuessedCharacters(2)).toHaveLength(2)
  })
})

// ===================================================================
// getStatsDisplay
// ===================================================================
describe('getStatsDisplay', () => {
  it('returns empty string when no games played', () => {
    expect(getStatsDisplay()).toBe('')
  })

  it('returns formatted stats string', () => {
    recordDerinatorWin('Goku')
    recordUserWin()
    const display = getStatsDisplay()
    expect(display).toContain('Derinator: 1')
    expect(display).toContain('Me derrotaron: 1')
  })
})
