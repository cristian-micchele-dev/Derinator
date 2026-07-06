import { useEffect, useCallback, useRef } from 'react'
import { Answer } from '../../types'
import { QuestionId } from '../../data/questions'
import { getAllCharacters } from '../../data/characters'
import { syncLearnedCharactersFromServer } from '../../data/learnedStorage'
import type { Character } from '../../data/characters'
import {
  recordDerinatorWin, recordUserWin, recordDefeatedBy,
  recordPerfectGuess, recordCategoryWin, checkAchievements, recordDailyWin,
  loadDailyCharacter, saveDailyCharacter, getDailyCharacterIndex,
  saveGameState, syncToServer, getFingerprint, getPlayerToken,
} from '../../data/stats'
import { recordGame } from '../../data/api/api'
import type { GameState } from '../../types'
import type { GameCategory } from '../../data/game/gameConstants'

interface UseGameEffectsProps {
  gameState: GameState
  setGameState: (state: GameState) => void
  history: { questionId: QuestionId; answer: Answer }[]
  selectedCategory: GameCategory
  guessedCharacter: { name: string; description: string } | null
  setGuessedCharacter: (c: { name: string; description: string } | null) => void
  topCandidate: { name: string; description?: string } | undefined
  setIsThinkingDelay: (v: boolean) => void
  onQuestionCountChange?: (count: number) => void
  onDramaticPause?: (isPaused: boolean) => void
  onLearnedSync?: (chars: Character[]) => void
  learnedCharsCount?: number
}

export function useGameEffects({
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
  onLearnedSync,
  learnedCharsCount = 0,
}: UseGameEffectsProps) {
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach(clearTimeout)
    }
  }, [])

  // Sync learned characters from server into localStorage once on mount
  useEffect(() => {
    syncLearnedCharactersFromServer().then((chars) => onLearnedSync?.(chars))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

  function finalizeGame(result: 'derinator_win' | 'user_win') {
    checkAchievements()
    syncToServer()
    const token = getPlayerToken()
    if (token) recordGame(getFingerprint(), {
      characterName: guessedCharacterRef.current?.name || '',
      result,
      questionsCount: historyRef.current.length,
      category: selectedCategoryRef.current,
    }, token)
  }

  // Win effect
  useEffect(() => {
    if (gameState === 'win') {
      import('canvas-confetti').then(({ default: confetti }) => {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#fbbf24', '#a78bfa', '#34d399', '#f43f5e', '#60a5fa'],
        })
        timersRef.current.push(setTimeout(() => {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.7 },
            colors: ['#fbbf24', '#a78bfa'],
          })
        }, 300))
      })
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
      finalizeGame('derinator_win')
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
      finalizeGame('user_win')
    }
  }, [gameState])

  // Report question count
  useEffect(() => {
    onQuestionCountChange?.(history.length)
  }, [history.length, onQuestionCountChange])

  const learnedCount = learnedCharsCount

  const triggerDramaticPause = useCallback((nextState: GameState) => {
    onDramaticPause?.(true)
    setIsThinkingDelay(true)
    timersRef.current.push(setTimeout(() => {
      onDramaticPause?.(false)
      setIsThinkingDelay(false)
      setGameState(nextState)
    }, 1800))
  }, [onDramaticPause, setIsThinkingDelay, setGameState])

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
  }, [topCandidate, setGameState, setGuessedCharacter, triggerDramaticPause])

  return {
    timersRef,
    learnedCount,
    triggerDramaticPause,
    handleGuess,
  }
}
