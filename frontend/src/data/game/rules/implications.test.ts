import { describe, it, expect } from 'vitest'
import { IMPLICATIONS } from './implications'
import { questions } from '../../questions'

const VALID_IDS = new Set(questions.map(q => q.id))
const VALID_ANSWERS = new Set(['yes', 'no', 'probably', 'probably_not', 'dont_know'])

describe('IMPLICATIONS rules', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(IMPLICATIONS)).toBe(true)
    expect(IMPLICATIONS.length).toBeGreaterThan(0)
  })

  it('every rule has exactly 4 elements [srcId, srcAnswer, targetId, targetAnswer]', () => {
    for (let i = 0; i < IMPLICATIONS.length; i++) {
      expect(IMPLICATIONS[i]).toHaveLength(4)
    }
  })

  it('every source question ID is valid', () => {
    for (const [srcId] of IMPLICATIONS) {
      expect(VALID_IDS.has(srcId), `Invalid source ID: ${srcId}`).toBe(true)
    }
  })

  it('every target question ID is valid', () => {
    for (const [, , targetId] of IMPLICATIONS) {
      expect(VALID_IDS.has(targetId), `Invalid target ID: ${targetId}`).toBe(true)
    }
  })

  it('every source answer is valid', () => {
    for (const [srcId, srcAnswer] of IMPLICATIONS) {
      expect(VALID_ANSWERS.has(srcAnswer), `Invalid answer "${srcAnswer}" for source ID ${srcId}`).toBe(true)
    }
  })

  it('every target answer is valid', () => {
    for (const [srcId, , targetId, targetAnswer] of IMPLICATIONS) {
      expect(VALID_ANSWERS.has(targetAnswer), `Invalid answer "${targetAnswer}" for ${srcId}->${targetId}`).toBe(true)
    }
  })

  it('no rule implies itself (srcId !== targetId)', () => {
    for (const [srcId, , targetId] of IMPLICATIONS) {
      expect(srcId !== targetId, `Self-implication: ${srcId}`).toBe(true)
    }
  })

  it('no exact duplicate rules', () => {
    const seen = new Set<string>()
    for (const rule of IMPLICATIONS) {
      const key = rule.join(',')
      expect(seen.has(key), `Duplicate implication: [${key}]`).toBe(false)
      seen.add(key)
    }
  })

  it('no circular implications (A→B and B→A with same answers)', () => {
    const ruleSet = new Set(
      IMPLICATIONS.map(([s, sa, t, ta]) => `${s},${sa},${t},${ta}`)
    )
    for (const [srcId, srcAnswer, targetId, targetAnswer] of IMPLICATIONS) {
      const reverse = `${targetId},${targetAnswer},${srcId},${srcAnswer}`
      expect(ruleSet.has(reverse), `Circular: [${srcId},${srcAnswer}] <-> [${targetId},${targetAnswer}]`).toBe(false)
    }
  })

  it('no contradictory implications (same source implies both yes and no for same target)', () => {
    const map = new Map<string, string[]>()
    for (const [srcId, srcAnswer, targetId, targetAnswer] of IMPLICATIONS) {
      const key = `${srcId},${srcAnswer},${targetId}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(targetAnswer)
    }
    for (const [key, answers] of map) {
      const hasYes = answers.includes('yes')
      const hasNo = answers.includes('no')
      expect(
        !(hasYes && hasNo),
        `Contradictory implications for [${key}]: implies both yes and no`
      ).toBe(true)
    }
  })
})
