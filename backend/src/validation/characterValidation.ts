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
const VALID_QUESTION_IDS = new Set([
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
  41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60,
  61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80,
  81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100,
  101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120,
  121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138,
  139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160,
  161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180,
  181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200,
  201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220,
  221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236,
])

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
