import { Achievement, ACHIEVEMENTS_KEY } from './types'
import { loadStats } from './gameStats'

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_win',
    title: 'Primera victoria',
    description: 'Derrotá al Derinator por primera vez',
    icon: '🏆',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
  },
  {
    id: 'streak_3',
    title: 'Racha de 3',
    description: 'Ganá 3 veces seguidas al Derinator',
    icon: '🔥',
    unlocked: false,
    progress: 0,
    maxProgress: 3,
  },
  {
    id: 'streak_5',
    title: 'Imparable',
    description: 'Ganá 5 veces seguidas al Derinator',
    icon: '⚡',
    unlocked: false,
    progress: 0,
    maxProgress: 5,
  },
  {
    id: 'perfect_guess',
    title: 'Adivino perfecto',
    description: 'El Derinator acertó en 5 preguntas o menos',
    icon: '🎯',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
  },
  {
    id: 'animal_master',
    title: 'Maestro de animales',
    description: 'Ganá 10 veces en la categoría animales',
    icon: '🦁',
    unlocked: false,
    progress: 0,
    maxProgress: 10,
  },
  {
    id: 'character_master',
    title: 'Maestro de personajes',
    description: 'Ganá 10 veces en la categoría personajes',
    icon: '🎭',
    unlocked: false,
    progress: 0,
    maxProgress: 10,
  },
  {
    id: 'teacher',
    title: 'Maestro',
    description: 'Enseñá 5 personajes nuevos al Derinator',
    icon: '📚',
    unlocked: false,
    progress: 0,
    maxProgress: 5,
  },
  {
    id: 'veteran',
    title: 'Veterano',
    description: 'Jugá 50 partidas en total',
    icon: '👑',
    unlocked: false,
    progress: 0,
    maxProgress: 50,
  },
  {
    id: 'daily_winner',
    title: 'Acertijo del día',
    description: 'Adiviná el personaje del día',
    icon: '🌟',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
  },
]

export function loadAchievements(): Achievement[] {
  try {
    const stored = localStorage.getItem(ACHIEVEMENTS_KEY)
    if (!stored) return DEFAULT_ACHIEVEMENTS.map((a) => ({ ...a }))
    const parsed = JSON.parse(stored) as Achievement[]
    // Merge with defaults in case new achievements were added
    const merged = DEFAULT_ACHIEVEMENTS.map((def) => {
      const existing = parsed.find((a) => a.id === def.id)
      return existing || { ...def }
    })
    return merged
  } catch {
    return DEFAULT_ACHIEVEMENTS.map((a) => ({ ...a }))
  }
}

export function saveAchievements(achievements: Achievement[]): void {
  localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements))
}

export function unlockAchievement(id: string): boolean {
  const achievements = loadAchievements()
  const ach = achievements.find((a) => a.id === id)
  if (ach && !ach.unlocked) {
    ach.unlocked = true
    ach.unlockedAt = new Date().toISOString()
    saveAchievements(achievements)
    return true
  }
  return false
}

export function incrementAchievement(id: string, amount = 1): boolean {
  const achievements = loadAchievements()
  const ach = achievements.find((a) => a.id === id)
  if (ach && !ach.unlocked) {
    ach.progress = Math.min(ach.progress + amount, ach.maxProgress)
    if (ach.progress >= ach.maxProgress) {
      ach.unlocked = true
      ach.unlockedAt = new Date().toISOString()
      saveAchievements(achievements)
      return true
    }
    saveAchievements(achievements)
  }
  return false
}

export function getUnlockedAchievements(): Achievement[] {
  return loadAchievements().filter((a) => a.unlocked)
}

export function getLockedAchievements(): Achievement[] {
  return loadAchievements().filter((a) => !a.unlocked)
}

export function recordPerfectGuess(): void {
  unlockAchievement('perfect_guess')
}

export function recordCategoryWin(category: string): void {
  if (category === 'animales') {
    incrementAchievement('animal_master')
  } else if (category === 'personajes') {
    incrementAchievement('character_master')
  }
}

export function recordDailyWin(): void {
  unlockAchievement('daily_winner')
}

export function checkAchievements(): void {
  const stats = loadStats()
  const learned = (() => {
    try {
      const stored = localStorage.getItem('derinator_learned_characters')
      return stored ? JSON.parse(stored).length : 0
    } catch {
      return 0
    }
  })()

  // first_win
  if (stats.userWins >= 1) unlockAchievement('first_win')

  // streak_3, streak_5
  if (stats.bestStreak >= 3) unlockAchievement('streak_3')
  if (stats.bestStreak >= 5) unlockAchievement('streak_5')

  // veteran
  if (stats.totalGames >= 50) unlockAchievement('veteran')

  // teacher
  if (learned >= 5) unlockAchievement('teacher')
}
