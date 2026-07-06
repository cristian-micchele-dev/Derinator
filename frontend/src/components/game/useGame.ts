import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { Answer } from '../../types'
import { questions, QuestionId, type AnyQuestionId } from '../../data/questions'
import { getAllCharacters, getLearnedConfirmerQuestions } from '../../data/characters'
import { loadLearnedCharacters } from '../../data/learnedStorage'
import type { Character } from '../../data/characters'
import { filterCandidates, applyImplications, getContradictedQuestions, getConfidenceMetrics, getBestQuestion } from '../../data/game'
import {
  GameCategory,
  UseGameProps,
  EXCLUDED_BY_CATEGORY,
  CATEGORY_SEED_ANSWERS,
  filterByCategory,
} from '../../data/game/gameConstants'
import { useGameEffects } from './useGameEffects'

export type { GameCategory }

type HistoryEntry = { questionId: QuestionId; answer: Answer }
type LearnedQuestion = { id: number | QuestionId }

function computeRemainingQuestions(
  history: HistoryEntry[],
  selectedCategory: GameCategory,
  learnedConfirmerQuestions: LearnedQuestion[],
): QuestionId[] {
  const expandedHistory = applyImplications(history)
  const allAnswered = new Set(expandedHistory.map((h) => h.questionId))
  const excludedByCategory = new Set(EXCLUDED_BY_CATEGORY[selectedCategory])
  const contradicted = getContradictedQuestions(history)

  const staticIds = questions
    .filter((q) => !allAnswered.has(q.id) && !excludedByCategory.has(q.id) && !contradicted.has(q.id))
    .map((q) => q.id)

  const learnedIds = learnedConfirmerQuestions
    .filter((q) => !allAnswered.has(q.id as AnyQuestionId as QuestionId))
    .map((q) => q.id as AnyQuestionId as QuestionId)

  return [...staticIds, ...learnedIds]
}

export function useGame({
  gameState,
  setGameState,
  onConfidenceChange,
  onQuestionCountChange,
  onDramaticPause,
}: UseGameProps) {
  const [history, setHistory] = useState<{ questionId: QuestionId; answer: Answer }[]>([])
  const [selectedCategory, setSelectedCategory] = useState<GameCategory>('personajes')
  const [isThinkingDelay, setIsThinkingDelay] = useState(false)
  const [pendingAnswer, setPendingAnswer] = useState<Answer | null>(null)
  const [guessedCharacter, setGuessedCharacter] = useState<{ name: string; description: string } | null>(null)
  const [learnedChars, setLearnedChars] = useState<Character[]>(() => loadLearnedCharacters())
  const hasTriggeredGuess = useRef(false)
  // Tracks which characters are still in play. null = all characters active (initial state).
  // Once a character is filtered out it never comes back — the pool is monotonically decreasing.
  const [candidateIds, setCandidateIds] = useState<Set<number> | null>(null)

  const filteredCharacters = useMemo(
    () => filterByCategory(getAllCharacters(learnedChars), selectedCategory),
    [selectedCategory, learnedChars],
  )

  // Monotonic candidate pool: starts as all filtered characters, only shrinks.
  const candidatePool = useMemo(() => {
    if (candidateIds === null) return filteredCharacters
    return filteredCharacters.filter(c => candidateIds.has(c.id))
  }, [filteredCharacters, candidateIds])

  // Dynamic confirmer questions generated for learned characters.
  // Kept before rankedCandidates so learnedConfirmerIdsSet is available for scoring.
  // filteredCharacters is listed as a dependency even though it's not used directly —
  // it forces recomputation when the category changes, since learned characters may
  // include category-specific confirmer questions that become relevant.
  const learnedConfirmerQuestions = useMemo(() => {
    return getLearnedConfirmerQuestions()
  }, [filteredCharacters])

  const learnedConfirmerIdsSet = useMemo(
    () => new Set(learnedConfirmerQuestions.map(q => q.id)),
    [learnedConfirmerQuestions],
  )

  const rankedCandidates = useMemo(() => {
    return filterCandidates(candidatePool, history, learnedConfirmerIdsSet)
  }, [candidatePool, history, learnedConfirmerIdsSet])

  const topCandidate = rankedCandidates[0]

  const { timersRef, learnedCount, triggerDramaticPause, handleGuess } = useGameEffects({
    gameState,
    setGameState,
    history,
    selectedCategory,
    guessedCharacter,
    setGuessedCharacter,
    topCandidate,
    setIsThinkingDelay,
    onQuestionCountChange,
    onDramaticPause,
    onLearnedSync: (chars) => setLearnedChars(chars),
    learnedCharsCount: learnedChars.length,
  })

  const remainingQuestions = useMemo(
    () => computeRemainingQuestions(history, selectedCategory, learnedConfirmerQuestions),
    [history, selectedCategory, learnedConfirmerQuestions],
  )

  const currentQuestionId = useMemo(() => {
    if (remainingQuestions.length === 0) return null
    return getBestQuestion(remainingQuestions, rankedCandidates, history, learnedConfirmerIdsSet)
  }, [remainingQuestions, rankedCandidates, history, learnedConfirmerIdsSet])

  const { confidence: topScore } = useMemo(() => {
    return getConfidenceMetrics(rankedCandidates, false, history.length)
  }, [rankedCandidates, history.length])

  const currentQuestion = useMemo(() => {
    if (!currentQuestionId) return null
    // Check static questions first, then learned confirmer questions
    return (
      questions.find((q) => q.id === currentQuestionId) ??
      learnedConfirmerQuestions.find((q) => q.id === currentQuestionId) ??
      null
    )
  }, [currentQuestionId, learnedConfirmerQuestions])

  const seedCount = CATEGORY_SEED_ANSWERS[selectedCategory].length

  const processAnswer = useCallback((answer: Answer) => {
    if (!currentQuestionId) return

    const newHistory = [...history, { questionId: currentQuestionId, answer }]
    setHistory(newHistory)

    const newCandidates = filterCandidates(candidatePool, newHistory, learnedConfirmerIdsSet)
    setCandidateIds(new Set(newCandidates.map(c => c.id)))
    const newRemaining = computeRemainingQuestions(newHistory, selectedCategory, learnedConfirmerQuestions)

    const nextQuestion = getBestQuestion(newRemaining, newCandidates, newHistory, learnedConfirmerIdsSet)
    const realQuestionsAsked = newHistory.length - seedCount

    // Don't guess while the top candidate still has an unasked confirmer question.
    const hasPendingConfirmer =
      nextQuestion !== null &&
      learnedConfirmerIdsSet.has(nextQuestion as unknown as number)

    if (newCandidates.length === 0) {
      hasTriggeredGuess.current = true
      triggerDramaticPause('lose')
    } else if (!hasPendingConfirmer && (
      newCandidates.length === 1 ||
      newRemaining.length === 0 ||
      nextQuestion === null ||
      realQuestionsAsked >= 22
    )) {
      hasTriggeredGuess.current = true
      setGuessedCharacter({
        name: newCandidates[0].name,
        description: newCandidates[0].description || '',
      })
      triggerDramaticPause('guess')
    }
  }, [currentQuestionId, history, candidatePool, selectedCategory, triggerDramaticPause, learnedConfirmerIdsSet])

  const handleAnswer = useCallback((answer: Answer) => {
    if (!currentQuestionId || isThinkingDelay) return
    setIsThinkingDelay(true)
    setPendingAnswer(answer)
    timersRef.current.push(setTimeout(() => {
      setIsThinkingDelay(false)
      setPendingAnswer(null)
      processAnswer(answer)
    }, 1200))
  }, [currentQuestionId, isThinkingDelay, processAnswer, timersRef])

  const handleRestart = useCallback(() => {
    setGameState('start')
    setHistory(CATEGORY_SEED_ANSWERS[selectedCategory])
    setGuessedCharacter(null)
    setCandidateIds(null)
    hasTriggeredGuess.current = false
    setIsThinkingDelay(false)
    setPendingAnswer(null)
    onDramaticPause?.(false)
  }, [setGameState, onDramaticPause, selectedCategory])

  const handleStart = useCallback(() => {
    setGameState('playing')
    setHistory(CATEGORY_SEED_ANSWERS[selectedCategory])
    setCandidateIds(null)
  }, [setGameState, selectedCategory])

  // Smart guessing
  useEffect(() => {
    if (gameState !== 'playing') return
    if (hasTriggeredGuess.current) return
    if (rankedCandidates.length === 0) return

    if (!currentQuestionId) {
      hasTriggeredGuess.current = true
      setGuessedCharacter({
        name: rankedCandidates[0].name,
        description: rankedCandidates[0].description || '',
      })
      triggerDramaticPause('guess')
      return
    }

    if (history.length < 5) return

    const { shouldGuess, confidence } = getConfidenceMetrics(rankedCandidates, false, history.length)
    onConfidenceChange?.(confidence)

    if (shouldGuess) {
      // Don't guess while the top candidate still has an unasked confirmer question.
      const topId = rankedCandidates[0]?.id
      const hasPendingConfirmer =
        topId !== undefined &&
        learnedConfirmerIdsSet.has(topId) &&
        remainingQuestions.some(qId => (qId as unknown as number) === topId)
      if (hasPendingConfirmer) return

      hasTriggeredGuess.current = true
      setGuessedCharacter({
        name: rankedCandidates[0].name,
        description: rankedCandidates[0].description || '',
      })
      triggerDramaticPause('guess')
    }
  }, [gameState, currentQuestionId, rankedCandidates, triggerDramaticPause, onConfidenceChange, history])

  return {
    state: {
      gameState,
      isThinkingDelay,
      pendingAnswer,
      guessedCharacter,
    },
    category: {
      selectedCategory,
      setSelectedCategory,
      filteredCharacters,
    },
    candidates: {
      rankedCandidates,
      topCandidate,
      topScore,
    },
    question: {
      currentQuestion,
      history,
      seedCount,
      remainingQuestions,
    },
    meta: {
      learnedCount,
    },
    actions: {
      handleAnswer,
      handleGuess,
      handleRestart,
      handleStart,
      setGameState,
    },
  }
}
