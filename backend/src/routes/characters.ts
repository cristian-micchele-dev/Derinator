import { Router } from 'express'
import { CharacterRepository } from '../domain'
import { rateLimit } from '../middleware/rateLimit'
import { validateCharacterInput } from '../validation/characterValidation'

export function createCharactersRouter(characterRepo: CharacterRepository): Router {
  const router = Router()

  // GET /api/characters/learned?fingerprint=xxx
  router.get('/learned', async (req, res) => {
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

      res.json({ characters })
    } catch (err) {
      console.error('Error fetching learned characters:', err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  // POST /api/characters/learn
  router.post('/learn', rateLimit, async (req, res) => {
    try {
      const validation = validateCharacterInput(req.body)

      if (!validation.isValid) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.errors,
        })
      }

      const { name, description, category, subcategory, answers } = validation
      const fingerprint = req.body.fingerprint as string | undefined

      const exists = await characterRepo.findDuplicate(name, fingerprint)

      if (exists) {
        return res.status(409).json({ error: 'Character already exists', name })
      }

      // Convert Record<number, string> → Record<string, string> for JSON storage
      const stringAnswers: Record<string, string> = {}
      for (const [k, v] of Object.entries(answers)) {
        stringAnswers[k] = v
      }

      await characterRepo.create({
        name,
        description,
        category,
        subcategory: subcategory || 'otro',
        answers: stringAnswers,
        fingerprint,
      })
      res.status(201).json({ success: true, name })
    } catch (err) {
      console.error('Error saving learned character:', err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  return router
}
