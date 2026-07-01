import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Game from './Game'

// Mock useGame hook
const mockGame = {
  gameState: 'start' as string,
  selectedCategory: 'personajes' as string,
  filteredCharacters: Array.from({ length: 50 }, (_, i) => ({
    id: i, name: `Char${i}`, description: '', category: 'personaje', answers: {},
  })),
  learnedCount: 0,
  handleStart: vi.fn(),
  handleRestart: vi.fn(),
  handleAnswer: vi.fn(),
  handleGuess: vi.fn(),
  setSelectedCategory: vi.fn(),
  currentQuestion: { id: 1, text: '¿Es un animal?' },
  history: [],
  guessedCharacter: null as { name: string; description: string } | null,
  topCandidate: null as { id: number; name: string; description: string } | null,
  topScore: 0,
  rankedCandidates: [],
  isThinkingDelay: false,
  pendingAnswer: null,
}

vi.mock('./useGame', () => ({
  useGame: () => mockGame,
}))

vi.mock('../ui/Avatar', () => ({
  default: ({ name }: { name: string }) => <div data-testid="avatar">{name}</div>,
}))

vi.mock('../../data/categoryEmojis', () => ({
  getCategoryEmoji: () => '🎮',
  getCategoryLabel: () => 'Ficción',
}))

function renderGame(gameState = 'start') {
  mockGame.gameState = gameState
  const setGameState = vi.fn()
  return render(
    <MemoryRouter>
      <Game
        gameState={gameState as any}
        setGameState={setGameState}
      />
    </MemoryRouter>
  )
}

describe('Game component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGame.gameState = 'start'
    mockGame.history = []
    mockGame.guessedCharacter = null
    mockGame.topCandidate = null
    mockGame.topScore = 0
    mockGame.learnedCount = 0
    mockGame.isThinkingDelay = false
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

    it('shows learned count when > 0', () => {
      mockGame.learnedCount = 3
      renderGame('start')
      expect(screen.getByText(/3 personajes aprendidos/)).toBeDefined()
    })

    it('hides learned count when 0', () => {
      mockGame.learnedCount = 0
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
      expect(mockGame.handleAnswer).toHaveBeenCalledWith('yes')
    })

    it('shows thinking overlay when processing', () => {
      mockGame.isThinkingDelay = true
      mockGame.pendingAnswer = 'yes'
      renderGame('playing')
      expect(screen.getByText('Mmm... interesante...')).toBeDefined()
    })
  })

  describe('guess state', () => {
    it('renders guess question with character name', () => {
      mockGame.guessedCharacter = { name: 'Goku', description: 'Saiyajin' }
      mockGame.topScore = 85
      mockGame.rankedCandidates = [{ id: 1, name: 'Goku' }] as any
      renderGame('guess')
      expect(screen.getByText('¿Era Goku?')).toBeDefined()
    })

    it('renders yes/no buttons for guess', () => {
      mockGame.guessedCharacter = { name: 'Goku', description: '' }
      mockGame.topScore = 85
      mockGame.rankedCandidates = []
      renderGame('guess')
      expect(screen.getByText('¡Sí!')).toBeDefined()
      expect(screen.getByText('No')).toBeDefined()
    })

    it('shows confidence bar', () => {
      mockGame.guessedCharacter = { name: 'Goku', description: '' }
      mockGame.topScore = 85
      mockGame.rankedCandidates = []
      renderGame('guess')
      expect(screen.getByText('85% certeza')).toBeDefined()
    })
  })

  describe('win state', () => {
    it('renders win message', () => {
      mockGame.guessedCharacter = { name: 'Pikachu', description: '' }
      mockGame.history = [{ questionId: 1, answer: 'yes' }] as any
      renderGame('win')
      expect(screen.getByText('¡Derinator wins!')).toBeDefined()
    })

    it('shows character name and question count', () => {
      mockGame.guessedCharacter = { name: 'Pikachu', description: '' }
      mockGame.history = [1, 2, 3] as any
      renderGame('win')
      expect(screen.getByText(/Pikachu/)).toBeDefined()
      expect(screen.getByText('En 3 preguntas')).toBeDefined()
    })
  })

  describe('lose state', () => {
    it('renders lose message', () => {
      mockGame.guessedCharacter = { name: 'Naruto', description: '' }
      mockGame.history = []
      renderGame('lose')
      expect(screen.getByText('¡Derrotado!')).toBeDefined()
    })

    it('shows teach button', () => {
      mockGame.guessedCharacter = { name: 'Naruto', description: '' }
      mockGame.history = []
      renderGame('lose')
      expect(screen.getByText('📚 Enseñar personaje')).toBeDefined()
    })

    it('shows retry button', () => {
      mockGame.guessedCharacter = { name: 'Naruto', description: '' }
      mockGame.history = []
      renderGame('lose')
      expect(screen.getByText('Intentar de nuevo')).toBeDefined()
    })
  })
})
