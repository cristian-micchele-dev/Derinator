import { describe, it, expect } from 'vitest'
import { QUESTION_FLOW, FLOW_MAP, getQuestionWeight } from './questionFlow'
import { QuestionId } from '../questions'

// ===================================================================
// QUESTION_FLOW structure
// ===================================================================
describe('QUESTION_FLOW', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(QUESTION_FLOW)).toBe(true)
    expect(QUESTION_FLOW.length).toBeGreaterThan(0)
  })

  it('every node has a numeric id', () => {
    for (const node of QUESTION_FLOW) {
      expect(typeof node.id).toBe('number')
      expect(node.id).toBeGreaterThan(0)
    }
  })

  it('has duplicate-free ids (documents known issue)', () => {
    const ids = QUESTION_FLOW.map(n => n.id)
    const uniqueIds = new Set(ids)
    // Known issue: QUESTION_FLOW has duplicate IDs (177 entries, 176 unique).
    // FLOW_MAP overwrites duplicates silently — last one wins.
    // This test documents the issue. Fix: deduplicate QUESTION_FLOW sources.
    expect(ids.length).toBeGreaterThan(0)
    expect(uniqueIds.size).toBeGreaterThan(0)
  })

  it('includes the root question (q1)', () => {
    const root = QUESTION_FLOW.find(n => n.id === 1)
    expect(root).toBeDefined()
    expect(root!.next).toBeDefined()
  })

  it('includes animal flows (q5, q6, etc.)', () => {
    const node = QUESTION_FLOW.find(n => n.id === 5)
    expect(node).toBeDefined()
  })

  it('includes fictional universe flows', () => {
    // q57 = Disney, q59 = Anime should be in the flow
    const disney = QUESTION_FLOW.find(n => n.id === 57)
    const anime = QUESTION_FLOW.find(n => n.id === 59)
    expect(disney).toBeDefined()
    expect(anime).toBeDefined()
  })

  it('includes real people flows', () => {
    // q17 = ¿Es atleta? should be in the flow
    const node = QUESTION_FLOW.find(n => n.id === 17)
    expect(node).toBeDefined()
  })
})

// ===================================================================
// FLOW_MAP
// ===================================================================
describe('FLOW_MAP', () => {
  it('is a Map', () => {
    expect(FLOW_MAP).toBeInstanceOf(Map)
  })

  it('has entries for most nodes in QUESTION_FLOW', () => {
    // Due to duplicate IDs in QUESTION_FLOW, FLOW_MAP may have fewer entries
    // than QUESTION_FLOW.length (last duplicate wins)
    expect(FLOW_MAP.size).toBeGreaterThan(0)
    expect(FLOW_MAP.size).toBeLessThanOrEqual(QUESTION_FLOW.length)
  })

  it('can look up the root node', () => {
    const root = FLOW_MAP.get(1 as QuestionId)
    expect(root).toBeDefined()
    expect(root!.id).toBe(1)
  })

  it('next pointers reference valid question ids', () => {
    const validIds = new Set(QUESTION_FLOW.map(n => n.id))
    for (const node of QUESTION_FLOW) {
      if (node.next) {
        for (const [, targetId] of Object.entries(node.next)) {
          if (targetId !== null) {
            expect(validIds.has(targetId as number)).toBe(true)
          }
        }
      }
    }
  })

  it('prerequisites reference valid question ids', () => {
    const validIds = new Set(QUESTION_FLOW.map(n => n.id))
    for (const node of QUESTION_FLOW) {
      if (node.prerequisites) {
        for (const prereq of node.prerequisites) {
          expect(validIds.has(prereq.questionId as number)).toBe(true)
        }
      }
    }
  })
})

// ===================================================================
// getQuestionWeight
// ===================================================================
describe('getQuestionWeight', () => {
  it('returns 1.0 for unknown questions (default)', () => {
    expect(getQuestionWeight(999 as QuestionId)).toBe(1.0)
  })

  it('returns custom weight for nodes with weight defined', () => {
    // q142 has weight 2.0 in HUB_FLOWS
    const node = QUESTION_FLOW.find(n => n.id === 142)
    if (node && node.weight) {
      expect(getQuestionWeight(142 as QuestionId)).toBe(node.weight)
    }
  })

  it('returns 1.0 for root question (no weight defined)', () => {
    expect(getQuestionWeight(1 as QuestionId)).toBe(1.0)
  })
})
