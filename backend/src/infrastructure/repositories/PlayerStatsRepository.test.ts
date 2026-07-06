import { describe, it, expect, beforeEach } from 'vitest'
import { getDb } from '../db'
import { PgPlayerStatsRepository } from './PlayerStatsRepository'
import type { SyncStatsInput } from '../../domain'

let repo: PgPlayerStatsRepository

function makeInput(overrides: Partial<SyncStatsInput> = {}): SyncStatsInput {
  return {
    fingerprint: 'repo-test-fp-001',
    derinatorWins: 5,
    userWins: 3,
    currentStreak: 2,
    bestStreak: 4,
    totalGames: 8,
    achievements: ['first_win'],
    hallOfFame: [],
    dailyGuessed: false,
    dailyGuesses: 0,
    ...overrides,
  }
}

beforeEach(async () => {
  const db = getDb()
  await db.query('DELETE FROM game_history')
  await db.query('DELETE FROM player_stats')
  repo = new PgPlayerStatsRepository(db)
})

describe('PgPlayerStatsRepository', () => {
  it('findByFingerprint returns null for unknown fingerprint', async () => {
    const result = await repo.findByFingerprint('nonexistent-fp-123')
    expect(result).toBeNull()
  })

  it('upsert creates a new player and returns domain entity', async () => {
    const input = makeInput()
    const result = await repo.upsert(input)

    expect(result.fingerprint).toBe(input.fingerprint)
    expect(result.derinatorWins).toBe(5)
    expect(result.userWins).toBe(3)
    expect(result.currentStreak).toBe(2)
    expect(result.bestStreak).toBe(4)
    expect(result.totalGames).toBe(8)
    expect(result.dailyGuessed).toBe(false)
    expect(result.id).toBeDefined()
    expect(result.playerToken).toBeDefined()
  })

  it('findByFingerprint returns player after upsert', async () => {
    await repo.upsert(makeInput())
    const found = await repo.findByFingerprint('repo-test-fp-001')

    expect(found).not.toBeNull()
    expect(found!.fingerprint).toBe('repo-test-fp-001')
    expect(found!.derinatorWins).toBe(5)
  })

  it('findByToken returns player by token', async () => {
    const created = await repo.upsert(makeInput())
    const found = await repo.findByToken(created.playerToken!)

    expect(found).not.toBeNull()
    expect(found!.fingerprint).toBe('repo-test-fp-001')
  })

  it('findByToken returns null for unknown token', async () => {
    const result = await repo.findByToken('nonexistent-token')
    expect(result).toBeNull()
  })

  it('upsert preserves player_token on subsequent updates', async () => {
    const first = await repo.upsert(makeInput())
    const second = await repo.upsert(makeInput({ derinatorWins: 10 }))

    expect(second.playerToken).toBe(first.playerToken)
  })

  it('upsert uses MAX-merge strategy on conflict', async () => {
    // First insert
    await repo.upsert(makeInput({ derinatorWins: 5, bestStreak: 4, totalGames: 8 }))

    // Second upsert: higher wins, lower streak → GREATEST picks max
    const updated = await repo.upsert(makeInput({
      derinatorWins: 10,
      bestStreak: 2,
      totalGames: 6,
    }))

    expect(updated.derinatorWins).toBe(10)  // max(5, 10)
    expect(updated.bestStreak).toBe(4)       // max(4, 2)
    expect(updated.totalGames).toBe(8)       // max(8, 6)
  })

  it('upsert overwrites currentStreak (not max-merged)', async () => {
    await repo.upsert(makeInput({ currentStreak: 5 }))
    const updated = await repo.upsert(makeInput({ currentStreak: 1 }))

    expect(updated.currentStreak).toBe(1)
  })

  it('stores achievements and hallOfFame as JSON strings', async () => {
    const result = await repo.upsert(makeInput({
      achievements: ['first_win', 'streak_5'],
      hallOfFame: [{ name: 'Goku', guesses: 3 }],
    }))

    expect(JSON.parse(result.achievements)).toEqual(['first_win', 'streak_5'])
    expect(JSON.parse(result.hallOfFame)).toEqual([{ name: 'Goku', guesses: 3 }])
  })

  it('converts dailyGuessed boolean to 0/1', async () => {
    const withTrue = await repo.upsert(makeInput({ dailyGuessed: true }))
    expect(withTrue.dailyGuessed).toBe(true)

    await getDb().query('DELETE FROM game_history')
    await getDb().query('DELETE FROM player_stats')

    const withFalse = await repo.upsert(makeInput({ dailyGuessed: false }))
    expect(withFalse.dailyGuessed).toBe(false)
  })
})
