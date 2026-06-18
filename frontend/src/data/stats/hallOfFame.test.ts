import { describe, it, expect, beforeEach } from 'vitest'
import { getHallOfFame, addToHallOfFame } from './hallOfFame'
import { HALL_OF_FAME_KEY } from './types'

beforeEach(() => {
  localStorage.clear()
})

// ===================================================================
// getHallOfFame
// ===================================================================
describe('getHallOfFame', () => {
  it('returns empty array when localStorage is empty', () => {
    expect(getHallOfFame()).toEqual([])
  })

  it('returns empty array when stored data is corrupted', () => {
    localStorage.setItem(HALL_OF_FAME_KEY, 'not json')
    expect(getHallOfFame()).toEqual([])
  })

  it('returns empty array when stored data is not an array', () => {
    localStorage.setItem(HALL_OF_FAME_KEY, JSON.stringify({ not: 'array' }))
    expect(getHallOfFame()).toEqual([])
  })
})

// ===================================================================
// addToHallOfFame
// ===================================================================
describe('addToHallOfFame', () => {
  it('adds an entry with current date', () => {
    addToHallOfFame({
      name: 'Goku',
      description: 'Personaje de Dragon Ball',
      questionsCount: 8,
    })
    const hall = getHallOfFame()
    expect(hall).toHaveLength(1)
    expect(hall[0].name).toBe('Goku')
    expect(hall[0].description).toBe('Personaje de Dragon Ball')
    expect(hall[0].questionsCount).toBe(8)
    expect(hall[0].date).toBeDefined()
  })

  it('adds new entries at the beginning (most recent first)', () => {
    addToHallOfFame({ name: 'First', description: '', questionsCount: 5 })
    addToHallOfFame({ name: 'Second', description: '', questionsCount: 3 })
    const hall = getHallOfFame()
    expect(hall[0].name).toBe('Second')
    expect(hall[1].name).toBe('First')
  })

  it('keeps only the last 50 entries', () => {
    for (let i = 0; i < 55; i++) {
      addToHallOfFame({ name: `Char ${i}`, description: '', questionsCount: i })
    }
    const hall = getHallOfFame()
    expect(hall).toHaveLength(50)
    // Most recent first
    expect(hall[0].name).toBe('Char 54')
    expect(hall[49].name).toBe('Char 5')
  })
})
