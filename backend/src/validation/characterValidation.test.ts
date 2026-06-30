import { describe, it, expect } from 'vitest'
import { sanitizeInput, validateCharacterInput } from './characterValidation'

// ===================================================================
// sanitizeInput (backend version)
// ===================================================================
describe('sanitizeInput (backend)', () => {
  it('strips HTML tags', () => {
    expect(sanitizeInput('<b>bold</b>', 100)).toBe('bold')
  })

  it('strips dangerous characters', () => {
    expect(sanitizeInput('hello<>"world', 100)).toBe('helloworld')
  })

  it('truncates to maxLength', () => {
    expect(sanitizeInput('hello world', 5)).toBe('hello')
  })

  it('trims whitespace', () => {
    expect(sanitizeInput('  hello  ', 100)).toBe('hello')
  })
})

// ===================================================================
// validateCharacterInput (backend)
// ===================================================================
describe('validateCharacterInput (backend)', () => {
  const validInput = {
    name: 'Pikachu',
    description: 'Un Pokemon electrico',
    category: 'animal',
    subcategory: 'videojuego',
    answers: { 1: 'yes', 2: 'yes', 4: 'yes', 5: 'no', 6: 'probably' },
  }

  it('returns isValid=true for valid input', () => {
    const result = validateCharacterInput(validInput)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(result.name).toBe('Pikachu')
    expect(result.category).toBe('animal')
  })

  it('rejects missing name', () => {
    const result = validateCharacterInput({ ...validInput, name: undefined })
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.field === 'name')).toBe(true)
  })

  it('rejects short name', () => {
    const result = validateCharacterInput({ ...validInput, name: 'A' })
    expect(result.isValid).toBe(false)
  })

  it('rejects invalid category', () => {
    const result = validateCharacterInput({ ...validInput, category: 'invalid' })
    expect(result.isValid).toBe(false)
  })

  it('rejects invalid subcategory', () => {
    const result = validateCharacterInput({ ...validInput, subcategory: 'invalid' })
    expect(result.isValid).toBe(false)
  })

  it('accepts valid subcategories (disney, nintendo, anime-shonen, etc.)', () => {
    const validSubs = ['disney', 'nintendo', 'anime-shonen', 'anime-seinen', 'videojuego', 'superheroe', 'otro']
    for (const sub of validSubs) {
      const result = validateCharacterInput({ ...validInput, subcategory: sub })
      expect(result.isValid).toBe(true)
      expect(result.subcategory).toBe(sub)
    }
  })

  it('rejects invalid question IDs', () => {
    const result = validateCharacterInput({
      ...validInput,
      answers: { 99999: 'yes' },
    })
    expect(result.isValid).toBe(false)
  })

  it('rejects invalid answer values', () => {
    const result = validateCharacterInput({
      ...validInput,
      answers: { 1: 'maybe' },
    })
    expect(result.isValid).toBe(false)
  })

  it('accepts all valid answer values', () => {
    const validAnswers = ['yes', 'no', 'probably', 'probably_not', 'dont_know']
    for (const ans of validAnswers) {
      const result = validateCharacterInput({
        ...validInput,
        answers: { 1: ans, 2: 'yes', 3: 'no', 4: 'yes', 5: 'no', 6: 'probably' },
      })
      expect(result.isValid).toBe(true)
    }
  })

  it('rejects answers as array', () => {
    const result = validateCharacterInput({
      ...validInput,
      answers: ['yes'],
    })
    expect(result.isValid).toBe(false)
  })

  it('defaults category to personaje when missing', () => {
    const result = validateCharacterInput({
      name: 'Test',
      answers: { 1: 'yes' },
    })
    expect(result.category).toBe('personaje')
  })
})
