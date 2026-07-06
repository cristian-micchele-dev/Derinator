import { describe, it, expect, vi } from 'vitest'
import { getAllCharacters } from './index'

vi.mock('../learnedStorage', () => ({
  loadLearnedCharacters: vi.fn(() => [
    {
      id: 99999,
      name: 'Test Learned',
      description: 'A test learned character',
      category: 'personaje',
      answers: { 1: 'yes', 52: 'no' },
    },
  ]),
}))

describe('getAllCharacters', () => {
  it('returns built-in and learned characters', () => {
    const chars = getAllCharacters()
    expect(chars.length).toBeGreaterThan(0)
    expect(chars.find((c) => c.name === 'Test Learned')).toBeDefined()
  })

  it('fills missing answers with "no"', () => {
    const chars = getAllCharacters()
    const builtIn = chars.find((c) => c.id < 10000)
    expect(builtIn).toBeDefined()
    expect(typeof builtIn!.answers).toBe('object')
  })
})
