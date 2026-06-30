import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useMemo } from 'react'
import { getAllCharacters } from '../../data/characters'
import { getDailyCharacterIndex, loadDailyCharacter, saveDailyCharacter, resetDailyCharacter } from '../../data/stats'
import type { DailyCharacter } from '../../data/stats'
import dailyBg from '../../assets/derifondo2.png'
import './DailyCharacter.css'

export default function DailyCharacter() {
  const navigate = useNavigate()
  const [dailyState, setDailyState] = useState<DailyCharacter | null>(null)
  const [timeLeft, setTimeLeft] = useState('')

  const allCharacters = useMemo(() => getAllCharacters(), [])
  const dailyIndex = useMemo(() => getDailyCharacterIndex(allCharacters.length), [allCharacters.length])
  const todaysCharacter = allCharacters[dailyIndex]

  useEffect(() => {
    const saved = loadDailyCharacter()
    if (saved && saved.characterName === todaysCharacter?.name) {
      setDailyState(saved)
    } else {
      // New day or first time
      const fresh: DailyCharacter = {
        characterName: todaysCharacter?.name || '',
        date: new Date().toISOString().split('T')[0],
        guessed: false,
        guesses: 0,
      }
      saveDailyCharacter(fresh)
      setDailyState(fresh)
    }
  }, [todaysCharacter])

  // Countdown timer
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date()
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      const diff = tomorrow.getTime() - now.getTime()

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [])

  const handlePlay = () => {
    navigate('/jugar')
  }

  const handleReset = () => {
    resetDailyCharacter()
    const fresh: DailyCharacter = {
      characterName: todaysCharacter?.name || '',
      date: new Date().toISOString().split('T')[0],
      guessed: false,
      guesses: 0,
    }
    saveDailyCharacter(fresh)
    setDailyState(fresh)
  }

  return (
    <div className="daily-page">
      <div className="daily-background" style={{ backgroundImage: `url(${dailyBg})` }} />

      <div className="daily-content">
        <header className="daily-header">
          <button className="daily-back" onClick={() => navigate('/')}>
            ← Volver
          </button>
          <h1 className="daily-title">Personaje del Día</h1>
          <p className="daily-subtitle">
            Cada día un personaje secreto. ¿Podrá el Derinator adivinarlo?
          </p>
        </header>

        <div className="daily-card">
          {dailyState?.guessed ? (
            <div className="daily-result daily-won">
              <h2 className="daily-result-title">Completado</h2>
              <p className="daily-result-text">
                El personaje era <strong>{todaysCharacter?.name}</strong>
              </p>
              <p className="daily-result-hint">{todaysCharacter?.description}</p>
              <p className="daily-result-stats">
                {dailyState.guesses} intento{dailyState.guesses !== 1 ? 's' : ''}
              </p>
            </div>
          ) : (
            <div className="daily-result daily-pending">
              <h2 className="daily-result-title">Pendiente</h2>
              <p className="daily-result-text">
                Pensá en el personaje del día y desafiá al Derinator.
              </p>
              {dailyState && dailyState.guesses > 0 && (
                <p className="daily-result-stats">
                  {dailyState.guesses} intento{dailyState.guesses !== 1 ? 's' : ''} hoy
                </p>
              )}
            </div>
          )}

          <div className="daily-timer">
            <span className="daily-timer-label">Próximo personaje en:</span>
            <span className="daily-timer-value">{timeLeft}</span>
          </div>

          <div className="daily-actions">
            <button className="btn-primary" onClick={handlePlay}>
              {dailyState?.guessed ? 'Jugar otra vez' : 'Jugar'}
            </button>
            {dailyState?.guessed && (
              <button className="btn-secondary" onClick={handleReset}>
                Reiniciar (debug)
              </button>
            )}
          </div>
        </div>

        <div className="daily-instructions">
          <h3 className="daily-instructions-title">¿Cómo funciona?</h3>
          <ol className="daily-instructions-list">
            <li>Todos los días hay un personaje secreto elegido automáticamente</li>
            <li>Jugá normalmente y pensá en el personaje del día</li>
            <li>Si el Derinator lo adivina, ¡ganaste el desafío diario!</li>
            <li>Cada día a la medianoche se reinicia con un nuevo personaje</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
