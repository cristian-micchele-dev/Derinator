import { describe, it, expect, beforeEach } from 'vitest'
import {
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
import { saveStats } from './gameStats'
import { getDefaultStats } from './gameStats'
import { ACHIEVEMENTS_KEY } from './types'

beforeEach(() => {
  localStorage.clear()
})

// ===================================================================
// loadAchievements / saveAchievements
// ===================================================================
describe('loadAchievements', () => {
  it('returns all default achievements when localStorage is empty', () => {
    const achs = loadAchievements()
    expect(achs).toHaveLength(9)
    expect(achs.every((a) => !a.unlocked)).toBe(true)
  })

  it('merges stored achievements with defaults (forward-compatible)', () => {
    const achs = loadAchievements()
    achs[0].unlocked = true
    saveAchievements(achs)

    // Add a new "unknown" achievement to stored data to simulate new version
    const stored = JSON.parse(localStorage.getItem(ACHIEVEMENTS_KEY)!)
    stored.push({ id: 'new_ones', title: 'New', unlocked: false })
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(stored))

    const merged = loadAchievements()
    // Should still have exactly 9 defaults, with first one unlocked
    expect(merged).toHaveLength(9)
    expect(merged.find((a) => a.id === 'first_win')!.unlocked).toBe(true)
  })

  it('returns defaults when stored data is corrupted', () => {
    localStorage.setItem(ACHIEVEMENTS_KEY, 'not json')
    expect(loadAchievements()).toHaveLength(9)
  })
})

// ===================================================================
// unlockAchievement
// ===================================================================
describe('unlockAchievement', () => {
  it('unlocks an achievement and returns true', () => {
    expect(unlockAchievement('first_win')).toBe(true)
    const achs = loadAchievements()
    const ach = achs.find((a) => a.id === 'first_win')!
    expect(ach.unlocked).toBe(true)
    expect(ach.unlockedAt).toBeDefined()
  })

  it('returns false when achievement is already unlocked', () => {
    unlockAchievement('first_win')
    expect(unlockAchievement('first_win')).toBe(false)
  })

  it('returns false for non-existent achievement', () => {
    expect(unlockAchievement('nonexistent')).toBe(false)
  })
})

// ===================================================================
// incrementAchievement
// ===================================================================
describe('incrementAchievement', () => {
  it('increments progress by 1 and saves', () => {
    incrementAchievement('streak_3')
    const ach = loadAchievements().find((a) => a.id === 'streak_3')!
    expect(ach.progress).toBe(1)
    expect(ach.unlocked).toBe(false)
  })

  it('increments by custom amount', () => {
    incrementAchievement('streak_3', 2)
    const ach = loadAchievements().find((a) => a.id === 'streak_3')!
    expect(ach.progress).toBe(2)
  })

  it('unlocks when progress reaches maxProgress', () => {
    incrementAchievement('streak_3', 3)
    const ach = loadAchievements().find((a) => a.id === 'streak_3')!
    expect(ach.progress).toBe(3)
    expect(ach.unlocked).toBe(true)
    expect(ach.unlockedAt).toBeDefined()
  })

  it('caps progress at maxProgress', () => {
    incrementAchievement('streak_3', 100)
    const ach = loadAchievements().find((a) => a.id === 'streak_3')!
    expect(ach.progress).toBe(3) // maxProgress is 3
    expect(ach.unlocked).toBe(true)
  })

  it('does nothing for already unlocked achievement', () => {
    unlockAchievement('first_win')
    const result = incrementAchievement('first_win')
    expect(result).toBe(false)
  })

  it('does nothing for non-existent achievement', () => {
    expect(incrementAchievement('nonexistent')).toBe(false)
  })
})

// ===================================================================
// getUnlockedAchievements / getLockedAchievements
// ===================================================================
describe('getUnlockedAchievements', () => {
  it('returns empty when nothing unlocked', () => {
    expect(getUnlockedAchievements()).toHaveLength(0)
  })

  it('returns only unlocked achievements', () => {
    unlockAchievement('first_win')
    unlockAchievement('perfect_guess')
    const unlocked = getUnlockedAchievements()
    expect(unlocked).toHaveLength(2)
    expect(unlocked.map((a) => a.id)).toContain('first_win')
    expect(unlocked.map((a) => a.id)).toContain('perfect_guess')
  })
})

describe('getLockedAchievements', () => {
  it('returns all when nothing unlocked', () => {
    expect(getLockedAchievements()).toHaveLength(9)
  })

  it('excludes unlocked achievements', () => {
    unlockAchievement('first_win')
    expect(getLockedAchievements()).toHaveLength(8)
  })
})

// ===================================================================
// recordPerfectGuess / recordCategoryWin / recordDailyWin
// ===================================================================
describe('recordPerfectGuess', () => {
  it('unlocks perfect_guess achievement', () => {
    recordPerfectGuess()
    expect(loadAchievements().find((a) => a.id === 'perfect_guess')!.unlocked).toBe(true)
  })
})

describe('recordCategoryWin', () => {
  it('increments animal_master for animales category', () => {
    recordCategoryWin('animales')
    const ach = loadAchievements().find((a) => a.id === 'animal_master')!
    expect(ach.progress).toBe(1)
  })

  it('increments character_master for personajes category', () => {
    recordCategoryWin('personajes')
    const ach = loadAchievements().find((a) => a.id === 'character_master')!
    expect(ach.progress).toBe(1)
  })

  it('does nothing for unknown category', () => {
    recordCategoryWin('otros')
    expect(loadAchievements().every((a) => a.progress === 0)).toBe(true)
  })
})

describe('recordDailyWin', () => {
  it('unlocks daily_winner achievement', () => {
    recordDailyWin()
    expect(loadAchievements().find((a) => a.id === 'daily_winner')!.unlocked).toBe(true)
  })
})

// ===================================================================
// checkAchievements
// ===================================================================
describe('checkAchievements', () => {
  it('unlocks first_win when userWins >= 1', () => {
    const stats = getDefaultStats()
    stats.userWins = 1
    saveStats(stats)
    checkAchievements()
    expect(loadAchievements().find((a) => a.id === 'first_win')!.unlocked).toBe(true)
  })

  it('unlocks streak_3 when bestStreak >= 3', () => {
    const stats = getDefaultStats()
    stats.bestStreak = 3
    saveStats(stats)
    checkAchievements()
    expect(loadAchievements().find((a) => a.id === 'streak_3')!.unlocked).toBe(true)
  })

  it('unlocks streak_5 when bestStreak >= 5', () => {
    const stats = getDefaultStats()
    stats.bestStreak = 5
    saveStats(stats)
    checkAchievements()
    expect(loadAchievements().find((a) => a.id === 'streak_5')!.unlocked).toBe(true)
  })

  it('unlocks veteran when totalGames >= 50', () => {
    const stats = getDefaultStats()
    stats.totalGames = 50
    saveStats(stats)
    checkAchievements()
    expect(loadAchievements().find((a) => a.id === 'veteran')!.unlocked).toBe(true)
  })

  it('does not unlock achievements when thresholds not met', () => {
    checkAchievements()
    expect(getUnlockedAchievements()).toHaveLength(0)
  })
})
