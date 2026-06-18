import { Router, Request, Response } from 'express'
import { PlayerStatsRepository, GameHistoryRepository, SyncStatsInput, PlayerStats } from '../domain'

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
  router.post('/sync', async (req: Request, res: Response) => {
    try {
      const body = req.body as SyncStatsInput
      const { fingerprint } = body

      if (!fingerprint || fingerprint.length < 8) {
        res.status(400).json({ error: 'Invalid fingerprint' })
        return
      }

      const result = await statsRepo.upsert(body)
      res.json({ success: true, data: toApiStats(result) })
    } catch (err) {
      console.error('Error syncing stats:', err)
      res.status(500).json({ error: 'Failed to sync stats' })
    }
  })

  // GET /api/stats/:fingerprint — Retrieve player stats
  router.get('/:fingerprint', async (req: Request, res: Response) => {
    try {
      const { fingerprint } = req.params

      if (!fingerprint || fingerprint.length < 8) {
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
  router.post('/game', async (req: Request, res: Response) => {
    try {
      const { fingerprint, characterName, result, questionsCount, category } = req.body

      if (!fingerprint || !characterName || !result) {
        res.status(400).json({ error: 'Missing required fields' })
        return
      }

      const playerId = await historyRepo.findPlayerId(fingerprint)

      if (!playerId) {
        res.status(404).json({ error: 'Player not found' })
        return
      }

      await historyRepo.create(playerId, characterName, result, questionsCount || 0, category || '')
      res.json({ success: true })
    } catch (err) {
      console.error('Error recording game:', err)
      res.status(500).json({ error: 'Failed to record game' })
    }
  })

  return router
}
