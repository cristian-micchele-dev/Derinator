import { QuestionId } from '../questions'
import { Answer } from '../../types'
import { ANIMAL_FLOWS } from './flows/animals'
import { REAL_PEOPLE_FLOWS } from './flows/real-people'
import { FICTIONAL_FLOWS } from './flows/fictional'

/**
 * QuestionFlow defines a hierarchical decision tree for teaching characters.
 * Each node specifies:
 * - id: the question to ask
 * - next: what question to ask next based on the answer
 * - prerequisites: answers that must exist for this question to be relevant
 * - exclusions: answers that make this question irrelevant
 * - alternatives: fallback questions if user answers 'dont_know'
 * - weight: importance for similarity comparison (1.0 = default)
 */

export interface FlowNode {
  id: QuestionId
  next?: Partial<Record<Answer | 'default', QuestionId | null>>
  prerequisites?: Array<{ questionId: QuestionId; answers: Answer[] }>
  exclusions?: Array<{ questionId: QuestionId; answers: Answer[] }>
  alternatives?: QuestionId[]
  weight?: number
}

// ===== HUB NODES (routing / branching logic) =====
const HUB_FLOWS: FlowNode[] = [
  // ===== ROOT =====
  {
    id: 1, // ¿Es un ser vivo?
    next: {
      no: 21,
      default: 2,
    },
  },

  // ===== BRANCH: Not alive → Objects =====
  {
    id: 21, // ¿Es un objeto?
    prerequisites: [{ questionId: 1, answers: ['no'] }],
    next: {
      yes: 22,
      default: null,
    },
  },
  {
    id: 22, // ¿Es tecnológico?
    prerequisites: [{ questionId: 1, answers: ['no'] }, { questionId: 21, answers: ['yes'] }],
    next: { default: 23 },
  },
  {
    id: 23, // ¿Se usa a diario?
    prerequisites: [{ questionId: 1, answers: ['no'] }],
    next: { default: null },
  },
  {
    id: 24, // ¿Es un lugar?
    prerequisites: [{ questionId: 1, answers: ['no'] }, { questionId: 21, answers: ['no'] }],
    next: { default: null },
  },

  // ===== BRANCH: Alive → Animal? =====
  {
    id: 2, // ¿Es un animal?
    prerequisites: [{ questionId: 1, answers: ['yes', 'probably'] }],
    next: {
      yes: 5,
      no: 3,
      default: 3,
    },
    alternatives: [3],
  },

  // ===== HUMAN TREE =====
  {
    id: 3, // ¿Es un ser humano?
    prerequisites: [{ questionId: 1, answers: ['yes', 'probably'] }],
    next: {
      yes: 15,
      no: 4,
      default: 15,
    },
    alternatives: [4],
  },

  // ===== HUMAN + FICTIONAL =====
  {
    id: 15, // ¿Es famoso?
    prerequisites: [{ questionId: 3, answers: ['yes'] }],
    next: { default: 142 },
  },
  {
    id: 142, // ¿Ganó un premio importante (Oscar, Grammy, Balón de Oro, etc.)?
    prerequisites: [{ questionId: 3, answers: ['yes'] }, { questionId: 4, answers: ['no', 'probably_not'] }],
    next: { default: 43 },
    weight: 2.0,
  },
  {
    id: 43, // ¿Está vivo/a actualmente?
    prerequisites: [{ questionId: 3, answers: ['yes'] }],
    next: { default: 4 },
  },
  {
    id: 4, // ¿Es de ficción? (human path)
    prerequisites: [{ questionId: 3, answers: ['yes'] }],
    next: {
      yes: 54,
      no: 16,
      default: 54,
    },
    alternatives: [16],
  },
]

// The complete flow. Questions are ordered by priority within each branch.
export const QUESTION_FLOW: FlowNode[] = [
  ...HUB_FLOWS,
  ...ANIMAL_FLOWS,
  ...REAL_PEOPLE_FLOWS,
  ...FICTIONAL_FLOWS,
]

// Build a map for fast lookup
export const FLOW_MAP: Map<QuestionId, FlowNode> = new Map(
  QUESTION_FLOW.map((node) => [node.id, node])
)

/**
 * Get the weight of a question for similarity calculation.
 */
export function getQuestionWeight(questionId: QuestionId): number {
  const node = FLOW_MAP.get(questionId)
  return node?.weight ?? 1.0
}


