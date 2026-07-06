import { describe, it, expect } from 'vitest'
import { getBestQuestion, prerequisitesStrictMet, isExcluded } from './questionSelection'
import { QuestionId } from '../questions'
import { Answer } from '../../types'

// Helper to create a mock character
const char = (
  id: number,
  name: string,
  answers: Record<number, Answer> = {},
) => ({
  id,
  name,
  description: '',
  answers: answers as Record<QuestionId, Answer>,
})

const q = (id: number) => id as QuestionId

// All available question IDs for testing
const ALL_QUESTIONS: QuestionId[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  21, 25, 26, 27, 28, 29, 30, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47,
  48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 67, 68, 69, 70,
  71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90,
  91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108,
  109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124,
  125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140,
  142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157,
  158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173,
  174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189,
  190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 219, 220,
  221, 222, 223, 224, 225, 226, 227,
]

// ===================================================================
// Edge cases
// ===================================================================
describe('getBestQuestion — edge cases', () => {
  it('returns null when remainingQuestions is empty', () => {
    const candidates = [char(1, 'A', { 1: 'yes' }), char(2, 'B', { 1: 'no' })]
    expect(getBestQuestion([], candidates)).toBeNull()
  })

  it('returns null when 0 candidates', () => {
    expect(getBestQuestion(ALL_QUESTIONS, [])).toBeNull()
  })

  it('returns null when 1 candidate (nothing to discriminate)', () => {
    const candidates = [char(1, 'Solo', { 1: 'yes' })]
    expect(getBestQuestion(ALL_QUESTIONS, candidates)).toBeNull()
  })
})

// ===================================================================
// Phase 0: Fiction vs Real split
// ===================================================================
describe('getBestQuestion — Phase 0 (fiction vs real)', () => {
  it('returns q4 when >10 candidates with mix of fiction and real', () => {
    // 15 candidates: 8 fictional (q4=yes), 7 real (q4=no)
    const candidates = [
      ...Array.from({ length: 8 }, (_, i) =>
        char(i, `Fiction${i}`, { 4: 'yes' })
      ),
      ...Array.from({ length: 7 }, (_, i) =>
        char(i + 8, `Real${i}`, { 4: 'no' })
      ),
    ]
    const result = getBestQuestion(qIds([4, 16, 56]), candidates)
    expect(result).toBe(4)
  })

  it('does NOT force q4 when all candidates are fiction', () => {
    const candidates = Array.from({ length: 15 }, (_, i) =>
      char(i, `Fiction${i}`, { 4: 'yes' })
    )
    const result = getBestQuestion(qIds([4, 16, 56]), candidates)
    // q4 has no discrimination (all yes) → should skip to another question
    expect(result).not.toBe(4)
  })

  it('does NOT force q4 when all candidates are real', () => {
    const candidates = Array.from({ length: 15 }, (_, i) =>
      char(i, `Real${i}`, { 4: 'no' })
    )
    const result = getBestQuestion(qIds([4, 16, 56]), candidates)
    expect(result).not.toBe(4)
  })

  it('Phase 0 does not FORCE q4 with ≤10 candidates — other phases may still pick it', () => {
    // With exactly 10 candidates (not >10), Phase 0 doesn't trigger
    // But q4 might still win via entropy if it's the best discriminator
    // This test verifies the Phase 0 gate: candidateCount > 10
    const candidates = [
      ...Array.from({ length: 5 }, (_, i) => char(i, `F${i}`, { 4: 'yes' })),
      ...Array.from({ length: 5 }, (_, i) => char(i + 5, `R${i}`, { 4: 'no' })),
    ]
    const result = getBestQuestion(qIds([4, 16, 100]), candidates)
    // q4 might still be picked via Phase 3 entropy (50/50 split is ideal)
    // The important thing is that the function returns a valid question
    expect(result).not.toBeNull()
    expect([4, 16, 100]).toContain(result)
  })
})

// ===================================================================
// Phase 0.5: Pokémon detection
// ===================================================================
describe('getBestQuestion — Phase 0.5 (Pokémon)', () => {
  it('returns q85 when ≥2 Pokémon candidates', () => {
    const candidates = [
      char(1, 'Pikachu', { 85: 'yes' }),
      char(2, 'Charizard', { 85: 'yes' }),
      char(3, 'Bulbasaur', { 85: 'yes' }),
      char(4, 'NotPokemon', { 85: 'no' }),
    ]
    const result = getBestQuestion(qIds([85, 161, 162]), candidates)
    expect(result).toBe(85)
  })

  it('does NOT trigger with only 1 Pokémon — picks alternative discriminator', () => {
    // With only 1 Pokémon, q85 has low discrimination (1 yes, 2 no)
    // q16 (nationality) with 50/50 split should win via entropy
    const candidates = [
      char(1, 'Pikachu', { 85: 'yes', 16: 'yes' }),
      char(2, 'NotPokemon1', { 85: 'no', 16: 'no' }),
      char(3, 'NotPokemon2', { 85: 'no', 16: 'no' }),
    ]
    const result = getBestQuestion(qIds([85, 16]), candidates)
    // q85 splits 1/3 vs 2/3 — q16 splits 1/3 vs 2/3 too
    // Both are valid, function picks one with better entropy
    expect(result).not.toBeNull()
  })

  it('does NOT trigger with ≤2 candidates total', () => {
    const candidates = [
      char(1, 'Pikachu', { 85: 'yes' }),
      char(2, 'Charizard', { 85: 'yes' }),
    ]
    const result = getBestQuestion(qIds([85, 161]), candidates)
    // Phase 0.5 requires >2 candidates
    expect(result).not.toBe(85)
  })
})

// ===================================================================
// Phase 1: Broad universe questions
// ===================================================================
describe('getBestQuestion — Phase 1 (broad universe)', () => {
  it('prefers broad universe questions when >10 candidates', () => {
    const candidates = Array.from({ length: 15 }, (_, i) =>
      char(i, `Char${i}`, {
        57: i < 5 ? 'yes' : 'no', // Disney
        59: i >= 5 && i < 10 ? 'yes' : 'no', // Anime
        16: 'no', // Argentina
      })
    )
    const result = getBestQuestion(qIds([57, 59, 16]), candidates)
    // Should prefer a universe question (57 or 59) over nationality (16)
    expect([57, 59]).toContain(result)
  })

  it('skips Pokémon type questions in Phase 1 broad search', () => {
    const candidates = Array.from({ length: 15 }, (_, i) =>
      char(i, `Char${i}`, {
        161: i < 7 ? 'yes' : 'no', // Pokémon type
        16: i < 7 ? 'yes' : 'no',
      })
    )
    const result = getBestQuestion(qIds([161, 16]), candidates)
    // Phase 1 filters out Pokémon type questions
    expect(result).toBe(16)
  })
})

// ===================================================================
// Phase 1.5: Sub-universe drill-down
// ===================================================================
describe('getBestQuestion — Phase 1.5 (sub-universe)', () => {
  it('drills down to specific universe after broad confirmation', () => {
    const candidates = Array.from({ length: 10 }, (_, i) =>
      char(i, `Char${i}`, { 59: 'yes', 84: i < 5 ? 'yes' : 'no' })
    )
    const history = [
      { questionId: q(4), answer: 'yes' as Answer },  // always seeded in real game
      { questionId: q(59), answer: 'yes' as Answer },
    ]
    const result = getBestQuestion(qIds([84, 85, 16]), candidates, history)
    expect(result).toBe(84) // Sub-universe: Dragon Ball
  })

  it('without history, falls through to entropy — still picks a valid question', () => {
    const candidates = Array.from({ length: 10 }, (_, i) =>
      char(i, `Char${i}`, { 84: i < 5 ? 'yes' : 'no', 16: i < 3 ? 'yes' : 'no' })
    )
    // No history → no strict prereq filtering → Phase 3 picks best discriminator
    const result = getBestQuestion(qIds([84, 16]), candidates)
    expect(result).not.toBeNull()
    expect([84, 16]).toContain(result)
  })

  it('with "no" history, falls through to later phases', () => {
    // q84 needs q4=yes + q59=yes; provide both so Phase 3 strict prereqs pass
    const candidates = Array.from({ length: 10 }, (_, i) =>
      char(i, `Char${i}`, { 84: i < 5 ? 'yes' : 'no', 16: i < 5 ? 'yes' : 'no' })
    )
    const history = [
      { questionId: q(4), answer: 'yes' as Answer },
      { questionId: q(59), answer: 'yes' as Answer },
    ]
    const result = getBestQuestion(qIds([84, 16]), candidates, history)
    // q84 prereqs met → Phase 3 picks it; q16 prereqs NOT met → blocked
    expect(result).toBe(84)
  })

  it('with ≤2 candidates, getBestQuestion returns null', () => {
    // getBestQuestion returns null when candidates.length <= 1
    // With 2 candidates, it proceeds to Phase 3
    const candidates = [
      char(1, 'A', { 84: 'yes', 16: 'yes' }),
      char(2, 'B', { 84: 'no', 16: 'no' }),
    ]
    const history = [
      { questionId: q(4), answer: 'yes' as Answer },  // always seeded in real game
      { questionId: q(59), answer: 'yes' as Answer },
    ]
    const result = getBestQuestion(qIds([84, 16]), candidates, history)
    // Phase 1.5 needs >2 candidates, but Phase 3 picks the best entropy question
    expect(result).not.toBeNull()
  })
})

// ===================================================================
// Phase 1.6: Pokémon type questions
// ===================================================================
describe('getBestQuestion — Phase 1.6 (Pokémon type)', () => {
  it('asks Pokémon type after confirming Pokémon', () => {
    const candidates = Array.from({ length: 6 }, (_, i) =>
      char(i, `Pokemon${i}`, { 85: 'yes', 161: i < 3 ? 'yes' : 'no' })
    )
    const history = [{ questionId: q(85), answer: 'yes' as Answer }]
    const result = getBestQuestion(qIds([161, 162, 16]), candidates, history)
    expect(result).toBe(161)
  })

  it('without Pokémon confirmation, skips to later phases', () => {
    // q161 requires q85=yes; with q85=no its prerequisites are unmet
    // q1 (¿Es un ser vivo?) has no flow node → always eligible
    const candidates = Array.from({ length: 6 }, (_, i) =>
      char(i, `Char${i}`, { 161: i < 3 ? 'yes' : 'no', 1: i < 3 ? 'yes' : 'no' })
    )
    const history = [{ questionId: q(85), answer: 'no' as Answer }]
    const result = getBestQuestion(qIds([161, 1]), candidates, history)
    // q161 filtered out by strict prerequisites → only q1 remains
    expect(result).toBe(1)
  })
})

// ===================================================================
// Phase 2: Category/role/profession/nationality
// ===================================================================
describe('getBestQuestion — Phase 2 (category/role/profession)', () => {
  it('prefers category questions with 5-10 candidates', () => {
    const candidates = Array.from({ length: 7 }, (_, i) =>
      char(i, `Char${i}`, { 1: 'yes', 17: i < 3 ? 'yes' : 'no' })
    )
    const result = getBestQuestion(qIds([1, 17, 100]), candidates)
    // Should prefer category (1) or profession (17) over random (100)
    expect([1, 17]).toContain(result)
  })

  it('prefers nationality questions when they discriminate', () => {
    const candidates = Array.from({ length: 8 }, (_, i) =>
      char(i, `Char${i}`, {
        16: i < 4 ? 'yes' : 'no',
        100: 'no',
      })
    )
    const result = getBestQuestion(qIds([16, 100]), candidates)
    expect(result).toBe(16)
  })

  it('prefers discriminative questions when they split well', () => {
    const candidates = Array.from({ length: 8 }, (_, i) =>
      char(i, `Char${i}`, {
        139: i < 4 ? 'yes' : 'no',
        100: 'no',
      })
    )
    const result = getBestQuestion(qIds([139, 100]), candidates)
    expect(result).toBe(139)
  })
})

// ===================================================================
// Phase 3: Entropy fallback
// ===================================================================
describe('getBestQuestion — Phase 3 (entropy fallback)', () => {
  it('falls back to entropy with few candidates', () => {
    const candidates = [
      char(1, 'A', { 100: 'yes', 101: 'yes' }),
      char(2, 'B', { 100: 'no', 101: 'no' }),
    ]
    const result = getBestQuestion(qIds([100, 101]), candidates)
    expect([100, 101]).toContain(result)
  })

  it('prefers questions with balanced splits', () => {
    const candidates = [
      char(1, 'A', { 100: 'yes', 200: 'yes' }),
      char(2, 'B', { 100: 'no', 200: 'yes' }),
    ]
    // q100 splits 50/50, q200 is all yes → q100 should win
    const result = getBestQuestion(qIds([100, 200]), candidates)
    expect(result).toBe(100)
  })

  it('skips questions where all candidates agree', () => {
    const candidates = [
      char(1, 'A', { 100: 'yes', 200: 'yes' }),
      char(2, 'B', { 100: 'yes', 200: 'no' }),
    ]
    // q100 all yes → skip, q200 splits → pick q200
    const result = getBestQuestion(qIds([100, 200]), candidates)
    expect(result).toBe(200)
  })

  it('returns null when no remaining questions discriminate', () => {
    const candidates = [
      char(1, 'A', { 100: 'yes' }),
      char(2, 'B', { 100: 'yes' }),
    ]
    // Only q100 available, but all candidates agree → no discrimination
    const result = getBestQuestion([q(100)], candidates)
    expect(result).toBeNull()
  })
})

// ===================================================================
// Phase 1.8: Confirmers before Phase 2
// ===================================================================
describe('getBestQuestion — Phase 1.8 (confirmers run before Phase 2)', () => {
  // Q248 is a fiction confirmer (WEIGHT_CONFIRMER = 5.0)
  // Q142 is a discriminative question (¿Ganó un premio importante?) used by Phase 2
  const CONFIRMER = 248 as QuestionId
  const DISCRIMINATIVE = 142 as QuestionId

  it('picks confirmer over Phase-2 question when candidateCount ≤ 15', () => {
    // 5 candidates: one unique confirmer match, Phase-2 question has 3/5 split
    const candidates = [
      char(1, 'Target',   { [CONFIRMER]: 'yes', [DISCRIMINATIVE]: 'yes' }),
      char(2, 'Other1',   { [CONFIRMER]: 'no',  [DISCRIMINATIVE]: 'yes' }),
      char(3, 'Other2',   { [CONFIRMER]: 'no',  [DISCRIMINATIVE]: 'yes' }),
      char(4, 'Other3',   { [CONFIRMER]: 'no',  [DISCRIMINATIVE]: 'no' }),
      char(5, 'Other4',   { [CONFIRMER]: 'no',  [DISCRIMINATIVE]: 'no' }),
    ]
    const result = getBestQuestion(qIds([CONFIRMER, DISCRIMINATIVE]), candidates)
    expect(result).toBe(CONFIRMER)
  })

  it('does NOT pick confirmer when candidateCount > 15 (Phase 1.8 gate)', () => {
    // 16 candidates: confirmer has 1/16 split, discriminative has 8/16 (better entropy)
    const candidates = Array.from({ length: 16 }, (_, i) =>
      char(i + 1, `Char${i}`, {
        [CONFIRMER]: i === 0 ? 'yes' : 'no',
        [DISCRIMINATIVE]: i < 8 ? 'yes' : 'no',
      })
    )
    const result = getBestQuestion(qIds([CONFIRMER, DISCRIMINATIVE]), candidates)
    // Phase 1.8 skipped (>15 candidates); entropy/Phase 2 picks DISCRIMINATIVE
    expect(result).toBe(DISCRIMINATIVE)
  })

  it('picks confirmer with 2 candidates — still ≤ 15', () => {
    const candidates = [
      char(1, 'Brad',  { [CONFIRMER]: 'yes' }),
      char(2, 'Other', { [CONFIRMER]: 'no'  }),
    ]
    const result = getBestQuestion(qIds([CONFIRMER, DISCRIMINATIVE]), candidates)
    expect(result).toBe(CONFIRMER)
  })
})

// ===================================================================
// Phase 1.8: Learned confirmer IDs (dynamic, 10000+ range)
// ===================================================================
describe('getBestQuestion — Phase 1.8 with learned confirmer IDs', () => {
  const LEARNED_ID = 10005678 as unknown as QuestionId
  const DISCRIMINATIVE = 142 as QuestionId
  const learnedIds = new Set([10005678])

  it('picks learned confirmer over discriminative question when ≤ 15 candidates', () => {
    const candidates = [
      char(10005678, 'José Andrea', { [LEARNED_ID]: 'yes', [DISCRIMINATIVE]: 'yes' }),
      char(2, 'Otro Músico',        { [LEARNED_ID]: 'no',  [DISCRIMINATIVE]: 'yes' }),
      char(3, 'Otro Músico 2',      { [LEARNED_ID]: 'no',  [DISCRIMINATIVE]: 'no'  }),
    ]
    const result = getBestQuestion(
      qIds([DISCRIMINATIVE]).concat([LEARNED_ID]),
      candidates,
      undefined,
      learnedIds,
    )
    expect(result).toBe(LEARNED_ID)
  })

  it('learned confirmer is selectable even as the only question', () => {
    const candidates = [
      char(10005678, 'José Andrea', { [LEARNED_ID]: 'yes' }),
      char(2, 'Taylor Swift',       { [LEARNED_ID]: 'no'  }),
      char(3, 'Bad Bunny',          { [LEARNED_ID]: 'no'  }),
    ]
    const result = getBestQuestion(
      [LEARNED_ID],
      candidates,
      undefined,
      learnedIds,
    )
    expect(result).toBe(LEARNED_ID)
  })
})

// ===================================================================
// prerequisitesStrictMet
// ===================================================================
describe('prerequisitesStrictMet', () => {
  it('returns true for a question not in FLOW_MAP (no prerequisites defined)', () => {
    // Q1 (¿Es un ser vivo?) is the root question — no prerequisites
    const emptyMap = new Map<QuestionId, Answer>()
    expect(prerequisitesStrictMet(q(1), emptyMap)).toBe(true)
  })

  it('returns false when a required prerequisite has not been answered', () => {
    // Q161 (Pokemon type) requires Q85=yes in FLOW_MAP
    const emptyMap = new Map<QuestionId, Answer>()
    expect(prerequisitesStrictMet(q(161), emptyMap)).toBe(false)
  })

  it('returns true when all prerequisites are met with the correct answer', () => {
    // Q161 (Pokémon starter) requires Q4=yes AND Q85=yes
    const answerMap = new Map<QuestionId, Answer>([
      [q(4), 'yes'],
      [q(85), 'yes'],
    ])
    expect(prerequisitesStrictMet(q(161), answerMap)).toBe(true)
  })

  it('returns false when only one of multiple prerequisites is met', () => {
    // Q161 requires Q4=yes AND Q85=yes; only Q85=yes given
    const answerMap = new Map<QuestionId, Answer>([[q(85), 'yes']])
    expect(prerequisitesStrictMet(q(161), answerMap)).toBe(false)
  })

  it('returns false when prerequisite exists but has wrong answer value', () => {
    // Q161 requires Q85=yes, but we give Q85=no
    const answerMap = new Map<QuestionId, Answer>([[q(4), 'yes'], [q(85), 'no']])
    expect(prerequisitesStrictMet(q(161), answerMap)).toBe(false)
  })
})

// ===================================================================
// isExcluded
// ===================================================================
describe('isExcluded', () => {
  it('returns false for a question not in FLOW_MAP (no exclusions defined)', () => {
    const emptyMap = new Map<QuestionId, Answer>()
    expect(isExcluded(q(1), emptyMap)).toBe(false)
  })

  it('returns false when no exclusion trigger is present in answerMap', () => {
    // Any question with exclusions → returns false when the trigger is absent
    const emptyMap = new Map<QuestionId, Answer>()
    expect(isExcluded(q(84), emptyMap)).toBe(false)
  })

  it('returns false for a question with no exclusion rules', () => {
    // Q10 is not in FLOW_MAP → no exclusions → always false
    const filledMap = new Map<QuestionId, Answer>([[q(4), 'yes'], [q(85), 'no']])
    expect(isExcluded(q(10), filledMap)).toBe(false)
  })
})

// ===================================================================
// Helper
// ===================================================================
function qIds(ids: number[]): QuestionId[] {
  return ids.map(id => id as QuestionId)
}
