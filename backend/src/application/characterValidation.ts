/**
 * Backend validation for learned characters
 */

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
  'musico',
  'actor',
  'otro',
] as const
export type ValidSubcategory = typeof VALID_SUBCATEGORIES[number]

const VALID_ANSWERS = ['yes', 'no', 'probably', 'probably_not', 'dont_know'] as const
const MAX_NAME_LENGTH = 100
const MAX_DESCRIPTION_LENGTH = 200
const MAX_ANSWERS = 250
const MIN_ANSWERS = 5

// Question IDs are sequential 1–500.
// Adding new questions only requires updating MAX_QUESTION_ID — no manual list maintenance.
const MAX_QUESTION_ID = 500
const VALID_QUESTION_IDS: Set<number> = new Set(
  Array.from({ length: MAX_QUESTION_ID }, (_, i) => i + 1)
)

export interface ValidationError {
  field: string
  message: string
}

export interface ValidatedCharacterInput {
  name: string
  description: string
  category: ValidCategory
  subcategory: ValidSubcategory | null
  answers: Record<number, string>
  errors: ValidationError[]
  isValid: boolean
}

export function sanitizeInput(input: string, maxLength: number): string {
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/[<>"']/g, '')
    .trim()
    .slice(0, maxLength)
}

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
    if (name.length < 3) {
      errors.push({ field: 'name', message: 'El nombre debe tener al menos 3 caracteres' })
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
  const answers: Record<number, string> = {}

  if (!raw.answers || typeof raw.answers !== 'object' || Array.isArray(raw.answers)) {
    errors.push({ field: 'answers', message: 'Las respuestas son obligatorias y deben ser un objeto' })
  } else {
    const entries = Object.entries(raw.answers as Record<string, unknown>)
    if (entries.length > MAX_ANSWERS) {
      errors.push({ field: 'answers', message: `Máximo ${MAX_ANSWERS} respuestas permitidas` })
    }

    for (const [key, value] of entries) {
      const qId = Number(key)
      if (isNaN(qId) || !VALID_QUESTION_IDS.has(qId)) {
        errors.push({ field: `answers[${key}]`, message: `ID de pregunta inválido: ${key}` })
        continue
      }
      if (typeof value !== 'string' || !VALID_ANSWERS.includes(value as typeof VALID_ANSWERS[number])) {
        errors.push({ field: `answers[${key}]`, message: `Respuesta inválida: ${value}` })
        continue
      }
      answers[qId] = value
    }

    const meaningfulAnswers = Object.values(answers).filter(a => a !== 'dont_know').length
    if (meaningfulAnswers < MIN_ANSWERS) {
      errors.push({ field: 'answers', message: `Se necesitan al menos ${MIN_ANSWERS} respuestas (sin contar "No lo sé")` })
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
