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
