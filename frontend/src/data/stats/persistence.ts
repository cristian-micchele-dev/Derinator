import { SavedGameState, GAME_STATE_KEY, ONBOARDING_KEY } from './types'

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

