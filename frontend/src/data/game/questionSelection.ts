import { Answer } from '../../types'
import { QuestionId, type AnyQuestionId } from '../questions'
import { FLOW_MAP, QUESTION_FLOW } from './questionFlow'
import {
  BROAD_UNIVERSE_QUESTIONS,
  SPECIFIC_UNIVERSE_QUESTIONS,
  POKEMON_TYPE_QUESTIONS,
  DRAGON_BALL_QUESTIONS,
  CATEGORY_QUESTIONS,
  ROLE_QUESTIONS,
  POWER_QUESTIONS,
  NATIONALITY_QUESTIONS,
  DISCRIMINATIVE_QUESTIONS,
  ANIMAL_DISCRIMINATIVE_QUESTIONS,
  CONFIRMER_QUESTIONS,
  FAMOSOS_BROAD_NAT_QUESTIONS,
  FAMOSOS_SPECIFIC_EU_QUESTIONS,
  FAMOSOS_SPECIFIC_OTHER_QUESTIONS,
} from './questionGroups'
import { safeAnswer, getDiscriminationScore } from './scoring'

type Candidate = { id: number; name: string; description?: string; answers: Record<QuestionId, Answer> }
type HistoryEntry = { questionId: QuestionId; answer: Answer }

const PROFESSION_QUESTIONS: QuestionId[] = [15, 17, 18, 19, 20, 76, 77, 78, 79, 80, 187, 188, 189, 190]

/**
 * Select the best next question to ask using a phased strategy.
 * Each phase runs in order and short-circuits as soon as it finds a question.
 */
export function getBestQuestion(
  remainingQuestions: QuestionId[],
  candidates: Candidate[],
  history?: HistoryEntry[],
  learnedConfirmerIds?: ReadonlySet<number>,
): QuestionId | null {
  if (remainingQuestions.length === 0) return null

  // Special case: 1 candidate with an unasked confirmer → ask it for the dramatic reveal.
  if (candidates.length === 1 && learnedConfirmerIds) {
    const topId = candidates[0].id
    if (learnedConfirmerIds.has(topId)) {
      const confirmerId = topId as AnyQuestionId as QuestionId
      if (remainingQuestions.includes(confirmerId)) return confirmerId
    }
  }

  if (candidates.length <= 1) return null

  const isFamosos = detectFamosos(candidates)
  const answeredMap = buildAnsweredMap(history)

  const isAnimals = detectAnimals(candidates)

  return (
    phase0FictionSplit(remainingQuestions, candidates) ??
    phase05Pokemon(remainingQuestions, candidates) ??
    phase06AnimalBroad(remainingQuestions, candidates, isAnimals) ??
    phaseFamososGender(remainingQuestions, candidates, isFamosos) ??
    phaseFamososBroadNationality(remainingQuestions, candidates, isFamosos) ??
    phaseFlowGuided(remainingQuestions, candidates, history) ??
    phaseFamososSpecificNationality(remainingQuestions, candidates, history, isFamosos) ??
    phase1BroadUniverse(remainingQuestions, candidates) ??
    phase15SubUniverse(remainingQuestions, candidates, history) ??
    phase16PokemonTypes(remainingQuestions, candidates, history) ??
    phase17DragonBall(remainingQuestions, candidates, history) ??
    phase2DrillDown(remainingQuestions, candidates, answeredMap) ??
    phase18Confirmers(remainingQuestions, candidates, learnedConfirmerIds) ??
    phase3EntropyFallback(remainingQuestions, candidates, answeredMap)
  )
}

// ===== Phase functions =====

/** Returns Q4 when >10 candidates include a mix of fiction and real characters. */
function phase0FictionSplit(remaining: QuestionId[], candidates: Candidate[]): QuestionId | null {
  if (candidates.length <= 10 || !remaining.includes(4)) return null
  let hasFiction = false
  let hasReal = false
  for (const c of candidates) {
    const a = safeAnswer(c.answers[4])
    if (a === 'yes' || a === 'probably') hasFiction = true
    else if (a === 'no' || a === 'probably_not') hasReal = true
    if (hasFiction && hasReal) return 4
  }
  return null
}

/** Returns Q85 when ≥2 Pokémon candidates remain and it hasn't been asked yet. */
function phase05Pokemon(remaining: QuestionId[], candidates: Candidate[]): QuestionId | null {
  if (candidates.length <= 2 || !remaining.includes(85)) return null
  let count = 0
  for (const c of candidates) {
    const a = safeAnswer(c.answers[85])
    if (a === 'yes' || a === 'probably') count++
  }
  return count >= 2 ? 85 : null
}

/**
 * Animal broad questions — runs when all candidates are animals (Q2=yes).
 * Asks ANIMAL_DISCRIMINATIVE_QUESTIONS in discrimination-score order so that
 * key questions (mamífero, pequeño, granja, rosado) are asked early instead of
 * falling through to the generic entropy fallback.
 */
function phase06AnimalBroad(remaining: QuestionId[], candidates: Candidate[], isAnimals: boolean): QuestionId | null {
  if (!isAnimals || candidates.length <= 2) return null
  return findBestByGroup(remaining, candidates, ANIMAL_DISCRIMINATIVE_QUESTIONS)
}

/** Gender for famosos — best first split (~50/50). Runs before nationality. */
function phaseFamososGender(remaining: QuestionId[], candidates: Candidate[], isFamosos: boolean): QuestionId | null {
  if (!isFamosos || candidates.length <= 4) return null
  return remaining.includes(52 as QuestionId) ? 52 as QuestionId : null
}

/**
 * Broad nationality for famosos — runs after gender.
 */
function phaseFamososBroadNationality(remaining: QuestionId[], candidates: Candidate[], isFamosos: boolean): QuestionId | null {
  if (!isFamosos || candidates.length <= 8) return null
  return findBestByGroup(remaining, candidates, FAMOSOS_BROAD_NAT_QUESTIONS)
}

/**
 * Flow-guided — follows the decision tree while the pool is large (>15).
 * Once the universe is confirmed, Phase 2 takes over with targeted drill-down.
 */
function phaseFlowGuided(remaining: QuestionId[], candidates: Candidate[], history?: HistoryEntry[]): QuestionId | null {
  if (!history || history.length === 0 || candidates.length <= 15) return null
  return getFlowGuidedQuestion(remaining, candidates, history)
}

/** Specific nationality drill-down for famosos — equivalent to sub-universe for fiction. */
function phaseFamososSpecificNationality(remaining: QuestionId[], candidates: Candidate[], history: HistoryEntry[] | undefined, isFamosos: boolean): QuestionId | null {
  if (!isFamosos || candidates.length <= 2 || candidates.length > 20 || !history) return null
  const europeoConfirmed = history.some(
    h => h.questionId === (45 as QuestionId) && (h.answer === 'yes' || h.answer === 'probably')
  )
  const group = europeoConfirmed ? FAMOSOS_SPECIFIC_EU_QUESTIONS : FAMOSOS_SPECIFIC_OTHER_QUESTIONS
  return findBestByGroup(remaining, candidates, group)
}

/** Broad universe questions (franchise/genre) when many candidates remain. */
function phase1BroadUniverse(remaining: QuestionId[], candidates: Candidate[]): QuestionId | null {
  if (candidates.length <= 10) return null
  return findBestByGroup(remaining, candidates, BROAD_UNIVERSE_QUESTIONS, qId => !POKEMON_TYPE_QUESTIONS.includes(qId))
}

/** Sub-universe drill-down once a broad universe has been confirmed. */
function phase15SubUniverse(remaining: QuestionId[], candidates: Candidate[], history?: HistoryEntry[]): QuestionId | null {
  if (candidates.length <= 2 || candidates.length > 20 || !history || history.length === 0) return null
  for (const h of history) {
    if (h.answer !== 'yes' && h.answer !== 'probably') continue
    if (!BROAD_UNIVERSE_QUESTIONS.includes(h.questionId)) continue
    return findBestByGroup(remaining, candidates, SPECIFIC_UNIVERSE_QUESTIONS)
  }
  return null
}

/** Pokémon type questions — only after Q85 (¿Es un Pokémon?) was confirmed. */
function phase16PokemonTypes(remaining: QuestionId[], candidates: Candidate[], history?: HistoryEntry[]): QuestionId | null {
  if (candidates.length <= 2) return null
  const confirmed = history?.some(h => h.questionId === 85 && (h.answer === 'yes' || h.answer === 'probably'))
  if (!confirmed) return null
  return findBestByGroup(remaining, candidates, POKEMON_TYPE_QUESTIONS)
}

/** Dragon Ball-specific questions — only after Q84 was confirmed. */
function phase17DragonBall(remaining: QuestionId[], candidates: Candidate[], history?: HistoryEntry[]): QuestionId | null {
  if (candidates.length <= 2) return null
  const confirmed = history?.some(h => h.questionId === 84 && (h.answer === 'yes' || h.answer === 'probably'))
  if (!confirmed) return null
  return findBestByGroup(remaining, candidates, DRAGON_BALL_QUESTIONS)
}

/**
 * Confirmer questions — ultra-specific, each maps to a single character.
 * Runs BEFORE Phase 2 so the pool (≤15) gets the highest-signal question first
 * (weight 5.0, perfect 1-vs-N split) instead of generic attributes that may not
 * separate top candidates (e.g. RDJ and Brad Pitt are both American male Oscar winners).
 */
function phase18Confirmers(remaining: QuestionId[], candidates: Candidate[], learnedConfirmerIds?: ReadonlySet<number>): QuestionId | null {
  if (candidates.length > 15 || candidates.length <= 1) return null
  const learnedIds = learnedConfirmerIds
    ? (Array.from(learnedConfirmerIds) as AnyQuestionId[] as QuestionId[])
    : []
  return findBestByGroup(remaining, candidates, [...(CONFIRMER_QUESTIONS as QuestionId[]), ...learnedIds])
}

/** Role, power, profession, and discriminative questions for targeted drill-down. */
function phase2DrillDown(remaining: QuestionId[], candidates: Candidate[], answeredMap: Map<QuestionId, Answer>): QuestionId | null {
  if (candidates.length <= 4) return null
  const eligible = makeEligibilityFilter(answeredMap)
  const typeFilter = (qId: QuestionId) =>
    eligible(qId) && (
      CATEGORY_QUESTIONS.includes(qId) ||
      ROLE_QUESTIONS.includes(qId) ||
      POWER_QUESTIONS.includes(qId) ||
      PROFESSION_QUESTIONS.includes(qId) ||
      NATIONALITY_QUESTIONS.includes(qId) ||
      DISCRIMINATIVE_QUESTIONS.includes(qId) ||
      ANIMAL_DISCRIMINATIVE_QUESTIONS.includes(qId)
    )
  return findBestWeighted(remaining, candidates, typeFilter, qId => {
    if (ROLE_QUESTIONS.includes(qId)) return 4.0
    if (POWER_QUESTIONS.includes(qId)) return 3.5
    if (CATEGORY_QUESTIONS.includes(qId)) return 3.0
    if (NATIONALITY_QUESTIONS.includes(qId)) return 3.5
    if (DISCRIMINATIVE_QUESTIONS.includes(qId)) return 3.0
    if (PROFESSION_QUESTIONS.includes(qId)) return 2.5
    return 1.0
  })
}

/** Entropy fallback — picks the question that best splits the remaining candidates. */
function phase3EntropyFallback(remaining: QuestionId[], candidates: Candidate[], answeredMap: Map<QuestionId, Answer>): QuestionId | null {
  const eligible = makeEligibilityFilter(answeredMap)
  let best: QuestionId | null = null
  let bestScore = -1

  for (const qId of remaining) {
    if (!eligible(qId)) continue
    const { positive, negative, neutral } = countAnswers(candidates, qId)
    const total = positive + negative + neutral
    if (total === 0) continue
    let score = getDiscriminationScore(positive, negative, neutral, total)
    if (score === 0) continue
    if (neutral / total < 0.15) score *= 1.2
    if (score > bestScore) { bestScore = score; best = qId }
  }

  return best
}

// ===== Shared utilities =====

function allCandidatesAnswer(candidates: Candidate[], qId: QuestionId, accepted: Answer[]): boolean {
  return candidates.length > 0 && candidates.every(c => accepted.includes(safeAnswer(c.answers[qId])))
}

function detectAnimals(candidates: Candidate[]): boolean {
  return allCandidatesAnswer(candidates, 2 as QuestionId, ['yes', 'probably'])
}

function detectFamosos(candidates: Candidate[]): boolean {
  return allCandidatesAnswer(candidates, 4 as QuestionId, ['no', 'probably_not'])
}

function buildAnsweredMap(history?: HistoryEntry[]): Map<QuestionId, Answer> {
  return history && history.length > 0
    ? new Map(history.map(h => [h.questionId, h.answer]))
    : new Map<QuestionId, Answer>()
}

function makeEligibilityFilter(answeredMap: Map<QuestionId, Answer>): (qId: QuestionId) => boolean {
  if (answeredMap.size === 0) return () => true
  return (qId) => prerequisitesStrictMet(qId, answeredMap) && !isExcluded(qId, answeredMap)
}

// ===== Flow-Guided Selection =====

function getFlowGuidedQuestion(
  remainingQuestions: QuestionId[],
  candidates: { answers: Record<QuestionId, Answer> }[],
  history: { questionId: QuestionId; answer: Answer }[]
): QuestionId | null {
  const answeredSet = new Set(history.map(h => h.questionId))
  const answerMap = new Map(history.map(h => [h.questionId, h.answer]))

  // Step 1: Direct follow-up from the last answered question's `next` mapping.
  // Must also pass prerequisite check — avoids following anime sub-flows for non-anime chars.
  for (let i = history.length - 1; i >= 0; i--) {
    const last = history[i]
    const node = FLOW_MAP.get(last.questionId)
    if (!node?.next) continue

    const nextId = node.next[last.answer] ?? node.next['default']
    if (
      nextId != null &&
      remainingQuestions.includes(nextId) &&
      !answeredSet.has(nextId) &&
      prerequisitesStrictMet(nextId as QuestionId, answerMap) &&
      !isExcluded(nextId as QuestionId, answerMap)
    ) {
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
