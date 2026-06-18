/**
 * Stats & persistence barrel export.
 * 
 * Centralizes access to achievements, daily character,
 * game stats, hall of fame, and persistence modules.
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

// Hall of fame
export { addToHallOfFame, getHallOfFame } from './hallOfFame'

// Persistence
export {
  getFingerprint,
  saveGameState,
  loadGameState,
  clearGameState,
  hasSeenOnboarding,
  markOnboardingSeen,
  syncToServer,
  loadFromServer,
} from './persistence'

// Types
export type {
  GameStats,
  Achievement,
  HallOfFameEntry,
  DailyCharacter,
  SavedGameState,
} from './types'
