import { useNavigate } from 'react-router-dom'
import fondo2 from '../../assets/fondo2.jfif'
import deriPensando from '../../assets/DeriPensando2.png'
import './Home.css'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="home">
      <div className="home-background" style={{ backgroundImage: `url(${fondo2})` }} />

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
