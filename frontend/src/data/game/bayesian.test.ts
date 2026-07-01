import { describe, it, expect } from 'vitest'
import {
  answerToProbability,
  buildProfile,
  blendProbability,
  ANSWER_TO_PROBABILITY,
  PRIOR_WEIGHT,
} from './bayesian'
import type { Answer } from '../../types'
import type { QuestionId } from '../questions'

describe('answerToProbability', () => {
  it('converts all 5 Answer values correctly', () => {
    expect(answerToProbability('yes')).toBe(0.95)
    expect(answerToProbability('probably')).toBe(0.75)
    expect(answerToProbability('dont_know')).toBe(0.5)
    expect(answerToProbability('probably_not')).toBe(0.25)
    expect(answerToProbability('no')).toBe(0.05)
  })

  it('all results are in [0, 1]', () => {
    const answers: Answer[] = ['yes', 'no', 'probably', 'probably_not', 'dont_know']
    for (const a of answers) {
      const p = answerToProbability(a)
      expect(p).toBeGreaterThanOrEqual(0)
      expect(p).toBeLessThanOrEqual(1)
    }
  })

  it('covers all Answer enum variants', () => {
    const variants: Answer[] = ['yes', 'no', 'probably', 'probably_not', 'dont_know']
    for (const v of variants) {
      expect(ANSWER_TO_PROBABILITY[v]).toBeDefined()
    }
    expect(Object.keys(ANSWER_TO_PROBABILITY)).toHaveLength(5)
  })
})

describe('buildProfile', () => {
  const questionIds = [1, 2, 3] as QuestionId[]

  it('converts explicit answers to probabilities', () => {
    const answers = {
      [1 as QuestionId]: 'yes' as Answer,
      [2 as QuestionId]: 'no' as Answer,
      [3 as QuestionId]: 'probably' as Answer,
    }
    const profile = buildProfile(answers, questionIds)
    expect(profile[1 as QuestionId]).toBe(0.95)
    expect(profile[2 as QuestionId]).toBe(0.05)
    expect(profile[3 as QuestionId]).toBe(0.75)
  })

  it('defaults missing questions to 0.5', () => {
    const answers = {
      [1 as QuestionId]: 'yes' as Answer,
    }
    const profile = buildProfile(answers, questionIds)
    expect(profile[1 as QuestionId]).toBe(0.95)
    expect(profile[2 as QuestionId]).toBe(0.5)
    expect(profile[3 as QuestionId]).toBe(0.5)
  })

  it('handles empty answers — all 0.5', () => {
    const profile = buildProfile({} as Record<QuestionId, Answer>, questionIds)
    expect(profile[1 as QuestionId]).toBe(0.5)
    expect(profile[2 as QuestionId]).toBe(0.5)
    expect(profile[3 as QuestionId]).toBe(0.5)
  })

  it('converts dont_know to 0.5', () => {
    const answers = {
      [1 as QuestionId]: 'dont_know' as Answer,
    }
    const profile = buildProfile(answers, questionIds)
    expect(profile[1 as QuestionId]).toBe(0.5)
  })

  it('profile has exactly the same keys as allQuestionIds', () => {
    const answers = { [1 as QuestionId]: 'yes' as Answer }
    const profile = buildProfile(answers, questionIds)
    expect(Object.keys(profile).map(Number).sort()).toEqual([1, 2, 3])
  })
})

describe('blendProbability', () => {
  it('returns hardcoded when no observations', () => {
    expect(blendProbability(0.95, 0, 0)).toBe(0.95)
  })

  it('blends equally when observations match prior weight', () => {
    // 10 observations (default PRIOR_WEIGHT=10) → 50/50 blend
    const result = blendProbability(0.95, 10, 0, PRIOR_WEIGHT)
    // (0.95 * 10 + 1.0 * 10) / (10 + 10) = 19.5 / 20 = 0.975
    expect(result).toBeCloseTo(0.975, 3)
  })

  it('converges toward observed with many observations', () => {
    // 100 observations: 90 yes, 10 no → observed = 0.9
    const result = blendProbability(0.05, 90, 10, PRIOR_WEIGHT)
    // (0.05 * 10 + 0.9 * 100) / (10 + 100) = (0.5 + 90) / 110 ≈ 0.822
    expect(result).toBeCloseTo(0.822, 2)
    // Should be much closer to 0.9 than to 0.05
    expect(result).toBeGreaterThan(0.5)
  })

  it('result is always in [0, 1]', () => {
    expect(blendProbability(0, 0, 100)).toBeGreaterThanOrEqual(0)
    expect(blendProbability(1, 100, 0)).toBeLessThanOrEqual(1)
    expect(blendProbability(0.5, 50, 50)).toBeGreaterThanOrEqual(0)
    expect(blendProbability(0.5, 50, 50)).toBeLessThanOrEqual(1)
  })

  it('respects spec scenario: 30 observations (27 yes, 3 no) with hardcoded 0.05', () => {
    const result = blendProbability(0.05, 27, 3, PRIOR_WEIGHT)
    // (0.05 * 10 + 0.9 * 30) / (10 + 30) = (0.5 + 27) / 40 = 0.6875
    expect(result).toBeCloseTo(0.6875, 3)
  })
})
