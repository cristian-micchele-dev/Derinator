import { CharacterRepository, PlayerStatsRepository } from '../domain'

const LEARN_RATE_LIMIT = 5   // max characters per fingerprint
const LEARN_RATE_WINDOW = 60 // in minutes

export interface LearnCharacterInput {
  name: string
  description: string
  category: string
  subcategory?: string
  answers: Record<string, string>
  fingerprint: string
  token?: string
  confirmerQuestion?: string
}

export type LearnResult =
  | { type: 'created'; name: string }
  | { type: 'unauthorized' }
  | { type: 'rate_limited'; max: number }
  | { type: 'duplicate'; name: string }

export class LearnCharacterService {
  constructor(
    private characterRepo: CharacterRepository,
    private statsRepo: PlayerStatsRepository,
  ) {}

  async execute(input: LearnCharacterInput): Promise<LearnResult> {
    // Soft Bearer token auth: validate if provided, allow if absent (offline-first)
    if (input.token) {
      const owner = await this.statsRepo.findByToken(input.token)
      if (!owner || owner.fingerprint !== input.fingerprint) {
        return { type: 'unauthorized' }
      }
    }

    // DB-based rate limit: persistent across restarts, per fingerprint
    const recent = await this.characterRepo.countRecentByFingerprint(
      input.fingerprint,
      LEARN_RATE_WINDOW,
    )
    if (recent >= LEARN_RATE_LIMIT) {
      return { type: 'rate_limited', max: LEARN_RATE_LIMIT }
    }

    // Duplicate check
    const exists = await this.characterRepo.findDuplicate(input.name, input.fingerprint)
    if (exists) {
      return { type: 'duplicate', name: input.name }
    }

    await this.characterRepo.create({
      name: input.name,
      description: input.description,
      category: input.category,
      subcategory: input.subcategory || 'otro',
      answers: input.answers,
      fingerprint: input.fingerprint,
      confirmerQuestion: input.confirmerQuestion,
    })

    return { type: 'created', name: input.name }
  }
}
