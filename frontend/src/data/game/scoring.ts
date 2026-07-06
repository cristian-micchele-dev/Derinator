import { Answer } from '../../types'
import { QuestionId, type AnyQuestionId } from '../questions'
import {
  CONFIRMER_QUESTIONS_SET,
  UNIVERSE_QUESTIONS_SET,
  ROLE_QUESTIONS_SET,
  POWER_QUESTIONS_SET,
  CATEGORY_QUESTIONS_SET,
  PHYSICAL_APPEARANCE_QUESTIONS_SET,
  RACIAL_APPEARANCE_QUESTIONS_SET,
  SPECIAL_WEIGHT_QUESTIONS_SET,
} from './questionGroups'

// Re-export question groups for backward compatibility
export {
  CATEGORY_QUESTIONS,
  BROAD_UNIVERSE_QUESTIONS,
  SPECIFIC_UNIVERSE_QUESTIONS,
  UNIVERSE_QUESTIONS,
  POKEMON_TYPE_QUESTIONS,
  DRAGON_BALL_QUESTIONS,
  CONFIRMER_QUESTIONS,
  ROLE_QUESTIONS,
  POWER_QUESTIONS,
  NATIONALITY_QUESTIONS,
  DISCRIMINATIVE_QUESTIONS,
  ANIMAL_DISCRIMINATIVE_QUESTIONS,
  FAMOSOS_BROAD_NAT_QUESTIONS,
  FAMOSOS_SPECIFIC_EU_QUESTIONS,
  FAMOSOS_SPECIFIC_OTHER_QUESTIONS,
  PHYSICAL_APPEARANCE_QUESTIONS,
  RACIAL_APPEARANCE_QUESTIONS,
} from './questionGroups'

// ===== Utilities =====

export function safeAnswer(answer: Answer | undefined): Answer {
  return answer ?? 'dont_know'
}

// ===== Question Weights =====

const WEIGHT_CONFIRMER = 5.0
const WEIGHT_UNIVERSE = 2.5
const WEIGHT_ROLE_POWER = 1.8
const WEIGHT_CATEGORY = 1.5
const WEIGHT_COLOR_APPEARANCE = 0.6
const WEIGHT_DEFAULT = 1.0

function getQuestionWeight(qId: QuestionId, learnedConfirmerIds?: ReadonlySet<number>): number {
  if (CONFIRMER_QUESTIONS_SET.has(qId) || learnedConfirmerIds?.has(qId as AnyQuestionId as number)) return WEIGHT_CONFIRMER
  if (UNIVERSE_QUESTIONS_SET.has(qId)) return WEIGHT_UNIVERSE
  if (ROLE_QUESTIONS_SET.has(qId) || POWER_QUESTIONS_SET.has(qId)) return WEIGHT_ROLE_POWER
  if (CATEGORY_QUESTIONS_SET.has(qId)) return WEIGHT_CATEGORY
  if (SPECIAL_WEIGHT_QUESTIONS_SET.has(qId)) return WEIGHT_CATEGORY
  if (PHYSICAL_APPEARANCE_QUESTIONS_SET.has(qId)) return WEIGHT_COLOR_APPEARANCE
  if (RACIAL_APPEARANCE_QUESTIONS_SET.has(qId)) return WEIGHT_CATEGORY
  return WEIGHT_DEFAULT
}

// ===== Scoring Coefficients =====

const SCORE_CONTRADICTION_PENALTY = 1.2
const SCORE_PARTIAL_MISMATCH_PENALTY = 0.6
const SCORE_PARTIAL_MATCH_BONUS = 0.5
const SCORE_DEFAULT_MISMATCH_PENALTY = 0.15
const SCORE_NO_HISTORY = 1.0

// ===== Scoring =====

export function calculateScore(
  characterAnswers: Record<QuestionId, Answer>,
  userAnswers: Record<QuestionId, Answer>,
  learnedConfirmerIds?: ReadonlySet<number>,
): number {
  let score = 0
  let maxScore = 0

  for (const key of Object.keys(userAnswers)) {
    const qId = Number(key) as QuestionId
    const weight = getQuestionWeight(qId, learnedConfirmerIds)
    const userAnswer = safeAnswer(userAnswers[qId])
    const charAnswer = safeAnswer(characterAnswers[qId])

    if (userAnswer === 'dont_know') continue

    maxScore += weight

    if (userAnswer === charAnswer) {
      score += weight
    } else if (
      (userAnswer === 'yes' && charAnswer === 'no') ||
      (userAnswer === 'no' && charAnswer === 'yes')
    ) {
      score -= weight * SCORE_CONTRADICTION_PENALTY
    } else if (
      (userAnswer === 'yes' && charAnswer === 'probably_not') ||
      (userAnswer === 'no' && charAnswer === 'probably') ||
      (userAnswer === 'probably' && charAnswer === 'no') ||
      (userAnswer === 'probably_not' && charAnswer === 'yes')
    ) {
      score -= weight * SCORE_PARTIAL_MISMATCH_PENALTY
    } else if (
      (userAnswer === 'probably_not' && charAnswer === 'no') ||
      (userAnswer === 'probably' && charAnswer === 'yes')
    ) {
      score += weight * SCORE_PARTIAL_MATCH_BONUS
    } else if (
      (userAnswer === 'probably' || userAnswer === 'probably_not') &&
      (charAnswer === 'probably' || charAnswer === 'probably_not')
    ) {
      score += weight * SCORE_PARTIAL_MATCH_BONUS
    } else if (userAnswer === 'yes' && charAnswer === 'dont_know' && weight >= WEIGHT_CONFIRMER) {
      // Confirmer answered "yes" — only the specific character has this trait.
      // Treat it as a near-contradiction for everyone else.
      score -= weight * SCORE_CONTRADICTION_PENALTY
    } else {
      score -= weight * SCORE_DEFAULT_MISMATCH_PENALTY
    }
  }

  return maxScore === 0 ? SCORE_NO_HISTORY : score / maxScore
}

// ===== Discrimination Score (entropy-based) =====

const ENTROPY_UNANIMOUS_THRESHOLD = 0.999
const MINORITY_BONUS_THRESHOLD = 0.2
const MINORITY_BONUS_MULTIPLIER = 2.0

export function getDiscriminationScore(positive: number, negative: number, neutral: number, total: number): number {
  if (total === 0) return 0

  const maxGroup = Math.max(positive, negative, neutral)
  if (maxGroup / total >= ENTROPY_UNANIMOUS_THRESHOLD) return 0

  const pPos = positive / total
  const pNeg = negative / total
  let entropy = 0
  if (pPos > 0) entropy -= pPos * Math.log2(pPos)
  if (pNeg > 0) entropy -= pNeg * Math.log2(pNeg)

  const opinionated = (positive + negative) / total

  const minorityRatio = Math.min(positive, negative) / total
  const minorityBonus = minorityRatio > 0 && minorityRatio < MINORITY_BONUS_THRESHOLD ? MINORITY_BONUS_MULTIPLIER : 1.0

  return entropy * opinionated * minorityBonus
}
