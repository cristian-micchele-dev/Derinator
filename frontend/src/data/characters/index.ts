import { Answer, CharacterCategory, CharacterSubcategory } from '../../types'
import { QuestionId, questions } from '../questions'
import { loadLearnedCharacters } from '../learnedStorage'
import { buildProfile } from '../game/bayesian'
import type { CandidateWithProfile } from '../game/bayesian'
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
  const raw = [...animales, ...personajes, ...famosos] as unknown as RawCharacter[]
  return raw.map(fillDefaults)
}

function fillLearnedDefaults(char: Character): Character {
  const fullAnswers = {} as Record<QuestionId, Answer>
  for (const qId of ALL_QUESTION_IDS) {
    fullAnswers[qId] = 'dont_know'
  }
  for (const [key, value] of Object.entries(char.answers || {})) {
    fullAnswers[Number(key) as QuestionId] = value as Answer
  }
  return { ...char, answers: fullAnswers }
}

export function getAllCharacters(): Character[] {
  const builtIn = loadFromJson()
  const learned = loadLearnedCharacters().map(fillLearnedDefaults)
  return [...builtIn, ...learned]
}

/** Returns all characters with probability profiles attached */
export function getAllCharactersWithProfiles(): CandidateWithProfile[] {
  return getAllCharacters().map((char) => ({
    ...char,
    profile: buildProfile(char.answers, ALL_QUESTION_IDS),
  }))
}
