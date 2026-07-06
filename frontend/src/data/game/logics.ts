import { Answer } from '../../types'
import { QuestionId } from '../questions'
import { IMPLICATIONS } from './rules/implications'
import { CONTRADICTIONS } from './rules/contradictions'
import { calculateScore } from './scoring'
import { SPECIFIC_UNIVERSE_QUESTIONS } from './questionGroups'

// ===== Filter Thresholds =====

const FILTER_MIN_THRESHOLD = 0.25
const FILTER_SCORE_GAP = 0.35

// ===== Confidence Thresholds =====

const CONFIDENCE_SINGLE_CANDIDATE = 100
const CONFIDENCE_ABSOLUTE_WEIGHT = 0.6
const CONFIDENCE_RELATIVE_WEIGHT = 0.4
const CONFIDENCE_GAP_MULTIPLIER = 200

// Minimum questions before guessing is allowed
const MIN_QUESTIONS_NORMAL = 5
const MIN_QUESTIONS_FICTION_HEAVY = 8
const FICTION_HEAVY_RATIO = 0.5

// Gap thresholds that relax over time
const GAP_INITIAL = 0.25
const GAP_AFTER_15_QUESTIONS = 0.18
const GAP_AFTER_20_QUESTIONS = 0.12
const GAP_FICTION_HEAVY = 0.35

// Score thresholds for guessing by candidate pool size
const SCORE_2_CANDIDATES = 0.72
const SCORE_5_CANDIDATES = 0.80
const SCORE_5_CANDIDATES_LATE = 0.70
const SCORE_10_CANDIDATES = 0.88
const SCORE_10plus_CANDIDATES = 0.92

// Gap thresholds for guessing by candidate pool size
const GAP_5_CANDIDATES = 0.30
const GAP_10_CANDIDATES = 0.40
const GAP_10plus_EARLY = 0.55
const GAP_10plus_EARLY_FICTION = 0.45
const GAP_10plus_LATE = 0.40
const GAP_10plus_LATE_FICTION = 0.35

// Candidate pool size boundaries
const CANDIDATES_FEW = 2
const CANDIDATES_MODERATE = 5
const CANDIDATES_MANY = 10

// Question count boundaries
const QUESTIONS_MID = 15
const QUESTIONS_LATE = 20
const QUESTIONS_FICTION_MIN = 10

// Implication passes
const IMPLICATION_PASSES = 5

/**
 * Apply implications: given a history of answers, derive additional answers.
 */
export function applyImplications(
  history: { questionId: QuestionId; answer: Answer }[]
): { questionId: QuestionId; answer: Answer }[] {
  const answers = new Map<QuestionId, Answer>()

  for (const h of history) {
    answers.set(h.questionId, h.answer)
  }

  for (let pass = 0; pass < IMPLICATION_PASSES; pass++) {
    let changed = false
    for (const [srcId, srcAnswer, targetId, impliedAnswer] of IMPLICATIONS) {
      const currentAnswer = answers.get(srcId)
      if (currentAnswer === srcAnswer) {
        const existingTarget = answers.get(targetId)
        if (existingTarget === undefined) {
          answers.set(targetId, impliedAnswer)
          changed = true
        }
      }
    }
    if (!changed) break
  }

  const result: { questionId: QuestionId; answer: Answer }[] = []
  for (const [qId, answer] of answers) {
    result.push({ questionId: qId, answer })
  }
  return result
}

/**
 * Get questions that should be excluded based on answers given so far.
 */
export function getContradictedQuestions(
  history: { questionId: QuestionId; answer: Answer }[]
): Set<QuestionId> {
  const excluded = new Set<QuestionId>()
  const expandedHistory = applyImplications(history)
  const expandedMap = new Map(expandedHistory.map(h => [h.questionId, h.answer]))

  for (const [srcId, srcAnswer, excludeId] of CONTRADICTIONS) {
    if (expandedMap.get(srcId) === srcAnswer) {
      excluded.add(excludeId)
    }
  }

  for (const h of expandedHistory) {
    excluded.add(h.questionId)
  }

  return excluded
}

/**
 * Filter and score candidates based on answer history.
 *
 * Scoring uses DIRECT answers only (not implications). This is intentional:
 * applyImplications for Q4='no' (famosos mode) derives 25+ fiction-universe
 * answers that all match every famosos character, drowning out the signal from
 * actual discriminating questions (nationality, profession) and preventing
 * the candidate pool from shrinking. Implications are still used by
 * getContradictedQuestions to exclude already-answered questions from selection.
 */
export function filterCandidates(
  characters: { id: number; name: string; description?: string; answers: Record<QuestionId, Answer> }[],
  history: { questionId: QuestionId; answer: Answer }[],
  learnedConfirmerIds?: ReadonlySet<number>,
): { id: number; name: string; description?: string; answers: Record<QuestionId, Answer>; score: number }[] {
  const userAnswers: Record<QuestionId, Answer> = {} as Record<QuestionId, Answer>
  for (const h of history) {
    userAnswers[h.questionId] = h.answer
  }

  const scored = characters.map((char) => ({
    ...char,
    score: calculateScore(char.answers, userAnswers, learnedConfirmerIds),
  }))

  scored.sort((a, b) => b.score - a.score)

  const topScore = scored[0]?.score ?? 0
  const threshold = Math.max(FILTER_MIN_THRESHOLD, topScore - FILTER_SCORE_GAP)

  return scored.filter(c => c.score >= threshold)
}

// Anime/game universe question IDs used to detect fiction-heavy pools.
// Derived from SPECIFIC_UNIVERSE_QUESTIONS so new franchises propagate automatically.
// Western franchises (Disney, Marvel, DC, Star Wars, HP) are intentionally excluded:
// their characters are visually distinctive and don't share the disambiguation difficulty
// that anime/game characters have (transformations, power-ups, shared tropes).
const FICTION_DETECTION_QUESTIONS: QuestionId[] = [
  4 as QuestionId,  // ¿Es de ficción? — root flag
  59 as QuestionId, // ¿Es de anime? — broad anime bucket
  84 as QuestionId, // ¿Es de Dragon Ball?
  85 as QuestionId, // ¿Es un Pokémon?
  ...SPECIFIC_UNIVERSE_QUESTIONS,
]

/**
 * Detect if candidate pool is fiction-heavy (many anime/game/fiction characters
 * that share similar base answers, making differentiation harder).
 */
export function detectFictionHeavy(candidates: { answers: Record<QuestionId, Answer> }[]): boolean {
  const fictionCount = candidates.filter(c => {
    const a = c.answers
    return FICTION_DETECTION_QUESTIONS.some(qId => a[qId] === 'yes')
  }).length

  return candidates.length > 0 && fictionCount / candidates.length > FICTION_HEAVY_RATIO
}

/**
 * Calculate confidence metrics for the top candidate.
 */
export function getConfidenceMetrics(
  candidates: { id: number; name: string; description?: string; answers: Record<QuestionId, Answer>; score: number }[],
  noMoreQuestions: boolean = false,
  questionsAsked: number = 0
): { shouldGuess: boolean; confidence: number; gap: number } {
  if (candidates.length === 0) {
    return { shouldGuess: false, confidence: 0, gap: 0 }
  }

  // Single candidate → always guess, regardless of question count
  if (candidates.length === 1) {
    return { shouldGuess: true, confidence: CONFIDENCE_SINGLE_CANDIDATE, gap: 1 }
  }

  const isFictionHeavy = detectFictionHeavy(candidates)
  const minQuestions = isFictionHeavy ? MIN_QUESTIONS_FICTION_HEAVY : MIN_QUESTIONS_NORMAL

  if (questionsAsked < minQuestions && !noMoreQuestions) {
    return { shouldGuess: false, confidence: 0, gap: 0 }
  }

  const top = candidates[0]
  const second = candidates[1]
  const gap = top.score - second.score

  const absoluteConfidence = Math.max(0, top.score * 100)
  const relativeConfidence = Math.min(100, gap * CONFIDENCE_GAP_MULTIPLIER)
  const confidence = Math.round(
    absoluteConfidence * CONFIDENCE_ABSOLUTE_WEIGHT +
    relativeConfidence * CONFIDENCE_RELATIVE_WEIGHT
  )

  // Gap threshold that relaxes over time
  let gapThreshold = GAP_INITIAL
  if (questionsAsked >= QUESTIONS_MID) gapThreshold = GAP_AFTER_15_QUESTIONS
  if (questionsAsked >= QUESTIONS_LATE) gapThreshold = GAP_AFTER_20_QUESTIONS
  if (isFictionHeavy && questionsAsked < QUESTIONS_MID) {
    gapThreshold = Math.max(gapThreshold, GAP_FICTION_HEAVY)
  }

  let shouldGuess = false

  if (candidates.length <= CANDIDATES_FEW) {
    shouldGuess = top.score >= SCORE_2_CANDIDATES && gap >= gapThreshold
  } else if (candidates.length <= CANDIDATES_MODERATE) {
    const tightThreshold = questionsAsked >= QUESTIONS_LATE ? SCORE_5_CANDIDATES_LATE : SCORE_5_CANDIDATES
    const tightGap = questionsAsked >= QUESTIONS_LATE ? gapThreshold : GAP_5_CANDIDATES
    shouldGuess = top.score >= tightThreshold && gap >= tightGap
  } else if (candidates.length <= CANDIDATES_MANY) {
    shouldGuess = top.score >= SCORE_10_CANDIDATES && gap >= GAP_10_CANDIDATES
  } else {
    // With many candidates, be more conservative
    // Fiction-heavy pools need even more questions
    const fictionMinQuestions = isFictionHeavy ? QUESTIONS_FICTION_MIN : QUESTIONS_MID - 3
    if (questionsAsked < fictionMinQuestions) {
      shouldGuess = false
    } else if (questionsAsked < QUESTIONS_MID) {
      const minGap = isFictionHeavy ? GAP_10plus_EARLY_FICTION : GAP_10plus_EARLY
      shouldGuess = top.score >= SCORE_10plus_CANDIDATES && gap >= minGap
    } else {
      const minGap = isFictionHeavy ? GAP_10plus_LATE_FICTION : GAP_10plus_LATE
      shouldGuess = top.score >= SCORE_10plus_CANDIDATES && gap >= minGap
    }
  }

  if (noMoreQuestions && candidates.length > 0) {
    shouldGuess = true
  }

  return { shouldGuess, confidence, gap }
}
