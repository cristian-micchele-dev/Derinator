import { getCategoryEmoji, getCategoryLabel } from '../../data/categoryEmojis'
import LearnMode from './LearnMode'
import Avatar from '../ui/Avatar'
import { useGame, GameCategory } from './useGame'
import type { GameState } from '../../types'
import './Game.css'

export type { GameCategory }

interface GameProps {
  gameState: GameState
  setGameState: (state: GameState) => void
  onConfidenceChange?: (confidence: number) => void
  onQuestionCountChange?: (count: number) => void
  onDramaticPause?: (isPaused: boolean) => void
}

export default function Game(props: GameProps) {
  const game = useGame(props)

  if (game.gameState === 'start') {
    return (
      <div className="game-container">
        <div className="question-box">
          <p>¿En qué estás pensando?</p>
        </div>

        <div className="category-selector">
          {(['personajes', 'famosos', 'animales'] as GameCategory[]).map((cat) => (
            <button
              key={cat}
              className={`btn-category ${game.selectedCategory === cat ? 'active' : ''}`}
              onClick={() => game.setSelectedCategory(cat)}
            >
              {cat === 'personajes' ? 'Ficción' : cat === 'famosos' ? 'Famosos' : 'Animales'}
            </button>
          ))}
        </div>

        <p className="category-hint">
          {game.selectedCategory === 'personajes' && `${game.filteredCharacters.length} personajes de ficción`}
          {game.selectedCategory === 'famosos' && `${game.filteredCharacters.length} famosos reales`}
          {game.selectedCategory === 'animales' && `${game.filteredCharacters.length} animales disponibles`}
        </p>

        {game.learnedCount > 0 && (
          <p className="learned-count">
            🧠 {game.learnedCount} personaje{game.learnedCount !== 1 ? 's' : ''} aprendido{game.learnedCount !== 1 ? 's' : ''}
          </p>
        )}

        <button className="btn-primary" onClick={game.handleStart}>
          Comenzar
        </button>
      </div>
    )
  }

  if (game.gameState === 'win') {
    return (
      <div className="game-container">
        <div className="question-box win">
          <p className="result-text">¡Derinator wins!</p>
          <p className="hint">Pensé en {game.guessedCharacter?.name} y acerté</p>
          <p className="hint">En {game.history.length} preguntas</p>
        </div>
        <button className="btn-primary" onClick={game.handleRestart}>
          Jugar de nuevo
        </button>
      </div>
    )
  }

  if (game.gameState === 'lose') {
    const attemptedName = game.guessedCharacter?.name || game.topCandidate?.name
    const attemptedCharFull = game.guessedCharacter
      ? game.filteredCharacters.find(c => c.name === game.guessedCharacter!.name)
      : game.topCandidate
        ? game.filteredCharacters.find(c => c.id === game.topCandidate!.id)
        : undefined
    const attemptedEmoji = attemptedCharFull ? getCategoryEmoji(attemptedCharFull.category, attemptedCharFull.subcategory) : ''
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
                <span className="category-badge lose-badge" title={attemptedCharFull ? getCategoryLabel(attemptedCharFull.category, attemptedCharFull.subcategory) : ''}>{attemptedEmoji}</span>
                <p>Pensé en <strong>{attemptedName}</strong> pero me equivoqué.</p>
              </div>
            </>
          ) : (
            <p>No pude adivinar.</p>
          )}
          <p>¡Ayudame a aprender para la próxima!</p>
          <p className="hint">{game.history.length} preguntas usadas</p>
        </div>
        <button className="btn-primary" onClick={() => props.setGameState('learn_name')}>
          📚 Enseñar personaje
        </button>
        <button className="btn-secondary" onClick={game.handleRestart}>
          Intentar de nuevo
        </button>
      </div>
    )
  }

  if (game.gameState === 'learn_name' || game.gameState === 'learn_questions') {
    return (
      <LearnMode
        history={game.history}
        onComplete={game.handleRestart}
        onCancel={game.handleRestart}
        defeatedByName={game.guessedCharacter?.name || game.topCandidate?.name}
        gameCategory={game.selectedCategory}
      />
    )
  }

  if (game.gameState === 'guess') {
    const guessName = game.guessedCharacter?.name || game.topCandidate?.name || ''
    const guessCharFull = game.guessedCharacter
      ? game.filteredCharacters.find(c => c.name === game.guessedCharacter!.name)
      : game.topCandidate
        ? game.filteredCharacters.find(c => c.id === game.topCandidate!.id)
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
          <p className="hint">{game.guessedCharacter?.description || game.topCandidate?.description}</p>
          <div className="confidence-bar-container">
            <div
              className="confidence-bar"
              style={{ width: `${game.topScore}%`, backgroundColor: game.topScore >= 70 ? '#4ade80' : '#fbbf24' }}
            />
            <span className="confidence-label">{game.topScore}% certeza</span>
          </div>
          <p className="candidates-left">
            {game.rankedCandidates.length} candidato{game.rankedCandidates.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="answer-buttons">
          <button className="btn-answer btn-yes" onClick={() => game.handleGuess(true)}>
            ¡Sí!
          </button>
          <button className="btn-answer btn-no" onClick={() => game.handleGuess(false)}>
            No
          </button>
        </div>
        <button className="btn-exit" onClick={game.handleRestart}>
          ← Volver al inicio
        </button>
      </div>
    )
  }

  // Playing state
  const confidenceColor = game.topScore >= 70 ? '#4ade80' : game.topScore >= 40 ? '#fbbf24' : '#e94560'

  return (
    <div className="game-container">
      <div className="progress">
        <div className="progress-info">
          Pregunta {game.history.length + 1}
          <span className="candidates"> | {game.rankedCandidates.length} candidatos</span>
        </div>
        <div className="confidence-bar-container">
          <div
            className="confidence-bar"
            style={{ width: `${game.topScore}%`, backgroundColor: confidenceColor }}
          />
          <span className="confidence-label">{game.topScore}% certeza</span>
        </div>
      </div>

      {game.isThinkingDelay && (
        <div className="question-box thinking-overlay">
          <div className="thinking-spinner">
            <span className="thinking-dot" />
            <span className="thinking-dot" />
            <span className="thinking-dot" />
          </div>
          <p className="thinking-text">
            {game.pendingAnswer === 'yes' && 'Mmm... interesante...'}
            {game.pendingAnswer === 'no' && 'Descartando opciones...'}
            {game.pendingAnswer === 'probably' && 'Probablemente...'}
            {game.pendingAnswer === 'probably_not' && 'Puede que no...'}
            {game.pendingAnswer === 'dont_know' && 'No importa, sigo...'}
          </p>
        </div>
      )}

      {!game.isThinkingDelay && (
        <>
          <div className="question-box" key={game.currentQuestion?.id}>
            <p>{game.currentQuestion?.text}</p>
          </div>
          <div className="answer-buttons">
            <div className="answer-row">
              <button className="btn-answer btn-yes" onClick={() => game.handleAnswer('yes')}>
                <span className="answer-full">Sí</span>
              </button>
              <button className="btn-answer btn-no" onClick={() => game.handleAnswer('no')}>
                <span className="answer-full">No</span>
              </button>
            </div>
            <div className="answer-row">
              <button className="btn-answer btn-probably" onClick={() => game.handleAnswer('probably')}>
                <span className="answer-full">Probablemente</span>
                <span className="answer-short">Prob. sí</span>
              </button>
              <button className="btn-answer btn-probably-not" onClick={() => game.handleAnswer('probably_not')}>
                <span className="answer-full">Probablemente no</span>
                <span className="answer-short">Prob. no</span>
              </button>
            </div>
            <button className="btn-answer btn-dont-know" onClick={() => game.handleAnswer('dont_know')}>
              No sé
            </button>
          </div>
        </>
      )}

      <button className="btn-exit" onClick={game.handleRestart} disabled={game.isThinkingDelay}>
        ← Volver al inicio
      </button>
    </div>
  )
}
