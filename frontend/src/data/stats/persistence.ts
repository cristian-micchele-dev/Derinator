import {
  SavedGameState, GameStats, Achievement, HallOfFameEntry,
  GAME_STATE_KEY, ONBOARDING_KEY,
} from './types'
import { loadStats, saveStats } from './gameStats'
import { loadAchievements, saveAchievements } from './achievements'
import { getHallOfFame } from './hallOfFame'
import { loadDailyCharacter, saveDailyCharacter } from './daily'

const FINGERPRINT_KEY = 'derinator_fingerprint'

export function getFingerprint(): string {
  let fp = localStorage.getItem(FINGERPRINT_KEY)
  if (!fp) {
    fp = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    localStorage.setItem(FINGERPRINT_KEY, fp)
  }
  return fp
}

// ============== GAME PERSISTENCE ==============

export function saveGameState(state: SavedGameState): void {
  localStorage.setItem(GAME_STATE_KEY, JSON.stringify(state))
}

export function loadGameState(): SavedGameState | null {
  try {
    const stored = localStorage.getItem(GAME_STATE_KEY)
    if (!stored) return null
    const parsed = JSON.parse(stored) as SavedGameState
    // Only restore if less than 24 hours old
    if (Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000) {
      clearGameState()
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function clearGameState(): void {
  localStorage.removeItem(GAME_STATE_KEY)
}

// ============== ONBOARDING ==============

export function hasSeenOnboarding(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === 'true'
  } catch {
    return false
  }
}

export function markOnboardingSeen(): void {
  localStorage.setItem(ONBOARDING_KEY, 'true')
}

// ============== SERVER SYNC ==============

/** Attempt to sync current local stats to the server (fire-and-forget) */
export async function syncToServer(): Promise<void> {
  try {
    // Dynamic import to avoid circular dependency issues
    const { syncStats } = await import('../api/api')
    const stats = loadStats()
    const achievements = loadAchievements()
    const hall = getHallOfFame()
    const daily = loadDailyCharacter()

    await syncStats({
      fingerprint: getFingerprint(),
      derinatorWins: stats.derinatorWins,
      userWins: stats.userWins,
      currentStreak: stats.currentStreak,
      bestStreak: stats.bestStreak,
      totalGames: stats.totalGames,
      achievements: achievements as unknown[],
      hallOfFame: hall as unknown[],
      dailyGuessed: daily?.guessed ?? false,
      dailyGuesses: daily?.guesses ?? 0,
    })
  } catch {
    // Silently fail — localStorage is the source of truth when offline
  }
}

/** Attempt to load stats from the server and merge with local */
export async function loadFromServer(): Promise<boolean> {
  try {
    const { fetchStats } = await import('../api/api')
    const response = await fetchStats(getFingerprint()) as { success: boolean; data: {
      derinator_wins: number; user_wins: number; current_streak: number;
      best_streak: number; total_games: number;
      achievements: Achievement[]; hall_of_fame: HallOfFameEntry[];
      daily_guessed: boolean; daily_guesses: number;
    }}

    if (!response.success) return false

    const data = response.data

    // Merge: server wins if higher
    const localStats = loadStats()
    const mergedStats: GameStats = {
      derinatorWins: Math.max(localStats.derinatorWins, data.derinator_wins),
      userWins: Math.max(localStats.userWins, data.user_wins),
      currentStreak: Math.max(localStats.currentStreak, data.current_streak),
      bestStreak: Math.max(localStats.bestStreak, data.best_streak),
      totalGames: Math.max(localStats.totalGames, data.total_games),
      mostDefeatedCharacter: localStats.mostDefeatedCharacter,
      mostDefeatedCount: localStats.mostDefeatedCount,
      characterGuessCounts: localStats.characterGuessCounts || {},
    }
    saveStats(mergedStats)

    // Merge achievements
    if (data.achievements && data.achievements.length > 0) {
      saveAchievements(data.achievements)
    }

    // Merge hall of fame
    if (data.hall_of_fame && data.hall_of_fame.length > 0) {
      localStorage.setItem('derinator_hall_of_fame', JSON.stringify(data.hall_of_fame))
    }

    // Merge daily character
    if (data.daily_guessed) {
      const today = new Date().toISOString().split('T')[0]
      const dailyChar = loadDailyCharacter()
      if (!dailyChar || dailyChar.date !== today) {
        saveDailyCharacter({
          characterName: '',
          date: today,
          guessed: data.daily_guessed,
          guesses: data.daily_guesses,
        })
      }
    }

    return true
  } catch {
    return false
  }
}
