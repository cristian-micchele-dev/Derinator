import { Answer } from '../../types'
import { QuestionId, questions } from '../questions'

export const VALID_CATEGORIES = ['animal', 'personaje'] as const
export type ValidCategory = typeof VALID_CATEGORIES[number]

export const VALID_SUBCATEGORIES = [
  'anime-shonen',
  'anime-seinen',
  'anime-magical-girl',
  'videojuego',
  'superheroe',
  'disney',
  'nintendo',
  'youtuber-streamer',
  'historico-real',
  'deportista',
  'otro',
] as const
export type ValidSubcategory = typeof VALID_SUBCATEGORIES[number]

const VALID_ANSWERS: Answer[] = ['yes', 'no', 'probably', 'probably_not', 'dont_know']
const MAX_NAME_LENGTH = 100
const MAX_DESCRIPTION_LENGTH = 200
const MAX_ANSWERS = 250

/**
 * Sanitize user input: strip HTML tags, trim, limit length
 */
export function sanitizeInput(input: string, maxLength: number): string {
  return input
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/[<>"']/g, '') // Strip dangerous chars
    .trim()
    .slice(0, maxLength)
}

export interface ValidationError {
  field: string
  message: string
}

export interface ValidatedCharacterInput {
  name: string
  description: string
  category: ValidCategory
  subcategory: ValidSubcategory | null
  answers: Record<QuestionId, Answer>
  errors: ValidationError[]
  isValid: boolean
}

/**
 * Validate and sanitize character input
 */
export function validateCharacterInput(raw: {
  name?: unknown
  description?: unknown
  category?: unknown
  subcategory?: unknown
  answers?: unknown
}): ValidatedCharacterInput {
  const errors: ValidationError[] = []

  // Name validation
  let name = ''
  if (!raw.name || typeof raw.name !== 'string' || raw.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'El nombre es obligatorio' })
  } else {
    name = sanitizeInput(raw.name, MAX_NAME_LENGTH)
    if (name.length < 2) {
      errors.push({ field: 'name', message: 'El nombre debe tener al menos 2 caracteres' })
    }
    if (!/^\p{L}[\p{L}\p{N}\s\-_.]+$/u.test(name)) {
      errors.push({ field: 'name', message: 'El nombre contiene caracteres inválidos' })
    }
  }

  // Description validation
  let description = ''
  if (raw.description && typeof raw.description === 'string') {
    description = sanitizeInput(raw.description, MAX_DESCRIPTION_LENGTH)
  }

  // Category validation
  let category: ValidCategory = 'personaje'
  if (!raw.category || typeof raw.category !== 'string') {
    errors.push({ field: 'category', message: 'La categoría es obligatoria' })
  } else if (!VALID_CATEGORIES.includes(raw.category as ValidCategory)) {
    errors.push({ field: 'category', message: `Categoría inválida. Valores permitidos: ${VALID_CATEGORIES.join(', ')}` })
  } else {
    category = raw.category as ValidCategory
  }

  // Subcategory validation
  let subcategory: ValidSubcategory | null = null
  if (raw.subcategory && typeof raw.subcategory === 'string') {
    if (!VALID_SUBCATEGORIES.includes(raw.subcategory as ValidSubcategory)) {
      errors.push({ field: 'subcategory', message: `Subcategoría inválida` })
    } else {
      subcategory = raw.subcategory as ValidSubcategory
    }
  }

  // Answers validation
  const answers: Record<QuestionId, Answer> = {} as Record<QuestionId, Answer>
  const validQuestionIds = new Set(questions.map(q => q.id))

  if (!raw.answers || typeof raw.answers !== 'object' || Array.isArray(raw.answers)) {
    errors.push({ field: 'answers', message: 'Las respuestas son obligatorias y deben ser un objeto' })
  } else {
    const entries = Object.entries(raw.answers)
    if (entries.length > MAX_ANSWERS) {
      errors.push({ field: 'answers', message: `Máximo ${MAX_ANSWERS} respuestas permitidas` })
    }

    for (const [key, value] of entries) {
      const qId = Number(key)
      if (isNaN(qId) || !validQuestionIds.has(qId as QuestionId)) {
        errors.push({ field: `answers[${key}]`, message: `ID de pregunta inválido: ${key}` })
        continue
      }
      if (!VALID_ANSWERS.includes(value as Answer)) {
        errors.push({ field: `answers[${key}]`, message: `Respuesta inválida: ${value}. Valores permitidos: ${VALID_ANSWERS.join(', ')}` })
        continue
      }
      answers[qId as QuestionId] = value as Answer
    }
  }

  return {
    name,
    description,
    category,
    subcategory,
    answers,
    errors,
    isValid: errors.length === 0,
  }
}
