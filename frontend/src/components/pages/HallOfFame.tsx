import { useNavigate } from 'react-router-dom'
import { getHallOfFame, getTopGuessedCharacters } from '../../data/stats'
import type { HallOfFameEntry } from '../../data/stats'
import './HallOfFame.css'

export default function HallOfFame() {
  const navigate = useNavigate()
  const hall = getHallOfFame()
  const topGuessed = getTopGuessedCharacters(10)

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="hall-page">
      <div className="hall-background" />

      <div className="hall-content">
        <header className="hall-header">
          <button className="hall-back" onClick={() => navigate('/')}>
            ← Volver
          </button>
          <h1 className="hall-title">Muro de la Fama</h1>
          <p className="hall-subtitle">Los personajes que derrotaron al Derinator</p>
        </header>

        {/* Most guessed characters */}
        {topGuessed.length > 0 && (
          <section className="hall-section">
            <h2 className="hall-section-title">
              Más Adivinados
            </h2>
            <p className="hall-section-subtitle">Los personajes que el Derinator adivinó más veces</p>
            <div className="hall-grid hall-grid--top">
              {topGuessed.map((entry, index) => (
                <div key={entry.name} className="hall-card hall-card--top" style={{ animationDelay: `${index * 0.06}s` }}>
                  <span className="hall-rank">{index + 1}</span>
                  <div className="hall-info">
                    <h3 className="hall-name">{entry.name}</h3>
                    <div className="hall-meta">
                      <span className="hall-questions">{entry.count} ve{entry.count === 1 ? 'z' : 'ces'} adivinado</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Divider */}
        {topGuessed.length > 0 && hall.length > 0 && <hr className="hall-divider" />}

        {/* User defeats — existing hall of fame */}
        <section className="hall-section">
          <h2 className="hall-section-title">
            Derrotas del Derinator
          </h2>
          <p className="hall-section-subtitle">Los personajes con los que lo vencieron</p>

          {hall.length === 0 ? (
            <div className="hall-empty">
              <p className="hall-empty-text">Nadie ha derrotado al Derinator todavía...</p>
              <p className="hall-empty-hint">Sé el primero en vencerlo</p>
              <button className="btn-primary" onClick={() => navigate('/jugar')}>
                Jugar ahora
              </button>
            </div>
          ) : (
            <div className="hall-grid">
              {hall.map((entry: HallOfFameEntry, index: number) => (
                <div key={`${entry.name}-${index}`} className="hall-card" style={{ animationDelay: `${index * 0.08}s` }}>
                  <span className="hall-rank">{index + 1}</span>
                  <div className="hall-info">
                    <h3 className="hall-name">{entry.name}</h3>
                    {entry.description && (
                      <p className="hall-desc">{entry.description}</p>
                    )}
                    <div className="hall-meta">
                      <span className="hall-questions">{entry.questionsCount} preguntas</span>
                      <span className="hall-date">{formatDate(entry.date)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
