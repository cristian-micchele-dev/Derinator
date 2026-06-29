import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import express from 'express'
import { getDb } from '../db'
import { SqlitePlayerStatsRepository } from '../infrastructure/repositories/PlayerStatsRepository'
import { SqliteCharacterRepository } from '../infrastructure/repositories/CharacterRepository'
import { SqliteGameHistoryRepository } from '../infrastructure/repositories/GameHistoryRepository'
import { createStatsRouter } from './stats'
import { createCharactersRouter } from './characters'

const TEST_FINGERPRINT = 'test-fingerprint-123'

let app: express.Express
let playerToken: string

beforeAll(async () => {
  const db = await getDb()

  const statsRepo = new SqlitePlayerStatsRepository(db)
  const characterRepo = new SqliteCharacterRepository(db)
  const historyRepo = new SqliteGameHistoryRepository(db)

  app = express()
  app.use(express.json())
  app.use('/api/stats', createStatsRouter(statsRepo, historyRepo))
  app.use('/api/characters', createCharactersRouter(characterRepo))
})

describe('Stats API', () => {
  it('GET /api/stats/:fingerprint returns default stats for new player', async () => {
    const res = await request(app).get(`/api/stats/${TEST_FINGERPRINT}`)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.derinator_wins).toBe(0)
    expect(res.body.data.user_wins).toBe(0)
    expect(res.body.data.fingerprint).toBe(TEST_FINGERPRINT)
  })

  it('POST /api/stats/sync creates new player stats', async () => {
    const stats = {
      fingerprint: TEST_FINGERPRINT,
      derinatorWins: 5,
      userWins: 3,
      currentStreak: 2,
      bestStreak: 4,
      totalGames: 8,
      achievements: [{ id: 'first_win', unlocked: true }],
      hallOfFame: [{ name: 'Test', questionsCount: 10 }],
      dailyGuessed: true,
      dailyGuesses: 2,
    }

    const res = await request(app).post('/api/stats/sync').send(stats)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.derinator_wins).toBe(5)
    expect(res.body.data.user_wins).toBe(3)
    expect(res.body.player_token).toBeDefined()
    playerToken = res.body.player_token
  })

  it('POST /api/stats/sync updates existing player with max merge', async () => {
    const stats = {
      fingerprint: TEST_FINGERPRINT,
      derinatorWins: 10,
      userWins: 5,
      currentStreak: 3,
      bestStreak: 6,
      totalGames: 15,
      achievements: [],
      hallOfFame: [],
      dailyGuessed: false,
      dailyGuesses: 0,
    }

    const res = await request(app)
      .post('/api/stats/sync')
      .set('Authorization', `Bearer ${playerToken}`)
      .send(stats)
    expect(res.status).toBe(200)
    expect(res.body.data.derinator_wins).toBe(10)
    expect(res.body.data.user_wins).toBe(5)
    expect(res.body.data.best_streak).toBe(6)
  })

  it('POST /api/stats/sync rejects invalid fingerprint', async () => {
    const res = await request(app).post('/api/stats/sync').send({
      fingerprint: 'short',
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
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Invalid fingerprint')
  })

  it('POST /api/stats/game records game history', async () => {
    const res = await request(app)
      .post('/api/stats/game')
      .set('Authorization', `Bearer ${playerToken}`)
      .send({
        fingerprint: TEST_FINGERPRINT,
        characterName: 'Mario',
        result: 'derinator_win',
        questionsCount: 12,
        category: 'personajes',
      })
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('POST /api/stats/game rejects missing fields', async () => {
    const res = await request(app).post('/api/stats/game').send({
      fingerprint: TEST_FINGERPRINT,
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Missing required fields')
  })

  it('POST /api/stats/game rejects invalid result', async () => {
    const res = await request(app)
      .post('/api/stats/game')
      .set('Authorization', `Bearer ${playerToken}`)
      .send({
        fingerprint: TEST_FINGERPRINT,
        characterName: 'Mario',
        result: 'cheated_win',
        questionsCount: 5,
        category: 'personajes',
      })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/Invalid result/)
  })

  it('POST /api/stats/game rejects invalid category', async () => {
    const res = await request(app)
      .post('/api/stats/game')
      .set('Authorization', `Bearer ${playerToken}`)
      .send({
        fingerprint: TEST_FINGERPRINT,
        characterName: 'Mario',
        result: 'derinator_win',
        questionsCount: 5,
        category: 'invalid_category',
      })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Invalid category')
  })

  it('POST /api/stats/game sanitizes characterName HTML', async () => {
    const res = await request(app)
      .post('/api/stats/game')
      .set('Authorization', `Bearer ${playerToken}`)
      .send({
        fingerprint: TEST_FINGERPRINT,
        characterName: '<script>alert(1)</script>Mario',
        result: 'derinator_win',
        questionsCount: 5,
        category: 'personajes',
      })
    expect(res.status).toBe(200)
  })

  it('GET /api/stats/:fingerprint returns updated stats', async () => {
    const res = await request(app).get(`/api/stats/${TEST_FINGERPRINT}`)
    expect(res.status).toBe(200)
    expect(res.body.data.derinator_wins).toBe(10)
    expect(res.body.data.user_wins).toBe(5)
  })
})

describe('Characters API', () => {
  const TEST_CHARACTER = {
    name: 'TestCharacter_' + Date.now(),
    description: 'A test character',
    category: 'personaje',
    subcategory: 'videojuego',
    answers: { 1: 'yes', 3: 'yes', 4: 'yes', 60: 'yes' },
  }

  it('POST /api/characters/learn creates a new character', async () => {
    const res = await request(app).post('/api/characters/learn').send(TEST_CHARACTER)
    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.name).toBe(TEST_CHARACTER.name)
  })

  it('POST /api/characters/learn rejects duplicate', async () => {
    const res = await request(app).post('/api/characters/learn').send(TEST_CHARACTER)
    expect(res.status).toBe(409)
    expect(res.body.error).toBe('Character already exists')
  })

  it('POST /api/characters/learn validates required fields', async () => {
    const res = await request(app).post('/api/characters/learn').send({
      description: 'Missing name',
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Validation failed')
  })

  it('POST /api/characters/learn validates category', async () => {
    const res = await request(app).post('/api/characters/learn').send({
      name: 'InvalidCat_' + Date.now(),
      description: 'Test',
      category: 'invalid',
      answers: { 1: 'yes' },
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Validation failed')
  })

  it('GET /api/characters/learned returns characters', async () => {
    const res = await request(app).get('/api/characters/learned')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.characters)).toBe(true)
    const found = res.body.characters.find((c: { name: string }) => c.name === TEST_CHARACTER.name)
    expect(found).toBeDefined()
    expect(found.description).toBe(TEST_CHARACTER.description)
    expect(found.category).toBe(TEST_CHARACTER.category)
  })

  it('GET /api/characters/learned filters by fingerprint', async () => {
    const res = await request(app).get(`/api/characters/learned?fingerprint=test-fp`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.characters)).toBe(true)
  })
})
