/**
 * Bayesian probability engine for Derinator.
 *
 * Replaces the enum-based scoring with probabilistic inference.
 * Characters carry probability profiles (0.0–1.0 per question).
 * The engine uses Bayes' theorem to update candidate posteriors
 * and Expected Information Gain (EIG) for question selection.
 */

import type { Answer } from '../../types'
import type { QuestionId } from '../questions'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Probability that a character would answer "yes" to each question */
export type ProbabilityProfile = Record<QuestionId, number>

/** A character with its probability profile attached */
export interface CandidateWithProfile {
  name: string
  description: string
  category: string
  subcategory?: string
  id: number
  answers: Record<QuestionId, Answer>
  profile: ProbabilityProfile
}

/** Result of the shouldGuess decision */
export interface GuessDecision {
  shouldGuess: boolean
  topCandidate: string
  confidence: number
  gap: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maps user-facing Answer enum to probability values */
export const ANSWER_TO_PROBABILITY: Record<Answer, number> = {
  yes: 0.95,
  probably: 0.75,
  dont_know: 0.5,
  probably_not: 0.25,
  no: 0.05,
}

/** Posterior threshold to trigger a guess */
export const GUESS_THRESHOLD = 0.85

/** Minimum questions before allowing a guess */
export const MIN_QUESTIONS = 5

/** Ratio between top and second candidate to trigger early guess */
export const GAP_RATIO = 3.0

/** Posterior threshold for dominant candidate (alternative guess trigger) */
export const DOMINANT_THRESHOLD = 0.85

/** Candidates below this posterior get pruned */
export const PRUNE_THRESHOLD = 1e-6

/** Weight of hardcoded data when blending with observations */
export const PRIOR_WEIGHT = 10

/** Minimum likelihood value (prevents log(0) in log-space) */
export const LIKELIHOOD_FLOOR = 1e-10

// ---------------------------------------------------------------------------
// Conversion functions
// ---------------------------------------------------------------------------

/** Convert a single Answer enum value to a probability */
export function answerToProbability(answer: Answer): number {
  return ANSWER_TO_PROBABILITY[answer]
}

/**
 * Build a ProbabilityProfile from a character's enum answers.
 * Missing questions default to 0.5 (maximum uncertainty).
 */
export function buildProfile(
  answers: Record<QuestionId, Answer>,
  allQuestionIds: QuestionId[],
): ProbabilityProfile {
  const profile = {} as ProbabilityProfile
  for (const qId of allQuestionIds) {
    const answer = answers[qId]
    profile[qId] = answer ? answerToProbability(answer) : 0.5
  }
  return profile
}

/**
 * Blend a hardcoded probability with observed gameplay data.
 * Uses confidence weighting: more observations → more weight to observed data.
 *
 * Formula: (hardcoded × priorWeight + observed × N) / (priorWeight + N)
 * where N = yesCount + noCount, observed = yesCount / N
 */
export function blendProbability(
  hardcoded: number,
  yesCount: number,
  noCount: number,
  priorWeight: number = PRIOR_WEIGHT,
): number {
  const n = yesCount + noCount
  if (n === 0) return hardcoded
  const observed = yesCount / n
  return (hardcoded * priorWeight + observed * n) / (priorWeight + n)
}

// ---------------------------------------------------------------------------
// Log-space helpers
// ---------------------------------------------------------------------------

/** Initialize uniform log-posteriors for N candidates */
export function initLogPosteriors(n: number): number[] {
  const logP = Math.log(1 / n)
  return new Array(n).fill(logP)
}

/** Convert log-posteriors to normalized probabilities (sum to 1.0) */
export function logPosteriorsToProbs(logPosteriors: number[]): number[] {
  const maxLog = Math.max(...logPosteriors)
  // Shift to avoid underflow: exp(log_i - max) keeps values manageable
  const shifted = logPosteriors.map((lp) => Math.exp(lp - maxLog))
  const sum = shifted.reduce((a, b) => a + b, 0)
  if (sum === 0 || !isFinite(sum)) {
    // Degenerate case: return uniform
    const uniform = 1 / logPosteriors.length
    return new Array(logPosteriors.length).fill(uniform)
  }
  return shifted.map((s) => s / sum)
}

/** Shannon entropy of a probability distribution */
export function entropy(probs: number[]): number {
  let h = 0
  for (const p of probs) {
    if (p > 0) h -= p * Math.log2(p)
  }
  return h
}

// ---------------------------------------------------------------------------
// Bayesian posterior update
// ---------------------------------------------------------------------------

/**
 * Compute the likelihood of a user answer given a character's profile value.
 * - "yes"          → charProb (character likely says yes)
 * - "no"           → 1 - charProb
 * - "probably"     → 0.7 × charProb + 0.3 × 0.5 (soft yes)
 * - "probably_not" → 0.7 × (1 - charProb) + 0.3 × 0.5 (soft no)
 * - "dont_know"    → 1.0 (no information)
 */
export function getLikelihood(charProb: number, userAnswer: Answer): number {
  let likelihood: number
  switch (userAnswer) {
    case 'yes':
      likelihood = charProb
      break
    case 'no':
      likelihood = 1 - charProb
      break
    case 'probably':
      likelihood = 0.7 * charProb + 0.15
      break
    case 'probably_not':
      likelihood = 0.7 * (1 - charProb) + 0.15
      break
    case 'dont_know':
      return 1.0
  }
  return Math.max(likelihood, LIKELIHOOD_FLOOR)
}

/**
 * Update log-posteriors after the user answers a question.
 * Mutates logPosteriors in-place for performance.
 */
export function updatePosteriors(
  candidates: CandidateWithProfile[],
  logPosteriors: number[],
  questionId: QuestionId,
  userAnswer: Answer,
): void {
  for (let i = 0; i < candidates.length; i++) {
    const charProb = candidates[i].profile[questionId] ?? 0.5
    const likelihood = getLikelihood(charProb, userAnswer)
    logPosteriors[i] += Math.log(likelihood)
  }
  // Normalize in log-space (shift so max is 0 to prevent drift)
  const maxLog = Math.max(...logPosteriors)
  if (isFinite(maxLog)) {
    for (let i = 0; i < logPosteriors.length; i++) {
      logPosteriors[i] -= maxLog
    }
  }
}

// ---------------------------------------------------------------------------
// Expected Information Gain (EIG)
// ---------------------------------------------------------------------------

/**
 * Compute the Expected Information Gain of asking a question.
 * Uses binary yes/no hypotheticals only.
 */
export function computeEIG(
  candidates: CandidateWithProfile[],
  posteriors: number[],
  questionId: QuestionId,
): number {
  // P(yes) = weighted average of character probabilities
  let pYes = 0
  for (let i = 0; i < candidates.length; i++) {
    pYes += posteriors[i] * (candidates[i].profile[questionId] ?? 0.5)
  }
  const pNo = 1 - pYes

  // Skip near-certain questions (no information to gain)
  if (pYes < 0.01 || pYes > 0.99) return 0

  const currentEntropy = entropy(posteriors)

  // Hypothetical posteriors if user says "yes"
  const postYes = candidates.map(
    (c, i) => posteriors[i] * (c.profile[questionId] ?? 0.5),
  )
  const sumYes = postYes.reduce((a, b) => a + b, 0)
  const normYes = sumYes > 0 ? postYes.map((p) => p / sumYes) : postYes
  const hYes = entropy(normYes)

  // Hypothetical posteriors if user says "no"
  const postNo = candidates.map(
    (c, i) => posteriors[i] * (1 - (c.profile[questionId] ?? 0.5)),
  )
  const sumNo = postNo.reduce((a, b) => a + b, 0)
  const normNo = sumNo > 0 ? postNo.map((p) => p / sumNo) : postNo
  const hNo = entropy(normNo)

  return currentEntropy - (pYes * hYes + pNo * hNo)
}

// ---------------------------------------------------------------------------
// Guess decision
// ---------------------------------------------------------------------------

/**
 * Decide whether to guess based on posterior distribution.
 * Replaces the complex getConfidenceMetrics with clear thresholds.
 */
export function shouldGuess(
  posteriors: number[],
  candidateNames: string[],
  questionsAsked: number,
  noMoreQuestions: boolean,
): GuessDecision {
  const sorted = posteriors
    .map((p, i) => ({ p, name: candidateNames[i] }))
    .sort((a, b) => b.p - a.p)

  const top = sorted[0]?.p ?? 0
  const second = sorted[1]?.p ?? 0
  const gap = second > 0 ? top / second : Infinity
  const topName = sorted[0]?.name ?? ''

  const result: GuessDecision = {
    shouldGuess: false,
    topCandidate: topName,
    confidence: top,
    gap,
  }

  // Always guess if no more questions
  if (noMoreQuestions) {
    result.shouldGuess = true
    return result
  }

  // Never guess before minimum questions
  if (questionsAsked < MIN_QUESTIONS) {
    return result
  }

  // Dominant candidate
  if (top >= DOMINANT_THRESHOLD) {
    result.shouldGuess = true
    return result
  }

  // Large gap with enough questions
  if (gap >= GAP_RATIO && questionsAsked >= 8) {
    result.shouldGuess = true
    return result
  }

  return result
}
