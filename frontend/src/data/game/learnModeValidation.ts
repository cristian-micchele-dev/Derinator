import type { Answer } from '../../types'
import type { QuestionId } from '../questions'
import { questions } from '../questions'
import { getAllCharacters } from '../characters'
import { getQuestionWeight } from '.'

/** Detect logical contradictions in learn answers */
export function detectLearnContradictions(
  learnAnswers: Record<number, Answer>,
): string[] {
  const errors: string[] = []

  if (learnAnswers[52] === 'yes' && learnAnswers[53] === 'yes') {
    errors.push('No puede ser mujer y hombre al mismo tiempo')
  }
  if (learnAnswers[1] === 'yes' && learnAnswers[2] === 'yes' && learnAnswers[3] === 'yes') {
    errors.push('Un animal no puede ser humano')
  }
  if (learnAnswers[6] === 'yes' && learnAnswers[7] === 'yes') {
    errors.push('No puede volar y ser acuático (generalmente)')
  }
  if (learnAnswers[11] === 'yes' && learnAnswers[12] === 'yes') {
    errors.push('No puede ser muy grande y pequeño')
  }
  if (learnAnswers[33] === 'yes' && learnAnswers[34] === 'yes') {
    errors.push('No puede ser rápido y lento')
  }

  const professions = [17, 18, 19, 20, 76, 77, 78, 79, 80]
  const yesProfessions = professions.filter((id) => learnAnswers[id] === 'yes')
  if (yesProfessions.length > 1) {
    const profNames = yesProfessions.map((id) => questions.find((q) => q.id === id)?.text.split(' ')[2] || id).join(', ')
    errors.push(`Un personaje no puede ser múltiples profesiones: ${profNames}`)
  }

  // Q45 (europeo) is a broad region, not a specific country — excluded from mutual exclusion
  const nationalities = [16, 44, 46, 47, 181, 182, 183, 184, 185, 186]
  const yesNats = nationalities.filter((id) => learnAnswers[id] === 'yes')
  if (yesNats.length > 1) {
    errors.push('No puede ser de múltiples nacionalidades')
  }

  return errors
}

/** Find the most similar existing character to the learn answers */
export function findSimilarCharacter(
  learnAnswers: Record<number, Answer>,
  learnName: string,
): { name: string; similarity: number } | null {
  if (Object.keys(learnAnswers).length < 5) return null

  const allChars = getAllCharacters()
  let bestMatch: { name: string; similarity: number } | null = null

  for (const char of allChars) {
    if (char.name === learnName) continue

    let weightedMatch = 0
    let weightedTotal = 0
    let commonAnswers = 0

    for (const [qIdStr, answer] of Object.entries(learnAnswers)) {
      const qId = Number(qIdStr) as QuestionId
      if (answer === 'dont_know') continue

      const charAnswer = char.answers[qId]
      if (charAnswer === undefined || charAnswer === 'dont_know') continue

      commonAnswers++
      const weight = getQuestionWeight(qId)
      weightedTotal += weight

      if (answer === charAnswer) {
        weightedMatch += weight
      }
    }

    if (commonAnswers >= 5 && weightedTotal > 0) {
      const similarity = weightedMatch / weightedTotal
      if (!bestMatch || similarity > bestMatch.similarity) {
        bestMatch = { name: char.name, similarity }
      }
    }
  }

  return bestMatch && bestMatch.similarity >= 0.75 ? bestMatch : null
}
