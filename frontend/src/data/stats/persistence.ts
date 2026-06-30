import {
  SavedGameState, GameStats, Achievement,
  GAME_STATE_KEY, ONBOARDING_KEY, HALL_OF_FAME_KEY,
} from './types'
import { loadStats, saveStats } from './gameStats'
import { loadAchievements, saveAchievements } from './achievements'
import { loadDailyCharacter, saveDailyCharacter } from './daily'

const FINGERPRINT_KEY = 'derinator_fingerprint'
const PLAYER_TOKEN_KEY = 'derinator_player_token'

export function getFingerprint(): string {
  let fp = localStorage.getItem(FINGERPRINT_KEY)
  if (!fp) {
    const bytes = crypto.getRandomValues(new Uint8Array(16))
    fp = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
    localStorage.setItem(FINGERPRINT_KEY, fp)
  }
  return fp
}

export function getPlayerToken(): string | null {
  return localStorage.getItem(PLAYER_TOKEN_KEY)
}

export function savePlayerToken(token: string): void {
  localStorage.setItem(PLAYER_TOKEN_KEY, token)
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
    const { syncStats } = await import('../api/api')
    const stats = loadStats()
    const achievements = loadAchievements()
    const hallRaw = localStorage.getItem(HALL_OF_FAME_KEY)
    const hall = hallRaw ? JSON.parse(hallRaw) : []
    const daily = loadDailyCharacter()

    const response = await syncStats({
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
    }, getPlayerToken() ?? undefined)

    // Server returns player_token on first registration
    const data = response as { player_token?: string }
    if (data.player_token) {
      savePlayerToken(data.player_token)
    }
  } catch {
    // Silently fail — localStorage is the source of truth when offline
  }
}

/**
 * Ensure the player is registered on the server and has a local token.
 * Called on app startup so the token is always ready before the first game ends.
 */
export async function ensureRegistered(): Promise<void> {
  if (getPlayerToken()) return
  await syncToServer()
}

/** Attempt to load stats from the server and merge with local */
export async function loadFromServer(): Promise<boolean> {
  try {
    // Register the player if this is a new device (acquires player_token)
    await ensureRegistered()

    const { fetchStats } = await import('../api/api')
    const response = await fetchStats(getFingerprint()) as { success: boolean; data: {
      derinator_wins: number; user_wins: number; current_streak: number;
      best_streak: number; total_games: number;
      achievements: Achievement[]; hall_of_fame: unknown[];
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
