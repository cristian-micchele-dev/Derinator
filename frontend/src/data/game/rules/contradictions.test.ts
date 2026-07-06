import { describe, it, expect } from 'vitest'
import { CONTRADICTIONS, buildContradictions } from './contradictions'
import { questions } from '../../questions'
import { EXCLUSIVE_GROUPS } from '../learnModeConfig'
import { UNIVERSE_QUESTIONS } from '../questionGroups'

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

describe('EXCLUSIVE_GROUPS / CONTRADICTIONS sync', () => {
  const contradictionIndex = new Set(
    CONTRADICTIONS.map(([srcId, , excludeId]) => `${srcId},${excludeId}`)
  )

  /**
   * Universe questions: every pair in EXCLUSIVE_GROUPS must have a CONTRADICTION.
   */
  it('every universe question pair in EXCLUSIVE_GROUPS has a CONTRADICTION', () => {
    const universeSet = new Set(UNIVERSE_QUESTIONS)

    for (const group of EXCLUSIVE_GROUPS) {
      const universeIds = group.filter(id => universeSet.has(id))
      if (universeIds.length < 2) continue

      for (const a of universeIds) {
        for (const b of universeIds) {
          if (a === b) continue
          expect(
            contradictionIndex.has(`${a},${b}`),
            `EXCLUSIVE_GROUPS has Q${a}+Q${b} in the same group, ` +
            `but CONTRADICTIONS is missing: Q${a}=yes → exclude Q${b}. ` +
            `Add Q${a} to the UNIVERSES array in contradictions.ts.`
          ).toBe(true)
        }
      }
    }
  })

  /**
   * Music genres: every pair must have a CONTRADICTION.
   */
  it('every music genre pair in EXCLUSIVE_GROUPS has a CONTRADICTION', () => {
    const GENRE_IDS = [154, 155, 156, 157]
    for (const a of GENRE_IDS) {
      for (const b of GENRE_IDS) {
        if (a === b) continue
        expect(
          contradictionIndex.has(`${a},${b}`),
          `Music genres: CONTRADICTIONS missing Q${a}=yes → exclude Q${b}`
        ).toBe(true)
      }
    }
  })

  /**
   * Q45 (Europeo) must NOT be in the same exclusive group as specific countries.
   * Being European is regional, not a nationality — it must not block asking Spain/UK/etc.
   */
  it('Q45 (Europeo) does not contradict specific European countries', () => {
    const EUROPEAN_COUNTRIES = [183, 184, 185, 186] // España, UK, Italia, Francia
    for (const c of EUROPEAN_COUNTRIES) {
      expect(
        contradictionIndex.has(`45,${c}`),
        `Q45=yes should NOT exclude Q${c} — European includes being from that country`
      ).toBe(false)
    }
  })
})
