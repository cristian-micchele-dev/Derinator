import { describe, it, expect, beforeEach } from 'vitest'
import { getDb } from '../db'
import { PgCharacterRepository } from './CharacterRepository'
import type { LearnCharacterInput } from '../../domain'

let repo: PgCharacterRepository

function makeChar(overrides: Partial<LearnCharacterInput> = {}): LearnCharacterInput {
  return {
    name: 'Goku',
    description: 'Saiyajin guerrero',
    category: 'personaje',
    subcategory: 'anime',
    answers: { '1': 'yes', '2': 'no', '3': 'yes', '4': 'no', '5': 'yes' },
    fingerprint: 'char-test-fp-001',
    ...overrides,
  }
}

beforeEach(async () => {
  const db = getDb()
  await db.query('DELETE FROM game_history')
  await db.query('DELETE FROM player_stats')
  await db.query('DELETE FROM learned_characters')
  repo = new PgCharacterRepository(db)
})

describe('PgCharacterRepository', () => {
  it('findAll returns empty array initially', async () => {
    const result = await repo.findAll()
    expect(result).toEqual([])
  })

  it('create stores a character and findAll returns it', async () => {
    await repo.create(makeChar())
    const all = await repo.findAll()

    expect(all).toHaveLength(1)
    expect(all[0].name).toBe('Goku')
    expect(all[0].category).toBe('personaje')
    expect(all[0].subcategory).toBe('anime')
    expect(all[0].fingerprint).toBe('char-test-fp-001')
  })

  it('findByFingerprint only returns characters for that fingerprint', async () => {
    await repo.create(makeChar({ name: 'Goku', fingerprint: 'fp-aaa-111' }))
    await repo.create(makeChar({ name: 'Vegeta', fingerprint: 'fp-bbb-222' }))

    const result = await repo.findByFingerprint('fp-aaa-111')
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Goku')
  })

  it('findByFingerprint returns empty for unknown fingerprint', async () => {
    await repo.create(makeChar())
    const result = await repo.findByFingerprint('unknown-fp-999')
    expect(result).toEqual([])
  })

  it('findDuplicate detects case-insensitive name match for same fingerprint', async () => {
    await repo.create(makeChar({ name: 'Goku', fingerprint: 'fp-dup-test1' }))

    const isDup = await repo.findDuplicate('goku', 'fp-dup-test1')
    expect(isDup).toBe(true)
  })

  it('findDuplicate returns false for different fingerprint', async () => {
    await repo.create(makeChar({ name: 'Goku', fingerprint: 'fp-dup-test2' }))

    const isDup = await repo.findDuplicate('Goku', 'fp-dup-other1')
    expect(isDup).toBe(false)
  })

  it('findDuplicate works with null fingerprint', async () => {
    await repo.create(makeChar({ name: 'Pikachu', fingerprint: undefined }))

    const isDup = await repo.findDuplicate('Pikachu')
    expect(isDup).toBe(true)

    const notDup = await repo.findDuplicate('Pikachu', 'some-fp-12345')
    expect(notDup).toBe(false)
  })

  it('findAll respects limit parameter', async () => {
    await repo.create(makeChar({ name: 'Char1' }))
    await repo.create(makeChar({ name: 'Char2' }))
    await repo.create(makeChar({ name: 'Char3' }))

    const limited = await repo.findAll(2)
    expect(limited).toHaveLength(2)
  })

  it('stores answers as JSON string', async () => {
    const answers = { '1': 'yes', '10': 'no', '20': 'probably' }
    await repo.create(makeChar({ answers }))

    const all = await repo.findAll()
    const parsed = JSON.parse(all[0].answers)
    expect(parsed).toEqual(answers)
  })

  it('uses name as description fallback when description is empty', async () => {
    await repo.create(makeChar({ name: 'Naruto', description: '' }))

    const all = await repo.findAll()
    expect(all[0].description).toBe('Naruto')
  })
})
