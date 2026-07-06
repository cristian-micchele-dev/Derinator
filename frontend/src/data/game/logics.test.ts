import { describe, it, expect } from 'vitest'
import { getConfidenceMetrics, filterCandidates, applyImplications, getContradictedQuestions, detectFictionHeavy } from './logics'
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

const h = (pairs: [number, Answer][]) =>
  pairs.map(([questionId, answer]) => ({ questionId: questionId as QuestionId, answer }))

// ===================================================================
// applyImplications
// ===================================================================
describe('applyImplications', () => {
  it('returns empty array for empty history', () => {
    expect(applyImplications([])).toHaveLength(0)
  })

  it('preserves original answers in the result', () => {
    const history = h([[3, 'yes']])
    const result = applyImplications(history)
    const q3 = result.find(r => r.questionId === 3)
    expect(q3?.answer).toBe('yes')
  })

  it('derives additional answers from implications (Q4=no expands to 25+ fiction answers)', () => {
    // Q4=no (not fiction) is a famosos seed that implies 25+ fiction-universe "no" answers
    const history = h([[4, 'no']])
    const result = applyImplications(history)
    expect(result.length).toBeGreaterThan(10)
  })

  it('does not overwrite an existing answer with an implied one', () => {
    // If Q2 is explicitly answered 'yes', implication from Q3=yes (es humano → Q2=no)
    // should NOT overwrite the explicit 'yes'
    const history = h([[3, 'yes'], [2, 'yes']])
    const result = applyImplications(history)
    const q2 = result.find(r => r.questionId === 2)
    expect(q2?.answer).toBe('yes')
  })

  it('each entry appears at most once (no duplicate questionIds)', () => {
    const history = h([[4, 'no'], [3, 'yes']])
    const result = applyImplications(history)
    const ids = result.map(r => r.questionId)
    const uniqueIds = new Set(ids)
    expect(ids.length).toBe(uniqueIds.size)
  })
})

// ===================================================================
// getContradictedQuestions
// ===================================================================
describe('getContradictedQuestions', () => {
  it('returns empty set for empty history', () => {
    expect(getContradictedQuestions([])).toBeInstanceOf(Set)
    expect(getContradictedQuestions([]).size).toBe(0)
  })

  it('always excludes answered questions (they should not be re-asked)', () => {
    const history = h([[1, 'yes'], [3, 'no']])
    const result = getContradictedQuestions(history)
    expect(result.has(1 as QuestionId)).toBe(true)
    expect(result.has(3 as QuestionId)).toBe(true)
  })

  it('excludes implied questions (derived from implications)', () => {
    // Q4=no triggers 25+ implications; those derived questions should also be excluded
    const history = h([[4, 'no']])
    const result = getContradictedQuestions(history)
    // At minimum, Q4 itself is excluded
    expect(result.has(4 as QuestionId)).toBe(true)
    // And at least some implied questions should also be excluded
    expect(result.size).toBeGreaterThan(1)
  })

  it('returns a Set (no duplicates)', () => {
    // Even if a question appears in both raw history and implications, result is a Set
    const history = h([[1, 'yes'], [2, 'no'], [3, 'yes']])
    const result = getContradictedQuestions(history)
    expect(result).toBeInstanceOf(Set)
  })
})

// ===================================================================
// detectFictionHeavy
// ===================================================================
describe('detectFictionHeavy', () => {
  const fictionChar = (id: number) => ({
    answers: { [4 as QuestionId]: 'yes' as Answer } as Record<QuestionId, Answer>,
  })
  const realChar = (id: number) => ({
    answers: { [4 as QuestionId]: 'no' as Answer } as Record<QuestionId, Answer>,
  })

  it('returns false for empty candidates', () => {
    expect(detectFictionHeavy([])).toBe(false)
  })

  it('returns true when all candidates are fiction (Q4=yes)', () => {
    const candidates = Array.from({ length: 5 }, (_, i) => fictionChar(i))
    expect(detectFictionHeavy(candidates)).toBe(true)
  })

  it('returns false when all candidates are real people (Q4=no)', () => {
    const candidates = Array.from({ length: 5 }, (_, i) => realChar(i))
    expect(detectFictionHeavy(candidates)).toBe(false)
  })

  it('returns true when >50% are fiction (3 fiction, 2 real)', () => {
    const candidates = [fictionChar(1), fictionChar(2), fictionChar(3), realChar(4), realChar(5)]
    expect(detectFictionHeavy(candidates)).toBe(true)
  })

  it('returns false when exactly 50% are fiction (2 fiction, 2 real)', () => {
    const candidates = [fictionChar(1), fictionChar(2), realChar(3), realChar(4)]
    // ratio = 0.5, threshold is > 0.5, so false
    expect(detectFictionHeavy(candidates)).toBe(false)
  })

  it('also counts anime questions (Q84/Q85) as fiction', () => {
    // Q84 is in fictionQuestions list
    const animeChar = {
      answers: { [84 as QuestionId]: 'yes' as Answer } as Record<QuestionId, Answer>,
    }
    const candidates = Array.from({ length: 4 }, () => animeChar)
    expect(detectFictionHeavy(candidates)).toBe(true)
  })
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
    const history = [
      { questionId: 4 as QuestionId, answer: 'yes' as Answer },  // always seeded
      { questionId: 59 as QuestionId, answer: 'yes' as Answer },
    ]
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

// ===================================================================
// filterCandidates — monotonic pool (pool only shrinks)
// ===================================================================
describe('filterCandidates — monotonic pool behavior', () => {
  it('passing a restricted pool never adds back eliminated candidates', () => {
    const allChars = [
      createChar(1, 'ArgentinoMusico',  { 16: 'yes', 18: 'yes' }),
      createChar(2, 'ArgentinoActor',   { 16: 'yes', 19: 'yes' }),
      createChar(3, 'Estadounidense',   { 16: 'no',  44: 'yes' }),
      createChar(4, 'OtroExtranjero',   { 16: 'no',  44: 'no'  }),
    ]

    // Step 1: filter full pool with Q16=yes (Argentina)
    const h1 = [{ questionId: 16 as QuestionId, answer: 'yes' as Answer }]
    const pool1 = filterCandidates(allChars, h1)
    expect(pool1.map(c => c.id)).toEqual(expect.arrayContaining([1, 2]))
    expect(pool1.map(c => c.id)).not.toContain(3)
    expect(pool1.map(c => c.id)).not.toContain(4)

    // Step 2: filter from pool1 only (not allChars) — chars 3 & 4 cannot re-enter
    const h2 = [
      { questionId: 16 as QuestionId, answer: 'yes' as Answer },
      { questionId: 18 as QuestionId, answer: 'yes' as Answer },
    ]
    const restrictedPool = allChars.filter(c => pool1.some(r => r.id === c.id))
    const pool2 = filterCandidates(restrictedPool, h2)

    expect(pool2.map(c => c.id)).not.toContain(3)
    expect(pool2.map(c => c.id)).not.toContain(4)
    expect(pool2.length).toBeLessThanOrEqual(pool1.length)
  })

  it('re-running filterCandidates on all chars can expand the pool (documents the bug without monotonic pool)', () => {
    // This test documents WHY the monotonic pool fix is needed.
    // If topScore drops, the relative threshold drops, and previously-filtered
    // chars can re-enter if we always filter from allChars.
    const allChars = [
      createChar(1, 'BestMatch',    { 16: 'yes', 44: 'no'  }),
      createChar(2, 'SecondMatch',  { 16: 'yes', 44: 'no'  }),
      createChar(3, 'BadMatch',     { 16: 'no',  44: 'yes' }),
    ]

    // After Q16=yes: char 3 filtered (score < threshold)
    const h1 = [{ questionId: 16 as QuestionId, answer: 'yes' as Answer }]
    const pool1 = filterCandidates(allChars, h1)
    expect(pool1.map(c => c.id)).not.toContain(3)

    // Adding Q44=no: affects scoring but threshold may shift
    const h2 = [
      { questionId: 16 as QuestionId, answer: 'yes' as Answer },
      { questionId: 44 as QuestionId, answer: 'no' as Answer  },
    ]
    // If char 3 still filtered from allChars: pool stays correct
    // If it re-enters: pool expanded (the problem we fixed)
    const poolFromAll = filterCandidates(allChars, h2)
    const poolFromRestricted = filterCandidates(
      allChars.filter(c => pool1.some(r => r.id === c.id)),
      h2,
    )
    // Monotonic pool is always ≤ previous pool size
    expect(poolFromRestricted.length).toBeLessThanOrEqual(pool1.length)
    // And never has more candidates than filtering from all chars
    expect(poolFromRestricted.length).toBeLessThanOrEqual(poolFromAll.length)
  })
})

// ===================================================================
// filterCandidates — famosos scoring uses direct history (not expanded)
// ===================================================================
describe('filterCandidates — famosos scoring without implication inflation', () => {
  it('Q4=no answer filters famosos correctly without inflating all scores', () => {
    // In famosos mode, Q4=no is a seed. If filterCandidates expanded implications,
    // it would derive 25+ fiction-universe 'no' answers that all famosos match equally,
    // inflating every score to ~0.93 and preventing filtering.
    // Using direct history only, Q44=yes (Argentina) correctly separates candidates.
    const famosos = [
      createChar(1, 'Messi',       { 4: 'no', 44: 'no',  16: 'yes' }),
      createChar(2, 'Ronaldo',     { 4: 'no', 44: 'no',  16: 'no'  }),
      createChar(3, 'Taylor Swift',{ 4: 'no', 44: 'yes', 16: 'no'  }),
    ]

    const history = [
      { questionId: 4  as QuestionId, answer: 'no'  as Answer },  // famosos seed
      { questionId: 44 as QuestionId, answer: 'yes' as Answer },  // USA
    ]

    const result = filterCandidates(famosos, history)

    // Taylor Swift (US) should score higher than Messi/Ronaldo (not US)
    expect(result[0].name).toBe('Taylor Swift')
    // Messi and Ronaldo should be filtered out (score below threshold)
    expect(result.map(c => c.id)).not.toContain(1) // Messi
    expect(result.map(c => c.id)).not.toContain(2) // Ronaldo
  })
})
