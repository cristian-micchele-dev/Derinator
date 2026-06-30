import { Character } from './characters'
import { QuestionId } from './questions'
import { Answer, CharacterCategory, CharacterSubcategory } from '../types'
import { validateCharacterInput, ValidationError } from './game/validation'
import { API_ROOT } from './api/api'
import { getFingerprint } from './stats/persistence'

const STORAGE_KEY = 'derinator_learned_characters'

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
  return 10000 + (Math.abs(hash) % 90000)
}

export interface LearnedCharacterFromServer {
  name: string
  description: string
  category: string
  subcategory: string | null
  answers: string
  created_at: string
}

export interface LearnInput {
  name: string
  description: string
  category: CharacterCategory
  subcategory?: CharacterSubcategory
  answers: Record<QuestionId, Answer>
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
    const res = await fetch(`${API_ROOT}/api/characters/learned`)
    if (!res.ok) return loadFromCache()
    
    const data = await res.json()
    const serverCharacters: Character[] = (data.characters || []).map((c: LearnedCharacterFromServer) => ({
      id: hashName(c.name),
      name: c.name,
      description: c.description || c.name,
      category: (c.category as CharacterCategory) || 'personaje',
      subcategory: c.subcategory || undefined,
      answers: typeof c.answers === 'string' ? JSON.parse(c.answers) : c.answers,
    }))
    
    // Merge with local cache (server wins on conflict)
    const local = loadFromCache()
    const localMap = new Map(local.map(c => [c.name.toLowerCase(), c]))
    
    for (const sc of serverCharacters) {
      localMap.set(sc.name.toLowerCase(), sc)
    }
    
    const merged = Array.from(localMap.values())
    // Assign stable IDs based on name hash
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

  const local = loadFromCache()
  
  // Check duplicate locally
  if (local.some(c => c.name.toLowerCase() === input.name.toLowerCase())) {
    return { success: false, errors: [{ field: 'name', message: 'Este personaje ya existe' }], isDuplicate: true }
  }
  
  // Try server first
  try {
    const res = await fetch(`${API_ROOT}/api/characters/learn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: validation.name,
        description: validation.description,
        category: validation.category,
        subcategory: validation.subcategory,
        answers: validation.answers,
        fingerprint: getFingerprint(),
      }),
    })
    
    if (res.status === 409) {
      return { success: false, errors: [{ field: 'name', message: 'Este personaje ya existe en el servidor' }], isDuplicate: true }
    }
    
    if (res.status === 429) {
      return { success: false, errors: [{ field: 'general', message: 'Demasiadas peticiones. Esperá un minuto.' }], isDuplicate: false }
    }
    
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      if (data.details) {
        return { success: false, errors: data.details, isDuplicate: false }
      }
      throw new Error('Server error')
    }
  } catch (err) {
    console.warn('Failed to sync with server, saving locally only:', err)
  }
  
  // Save locally regardless
  const newChar: Character = {
    id: hashName(validation.name),
    name: validation.name,
    description: validation.description,
    category: validation.category,
    subcategory: validation.subcategory || undefined,
    answers: validation.answers as Record<QuestionId, Answer>,
  }
  
  local.push(newChar)
  saveToCache(local)
  return { success: true, errors: [], isDuplicate: false }
}

/** Load learned characters (from cache, optionally sync with server) */
export function loadLearnedCharacters(): Character[] {
  return loadFromCache()
}

/** Clear all learned characters */
export function clearLearnedCharacters(): void {
  localStorage.removeItem(STORAGE_KEY)
}
