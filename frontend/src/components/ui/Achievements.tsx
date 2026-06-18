import { useNavigate } from 'react-router-dom'
import { loadAchievements } from '../../data/stats'
import type { Achievement } from '../../data/stats'
import './Achievements.css'

export default function AchievementsPage() {
  const navigate = useNavigate()
  const achievements = loadAchievements()
  const unlocked = achievements.filter((a) => a.unlocked)
  const locked = achievements.filter((a) => !a.unlocked)

  const formatDate = (iso?: string) => {
    if (!iso) return ''
    const d = new Date(iso)
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  }

  const renderAchievement = (ach: Achievement, isUnlocked: boolean) => (
    <div
      key={ach.id}
      className={`ach-card ${isUnlocked ? 'ach-unlocked' : 'ach-locked'}`}
    >
      <div className="ach-icon">{ach.icon}</div>
      <div className="ach-info">
        <h3 className="ach-title">{ach.title}</h3>
        <p className="ach-desc">{ach.description}</p>
        {!isUnlocked && (
          <div className="ach-progress-bar">
            <div
              className="ach-progress-fill"
              style={{ width: `${(ach.progress / ach.maxProgress) * 100}%` }}
            />
            <span className="ach-progress-text">
              {ach.progress}/{ach.maxProgress}
            </span>
          </div>
        )}
        {isUnlocked && ach.unlockedAt && (
          <span className="ach-date">Desbloqueado el {formatDate(ach.unlockedAt)}</span>
        )}
      </div>
      {isUnlocked && <div className="ach-badge">✓</div>}
    </div>
  )

  return (
    <div className="ach-page">
      <div className="ach-background" />

      <div className="ach-content">
        <header className="ach-header">
          <button className="ach-back" onClick={() => navigate('/')}>
            ← Volver
          </button>
          <h1 className="ach-title">🏅 Logros</h1>
          <p className="ach-subtitle">
            {unlocked.length} de {achievements.length} desbloqueados
          </p>

          {/* Progress summary */}
          <div className="ach-summary">
            <div className="ach-summary-bar">
              <div
                className="ach-summary-fill"
                style={{ width: `${(unlocked.length / achievements.length) * 100}%` }}
              />
            </div>
            <span className="ach-summary-percent">
              {Math.round((unlocked.length / achievements.length) * 100)}%
            </span>
          </div>
        </header>

        {/* Unlocked section */}
        {unlocked.length > 0 && (
          <section className="ach-section">
            <h2 className="ach-section-title">
              <span className="ach-section-icon">✨</span>
              Desbloqueados
            </h2>
            <div className="ach-grid">
              {unlocked.map((ach) => renderAchievement(ach, true))}
            </div>
          </section>
        )}

        {/* Locked section */}
        <section className="ach-section">
          <h2 className="ach-section-title">
            <span className="ach-section-icon">🔒</span>
            Por desbloquear
          </h2>
          <div className="ach-grid">
            {locked.map((ach) => renderAchievement(ach, false))}
          </div>
        </section>
      </div>
    </div>
  )
}
