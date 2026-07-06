import { useState, useEffect, useCallback, useMemo } from 'react'
import Game from '../game/Game'
import DerinatorAvatar, { DerinatorEmotion } from '../ui/DerinatorAvatar'
import { getStatsDisplay, loadGameState, clearGameState, loadFromServer } from '../../data/stats'
import '../ui/DerinatorAvatar.css'

import type { GameState } from '../../types'

const BUBBLE_TEXTS: Record<GameState, string[]> = {
  start: ['Pensá en alguien...', '¿Listo para jugar?', 'Yo leo tu mente...', 'Concentrate...', 'Elige bien...'],
  playing: ['Hmm...', 'Déjame pensar...', 'Interesante...', 'Se me ocurre algo...', 'Ya casi...', 'Procesando...'],
  guess: ['¡Ya sé!', 'Lo tengo...', '¿Será...?', 'Estoy seguro...', 'Creo que es...'],
  win: ['¡Te atrapé!', '¡Yo gano!', 'Jeje, lo sabía', '¡Nadie me escapa!', '¡Demasiado fácil!', '¡Lo sabía!'],
  lose: ['Me ganaste...', 'Hmm, la próxima...', '¿En quién pensabas?', 'Enseñame...', 'Me venciste...'],
  learn_name: ['¡Contame!', '¿Quién era?', 'Quiero aprender...', 'Decime el nombre', 'Sorprendeme...'],
  learn_questions: ['Anotando...', 'Interesante dato...', 'Lo recordaré...', 'Genial, sigo aprendiendo', 'Muy útil...'],
}

const VICTORY_PHRASES = [
  '¡Te atrapé!',
  '¡Yo gano!',
  'Jeje, lo sabía',
  '¡Nadie me escapa!',
  '¡Demasiado fácil!',
  '¡Tu mente es un libro abierto!',
  '¡Imparable!',
  '¡Lo tenía desde el principio!',
]

const DEFEAT_PHRASES = [
  'Me ganaste...',
  'Hmm, la próxima...',
  '¿En quién pensabas?',
  'Enseñame...',
  'Me venciste...',
  'Ese no me lo esperaba...',
  '¡Muy bien jugado!',
  'La próxima te atrapo...',
]

export default function GamePage() {
  const [gameState, setGameState] = useState<GameState>('start')
  const [bubbleText, setBubbleText] = useState('Pensá en alguien...')
  const [statsDisplay, setStatsDisplay] = useState('')
  const [confidence, setConfidence] = useState(0)
  const [questionCount, setQuestionCount] = useState(0)
  const [isDramaticPause, setIsDramaticPause] = useState(false)

  // Try to load stats from server on mount
  useEffect(() => {
    loadFromServer().then((loaded) => {
      if (loaded) {
        setStatsDisplay(getStatsDisplay())
      }
    })
  }, [])

  const pickRandom = useCallback((state: GameState) => {
    const options = BUBBLE_TEXTS[state]
    return options[Math.floor(Math.random() * options.length)]
  }, [])

  const getVictoryPhrase = useCallback(() => {
    return VICTORY_PHRASES[Math.floor(Math.random() * VICTORY_PHRASES.length)]
  }, [])

  const getDefeatPhrase = useCallback(() => {
    return DEFEAT_PHRASES[Math.floor(Math.random() * DEFEAT_PHRASES.length)]
  }, [])

  // Update bubble and stats when gameState changes
  useEffect(() => {
    if (gameState === 'win') {
      setBubbleText(getVictoryPhrase())
    } else if (gameState === 'lose') {
      setBubbleText(getDefeatPhrase())
    } else {
      setBubbleText(pickRandom(gameState))
    }
    setStatsDisplay(getStatsDisplay())
  }, [gameState, pickRandom, getVictoryPhrase, getDefeatPhrase])

  // Restore game state on mount
  useEffect(() => {
    const saved = loadGameState()
    if (saved) {
      setGameState(saved.gameState)
    }
  }, [])

  // Clear saved game when returning to start
  useEffect(() => {
    if (gameState === 'start' || gameState === 'win' || gameState === 'lose') {
      clearGameState()
    }
  }, [gameState])

  // Calculate emotion based on game state and confidence
  const emotion: DerinatorEmotion = useMemo(() => {
    if (isDramaticPause) return 'confident'
    switch (gameState) {
      case 'start': return 'neutral'
      case 'playing':
        if (confidence >= 80) return 'confident'
        if (confidence >= 50) return 'thinking'
        if (questionCount >= 15) return 'worried'
        return 'thinking'
      case 'guess': return 'surprised'
      case 'win': return 'triumphant'
      case 'lose': return 'defeated'
      case 'learn_name': return 'surprised'
      case 'learn_questions': return 'thinking'
      default: return 'neutral'
    }
  }, [gameState, confidence, questionCount, isDramaticPause])

  const isThinking = gameState === 'playing' || gameState === 'learn_questions'

  const isInGame = gameState !== 'start' && gameState !== 'win' && gameState !== 'lose'

  return (
    <div className={`app ${isInGame ? 'app--playing' : ''}`}>
      <header className="header">
        <h1>Derinator</h1>
        <p>Pensá en un personaje y lo voy a adivinar</p>
        {statsDisplay && (
          <div className="stats-bar">{statsDisplay}</div>
        )}
      </header>

      <main className="main-content">
        <section className="image-section">
          <DerinatorAvatar
            emotion={emotion}
            isThinking={isThinking}
            bubbleText={bubbleText}
          />
          {isThinking && (
            <div className="thinking-particles">
              <div className="thinking-particle" />
              <div className="thinking-particle" />
              <div className="thinking-particle" />
              <div className="thinking-particle" />
            </div>
          )}
        </section>

        <section className="game-section" style={{ position: 'relative' }}>
          <Game
            gameState={gameState}
            setGameState={setGameState}
            onConfidenceChange={setConfidence}
            onQuestionCountChange={setQuestionCount}
            onDramaticPause={setIsDramaticPause}
          />
          {isDramaticPause && (
            <div className="dramatic-overlay">
              <div className="game-container">
                <div className="question-box dramatic">
                  <p className="dramatic-text">Creo que ya sé...</p>
                  <div className="dramatic-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
