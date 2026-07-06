import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Game from './Game'
import type { GameState } from '../../types'
import type { Answer } from '../../types'
import type { QuestionId } from '../../data/questions'

// Mock useGame hook — mirroring the namespaced return of useGame
const mockGame = {
  state: {
    gameState: 'start' as string,
    isThinkingDelay: false,
    pendingAnswer: null as Answer | null,
    guessedCharacter: null as { name: string; description: string } | null,
  },
  category: {
    selectedCategory: 'personajes' as string,
    setSelectedCategory: vi.fn(),
    filteredCharacters: Array.from({ length: 50 }, (_, i) => ({
      id: i, name: `Char${i}`, description: '', category: 'personaje', subcategory: 'otro', answers: {},
    })),
  },
  candidates: {
    rankedCandidates: [] as { id: number; name: string; description: string; score: number; category: string; answers: Record<string, unknown> }[],
    topCandidate: null as { id: number; name: string; description: string } | null,
    topScore: 0,
  },
  question: {
    currentQuestion: { id: 1, text: '¿Es un animal?' } as { id: number; text: string } | null,
    history: [] as { questionId: QuestionId; answer: Answer }[],
    seedCount: 0,
    remainingQuestions: [],
  },
  meta: {
    learnedCount: 0,
  },
  actions: {
    handleStart: vi.fn(),
    handleRestart: vi.fn(),
    handleAnswer: vi.fn(),
    handleGuess: vi.fn(),
    setGameState: vi.fn(),
  },
}

vi.mock('./useGame', () => ({
  useGame: () => mockGame,
}))

const mockLearnedCharacters: { id: number; name: string; category: string; answers: Record<string, string> }[] = []

vi.mock('../../data/learnedStorage', () => ({
  loadLearnedCharacters: () => [...mockLearnedCharacters],
  deleteLearnedCharacter: vi.fn(),
}))

vi.mock('../ui/Avatar', () => ({
  default: ({ name }: { name: string }) => <div data-testid="avatar">{name}</div>,
}))

vi.mock('../../data/categoryEmojis', () => ({
  getCategoryEmoji: () => '🎮',
  getCategoryLabel: () => 'Ficción',
}))

function renderGame(gameState = 'start') {
  mockGame.state.gameState = gameState
  const setGameState = vi.fn()
  return render(
    <MemoryRouter>
      <Game
        gameState={gameState as GameState}
        setGameState={setGameState}
      />
    </MemoryRouter>
  )
}

describe('Game component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGame.state.gameState = 'start'
    mockGame.question.history = []
    mockGame.state.guessedCharacter = null
    mockGame.candidates.topCandidate = null
    mockGame.candidates.topScore = 0
    mockGame.meta.learnedCount = 0
    mockGame.state.isThinkingDelay = false
    mockGame.state.pendingAnswer = null
    mockGame.candidates.rankedCandidates = []
  })

  describe('start state', () => {
    it('renders category selector with three options', () => {
      renderGame('start')
      expect(screen.getByText('Ficción')).toBeDefined()
      expect(screen.getByText('Famosos')).toBeDefined()
      expect(screen.getByText('Animales')).toBeDefined()
    })

    it('renders start button', () => {
      renderGame('start')
      expect(screen.getByText('Comenzar')).toBeDefined()
    })

    it('shows learned count toggle when characters exist', () => {
      mockLearnedCharacters.push({ id: 10001, name: 'Pikachu', category: 'animal', answers: {} })
      mockLearnedCharacters.push({ id: 10002, name: 'Goku', category: 'personaje', answers: {} })
      mockLearnedCharacters.push({ id: 10003, name: 'Batman', category: 'personaje', answers: {} })
      renderGame('start')
      expect(screen.getByText(/3 personajes aprendidos/)).toBeDefined()
      mockLearnedCharacters.length = 0
    })

    it('hides learned section when no learned characters', () => {
      renderGame('start')
      expect(screen.queryByText(/personajes aprendidos/)).toBeNull()
    })

    it('shows character count hint', () => {
      renderGame('start')
      expect(screen.getByText('50 personajes de ficción')).toBeDefined()
    })
  })

  describe('playing state', () => {
    it('renders current question', () => {
      renderGame('playing')
      expect(screen.getByText('¿Es un animal?')).toBeDefined()
    })

    it('renders all five answer buttons', () => {
      renderGame('playing')
      expect(screen.getByText('Sí')).toBeDefined()
      expect(screen.getByText('No')).toBeDefined()
      expect(document.querySelector('.btn-probably')).toBeDefined()
      expect(document.querySelector('.btn-probably-not')).toBeDefined()
      expect(screen.getByText('No sé')).toBeDefined()
    })

    it('calls handleAnswer on button click', async () => {
      renderGame('playing')
      await userEvent.click(screen.getByText('Sí'))
      expect(mockGame.actions.handleAnswer).toHaveBeenCalledWith('yes')
    })

    it('shows thinking overlay when processing', () => {
      mockGame.state.isThinkingDelay = true
      mockGame.state.pendingAnswer = 'yes'
      renderGame('playing')
      expect(screen.getByText('Mmm... interesante...')).toBeDefined()
    })
  })

  describe('guess state', () => {
    it('renders guess question with character name', () => {
      mockGame.state.guessedCharacter = { name: 'Goku', description: 'Saiyajin' }
      mockGame.candidates.topScore = 85
      mockGame.candidates.rankedCandidates = [{ id: 1, name: 'Goku', description: '', score: 0.85, category: 'personaje', answers: {} }]
      renderGame('guess')
      expect(screen.getByText('¿Era Goku?')).toBeDefined()
    })

    it('renders yes/no buttons for guess', () => {
      mockGame.state.guessedCharacter = { name: 'Goku', description: '' }
      mockGame.candidates.topScore = 85
      renderGame('guess')
      expect(screen.getByText('¡Sí!')).toBeDefined()
      expect(screen.getByText('No')).toBeDefined()
    })

    it('shows confidence bar', () => {
      mockGame.state.guessedCharacter = { name: 'Goku', description: '' }
      mockGame.candidates.topScore = 85
      renderGame('guess')
      expect(screen.getByText('85% certeza')).toBeDefined()
    })
  })

  describe('win state', () => {
    it('renders win message', () => {
      mockGame.state.guessedCharacter = { name: 'Pikachu', description: '' }
      mockGame.question.history = [{ questionId: 1 as QuestionId, answer: 'yes' as Answer }]
      renderGame('win')
      expect(screen.getByText('¡Derinator wins!')).toBeDefined()
    })

    it('shows character name and question count', () => {
      mockGame.state.guessedCharacter = { name: 'Pikachu', description: '' }
      mockGame.question.history = [1, 2, 3].map(id => ({ questionId: id as QuestionId, answer: 'yes' as Answer }))
      renderGame('win')
      expect(screen.getByText(/Pikachu/)).toBeDefined()
      expect(screen.getByText('En 3 preguntas')).toBeDefined()
    })
  })

  describe('lose state', () => {
    it('renders lose message', () => {
      mockGame.state.guessedCharacter = { name: 'Naruto', description: '' }
      mockGame.question.history = []
      renderGame('lose')
      expect(screen.getByText('¡Derrotado!')).toBeDefined()
    })

    it('shows teach button', () => {
      mockGame.state.guessedCharacter = { name: 'Naruto', description: '' }
      mockGame.question.history = []
      renderGame('lose')
      expect(screen.getByText('📚 Enseñar personaje')).toBeDefined()
    })

    it('shows retry button', () => {
      mockGame.state.guessedCharacter = { name: 'Naruto', description: '' }
      mockGame.question.history = []
      renderGame('lose')
      expect(screen.getByText('Intentar de nuevo')).toBeDefined()
    })
  })
})
