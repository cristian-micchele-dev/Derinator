/**
 * Bayesian game engine hook.
 * Drop-in replacement for useGame with the same return interface.
 * Uses probabilistic inference instead of weighted similarity scoring.
 */

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import confetti from 'canvas-confetti'
import { Answer } from '../../types'
import { questions, QuestionId } from '../../data/questions'
import { getAllCharacters } from '../../data/characters'
import { getAllCharactersWithProfiles } from '../../data/characters'
import {
  initLogPosteriors,
  logPosteriorsToProbs,
  updatePosteriors,
  computeEIG,
  shouldGuess as bayesianShouldGuess,
  PRUNE_THRESHOLD,
} from '../../data/game/bayesian'
import type { CandidateWithProfile } from '../../data/game/bayesian'
import { applyImplications, getContradictedQuestions } from '../../data/game'
import { prerequisitesStrictMet, isExcluded } from '../../data/game'
import { loadLearnedCharacters } from '../../data/learnedStorage'
import {
  recordDerinatorWin, recordUserWin, recordDefeatedBy,
  recordPerfectGuess, recordCategoryWin, checkAchievements, recordDailyWin,
  loadDailyCharacter, saveDailyCharacter, getDailyCharacterIndex,
  saveGameState, syncToServer, getFingerprint, getPlayerToken,
} from '../../data/stats'
import { recordGame } from '../../data/api/api'
import type { GameState } from '../../types'

export type GameCategory = 'all' | 'personajes' | 'animales' | 'famosos'

// Questions excluded per category (same as useGame)
const EXCLUDED_BY_CATEGORY: Record<GameCategory, QuestionId[]> = {
  all: [],
  animales: [2, 3, 4, 15, 16, 17, 18, 19, 20, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247],
  personajes: [2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 67, 68, 69, 70, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247],
  famosos: [2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 56, 57, 58, 59, 60, 61, 62, 64, 67, 68, 69, 70, 71, 72, 73, 74, 75, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180],
}

const CATEGORY_SEED_ANSWERS: Record<GameCategory, { questionId: QuestionId; answer: Answer }[]> = {
  all: [],
  animales: [
    { questionId: 1, answer: 'yes' },
    { questionId: 2, answer: 'yes' },
  ],
  personajes: [
    { questionId: 1, answer: 'yes' },
    { questionId: 3, answer: 'yes' },
    { questionId: 4, answer: 'yes' },
  ],
  famosos: [
    { questionId: 1, answer: 'yes' },
    { questionId: 3, answer: 'yes' },
    { questionId: 4, answer: 'no' },
  ],
}

interface UseGameProps {
  gameState: GameState
  setGameState: (state: GameState) => void
  onConfidenceChange?: (confidence: number) => void
  onQuestionCountChange?: (count: number) => void
  onDramaticPause?: (isPaused: boolean) => void
}

/**
 * Select the best question using Expected Information Gain.
 * Retains flow prerequisites and contradiction exclusions as eligibility filters.
 */
function selectBestQuestionEIG(
  candidates: CandidateWithProfile[],
  posteriors: number[],
  eligibleIds: QuestionId[],
): QuestionId | null {
  if (eligibleIds.length === 0 || candidates.length === 0) return null

  let bestId: QuestionId | null = null
  let bestEIG = -1

  for (const qId of eligibleIds) {
    const eig = computeEIG(candidates, posteriors, qId)
    if (eig > bestEIG) {
      bestEIG = eig
      bestId = qId
    }
  }

  return bestId
}

export function useGameBayesian({
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

  // Bayesian state
  const [logPosteriors, setLogPosteriors] = useState<number[]>([])
  const [activeCandidates, setActiveCandidates] = useState<CandidateWithProfile[]>([])

  // Refs for effects
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
      const winToken = getPlayerToken()
      if (winToken) recordGame(getFingerprint(), {
        characterName: guessedCharacterRef.current?.name || '',
        result: 'derinator_win',
        questionsCount: historyRef.current.length,
        category: selectedCategoryRef.current,
      }, winToken)
    }
  }, [gameState])

  // Lose effect
  useEffect(() => {
    if (gameState === 'lose') {
      recordUserWin()
      if (guessedCharacterRef.current) {
        recordDefeatedBy(guessedCharacterRef.current.name)
      }
      recordCategoryWin(selectedCategoryRef.current)
      checkAchievements()
      syncToServer()
      const loseToken = getPlayerToken()
      if (loseToken) recordGame(getFingerprint(), {
        characterName: guessedCharacterRef.current?.name || '',
        result: 'user_win',
        questionsCount: historyRef.current.length,
        category: selectedCategoryRef.current,
      }, loseToken)
    }
  }, [gameState])

  // Report question count
  useEffect(() => {
    onQuestionCountChange?.(history.length)
  }, [history.length, onQuestionCountChange])

  // Derived state
  const learnedCount = useMemo(() => loadLearnedCharacters().length, [])

  // Filter characters by category and build probability profiles
  const filteredCharacters = useMemo(() => {
    const all = getAllCharactersWithProfiles()
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

  // Compute posteriors and prune candidates
  const posteriors = useMemo(() => {
    return logPosteriorsToProbs(logPosteriors)
  }, [logPosteriors])

  // Build ranked candidates (sorted by posterior, pruned)
  const rankedCandidates = useMemo(() => {
    if (activeCandidates.length === 0) return []
    const probs = posteriors
    return activeCandidates
      .map((c, i) => ({ ...c, score: probs[i] ?? 0 }))
      .filter((c) => c.score >= PRUNE_THRESHOLD)
      .sort((a, b) => b.score - a.score)
  }, [activeCandidates, posteriors])

  const topCandidate = rankedCandidates[0]

  // Eligible questions (not answered, not excluded, prerequisites met)
  const remainingQuestions = useMemo(() => {
    const expandedHistory = applyImplications(history)
    const allAnswered = new Set(expandedHistory.map((h) => h.questionId))
    const excludedByCategory = new Set(EXCLUDED_BY_CATEGORY[selectedCategory])
    const contradicted = getContradictedQuestions(history)
    const answerMap = new Map(history.map((h) => [h.questionId, h.answer]))

    return questions
      .filter((q) =>
        !allAnswered.has(q.id) &&
        !excludedByCategory.has(q.id) &&
        !contradicted.has(q.id) &&
        prerequisitesStrictMet(q.id, answerMap) &&
        !isExcluded(q.id, answerMap)
      )
      .map((q) => q.id)
  }, [history, selectedCategory])

  // Select best question via EIG
  const currentQuestionId = useMemo(() => {
    if (remainingQuestions.length === 0 || rankedCandidates.length === 0) return null
    const activeProbs = rankedCandidates.map((c) => c.score)
    const sumProbs = activeProbs.reduce((a, b) => a + b, 0)
    const normalizedProbs = sumProbs > 0 ? activeProbs.map((p) => p / sumProbs) : activeProbs
    return selectBestQuestionEIG(rankedCandidates, normalizedProbs, remainingQuestions)
  }, [remainingQuestions, rankedCandidates])

  const topScore = topCandidate?.score ?? 0

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

    // Update Bayesian posteriors
    const newLogPosteriors = [...logPosteriors]
    updatePosteriors(activeCandidates, newLogPosteriors, currentQuestionId, answer)

    // Apply seed answers from implications
    const expanded = applyImplications(newHistory)
    const impliedAnswers = expanded.filter(
      (h) => !newHistory.some((nh) => nh.questionId === h.questionId)
    )
    for (const implied of impliedAnswers) {
      updatePosteriors(activeCandidates, newLogPosteriors, implied.questionId, implied.answer)
    }

    setLogPosteriors(newLogPosteriors)

    // Check guess conditions
    const probs = logPosteriorsToProbs(newLogPosteriors)
    const candidateNames = activeCandidates.map((c) => c.name)
    const guessResult = bayesianShouldGuess(probs, candidateNames, newHistory.length, false)

    onConfidenceChange?.(guessResult.confidence)

    if (guessResult.shouldGuess && !hasTriggeredGuess.current) {
      hasTriggeredGuess.current = true
      const topIdx = probs.indexOf(Math.max(...probs))
      setGuessedCharacter({
        name: activeCandidates[topIdx]?.name ?? '',
        description: activeCandidates[topIdx]?.description ?? '',
      })
      triggerDramaticPause('guess')
    } else if (rankedCandidates.length === 0) {
      hasTriggeredGuess.current = true
      triggerDramaticPause('lose')
    }
  }, [currentQuestionId, history, logPosteriors, activeCandidates, rankedCandidates, triggerDramaticPause, onConfidenceChange])

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
    setLogPosteriors([])
    setActiveCandidates([])
    onDramaticPause?.(false)
  }, [setGameState, onDramaticPause, selectedCategory])

  const handleStart = useCallback(() => {
    // Initialize Bayesian state with filtered characters
    const chars = filteredCharacters
    const lp = initLogPosteriors(chars.length)

    // Apply seed answers as initial posterior updates
    const seeds = CATEGORY_SEED_ANSWERS[selectedCategory]
    for (const seed of seeds) {
      updatePosteriors(chars, lp, seed.questionId, seed.answer)
    }

    setActiveCandidates(chars)
    setLogPosteriors(lp)
    setHistory(seeds)
    setGameState('playing')
  }, [setGameState, selectedCategory, filteredCharacters])

  // Smart guessing effect (for when no questions remain)
  useEffect(() => {
    if (gameState !== 'playing') return
    if (hasTriggeredGuess.current) return
    if (activeCandidates.length === 0) return

    if (!currentQuestionId && rankedCandidates.length > 0) {
      hasTriggeredGuess.current = true
      setGuessedCharacter({
        name: rankedCandidates[0].name,
        description: rankedCandidates[0].description || '',
      })
      triggerDramaticPause('guess')
      return
    }

    if (history.length < 5) return

    const probs = posteriors
    const candidateNames = activeCandidates.map((c) => c.name)
    const guessResult = bayesianShouldGuess(probs, candidateNames, history.length, !currentQuestionId)

    onConfidenceChange?.(guessResult.confidence)

    if (guessResult.shouldGuess) {
      hasTriggeredGuess.current = true
      const topIdx = probs.indexOf(Math.max(...probs))
      setGuessedCharacter({
        name: activeCandidates[topIdx]?.name ?? '',
        description: activeCandidates[topIdx]?.description ?? '',
      })
      triggerDramaticPause('guess')
    }
  }, [gameState, currentQuestionId, activeCandidates, posteriors, rankedCandidates, triggerDramaticPause, onConfidenceChange, history])

  const seedCount = CATEGORY_SEED_ANSWERS[selectedCategory].length

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
    seedCount,
    handleAnswer,
    handleGuess,
    handleRestart,
    handleStart,
  }
}
