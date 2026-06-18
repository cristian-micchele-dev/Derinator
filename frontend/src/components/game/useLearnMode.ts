import { useState, useMemo, useEffect, useCallback } from 'react'
import { Answer, CharacterCategory, CharacterSubcategory } from '../../types'
import { questions, QuestionId } from '../../data/questions'
import { getAllCharacters } from '../../data/characters'
import { saveLearnedCharacter } from '../../data/learnedStorage'
import { filterCandidates, getContradictedQuestions, getConfidenceMetrics, getBestQuestion, getQuestionWeight } from '../../data/game'

export type LearnModePhase = 'name' | 'questions' | 'done' | 'practice' | 'practice_result'

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

  const [phase, setPhase] = useState<LearnModePhase>('name')
  const [learnName, setLearnName] = useState('')
  const [learnDescription, setLearnDescription] = useState('')
  const [learnCategory, setLearnCategory] = useState<CharacterCategory>(defaultCategory)
  const [learnSubcategory, setLearnSubcategory] = useState<CharacterSubcategory | undefined>(undefined)
  const [learnAnswers, setLearnAnswers] = useState<Record<number, Answer>>({})
  const [currentQuestionId, setCurrentQuestionId] = useState<QuestionId | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [similarityWarning, setSimilarityWarning] = useState<string | null>(null)

  // Practice simulation state
  const [practiceStep, setPracticeStep] = useState(0)
  const [practiceLog, setPracticeLog] = useState<{ question: string; answer: Answer }[]>([])
  const [practiceGuess, setPracticeGuess] = useState<string | null>(null)

  // Navigation stack for going back
  const [navStack, setNavStack] = useState<QuestionId[]>([])

  // Pre-fill answers from game history
  useEffect(() => {
    if (phase !== 'name') return
    const prefilled: Record<number, Answer> = {}
    for (const h of history) {
      prefilled[h.questionId] = h.answer
    }
    setLearnAnswers(prefilled)
  }, [phase, history])

  // Start the question flow
  const startQuestions = useCallback(() => {
    setPhase('questions')
    setNavStack([])
    setCurrentQuestionId(1)
  }, [])

  const handleLearnNameSubmit = useCallback(() => {
    if (!learnName.trim()) return
    startQuestions()
  }, [learnName, startQuestions])

  // Get the current question object
  const currentQuestion = useMemo(() => {
    if (!currentQuestionId) return null
    return questions.find((q) => q.id === currentQuestionId) || null
  }, [currentQuestionId])

  const questionsAnswered = Object.keys(learnAnswers).length

  // Check for contradictions in real-time
  useEffect(() => {
    const errors: string[] = []

    if (learnAnswers[52] === 'yes' && learnAnswers[53] === 'yes') {
      errors.push('No puede ser mujer y hombre al mismo tiempo')
    }
    if (learnAnswers[1] === 'yes' && learnAnswers[2] === 'yes' && learnAnswers[3] === 'yes') {
      errors.push('Un animal no puede ser humano')
    }
    if (learnAnswers[6] === 'yes' && learnAnswers[7] === 'yes') {
      errors.push('No puede volar y ser acuático (generalmente)')
    }
    if (learnAnswers[11] === 'yes' && learnAnswers[12] === 'yes') {
      errors.push('No puede ser muy grande y pequeño')
    }
    if (learnAnswers[33] === 'yes' && learnAnswers[34] === 'yes') {
      errors.push('No puede ser rápido y lento')
    }

    const professions = [17, 18, 19, 20, 76, 77, 78, 79, 80]
    const yesProfessions = professions.filter((id) => learnAnswers[id] === 'yes')
    if (yesProfessions.length > 1) {
      const profNames = yesProfessions.map((id) => questions.find((q) => q.id === id)?.text.split(' ')[2] || id).join(', ')
      errors.push(`Un personaje no puede ser múltiples profesiones: ${profNames}`)
    }

    const nationalities = [16, 44, 45, 46, 47]
    const yesNats = nationalities.filter((id) => learnAnswers[id] === 'yes')
    if (yesNats.length > 1) {
      errors.push('No puede ser de múltiples nacionalidades')
    }

    setValidationError(errors.length > 0 ? errors.join('. ') : null)
  }, [learnAnswers])

  // Check for similarity with existing characters
  useEffect(() => {
    if (Object.keys(learnAnswers).length < 5) {
      setSimilarityWarning(null)
      return
    }

    const allChars = getAllCharacters()
    let bestMatch: { name: string; similarity: number } | null = null

    for (const char of allChars) {
      if (char.name === learnName) continue

      let weightedMatch = 0
      let weightedTotal = 0
      let commonAnswers = 0

      for (const [qIdStr, answer] of Object.entries(learnAnswers)) {
        const qId = Number(qIdStr) as QuestionId
        if (answer === 'dont_know') continue

        const charAnswer = char.answers[qId]
        if (charAnswer === undefined || charAnswer === 'dont_know') continue

        commonAnswers++
        const weight = getQuestionWeight(qId)
        weightedTotal += weight

        if (answer === charAnswer) {
          weightedMatch += weight
        }
      }

      if (commonAnswers >= 5 && weightedTotal > 0) {
        const similarity = weightedMatch / weightedTotal
        if (!bestMatch || similarity > bestMatch.similarity) {
          bestMatch = { name: char.name, similarity }
        }
      }
    }

    if (bestMatch && bestMatch.similarity >= 0.75) {
      setSimilarityWarning(
        `⚠️ Similar al ${Math.round(bestMatch.similarity * 100)}% con: ${bestMatch.name}. Considerá responder más preguntas específicas.`
      )
    } else {
      setSimilarityWarning(null)
    }
  }, [learnAnswers, learnName])

  const handleLearnAnswer = useCallback((answer: Answer) => {
    if (!currentQuestionId) return

    const newAnswers = { ...learnAnswers, [currentQuestionId]: answer }
    setLearnAnswers(newAnswers)
    setNavStack((prev) => [...prev, currentQuestionId])

    const newHistory: { questionId: QuestionId; answer: Answer }[] = []
    for (const [qIdStr, ans] of Object.entries(newAnswers)) {
      newHistory.push({ questionId: Number(qIdStr) as QuestionId, answer: ans as Answer })
    }

    const allChars = getAllCharacters()
    const candidates = filterCandidates(allChars, newHistory)
    const contradicted = getContradictedQuestions(newHistory)
    const answeredIds = new Set(Object.keys(newAnswers).map(Number))
    const remaining = questions
      .filter((q) => !answeredIds.has(q.id) && !contradicted.has(q.id))
      .map((q) => q.id)

    const nextId = getBestQuestion(remaining, candidates, newHistory)
    setCurrentQuestionId(nextId)
  }, [currentQuestionId, learnAnswers])

  const handleLearnBack = useCallback(() => {
    if (navStack.length === 0) return

    const lastAnswered = navStack[navStack.length - 1]
    setNavStack((prev) => prev.slice(0, -1))

    const newAnswers = { ...learnAnswers }
    delete newAnswers[lastAnswered]
    setLearnAnswers(newAnswers)

    if (Object.keys(newAnswers).length === 0) {
      setCurrentQuestionId(1)
      return
    }

    const newHistory: { questionId: QuestionId; answer: Answer }[] = []
    for (const [qIdStr, ans] of Object.entries(newAnswers)) {
      newHistory.push({ questionId: Number(qIdStr) as QuestionId, answer: ans as Answer })
    }

    const allChars = getAllCharacters()
    const candidates = filterCandidates(allChars, newHistory)
    const contradicted = getContradictedQuestions(newHistory)
    const answeredIds = new Set(Object.keys(newAnswers).map(Number))
    const remaining = questions
      .filter((q) => !answeredIds.has(q.id) && !contradicted.has(q.id))
      .map((q) => q.id)

    const nextId = getBestQuestion(remaining, candidates, newHistory)
    setCurrentQuestionId(nextId)
  }, [navStack, learnAnswers])

  const handleFinishLearn = useCallback(async () => {
    setValidationError(null)

    const completeAnswers: Record<number, Answer> = { ...learnAnswers }

    try {
      const saved = await saveLearnedCharacter({
        name: learnName.trim(),
        description: learnDescription.trim() || learnName.trim(),
        category: learnCategory,
        subcategory: learnSubcategory,
        answers: completeAnswers,
      })

      if (saved.success) {
        setPhase('done')
      } else {
        const msg = saved.errors?.map((e) => e.message).join('. ') || 'Error al guardar'
        setValidationError(msg)
      }
    } catch {
      setValidationError('Error de conexión. Intentalo de nuevo.')
    }
  }, [learnAnswers, learnName, learnDescription, learnCategory, learnSubcategory])

  // Practice simulation
  const runPractice = useCallback(() => {
    const allChars = getAllCharacters()
    const learnedChar = allChars.find((c) => c.name === learnName.trim())
    if (!learnedChar) return

    setPhase('practice')
    setPracticeStep(0)
    setPracticeLog([])
    setPracticeGuess(null)

    const simHistory: { questionId: QuestionId; answer: Answer }[] = []
    const log: { question: string; answer: Answer }[] = []

    for (let i = 0; i < 30; i++) {
      const rankedCandidates = filterCandidates(allChars, simHistory)
      const metrics = getConfidenceMetrics(rankedCandidates, false, simHistory.length)

      if (metrics.shouldGuess || rankedCandidates.length === 0) {
        setPracticeGuess(rankedCandidates[0]?.name || 'Nadie')
        break
      }

      const answeredIds = new Set(simHistory.map((h) => h.questionId))
      const remaining = questions
        .filter((q) => !answeredIds.has(q.id))
        .map((q) => q.id)

      const nextQId = getBestQuestion(remaining, rankedCandidates, simHistory)

      if (!nextQId) {
        setPracticeGuess(rankedCandidates[0]?.name || 'Nadie')
        break
      }

      const qText = questions.find((q) => q.id === nextQId)?.text || `Pregunta ${nextQId}`
      const answer = learnedChar.answers[nextQId] || 'dont_know'

      if (answer !== 'dont_know') {
        simHistory.push({ questionId: nextQId, answer })
      }

      log.push({ question: qText, answer })
    }

    setPracticeLog(log)
    setPracticeStep(log.length)

    const finalRanked = filterCandidates(allChars, simHistory)
    if (finalRanked.length > 0) {
      setPracticeGuess(finalRanked[0].name)
    }

    setPhase('practice_result')
  }, [learnName])

  const handlePracticeBack = useCallback(() => {
    setPhase('done')
    setPracticeGuess(null)
    setPracticeLog([])
    setPracticeStep(0)
  }, [])

  return {
    phase,
    learnName,
    setLearnName,
    learnDescription,
    setLearnDescription,
    learnCategory,
    setLearnCategory,
    learnSubcategory,
    setLearnSubcategory,
    learnAnswers,
    currentQuestion,
    questionsAnswered,
    validationError,
    similarityWarning,
    practiceStep,
    practiceLog,
    practiceGuess,
    navStack,
    defeatedByName,
    handleLearnNameSubmit,
    handleLearnAnswer,
    handleLearnBack,
    handleFinishLearn,
    runPractice,
    handlePracticeBack,
    onComplete,
    onCancel,
  }
}
