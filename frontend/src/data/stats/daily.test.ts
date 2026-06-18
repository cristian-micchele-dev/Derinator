import { describe, it, expect, beforeEach } from 'vitest'
import {
  getDailySeed,
  seededRandom,
  getDailyCharacterIndex,
  loadDailyCharacter,
  saveDailyCharacter,
  resetDailyCharacter,
} from './daily'
import { DAILY_CHARACTER_KEY } from './types'

beforeEach(() => {
  localStorage.clear()
})

// ===================================================================
// getDailySeed
// ===================================================================
describe('getDailySeed', () => {
  it('returns a number', () => {
    expect(typeof getDailySeed()).toBe('number')
  })

  it('returns the same seed within the same day', () => {
    const seed1 = getDailySeed()
    const seed2 = getDailySeed()
    expect(seed1).toBe(seed2)
  })

  it('returns an integer', () => {
    expect(Number.isInteger(getDailySeed())).toBe(true)
  })
})

// ===================================================================
// seededRandom
// ===================================================================
describe('seededRandom', () => {
  it('returns a number between 0 and 1', () => {
    const result = seededRandom(12345)
    expect(result).toBeGreaterThanOrEqual(0)
    expect(result).toBeLessThan(1)
  })

  it('is deterministic — same seed gives same result', () => {
    const a = seededRandom(42)
    const b = seededRandom(42)
    expect(a).toBe(b)
  })

  it('different seeds give different results (usually)', () => {
    const a = seededRandom(1)
    const b = seededRandom(2)
    // Not guaranteed but extremely unlikely to be equal
    expect(a).not.toBe(b)
  })
})

// ===================================================================
// getDailyCharacterIndex
// ===================================================================
describe('getDailyCharacterIndex', () => {
  it('returns a valid index within range', () => {
    const index = getDailyCharacterIndex(100)
    expect(index).toBeGreaterThanOrEqual(0)
    expect(index).toBeLessThan(100)
  })

  it('returns the same index when called twice (same day)', () => {
    const a = getDailyCharacterIndex(50)
    const b = getDailyCharacterIndex(50)
    expect(a).toBe(b)
  })

  it('handles small total (1 character)', () => {
    expect(getDailyCharacterIndex(1)).toBe(0)
  })
})

// ===================================================================
// loadDailyCharacter / saveDailyCharacter / resetDailyCharacter
// ===================================================================
describe('daily character persistence', () => {
  const today = new Date().toISOString().split('T')[0]

  it('loadDailyCharacter returns null when empty', () => {
    expect(loadDailyCharacter()).toBeNull()
  })

  it('saveDailyCharacter persists and loadDailyCharacter retrieves', () => {
    saveDailyCharacter({
      characterName: 'Goku',
      date: today,
      guessed: false,
      guesses: 0,
    })
    const loaded = loadDailyCharacter()
    expect(loaded).not.toBeNull()
    expect(loaded!.characterName).toBe('Goku')
    expect(loaded!.date).toBe(today)
  })

  it('loadDailyCharacter returns null when date is not today', () => {
    saveDailyCharacter({
      characterName: 'Goku',
      date: '2020-01-01',
      guessed: true,
      guesses: 3,
    })
    expect(loadDailyCharacter()).toBeNull()
  })

  it('resetDailyCharacter removes the entry', () => {
    saveDailyCharacter({
      characterName: 'Goku',
      date: today,
      guessed: false,
      guesses: 0,
    })
    resetDailyCharacter()
    expect(loadDailyCharacter()).toBeNull()
  })

  it('loadDailyCharacter returns null when stored data is corrupted', () => {
    localStorage.setItem(DAILY_CHARACTER_KEY, 'not json')
    expect(loadDailyCharacter()).toBeNull()
  })
})
