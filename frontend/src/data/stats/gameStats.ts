import { GameStats, STATS_KEY } from './types'

export function getDefaultStats(): GameStats {
  return {
    derinatorWins: 0,
    userWins: 0,
    currentStreak: 0,
    bestStreak: 0,
    mostDefeatedCharacter: '',
    mostDefeatedCount: 0,
    totalGames: 0,
    characterGuessCounts: {},
  }
}

export function loadStats(): GameStats {
  try {
    const stored = localStorage.getItem(STATS_KEY)
    if (!stored) return getDefaultStats()
    return { ...getDefaultStats(), ...JSON.parse(stored) }
  } catch {
    return getDefaultStats()
  }
}

export function saveStats(stats: GameStats): void {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats))
}

export function recordDerinatorWin(characterName: string): void {
  const stats = loadStats()
  stats.derinatorWins++
  stats.currentStreak++
  stats.totalGames++
  if (stats.currentStreak > stats.bestStreak) {
    stats.bestStreak = stats.currentStreak
  }
  if (characterName) {
    stats.characterGuessCounts[characterName] = (stats.characterGuessCounts[characterName] || 0) + 1
  }
  saveStats(stats)
}

export function getTopGuessedCharacters(limit: number = 10): { name: string; count: number }[] {
  const stats = loadStats()
  return Object.entries(stats.characterGuessCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

export function recordUserWin(): void {
  const stats = loadStats()
  stats.userWins++
  stats.currentStreak = 0
  stats.totalGames++
  saveStats(stats)
}

export function recordDefeatedBy(characterName: string): void {
  const stats = loadStats()
  const key = `_defeated:${characterName}`
  stats.characterGuessCounts[key] = (stats.characterGuessCounts[key] || 0) + 1
  // Recalculate most defeated from defeat-prefixed entries
  let topName = ''
  let topCount = 0
  for (const [k, v] of Object.entries(stats.characterGuessCounts)) {
    if (k.startsWith('_defeated:') && v > topCount) {
      topName = k.slice('_defeated:'.length)
      topCount = v
    }
  }
  stats.mostDefeatedCharacter = topName
  stats.mostDefeatedCount = topCount
  saveStats(stats)
}

export function getStatsDisplay(): string {
  const stats = loadStats()
  if (stats.totalGames === 0) return ''
  return `Derinator: ${stats.derinatorWins} | Me derrotaron: ${stats.userWins} | Racha: ${stats.currentStreak}`
}
