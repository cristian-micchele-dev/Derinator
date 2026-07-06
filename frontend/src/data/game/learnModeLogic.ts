import type { Answer } from '../../types'
import { questions, QuestionId } from '../questions'
import { getContradictedQuestions, prerequisitesStrictMet, isExcluded } from '.'
import {
  EXCLUSIVE_GROUPS,
  LEARN_EXCLUDED,
  LEARN_QUESTIONS,
  LEARN_DEFAULT_FICTION,
  LEARN_DEFAULT_REAL,
} from './learnModeConfig'

/** Auto-fill exclusive group siblings with "no" when one is "yes" */
export function applyExclusiveGroups(
  answers: Record<number, Answer>,
  questionId: QuestionId,
  answer: Answer,
): Record<number, Answer> {
  if (answer !== 'yes') return answers
  const updated = { ...answers }
  for (const group of EXCLUSIVE_GROUPS) {
    if (group.includes(questionId)) {
      for (const siblingId of group) {
        if (siblingId !== questionId && !(siblingId in updated)) {
          updated[siblingId] = 'no'
        }
      }
      break
    }
  }
  return updated
}

/** Compute eligible remaining questions given current answers */
export function getRemainingQuestions(
  answersRecord: Record<number, Answer>,
): QuestionId[] {
  const answerEntries = Object.entries(answersRecord).map(
    ([k, v]) => [Number(k) as QuestionId, v as Answer] as const
  )
  const answerMap = new Map(answerEntries)
  const newHistory = answerEntries.map(([questionId, answer]) => ({ questionId, answer }))
  const contradicted = getContradictedQuestions(newHistory)
  const answeredIds = new Set(answerEntries.map(([k]) => k))

  return questions
    .filter((q) => !answeredIds.has(q.id) && !contradicted.has(q.id) && !LEARN_EXCLUDED.has(q.id))
    .filter((q) => prerequisitesStrictMet(q.id, answerMap) && !isExcluded(q.id, answerMap))
    .map((q) => q.id)
}

/** Pick the next question for LearnMode: curated list first, then EIG-based */
export function getLearnQuestion(
  remaining: QuestionId[],
  subcategory: string | undefined,
  category?: string,
): QuestionId | null {
  const remainingSet = new Set(remaining)
  const defaultList = (category === 'famoso' || category === 'animal') ? LEARN_DEFAULT_REAL : LEARN_DEFAULT_FICTION
  const priorityList = (subcategory && LEARN_QUESTIONS[subcategory]) || defaultList

  // Phase 1: curated list
  for (const qId of priorityList) {
    if (remainingSet.has(qId)) return qId
  }

  return null
}
