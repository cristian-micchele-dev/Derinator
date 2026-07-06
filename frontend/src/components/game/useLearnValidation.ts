import { useState, useEffect } from 'react'
import { Answer } from '../../types'
import { detectLearnContradictions, findSimilarCharacter } from '../../data/game/learnModeValidation'

interface UseLearnValidationProps {
  learnAnswers: Record<number, Answer>
  learnName: string
}

export function useLearnValidation({ learnAnswers, learnName }: UseLearnValidationProps) {
  const [contradictionError, setContradictionError] = useState<string | null>(null)
  const [similarityWarning, setSimilarityWarning] = useState<string | null>(null)

  useEffect(() => {
    const errors = detectLearnContradictions(learnAnswers)
    setContradictionError(errors.length > 0 ? errors.join('. ') : null)
  }, [learnAnswers])

  useEffect(() => {
    const match = findSimilarCharacter(learnAnswers, learnName)
    if (match) {
      setSimilarityWarning(
        `⚠️ Similar al ${Math.round(match.similarity * 100)}% con: ${match.name}. Considerá responder más preguntas específicas.`
      )
    } else {
      setSimilarityWarning(null)
    }
  }, [learnAnswers, learnName])

  return { contradictionError, similarityWarning }
}
