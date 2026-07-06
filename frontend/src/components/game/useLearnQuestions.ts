import { useState, useMemo, useEffect, useCallback } from 'react'
import { Answer, CharacterCategory, CharacterSubcategory } from '../../types'
import { questions, QuestionId } from '../../data/questions'
import { saveLearnedCharacter } from '../../data/learnedStorage'
import { applyImplications, prerequisitesStrictMet, isExcluded } from '../../data/game'
import {
  MIN_MANUAL_QUESTIONS,
  LEARN_EXCLUDED,
  SUBCATEGORY_SEEDS,
  CATEGORY_SEEDS,
} from '../../data/game/learnModeConfig'
import {
  applyExclusiveGroups,
  getRemainingQuestions,
  getLearnQuestion,
} from '../../data/game/learnModeLogic'
export type LearnModePhase = 'name' | 'questions' | 'hint' | 'done'
export type LearnPersonType = 'ficcion' | 'famoso'

interface UseLearnQuestionsProps {
  history: { questionId: QuestionId; answer: Answer }[]
  learnName: string
  learnDescription: string
  learnCategory: CharacterCategory
  learnPersonType: LearnPersonType
  learnSubcategory: CharacterSubcategory | undefined
  learnHint: string
  setSubmitError: (err: string | null) => void
}

export function useLearnQuestions({
  history,
  learnName,
  learnDescription,
  learnCategory,
  learnPersonType,
  learnSubcategory,
  learnHint,
  setSubmitError,
}: UseLearnQuestionsProps) {
  const [phase, setPhase] = useState<LearnModePhase>('name')
  const [learnAnswers, setLearnAnswers] = useState<Record<number, Answer>>({})
  const [currentQuestionId, setCurrentQuestionId] = useState<QuestionId | null>(null)
  const [navStack, setNavStack] = useState<QuestionId[]>([])
  const [seedCount, setSeedCount] = useState(0)
  const [isSaving, setIsSaving] = useState(false)

  // Pre-fill answers from game history
  useEffect(() => {
    if (phase !== 'name') return
    const prefilled: Record<number, Answer> = {}
    for (const h of history) {
      prefilled[h.questionId] = h.answer
    }
    setLearnAnswers(prefilled)
  }, [phase, history])

  const startQuestions = useCallback(() => {
    setPhase('questions')
    setNavStack([])

    const seeds: Record<number, Answer> = {}
    if (learnSubcategory && SUBCATEGORY_SEEDS[learnSubcategory]) {
      Object.assign(seeds, SUBCATEGORY_SEEDS[learnSubcategory])
    } else if (learnPersonType === 'famoso') {
      Object.assign(seeds, CATEGORY_SEEDS['famoso'])
    } else if (CATEGORY_SEEDS[learnCategory]) {
      Object.assign(seeds, CATEGORY_SEEDS[learnCategory])
    }

    const merged = { ...seeds, ...learnAnswers }
    setSeedCount(Object.keys(merged).length)
    setLearnAnswers(merged)

    const answeredIds = new Set([
      ...Object.keys(seeds).map(Number),
      ...Object.keys(learnAnswers).map(Number),
    ])
    const mergedAnswers = { ...seeds, ...learnAnswers }
    const answerMap = new Map(
      Object.entries(mergedAnswers).map(([k, v]) => [Number(k) as QuestionId, v as Answer])
    )

    const eligible = questions
      .filter(
        (q) =>
          !answeredIds.has(q.id) &&
          !LEARN_EXCLUDED.has(q.id) &&
          prerequisitesStrictMet(q.id, answerMap) &&
          !isExcluded(q.id, answerMap)
      )
      .map((q) => q.id)

    const effectiveCategory = learnPersonType === 'famoso' ? 'famoso' : learnCategory
    setCurrentQuestionId(getLearnQuestion(eligible, learnSubcategory, effectiveCategory))
  }, [learnSubcategory, learnCategory, learnPersonType, learnAnswers])

  const handleLearnNameSubmit = useCallback(() => {
    if (!learnName.trim()) return
    startQuestions()
  }, [learnName, startQuestions])

  const currentQuestion = useMemo(() => {
    if (!currentQuestionId) return null
    return questions.find((q) => q.id === currentQuestionId) || null
  }, [currentQuestionId])

  const questionsAnswered = Object.keys(learnAnswers).length

  const handleLearnAnswer = useCallback(
    (answer: Answer) => {
      if (!currentQuestionId) return

      const baseAnswers = { ...learnAnswers, [currentQuestionId]: answer }
      const newAnswers = applyExclusiveGroups(baseAnswers, currentQuestionId, answer)
      setLearnAnswers(newAnswers)
      setNavStack((prev) => [...prev, currentQuestionId])

      const remaining = getRemainingQuestions(newAnswers)
      setCurrentQuestionId(getLearnQuestion(remaining, learnSubcategory, learnPersonType === 'famoso' ? 'famoso' : learnCategory))
    },
    [currentQuestionId, learnAnswers, learnSubcategory, learnCategory]
  )

  const handleLearnBack = useCallback(() => {
    if (navStack.length === 0) return

    const lastAnswered = navStack[navStack.length - 1]
    setNavStack((prev) => prev.slice(0, -1))

    const newAnswers = { ...learnAnswers }
    delete newAnswers[lastAnswered]
    setLearnAnswers(newAnswers)

    if (Object.keys(newAnswers).length === 0) {
      setCurrentQuestionId(1 as QuestionId)
      return
    }

    const remaining = getRemainingQuestions(newAnswers)
    setCurrentQuestionId(getLearnQuestion(remaining, learnSubcategory, learnPersonType === 'famoso' ? 'famoso' : learnCategory))
  }, [navStack, learnAnswers, learnSubcategory, learnCategory])

  const handleFinishLearn = useCallback(async () => {
    if (isSaving) return
    setSubmitError(null)
    setIsSaving(true)

    const historyEntries = Object.entries(learnAnswers).map(([k, v]) => ({
      questionId: Number(k) as QuestionId,
      answer: v as Answer,
    }))
    const expanded = applyImplications(historyEntries)
    const completeAnswers: Record<number, Answer> = {}
    for (const h of expanded) {
      completeAnswers[h.questionId] = h.answer
    }

    const description = learnDescription.trim() || learnName.trim()

    try {
      const saved = await saveLearnedCharacter({
        name: learnName.trim(),
        description,
        category: learnCategory,
        subcategory: learnSubcategory,
        answers: completeAnswers,
        confirmerQuestion: learnHint.trim() || undefined,
      })

      if (saved.success) {
        setPhase('done')
      } else {
        const msg = saved.errors?.map((e) => e.message).join('. ') || 'Error al guardar'
        setSubmitError(msg)
      }
    } catch {
      setSubmitError('Error de conexión. Intentalo de nuevo.')
    } finally {
      setIsSaving(false)
    }
  }, [isSaving, learnAnswers, learnName, learnDescription, learnHint, learnCategory, learnSubcategory, setSubmitError])

  const manualAnswerCount = questionsAnswered - seedCount
  const noMoreQuestions = !currentQuestionId
  const canFinish = manualAnswerCount >= MIN_MANUAL_QUESTIONS || noMoreQuestions
  const questionsRemaining = Math.max(0, MIN_MANUAL_QUESTIONS - manualAnswerCount)

  const startHint = useCallback(() => setPhase('hint'), [])

  const handleSaveHint = useCallback(() => {
    setPhase('questions')
    setCurrentQuestionId(null)
  }, [])

  return {
    phase,
    learnAnswers,
    currentQuestion,
    questionsAnswered,
    manualAnswerCount,
    canFinish,
    questionsRemaining,
    isSaving,
    navStack,
    handleLearnNameSubmit,
    handleLearnAnswer,
    handleLearnBack,
    handleFinishLearn,
    startHint,
    handleSaveHint,
  }
}
