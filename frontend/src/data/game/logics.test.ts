import { describe, it, expect } from 'vitest'
import { getConfidenceMetrics, filterCandidates } from './logics'
import { getBestQuestion } from './questionSelection'
import { QuestionId } from '../questions'
import { Answer } from '../../types'

const answers = (entries: Record<number, Answer>): Record<QuestionId, Answer> => {
  const result = {} as Record<QuestionId, Answer>
  for (const [key, value] of Object.entries(entries)) {
    result[Number(key) as QuestionId] = value
  }
  return result
}

const createChar = (id: number, name: string, ans: Record<number, Answer>, score = 0) => ({
  id,
  name,
  description: '',
  answers: answers(ans),
  score,
})

// ===================================================================
// getConfidenceMetrics — currently 0% branch coverage
// ===================================================================
describe('getConfidenceMetrics', () => {
  it('returns shouldGuess=false for empty candidates', () => {
    const result = getConfidenceMetrics([])
    expect(result.shouldGuess).toBe(false)
    expect(result.confidence).toBe(0)
    expect(result.gap).toBe(0)
  })

  it('returns shouldGuess=false when fewer than 5 questions asked', () => {
    const candidates = [
      createChar(1, 'A', { 1: 'yes' }, 0.9),
      createChar(2, 'B', { 1: 'no' }, 0.5),
    ]
    const result = getConfidenceMetrics(candidates, false, 3)
    expect(result.shouldGuess).toBe(false)
  })

  it('returns shouldGuess=true when only 1 candidate (after min questions)', () => {
    const candidates = [createChar(1, 'Solo', { 1: 'yes' }, 1.0)]
    const result = getConfidenceMetrics(candidates, false, 5)
    expect(result.shouldGuess).toBe(true)
    expect(result.confidence).toBe(100)
    expect(result.gap).toBe(1)
  })

  it('guesses when top score >= 0.95 and gap >= 0.40 with 1-2 candidates', () => {
    const candidates = [
      createChar(1, 'Top', { 1: 'yes' }, 0.96),
      createChar(2, 'Second', { 1: 'no' }, 0.50),
    ]
    const result = getConfidenceMetrics(candidates, false, 10)
    expect(result.shouldGuess).toBe(true)
    expect(result.gap).toBeCloseTo(0.46, 2)
  })

  it('does NOT guess when gap is too small with 1-2 candidates', () => {
    const candidates = [
      createChar(1, 'Top', { 1: 'yes' }, 0.96),
      createChar(2, 'Close', { 1: 'no' }, 0.90),
    ]
    const result = getConfidenceMetrics(candidates, false, 10)
    expect(result.shouldGuess).toBe(false)
  })

  it('uses tighter thresholds for 3-5 candidates', () => {
    const candidates = [
      createChar(1, 'A', { 1: 'yes' }, 0.98),
      createChar(2, 'B', { 1: 'no' }, 0.40),
      createChar(3, 'C', { 1: 'no' }, 0.35),
    ]
    const result = getConfidenceMetrics(candidates, false, 10)
    expect(result.shouldGuess).toBe(true)
  })

  it('uses relaxed thresholds after 20+ questions', () => {
    const candidates = [
      createChar(1, 'A', { 1: 'yes' }, 0.86),
      createChar(2, 'B', { 1: 'no' }, 0.50),
      createChar(3, 'C', { 1: 'no' }, 0.45),
    ]
    const result = getConfidenceMetrics(candidates, false, 25)
    expect(result.shouldGuess).toBe(true)
  })

  it('requires higher thresholds for 6-10 candidates', () => {
    const candidates = Array.from({ length: 8 }, (_, i) =>
      createChar(i, `Char${i}`, { 1: i < 4 ? 'yes' : 'no' }, i === 0 ? 0.985 : 0.35)
    )
    const result = getConfidenceMetrics(candidates, false, 15)
    expect(result.shouldGuess).toBe(true)
  })

  it('requires highest thresholds for 11+ candidates', () => {
    const candidates = Array.from({ length: 15 }, (_, i) =>
      createChar(i, `Char${i}`, { 1: i < 3 ? 'yes' : 'no' }, i === 0 ? 0.995 : 0.25)
    )
    const result = getConfidenceMetrics(candidates, false, 20)
    expect(result.shouldGuess).toBe(true)
  })

  it('guesses regardless of thresholds when noMoreQuestions=true', () => {
    const candidates = [
      createChar(1, 'Weak', { 1: 'yes' }, 0.60),
      createChar(2, 'Weaker', { 1: 'no' }, 0.55),
    ]
    const result = getConfidenceMetrics(candidates, true, 3)
    expect(result.shouldGuess).toBe(true)
  })

  it('calculates confidence as weighted average of absolute and relative', () => {
    const candidates = [
      createChar(1, 'Top', { 1: 'yes' }, 0.80),
      createChar(2, 'Second', { 1: 'no' }, 0.40),
    ]
    const result = getConfidenceMetrics(candidates, false, 10)
    // absoluteConfidence = 80, relativeConfidence = min(100, 0.4*200) = 80
    // confidence = round(80*0.6 + 80*0.4) = 80
    expect(result.confidence).toBe(80)
  })
})

// ===================================================================
// getBestQuestion — phased strategy tests
// ===================================================================
describe('getBestQuestion phases', () => {
  const qIds = (ids: number[]): QuestionId[] => ids.map(id => id as QuestionId)

  it('Phase 0: asks "¿Es de ficción?" when mix of fiction and real', () => {
    // 15 candidates: 8 fictional, 7 real
    const candidates = [
      ...Array.from({ length: 8 }, (_, i) =>
        createChar(i, `Fiction${i}`, { 4: 'yes' })
      ),
      ...Array.from({ length: 7 }, (_, i) =>
        createChar(i + 8, `Real${i}`, { 4: 'no' })
      ),
    ]
    const result = getBestQuestion(qIds([4, 16, 56]), candidates)
    expect(result).toBe(4) // "¿Es de ficción?"
  })

  it('Phase 0.5: asks "¿Es un Pokémon?" when multiple Pokémon candidates', () => {
    const candidates = [
      createChar(1, 'Pikachu', { 85: 'yes' }),
      createChar(2, 'Charizard', { 85: 'yes' }),
      createChar(3, 'Bulbasaur', { 85: 'yes' }),
      createChar(4, 'NotPokemon', { 85: 'no' }),
    ]
    const result = getBestQuestion(qIds([85, 161, 162]), candidates)
    expect(result).toBe(85)
  })

  it('Phase 1: forces universe questions when >10 candidates', () => {
    const candidates = Array.from({ length: 15 }, (_, i) =>
      createChar(i, `Char${i}`, { 57: i < 5 ? 'yes' : 'no', 59: i >= 5 ? 'yes' : 'no' })
    )
    const result = getBestQuestion(qIds([57, 59, 16]), candidates)
    // Should pick a universe question (57 or 59), not a nationality question (16)
    expect([57, 59]).toContain(result)
  })

  it('Phase 1.5: drills down to sub-universe after confirming universe', () => {
    const candidates = Array.from({ length: 10 }, (_, i) =>
      createChar(i, `Char${i}`, { 59: 'yes', 84: i < 5 ? 'yes' : 'no' })
    )
    const history = [{ questionId: 59 as QuestionId, answer: 'yes' as Answer }]
    const result = getBestQuestion(qIds([84, 85, 16]), candidates, history)
    expect(result).toBe(84) // Sub-universe: "¿Es de Dragon Ball?"
  })

  it('Phase 1.6: asks Pokémon type after confirming Pokémon', () => {
    const candidates = Array.from({ length: 6 }, (_, i) =>
      createChar(i, `Pokemon${i}`, { 85: 'yes', 161: i < 3 ? 'yes' : 'no' })
    )
    const history = [{ questionId: 85 as QuestionId, answer: 'yes' as Answer }]
    const result = getBestQuestion(qIds([161, 162, 16]), candidates, history)
    expect(result).toBe(161) // Pokémon type question
  })

  it('Phase 2: prefers category/profession questions with 5-10 candidates', () => {
    const candidates = Array.from({ length: 7 }, (_, i) =>
      createChar(i, `Char${i}`, { 1: 'yes', 17: i < 3 ? 'yes' : 'no' })
    )
    const result = getBestQuestion(qIds([1, 17, 100]), candidates)
    // Should prefer category (1) or profession (17) over random (100)
    expect([1, 17]).toContain(result)
  })

  it('Phase 3: falls back to entropy with few candidates', () => {
    const candidates = [
      createChar(1, 'A', { 100: 'yes', 101: 'yes' }),
      createChar(2, 'B', { 100: 'no', 101: 'no' }),
    ]
    const result = getBestQuestion(qIds([100, 101]), candidates)
    expect([100, 101]).toContain(result)
  })
})

// ===================================================================
// filterCandidates — edge cases
// ===================================================================
describe('filterCandidates edge cases', () => {
  it('returns empty array when no candidates match', () => {
    const characters = [
      createChar(1, 'AllNo', { 1: 'no', 2: 'no', 3: 'no' }),
    ]
    const history = [
      { questionId: 1 as QuestionId, answer: 'yes' as Answer },
      { questionId: 2 as QuestionId, answer: 'yes' as Answer },
      { questionId: 3 as QuestionId, answer: 'yes' as Answer },
    ]
    const result = filterCandidates(characters, history)
    // All contradictions → very low score → filtered out
    expect(result.length).toBe(0)
  })

  it('keeps all candidates when history is empty', () => {
    const characters = [
      createChar(1, 'A', { 1: 'yes' }),
      createChar(2, 'B', { 1: 'no' }),
    ]
    const result = filterCandidates(characters, [])
    expect(result.length).toBe(2)
  })

  it('sorts by score descending', () => {
    const characters = [
      createChar(1, 'Bad', { 1: 'no' }),
      createChar(2, 'Good', { 1: 'yes' }),
      createChar(3, 'Medium', { 1: 'probably' }),
    ]
    const history = [{ questionId: 1 as QuestionId, answer: 'yes' as Answer }]
    const result = filterCandidates(characters, history)
    expect(result[0].name).toBe('Good')
    // Bad (direct contradiction) may be filtered out by threshold
    // Medium (slight mismatch) stays
  })
})
