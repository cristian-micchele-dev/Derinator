import type { Achievement, HallOfFameEntry } from '../stats/types'

export const API_ROOT = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '')
const API_BASE = `${API_ROOT}/api/v1`

const API_TIMEOUT_MS = 8000

async function api<T>(path: string, options?: RequestInit, token?: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS)

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers,
      ...options,
      signal: controller.signal,
    })
    if (!res.ok) {
      throw new Error(`API error: ${res.status}`)
    }
    return res.json() as Promise<T>
  } finally {
    clearTimeout(timeoutId)
  }
}

export interface ServerStats {
  fingerprint: string
  derinatorWins: number
  userWins: number
  currentStreak: number
  bestStreak: number
  totalGames: number
  achievements: Achievement[]
  hallOfFame: HallOfFameEntry[]
  dailyGuessed: boolean
  dailyGuesses: number
}

export interface SyncStatsResponse {
  success: boolean
  data: ApiStats
  player_token?: string
}

export interface FetchStatsResponse {
  success: boolean
  data: ApiStats
}

interface ApiStats {
  fingerprint: string
  derinator_wins: number
  user_wins: number
  current_streak: number
  best_streak: number
  total_games: number
  achievements: Achievement[]
  hall_of_fame: HallOfFameEntry[]
  daily_guessed: boolean
  daily_guesses: number
}

export interface RecordGameResponse {
  success: boolean
}

export function syncStats(stats: ServerStats, token?: string): Promise<SyncStatsResponse> {
  return api<SyncStatsResponse>(`/stats/${encodeURIComponent(stats.fingerprint)}`, {
    method: 'PUT',
    body: JSON.stringify(stats),
  }, token)
}

export function fetchStats(fingerprint: string): Promise<FetchStatsResponse> {
  return api<FetchStatsResponse>(`/stats/${encodeURIComponent(fingerprint)}`)
}

export function recordGame(fingerprint: string, game: {
  characterName: string
  result: 'derinator_win' | 'user_win'
  questionsCount: number
  category: string
}, token: string): Promise<RecordGameResponse> {
  return api<RecordGameResponse>('/stats/game', {
    method: 'POST',
    body: JSON.stringify({ fingerprint, ...game }),
  }, token)
}
