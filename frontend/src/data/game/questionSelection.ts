import { Answer } from '../../types'
import { QuestionId } from '../questions'
import {
  safeAnswer,
  BROAD_UNIVERSE_QUESTIONS,
  SPECIFIC_UNIVERSE_QUESTIONS,
  POKEMON_TYPE_QUESTIONS,
  DRAGON_BALL_QUESTIONS,
  CATEGORY_QUESTIONS,
  ROLE_QUESTIONS,
  POWER_QUESTIONS,
  NATIONALITY_QUESTIONS,
  DISCRIMINATIVE_QUESTIONS,
  getDiscriminationScore,
} from './scoring'

/**
 * Select the best next question to ask, using a phased strategy:
 * - Phase 0: Fiction vs real split when mixed
 * - Phase 0.5: Confirm Pokémon before type questions
 * - Phase 1: Universe questions when many candidates
 * - Phase 1.5: Sub-universe drill-down
 * - Phase 1.6: Pokémon type questions
 * - Phase 2: Category/role/profession/nationality
 * - Phase 3: Entropy fallback
 */
export function getBestQuestion(
  remainingQuestions: QuestionId[],
  candidates: { id: number; name: string; description?: string; answers: Record<QuestionId, Answer> }[],
  history?: { questionId: QuestionId; answer: Answer }[]
): QuestionId | null {
  if (remainingQuestions.length === 0) return null
  if (candidates.length <= 1) return null

  const candidateCount = candidates.length

  // PHASE 0: When there's a mix of fictional and real characters, ask "¿Es de ficción?" FIRST
  if (candidateCount > 10 && remainingQuestions.includes(4)) {
    let hasFiction = false
    let hasReal = false

    for (const char of candidates) {
      const answer = safeAnswer(char.answers[4])
      if (answer === 'yes' || answer === 'probably') hasFiction = true
      else if (answer === 'no' || answer === 'probably_not') hasReal = true
      if (hasFiction && hasReal) break
    }

    if (hasFiction && hasReal) {
      return 4
    }
  }

  // PHASE 0.5: If there are multiple Pokémon candidates, force "¿Es un Pokémon?" first
  if (candidateCount > 2 && remainingQuestions.includes(85)) {
    let pokemonCount = 0
    for (const char of candidates) {
      const answer = safeAnswer(char.answers[85])
      if (answer === 'yes' || answer === 'probably') pokemonCount++
    }
    if (pokemonCount >= 2) {
      return 85
    }
  }

  // PHASE 1: When many candidates remain, ask BROAD universe questions first
  if (candidateCount > 10) {
    const best = findBestByGroup(remainingQuestions, candidates, BROAD_UNIVERSE_QUESTIONS, qId => !POKEMON_TYPE_QUESTIONS.includes(qId))
    if (best !== null) return best
  }

  // PHASE 1.5: Broad universe confirmed — drill down to specific sub-universe
  if (candidateCount > 2 && candidateCount <= 20 && history && history.length > 0) {
    for (const answered of history) {
      if (answered.answer !== 'yes' && answered.answer !== 'probably') continue
      if (!BROAD_UNIVERSE_QUESTIONS.includes(answered.questionId)) continue

      const best = findBestByGroup(
        remainingQuestions,
        candidates,
        SPECIFIC_UNIVERSE_QUESTIONS,
      )

      if (best !== null) return best
      break
    }
  }

  // PHASE 1.6: Pokémon type questions — only after confirming it's a Pokémon (85 = yes)
  const isPokemonConfirmed = history && history.some(h => h.questionId === 85 && (h.answer === 'yes' || h.answer === 'probably'))
  if (isPokemonConfirmed && candidateCount > 2) {
    const best = findBestByGroup(remainingQuestions, candidates, POKEMON_TYPE_QUESTIONS)
    if (best !== null) return best
  }

  // PHASE 1.7: Dragon Ball specific questions — only after confirming it's Dragon Ball (84 = yes)
  const isDragonBallConfirmed = history && history.some(h => h.questionId === 84 && (h.answer === 'yes' || h.answer === 'probably'))
  if (isDragonBallConfirmed && candidateCount > 2) {
    const best = findBestByGroup(remainingQuestions, candidates, DRAGON_BALL_QUESTIONS)
    if (best !== null) return best
  }

  // PHASE 2: When 5-10 candidates remain, prefer category/role/profession/nationality/discriminative questions
  const PROFESSION_QUESTIONS: QuestionId[] = [15, 17, 18, 19, 20, 76, 77, 78, 79, 80]
  if (candidateCount > 4) {
    const typeFilter = (qId: QuestionId) =>
      CATEGORY_QUESTIONS.includes(qId) ||
      ROLE_QUESTIONS.includes(qId) ||
      PROFESSION_QUESTIONS.includes(qId) ||
      NATIONALITY_QUESTIONS.includes(qId) ||
      DISCRIMINATIVE_QUESTIONS.includes(qId)

    const best = findBestWeighted(remainingQuestions, candidates, typeFilter, qId => {
      if (CATEGORY_QUESTIONS.includes(qId)) return 3.0
      if (NATIONALITY_QUESTIONS.includes(qId)) return 3.5
      if (DISCRIMINATIVE_QUESTIONS.includes(qId)) return 3.0
      if (PROFESSION_QUESTIONS.includes(qId)) return 2.5
      if (ROLE_QUESTIONS.includes(qId)) return 2.0
      return 1.0
    })

    if (best !== null) return best
  }

  // PHASE 3: Fallback to entropy-based selection for few candidates
  let bestQuestion: QuestionId | null = null
  let bestScore = -1

  for (const qId of remainingQuestions) {
    let positive = 0
    let negative = 0
    let neutral = 0

    for (const char of candidates) {
      const answer = safeAnswer(char.answers[qId])
      if (answer === 'yes' || answer === 'probably') positive++
      else if (answer === 'no' || answer === 'probably_not') negative++
      else neutral++
    }

    const total = positive + negative + neutral
    if (total === 0) continue

    let score = getDiscriminationScore(positive, negative, neutral, total)
    if (score === 0) continue

    if (POWER_QUESTIONS.includes(qId)) {
      score *= 1.3
    }

    if (neutral / total < 0.15) score *= 1.2

    if (score > bestScore) {
      bestScore = score
      bestQuestion = qId
    }
  }

  return bestQuestion
}

// ===== Internal Helpers =====

function countAnswers(
  candidates: { answers: Record<QuestionId, Answer> }[],
  qId: QuestionId
): { positive: number; negative: number; neutral: number } {
  let positive = 0
  let negative = 0
  let neutral = 0

  for (const char of candidates) {
    const answer = safeAnswer(char.answers[qId])
    if (answer === 'yes' || answer === 'probably') positive++
    else if (answer === 'no' || answer === 'probably_not') negative++
    else neutral++
  }

  return { positive, negative, neutral }
}

function findBestByGroup(
  remainingQuestions: QuestionId[],
  candidates: { answers: Record<QuestionId, Answer> }[],
  group: QuestionId[],
  filter?: (qId: QuestionId) => boolean
): QuestionId | null {
  let best: QuestionId | null = null
  let bestScore = -1

  for (const qId of remainingQuestions) {
    if (!group.includes(qId)) continue
    if (filter && !filter(qId)) continue

    const { positive, negative, neutral } = countAnswers(candidates, qId)
    const total = positive + negative + neutral
    if (total === 0) continue

    const maxGroup = Math.max(positive, negative, neutral)
    if (maxGroup / total >= 0.999) continue

    // Use entropy-based score so questions with unbalanced data still get considered
    const score = getDiscriminationScore(positive, negative, neutral, total)
    if (score === 0) continue

    if (score > bestScore) {
      bestScore = score
      best = qId
    }
  }

  return best
}

function findBestWeighted(
  remainingQuestions: QuestionId[],
  candidates: { answers: Record<QuestionId, Answer> }[],
  filter: (qId: QuestionId) => boolean,
  weight: (qId: QuestionId) => number
): QuestionId | null {
  let best: QuestionId | null = null
  let bestScore = -1

  for (const qId of remainingQuestions) {
    if (!filter(qId)) continue

    const { positive, negative, neutral } = countAnswers(candidates, qId)
    const total = positive + negative + neutral
    if (total === 0) continue

    const score = getDiscriminationScore(positive, negative, neutral, total)
    if (score === 0) continue

    const finalScore = score * weight(qId)
    if (finalScore > bestScore) {
      bestScore = finalScore
      best = qId
    }
  }

  return best
}
