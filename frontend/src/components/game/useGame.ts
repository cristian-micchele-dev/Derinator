import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import confetti from 'canvas-confetti'
import { Answer } from '../../types'
import { questions, QuestionId } from '../../data/questions'
import { getAllCharacters } from '../../data/characters'
import { filterCandidates, applyImplications, getContradictedQuestions, getConfidenceMetrics, getBestQuestion } from '../../data/game'
import { loadLearnedCharacters } from '../../data/learnedStorage'
import {
  recordDerinatorWin, recordUserWin, recordDefeatedBy,
  addToHallOfFame,
  recordPerfectGuess, recordCategoryWin, checkAchievements, recordDailyWin,
  loadDailyCharacter, saveDailyCharacter, getDailyCharacterIndex,
  saveGameState, syncToServer, getFingerprint,
} from '../../data/stats'
import { recordGame } from '../../data/api/api'
import type { GameState } from '../../types'

export type GameCategory = 'all' | 'personajes' | 'animales' | 'famosos'

// Questions excluded per category
const EXCLUDED_BY_CATEGORY: Record<GameCategory, QuestionId[]> = {
  all: [],
  animales: [2, 3, 4, 15, 16, 17, 18, 19, 20, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200],
  personajes: [2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 67, 68, 69, 70],
  famosos: [2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 56, 57, 58, 59, 60, 61, 62, 64, 67, 68, 69, 70, 71, 72, 73, 74, 75, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180],
}

// Auto-seeded answers based on category — these are known from the start
const CATEGORY_SEED_ANSWERS: Record<GameCategory, { questionId: QuestionId; answer: Answer }[]> = {
  all: [],
  animales: [
    { questionId: 1, answer: 'yes' },  // Es un ser vivo
    { questionId: 2, answer: 'yes' },  // Es un animal
  ],
  personajes: [
    { questionId: 1, answer: 'yes' },  // Es un ser vivo
    { questionId: 3, answer: 'yes' },  // Es un ser humano (most fictional characters)
    { questionId: 4, answer: 'yes' },  // Es de ficción
  ],
  famosos: [
    { questionId: 1, answer: 'yes' },  // Es un ser vivo
    { questionId: 3, answer: 'yes' },  // Es un ser humano
    { questionId: 4, answer: 'no' },   // NO es de ficción
  ],
}

interface UseGameProps {
  gameState: GameState
  setGameState: (state: GameState) => void
  onConfidenceChange?: (confidence: number) => void
  onQuestionCountChange?: (count: number) => void
  onDramaticPause?: (isPaused: boolean) => void
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
  const hasTriggeredGuess = useRef(false)

  // Refs for effects that should only run on gameState change
  const guessedCharacterRef = useRef(guessedCharacter)
  const historyRef = useRef(history)
  const selectedCategoryRef = useRef(selectedCategory)
  guessedCharacterRef.current = guessedCharacter
  historyRef.current = history
  selectedCategoryRef.current = selectedCategory

  // Game persistence
  useEffect(() => {
    if (gameState === 'playing' || gameState === 'guess') {
      saveGameState({
        history,
        selectedCategory,
        gameState,
        timestamp: Date.now(),
      })
    }
  }, [gameState, history, selectedCategory])

  // Win effect
  useEffect(() => {
    if (gameState === 'win') {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#fbbf24', '#a78bfa', '#34d399', '#f43f5e', '#60a5fa'],
      })
      setTimeout(() => {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#fbbf24', '#a78bfa'],
        })
      }, 300)
      recordDerinatorWin(guessedCharacterRef.current?.name || '')
      if (historyRef.current.length <= 5) {
        recordPerfectGuess()
      }
      const daily = loadDailyCharacter()
      if (daily && !daily.guessed && guessedCharacterRef.current) {
        const allChars = getAllCharacters()
        const dailyIdx = getDailyCharacterIndex(allChars.length)
        const todaysChar = allChars[dailyIdx]
        if (todaysChar && todaysChar.name === guessedCharacterRef.current.name) {
          daily.guessed = true
          daily.guesses = historyRef.current.length
          saveDailyCharacter(daily)
          recordDailyWin()
        }
      }
      checkAchievements()
      syncToServer()
      recordGame(getFingerprint(), {
        characterName: guessedCharacterRef.current?.name || '',
        result: 'derinator_win',
        questionsCount: historyRef.current.length,
        category: selectedCategoryRef.current,
      })
    }
  }, [gameState])

  // Lose effect
  useEffect(() => {
    if (gameState === 'lose') {
      recordUserWin()
      if (guessedCharacterRef.current) {
        recordDefeatedBy(guessedCharacterRef.current.name)
      }
      addToHallOfFame({
        name: guessedCharacterRef.current?.name || 'Desconocido',
        description: guessedCharacterRef.current?.description || '',
        questionsCount: historyRef.current.length,
      })
      recordCategoryWin(selectedCategoryRef.current)
      checkAchievements()
      syncToServer()
      recordGame(getFingerprint(), {
        characterName: guessedCharacterRef.current?.name || '',
        result: 'user_win',
        questionsCount: historyRef.current.length,
        category: selectedCategoryRef.current,
      })
    }
  }, [gameState])

  // Report question count
  useEffect(() => {
    onQuestionCountChange?.(history.length)
  }, [history.length, onQuestionCountChange])

  // Derived state
  const learnedCount = useMemo(() => loadLearnedCharacters().length, [])

  const filteredCharacters = useMemo(() => {
    const all = getAllCharacters()
    if (selectedCategory === 'all') return all
    if (selectedCategory === 'animales') {
      return all.filter((c) => c.category === 'animal')
    }
    if (selectedCategory === 'personajes') {
      return all.filter((c) =>
        c.category === 'personaje' &&
        c.subcategory !== 'historico-real' &&
        c.subcategory !== 'deportista' &&
        c.subcategory !== 'youtuber-streamer'
      )
    }
    if (selectedCategory === 'famosos') {
      return all.filter((c) =>
        c.subcategory === 'historico-real' ||
        c.subcategory === 'deportista' ||
        c.subcategory === 'youtuber-streamer'
      )
    }
    return all
  }, [selectedCategory])

  const rankedCandidates = useMemo(() => {
    return filterCandidates(filteredCharacters, history)
  }, [filteredCharacters, history])

  const topCandidate = rankedCandidates[0]

  const remainingQuestions = useMemo(() => {
    const expandedHistory = applyImplications(history)
    const allAnswered = new Set(expandedHistory.map((h) => h.questionId))
    const excludedByCategory = new Set(EXCLUDED_BY_CATEGORY[selectedCategory])
    const contradicted = getContradictedQuestions(history)

    return questions
      .filter((q) => !allAnswered.has(q.id) && !excludedByCategory.has(q.id) && !contradicted.has(q.id))
      .map((q) => q.id)
  }, [history, selectedCategory])

  const currentQuestionId = useMemo(() => {
    if (remainingQuestions.length === 0) return null
    return getBestQuestion(remainingQuestions, rankedCandidates, history)
  }, [remainingQuestions, rankedCandidates, history])

  const { confidence: topScore } = useMemo(() => {
    return getConfidenceMetrics(rankedCandidates, false, history.length)
  }, [rankedCandidates, history.length])

  const currentQuestion = currentQuestionId
    ? questions.find((q) => q.id === currentQuestionId)
    : null

  // Actions
  const triggerDramaticPause = useCallback((nextState: GameState) => {
    onDramaticPause?.(true)
    setIsThinkingDelay(true)
    setTimeout(() => {
      onDramaticPause?.(false)
      setIsThinkingDelay(false)
      setGameState(nextState)
    }, 1800)
  }, [onDramaticPause, setGameState])

  const processAnswer = useCallback((answer: Answer) => {
    if (!currentQuestionId) return

    const newHistory = [...history, { questionId: currentQuestionId, answer }]
    setHistory(newHistory)

    const newCandidates = filterCandidates(filteredCharacters, newHistory)
    const contradicted = getContradictedQuestions(newHistory)
    const expandedNew = applyImplications(newHistory)
    const allAnswered = new Set(expandedNew.map((h) => h.questionId))
    const newRemaining = questions
      .filter((q) => !allAnswered.has(q.id) && !new Set(EXCLUDED_BY_CATEGORY[selectedCategory]).has(q.id) && !contradicted.has(q.id))
      .map((q) => q.id)

    const topCandidateScore = Math.round((newCandidates[0]?.score || 0) * 100)
    const nextQuestion = getBestQuestion(newRemaining, newCandidates, newHistory)

    // Detect fiction-heavy candidate pools that need more questions to differentiate
    const fictionCount = newCandidates.filter(c => {
      const a = c.answers
      return a[4] === 'yes' || a[59] === 'yes' || a[84] === 'yes' || a[85] === 'yes'
        || a[93] === 'yes' || a[94] === 'yes' || a[111] === 'yes' || a[112] === 'yes'
        || a[113] === 'yes' || a[114] === 'yes' || a[115] === 'yes' || a[116] === 'yes'
        || a[117] === 'yes' || a[131] === 'yes' || a[132] === 'yes' || a[133] === 'yes'
    }).length
    const isFictionHeavy = newCandidates.length > 0 && fictionCount / newCandidates.length > 0.5
    const minQuestionsForSingleGuess = isFictionHeavy ? 8 : 5

    if (newCandidates.length === 1 && topCandidateScore >= 95 && newHistory.length >= minQuestionsForSingleGuess) {
      hasTriggeredGuess.current = true
      setGuessedCharacter({
        name: newCandidates[0].name,
        description: newCandidates[0].description || '',
      })
      triggerDramaticPause('guess')
    } else if ((newRemaining.length === 0 || nextQuestion === null) && newCandidates.length > 0) {
      hasTriggeredGuess.current = true
      setGuessedCharacter({
        name: newCandidates[0].name,
        description: newCandidates[0].description || '',
      })
      triggerDramaticPause('guess')
    } else if (newCandidates.length === 0) {
      hasTriggeredGuess.current = true
      triggerDramaticPause('lose')
    }
  }, [currentQuestionId, history, filteredCharacters, selectedCategory])

  const handleAnswer = useCallback((answer: Answer) => {
    if (!currentQuestionId || isThinkingDelay) return
    setIsThinkingDelay(true)
    setPendingAnswer(answer)
    setTimeout(() => {
      setIsThinkingDelay(false)
      setPendingAnswer(null)
      processAnswer(answer)
    }, 1200)
  }, [currentQuestionId, isThinkingDelay, processAnswer])

  const handleGuess = useCallback((isCorrect: boolean) => {
    if (topCandidate) {
      setGuessedCharacter({
        name: topCandidate.name,
        description: topCandidate.description || '',
      })
    }
    if (isCorrect) {
      setGameState('win')
    } else {
      triggerDramaticPause('lose')
    }
  }, [topCandidate, setGameState, triggerDramaticPause])

  const handleRestart = useCallback(() => {
    setGameState('start')
    setHistory(CATEGORY_SEED_ANSWERS[selectedCategory])
    setGuessedCharacter(null)
    hasTriggeredGuess.current = false
    setIsThinkingDelay(false)
    setPendingAnswer(null)
    onDramaticPause?.(false)
  }, [setGameState, onDramaticPause, selectedCategory])

  const handleStart = useCallback(() => {
    setGameState('playing')
    setHistory(CATEGORY_SEED_ANSWERS[selectedCategory])
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
      triggerDramaticPause('lose')
      return
    }

    if (history.length < 5) return

    const { shouldGuess, confidence } = getConfidenceMetrics(rankedCandidates, false, history.length)
    onConfidenceChange?.(confidence)

    if (shouldGuess) {
      hasTriggeredGuess.current = true
      setGuessedCharacter({
        name: rankedCandidates[0].name,
        description: rankedCandidates[0].description || '',
      })
      triggerDramaticPause('guess')
    }
  }, [gameState, currentQuestionId, rankedCandidates, triggerDramaticPause, onConfidenceChange, history])

  return {
    gameState,
    history,
    selectedCategory,
    setSelectedCategory,
    rankedCandidates,
    topCandidate,
    currentQuestion,
    remainingQuestions,
    learnedCount,
    topScore,
    filteredCharacters,
    isThinkingDelay,
    pendingAnswer,
    guessedCharacter,
    handleAnswer,
    handleGuess,
    handleRestart,
    handleStart,
  }
}
