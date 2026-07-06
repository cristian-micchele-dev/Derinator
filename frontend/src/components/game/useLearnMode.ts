import { useState } from 'react'
import { Answer, CharacterCategory, CharacterSubcategory } from '../../types'
import { QuestionId } from '../../data/questions'
import { useLearnValidation } from './useLearnValidation'
import { useLearnQuestions } from './useLearnQuestions'
import type { LearnPersonType } from './useLearnQuestions'

export type { LearnModePhase, LearnPersonType } from './useLearnQuestions'

interface UseLearnModeProps {
  history: { questionId: QuestionId; answer: Answer }[]
  onComplete: () => void
  onCancel: () => void
  defeatedByName?: string
  gameCategory?: 'all' | 'personajes' | 'animales' | 'famosos'
}

export function useLearnMode({
  history,
  onComplete,
  onCancel,
  defeatedByName,
  gameCategory,
}: UseLearnModeProps) {
  const defaultCategory: CharacterCategory = gameCategory === 'animales' ? 'animal' : 'personaje'
  const defaultPersonType: LearnPersonType = gameCategory === 'famosos' ? 'famoso' : 'ficcion'
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Form fields
  const [learnName, setLearnName] = useState('')
  const [learnDescription, setLearnDescription] = useState('')
  const [learnCategory, setLearnCategory] = useState<CharacterCategory>(defaultCategory)
  const [learnPersonType, setLearnPersonType] = useState<LearnPersonType>(defaultPersonType)
  const [learnSubcategory, setLearnSubcategory] = useState<CharacterSubcategory | undefined>(undefined)
  const [learnHint, setLearnHint] = useState('')

  const questions = useLearnQuestions({
    history,
    learnName,
    learnDescription,
    learnCategory,
    learnPersonType,
    learnSubcategory,
    learnHint,
    setSubmitError,
  })

  const { contradictionError, similarityWarning } = useLearnValidation({
    learnAnswers: questions.learnAnswers,
    learnName,
  })

  const validationError = submitError || contradictionError

  return {
    learnName, setLearnName,
    learnDescription, setLearnDescription,
    learnCategory, setLearnCategory,
    learnPersonType, setLearnPersonType,
    learnSubcategory, setLearnSubcategory,
    learnHint, setLearnHint,
    ...questions,
    validationError,
    similarityWarning,
    defeatedByName,
    onComplete,
    onCancel,
  }
}
