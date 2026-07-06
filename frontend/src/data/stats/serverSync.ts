/**
 * Server synchronization — the only module in data/stats allowed to import from data/api.
 * Kept separate so persistence.ts (localStorage only) stays network-free.
 */
import { syncStats, fetchStats } from '../api/api'
import { getFingerprint, getPlayerToken, savePlayerToken } from './persistence'
import { loadStats, saveStats } from './gameStats'
import { loadAchievements, saveAchievements } from './achievements'
import { loadDailyCharacter, saveDailyCharacter } from './daily'
import type { GameStats, HallOfFameEntry } from './types'
import { HALL_OF_FAME_KEY } from './types'

/** Attempt to sync current local stats to the server (fire-and-forget) */
export async function syncToServer(): Promise<void> {
  try {
    const stats = loadStats()
    const achievements = loadAchievements()
    const hallRaw = localStorage.getItem(HALL_OF_FAME_KEY)
    const hall: HallOfFameEntry[] = hallRaw ? JSON.parse(hallRaw) : []
    const daily = loadDailyCharacter()

    const response = await syncStats({
      fingerprint: getFingerprint(),
      derinatorWins: stats.derinatorWins,
      userWins: stats.userWins,
      currentStreak: stats.currentStreak,
      bestStreak: stats.bestStreak,
      totalGames: stats.totalGames,
      achievements,
      hallOfFame: hall,
      dailyGuessed: daily?.guessed ?? false,
      dailyGuesses: daily?.guesses ?? 0,
    }, getPlayerToken() ?? undefined)

    // Server returns player_token on first registration
    if (response.player_token) {
      savePlayerToken(response.player_token)
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
    await ensureRegistered()

    const response = await fetchStats(getFingerprint())
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

    if (data.achievements && data.achievements.length > 0) {
      saveAchievements(data.achievements)
    }

    if (data.hall_of_fame && data.hall_of_fame.length > 0) {
      localStorage.setItem(HALL_OF_FAME_KEY, JSON.stringify(data.hall_of_fame))
    }

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
