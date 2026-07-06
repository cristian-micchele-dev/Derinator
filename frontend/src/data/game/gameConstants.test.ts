import { describe, it, expect } from 'vitest'
import { EXCLUDED_BY_CATEGORY } from './gameConstants'

/**
 * These tests guard EXCLUDED_BY_CATEGORY against off-by-one bugs.
 * Historically, adding a new question whose ID happened to fall within
 * a contiguous excluded range caused it to be silently excluded from
 * the wrong category (e.g. Q237 was added for animals but fell between
 * two other excluded IDs and was swept into the animales exclusion list).
 *
 * If any of these tests fail after adding a new question, double-check
 * that the question's ID is not accidentally inside an excluded range.
 */

describe('EXCLUDED_BY_CATEGORY invariants', () => {
  // ===== animales: animal-discriminator questions must NOT be excluded =====

  const ANIMAL_DISCRIMINATORS = [
    { id: 5, label: '¿Es doméstico?' },
    { id: 12, label: '¿Es pequeño?' },
    { id: 27, label: '¿Es un mamífero?' },
    { id: 70, label: '¿Es un animal de granja?' },
    { id: 217, label: '¿Es de color rosado?' },
    { id: 500, label: '¿Es un animal que ladra?' },
  ]

  for (const { id, label } of ANIMAL_DISCRIMINATORS) {
    it(`animales: Q${id} (${label}) is NOT excluded`, () => {
      expect(EXCLUDED_BY_CATEGORY.animales).not.toContain(id)
    })
  }

  // ===== animales: human/fiction questions MUST be excluded =====

  const HUMAN_ONLY = [
    { id: 52, label: '¿Es mujer?' },
    { id: 57, label: '¿Es de Disney?' },
    { id: 84, label: '¿Es de Dragon Ball?' },
    { id: 85, label: '¿Es un Pokémon?' },
    { id: 44, label: '¿Es de EE.UU.?' },
    { id: 237, label: '¿Es de heavy metal?' },
    { id: 248, label: 'Confirmer: ¿Lanza telarañas?' },
  ]

  for (const { id, label } of HUMAN_ONLY) {
    it(`animales: Q${id} (${label}) IS excluded`, () => {
      expect(EXCLUDED_BY_CATEGORY.animales).toContain(id)
    })
  }

  // ===== personajes/famosos: animal questions MUST be excluded =====

  const ANIMAL_ONLY = [
    { id: 5, label: '¿Es doméstico?' },
    { id: 70, label: '¿Es un animal de granja?' },
    { id: 500, label: '¿Es un animal que ladra?' },
  ]

  for (const { id, label } of ANIMAL_ONLY) {
    it(`personajes: Q${id} (${label}) IS excluded`, () => {
      expect(EXCLUDED_BY_CATEGORY.personajes).toContain(id)
    })

    it(`famosos: Q${id} (${label}) IS excluded`, () => {
      expect(EXCLUDED_BY_CATEGORY.famosos).toContain(id)
    })
  }

  // ===== 'all' has no exclusions =====

  it('all: has no exclusions', () => {
    expect(EXCLUDED_BY_CATEGORY.all).toHaveLength(0)
  })
})
