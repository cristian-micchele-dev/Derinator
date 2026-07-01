import { describe, it, expect } from 'vitest'
import {
  answerToProbability,
  buildProfile,
  blendProbability,
  initLogPosteriors,
  logPosteriorsToProbs,
  entropy,
  getLikelihood,
  updatePosteriors,
  computeEIG,
  shouldGuess,
  ANSWER_TO_PROBABILITY,
  PRIOR_WEIGHT,
  LIKELIHOOD_FLOOR,
} from './bayesian'
import type { CandidateWithProfile } from './bayesian'
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

// ---- Phase 2: Bayesian Engine ----

/** Helper: create minimal candidates for testing */
function makeCandidates(profiles: Record<number, number>[]): CandidateWithProfile[] {
  return profiles.map((profile, i) => ({
    id: i + 1,
    name: `Char${i + 1}`,
    description: '',
    category: 'personaje',
    answers: {} as Record<QuestionId, Answer>,
    profile: profile as unknown as Record<QuestionId, number>,
  }))
}

describe('initLogPosteriors', () => {
  it('creates uniform log-posteriors', () => {
    const lp = initLogPosteriors(4)
    expect(lp).toHaveLength(4)
    const probs = logPosteriorsToProbs(lp)
    for (const p of probs) {
      expect(p).toBeCloseTo(0.25, 5)
    }
  })
})

describe('logPosteriorsToProbs', () => {
  it('normalizes to sum 1.0', () => {
    const probs = logPosteriorsToProbs([Math.log(0.3), Math.log(0.7)])
    expect(probs[0] + probs[1]).toBeCloseTo(1.0, 10)
    expect(probs[0]).toBeCloseTo(0.3, 5)
    expect(probs[1]).toBeCloseTo(0.7, 5)
  })

  it('handles all -Infinity (degenerate) → uniform', () => {
    const probs = logPosteriorsToProbs([-Infinity, -Infinity, -Infinity])
    for (const p of probs) {
      expect(p).toBeCloseTo(1 / 3, 5)
    }
  })
})

describe('entropy', () => {
  it('uniform distribution has max entropy', () => {
    const h = entropy([0.25, 0.25, 0.25, 0.25])
    expect(h).toBeCloseTo(2.0, 5) // log2(4) = 2
  })

  it('certain distribution has 0 entropy', () => {
    expect(entropy([1, 0, 0])).toBeCloseTo(0, 5)
  })

  it('binary 50/50 has entropy 1', () => {
    expect(entropy([0.5, 0.5])).toBeCloseTo(1.0, 5)
  })
})

describe('getLikelihood', () => {
  it('yes → charProb', () => {
    expect(getLikelihood(0.95, 'yes')).toBe(0.95)
  })

  it('no → 1 - charProb', () => {
    expect(getLikelihood(0.95, 'no')).toBeCloseTo(0.05, 5)
  })

  it('dont_know → 1.0 (no info)', () => {
    expect(getLikelihood(0.95, 'dont_know')).toBe(1.0)
    expect(getLikelihood(0.05, 'dont_know')).toBe(1.0)
  })

  it('probably → soft yes (between charProb and 0.5)', () => {
    const l = getLikelihood(0.95, 'probably')
    expect(l).toBeGreaterThan(0.5)
    expect(l).toBeLessThanOrEqual(1.0)
  })

  it('probably_not → soft no', () => {
    const l = getLikelihood(0.95, 'probably_not')
    expect(l).toBeLessThan(0.5)
    expect(l).toBeGreaterThan(0)
  })

  it('never returns below LIKELIHOOD_FLOOR', () => {
    // charProb = 0.0 would give 0 for 'yes', but floor prevents it
    expect(getLikelihood(0, 'yes')).toBeGreaterThanOrEqual(LIKELIHOOD_FLOOR)
  })
})

describe('updatePosteriors', () => {
  it('yes answer shifts posterior toward matching candidate', () => {
    // Char1: Q1=0.95 (likely yes), Char2: Q1=0.05 (likely no)
    const candidates = makeCandidates([{ 1: 0.95 }, { 1: 0.05 }])
    const lp = initLogPosteriors(2)

    updatePosteriors(candidates, lp, 1 as QuestionId, 'yes')
    const probs = logPosteriorsToProbs(lp)

    // Char1 should dominate after "yes" to Q1
    expect(probs[0]).toBeGreaterThan(probs[1])
    expect(probs[0]).toBeGreaterThan(0.9)
  })

  it('no answer shifts posterior away from matching candidate', () => {
    const candidates = makeCandidates([{ 1: 0.95 }, { 1: 0.05 }])
    const lp = initLogPosteriors(2)

    updatePosteriors(candidates, lp, 1 as QuestionId, 'no')
    const probs = logPosteriorsToProbs(lp)

    // Char2 should dominate after "no" to Q1
    expect(probs[1]).toBeGreaterThan(probs[0])
    expect(probs[1]).toBeGreaterThan(0.9)
  })

  it('dont_know leaves posteriors unchanged', () => {
    const candidates = makeCandidates([{ 1: 0.95 }, { 1: 0.05 }])
    const lp = initLogPosteriors(2)
    const before = logPosteriorsToProbs([...lp])

    updatePosteriors(candidates, lp, 1 as QuestionId, 'dont_know')
    const after = logPosteriorsToProbs(lp)

    expect(after[0]).toBeCloseTo(before[0], 10)
    expect(after[1]).toBeCloseTo(before[1], 10)
  })

  it('normalization always sums to ~1.0', () => {
    const candidates = makeCandidates([{ 1: 0.9 }, { 1: 0.3 }, { 1: 0.6 }])
    const lp = initLogPosteriors(3)

    updatePosteriors(candidates, lp, 1 as QuestionId, 'yes')
    const probs = logPosteriorsToProbs(lp)
    const sum = probs.reduce((a, b) => a + b, 0)
    expect(sum).toBeCloseTo(1.0, 5)
  })
})

describe('computeEIG', () => {
  it('50/50 split has higher EIG than 90/10 split', () => {
    // Q1 splits perfectly: Char1=0.95, Char2=0.05
    // Q2 barely splits: Char1=0.9, Char2=0.8
    const candidates = makeCandidates([
      { 1: 0.95, 2: 0.9 },
      { 1: 0.05, 2: 0.8 },
    ])
    const posteriors = [0.5, 0.5]

    const eigQ1 = computeEIG(candidates, posteriors, 1 as QuestionId)
    const eigQ2 = computeEIG(candidates, posteriors, 2 as QuestionId)

    expect(eigQ1).toBeGreaterThan(eigQ2)
  })

  it('identical profiles across candidates → EIG ≈ 0', () => {
    const candidates = makeCandidates([{ 1: 0.5 }, { 1: 0.5 }])
    const posteriors = [0.5, 0.5]

    const eig = computeEIG(candidates, posteriors, 1 as QuestionId)
    expect(eig).toBeCloseTo(0, 3)
  })

  it('EIG is non-negative', () => {
    const candidates = makeCandidates([
      { 1: 0.7, 2: 0.3 },
      { 1: 0.4, 2: 0.8 },
      { 1: 0.9, 2: 0.1 },
    ])
    const posteriors = [0.33, 0.33, 0.34]

    expect(computeEIG(candidates, posteriors, 1 as QuestionId)).toBeGreaterThanOrEqual(0)
    expect(computeEIG(candidates, posteriors, 2 as QuestionId)).toBeGreaterThanOrEqual(0)
  })

  it('near-certain question (all candidates same) returns 0', () => {
    // All candidates have prob=0.99 → pYes≈0.99 → skipped
    const candidates = makeCandidates([{ 1: 0.99 }, { 1: 0.995 }])
    const posteriors = [0.5, 0.5]

    const eig = computeEIG(candidates, posteriors, 1 as QuestionId)
    expect(eig).toBe(0)
  })
})

describe('shouldGuess', () => {
  it('returns true when top posterior >= 0.85', () => {
    const result = shouldGuess([0.9, 0.05, 0.05], ['A', 'B', 'C'], 6, false)
    expect(result.shouldGuess).toBe(true)
    expect(result.topCandidate).toBe('A')
    expect(result.confidence).toBe(0.9)
  })

  it('returns false when below threshold', () => {
    const result = shouldGuess([0.6, 0.3, 0.1], ['A', 'B', 'C'], 6, false)
    expect(result.shouldGuess).toBe(false)
  })

  it('never guesses before MIN_QUESTIONS regardless of posteriors', () => {
    const result = shouldGuess([0.95, 0.05], ['A', 'B'], 3, false)
    expect(result.shouldGuess).toBe(false)
  })

  it('always guesses when noMoreQuestions=true', () => {
    const result = shouldGuess([0.4, 0.3, 0.3], ['A', 'B', 'C'], 2, true)
    expect(result.shouldGuess).toBe(true)
  })

  it('guesses on large gap ratio at >= 8 questions', () => {
    // top=0.75, second=0.15 → gap=5.0 > GAP_RATIO(3.0)
    const result = shouldGuess([0.75, 0.15, 0.10], ['A', 'B', 'C'], 10, false)
    expect(result.shouldGuess).toBe(true)
  })

  it('does NOT guess on large gap ratio at < 8 questions', () => {
    const result = shouldGuess([0.75, 0.15, 0.10], ['A', 'B', 'C'], 6, false)
    expect(result.shouldGuess).toBe(false)
  })
})
