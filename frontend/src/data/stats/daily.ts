import { DailyCharacter, DAILY_CHARACTER_KEY } from './types'

export function getDailySeed(): number {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  return Math.floor(startOfDay / (24 * 60 * 60 * 1000))
}

export function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000
  return x - Math.floor(x)
}

export function getDailyCharacterIndex(totalCharacters: number): number {
  return Math.floor(seededRandom(getDailySeed()) * totalCharacters)
}

export function loadDailyCharacter(): DailyCharacter | null {
  try {
    const stored = localStorage.getItem(DAILY_CHARACTER_KEY)
    if (!stored) return null
    const parsed = JSON.parse(stored) as DailyCharacter
    // Check if it's from today
    const today = new Date().toISOString().split('T')[0]
    if (parsed.date !== today) {
      // Reset for new day
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function saveDailyCharacter(character: DailyCharacter): void {
  localStorage.setItem(DAILY_CHARACTER_KEY, JSON.stringify(character))
}

export function resetDailyCharacter(): void {
  localStorage.removeItem(DAILY_CHARACTER_KEY)
}
