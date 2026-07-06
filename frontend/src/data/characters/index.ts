import { Answer, CharacterCategory, CharacterSubcategory } from '../../types'
import { QuestionId, type AnyQuestionId, questions } from '../questions'
import { loadLearnedCharacters } from '../learnedStorage'
import animales from './animales.json'
import personajes from './personajes.json'
import famosos from './famosos.json'

export interface Character {
  id: number
  name: string
  description: string
  category: CharacterCategory
  subcategory?: CharacterSubcategory
  answers: Record<QuestionId, Answer>
  /** Free-text question that uniquely identifies this character (learned characters only) */
  confirmerQuestion?: string
}

interface RawCharacter {
  id: number
  name: string
  description: string
  category: string
  subcategory?: string
  answers: Record<string, string>
}

const ALL_QUESTION_IDS = questions.map(q => q.id)

// Built-in characters are static — process them once and cache.
let builtInCache: Character[] | null = null

function fillDefaults(raw: RawCharacter): Character {
  const fullAnswers = {} as Record<QuestionId, Answer>
  for (const qId of ALL_QUESTION_IDS) {
    fullAnswers[qId] = 'no'
  }
  for (const [key, value] of Object.entries(raw.answers || {})) {
    fullAnswers[Number(key) as QuestionId] = value as Answer
  }

  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    category: raw.category as CharacterCategory,
    subcategory: (raw.subcategory || undefined) as CharacterSubcategory | undefined,
    answers: fullAnswers,
  }
}

function loadFromJson(): Character[] {
  if (builtInCache) return builtInCache
  const raw = [...animales, ...personajes, ...famosos] as unknown as RawCharacter[]
  builtInCache = raw.map(fillDefaults)
  return builtInCache
}

/** Maps learned character ID → confirmer question text, populated by getAllCharacters() */
const learnedConfirmerMap = new Map<number, string>()

/** Returns {id, text} pairs for all learned characters that have a confirmer question */
export function getLearnedConfirmerQuestions(): { id: number; text: string }[] {
  return Array.from(learnedConfirmerMap.entries()).map(([id, text]) => ({ id, text }))
}

function fillLearnedDefaults(char: Character): Character {
  const fullAnswers = {} as Record<QuestionId, Answer>
  for (const qId of ALL_QUESTION_IDS) {
    fullAnswers[qId] = 'no'
  }
  for (const [key, value] of Object.entries(char.answers || {})) {
    fullAnswers[Number(key) as QuestionId] = value as Answer
  }
  // The character's own ID is used as their confirmer question ID.
  // Only they answer 'yes'; everyone else defaults to 'no' (set above).
  if (char.confirmerQuestion) {
    fullAnswers[char.id as AnyQuestionId as QuestionId] = 'yes'
  }
  return { ...char, answers: fullAnswers }
}

export function getAllCharacters(learnedOverride?: Character[]): Character[] {
  const builtIn = loadFromJson()
  const learnedRaw = learnedOverride ?? loadLearnedCharacters()

  learnedConfirmerMap.clear()
  for (const char of learnedRaw) {
    if (char.confirmerQuestion) {
      learnedConfirmerMap.set(char.id, char.confirmerQuestion)
    }
  }

  const confirmerIds = Array.from(learnedConfirmerMap.keys())
  const learned = learnedRaw.map(fillLearnedDefaults)
  const all = [...builtIn, ...learned]

  // Ensure every character explicitly answers 'no' to learned confirmer question IDs.
  // Without this, characters without the key return safeAnswer→'dont_know', which gives
  // only a tiny mismatch penalty (-0.15×weight) instead of a full contradiction (-1.2×weight),
  // preventing the pool from narrowing after the confirmer is answered 'yes'.
  for (const char of all) {
    for (const confirmerId of confirmerIds) {
      const key = confirmerId as AnyQuestionId as QuestionId
      if (char.answers[key] === undefined || (char.answers[key] as string) === 'dont_know') {
        char.answers[key] = 'no'
      }
    }
  }

  return all
}
