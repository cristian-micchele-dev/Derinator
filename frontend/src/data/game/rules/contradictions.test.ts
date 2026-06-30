import { describe, it, expect } from 'vitest'
import { CONTRADICTIONS, buildContradictions } from './contradictions'
import { questions } from '../../questions'

const VALID_IDS = new Set(questions.map(q => q.id))
const VALID_ANSWERS = new Set(['yes', 'no', 'probably', 'probably_not', 'dont_know'])

describe('CONTRADICTIONS rules', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(CONTRADICTIONS)).toBe(true)
    expect(CONTRADICTIONS.length).toBeGreaterThan(0)
  })

  it('every rule has exactly 3 elements [srcId, srcAnswer, excludeId]', () => {
    for (let i = 0; i < CONTRADICTIONS.length; i++) {
      expect(CONTRADICTIONS[i]).toHaveLength(3)
    }
  })

  it('every source question ID is valid', () => {
    for (const [srcId] of CONTRADICTIONS) {
      expect(VALID_IDS.has(srcId), `Invalid source ID: ${srcId}`).toBe(true)
    }
  })

  it('every excluded question ID is valid', () => {
    for (const [, , excludeId] of CONTRADICTIONS) {
      expect(VALID_IDS.has(excludeId), `Invalid exclude ID: ${excludeId}`).toBe(true)
    }
  })

  it('every source answer is valid', () => {
    for (const [srcId, srcAnswer] of CONTRADICTIONS) {
      expect(VALID_ANSWERS.has(srcAnswer), `Invalid answer "${srcAnswer}" for source ID ${srcId}`).toBe(true)
    }
  })

  it('no rule excludes itself (srcId !== excludeId)', () => {
    for (const [srcId, , excludeId] of CONTRADICTIONS) {
      expect(srcId !== excludeId, `Self-contradiction: ${srcId}`).toBe(true)
    }
  })

  it('no exact duplicate rules', () => {
    const seen = new Set<string>()
    for (const rule of CONTRADICTIONS) {
      const key = rule.join(',')
      expect(seen.has(key), `Duplicate contradiction: [${key}]`).toBe(false)
      seen.add(key)
    }
  })

  it('buildContradictions returns a stable result', () => {
    const first = buildContradictions()
    const second = buildContradictions()
    expect(first).toEqual(second)
  })
})
