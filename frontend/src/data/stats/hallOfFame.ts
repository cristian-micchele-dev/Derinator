import { HallOfFameEntry, HALL_OF_FAME_KEY } from './types'

export function getHallOfFame(): HallOfFameEntry[] {
  try {
    const stored = localStorage.getItem(HALL_OF_FAME_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function addToHallOfFame(entry: Omit<HallOfFameEntry, 'date'>): void {
  const hall = getHallOfFame()
  hall.unshift({
    ...entry,
    date: new Date().toISOString(),
  })
  // Keep only last 50
  if (hall.length > 50) hall.length = 50
  localStorage.setItem(HALL_OF_FAME_KEY, JSON.stringify(hall))
}
