export const API_ROOT = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const API_BASE = `${API_ROOT}/api`

async function api(path: string, options?: RequestInit): Promise<unknown> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`)
  }
  return res.json()
}

export interface ServerStats {
  fingerprint: string
  derinatorWins: number
  userWins: number
  currentStreak: number
  bestStreak: number
  totalGames: number
  achievements: unknown[]
  hallOfFame: unknown[]
  dailyGuessed: boolean
  dailyGuesses: number
}

export function syncStats(stats: ServerStats): Promise<unknown> {
  return api('/stats/sync', {
    method: 'POST',
    body: JSON.stringify(stats),
  })
}

export function fetchStats(fingerprint: string): Promise<unknown> {
  return api(`/stats/${encodeURIComponent(fingerprint)}`)
}

export function recordGame(fingerprint: string, game: {
  characterName: string
  result: 'derinator_win' | 'user_win'
  questionsCount: number
  category: string
}): Promise<unknown> {
  return api('/stats/game', {
    method: 'POST',
    body: JSON.stringify({ fingerprint, ...game }),
  })
}
