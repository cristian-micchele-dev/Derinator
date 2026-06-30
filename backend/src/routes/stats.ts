import { Router, Request, Response } from 'express'
import { PlayerStatsRepository, GameHistoryRepository, SyncStatsInput, PlayerStats } from '../domain'
import { sanitizeInput } from '../validation/characterValidation'
import { rateLimitStats } from '../middleware/rateLimit'

const VALID_RESULTS = ['derinator_win', 'user_win'] as const
const VALID_GAME_CATEGORIES = ['all', 'personajes', 'animales', 'famosos', ''] as const
const MAX_CHARACTER_NAME_LENGTH = 100
const MAX_QUESTIONS_COUNT = 500
const FINGERPRINT_REGEX = /^[a-zA-Z0-9_-]{8,64}$/

function isValidFingerprint(fp: unknown): fp is string {
  return typeof fp === 'string' && FINGERPRINT_REGEX.test(fp)
}

function extractBearerToken(req: Request): string | null {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) return null
  return auth.slice(7).trim() || null
}

/** Convert domain entity → API response format (snake_case, matching DB columns) */
function toApiStats(s: PlayerStats) {
  return {
    fingerprint: s.fingerprint,
    derinator_wins: s.derinatorWins,
    user_wins: s.userWins,
    current_streak: s.currentStreak,
    best_streak: s.bestStreak,
    total_games: s.totalGames,
    achievements: s.achievements,
    hall_of_fame: s.hallOfFame,
    daily_guessed: s.dailyGuessed,
    daily_guesses: s.dailyGuesses,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
  }
}

export function createStatsRouter(
  statsRepo: PlayerStatsRepository,
  historyRepo: GameHistoryRepository
): Router {
  const router = Router()

  // POST /api/stats/sync — Save or update player stats
  router.post('/sync', rateLimitStats, async (req: Request, res: Response) => {
    try {
      const body = req.body as SyncStatsInput
      const { fingerprint } = body

      if (!isValidFingerprint(fingerprint)) {
        res.status(400).json({ error: 'Invalid fingerprint' })
        return
      }

      const existing = await statsRepo.findByFingerprint(fingerprint)

      if (existing) {
        // Player exists — require a valid token to update
        const token = extractBearerToken(req)
        if (!token || existing.playerToken !== token) {
          res.status(401).json({ error: 'Invalid or missing player token' })
          return
        }
        const result = await statsRepo.upsert(body)
        res.json({ success: true, data: toApiStats(result) })
      } else {
        // New player — create and return the generated token
        const result = await statsRepo.upsert(body)
        res.json({ success: true, data: toApiStats(result), player_token: result.playerToken })
      }
    } catch (err) {
      console.error('Error syncing stats:', err)
      res.status(500).json({ error: 'Failed to sync stats' })
    }
  })

  // GET /api/stats/:fingerprint — Retrieve player stats
  router.get('/:fingerprint', async (req: Request, res: Response) => {
    try {
      const { fingerprint } = req.params

      if (!isValidFingerprint(fingerprint)) {
        res.status(400).json({ error: 'Invalid fingerprint' })
        return
      }

      const stats = await statsRepo.findByFingerprint(fingerprint)

      if (!stats) {
        res.json({
          success: true,
          data: {
            fingerprint,
            derinator_wins: 0,
            user_wins: 0,
            current_streak: 0,
            best_streak: 0,
            total_games: 0,
            achievements: '[]',
            hall_of_fame: '[]',
            daily_guessed: 0,
            daily_guesses: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        })
        return
      }

      res.json({ success: true, data: toApiStats(stats) })
    } catch (err) {
      console.error('Error fetching stats:', err)
      res.status(500).json({ error: 'Failed to fetch stats' })
    }
  })

  // POST /api/stats/game — Record a single game result
  router.post('/game', rateLimitStats, async (req: Request, res: Response) => {
    try {
      const { fingerprint, result, questionsCount, category } = req.body
      const rawName = req.body.characterName

      if (!isValidFingerprint(fingerprint) || !rawName || !result) {
        res.status(400).json({ error: 'Missing required fields' })
        return
      }

      if (typeof rawName !== 'string') {
        res.status(400).json({ error: 'characterName must be a string' })
        return
      }

      const characterName = sanitizeInput(rawName, MAX_CHARACTER_NAME_LENGTH)
      if (characterName.length < 1) {
        res.status(400).json({ error: 'characterName is empty after sanitization' })
        return
      }

      if (!VALID_RESULTS.includes(result)) {
        res.status(400).json({ error: `Invalid result. Allowed values: ${VALID_RESULTS.join(', ')}` })
        return
      }

      const sanitizedCategory = typeof category === 'string' ? category.trim() : ''
      if (!VALID_GAME_CATEGORIES.includes(sanitizedCategory as typeof VALID_GAME_CATEGORIES[number])) {
        res.status(400).json({ error: `Invalid category` })
        return
      }

      const parsedCount = Number.isInteger(questionsCount) && questionsCount >= 0
        ? Math.min(questionsCount, MAX_QUESTIONS_COUNT)
        : 0

      const token = extractBearerToken(req)
      if (!token) {
        res.status(401).json({ error: 'Missing player token' })
        return
      }

      const tokenOwner = await statsRepo.findByToken(token)
      if (!tokenOwner || tokenOwner.fingerprint !== fingerprint) {
        res.status(401).json({ error: 'Invalid player token' })
        return
      }

      const playerId = await historyRepo.findPlayerId(fingerprint)

      if (!playerId) {
        res.status(404).json({ error: 'Player not found' })
        return
      }

      await historyRepo.create(playerId, characterName, result, parsedCount, sanitizedCategory)
      res.json({ success: true })
    } catch (err) {
      console.error('Error recording game:', err)
      res.status(500).json({ error: 'Failed to record game' })
    }
  })

  return router
}
