import { Answer } from '../../types'
import { QuestionId } from '../questions'

// ===== Utilities =====

export function safeAnswer(answer: Answer | undefined): Answer {
  return answer ?? 'dont_know'
}

// ===== Question Groups (used by questionSelection.ts) =====

export const CATEGORY_QUESTIONS: QuestionId[] = [1, 2, 3, 4]

/** Broad fiction universe questions (top-level categories) */
export const BROAD_UNIVERSE_QUESTIONS: QuestionId[] = [
  57, 58, 59, 60, 71, 73, 75, 81, 84, 85, 134, 135, 136, 137, 138
]

/** Specific universe drill-down questions (only relevant after broad confirmation) */
export const SPECIFIC_UNIVERSE_QUESTIONS: QuestionId[] = [
  93, 94, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 131, 132, 133, 219
]

/** All universe questions combined (for backward compat / weight lookup) */
export const UNIVERSE_QUESTIONS: QuestionId[] = [
  ...BROAD_UNIVERSE_QUESTIONS,
  ...SPECIFIC_UNIVERSE_QUESTIONS,
]

export const POKEMON_TYPE_QUESTIONS: QuestionId[] = [
  161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180
]

export const DRAGON_BALL_QUESTIONS: QuestionId[] = [228, 229, 230, 231, 232, 233, 234, 235, 236]

export const ROLE_QUESTIONS: QuestionId[] = [121, 122, 123, 124, 128, 129, 224, 225, 226]
export const POWER_QUESTIONS: QuestionId[] = [56, 61, 74, 86, 87, 127]
export const NATIONALITY_QUESTIONS: QuestionId[] = [16, 44, 45, 46, 47]
export const DISCRIMINATIVE_QUESTIONS: QuestionId[] = [139, 140, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 201, 202, 203, 220, 221, 222, 223, 227, 228, 229, 230, 231, 233, 234, 235, 236]

// ===== Question Weights =====

const WEIGHT_UNIVERSE = 2.5
const WEIGHT_ROLE_POWER = 1.8
const WEIGHT_CATEGORY = 1.5
const WEIGHT_COLOR_APPEARANCE = 0.6
const WEIGHT_DEFAULT = 1.0

const COLOR_APPEARANCE_QUESTIONS: QuestionId[] = [48, 49, 50, 51, 52, 53, 63, 126, 125]
const NATIONALITY_APPEARANCE_QUESTIONS: QuestionId[] = [36, 37, 38, 39, 40, 41, 42]
const SPECIAL_WEIGHT_QUESTIONS: QuestionId[] = [122, 130]

function getQuestionWeight(qId: QuestionId): number {
  if (UNIVERSE_QUESTIONS.includes(qId)) return WEIGHT_UNIVERSE
  if (ROLE_QUESTIONS.includes(qId) || POWER_QUESTIONS.includes(qId)) return WEIGHT_ROLE_POWER
  if (CATEGORY_QUESTIONS.includes(qId)) return WEIGHT_CATEGORY
  if (SPECIAL_WEIGHT_QUESTIONS.includes(qId)) return WEIGHT_CATEGORY
  if (COLOR_APPEARANCE_QUESTIONS.includes(qId)) return WEIGHT_COLOR_APPEARANCE
  if (NATIONALITY_APPEARANCE_QUESTIONS.includes(qId)) return WEIGHT_CATEGORY
  return WEIGHT_DEFAULT
}

// ===== Scoring Coefficients =====

const SCORE_CONTRADICTION_PENALTY = 1.2
const SCORE_PARTIAL_MISMATCH_PENALTY = 0.6
const SCORE_PARTIAL_MATCH_BONUS = 0.5
const SCORE_DEFAULT_MISMATCH_PENALTY = 0.15
const SCORE_EMPTY_MAX = 1.0

// ===== Scoring =====

export function calculateScore(
  characterAnswers: Record<QuestionId, Answer>,
  userAnswers: Record<QuestionId, Answer>
): number {
  let score = 0
  let maxScore = 0

  for (const qId of Object.keys(userAnswers) as unknown as QuestionId[]) {
    const weight = getQuestionWeight(qId)
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
    } else {
      score -= weight * SCORE_DEFAULT_MISMATCH_PENALTY
    }
  }

  return maxScore === 0 ? SCORE_EMPTY_MAX : score / maxScore
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
