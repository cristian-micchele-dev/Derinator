import { describe, it, expect, beforeEach } from 'vitest'
import { getDb } from '../../db'
import { PgPlayerStatsRepository } from './PlayerStatsRepository'
import { PgGameHistoryRepository } from './GameHistoryRepository'

let historyRepo: PgGameHistoryRepository
let statsRepo: PgPlayerStatsRepository
let playerId: string

beforeEach(async () => {
  const db = getDb()
  await db.query('DELETE FROM game_history')
  await db.query('DELETE FROM player_stats')

  statsRepo = new PgPlayerStatsRepository(db)
  historyRepo = new PgGameHistoryRepository(db)

  // Create a player for history entries
  const player = await statsRepo.upsert({
    fingerprint: 'history-test-fp1',
    derinatorWins: 0,
    userWins: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalGames: 0,
    achievements: [],
    hallOfFame: [],
    dailyGuessed: false,
    dailyGuesses: 0,
  })
  playerId = player.id
})

describe('PgGameHistoryRepository', () => {
  it('findByFingerprint returns empty for player with no games', async () => {
    const result = await historyRepo.findByFingerprint('history-test-fp1')
    expect(result).toEqual([])
  })

  it('create stores a game and findByFingerprint returns it', async () => {
    await historyRepo.create(playerId, 'Goku', 'win', 5, 'personaje')

    const games = await historyRepo.findByFingerprint('history-test-fp1')
    expect(games).toHaveLength(1)
    expect(games[0].characterName).toBe('Goku')
    expect(games[0].result).toBe('win')
    expect(games[0].questionsCount).toBe(5)
    expect(games[0].category).toBe('personaje')
  })

  it('findPlayerId returns player ID for existing fingerprint', async () => {
    const id = await historyRepo.findPlayerId('history-test-fp1')
    expect(id).toBe(playerId)
  })

  it('findPlayerId returns null for unknown fingerprint', async () => {
    const id = await historyRepo.findPlayerId('nonexistent-fp-999')
    expect(id).toBeNull()
  })

  it('returns multiple games ordered by created_at DESC', async () => {
    await historyRepo.create(playerId, 'Goku', 'win', 5, 'personaje')
    await historyRepo.create(playerId, 'Pikachu', 'lose', 20, 'animal')

    const games = await historyRepo.findByFingerprint('history-test-fp1')
    expect(games).toHaveLength(2)
    // Most recent first
    expect(games[0].characterName).toBe('Pikachu')
    expect(games[1].characterName).toBe('Goku')
  })

  it('handles null/empty category and questionsCount gracefully', async () => {
    await historyRepo.create(playerId, 'Unknown', 'lose', 0, '')

    const games = await historyRepo.findByFingerprint('history-test-fp1')
    expect(games[0].questionsCount).toBe(0)
    expect(games[0].category).toBe('')
  })
})
