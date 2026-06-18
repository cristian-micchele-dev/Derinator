/**
 * Game engine barrel export.
 * 
 * Centralizes access to scoring, logic, question selection,
 * question flow, and validation modules.
 */

// Scoring
export { safeAnswer, calculateScore, getDiscriminationScore } from './scoring'
export {
  CATEGORY_QUESTIONS,
  BROAD_UNIVERSE_QUESTIONS,
  SPECIFIC_UNIVERSE_QUESTIONS,
  UNIVERSE_QUESTIONS,
  POKEMON_TYPE_QUESTIONS,
  ROLE_QUESTIONS,
  POWER_QUESTIONS,
  NATIONALITY_QUESTIONS,
  DISCRIMINATIVE_QUESTIONS,
} from './scoring'

// Logic
export { filterCandidates, applyImplications, getContradictedQuestions, getConfidenceMetrics } from './logics'

// Question selection
export { getBestQuestion } from './questionSelection'

// Question flow
export { QUESTION_FLOW, FLOW_MAP, getQuestionWeight } from './questionFlow'
export type { FlowNode } from './questionFlow'

// Validation
export { sanitizeInput, validateCharacterInput } from './validation'
export type { ValidationError, ValidatedCharacterInput, ValidCategory, ValidSubcategory } from './validation'

// Rules
export { IMPLICATIONS } from './rules/implications'
export { CONTRADICTIONS } from './rules/contradictions'
