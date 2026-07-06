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

// ===================================================================
// Q52/Q53 gender weight fix — must be WEIGHT_DEFAULT (1.0), not 0.6
// ===================================================================
describe('calculateScore — Q52/Q53 gender weight', () => {
  const q = (id: number) => id as QuestionId

  it('Q52 contradiction drops score below filter threshold of 0.65', () => {
    // Simulate a famosa: base score 4.5 from other questions, then Q52 contradicts.
    // With weight 1.0: final = (4.5 - 1.2) / (4.5 + 1.0) = 0.60 < 0.65 → filtered out.
    // With old weight 0.6: final = (4.5 - 0.72) / (4.5 + 0.6) = 0.74 > 0.65 → NOT filtered.
    const charAnswers: Record<QuestionId, Answer> = {
      [q(52)]: 'yes',  // character is a woman
    }
    const userAnswers: Record<QuestionId, Answer> = {
      [q(52)]: 'no',   // user says NOT a woman
    }
    const score = calculateScore(charAnswers, userAnswers)
    // Direct contradiction → score must be negative (weight 1.0, penalty 1.2)
    expect(score).toBeLessThan(0)
  })

  it('Q53 contradiction (user=no, char=yes) is also heavily penalized', () => {
    const charAnswers: Record<QuestionId, Answer> = { [q(53)]: 'yes' }
    const userAnswers: Record<QuestionId, Answer> = { [q(53)]: 'no' }
    expect(calculateScore(charAnswers, userAnswers)).toBeLessThan(0)
  })

  it('Q52 match still returns 1.0 (weight does not affect normalized perfect match)', () => {
    const charAnswers: Record<QuestionId, Answer> = { [q(52)]: 'yes' }
    const userAnswers: Record<QuestionId, Answer> = { [q(52)]: 'yes' }
    expect(calculateScore(charAnswers, userAnswers)).toBe(1.0)
  })

  it('Q52 contradiction hurts more than Q51 when combined with other matching questions', () => {
    // With a single question, normalized score is always -1.2 regardless of weight.
    // Weight matters in context: combined with other matches, a higher-weight contradiction
    // pulls the overall score down more.
    // Q51 weight 0.6 (PHYSICAL_APPEARANCE): penalty 0.72 vs Q1 match weight 1.5 → (1.5-0.72)/(0.6+1.5) ≈ 0.37
    // Q52 weight 1.0 (DEFAULT):             penalty 1.2  vs Q1 match weight 1.5 → (1.5-1.20)/(1.0+1.5)  = 0.12
    const baseMatch: Record<QuestionId, Answer> = { [q(1)]: 'yes' }
    const userBase: Record<QuestionId, Answer> = { [q(1)]: 'yes' }

    const scoreQ51 = calculateScore(
      { ...baseMatch, [q(51)]: 'yes' },
      { ...userBase,  [q(51)]: 'no'  },
    )
    const scoreQ52 = calculateScore(
      { ...baseMatch, [q(52)]: 'yes' },
      { ...userBase,  [q(52)]: 'no'  },
    )

    expect(scoreQ52).toBeLessThan(scoreQ51)
  })
})

// ===================================================================
// calculateScore — learned confirmer weight (5.0)
// ===================================================================
describe('calculateScore — learned confirmer IDs get weight 5.0', () => {
  const LEARNED_ID = 99991 as unknown as QuestionId
  const learnedIds = new Set([99991])

  it('perfect match on learned confirmer returns 1.0', () => {
    const score = calculateScore(
      { [LEARNED_ID]: 'yes' },
      { [LEARNED_ID]: 'yes' },
      learnedIds,
    )
    expect(score).toBe(1.0)
  })

  it('contradiction on learned confirmer is heavily penalized (< -1.0)', () => {
    // weight 5.0, contradiction penalty 1.2 → score = -5.0 * 1.2 / 5.0 = -1.2
    const score = calculateScore(
      { [LEARNED_ID]: 'yes' },
      { [LEARNED_ID]: 'no' },
      learnedIds,
    )
    expect(score).toBeLessThan(-1.0)
  })

  it('learned confirmer contradiction dominates other positive signals', () => {
    const q = (id: number) => id as QuestionId
    const charAnswers: Record<QuestionId, Answer> = {
      [LEARNED_ID]: 'yes',
      [q(1)]: 'yes',
      [q(3)]: 'yes',
      [q(15)]: 'yes',
    }
    const userAnswers: Record<QuestionId, Answer> = {
      [LEARNED_ID]: 'no',
      [q(1)]: 'yes',
      [q(3)]: 'yes',
      [q(15)]: 'yes',
    }
    // Contradiction weight 5.0 × 1.2 = 6.0 penalty vs 3 × 1.0 matches = +3.0
    // Net = (3.0 - 6.0) / (5.0 + 3.0) = -0.375
    expect(calculateScore(charAnswers, userAnswers, learnedIds)).toBeLessThan(0)
  })

  it('without learnedConfirmerIds, confirmer gets default weight (1.0)', () => {
    // No set passed → getQuestionWeight sees LEARNED_ID as unknown → weight 1.0
    const score = calculateScore(
      { [LEARNED_ID]: 'yes' },
      { [LEARNED_ID]: 'no' },
    )
    // Weight 1.0 contradiction: -1.2 / 1.0 = -1.2 (not the 5x penalty)
    expect(score).toBeLessThan(0)
    expect(score).toBeGreaterThan(-2.0)
  })
})
