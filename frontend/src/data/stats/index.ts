/**
 * Stats & persistence barrel export.
 * 
 * Centralizes access to achievements, daily character,
 * game stats, and persistence modules.
 */

// Achievements
export {
  loadAchievements,
  saveAchievements,
  unlockAchievement,
  incrementAchievement,
  getUnlockedAchievements,
  getLockedAchievements,
  recordPerfectGuess,
  recordCategoryWin,
  recordDailyWin,
  checkAchievements,
} from './achievements'

// Daily character
export {
  loadDailyCharacter,
  saveDailyCharacter,
  getDailyCharacterIndex,
  resetDailyCharacter,
} from './daily'

// Game stats
export {
  loadStats,
  saveStats,
  recordDerinatorWin,
  recordUserWin,
  recordDefeatedBy,
  getStatsDisplay,
  getTopGuessedCharacters,
} from './gameStats'

// Persistence (localStorage only)
export {
  getFingerprint,
  getPlayerToken,
  savePlayerToken,
  saveGameState,
  loadGameState,
  clearGameState,
  hasSeenOnboarding,
  markOnboardingSeen,
} from './persistence'

// Server sync (network layer)
export {
  syncToServer,
  ensureRegistered,
  loadFromServer,
} from './serverSync'

// Types
export type {
  GameStats,
  Achievement,
  HallOfFameEntry,
  DailyCharacter,
  SavedGameState,
} from './types'
