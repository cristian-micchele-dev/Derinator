import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import DailyCharacter from './DailyCharacter'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../../data/characters', () => ({
  getAllCharacters: () => [
    { id: 1, name: 'Goku', description: 'Saiyajin', category: 'personaje', answers: {} },
    { id: 2, name: 'Pikachu', description: 'Pokemon eléctrico', category: 'animal', answers: {} },
    { id: 3, name: 'Messi', description: 'Futbolista', category: 'personaje', answers: {} },
  ],
}))

vi.mock('../../data/stats', () => ({
  getDailyCharacterIndex: () => 0,
  loadDailyCharacter: vi.fn(() => null),
  saveDailyCharacter: vi.fn(),
  resetDailyCharacter: vi.fn(),
}))

vi.mock('../../assets/derifondo2.png', () => ({ default: 'mock-bg.png' }))

function renderDaily() {
  return render(
    <MemoryRouter>
      <DailyCharacter />
    </MemoryRouter>
  )
}

describe('DailyCharacter page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the page title', () => {
    renderDaily()
    expect(screen.getByText('Personaje del Día')).toBeDefined()
  })

  it('renders the subtitle', () => {
    renderDaily()
    expect(screen.getByText(/Cada día un personaje secreto/)).toBeDefined()
  })

  it('shows pending state when not guessed', () => {
    renderDaily()
    expect(screen.getByText('Pendiente')).toBeDefined()
  })

  it('renders play button', () => {
    renderDaily()
    expect(screen.getByText('Jugar')).toBeDefined()
  })

  it('renders back button', () => {
    renderDaily()
    expect(screen.getByText('← Volver')).toBeDefined()
  })

  it('renders countdown timer', () => {
    renderDaily()
    expect(screen.getByText('Próximo personaje en:')).toBeDefined()
  })

  it('renders instructions section', () => {
    renderDaily()
    expect(screen.getByText('¿Cómo funciona?')).toBeDefined()
    expect(screen.getByText(/Todos los días hay un personaje secreto/)).toBeDefined()
  })

  it('shows completed state when guessed', async () => {
    const { loadDailyCharacter } = await import('../../data/stats')
    vi.mocked(loadDailyCharacter).mockReturnValue({
      characterName: 'Goku',
      date: new Date().toISOString().split('T')[0],
      guessed: true,
      guesses: 5,
    })

    renderDaily()
    expect(screen.getByText('Completado')).toBeDefined()
    expect(screen.getByText(/Goku/)).toBeDefined()
    expect(screen.getByText(/5 intentos/)).toBeDefined()
  })
})
