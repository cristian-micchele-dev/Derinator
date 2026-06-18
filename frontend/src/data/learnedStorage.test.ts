import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  saveLearnedCharacter,
  loadLearnedCharacters,
  clearLearnedCharacters,
  syncLearnedCharactersFromServer,
} from './learnedStorage'
import type { ValidationError } from './game/validation'

// Mock fetch globally
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
    get length() { return Object.keys(store).length },
    key: vi.fn((i: number) => Object.keys(store)[i] || null),
  }
})()

vi.stubGlobal('localStorage', localStorageMock)

// Minimal mock of validateCharacterInput
vi.mock('./game/validation', () => ({
  validateCharacterInput: vi.fn((raw: Record<string, unknown>) => {
    const errors: ValidationError[] = []
    if (!raw.name || typeof raw.name !== 'string' || raw.name.trim().length < 2) {
      errors.push({ field: 'name', message: 'El nombre es obligatorio' })
    }
    if (!raw.category || !['animal', 'personaje'].includes(raw.category)) {
      errors.push({ field: 'category', message: 'Categoría inválida' })
    }
    return {
      name: raw.name || '',
      description: raw.description || raw.name || '',
      category: raw.category || 'personaje',
      subcategory: raw.subcategory || null,
      answers: raw.answers || {},
      errors,
      isValid: errors.length === 0,
    }
  }),
}))

describe('learnedStorage', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  // ===================================================================
  // loadLearnedCharacters
  // ===================================================================
  describe('loadLearnedCharacters', () => {
    it('returns empty array when localStorage is empty', () => {
      expect(loadLearnedCharacters()).toEqual([])
    })

    it('returns characters from localStorage', () => {
      const chars = [{ id: 1, name: 'Test', category: 'animal' }]
      localStorageMock.setItem('derinator_learned_characters', JSON.stringify(chars))
      const result = loadLearnedCharacters()
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Test')
    })

    it('returns empty array for invalid JSON', () => {
      localStorageMock.setItem('derinator_learned_characters', 'not-json')
      expect(loadLearnedCharacters()).toEqual([])
    })

    it('returns empty array for non-array JSON', () => {
      localStorageMock.setItem('derinator_learned_characters', '{"foo":"bar"}')
      expect(loadLearnedCharacters()).toEqual([])
    })
  })

  // ===================================================================
  // clearLearnedCharacters
  // ===================================================================
  describe('clearLearnedCharacters', () => {
    it('removes the storage key', () => {
      localStorageMock.setItem('derinator_learned_characters', '[]')
      clearLearnedCharacters()
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('derinator_learned_characters')
    })
  })

  // ===================================================================
  // saveLearnedCharacter
  // ===================================================================
  describe('saveLearnedCharacter', () => {
    const validInput = {
      name: 'Pikachu',
      description: 'Un Pokemon electrico',
      category: 'animal' as const,
      subcategory: 'videojuego' as const,
      answers: { 1: 'yes' as const, 2: 'yes' as const, 4: 'yes' as const },
    }

    it('returns error for invalid input (short name)', async () => {
      const result = await saveLearnedCharacter({ ...validInput, name: 'A' })
      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('returns error for duplicate name locally', async () => {
      // Pre-populate localStorage with existing character
      const existing = [{ id: 10000, name: 'Pikachu', category: 'animal', answers: {} }]
      localStorageMock.setItem('derinator_learned_characters', JSON.stringify(existing))

      const result = await saveLearnedCharacter(validInput)
      expect(result.success).toBe(false)
      expect(result.isDuplicate).toBe(true)
    })

    it('saves character locally when server is unavailable', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await saveLearnedCharacter(validInput)
      expect(result.success).toBe(true)
      // Should be saved to localStorage
      const stored = JSON.parse(localStorageMock.getItem('derinator_learned_characters') || '[]')
      expect(stored).toHaveLength(1)
      expect(stored[0].name).toBe('Pikachu')
    })

    it('returns duplicate error on server 409', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 409,
        ok: false,
        json: () => Promise.resolve({}),
      })

      const result = await saveLearnedCharacter(validInput)
      expect(result.success).toBe(false)
      expect(result.isDuplicate).toBe(true)
      expect(result.errors[0].message).toContain('servidor')
    })

    it('returns error on server 429 (rate limit)', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 429,
        ok: false,
        json: () => Promise.resolve({}),
      })

      const result = await saveLearnedCharacter(validInput)
      expect(result.success).toBe(false)
      expect(result.errors[0].message).toContain('Demasiadas')
    })

    it('saves locally when server returns 500', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 500,
        ok: false,
        json: () => Promise.resolve({ details: [{ field: 'server', message: 'Error' }] }),
      })

      const result = await saveLearnedCharacter(validInput)
      // Server error with details → returns the details as errors
      expect(result.success).toBe(false)
      expect(result.errors[0].field).toBe('server')
    })

    it('saves locally when server returns 500 without details', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 500,
        ok: false,
        json: () => Promise.resolve({}),
      })

      const result = await saveLearnedCharacter(validInput)
      // Server error without details → throws, caught, saves locally
      expect(result.success).toBe(true)
    })

    it('saves character to localStorage with correct structure', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 201,
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      await saveLearnedCharacter(validInput)
      const stored = JSON.parse(localStorageMock.getItem('derinator_learned_characters') || '[]')
      expect(stored[0]).toMatchObject({
        name: 'Pikachu',
        description: 'Un Pokemon electrico',
        category: 'animal',
      })
      expect(stored[0].id).toBeGreaterThan(0)
    })
  })

  // ===================================================================
  // syncLearnedCharactersFromServer
  // ===================================================================
  describe('syncLearnedCharactersFromServer', () => {
    it('returns cached characters when server fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))
      const cached = [{ id: 1, name: 'Cached', category: 'animal', answers: {} }]
      localStorageMock.setItem('derinator_learned_characters', JSON.stringify(cached))

      const result = await syncLearnedCharactersFromServer()
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Cached')
    })

    it('merges server characters with local cache', async () => {
      const local = [{ id: 1, name: 'Local', category: 'animal', answers: {} }]
      localStorageMock.setItem('derinator_learned_characters', JSON.stringify(local))

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          characters: [{
            name: 'Server',
            description: 'From server',
            category: 'personaje',
            subcategory: null,
            answers: '{"1":"yes"}',
            created_at: '2024-01-01',
          }],
        }),
      })

      const result = await syncLearnedCharactersFromServer()
      expect(result.length).toBeGreaterThanOrEqual(2)
      const names = result.map(c => c.name)
      expect(names).toContain('Local')
      expect(names).toContain('Server')
    })

    it('server wins on name conflict during merge', async () => {
      const local = [{ id: 1, name: 'Conflict', category: 'animal', answers: { 1: 'no' } }]
      localStorageMock.setItem('derinator_learned_characters', JSON.stringify(local))

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          characters: [{
            name: 'Conflict',
            description: 'Server version',
            category: 'personaje',
            subcategory: null,
            answers: '{"1":"yes"}',
            created_at: '2024-01-01',
          }],
        }),
      })

      const result = await syncLearnedCharactersFromServer()
      const conflict = result.find(c => c.name === 'Conflict')
      expect(conflict?.description).toBe('Server version')
    })

    it('returns cache when server response is not ok', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 })
      const result = await syncLearnedCharactersFromServer()
      expect(result).toEqual([])
    })

    it('handles server returning null/undefined characters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ characters: null }),
      })

      const result = await syncLearnedCharactersFromServer()
      expect(result).toEqual([])
    })
  })
})
