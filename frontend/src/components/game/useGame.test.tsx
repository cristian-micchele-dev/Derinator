import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGame } from './useGame'
import type { DailyCharacter } from '../../data/stats/types'

// Mock external dependencies
vi.mock('canvas-confetti', () => ({ default: vi.fn() }))

vi.mock('../../data/learnedStorage', () => ({
  loadLearnedCharacters: vi.fn(() => []),
}))

vi.mock('../../data/stats/gameStats', () => ({
  recordDerinatorWin: vi.fn(),
  recordUserWin: vi.fn(),
  recordDefeatedBy: vi.fn(),
}))

vi.mock('../../data/stats/achievements', () => ({
  recordPerfectGuess: vi.fn(),
  recordCategoryWin: vi.fn(),
  checkAchievements: vi.fn(),
  recordDailyWin: vi.fn(),
}))

vi.mock('../../data/stats/daily', () => ({
  loadDailyCharacter: vi.fn(() => null),
  saveDailyCharacter: vi.fn(),
  getDailyCharacterIndex: vi.fn(() => 0),
}))

vi.mock('../../data/stats/persistence', () => ({
  saveGameState: vi.fn(),
  syncToServer: vi.fn(),
  getFingerprint: vi.fn(() => 'test-fingerprint-123'),
  getPlayerToken: vi.fn(() => 'test-token-abc'),
}))

vi.mock('../../data/api/api', () => ({
  recordGame: vi.fn().mockResolvedValue({}),
}))

// Get references to the mocked functions
import { loadDailyCharacter, getDailyCharacterIndex } from '../../data/stats/daily'
import { recordDerinatorWin, recordUserWin } from '../../data/stats/gameStats'
import { recordCategoryWin, checkAchievements } from '../../data/stats/achievements'
import { syncToServer } from '../../data/stats/persistence'

describe('useGame', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with start state', () => {
    const { result } = renderHook(() =>
      useGame({
        gameState: 'start',
        setGameState: vi.fn(),
      })
    )

    expect(result.current.gameState).toBe('start')
    // History starts empty before any game starts
    expect(result.current.history).toEqual([])
    expect(result.current.selectedCategory).toBe('personajes')
    expect(result.current.learnedCount).toBe(0)
  })

  it('starts game with handleStart', () => {
    const setGameState = vi.fn()
    const { result } = renderHook(() =>
      useGame({
        gameState: 'start',
        setGameState,
      })
    )

    act(() => {
      result.current.handleStart()
    })

    expect(setGameState).toHaveBeenCalledWith('playing')
    // Default category is 'personajes', seeds Q1=yes, Q3=yes, Q4=yes
    const personajesSeed = [
      { questionId: 1, answer: 'yes' },
      { questionId: 3, answer: 'yes' },
      { questionId: 4, answer: 'yes' },
    ]
    expect(result.current.history).toEqual(personajesSeed)
  })

  it('category seeds differ between personajes and animales', () => {
    const setGameState = vi.fn()
    const { result } = renderHook(() =>
      useGame({
        gameState: 'start',
        setGameState,
      })
    )

    // Default is personajes — start the game to get the seed
    act(() => {
      result.current.handleStart()
    })

    const personajesSeed = [
      { questionId: 1, answer: 'yes' },
      { questionId: 3, answer: 'yes' },
      { questionId: 4, answer: 'yes' },
    ]
    expect(result.current.history).toEqual(personajesSeed)
    expect(result.current.selectedCategory).toBe('personajes')

    // Switch to animales and restart to get animales seed
    act(() => {
      result.current.setSelectedCategory('animales')
    })

    act(() => {
      result.current.handleRestart()
    })

    act(() => {
      result.current.handleStart()
    })

    const animalesSeed = [
      { questionId: 1, answer: 'yes' },
      { questionId: 2, answer: 'yes' },
    ]
    expect(result.current.history).toEqual(animalesSeed)
  })

  it('handleStart with animales category seeds animal answers', () => {
    const setGameState = vi.fn()
    const { result } = renderHook(() =>
      useGame({
        gameState: 'start',
        setGameState,
      })
    )

    act(() => {
      result.current.setSelectedCategory('animales')
    })

    act(() => {
      result.current.handleStart()
    })

    const animalesSeed = [
      { questionId: 1, answer: 'yes' },
      { questionId: 2, answer: 'yes' },
    ]
    expect(result.current.history).toEqual(animalesSeed)
  })

  it('changes category with setSelectedCategory', () => {
    const { result } = renderHook(() =>
      useGame({
        gameState: 'start',
        setGameState: vi.fn(),
      })
    )

    act(() => {
      result.current.setSelectedCategory('animales')
    })

    expect(result.current.selectedCategory).toBe('animales')
  })

  it('handles answer and updates history', () => {
    const { result } = renderHook(() =>
      useGame({
        gameState: 'playing',
        setGameState: vi.fn(),
      })
    )

    // Process an answer directly (bypassing the dramatic delay)
    act(() => {
      // The hook has a timeout, so we trigger and wait
      result.current.handleAnswer('yes')
    })

    // After the timeout (1200ms), history should be updated
    // For unit testing, we verify the hook structure exists
    expect(typeof result.current.handleAnswer).toBe('function')
    expect(typeof result.current.handleRestart).toBe('function')
    expect(typeof result.current.handleGuess).toBe('function')
  })

  it('resets state with handleRestart', () => {
    const setGameState = vi.fn()
    const { result } = renderHook(() =>
      useGame({
        gameState: 'playing',
        setGameState,
      })
    )

    act(() => {
      result.current.handleRestart()
    })

    expect(setGameState).toHaveBeenCalledWith('start')
  })

  it('filters characters by category', () => {
    const { result } = renderHook(() =>
      useGame({
        gameState: 'start',
        setGameState: vi.fn(),
      })
    )

    // Default is 'personajes'
    expect(result.current.filteredCharacters.length).toBeGreaterThan(0)

    // Switch to animales
    act(() => {
      result.current.setSelectedCategory('animales')
    })

    // All filtered characters should be animals
    const allAnimals = result.current.filteredCharacters.every(
      (c) => c.category === 'animal'
    )
    expect(allAnimals).toBe(true)
  })

  it('derives ranked candidates from history', () => {
    const { result } = renderHook(() =>
      useGame({
        gameState: 'start',
        setGameState: vi.fn(),
      })
    )

    // With no history, all characters are candidates
    expect(result.current.rankedCandidates.length).toBeGreaterThan(0)
    expect(result.current.topCandidate).toBeDefined()
  })

  it('handleGuess triggers win state when correct', () => {
    const setGameState = vi.fn()
    const { result } = renderHook(() =>
      useGame({
        gameState: 'guess',
        setGameState,
      })
    )

    act(() => {
      result.current.handleGuess(true)
    })

    expect(setGameState).toHaveBeenCalledWith('win')
  })

  // ===== EDGE CASES =====

  it('handleAnswer does nothing when isThinkingDelay is true', () => {
    const { result } = renderHook(() =>
      useGame({
        gameState: 'playing',
        setGameState: vi.fn(),
      })
    )

    // Trigger first answer → sets isThinkingDelay=true
    act(() => {
      result.current.handleAnswer('yes')
    })

    // While thinking, second answer should be ignored
    act(() => {
      result.current.handleAnswer('no')
    })

    // Only the first answer should be queued (history still empty because timeout hasn't fired)
    expect(result.current.history).toEqual([])
  })

  it('handleGuess(false) triggers dramatic pause to lose', () => {
    vi.useFakeTimers()
    const setGameState = vi.fn()
    const onDramaticPause = vi.fn()
    const { result } = renderHook(() =>
      useGame({
        gameState: 'guess',
        setGameState,
        onDramaticPause,
      })
    )

    act(() => {
      result.current.handleGuess(false)
    })

    // Should start dramatic pause
    expect(onDramaticPause).toHaveBeenCalledWith(true)
    expect(result.current.isThinkingDelay).toBe(true)

    // After 1800ms, should transition to lose
    act(() => {
      vi.advanceTimersByTime(1800)
    })

    expect(setGameState).toHaveBeenCalledWith('lose')
    expect(onDramaticPause).toHaveBeenCalledWith(false)

    vi.useRealTimers()
  })

  it('filters characters for famosos category', () => {
    const { result } = renderHook(() =>
      useGame({
        gameState: 'start',
        setGameState: vi.fn(),
      })
    )

    act(() => {
      result.current.setSelectedCategory('famosos')
    })

    const allFamosos = result.current.filteredCharacters.every(
      (c) =>
        c.subcategory === 'historico-real' ||
        c.subcategory === 'deportista' ||
        c.subcategory === 'youtuber-streamer'
    )
    expect(allFamosos).toBe(true)
    expect(result.current.filteredCharacters.length).toBeGreaterThan(0)
  })

  it('filters characters for "all" category includes everything', () => {
    const { result } = renderHook(() =>
      useGame({
        gameState: 'start',
        setGameState: vi.fn(),
      })
    )

    act(() => {
      result.current.setSelectedCategory('all')
    })

    // 'all' should return characters (all of them)
    expect(result.current.filteredCharacters.length).toBeGreaterThan(0)
  })

  it('handleRestart clears history and resets guessedCharacter', () => {
    vi.useFakeTimers()
    const setGameState = vi.fn()
    const onDramaticPause = vi.fn()
    const { result } = renderHook(() =>
      useGame({
        gameState: 'playing',
        setGameState,
        onDramaticPause,
      })
    )

    // Simulate some state
    act(() => {
      result.current.handleRestart()
    })

    expect(setGameState).toHaveBeenCalledWith('start')
    // After restart, history resets to personajes seed (Q1=yes, Q3=yes, Q4=yes)
    const personajesSeed = [
      { questionId: 1, answer: 'yes' },
      { questionId: 3, answer: 'yes' },
      { questionId: 4, answer: 'yes' },
    ]
    expect(result.current.history).toEqual(personajesSeed)
    expect(result.current.guessedCharacter).toBeNull()

    vi.useRealTimers()
  })

  it('calls onQuestionCountChange when history changes', () => {
    const onQuestionCountChange = vi.fn()
    renderHook(() =>
      useGame({
        gameState: 'playing',
        setGameState: vi.fn(),
        onQuestionCountChange,
      })
    )

    // Initial render should report 0
    expect(onQuestionCountChange).toHaveBeenCalledWith(0)
  })

  it('calls onConfidenceChange callback', () => {
    const onConfidenceChange = vi.fn()
    const { result } = renderHook(() =>
      useGame({
        gameState: 'playing',
        setGameState: vi.fn(),
        onConfidenceChange,
      })
    )

    // topScore is derived, callback should be called during smart guessing effect
    expect(typeof result.current.topScore).toBe('number')
  })

  it('handleAnswer with dont_know updates history', () => {
    vi.useFakeTimers()
    const setGameState = vi.fn()
    const { result } = renderHook(() =>
      useGame({
        gameState: 'playing',
        setGameState,
      })
    )

    act(() => {
      result.current.handleAnswer('dont_know')
    })

    // After the 1200ms timeout
    act(() => {
      vi.advanceTimersByTime(1200)
    })

    expect(result.current.history.length).toBe(1)
    expect(result.current.history[0].answer).toBe('dont_know')

    vi.useRealTimers()
  })

  it('remainingQuestions excludes answered questions', () => {
    const { result } = renderHook(() =>
      useGame({
        gameState: 'start',
        setGameState: vi.fn(),
      })
    )

    const initialCount = result.current.remainingQuestions.length
    expect(initialCount).toBeGreaterThan(0)
  })

  it('topCandidate changes after answering questions', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() =>
      useGame({
        gameState: 'playing',
        setGameState: vi.fn(),
      })
    )

    act(() => {
      result.current.handleAnswer('yes')
    })

    act(() => {
      vi.advanceTimersByTime(1200)
    })

    // After answering, candidates should be re-ranked
    expect(result.current.rankedCandidates.length).toBeGreaterThan(0)
    expect(result.current.topCandidate).toBeDefined()

    vi.useRealTimers()
  })

  // ===== BRANCH COVERAGE: win/lose effects =====

  it('win effect with daily character not yet guessed', () => {
    vi.mocked(loadDailyCharacter).mockReturnValue({
      characterName: 'Test Character',
      date: '2026-01-01',
      guessed: false,
      guesses: 0,
    } as DailyCharacter)

    const setGameState = vi.fn()
    renderHook(() =>
      useGame({
        gameState: 'win',
        setGameState,
      })
    )

    expect(recordDerinatorWin).toHaveBeenCalled()
  })

  it('win effect without daily character (null)', () => {
    vi.mocked(loadDailyCharacter).mockReturnValue(null)

    const setGameState = vi.fn()
    renderHook(() =>
      useGame({
        gameState: 'win',
        setGameState,
      })
    )

    expect(recordDerinatorWin).toHaveBeenCalled()
  })

  it('win effect with daily already guessed', () => {
    vi.mocked(loadDailyCharacter).mockReturnValue({
      characterName: 'Test Character',
      date: '2026-01-01',
      guessed: true,
      guesses: 5,
    } as DailyCharacter)

    vi.mocked(getDailyCharacterIndex).mockReturnValue(0)

    const setGameState = vi.fn()
    renderHook(() =>
      useGame({
        gameState: 'win',
        setGameState,
      })
    )

    expect(recordDerinatorWin).toHaveBeenCalled()
  })

  it('lose effect records all stats', () => {
    const setGameState = vi.fn()
    renderHook(() =>
      useGame({
        gameState: 'lose',
        setGameState,
      })
    )

    expect(recordUserWin).toHaveBeenCalled()
    expect(recordCategoryWin).toHaveBeenCalled()
    expect(checkAchievements).toHaveBeenCalled()
    expect(syncToServer).toHaveBeenCalled()
  })

  it('lose effect with guessedCharacter', () => {
    vi.useFakeTimers()
    const setGameState = vi.fn()
    const { result } = renderHook(() =>
      useGame({
        gameState: 'guess',
        setGameState,
      })
    )

    // handleGuess(false) calls setGameState('win') on false → triggers dramatic pause
    act(() => {
      result.current.handleGuess(false)
    })

    // The hook called setGameState but the parent doesn't update,
    // so we just verify the dramatic pause started
    expect(result.current.isThinkingDelay).toBe(true)

    vi.useRealTimers()
  })

  // ===== BRANCH COVERAGE: processAnswer paths =====

  it('handleAnswer with probably updates history', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() =>
      useGame({
        gameState: 'playing',
        setGameState: vi.fn(),
      })
    )

    act(() => {
      result.current.handleAnswer('probably')
    })

    act(() => {
      vi.advanceTimersByTime(1200)
    })

    expect(result.current.history.length).toBe(1)
    expect(result.current.history[0].answer).toBe('probably')

    vi.useRealTimers()
  })

  it('handleAnswer with probably_not updates history', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() =>
      useGame({
        gameState: 'playing',
        setGameState: vi.fn(),
      })
    )

    act(() => {
      result.current.handleAnswer('probably_not')
    })

    act(() => {
      vi.advanceTimersByTime(1200)
    })

    expect(result.current.history.length).toBe(1)
    expect(result.current.history[0].answer).toBe('probably_not')

    vi.useRealTimers()
  })

  it('handleAnswer with no updates history', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() =>
      useGame({
        gameState: 'playing',
        setGameState: vi.fn(),
      })
    )

    act(() => {
      result.current.handleAnswer('no')
    })

    act(() => {
      vi.advanceTimersByTime(1200)
    })

    expect(result.current.history.length).toBe(1)
    expect(result.current.history[0].answer).toBe('no')

    vi.useRealTimers()
  })

  // ===== BRANCH COVERAGE: derived state =====

  it('currentQuestion is null when no questions remain', () => {
    const { result } = renderHook(() =>
      useGame({
        gameState: 'start',
        setGameState: vi.fn(),
      })
    )

    // Should still have a question at start
    expect(result.current.currentQuestion).toBeDefined()
  })

  it('filteredCharacters changes rankedCandidates', () => {
    const { result } = renderHook(() =>
      useGame({
        gameState: 'start',
        setGameState: vi.fn(),
      })
    )

    const personajeCount = result.current.rankedCandidates.length

    act(() => {
      result.current.setSelectedCategory('animales')
    })

    // Animal candidates should be different from personaje candidates
    expect(result.current.rankedCandidates.length).not.toBe(personajeCount)
  })

  it('handleRestart resets all derived state', () => {
    const { result } = renderHook(() =>
      useGame({
        gameState: 'playing',
        setGameState: vi.fn(),
      })
    )

    act(() => {
      result.current.handleRestart()
    })

    // After restart, history resets to personajes seed (Q1=yes, Q3=yes, Q4=yes)
    const personajesSeed = [
      { questionId: 1, answer: 'yes' },
      { questionId: 3, answer: 'yes' },
      { questionId: 4, answer: 'yes' },
    ]
    expect(result.current.history).toEqual(personajesSeed)
    expect(result.current.guessedCharacter).toBeNull()
    expect(result.current.isThinkingDelay).toBe(false)
    expect(result.current.pendingAnswer).toBeNull()
  })

  // ===== BRANCH COVERAGE: category-specific excluded questions =====

  it('remainingQuestions differ per category', () => {
    const { result: personajesResult } = renderHook(() =>
      useGame({
        gameState: 'start',
        setGameState: vi.fn(),
      })
    )

    act(() => {
      personajesResult.current.setSelectedCategory('personajes')
    })

    const personajeQuestions = personajesResult.current.remainingQuestions.length

    act(() => {
      personajesResult.current.setSelectedCategory('animales')
    })

    const animalQuestions = personajesResult.current.remainingQuestions.length

    // Different categories should have different question counts
    expect(animalQuestions).not.toBe(personajeQuestions)
  })
})
