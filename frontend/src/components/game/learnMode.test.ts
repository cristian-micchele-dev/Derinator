import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Answer } from '../../types'
import type { QuestionId } from '../../data/questions'

vi.mock('../../data/characters', () => ({
  getAllCharacters: vi.fn(() => []),
}))

vi.mock('../../data/game', () => ({
  getQuestionWeight: vi.fn(() => 1.0),
  getContradictedQuestions: vi.fn(() => new Set()),
  prerequisitesStrictMet: vi.fn(() => true),
  isExcluded: vi.fn(() => false),
}))

import { detectLearnContradictions, findSimilarCharacter } from '../../data/game/learnModeValidation'
import { applyExclusiveGroups, getRemainingQuestions, getLearnQuestion } from '../../data/game/learnModeLogic'
import { getAllCharacters } from '../../data/characters'
import { getContradictedQuestions } from '../../data/game'

const mockedGetAllCharacters = vi.mocked(getAllCharacters)
const mockedGetContradictedQuestions = vi.mocked(getContradictedQuestions)

// ===== detectLearnContradictions =====

describe('detectLearnContradictions', () => {
  it('returns empty array when no contradictions', () => {
    expect(detectLearnContradictions({ 52: 'yes', 53: 'no' })).toEqual([])
  })

  it('detects mujer + hombre simultaneously', () => {
    const errors = detectLearnContradictions({ 52: 'yes', 53: 'yes' })
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatch(/mujer.*hombre|hombre.*mujer/)
  })

  it('detects animal + humano contradiction', () => {
    const errors = detectLearnContradictions({ 1: 'yes', 2: 'yes', 3: 'yes' })
    expect(errors.some(e => e.includes('animal') && e.includes('humano'))).toBe(true)
  })

  it('detects volar + acuatico contradiction', () => {
    const errors = detectLearnContradictions({ 6: 'yes', 7: 'yes' })
    expect(errors.length).toBeGreaterThan(0)
  })

  it('detects grande + pequeño contradiction', () => {
    const errors = detectLearnContradictions({ 11: 'yes', 12: 'yes' })
    expect(errors.length).toBeGreaterThan(0)
  })

  it('detects rápido + lento contradiction', () => {
    const errors = detectLearnContradictions({ 33: 'yes', 34: 'yes' })
    expect(errors.length).toBeGreaterThan(0)
  })

  it('detects multiple professions', () => {
    const errors = detectLearnContradictions({ 17: 'yes', 18: 'yes' })
    expect(errors.some(e => e.includes('profesiones'))).toBe(true)
  })

  it('allows single profession without error', () => {
    expect(detectLearnContradictions({ 17: 'yes' })).toEqual([])
  })

  it('detects multiple nationalities', () => {
    const errors = detectLearnContradictions({ 16: 'yes', 44: 'yes' })
    expect(errors.some(e => e.includes('nacionalidades'))).toBe(true)
  })

  it('accumulates multiple errors', () => {
    const errors = detectLearnContradictions({ 52: 'yes', 53: 'yes', 11: 'yes', 12: 'yes' })
    expect(errors.length).toBeGreaterThanOrEqual(2)
  })

  it('ignores answers that are not yes', () => {
    // profession check only triggers on 'yes'
    const errors = detectLearnContradictions({ 17: 'probably', 18: 'yes' })
    expect(errors.some(e => e.includes('profesiones'))).toBe(false)
  })
})

// ===== findSimilarCharacter =====

describe('findSimilarCharacter', () => {
  beforeEach(() => mockedGetAllCharacters.mockReset())

  it('returns null when fewer than 5 answers provided', () => {
    mockedGetAllCharacters.mockReturnValue([])
    const answers: Record<number, Answer> = { 1: 'yes', 2: 'yes', 3: 'yes' }
    expect(findSimilarCharacter(answers, 'Test')).toBeNull()
  })

  it('returns null when character database is empty', () => {
    mockedGetAllCharacters.mockReturnValue([])
    const answers: Record<number, Answer> = { 1: 'yes', 2: 'yes', 3: 'yes', 4: 'yes', 5: 'yes' }
    expect(findSimilarCharacter(answers, 'Test')).toBeNull()
  })

  it('skips character with the same name as learnName', () => {
    mockedGetAllCharacters.mockReturnValue([
      { name: 'Test', answers: { 1: 'yes', 2: 'yes', 3: 'yes', 4: 'yes', 5: 'yes' } },
    ] as any)
    const answers: Record<number, Answer> = { 1: 'yes', 2: 'yes', 3: 'yes', 4: 'yes', 5: 'yes' }
    expect(findSimilarCharacter(answers, 'Test')).toBeNull()
  })

  it('returns match when similarity >= 0.75', () => {
    // All 6 answers match → similarity = 1.0
    mockedGetAllCharacters.mockReturnValue([
      { name: 'Similar', answers: { 1: 'yes', 2: 'yes', 3: 'yes', 4: 'yes', 5: 'yes', 6: 'no' } },
    ] as any)
    const answers: Record<number, Answer> = { 1: 'yes', 2: 'yes', 3: 'yes', 4: 'yes', 5: 'yes', 6: 'no' }
    const result = findSimilarCharacter(answers, 'Other')
    expect(result).not.toBeNull()
    expect(result?.name).toBe('Similar')
    expect(result?.similarity).toBeGreaterThanOrEqual(0.75)
  })

  it('returns null when best similarity is below 0.75', () => {
    // Only 1 of 6 answers matches → similarity = 1/6 ≈ 0.17
    mockedGetAllCharacters.mockReturnValue([
      { name: 'Different', answers: { 1: 'yes', 2: 'no', 3: 'no', 4: 'no', 5: 'no', 6: 'yes' } },
    ] as any)
    const answers: Record<number, Answer> = { 1: 'yes', 2: 'yes', 3: 'yes', 4: 'yes', 5: 'yes', 6: 'no' }
    expect(findSimilarCharacter(answers, 'Other')).toBeNull()
  })

  it('returns the best match when multiple candidates exist', () => {
    mockedGetAllCharacters.mockReturnValue([
      { name: 'Weak', answers: { 1: 'yes', 2: 'no', 3: 'no', 4: 'no', 5: 'no', 6: 'no' } },
      { name: 'Strong', answers: { 1: 'yes', 2: 'yes', 3: 'yes', 4: 'yes', 5: 'yes', 6: 'yes' } },
    ] as any)
    const answers: Record<number, Answer> = { 1: 'yes', 2: 'yes', 3: 'yes', 4: 'yes', 5: 'yes', 6: 'yes' }
    const result = findSimilarCharacter(answers, 'Other')
    expect(result?.name).toBe('Strong')
  })
})

// ===== applyExclusiveGroups =====

describe('applyExclusiveGroups', () => {
  it('returns answers unchanged when answer is not yes', () => {
    const answers: Record<number, Answer> = { 154: 'no' }
    expect(applyExclusiveGroups(answers, 154 as QuestionId, 'no')).toEqual(answers)
    expect(applyExclusiveGroups(answers, 154 as QuestionId, 'probably')).toEqual(answers)
  })

  it('returns answers unchanged when question is not in any group', () => {
    const result = applyExclusiveGroups({}, 9999 as QuestionId, 'yes')
    expect(result).toEqual({})
  })

  it('auto-fills siblings with no when a group member answers yes (music genres)', () => {
    // Group: [154, 155, 156, 157]
    const result = applyExclusiveGroups({ 154: 'yes' }, 154 as QuestionId, 'yes')
    expect(result[155]).toBe('no')
    expect(result[156]).toBe('no')
    expect(result[157]).toBe('no')
  })

  it('handles gender group: Q52=yes sets Q53=no', () => {
    const result = applyExclusiveGroups({ 52: 'yes' }, 52 as QuestionId, 'yes')
    expect(result[53]).toBe('no')
  })

  it('does not overwrite siblings that are already answered', () => {
    // Q53 already answered — should not be overwritten
    const answers: Record<number, Answer> = { 52: 'yes', 53: 'yes' }
    const result = applyExclusiveGroups(answers, 52 as QuestionId, 'yes')
    expect(result[53]).toBe('yes')
  })

  it('handles sports group: Q76=yes fills other sport siblings', () => {
    // Group: [76, 187, 188, 189, 190]
    const result = applyExclusiveGroups({ 76: 'yes' }, 76 as QuestionId, 'yes')
    expect(result[187]).toBe('no')
    expect(result[188]).toBe('no')
    expect(result[189]).toBe('no')
    expect(result[190]).toBe('no')
  })
})

// ===== getLearnQuestion =====

describe('getLearnQuestion', () => {
  it('returns the first priority question available in remaining', () => {
    // REAL_PERSON_BASE (default for non-personaje) starts with Q52
    const remaining = [52, 43, 141] as QuestionId[]
    expect(getLearnQuestion(remaining, undefined, 'animal')).toBe(52 as QuestionId)
  })

  it('skips questions not in remaining and picks the next available', () => {
    // Q52 not in remaining → next in REAL_PERSON_BASE is Q43
    const remaining = [43, 141] as QuestionId[]
    expect(getLearnQuestion(remaining, undefined, 'animal')).toBe(43 as QuestionId)
  })

  it('returns null when no priority questions are in remaining', () => {
    const remaining = [9999] as QuestionId[]
    expect(getLearnQuestion(remaining, undefined, 'deportista')).toBeNull()
  })

  it('uses subcategory list when subcategory is provided', () => {
    // deportista list includes Q76 (futbolista)
    const remaining = [76] as QuestionId[]
    expect(getLearnQuestion(remaining, 'deportista', 'animal')).toBe(76 as QuestionId)
  })

  it('falls back to FICTION default for personaje category without subcategory', () => {
    // FICTION_BASE starts with Q52, then Q82 (forma humana)
    // Q52 absent → should return Q82
    const remaining = [82] as QuestionId[]
    expect(getLearnQuestion(remaining, undefined, 'personaje')).toBe(82 as QuestionId)
  })

  it('returns null for empty remaining list', () => {
    expect(getLearnQuestion([], 'actor', 'animal')).toBeNull()
  })
})

// ===== getRemainingQuestions =====

describe('getRemainingQuestions', () => {
  beforeEach(() => {
    mockedGetContradictedQuestions.mockReturnValue(new Set())
  })

  it('returns a non-empty list for empty answers', () => {
    expect(getRemainingQuestions({}).length).toBeGreaterThan(0)
  })

  it('excludes already-answered questions', () => {
    const remaining = getRemainingQuestions({ 1: 'yes', 2: 'yes' })
    expect(remaining).not.toContain(1 as QuestionId)
    expect(remaining).not.toContain(2 as QuestionId)
  })

  it('always excludes LEARN_EXCLUDED questions (12, 95, 234, 186)', () => {
    const remaining = getRemainingQuestions({})
    expect(remaining).not.toContain(12 as QuestionId)
    expect(remaining).not.toContain(95 as QuestionId)
    expect(remaining).not.toContain(234 as QuestionId)
    expect(remaining).not.toContain(186 as QuestionId)
  })

  it('excludes contradicted questions', () => {
    mockedGetContradictedQuestions.mockReturnValue(new Set([10 as QuestionId]))
    const remaining = getRemainingQuestions({})
    expect(remaining).not.toContain(10 as QuestionId)
  })

  it('reduces list as answers accumulate', () => {
    const baseline = getRemainingQuestions({}).length
    const withAnswers = getRemainingQuestions({ 1: 'yes', 2: 'yes', 3: 'yes' }).length
    expect(withAnswers).toBeLessThan(baseline)
  })
})
