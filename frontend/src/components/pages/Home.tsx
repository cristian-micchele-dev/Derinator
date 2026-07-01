import { useNavigate } from 'react-router-dom'
import { loadStats } from '../../data/stats'
import fondo from '../../assets/derifondo1.png'
import deriPensando from '../../assets/DeriPensando2.png'
import './Home.css'

export default function Home() {
  const navigate = useNavigate()
  const stats = loadStats()
  const hasPlayed = stats.totalGames > 0

  return (
    <div className="home">
      <div className="home-background" style={{ backgroundImage: `url(${fondo})` }} />

      <main className="home-content">
        <div className="home-hero">
          <h1 className="home-title">Derinator</h1>

          <div className="home-image-wrap">
            <img
              src={deriPensando}
              alt="Derinator"
              className="home-image"
            />
            <div className="home-bubble">
              <span className="home-bubble-text">¿Listo para jugar?</span>
            </div>
          </div>

          <div className="home-text">
            <p className="home-subtitle">
              El genio que lee tu mente
            </p>
            <p className="home-desc">
              Pensá en cualquier personaje, animal o figura real o ficticia. Yo haré las preguntas y adivinaré en quién pensaste.
            </p>

            {hasPlayed && (
              <div className="home-stats">
                <div className="home-stat">
                  <span className="home-stat-value">{stats.totalGames}</span>
                  <span className="home-stat-label">{stats.totalGames === 1 ? 'partida' : 'partidas'}</span>
                </div>
                <div className="home-stat-divider" />
                <div className="home-stat">
                  <span className="home-stat-value">{stats.derinatorWins}</span>
                  <span className="home-stat-label">{stats.derinatorWins === 1 ? 'victoria' : 'victorias'}</span>
                </div>
                <div className="home-stat-divider" />
                <div className="home-stat">
                  <span className="home-stat-value">{stats.bestStreak}</span>
                  <span className="home-stat-label">mejor racha</span>
                </div>
              </div>
            )}

            <div className="home-actions">
              <button className="home-btn-play" onClick={() => navigate('/jugar')}>
                ▶ Jugar
              </button>
            </div>
          </div>
        </div>
      </main>


    </div>
  )
}
