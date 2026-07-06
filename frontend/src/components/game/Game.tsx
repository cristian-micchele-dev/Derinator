import { useState } from 'react'
import { getCategoryEmoji, getCategoryLabel } from '../../data/categoryEmojis'
import LearnMode from './LearnMode'
import Avatar from '../ui/Avatar'
import { useGame, GameCategory } from './useGame'
import type { GameState } from '../../types'
import { loadLearnedCharacters, deleteLearnedCharacter } from '../../data/learnedStorage'
import './Game.css'

export type { GameCategory }

type Game = ReturnType<typeof useGame>

interface GameProps {
  gameState: GameState
  setGameState: (state: GameState) => void
  onConfidenceChange?: (confidence: number) => void
  onQuestionCountChange?: (count: number) => void
  onDramaticPause?: (isPaused: boolean) => void
}

export default function Game(props: GameProps) {
  const game = useGame(props)
  return <GameView game={game} />
}

function GameView({ game }: { game: Game }) {
  const { state, category, candidates, question, actions } = game

  if (state.gameState === 'start') {
    return (
      <GameStart
        selectedCategory={category.selectedCategory}
        setSelectedCategory={category.setSelectedCategory}
        filteredCharacters={category.filteredCharacters}
        handleStart={actions.handleStart}
      />
    )
  }

  if (state.gameState === 'win') {
    return (
      <GameWin
        guessedCharacter={state.guessedCharacter}
        historyLength={question.history.length}
        seedCount={question.seedCount}
        handleRestart={actions.handleRestart}
      />
    )
  }

  if (state.gameState === 'lose') {
    return (
      <GameLose
        guessedCharacter={state.guessedCharacter}
        topCandidate={candidates.topCandidate}
        filteredCharacters={category.filteredCharacters}
        historyLength={question.history.length}
        seedCount={question.seedCount}
        setGameState={actions.setGameState}
        handleRestart={actions.handleRestart}
      />
    )
  }

  if (state.gameState === 'learn_name' || state.gameState === 'learn_questions') {
    return (
      <LearnMode
        history={question.history}
        onComplete={actions.handleRestart}
        onCancel={actions.handleRestart}
        defeatedByName={state.guessedCharacter?.name || candidates.topCandidate?.name}
        gameCategory={category.selectedCategory}
      />
    )
  }

  if (state.gameState === 'guess') {
    return (
      <GameGuess
        guessedCharacter={state.guessedCharacter}
        topCandidate={candidates.topCandidate}
        filteredCharacters={category.filteredCharacters}
        topScore={candidates.topScore}
        rankedCandidatesCount={candidates.rankedCandidates.length}
        handleGuess={actions.handleGuess}
        handleRestart={actions.handleRestart}
      />
    )
  }

  return (
    <GamePlaying
      historyLength={question.history.length}
      seedCount={question.seedCount}
      rankedCandidatesCount={candidates.rankedCandidates.length}
      topScore={candidates.topScore}
      currentQuestion={question.currentQuestion}
      isThinkingDelay={state.isThinkingDelay}
      pendingAnswer={state.pendingAnswer}
      handleAnswer={actions.handleAnswer}
      handleRestart={actions.handleRestart}
    />
  )
}

// ——— Sub-components ———

interface GameStartProps {
  selectedCategory: GameCategory
  setSelectedCategory: (cat: GameCategory) => void
  filteredCharacters: Game['category']['filteredCharacters']
  handleStart: () => void
}

function GameStart({ selectedCategory, setSelectedCategory, filteredCharacters, handleStart }: GameStartProps) {
  const [learnedChars, setLearnedChars] = useState(() => loadLearnedCharacters())
  const [showLearnedList, setShowLearnedList] = useState(false)

  function handleDeleteLearned(id: number) {
    deleteLearnedCharacter(id)
    setLearnedChars(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="game-container">
      <div className="question-box">
        <p>¿En quién estás pensando?</p>
      </div>

      <div className="category-selector">
        {(['personajes', 'famosos', 'animales'] as GameCategory[]).map((cat) => (
          <button
            key={cat}
            className={`btn-category ${selectedCategory === cat ? 'active' : ''}`}
            aria-pressed={selectedCategory === cat}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat === 'personajes' ? '🎭 Ficción' : cat === 'famosos' ? '⭐ Famosos' : '🦁 Animales'}
          </button>
        ))}
      </div>

      <p className="category-hint">
        {selectedCategory === 'personajes' && `${filteredCharacters.length} personajes de ficción`}
        {selectedCategory === 'famosos' && `${filteredCharacters.length} famosos reales`}
        {selectedCategory === 'animales' && `${filteredCharacters.length} animales disponibles`}
      </p>

      {learnedChars.length > 0 && (
        <div className="learned-section">
          <button className="learned-toggle" onClick={() => setShowLearnedList(v => !v)}>
            🧠 {learnedChars.length} personaje{learnedChars.length !== 1 ? 's' : ''} aprendido{learnedChars.length !== 1 ? 's' : ''} {showLearnedList ? '▲' : '▼'}
          </button>
          {showLearnedList && (
            <ul className="learned-list">
              {learnedChars.map(c => (
                <li key={c.id} className="learned-list-item">
                  <span>{c.name}</span>
                  <button
                    className="learned-delete-btn"
                    onClick={() => handleDeleteLearned(c.id)}
                    title={`Eliminar a ${c.name}`}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <button className="btn-primary" onClick={handleStart}>
        Comenzar
      </button>
    </div>
  )
}

interface GameWinProps {
  guessedCharacter: Game['state']['guessedCharacter']
  historyLength: number
  seedCount: number
  handleRestart: () => void
}

function GameWin({ guessedCharacter, historyLength, seedCount, handleRestart }: GameWinProps) {
  const questionCount = historyLength - seedCount
  return (
    <div className="game-container">
      <div className="question-box win">
        <div className="win-avatar-container">
          <Avatar name={guessedCharacter?.name || 'Derinator'} size="xl" />
        </div>
        <p className="result-text">¡Derinator gana!</p>
        <p className="hint">Pensé en <strong>{guessedCharacter?.name}</strong></p>
        <div className="win-score">
          <span className="win-score-value">{questionCount}</span>
          <span className="win-score-label">{questionCount === 1 ? 'pregunta' : 'preguntas'}</span>
        </div>
      </div>
      <button className="btn-primary" onClick={handleRestart}>
        Jugar de nuevo
      </button>
    </div>
  )
}

interface GameLoseProps {
  guessedCharacter: Game['state']['guessedCharacter']
  topCandidate: Game['candidates']['topCandidate']
  filteredCharacters: Game['category']['filteredCharacters']
  historyLength: number
  seedCount: number
  setGameState: (state: GameState) => void
  handleRestart: () => void
}

function GameLose({ guessedCharacter, topCandidate, filteredCharacters, historyLength, seedCount, setGameState, handleRestart }: GameLoseProps) {
  const attemptedName = guessedCharacter?.name || topCandidate?.name
  const attemptedCharFull = guessedCharacter
    ? filteredCharacters.find(c => c.name === guessedCharacter.name)
    : topCandidate
      ? filteredCharacters.find(c => c.id === topCandidate.id)
      : undefined
  const attemptedEmoji = attemptedCharFull
    ? getCategoryEmoji(attemptedCharFull.category, attemptedCharFull.subcategory)
    : ''

  return (
    <div className="game-container">
      <div className="question-box lose">
        <p className="result-text">¡Derrotado!</p>
        {attemptedName ? (
          <>
            <div className="lose-avatar-container">
              <Avatar name={attemptedName} size="lg" />
            </div>
            <div className="lose-name-row">
              <span
                className="category-badge lose-badge"
                title={attemptedCharFull ? getCategoryLabel(attemptedCharFull.category, attemptedCharFull.subcategory) : ''}
              >
                {attemptedEmoji}
              </span>
              <p>Pensé en <strong>{attemptedName}</strong> pero me equivoqué.</p>
            </div>
          </>
        ) : (
          <p>No pude adivinar.</p>
        )}
        <p>¡Ayudame a aprender para la próxima!</p>
        <p className="hint">{historyLength - seedCount} preguntas usadas</p>
      </div>
      <button className="btn-primary" onClick={() => setGameState('learn_name')}>
        📚 Enseñar personaje
      </button>
      <button className="btn-secondary" onClick={handleRestart}>
        Intentar de nuevo
      </button>
    </div>
  )
}

interface GameGuessProps {
  guessedCharacter: Game['state']['guessedCharacter']
  topCandidate: Game['candidates']['topCandidate']
  filteredCharacters: Game['category']['filteredCharacters']
  topScore: number
  rankedCandidatesCount: number
  handleGuess: Game['actions']['handleGuess']
  handleRestart: () => void
}

function GameGuess({ guessedCharacter, topCandidate, filteredCharacters, topScore, rankedCandidatesCount, handleGuess, handleRestart }: GameGuessProps) {
  const guessName = guessedCharacter?.name || topCandidate?.name || ''
  const guessCharFull = guessedCharacter
    ? filteredCharacters.find(c => c.name === guessedCharacter.name)
    : topCandidate
      ? filteredCharacters.find(c => c.id === topCandidate.id)
      : undefined
  const guessEmoji = guessCharFull ? getCategoryEmoji(guessCharFull.category, guessCharFull.subcategory) : ''
  const guessLabel = guessCharFull ? getCategoryLabel(guessCharFull.category, guessCharFull.subcategory) : ''

  return (
    <div className="game-container">
      <div className="question-box guess">
        <div className="guess-avatar-container">
          <Avatar name={guessName} size="xl" />
        </div>
        <div className="guess-name-row">
          <span className="category-badge" title={guessLabel}>
            {guessEmoji}
          </span>
          <p className="result-text">¿Era {guessName}?</p>
        </div>
        <p className="hint">{guessedCharacter?.description || topCandidate?.description}</p>
        <div className="confidence-bar-container">
          <div
            className="confidence-bar"
            style={{ width: `${topScore}%`, backgroundColor: topScore >= 70 ? '#4ade80' : '#b45309' }}
          />
          <span className="confidence-label">{topScore}% certeza</span>
        </div>
        <p className="candidates-left">
          {rankedCandidatesCount} candidato{rankedCandidatesCount !== 1 ? 's' : ''}
        </p>
      </div>
      <div className="answer-buttons">
        <button className="btn-answer btn-yes" onClick={() => handleGuess(true)}>
          ¡Sí!
        </button>
        <button className="btn-answer btn-no" onClick={() => handleGuess(false)}>
          No
        </button>
      </div>
      <button className="btn-exit" onClick={handleRestart}>
        ← Volver al inicio
      </button>
    </div>
  )
}

interface GamePlayingProps {
  historyLength: number
  seedCount: number
  rankedCandidatesCount: number
  topScore: number
  currentQuestion: Game['question']['currentQuestion']
  isThinkingDelay: boolean
  pendingAnswer: Game['state']['pendingAnswer']
  handleAnswer: Game['actions']['handleAnswer']
  handleRestart: () => void
}

function GamePlaying({ historyLength, seedCount, rankedCandidatesCount, topScore, currentQuestion, isThinkingDelay, pendingAnswer, handleAnswer, handleRestart }: GamePlayingProps) {
  const confidenceColor = topScore >= 70 ? '#4ade80' : topScore >= 40 ? '#fbbf24' : '#e94560'

  return (
    <div className="game-container">
      <div className="progress">
        <div className="progress-info">
          Pregunta {historyLength - seedCount + 1}
          <span className="candidates"> | {rankedCandidatesCount} candidatos</span>
        </div>
        <div className="confidence-bar-container">
          <div
            className="confidence-bar"
            style={{ width: `${topScore}%`, backgroundColor: confidenceColor }}
          />
          <span className="confidence-label">{topScore}% certeza</span>
        </div>
      </div>

      {isThinkingDelay && (
        <div className="question-box thinking-overlay">
          <div className="thinking-spinner">
            <span className="thinking-dot" />
            <span className="thinking-dot" />
            <span className="thinking-dot" />
          </div>
          <p className="thinking-text">
            {pendingAnswer === 'yes' && 'Mmm... interesante...'}
            {pendingAnswer === 'no' && 'Descartando opciones...'}
            {pendingAnswer === 'probably' && 'Probablemente...'}
            {pendingAnswer === 'probably_not' && 'Puede que no...'}
            {pendingAnswer === 'dont_know' && 'No importa, sigo...'}
          </p>
        </div>
      )}

      {!isThinkingDelay && (
        <>
          <div className="question-box" key={currentQuestion?.id}>
            <p>{currentQuestion?.text}</p>
          </div>
          <div className="answer-buttons">
            <div className="answer-row">
              <button className="btn-answer btn-yes" onClick={() => handleAnswer('yes')}>
                <span className="answer-full">Sí</span>
              </button>
              <button className="btn-answer btn-no" onClick={() => handleAnswer('no')}>
                <span className="answer-full">No</span>
              </button>
            </div>
            <div className="answer-row">
              <button className="btn-answer btn-probably" onClick={() => handleAnswer('probably')}>
                <span className="answer-full">Probablemente</span>
                <span className="answer-short">Prob. sí</span>
              </button>
              <button className="btn-answer btn-probably-not" onClick={() => handleAnswer('probably_not')}>
                <span className="answer-full">Probablemente no</span>
                <span className="answer-short">Prob. no</span>
              </button>
            </div>
            <button className="btn-answer btn-dont-know" onClick={() => handleAnswer('dont_know')}>
              No sé
            </button>
          </div>
        </>
      )}

      <button className="btn-exit" onClick={handleRestart} disabled={isThinkingDelay}>
        ← Volver al inicio
      </button>
    </div>
  )
}
