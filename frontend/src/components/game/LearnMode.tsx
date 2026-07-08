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
        <div
          className="learn-mode-container"
          role="dialog"
          aria-modal="true"
          aria-labelledby="learn-dialog-title"
        >
          <div className="learn-header">
            <Avatar name="Derinator" size="sm" className="learn-avatar" />
            <h2 id="learn-dialog-title">
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

          <form
            onSubmit={(e) => { e.preventDefault(); lm.handleLearnNameSubmit() }}
          >
            <div className="learn-form">
              <div className="learn-field">
                <label>Nombre del personaje *</label>
                <input
                  type="text"
                  autoFocus
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
                  <button
                    type="button"
                    className={`category-btn ${lm.learnCategory === 'personaje' && lm.learnPersonType === 'ficcion' ? 'active' : ''}`}
                    aria-pressed={lm.learnCategory === 'personaje' && lm.learnPersonType === 'ficcion'}
                    onClick={() => {
                      lm.setLearnCategory('personaje')
                      lm.setLearnPersonType('ficcion')
                      lm.setLearnSubcategory(undefined)
                    }}
                  >
                    🎭 Ficción
                  </button>
                  <button
                    type="button"
                    className={`category-btn ${lm.learnCategory === 'personaje' && lm.learnPersonType === 'famoso' ? 'active' : ''}`}
                    aria-pressed={lm.learnCategory === 'personaje' && lm.learnPersonType === 'famoso'}
                    onClick={() => {
                      lm.setLearnCategory('personaje')
                      lm.setLearnPersonType('famoso')
                      lm.setLearnSubcategory(undefined)
                    }}
                  >
                    🌟 Famoso
                  </button>
                  <button
                    type="button"
                    className={`category-btn ${lm.learnCategory === 'animal' ? 'active' : ''}`}
                    aria-pressed={lm.learnCategory === 'animal'}
                    onClick={() => {
                      lm.setLearnCategory('animal')
                      lm.setLearnPersonType('ficcion')
                      lm.setLearnSubcategory(undefined)
                    }}
                  >
                    {getCategoryEmoji('animal')} Animal
                  </button>
                </div>
              </div>

              {lm.learnCategory === 'personaje' && lm.learnPersonType === 'ficcion' && (
                <div className="learn-field">
                  <label>Subcategoría (opcional)</label>
                  <select
                    className="learn-select"
                    value={lm.learnSubcategory || ''}
                    onChange={(e) => lm.setLearnSubcategory(e.target.value as CharacterSubcategory || undefined)}
                  >
                    <option value="">Sin subcategoría</option>
                    <option value="anime-shonen">Anime Shonen</option>
                    <option value="anime-seinen">Anime Seinen</option>
                    <option value="anime-magical-girl">Anime Magical Girl</option>
                    <option value="videojuego">Videojuego</option>
                    <option value="superheroe">Superhéroe</option>
                    <option value="disney">Disney</option>
                    <option value="nintendo">Nintendo</option>
                  </select>
                </div>
              )}

              {lm.learnCategory === 'personaje' && lm.learnPersonType === 'famoso' && (
                <div className="learn-field">
                  <label>Subcategoría (opcional)</label>
                  <select
                    className="learn-select"
                    value={lm.learnSubcategory || ''}
                    onChange={(e) => lm.setLearnSubcategory(e.target.value as CharacterSubcategory || undefined)}
                  >
                    <option value="">Sin subcategoría</option>
                    <option value="historico-real">Histórico / Real</option>
                    <option value="deportista">Deportista</option>
                    <option value="musico">Músico</option>
                    <option value="actor">Actor / Actriz</option>
                    <option value="youtuber-streamer">YouTuber / Streamer</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              )}
            </div>

            <div className="learn-actions">
              <button type="button" className="btn-cancel" onClick={lm.onCancel}>
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={!lm.learnName.trim()}
              >
                Comenzar
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  if (lm.phase === 'questions') {
    const isAnswered = lm.currentQuestion ? lm.learnAnswers[lm.currentQuestion.id] !== undefined : false

    return (
      <div className="learn-mode-overlay">
        <div
          className="learn-mode-container"
          role="dialog"
          aria-modal="true"
          aria-labelledby="learn-dialog-title"
        >
          <div className="learn-header">
            <Avatar name="Derinator" size="sm" className="learn-avatar" />
            <h2 id="learn-dialog-title">Enseñando a {lm.learnName}</h2>
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
              <h3>¡Listo! Ya tengo suficiente info</h3>
              <p>Podés guardar o agregar una pista para diferenciar mejor a tu personaje.</p>
              <button className="btn-primary" onClick={lm.startHint}>
                Agregar pista
              </button>
            </div>
          )}

          <div className="learn-actions">
            <button className="btn-back" onClick={lm.handleLearnBack} disabled={lm.navStack.length === 0}>
              ← Atrás
            </button>
            <button className="btn-cancel" onClick={lm.onCancel}>
              Cancelar
            </button>
            <button
              className="btn-finish"
              onClick={lm.handleFinishLearn}
              disabled={!lm.canFinish || lm.isSaving}
              aria-busy={lm.isSaving}
            >
              {lm.isSaving ? 'Guardando...' : 'Terminar y guardar'}
            </button>
          </div>
          {!lm.canFinish && lm.questionsRemaining > 0 && (
            <p className="learn-min-hint">
              Falt{lm.questionsRemaining === 1 ? 'a' : 'an'} {lm.questionsRemaining} pregunta{lm.questionsRemaining !== 1 ? 's' : ''} más
            </p>
          )}
        </div>
      </div>
    )
  }

  if (lm.phase === 'hint') {
    return (
      <div className="learn-mode-overlay">
        <div
          className="learn-mode-container"
          role="dialog"
          aria-modal="true"
          aria-labelledby="learn-dialog-title"
        >
          <div className="learn-header">
            <Avatar name="Derinator" size="sm" className="learn-avatar" />
            <h2 id="learn-dialog-title">Pista para {lm.learnName}</h2>
            <p className="learn-subtitle">
              Escribí algo que ayude a identificar a este personaje. Por ejemplo: "es el vocalista de Mägo de Oz".
            </p>
          </div>

          {lm.validationError && (
            <div className="learn-validation-error">{lm.validationError}</div>
          )}

          <div className="learn-form">
            <div className="learn-field">
              <label>Pista (opcional)</label>
              <input
                type="text"
                value={lm.learnHint}
                onChange={(e) => lm.setLearnHint(e.target.value)}
                placeholder="Ej: es conocido por..."
                className="learn-input"
                maxLength={200}
              />
            </div>
          </div>

          <div className="learn-actions">
            <button
              className="btn-secondary"
              onClick={lm.handleFinishLearn}
              disabled={lm.isSaving}
              aria-busy={lm.isSaving}
            >
              {lm.isSaving ? 'Guardando...' : 'Guardar sin pista'}
            </button>
            <button
              className="btn-primary"
              onClick={lm.handleFinishLearn}
              disabled={!lm.learnHint.trim() || lm.isSaving}
              aria-busy={lm.isSaving}
            >
              {lm.isSaving ? 'Guardando...' : 'Guardar con pista'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (lm.phase === 'done') {
    return (
      <div className="learn-mode-overlay">
        <div
          className="learn-mode-container"
          role="dialog"
          aria-modal="true"
          aria-labelledby="learn-dialog-title"
        >
          <div className="learn-header success">
            <Avatar name="Derinator" size="sm" className="learn-avatar" />
            <h2 id="learn-dialog-title">¡Aprendí a {lm.learnName}!</h2>
            <p>Gracias por enseñarme. Lo voy a recordar para la próxima.</p>
          </div>

          <div className="learn-actions">
            <button className="btn-primary" onClick={lm.onComplete}>
              Terminar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
