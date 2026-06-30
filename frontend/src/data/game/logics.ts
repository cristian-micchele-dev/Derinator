import { Answer } from '../../types'
import { QuestionId } from '../questions'
import { IMPLICATIONS } from './rules/implications'
import { CONTRADICTIONS } from './rules/contradictions'
import { calculateScore } from './scoring'

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
const GAP_INITIAL = 0.40
const GAP_AFTER_15_QUESTIONS = 0.30
const GAP_AFTER_20_QUESTIONS = 0.20
const GAP_FICTION_HEAVY = 0.50

// Score thresholds for guessing by candidate pool size
const SCORE_2_CANDIDATES = 0.95
const SCORE_5_CANDIDATES = 0.97
const SCORE_5_CANDIDATES_LATE = 0.85
const SCORE_10_CANDIDATES = 0.98
const SCORE_10plus_CANDIDATES = 0.99

// Gap thresholds for guessing by candidate pool size
const GAP_5_CANDIDATES = 0.50
const GAP_10_CANDIDATES = 0.60
const GAP_10plus_EARLY = 0.85
const GAP_10plus_EARLY_FICTION = 0.60
const GAP_10plus_LATE = 0.70
const GAP_10plus_LATE_FICTION = 0.50

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

  for (const [srcId, srcAnswer, excludeId] of CONTRADICTIONS) {
    const currentAnswer = history.find(h => h.questionId === srcId)?.answer
    if (currentAnswer === srcAnswer) {
      excluded.add(excludeId)
    }
  }

  const expandedHistory = applyImplications(history)
  for (const [srcId, srcAnswer, excludeId] of CONTRADICTIONS) {
    const currentAnswer = expandedHistory.find(h => h.questionId === srcId)?.answer
    if (currentAnswer === srcAnswer) {
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
 */
export function filterCandidates(
  characters: { id: number; name: string; description?: string; answers: Record<QuestionId, Answer> }[],
  history: { questionId: QuestionId; answer: Answer }[]
): { id: number; name: string; description?: string; answers: Record<QuestionId, Answer>; score: number }[] {
  const expandedHistory = applyImplications(history)

  const userAnswers: Record<QuestionId, Answer> = {} as Record<QuestionId, Answer>
  for (const h of expandedHistory) {
    userAnswers[h.questionId] = h.answer
  }

  const scored = characters.map((char) => ({
    ...char,
    score: calculateScore(char.answers, userAnswers),
  }))

  scored.sort((a, b) => b.score - a.score)

  const topScore = scored[0]?.score ?? 0
  const threshold = Math.max(FILTER_MIN_THRESHOLD, topScore - FILTER_SCORE_GAP)

  return scored.filter(c => c.score >= threshold)
}

/**
 * Detect if candidate pool is fiction-heavy (many anime/game/fiction characters
 * that share similar base answers, making differentiation harder).
 */
export function detectFictionHeavy(candidates: { answers: Record<QuestionId, Answer> }[]): boolean {
  const fictionQuestions: QuestionId[] = [
    4, 59, 84, 85, 93, 94, 111, 112, 113, 114, 115, 116, 117, 131, 132, 133,
  ]

  const fictionCount = candidates.filter(c => {
    const a = c.answers
    return fictionQuestions.some(qId => a[qId] === 'yes')
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

  const isFictionHeavy = detectFictionHeavy(candidates)
  const minQuestions = isFictionHeavy ? MIN_QUESTIONS_FICTION_HEAVY : MIN_QUESTIONS_NORMAL

  if (questionsAsked < minQuestions && !noMoreQuestions) {
    return { shouldGuess: false, confidence: 0, gap: 0 }
  }

  if (candidates.length === 1) {
    return { shouldGuess: true, confidence: CONFIDENCE_SINGLE_CANDIDATE, gap: 1 }
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
