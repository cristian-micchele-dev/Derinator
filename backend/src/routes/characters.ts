import { Router } from 'express'
import { CharacterRepository, PlayerStatsRepository } from '../domain'
import { validateCharacterInput } from '../application/characterValidation'
import { rateLimitLearn, rateLimitPublic } from '../middleware/rateLimit'
import { LearnCharacterService } from '../application/LearnCharacterService'

function sanitizeConfirmerQuestion(raw: unknown): string | undefined {
  if (!raw || typeof raw !== 'string') return undefined
  const sanitized = raw.replace(/<[^>]*>/g, '').replace(/[<>"']/g, '').trim().slice(0, 200)
  return sanitized.length >= 5 ? sanitized : undefined
}

export function createCharactersRouter(
  characterRepo: CharacterRepository,
  statsRepo: PlayerStatsRepository,
): Router {
  const router = Router()
  const learnService = new LearnCharacterService(characterRepo, statsRepo)

  // GET /api/v1/characters?fingerprint=xxx
  router.get('/', rateLimitPublic, async (req, res) => {
    try {
      const { fingerprint } = req.query

      if (fingerprint !== undefined) {
        if (typeof fingerprint !== 'string' || !/^[a-zA-Z0-9_-]{8,64}$/.test(fingerprint)) {
          res.status(400).json({ error: 'Invalid fingerprint format' })
          return
        }
      }

      const characters = fingerprint
        ? await characterRepo.findByFingerprint(fingerprint as string)
        : await characterRepo.findAll()

      if (fingerprint) {
        // User-specific data — never cache in shared caches.
        res.set('Cache-Control', 'private, no-store')
      } else {
        // Public list — allow CDN/browser to cache for 30s.
        res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60')
      }

      res.json({ success: true, data: characters })
    } catch (err) {
      console.error('Error fetching learned characters:', err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  // POST /api/v1/characters
  router.post('/', rateLimitLearn, async (req, res) => {
    let validation: ReturnType<typeof validateCharacterInput> | undefined
    try {
      validation = validateCharacterInput(req.body)
      if (!validation.isValid) {
        return res.status(400).json({ error: 'Validation failed', details: validation.errors })
      }

      const fingerprint = req.body.fingerprint as string | undefined
      if (!fingerprint || !/^[a-zA-Z0-9_-]{8,64}$/.test(fingerprint)) {
        return res.status(400).json({ error: 'Missing or invalid fingerprint' })
      }

      const authHeader = req.headers['authorization']
      let token: string | undefined
      if (authHeader) {
        if (!authHeader.startsWith('Bearer ')) {
          return res.status(401).json({ error: 'Invalid player token' })
        }
        token = authHeader.slice(7)
      }

      const stringAnswers: Record<string, string> = {}
      for (const [k, v] of Object.entries(validation.answers)) {
        stringAnswers[k] = String(v)
      }

      const result = await learnService.execute({
        name: validation.name,
        description: validation.description,
        category: validation.category,
        subcategory: validation.subcategory ?? undefined,
        answers: stringAnswers,
        fingerprint,
        token,
        confirmerQuestion: sanitizeConfirmerQuestion(req.body.confirmerQuestion),
      })

      switch (result.type) {
        case 'created':
          return res.status(201).json({ success: true, name: result.name })
        case 'unauthorized':
          return res.status(401).json({ error: 'Invalid player token' })
        case 'rate_limited':
          return res.status(429).json({
            error: `Rate limit reached: maximum ${result.max} characters per hour`,
          })
        case 'duplicate':
          return res.status(409).json({ error: 'Character already exists', name: result.name })
      }
    } catch (err: unknown) {
      const pgErr = err as { code?: string }
      if (pgErr.code === '23505') {
        return res.status(409).json({ error: 'Character already exists', name: validation?.name })
      }
      console.error('Error saving learned character:', err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  // DELETE /api/v1/characters/:name  (admin only)
  router.delete('/:name', async (req, res) => {
    const adminSecret = process.env.ADMIN_SECRET
    if (!adminSecret) {
      return res.status(503).json({ error: 'Admin operations not configured' })
    }
    const authHeader = req.headers['authorization']
    if (!authHeader || authHeader !== `Bearer ${adminSecret}`) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const name = decodeURIComponent(req.params.name).trim()
    if (!name) {
      return res.status(400).json({ error: 'Missing character name' })
    }

    try {
      const deleted = await characterRepo.deleteByName(name)
      if (!deleted) {
        return res.status(404).json({ error: 'Character not found', name })
      }
      return res.json({ success: true, deleted: name })
    } catch (err) {
      console.error('Error deleting character:', err)
      return res.status(500).json({ error: 'Internal server error' })
    }
  })

  return router
}
