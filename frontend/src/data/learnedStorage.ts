import { Character } from './characters'
import { QuestionId } from './questions'
import { Answer, CharacterCategory, CharacterSubcategory } from '../types'
import { validateCharacterInput, ValidationError } from './game/validation'
import { API_ROOT as _API_ROOT } from './api/api'

const API_ROOT = _API_ROOT.replace(/\/$/, '')
import { getFingerprint, getPlayerToken } from './stats/persistence'

const STORAGE_KEY = 'derinator_learned_characters'
const MAX_CONFIRMER_LENGTH = 200
const MIN_CONFIRMER_LENGTH = 5

function sanitizeConfirmerQuestion(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')   // strip HTML tags
    .replace(/[<>"']/g, '')    // strip remaining angle brackets and quotes
    .trim()
    .slice(0, MAX_CONFIRMER_LENGTH)
}

function validateConfirmerQuestion(raw: string): { value: string; error: string | null } {
  const value = sanitizeConfirmerQuestion(raw)
  if (value.length < MIN_CONFIRMER_LENGTH) {
    return { value, error: `La pista debe tener al menos ${MIN_CONFIRMER_LENGTH} caracteres` }
  }
  return { value, error: null }
}

/** Simple hash function for stable IDs */
function hashName(name: string): number {
  let hash = 0
  const lower = name.toLowerCase().trim()
  for (let i = 0; i < lower.length; i++) {
    const char = lower.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  // Ensure positive ID in the 10000+ range to avoid collision with built-in characters
  return 10000 + (Math.abs(hash) % 9000000)
}

export interface LearnedCharacterFromServer {
  name: string
  description: string
  category: string
  subcategory: string | null
  answers: string
  confirmerQuestion?: string
  created_at: string
}

export interface LearnInput {
  name: string
  description: string
  category: CharacterCategory
  subcategory?: CharacterSubcategory
  answers: Record<QuestionId, Answer>
  /** Unique question text that only applies to this character — used as in-game confirmer */
  confirmerQuestion?: string
}

/** Load from localStorage (cache) */
function loadFromCache(): Character[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

/** Save to localStorage (cache) */
function saveToCache(characters: Character[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(characters))
}

/** Fetch learned characters from server */
export async function syncLearnedCharactersFromServer(): Promise<Character[]> {
  try {
    const fingerprint = getFingerprint()
    const res = await fetch(`${API_ROOT}/api/v1/characters?fingerprint=${encodeURIComponent(fingerprint)}`)
    if (!res.ok) return loadFromCache()

    const data = await res.json()
    const serverCharacters: Character[] = (data.data || []).map((c: LearnedCharacterFromServer) => ({
      id: hashName(c.name),
      name: c.name,
      description: c.description || c.name,
      category: (c.category as CharacterCategory) || 'personaje',
      subcategory: c.subcategory || undefined,
      answers: typeof c.answers === 'string' ? JSON.parse(c.answers) : c.answers,
      confirmerQuestion: c.confirmerQuestion || undefined,
    }))
    
    // Server is authoritative for this fingerprint.
    // Keep local-only characters (taught offline, not yet on server),
    // but discard anything that came from old public syncs.
    const local = loadFromCache()
    const serverNames = new Set(serverCharacters.map(c => c.name.toLowerCase()))
    const localOnly = local.filter(c => !serverNames.has(c.name.toLowerCase()))

    const merged = [...serverCharacters, ...localOnly]
    merged.forEach((c) => { c.id = hashName(c.name) })

    saveToCache(merged)
    return merged
  } catch {
    return loadFromCache()
  }
}

export interface SaveResult {
  success: boolean
  errors: ValidationError[]
  isDuplicate: boolean
}

/** Save character to both server and localStorage */
export async function saveLearnedCharacter(input: LearnInput): Promise<SaveResult> {
  // Validate first
  const validation = validateCharacterInput({
    name: input.name,
    description: input.description,
    category: input.category,
    subcategory: input.subcategory,
    answers: input.answers,
  })

  if (!validation.isValid) {
    return { success: false, errors: validation.errors, isDuplicate: false }
  }

  // Validate and sanitize confirmerQuestion independently (not sent to server)
  let sanitizedConfirmer: string | undefined
  if (input.confirmerQuestion) {
    const { value, error } = validateConfirmerQuestion(input.confirmerQuestion)
    if (error) {
      return { success: false, errors: [{ field: 'confirmerQuestion', message: error }], isDuplicate: false }
    }
    sanitizedConfirmer = value
  }

  const local = loadFromCache()
  
  // Check duplicate locally — already in cache (e.g. synced from server), just succeed
  if (local.some(c => c.name.toLowerCase() === input.name.toLowerCase())) {
    return { success: true, errors: [], isDuplicate: true }
  }
  
  // Try server first
  try {
    const token = getPlayerToken()
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch(`${API_ROOT}/api/v1/characters`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: validation.name,
        description: validation.description,
        category: validation.category,
        subcategory: validation.subcategory,
        answers: validation.answers,
        fingerprint: getFingerprint(),
        confirmerQuestion: sanitizedConfirmer,
      }),
    })
    
    if (res.status === 409) {
      // Character exists on server — save locally so the game can use it
      const newChar: Character = {
        id: hashName(validation.name),
        name: validation.name,
        description: validation.description,
        category: validation.category,
        subcategory: validation.subcategory || undefined,
        answers: validation.answers as Record<QuestionId, Answer>,
        confirmerQuestion: sanitizedConfirmer,
      }
      local.push(newChar)
      saveToCache(local)
      return { success: true, errors: [], isDuplicate: true }
    }
    
    if (res.status === 429) {
      return { success: false, errors: [{ field: 'general', message: 'Demasiadas peticiones. Esperá un minuto.' }], isDuplicate: false }
    }
    
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      if (data.details) {
        return { success: false, errors: data.details, isDuplicate: false }
      }
      return { success: false, errors: [{ field: 'general', message: 'Error del servidor. Intentá de nuevo más tarde.' }], isDuplicate: false }
    }
  } catch {
    // Network error — save locally (offline-first)
  }
  
  // Save locally regardless
  const newChar: Character = {
    id: hashName(validation.name),
    name: validation.name,
    description: validation.description,
    category: validation.category,
    subcategory: validation.subcategory || undefined,
    answers: validation.answers as Record<QuestionId, Answer>,
    confirmerQuestion: sanitizedConfirmer,
  }
  
  local.push(newChar)
  saveToCache(local)
  return { success: true, errors: [], isDuplicate: false }
}

/** Load learned characters (from cache, optionally sync with server) */
export function loadLearnedCharacters(): Character[] {
  return loadFromCache()
}

/** Delete a single learned character by id */
export function deleteLearnedCharacter(id: number): void {
  const chars = loadFromCache().filter(c => c.id !== id)
  if (chars.length === 0) {
    localStorage.removeItem(STORAGE_KEY)
  } else {
    saveToCache(chars)
  }
}

/** Clear all learned characters */
export function clearLearnedCharacters(): void {
  localStorage.removeItem(STORAGE_KEY)
}
