import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LearnCharacterService, LearnCharacterInput } from './LearnCharacterService'
import type { CharacterRepository, PlayerStatsRepository } from '../domain'

function makeInput(overrides: Partial<LearnCharacterInput> = {}): LearnCharacterInput {
  return {
    name: 'Goku',
    description: 'Saiyajin',
    category: 'personaje',
    answers: { '1': 'yes', '3': 'yes' },
    fingerprint: 'test-fp-123456',
    ...overrides,
  }
}

function makeCharRepo(overrides: Partial<CharacterRepository> = {}): CharacterRepository {
  return {
    findAll: vi.fn().mockResolvedValue([]),
    findByFingerprint: vi.fn().mockResolvedValue([]),
    findDuplicate: vi.fn().mockResolvedValue(false),
    create: vi.fn().mockResolvedValue(undefined),
    countRecentByFingerprint: vi.fn().mockResolvedValue(0),
    ...overrides,
  }
}

function makeStatsRepo(overrides: Partial<PlayerStatsRepository> = {}): PlayerStatsRepository {
  return {
    findByFingerprint: vi.fn().mockResolvedValue(null),
    findByToken: vi.fn().mockResolvedValue(null),
    upsert: vi.fn(),
    ...overrides,
  }
}

let service: LearnCharacterService
let characterRepo: CharacterRepository
let statsRepo: PlayerStatsRepository

beforeEach(() => {
  characterRepo = makeCharRepo()
  statsRepo = makeStatsRepo()
  service = new LearnCharacterService(characterRepo, statsRepo)
})

describe('LearnCharacterService', () => {
  it('returns created when all checks pass', async () => {
    const result = await service.execute(makeInput())
    expect(result).toEqual({ type: 'created', name: 'Goku' })
    expect(characterRepo.create).toHaveBeenCalledOnce()
  })

  it('returns unauthorized when token is provided but not found in DB', async () => {
    statsRepo.findByToken = vi.fn().mockResolvedValue(null)
    const result = await service.execute(makeInput({ token: 'bad-token' }))
    expect(result).toEqual({ type: 'unauthorized' })
    expect(characterRepo.create).not.toHaveBeenCalled()
  })

  it('returns unauthorized when token fingerprint does not match', async () => {
    statsRepo.findByToken = vi.fn().mockResolvedValue({
      fingerprint: 'other-fp-999999',
      playerToken: 'valid-token',
      derinatorWins: 0,
      userWins: 0,
      currentStreak: 0,
      bestStreak: 0,
      totalGames: 0,
      achievements: '[]',
      hallOfFame: '[]',
      dailyGuessed: false,
      dailyGuesses: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    const result = await service.execute(makeInput({ token: 'valid-token' }))
    expect(result).toEqual({ type: 'unauthorized' })
    expect(characterRepo.create).not.toHaveBeenCalled()
  })

  it('allows request when token matches fingerprint', async () => {
    const fp = 'test-fp-123456'
    statsRepo.findByToken = vi.fn().mockResolvedValue({
      fingerprint: fp,
      playerToken: 'valid-token',
      derinatorWins: 0,
      userWins: 0,
      currentStreak: 0,
      bestStreak: 0,
      totalGames: 0,
      achievements: '[]',
      hallOfFame: '[]',
      dailyGuessed: false,
      dailyGuesses: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    const result = await service.execute(makeInput({ token: 'valid-token', fingerprint: fp }))
    expect(result).toEqual({ type: 'created', name: 'Goku' })
    expect(characterRepo.create).toHaveBeenCalledOnce()
  })

  it('skips token check when no token provided', async () => {
    const result = await service.execute(makeInput({ token: undefined }))
    expect(result).toEqual({ type: 'created', name: 'Goku' })
    expect(statsRepo.findByToken).not.toHaveBeenCalled()
  })

  it('returns rate_limited when countRecentByFingerprint >= 5', async () => {
    characterRepo.countRecentByFingerprint = vi.fn().mockResolvedValue(5)
    const result = await service.execute(makeInput())
    expect(result).toEqual({ type: 'rate_limited', max: 5 })
    expect(characterRepo.create).not.toHaveBeenCalled()
  })

  it('returns rate_limited when count exceeds limit', async () => {
    characterRepo.countRecentByFingerprint = vi.fn().mockResolvedValue(10)
    const result = await service.execute(makeInput())
    expect(result.type).toBe('rate_limited')
    expect(characterRepo.create).not.toHaveBeenCalled()
  })

  it('allows creation when count is exactly 4 (below limit)', async () => {
    characterRepo.countRecentByFingerprint = vi.fn().mockResolvedValue(4)
    const result = await service.execute(makeInput())
    expect(result.type).toBe('created')
  })

  it('returns duplicate when findDuplicate returns true', async () => {
    characterRepo.findDuplicate = vi.fn().mockResolvedValue(true)
    const result = await service.execute(makeInput())
    expect(result).toEqual({ type: 'duplicate', name: 'Goku' })
    expect(characterRepo.create).not.toHaveBeenCalled()
  })

  it('passes subcategory to create (defaults to "otro" when undefined)', async () => {
    await service.execute(makeInput({ subcategory: undefined }))
    expect(characterRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ subcategory: 'otro' })
    )
  })

  it('passes provided subcategory to create', async () => {
    await service.execute(makeInput({ subcategory: 'anime' }))
    expect(characterRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ subcategory: 'anime' })
    )
  })

  it('passes confirmerQuestion to create when provided', async () => {
    await service.execute(makeInput({ confirmerQuestion: 'Is it a superhero?' }))
    expect(characterRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ confirmerQuestion: 'Is it a superhero?' })
    )
  })

  it('order of checks: token before rate limit', async () => {
    characterRepo.countRecentByFingerprint = vi.fn().mockResolvedValue(99)
    statsRepo.findByToken = vi.fn().mockResolvedValue(null)

    const result = await service.execute(makeInput({ token: 'bad-token' }))
    expect(result.type).toBe('unauthorized')
    // rate limit check not reached
    expect(characterRepo.countRecentByFingerprint).not.toHaveBeenCalled()
  })

  it('order of checks: rate limit before duplicate', async () => {
    characterRepo.countRecentByFingerprint = vi.fn().mockResolvedValue(5)
    characterRepo.findDuplicate = vi.fn().mockResolvedValue(true)

    const result = await service.execute(makeInput())
    expect(result.type).toBe('rate_limited')
    expect(characterRepo.findDuplicate).not.toHaveBeenCalled()
  })
})
