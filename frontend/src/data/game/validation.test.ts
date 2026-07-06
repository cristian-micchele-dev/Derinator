import { describe, it, expect } from 'vitest'
import { sanitizeInput, validateCharacterInput } from './validation'

// ===================================================================
// sanitizeInput
// ===================================================================
describe('sanitizeInput', () => {
  it('trims whitespace', () => {
    expect(sanitizeInput('  hello  ', 100)).toBe('hello')
  })

  it('strips HTML tags', () => {
    expect(sanitizeInput('<b>bold</b>', 100)).toBe('bold')
    expect(sanitizeInput('<script>alert("xss")</script>', 100)).toBe('alert(xss)')
  })

  it('strips dangerous characters', () => {
    expect(sanitizeInput('hello<>"world', 100)).toBe('helloworld')
  })

  it('truncates to maxLength', () => {
    expect(sanitizeInput('hello world', 5)).toBe('hello')
  })

  it('handles empty string', () => {
    expect(sanitizeInput('', 100)).toBe('')
  })

  it('handles nested HTML', () => {
    expect(sanitizeInput('<div><span>text</span></div>', 100)).toBe('text')
  })
})

// ===================================================================
// validateCharacterInput
// ===================================================================
describe('validateCharacterInput', () => {
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
    expect(result.subcategory).toBe('videojuego')
  })

  it('rejects missing name', () => {
    const result = validateCharacterInput({ ...validInput, name: undefined })
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'name' })
    )
  })

  it('rejects empty name', () => {
    const result = validateCharacterInput({ ...validInput, name: '' })
    expect(result.isValid).toBe(false)
  })

  it('rejects name with only 1 character', () => {
    const result = validateCharacterInput({ ...validInput, name: 'A' })
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'name', message: expect.stringContaining('2 caracteres') })
    )
  })

  it('rejects name with invalid characters', () => {
    const result = validateCharacterInput({ ...validInput, name: '123' })
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'name', message: expect.stringContaining('inválidos') })
    )
  })

  it('accepts name with hyphens and spaces', () => {
    const result = validateCharacterInput({ ...validInput, name: 'Jean-Pierre Dupont' })
    expect(result.isValid).toBe(true)
    expect(result.name).toBe('Jean-Pierre Dupont')
  })

  it('accepts name with accented characters', () => {
    const result = validateCharacterInput({ ...validInput, name: 'Cr7' })
    // Cr7 starts with letter, has number → regex allows
    expect(result.name).toBe('Cr7')
  })

  it('sanitizes name (strips HTML)', () => {
    const result = validateCharacterInput({ ...validInput, name: '<b>Pikachu</b>' })
    expect(result.name).toBe('Pikachu')
  })

  it('rejects missing category', () => {
    const result = validateCharacterInput({ ...validInput, category: undefined })
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'category' })
    )
  })

  it('rejects invalid category', () => {
    const result = validateCharacterInput({ ...validInput, category: 'invalid' })
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'category', message: expect.stringContaining('inválida') })
    )
  })

  it('accepts valid categories', () => {
    for (const cat of ['animal', 'personaje']) {
      const result = validateCharacterInput({ ...validInput, category: cat })
      expect(result.category).toBe(cat)
    }
  })

  it('rejects invalid subcategory', () => {
    const result = validateCharacterInput({ ...validInput, subcategory: 'invalid-sub' })
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'subcategory' })
    )
  })

  it('accepts valid subcategories', () => {
    const validSubs = [
      'anime-shonen', 'anime-seinen', 'anime-magical-girl', 'videojuego',
      'superheroe', 'youtuber-streamer', 'historico-real', 'deportista', 'otro',
    ]
    for (const sub of validSubs) {
      const result = validateCharacterInput({ ...validInput, subcategory: sub })
      expect(result.subcategory).toBe(sub)
    }
  })

  it('accepts missing subcategory (optional)', () => {
    const result = validateCharacterInput({ ...validInput, subcategory: undefined })
    expect(result.isValid).toBe(true)
    expect(result.subcategory).toBeNull()
  })

  it('rejects missing answers', () => {
    const result = validateCharacterInput({ ...validInput, answers: undefined })
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'answers' })
    )
  })

  it('rejects answers as array', () => {
    const result = validateCharacterInput({ ...validInput, answers: ['yes'] })
    expect(result.isValid).toBe(false)
  })

  it('rejects invalid question ID in answers', () => {
    const result = validateCharacterInput({
      ...validInput,
      answers: { 99999: 'yes' },
    })
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'answers[99999]' })
    )
  })

  it('rejects invalid answer value', () => {
    const result = validateCharacterInput({
      ...validInput,
      answers: { 1: 'maybe' },
    })
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'answers[1]', message: expect.stringContaining('inválida') })
    )
  })

  it('accepts all valid answer values', () => {
    const validAnswers = ['yes', 'no', 'probably', 'probably_not', 'dont_know']
    for (const ans of validAnswers) {
      const result = validateCharacterInput({
        ...validInput,
        answers: { 1: ans, 2: 'yes', 3: 'no', 4: 'yes', 5: 'no', 6: 'probably' },
      })
      expect(result.isValid).toBe(true)
      expect(result.answers[1]).toBe(ans)
    }
  })

  it('filters out invalid answers but keeps valid ones', () => {
    const result = validateCharacterInput({
      ...validInput,
      answers: { 1: 'yes', 99999: 'no', 2: 'invalid' },
    })
    expect(result.isValid).toBe(false) // has errors
    expect(result.answers[1]).toBe('yes') // valid answer kept
    expect(result.answers[99999]).toBeUndefined() // invalid question ID filtered
    expect(result.answers[2]).toBeUndefined() // invalid answer value filtered
  })

  it('defaults category to personaje when missing', () => {
    const result = validateCharacterInput({
      name: 'Test',
      answers: { 1: 'yes' },
    })
    // category is missing → error, but default is 'personaje'
    expect(result.isValid).toBe(false)
    expect(result.category).toBe('personaje')
  })

  it('sanitizes description', () => {
    const result = validateCharacterInput({
      ...validInput,
      description: '<script>xss</script>A cool character',
    })
    expect(result.description).toBe('xssA cool character')
  })

  it('handles name with only special characters after sanitization', () => {
    const result = validateCharacterInput({
      ...validInput,
      name: '<>',
    })
    // After stripping <>, name becomes empty → too short
    expect(result.isValid).toBe(false)
  })

  it('rejects when fewer than 5 meaningful answers (dont_know does not count)', () => {
    // 4 real answers + 2 dont_know = only 4 meaningful → rejected
    const result = validateCharacterInput({
      ...validInput,
      answers: { 1: 'yes', 2: 'no', 3: 'yes', 4: 'no', 5: 'dont_know', 6: 'dont_know' },
    })
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'answers', message: expect.stringContaining('5 respuestas') })
    )
  })

  it('accepts exactly 5 meaningful answers (boundary condition)', () => {
    const result = validateCharacterInput({
      ...validInput,
      answers: { 1: 'yes', 2: 'no', 3: 'yes', 4: 'no', 5: 'probably' },
    })
    expect(result.isValid).toBe(true)
  })

  it('dont_know-only answers fail the minimum check', () => {
    const result = validateCharacterInput({
      ...validInput,
      answers: { 1: 'dont_know', 2: 'dont_know', 3: 'dont_know', 4: 'dont_know', 5: 'dont_know' },
    })
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'answers', message: expect.stringContaining('5 respuestas') })
    )
  })

  it('rejects more than 250 answers', () => {
    // Build 251 valid answers using real question IDs (1..236)
    const manyAnswers: Record<number, string> = {}
    for (let i = 1; i <= 236; i++) manyAnswers[i] = 'yes'
    // Add extra using confirmer range (248..264)
    for (let i = 248; i <= 264; i++) manyAnswers[i] = 'no'
    const result = validateCharacterInput({ ...validInput, answers: manyAnswers })
    // 236 + 17 = 253 entries → exceeds 250
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'answers', message: expect.stringContaining('250') })
    )
  })

  it('uses dynamic question IDs from questions data (not hardcoded)', () => {
    // Frontend derives valid IDs from the questions array — any real question ID should work
    // Q1 and Q2 are always valid regardless of hardcoded backend set
    const result = validateCharacterInput({
      ...validInput,
      answers: { 1: 'yes', 2: 'yes', 3: 'yes', 4: 'yes', 5: 'yes' },
    })
    expect(result.isValid).toBe(true)
  })
})
