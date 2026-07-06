import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import { getDb } from '../infrastructure/db'
import { rateLimitLearn } from '../middleware/rateLimit'
import { PgPlayerStatsRepository } from '../infrastructure/repositories/PlayerStatsRepository'
import { PgCharacterRepository } from '../infrastructure/repositories/CharacterRepository'
import { PgGameHistoryRepository } from '../infrastructure/repositories/GameHistoryRepository'
import { createStatsRouter } from './stats'
import { createCharactersRouter } from './characters'

const TEST_FINGERPRINT = 'test-fingerprint-123'

let app: express.Express
let playerToken: string

beforeAll(async () => {
  const db = await getDb()

  const statsRepo = new PgPlayerStatsRepository(db)
  const characterRepo = new PgCharacterRepository(db)
  const historyRepo = new PgGameHistoryRepository(db)

  app = express()
  app.use(express.json())
  app.use('/api/v1/stats', createStatsRouter(statsRepo, historyRepo))
  app.use('/api/v1/characters', createCharactersRouter(characterRepo, statsRepo))
})

describe('Stats API', () => {
  it('GET /api/v1/stats/:fingerprint returns default stats for new player', async () => {
    const res = await request(app).get(`/api/v1/stats/${TEST_FINGERPRINT}`)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.derinator_wins).toBe(0)
    expect(res.body.data.user_wins).toBe(0)
    expect(res.body.data.fingerprint).toBe(TEST_FINGERPRINT)
  })

  it('PUT /api/v1/stats/:fingerprint creates new player stats', async () => {
    const stats = {
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

    const res = await request(app).put(`/api/v1/stats/${TEST_FINGERPRINT}`).send(stats)
    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.derinator_wins).toBe(5)
    expect(res.body.data.user_wins).toBe(3)
    expect(res.body.player_token).toBeDefined()
    playerToken = res.body.player_token
  })

  it('PUT /api/v1/stats/:fingerprint updates existing player', async () => {
    const stats = {
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
      .put(`/api/v1/stats/${TEST_FINGERPRINT}`)
      .set('Authorization', `Bearer ${playerToken}`)
      .send(stats)
    expect(res.status).toBe(200)
    expect(res.body.data.derinator_wins).toBe(10)
    expect(res.body.data.user_wins).toBe(5)
    expect(res.body.data.best_streak).toBe(6)
  })

  it('PUT /api/v1/stats/:fingerprint rejects invalid fingerprint', async () => {
    const res = await request(app).put('/api/v1/stats/short').send({
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

  it('POST /api/v1/stats/game records game history', async () => {
    const res = await request(app)
      .post('/api/v1/stats/game')
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

  it('POST /api/v1/stats/game rejects missing fields', async () => {
    const res = await request(app).post('/api/v1/stats/game').send({
      fingerprint: TEST_FINGERPRINT,
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Missing required fields')
  })

  it('POST /api/v1/stats/game rejects invalid result', async () => {
    const res = await request(app)
      .post('/api/v1/stats/game')
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

  it('POST /api/v1/stats/game rejects invalid category', async () => {
    const res = await request(app)
      .post('/api/v1/stats/game')
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

  it('POST /api/v1/stats/game sanitizes characterName HTML', async () => {
    const res = await request(app)
      .post('/api/v1/stats/game')
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

  it('GET /api/v1/stats/:fingerprint returns updated stats', async () => {
    const res = await request(app).get(`/api/v1/stats/${TEST_FINGERPRINT}`)
    expect(res.status).toBe(200)
    expect(res.body.data.derinator_wins).toBe(10)
    expect(res.body.data.user_wins).toBe(5)
  })
})

describe('Characters API', () => {
  const TEST_FINGERPRINT_CHAR = 'test-char-fp-01'
  const TEST_CHARACTER = {
    name: 'TestCharacter_' + Date.now(),
    description: 'A test character',
    category: 'personaje',
    subcategory: 'videojuego',
    fingerprint: TEST_FINGERPRINT_CHAR,
    answers: { 1: 'yes', 3: 'yes', 4: 'yes', 60: 'yes', 7: 'no' },
  }

  it('POST /api/v1/characters creates a new character', async () => {
    const res = await request(app).post('/api/v1/characters').send(TEST_CHARACTER)
    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.name).toBe(TEST_CHARACTER.name)
  })

  it('POST /api/v1/characters rejects duplicate', async () => {
    const res = await request(app).post('/api/v1/characters').send(TEST_CHARACTER)
    expect(res.status).toBe(409)
    expect(res.body.error).toBe('Character already exists')
  })

  it('POST /api/v1/characters rejects missing fingerprint', async () => {
    const { fingerprint: _fp, ...withoutFp } = TEST_CHARACTER
    const res = await request(app).post('/api/v1/characters').send(withoutFp)
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Missing or invalid fingerprint')
  })

  it('POST /api/v1/characters validates required fields', async () => {
    const res = await request(app).post('/api/v1/characters').send({
      description: 'Missing name',
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Validation failed')
  })

  it('POST /api/v1/characters validates category', async () => {
    const res = await request(app).post('/api/v1/characters').send({
      name: 'InvalidCat_' + Date.now(),
      description: 'Test',
      category: 'invalid',
      fingerprint: TEST_FINGERPRINT_CHAR,
      answers: { 1: 'yes' },
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Validation failed')
  })

  it('POST /api/v1/characters accepts Q500 (animal confirmer question)', async () => {
    const animalChar = {
      name: 'TestAnimal_' + Date.now(),
      description: 'An animal that barks',
      category: 'animal',
      fingerprint: TEST_FINGERPRINT_CHAR,
      answers: { 1: 'yes', 3: 'no', 500: 'yes', 7: 'no', 8: 'no' },
    }
    const res = await request(app).post('/api/v1/characters').send(animalChar)
    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
  })

  it('GET /api/v1/characters returns characters', async () => {
    const res = await request(app).get('/api/v1/characters')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    const found = res.body.data.find((c: { name: string }) => c.name === TEST_CHARACTER.name)
    expect(found).toBeDefined()
    expect(found.description).toBe(TEST_CHARACTER.description)
    expect(found.category).toBe(TEST_CHARACTER.category)
  })

  it('GET /api/v1/characters filters by fingerprint', async () => {
    const res = await request(app).get(`/api/v1/characters?fingerprint=test-fp-123`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  describe('Bearer token validation on POST /api/v1/characters', () => {
    let charToken: string

    beforeEach(() => {
      // Reset in-memory rate limiter — prior tests in this suite accumulate against 127.0.0.1
      rateLimitLearn.resetKey('::ffff:127.0.0.1')
      rateLimitLearn.resetKey('127.0.0.1')
      rateLimitLearn.resetKey('::1')
    })

    beforeAll(async () => {
      const res = await request(app).put(`/api/v1/stats/${TEST_FINGERPRINT_CHAR}`).send({
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
      charToken = res.body.player_token
    })

    it('accepts valid Bearer token for the correct fingerprint', async () => {
      const res = await request(app)
        .post('/api/v1/characters')
        .set('Authorization', `Bearer ${charToken}`)
        .send({
          name: 'TokenTest_' + Date.now(),
          category: 'personaje',
          fingerprint: TEST_FINGERPRINT_CHAR,
          answers: { 1: 'yes', 2: 'yes', 3: 'yes', 4: 'yes', 5: 'yes' },
        })
      expect(res.status).toBe(201)
    })

    it('rejects Bearer token belonging to a different fingerprint', async () => {
      const res = await request(app)
        .post('/api/v1/characters')
        .set('Authorization', `Bearer ${charToken}`)
        .send({
          name: 'TokenMismatch_' + Date.now(),
          category: 'personaje',
          fingerprint: TEST_FINGERPRINT,
          answers: { 1: 'yes', 2: 'yes', 3: 'yes', 4: 'yes', 5: 'yes' },
        })
      expect(res.status).toBe(401)
      expect(res.body.error).toBe('Invalid player token')
    })

    it('rejects unknown Bearer token', async () => {
      const res = await request(app)
        .post('/api/v1/characters')
        .set('Authorization', 'Bearer totally-fake-token-xyz')
        .send({
          name: 'FakeToken_' + Date.now(),
          category: 'personaje',
          fingerprint: TEST_FINGERPRINT_CHAR,
          answers: { 1: 'yes', 2: 'yes', 3: 'yes', 4: 'yes', 5: 'yes' },
        })
      expect(res.status).toBe(401)
      expect(res.body.error).toBe('Invalid player token')
    })

    it('rejects malformed Authorization header (not Bearer)', async () => {
      const res = await request(app)
        .post('/api/v1/characters')
        .set('Authorization', 'Basic sometoken')
        .send({
          name: 'MalformedAuth_' + Date.now(),
          category: 'personaje',
          fingerprint: TEST_FINGERPRINT_CHAR,
          answers: { 1: 'yes', 2: 'yes', 3: 'yes', 4: 'yes', 5: 'yes' },
        })
      expect(res.status).toBe(401)
    })

    it('allows request without Authorization header (offline-first)', async () => {
      const res = await request(app).post('/api/v1/characters').send({
        name: 'NoToken_' + Date.now(),
        category: 'personaje',
        fingerprint: TEST_FINGERPRINT_CHAR,
        answers: { 1: 'yes', 2: 'yes', 3: 'yes', 4: 'yes', 5: 'yes' },
      })
      expect(res.status).toBe(201)
    })
  })
})
