import { Answer, CharacterSubcategory } from '../../types'
import { QuestionId } from '../../data/questions'
import { getCategoryEmoji } from '../../data/categoryEmojis'
import Avatar from '../ui/Avatar'
import { useLearnMode } from './useLearnMode'
import type { LearnModePhase } from './useLearnMode'
import './LearnMode.css'

export type { LearnModePhase }

interface LearnModeProps {
  history: { questionId: QuestionId; answer: Answer }[]
  onComplete: () => void
  onCancel: () => void
  defeatedByName?: string
  gameCategory?: 'all' | 'personajes' | 'animales' | 'famosos'
}

export default function LearnMode(props: LearnModeProps) {
  const lm = useLearnMode(props)

  if (lm.phase === 'name') {
    return (
      <div className="learn-mode-overlay">
        <div className="learn-mode-container">
          <div className="learn-header">
            <Avatar name="Derinator" size="sm" className="learn-avatar" />
            <h2>
              {lm.defeatedByName
                ? `¡Ups! No conocía a "${lm.defeatedByName}"`
                : '¡Ayudame a aprender!'}
            </h2>
            <p className="learn-subtitle">
              {lm.defeatedByName
                ? 'Contame quién es para que no me vuelva a pasar.'
                : 'Contame sobre un personaje para agregarlo a mi base de conocimiento.'}
            </p>
          </div>

          <div className="learn-form">
            <div className="learn-field">
              <label>Nombre del personaje *</label>
              <input
                type="text"
                value={lm.learnName}
                onChange={(e) => lm.setLearnName(e.target.value)}
                placeholder="Ej: Lionel Messi"
                className="learn-input"
                maxLength={100}
              />
            </div>

            <div className="learn-field">
              <label>Descripción (opcional)</label>
              <input
                type="text"
                value={lm.learnDescription}
                onChange={(e) => lm.setLearnDescription(e.target.value)}
                placeholder="Ej: Futbolista argentino, la Pulga"
                className="learn-input"
                maxLength={200}
              />
            </div>

            <div className="learn-field">
              <label>Categoría</label>
              <div className="category-buttons">
                {(['personaje', 'animal'] as const).map((cat) => (
                  <button
                    key={cat}
                    className={`category-btn ${lm.learnCategory === cat ? 'active' : ''}`}
                    onClick={() => {
                      lm.setLearnCategory(cat)
                      lm.setLearnSubcategory(undefined)
                    }}
                  >
                    {getCategoryEmoji(cat)} {cat === 'personaje' ? 'Personaje' : 'Animal'}
                  </button>
                ))}
              </div>
            </div>

            {lm.learnCategory === 'personaje' && (
              <div className="learn-field">
                <label>Subcategoría (opcional)</label>
                <select
                  className="learn-select"
                  value={lm.learnSubcategory || ''}
                  onChange={(e) => lm.setLearnSubcategory(e.target.value as CharacterSubcategory || undefined)}
                >
                  <option value="">Sin subcategoría</option>
                  <option value="anime-shonen">Anime Shonen</option>
                  <option value="videojuego">Videojuego</option>
                  <option value="superheroe">Superhéroe</option>
                  <option value="disney">Disney</option>
                  <option value="nintendo">Nintendo</option>
                  <option value="historico-real">Histórico / Real</option>
                  <option value="deportista">Deportista</option>
                  <option value="youtuber-streamer">YouTuber / Streamer</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
            )}

            <div className="learn-actions">
              <button className="btn-cancel" onClick={lm.onCancel}>
                Cancelar
              </button>
              <button
                className="btn-primary"
                onClick={lm.handleLearnNameSubmit}
                disabled={!lm.learnName.trim()}
              >
                Comenzar
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (lm.phase === 'questions') {
    const isAnswered = lm.currentQuestion ? lm.learnAnswers[lm.currentQuestion.id] !== undefined : false

    return (
      <div className="learn-mode-overlay">
        <div className="learn-mode-container">
          <div className="learn-header">
            <Avatar name="Derinator" size="sm" className="learn-avatar" />
            <h2>Enseñando a {lm.learnName}</h2>
            <div className="learn-progress-bar">
              <div
                className="learn-progress-fill"
                style={{ width: `${Math.min(100, lm.questionsAnswered * 4)}%` }}
              />
            </div>
            <p className="learn-progress-text">
              {lm.questionsAnswered} preguntas respondidas
            </p>
          </div>

          {lm.validationError && (
            <div className="learn-validation-error">{lm.validationError}</div>
          )}

          {lm.similarityWarning && (
            <div className="learn-similarity-warning">{lm.similarityWarning}</div>
          )}

          {lm.currentQuestion ? (
            <div className="learn-question-section">
              <div className="learn-question">
                <h3>{lm.currentQuestion.text}</h3>
              </div>

              <div className="learn-answers">
                <button
                  className={`learn-answer-btn yes ${isAnswered && lm.learnAnswers[lm.currentQuestion.id] === 'yes' ? 'selected' : ''}`}
                  onClick={() => lm.handleLearnAnswer('yes')}
                >
                  Sí
                </button>
                <button
                  className={`learn-answer-btn no ${isAnswered && lm.learnAnswers[lm.currentQuestion.id] === 'no' ? 'selected' : ''}`}
                  onClick={() => lm.handleLearnAnswer('no')}
                >
                  No
                </button>
                <button
                  className={`learn-answer-btn probably ${isAnswered && lm.learnAnswers[lm.currentQuestion.id] === 'probably' ? 'selected' : ''}`}
                  onClick={() => lm.handleLearnAnswer('probably')}
                >
                  <span className="answer-full">Probablemente</span>
                  <span className="answer-short">Prob. sí</span>
                </button>
                <button
                  className={`learn-answer-btn probably-not ${isAnswered && lm.learnAnswers[lm.currentQuestion.id] === 'probably_not' ? 'selected' : ''}`}
                  onClick={() => lm.handleLearnAnswer('probably_not')}
                >
                  <span className="answer-full">Probablemente no</span>
                  <span className="answer-short">Prob. no</span>
                </button>
                <button
                  className={`learn-answer-btn dont-know ${isAnswered && lm.learnAnswers[lm.currentQuestion.id] === 'dont_know' ? 'selected' : ''}`}
                  onClick={() => lm.handleLearnAnswer('dont_know')}
                >
                  No sé
                </button>
              </div>
            </div>
          ) : (
            <div className="learn-question-section">
              <h3>¡No hay más preguntas relevantes!</h3>
              <p>Ya respondiste todas las preguntas necesarias para esta categoría.</p>
            </div>
          )}

          <div className="learn-actions">
            <button className="btn-back" onClick={lm.handleLearnBack} disabled={lm.navStack.length === 0}>
              ← Atrás
            </button>
            <button className="btn-cancel" onClick={lm.onCancel}>
              Cancelar
            </button>
            <button className="btn-finish" onClick={lm.handleFinishLearn}>
              Terminar y guardar
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (lm.phase === 'done') {
    return (
      <div className="learn-mode-overlay">
        <div className="learn-mode-container">
          <div className="learn-header success">
            <Avatar name="Derinator" size="sm" className="learn-avatar" />
            <h2>¡Aprendí a {lm.learnName}!</h2>
            <p>Gracias por enseñarme. Ahora voy a practicar para ver si lo aprendí bien.</p>
          </div>

          <div className="learn-actions">
            <button className="btn-primary" onClick={lm.runPractice}>
              Probar si aprendí
            </button>
            <button className="btn-secondary" onClick={lm.onComplete}>
              Terminar
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (lm.phase === 'practice' || lm.phase === 'practice_result') {
    const guessedCorrectly = lm.practiceGuess === lm.learnName.trim()

    return (
      <div className="learn-mode-overlay">
        <div className="learn-mode-container">
          <div className="learn-header">
            <Avatar name="Derinator" size="sm" className="learn-avatar" />
            <h2>Practicando...</h2>
          </div>

          {lm.phase === 'practice' && (
            <div className="practice-loading">
              <p>Estoy simulando una partida para ver si adivino a {lm.learnName}...</p>
              <div className="practice-spinner" />
            </div>
          )}

          {lm.phase === 'practice_result' && (
            <>
              <div className={`practice-result ${guessedCorrectly ? 'success' : 'fail'}`}>
                {guessedCorrectly ? (
                  <>
                    <h3>¡Lo adiviné! 🎯</h3>
                    <p>Identifiqué a <strong>{lm.learnName}</strong> en {lm.practiceStep} preguntas.</p>
                  </>
                ) : (
                  <>
                    <h3>¡No lo adiviné! 😅</h3>
                    <p>Pensé que era <strong>{lm.practiceGuess || 'nadie'}</strong> en lugar de <strong>{lm.learnName}</strong>.</p>
                    <p>Tal vez necesitás responder más preguntas específicas.</p>
                  </>
                )}
              </div>

              {lm.practiceLog.length > 0 && (
                <div className="practice-log">
                  <h4>Simulación:</h4>
                  <div className="practice-steps">
                    {lm.practiceLog.map((step, i) => (
                      <div key={i} className="practice-step">
                        <span className="step-q">{step.question}</span>
                        <span className={`step-a ${step.answer}`}>{step.answer}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="learn-actions">
                <button className="btn-secondary" onClick={lm.handlePracticeBack}>
                  Volver
                </button>
                <button className="btn-primary" onClick={lm.onComplete}>
                  Terminar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  return null
}
