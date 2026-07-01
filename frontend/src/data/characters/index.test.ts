import { describe, it, expect, vi } from 'vitest'
import { getAllCharactersWithProfiles } from './index'

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

describe('getAllCharactersWithProfiles', () => {
  it('returns characters with profile attached', () => {
    const chars = getAllCharactersWithProfiles()
    expect(chars.length).toBeGreaterThan(0)
    for (const char of chars) {
      expect(char.profile).toBeDefined()
      expect(typeof char.profile).toBe('object')
    }
  })

  it('built-in character explicit "no" maps to 0.05', () => {
    const chars = getAllCharactersWithProfiles()
    // All built-in characters have fillDefaults('no') for unspecified,
    // and explicit 'no' answers also map to 0.05
    const builtIn = chars.find((c) => c.id < 10000)
    expect(builtIn).toBeDefined()
    // Find a question with 'no' answer
    const noQuestionId = Object.entries(builtIn!.answers).find(
      ([, v]) => v === 'no',
    )?.[0]
    if (noQuestionId) {
      expect(builtIn!.profile[Number(noQuestionId) as never]).toBe(0.05)
    }
  })

  it('built-in character explicit "yes" maps to 0.95', () => {
    const chars = getAllCharactersWithProfiles()
    const builtIn = chars.find((c) => c.id < 10000)
    expect(builtIn).toBeDefined()
    const yesQuestionId = Object.entries(builtIn!.answers).find(
      ([, v]) => v === 'yes',
    )?.[0]
    if (yesQuestionId) {
      expect(builtIn!.profile[Number(yesQuestionId) as never]).toBe(0.95)
    }
  })

  it('learned character with partial answers gets 0.5 for missing questions', () => {
    const chars = getAllCharactersWithProfiles()
    const learned = chars.find((c) => c.name === 'Test Learned')
    expect(learned).toBeDefined()
    // Q1 was explicitly 'yes' → but fillLearnedDefaults fills unset with 'dont_know'
    // Q52 was explicitly 'no'
    expect(learned!.profile[52 as never]).toBe(0.05)
    // A question not in the sparse answers should be 'dont_know' → 0.5
    expect(learned!.profile[3 as never]).toBe(0.5)
  })

  it('profile has the same keys for built-in and learned characters', () => {
    const chars = getAllCharactersWithProfiles()
    const builtIn = chars.find((c) => c.id < 10000)
    const learned = chars.find((c) => c.name === 'Test Learned')
    expect(builtIn).toBeDefined()
    expect(learned).toBeDefined()
    const builtInKeys = Object.keys(builtIn!.profile).sort()
    const learnedKeys = Object.keys(learned!.profile).sort()
    expect(builtInKeys).toEqual(learnedKeys)
  })
})
