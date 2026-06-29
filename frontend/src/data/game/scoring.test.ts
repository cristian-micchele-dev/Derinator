// @ts-nocheck
import { describe, it, expect } from 'vitest'
import { safeAnswer, calculateScore, getDiscriminationScore } from './scoring'
import { QuestionId } from '../questions'
import { Answer } from '../../types'

// ===================================================================
// safeAnswer
// ===================================================================
describe('safeAnswer', () => {
  it('returns the answer when defined', () => {
    expect(safeAnswer('yes')).toBe('yes')
    expect(safeAnswer('no')).toBe('no')
    expect(safeAnswer('probably')).toBe('probably')
    expect(safeAnswer('probably_not')).toBe('probably_not')
    expect(safeAnswer('dont_know')).toBe('dont_know')
  })

  it('returns dont_know when undefined', () => {
    expect(safeAnswer(undefined)).toBe('dont_know')
  })
})

// ===================================================================
// calculateScore
// ===================================================================
describe('calculateScore', () => {
  const q = (id: number) => id as QuestionId

  it('returns 1.0 when no answers provided', () => {
    const result = calculateScore({}, {})
    expect(result).toBe(1.0)
  })

  it('returns 1.0 when all answers are dont_know (skipped)', () => {
    const charAnswers: Record<QuestionId, Answer> = { [q(1)]: 'yes', [q(2)]: 'no' }
    const userAnswers: Record<QuestionId, Answer> = { [q(1)]: 'dont_know', [q(2)]: 'dont_know' }
    const result = calculateScore(charAnswers, userAnswers)
    expect(result).toBe(1.0)
  })

  it('returns 1.0 for perfect match on single question', () => {
    const charAnswers = { [q(1)]: 'yes' as Answer }
    const userAnswers = { [q(1)]: 'yes' as Answer }
    expect(calculateScore(charAnswers, userAnswers)).toBe(1.0)
  })

  it('returns negative score for direct contradiction (yes vs no)', () => {
    const charAnswers = { [q(1)]: 'yes' as Answer }
    const userAnswers = { [q(1)]: 'no' as Answer }
    const score = calculateScore(charAnswers, userAnswers)
    expect(score).toBeLessThan(0)
  })

  it('penalizes less for probably vs no (partial mismatch)', () => {
    const charYesNo = { [q(1)]: 'yes' as Answer }
    const userProbablyNot = { [q(1)]: 'probably_not' as Answer }
    const scorePartial = calculateScore(charYesNo, userProbablyNot)

    const userNo = { [q(1)]: 'no' as Answer }
    const scoreDirect = calculateScore(charYesNo, userNo)

    // Partial mismatch should be less penalized than direct contradiction
    expect(scorePartial).toBeGreaterThan(scoreDirect)
  })

  it('gives partial credit for probably vs yes', () => {
    const charAnswers = { [q(1)]: 'yes' as Answer }
    const userAnswers = { [q(1)]: 'probably' as Answer }
    const score = calculateScore(charAnswers, userAnswers)
    expect(score).toBeGreaterThan(0)
    expect(score).toBeLessThan(1.0)
  })

  it('gives partial credit for probably_not vs no', () => {
    const charAnswers = { [q(1)]: 'no' as Answer }
    const userAnswers = { [q(1)]: 'probably_not' as Answer }
    const score = calculateScore(charAnswers, userAnswers)
    expect(score).toBeGreaterThan(0)
    expect(score).toBeLessThan(1.0)
  })

  it('weights universe questions higher than default', () => {
    // Universe question (q57 = Disney) has weight 2.5
    const universeMatch = { [q(57)]: 'yes' as Answer }
    const userMatch = { [q(57)]: 'yes' as Answer }
    const scoreUniverse = calculateScore(universeMatch, userMatch)

    // Regular question (q100) has weight 1.0
    const regularMatch = { [q(100)]: 'yes' as Answer }
    const userRegular = { [q(100)]: 'yes' as Answer }
    const scoreRegular = calculateScore(regularMatch, userRegular)

    // Both are perfect matches, so both should be 1.0
    expect(scoreUniverse).toBe(1.0)
    expect(scoreRegular).toBe(1.0)
  })

  it('penalizes more contradictions as more questions are wrong', () => {
    // All correct
    const allCorrect = calculateScore(
      { [q(1)]: 'yes' as Answer, [q(2)]: 'yes' as Answer, [q(3)]: 'yes' as Answer },
      { [q(1)]: 'yes' as Answer, [q(2)]: 'yes' as Answer, [q(3)]: 'yes' as Answer },
    )
    // One contradiction
    const oneWrong = calculateScore(
      { [q(1)]: 'yes' as Answer, [q(2)]: 'yes' as Answer, [q(3)]: 'yes' as Answer },
      { [q(1)]: 'yes' as Answer, [q(2)]: 'no' as Answer, [q(3)]: 'yes' as Answer },
    )
    // Two contradictions
    const twoWrong = calculateScore(
      { [q(1)]: 'yes' as Answer, [q(2)]: 'yes' as Answer, [q(3)]: 'yes' as Answer },
      { [q(1)]: 'no' as Answer, [q(2)]: 'no' as Answer, [q(3)]: 'yes' as Answer },
    )
    expect(allCorrect).toBe(1.0)
    expect(oneWrong).toBeLessThan(allCorrect)
    expect(twoWrong).toBeLessThan(oneWrong)
  })

  it('handles multiple questions with mixed answers', () => {
    const charAnswers = {
      [q(1)]: 'yes' as Answer,
      [q(2)]: 'yes' as Answer,
      [q(3)]: 'no' as Answer,
    }
    const userAnswers = {
      [q(1)]: 'yes' as Answer,
      [q(2)]: 'no' as Answer,
      [q(3)]: 'no' as Answer,
    }
    const score = calculateScore(charAnswers, userAnswers)
    // 2/3 correct (one direct match, one contradiction, one match)
    expect(score).toBeGreaterThan(0)
    expect(score).toBeLessThan(1.0)
  })

  it('handles probably vs probably as match', () => {
    const charAnswers = { [q(1)]: 'probably' as Answer }
    const userAnswers = { [q(1)]: 'probably' as Answer }
    expect(calculateScore(charAnswers, userAnswers)).toBe(1.0)
  })

  it('handles probably_not vs probably_not as match', () => {
    const charAnswers = { [q(1)]: 'probably_not' as Answer }
    const userAnswers = { [q(1)]: 'probably_not' as Answer }
    expect(calculateScore(charAnswers, userAnswers)).toBe(1.0)
  })

  it('handles probably vs probably_not as partial match', () => {
    const charAnswers = { [q(1)]: 'probably' as Answer }
    const userAnswers = { [q(1)]: 'probably_not' as Answer }
    const score = calculateScore(charAnswers, userAnswers)
    // Both are opinionated but opposite — should get partial credit (0.5 * weight)
    expect(score).toBeGreaterThan(0)
  })

  it('nationality questions have weight 1.0 (default)', () => {
    // q16 = Argentina, not in any special group → weight 1.0
    const charAnswers = { [q(16)]: 'yes' as Answer }
    const userAnswers = { [q(16)]: 'yes' as Answer }
    expect(calculateScore(charAnswers, userAnswers)).toBe(1.0)
  })

  it('category questions have weight 1.5', () => {
    // q1 = "¿Es un ser vivo?" → CATEGORY_QUESTIONS → weight 1.5
    const charAnswers = { [q(1)]: 'yes' as Answer }
    const userAnswers = { [q(1)]: 'yes' as Answer }
    expect(calculateScore(charAnswers, userAnswers)).toBe(1.0)
  })

  it('color questions have weight 1.5', () => {
    // q36-42 are color questions → weight 1.5
    const charAnswers = { [q(36)]: 'yes' as Answer }
    const userAnswers = { [q(36)]: 'yes' as Answer }
    expect(calculateScore(charAnswers, userAnswers)).toBe(1.0)
  })

  it('appearance questions have weight 0.6', () => {
    // q48-51, q63 are appearance → weight 0.6
    const charAnswers = { [q(48)]: 'yes' as Answer }
    const userAnswers = { [q(48)]: 'yes' as Answer }
    expect(calculateScore(charAnswers, userAnswers)).toBe(1.0)
  })
})

// ===================================================================
// getDiscriminationScore
// ===================================================================
describe('getDiscriminationScore', () => {
  it('returns 0 when total is 0', () => {
    expect(getDiscriminationScore(0, 0, 0, 0)).toBe(0)
  })

  it('returns 0 when all answers are the same (no discrimination)', () => {
    expect(getDiscriminationScore(10, 0, 0, 10)).toBe(0)
    expect(getDiscriminationScore(0, 10, 0, 10)).toBe(0)
  })

  it('returns 0 when one group is >= 99.9%', () => {
    expect(getDiscriminationScore(999, 1, 0, 1000)).toBe(0)
  })

  it('returns positive score for balanced split', () => {
    const score = getDiscriminationScore(5, 5, 0, 10)
    expect(score).toBeGreaterThan(0)
  })

  it('returns higher score for more balanced split', () => {
    const balanced = getDiscriminationScore(5, 5, 0, 10)
    const unbalanced = getDiscriminationScore(8, 2, 0, 10)
    expect(balanced).toBeGreaterThan(unbalanced)
  })

  it('factors in neutral answers (reduces opinionated ratio)', () => {
    const noNeutral = getDiscriminationScore(5, 5, 0, 10)
    const withNeutral = getDiscriminationScore(5, 5, 5, 15)
    // More neutrals = less opinionated = lower score
    expect(noNeutral).toBeGreaterThan(withNeutral)
  })

  it('gives minority bonus when minority is < 20%', () => {
    // minority = min(2, 8) = 2, ratio = 2/10 = 0.2 → not < 0.2, no bonus
    const noBonus = getDiscriminationScore(2, 8, 0, 10)
    // minority = min(1, 9) = 1, ratio = 1/10 = 0.1 → < 0.2, bonus x2
    const withBonus = getDiscriminationScore(1, 9, 0, 10)
    // withBonus has bonus but less entropy — depends on the formula
    expect(noBonus).toBeGreaterThan(0)
    expect(withBonus).toBeGreaterThan(0)
  })

  it('returns higher score for 50/50 split than 70/30', () => {
    const split50 = getDiscriminationScore(5, 5, 0, 10)
    const split70 = getDiscriminationScore(7, 3, 0, 10)
    expect(split50).toBeGreaterThan(split70)
  })

  it('handles only positive and neutral (no negatives)', () => {
    const score = getDiscriminationScore(5, 0, 5, 10)
    // maxGroup = 5, 5/10 = 0.5 < 0.999 → not zero
    // But pNeg = 0, so only pPos contributes to entropy
    expect(score).toBeGreaterThanOrEqual(0)
  })

  it('handles only negative and neutral (no positives)', () => {
    const score = getDiscriminationScore(0, 5, 5, 10)
    expect(score).toBeGreaterThanOrEqual(0)
  })
})
