import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import { getDb, initDb } from './db'
import { PgPlayerStatsRepository } from './infrastructure/repositories/PlayerStatsRepository'
import { PgCharacterRepository } from './infrastructure/repositories/CharacterRepository'
import { PgGameHistoryRepository } from './infrastructure/repositories/GameHistoryRepository'
import { createStatsRouter } from './routes/stats'
import { createCharactersRouter } from './routes/characters'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'

dotenv.config()

async function main() {
  const app = express()
  const PORT = process.env.PORT || 4000

  const corsOrigin = process.env.CORS_ORIGIN
  app.set('trust proxy', 1)
  // Pure JSON API — no HTML served, so full CSP is unnecessary.
  // Explicit frameguard + noSniff (both are helmet defaults, made explicit for clarity).
  app.use(helmet({
    frameguard: { action: 'deny' },
    noSniff: true,
    contentSecurityPolicy: false,
  }))
  app.use(cors(corsOrigin
    ? { origin: corsOrigin.split(',').map(o => o.trim()) }
    : { origin: false }
  ))
  app.use(express.json())

  // Initialize DB and run migrations
  await initDb()
  const db = getDb()

  // Create repositories (infrastructure implementations of domain ports)
  const statsRepo = new PgPlayerStatsRepository(db)
  const characterRepo = new PgCharacterRepository(db)
  const historyRepo = new PgGameHistoryRepository(db)

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  app.use('/api/stats', createStatsRouter(statsRepo, historyRepo))
  app.use('/api/characters', createCharactersRouter(characterRepo))

  // 404 handler
  app.use(notFoundHandler)

  // Global error handler (must be last)
  app.use(errorHandler)

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

main().catch(console.error)
