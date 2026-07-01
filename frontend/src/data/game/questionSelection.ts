import { Answer } from '../../types'
import { QuestionId } from '../questions'
import { FLOW_MAP, QUESTION_FLOW } from './questionFlow'
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
 * - Phase F: Flow-guided — follow the decision tree branches
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

  // PHASE F: Flow-guided — follow the decision tree before falling back to entropy.
  // 1) Direct follow-up: if the last answered question has a `next` in the flow, follow it.
  // 2) Eligible flow nodes: find all nodes whose prerequisites are satisfied, pick the best.
  if (history && history.length > 0) {
    const flowGuided = getFlowGuidedQuestion(remainingQuestions, candidates, history)
    if (flowGuided !== null) return flowGuided
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

  // Build prerequisite context for Phase 2 & 3 filtering
  const prereqMap = history && history.length > 0
    ? new Map(history.map(h => [h.questionId, h.answer]))
    : new Map<QuestionId, Answer>()
  const hasHistory = prereqMap.size > 0
  const isEligibleStrict = (qId: QuestionId) =>
    hasHistory
      ? prerequisitesStrictMet(qId, prereqMap) && !isExcluded(qId, prereqMap)
      : true
  // PHASE 2: When 5-10 candidates remain, prefer category/role/profession/nationality/discriminative questions
  const PROFESSION_QUESTIONS: QuestionId[] = [15, 17, 18, 19, 20, 76, 77, 78, 79, 80, 187, 188, 189, 190]
  if (candidateCount > 4) {
    const typeFilter = (qId: QuestionId) =>
      isEligibleStrict(qId) && (
        CATEGORY_QUESTIONS.includes(qId) ||
        ROLE_QUESTIONS.includes(qId) ||
        PROFESSION_QUESTIONS.includes(qId) ||
        NATIONALITY_QUESTIONS.includes(qId) ||
        DISCRIMINATIVE_QUESTIONS.includes(qId)
      )

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
    if (!isEligibleStrict(qId)) continue

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

// ===== Flow-Guided Selection =====

function getFlowGuidedQuestion(
  remainingQuestions: QuestionId[],
  candidates: { answers: Record<QuestionId, Answer> }[],
  history: { questionId: QuestionId; answer: Answer }[]
): QuestionId | null {
  const answeredSet = new Set(history.map(h => h.questionId))
  const answerMap = new Map(history.map(h => [h.questionId, h.answer]))

  // Step 1: Direct follow-up from the last answered question's `next` mapping
  for (let i = history.length - 1; i >= 0; i--) {
    const last = history[i]
    const node = FLOW_MAP.get(last.questionId)
    if (!node?.next) continue

    const nextId = node.next[last.answer] ?? node.next['default']
    if (nextId != null && remainingQuestions.includes(nextId) && !answeredSet.has(nextId)) {
      if (wouldDiscriminate(nextId, candidates)) {
        return nextId
      }
    }
    break
  }

  // Step 2: Find all flow nodes whose prerequisites are met but haven't been asked.
  // Pick the one with the highest weight that also discriminates among candidates.
  const eligible: { id: QuestionId; weight: number }[] = []

  for (const node of QUESTION_FLOW) {
    if (answeredSet.has(node.id)) continue
    if (!remainingQuestions.includes(node.id)) continue
    if (!prerequisitesStrictMet(node.id, answerMap)) continue
    if (isExcluded(node.id, answerMap)) continue

    eligible.push({ id: node.id, weight: node.weight ?? 1.0 })
  }

  if (eligible.length === 0) return null

  // Sort by weight descending — higher weight = more important to ask first
  eligible.sort((a, b) => b.weight - a.weight)

  // Among the top-weighted eligible questions, pick the one that best discriminates
  for (const { id } of eligible) {
    if (wouldDiscriminate(id, candidates)) {
      return id
    }
  }

  return null
}


export function prerequisitesStrictMet(
  questionId: QuestionId,
  answerMap: Map<QuestionId, Answer>
): boolean {
  const node = FLOW_MAP.get(questionId)
  if (!node?.prerequisites) return true

  return node.prerequisites.every(prereq => {
    const given = answerMap.get(prereq.questionId)
    // Strict: unanswered prerequisite = NOT met
    if (given === undefined) return false
    return prereq.answers.includes(given)
  })
}

export function isExcluded(
  questionId: QuestionId,
  answerMap: Map<QuestionId, Answer>
): boolean {
  const node = FLOW_MAP.get(questionId)
  if (!node?.exclusions) return false

  return node.exclusions.some(excl => {
    const given = answerMap.get(excl.questionId)
    return given !== undefined && excl.answers.includes(given)
  })
}

function wouldDiscriminate(
  qId: QuestionId,
  candidates: { answers: Record<QuestionId, Answer> }[]
): boolean {
  const { positive, negative, neutral } = countAnswers(candidates, qId)
  const total = positive + negative + neutral
  if (total === 0) return false

  // A question discriminates if it doesn't have 99%+ the same answer
  const maxGroup = Math.max(positive, negative, neutral)
  return maxGroup / total < 0.95
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
