import { useState, useMemo, useEffect, useCallback } from 'react'
import { Answer, CharacterCategory, CharacterSubcategory } from '../../types'
import { questions, QuestionId } from '../../data/questions'
import { getAllCharacters } from '../../data/characters'
import { saveLearnedCharacter } from '../../data/learnedStorage'
import { filterCandidates, getContradictedQuestions, getConfidenceMetrics, getBestQuestion, getQuestionWeight, prerequisitesStrictMet, isExcluded } from '../../data/game'

export type LearnModePhase = 'name' | 'questions' | 'hint' | 'done' | 'practice' | 'practice_result'

const MIN_MANUAL_QUESTIONS = 20

// Questions excluded from LearnMode (irrelevant for teaching)
const LEARN_EXCLUDED: Set<QuestionId> = new Set([
  12 as QuestionId,   // ¿Es pequeño?
  95 as QuestionId,   // ¿Es pequeño como un niño?
  234 as QuestionId,  // ¿Es pequeño/a?
  186 as QuestionId,  // ¿Es de Francia?
])

// Pre-filled answers based on subcategory selection
// These are "known facts" that the user already told us by picking the subcategory
const SUBCATEGORY_SEEDS: Record<string, Record<number, Answer>> = {
  // Fiction subcategories
  'anime-shonen': { 1: 'yes', 3: 'yes', 4: 'yes', 54: 'yes', 55: 'yes' },
  'anime-seinen': { 1: 'yes', 3: 'yes', 4: 'yes', 54: 'yes', 55: 'yes' },
  'anime-magical-girl': { 1: 'yes', 3: 'yes', 4: 'yes', 54: 'yes', 52: 'yes' },
  videojuego: { 1: 'yes', 4: 'yes', 56: 'yes' },
  superheroe: { 1: 'yes', 4: 'yes', 57: 'yes' },
  disney: { 1: 'yes', 4: 'yes', 58: 'yes' },
  nintendo: { 1: 'yes', 4: 'yes', 56: 'yes' },
  // Real-person subcategories
  'historico-real': { 1: 'yes', 3: 'yes', 4: 'no', 20: 'yes' },
  deportista: { 1: 'yes', 3: 'yes', 4: 'no', 17: 'yes' },
  musico: { 1: 'yes', 3: 'yes', 4: 'no', 18: 'yes' },
  actor: { 1: 'yes', 3: 'yes', 4: 'no', 19: 'yes' },
  'youtuber-streamer': { 1: 'yes', 3: 'yes', 4: 'no', 77: 'yes' },
}

// Category-level seeds (applied when no subcategory is chosen)
const CATEGORY_SEEDS: Record<string, Record<number, Answer>> = {
  animal: { 1: 'yes', 2: 'yes' },
  personaje: { 1: 'yes', 3: 'yes', 4: 'yes' },
}

// Common profiling questions asked for ALL real people
const REAL_PERSON_BASE: QuestionId[] = [
  52 as QuestionId,  // ¿Es mujer?
  43 as QuestionId,  // ¿Está vivo/a?
  141 as QuestionId, // ¿Tiene más de 30 años?
  44 as QuestionId,  // ¿Es de EE.UU.?
  16 as QuestionId,  // ¿Es de Argentina?
  183 as QuestionId, // ¿Es de España?
  181 as QuestionId, // ¿Es de México?
  182 as QuestionId, // ¿Es de Colombia?
  184 as QuestionId, // ¿Es del Reino Unido?
  45 as QuestionId,  // ¿Es europeo?
  142 as QuestionId, // ¿Es latino/a?
  199 as QuestionId, // ¿Es influyente en redes?
  198 as QuestionId, // ¿Es de los mejores de la historia?
  196 as QuestionId, // ¿Tiene pelo rubio?
  197 as QuestionId, // ¿Tiene tatuajes?
  50 as QuestionId,  // ¿Es calvo/a?
  51 as QuestionId,  // ¿Tiene pelo largo?
  48 as QuestionId,  // ¿Tiene bigote?
  49 as QuestionId,  // ¿Usa lentes?
  236 as QuestionId, // ¿Es casado/a?
]

// Subcategory-specific question lists for LearnMode
// These ensure the character gets a COMPLETE profile
const LEARN_QUESTIONS: Record<string, QuestionId[]> = {
  musico: [
    ...REAL_PERSON_BASE,
    154 as QuestionId, // ¿Es de pop?
    155 as QuestionId, // ¿Es de rock?
    156 as QuestionId, // ¿Es de rap / hip-hop?
    157 as QuestionId, // ¿Es de reggaeton?
    // Rock/metal sub-genres (shown only if Q155=yes via prerequisites)
    237 as QuestionId, // ¿Es de heavy metal?
    238 as QuestionId, // ¿Es de power metal?
    239 as QuestionId, // ¿Es de folk metal?
    240 as QuestionId, // ¿Es de death/black metal?
    241 as QuestionId, // ¿Es de hard rock?
    242 as QuestionId, // ¿Es de punk rock?
    243 as QuestionId, // ¿Es de rock alternativo?
    244 as QuestionId, // ¿Es de metal progresivo?
    // General musician details
    245 as QuestionId, // ¿Es solista?
    246 as QuestionId, // ¿Es vocalista principal?
    247 as QuestionId, // ¿Canta en español?
    158 as QuestionId, // ¿Toca guitarra?
    159 as QuestionId, // ¿Toca piano?
    160 as QuestionId, // ¿Es conocido/a por bailar?
    142 as QuestionId, // ¿Ganó un premio importante?
  ],
  actor: [
    ...REAL_PERSON_BASE,
    150 as QuestionId, // ¿Ganó un Oscar?
    151 as QuestionId, // ¿Es conocido/a por acción?
    152 as QuestionId, // ¿Es conocido/a por comedias?
    153 as QuestionId, // ¿Es conocido/a por dramas?
    142 as QuestionId, // ¿Ganó un premio importante?
  ],
  deportista: [
    ...REAL_PERSON_BASE,
    76 as QuestionId,  // ¿Es futbolista?
    187 as QuestionId, // ¿Juega baloncesto?
    188 as QuestionId, // ¿Juega tenis?
    189 as QuestionId, // ¿Juega golf?
    190 as QuestionId, // ¿Es boxeador/a?
    139 as QuestionId, // ¿Es zurdo/a?
    148 as QuestionId, // ¿Es leyenda?
    140 as QuestionId, // ¿Ganó un Mundial?
    142 as QuestionId, // ¿Ganó premio importante?
  ],
  'youtuber-streamer': [
    ...REAL_PERSON_BASE,
    142 as QuestionId, // ¿Ganó premio importante?
  ],
  'historico-real': [
    ...REAL_PERSON_BASE,
    80 as QuestionId,  // ¿Es líder político?
    195 as QuestionId, // ¿Ganó un Nobel?
    194 as QuestionId, // ¿Es de la realeza?
    200 as QuestionId, // ¿Es líder espiritual?
  ],
}

// Fiction-focused default for personaje category (Q4=yes)
const FICTION_BASE: QuestionId[] = [
  52 as QuestionId,  // ¿Es mujer?
  82 as QuestionId,  // ¿Tiene forma humana?
  59 as QuestionId,  // ¿Es de anime?
  56 as QuestionId,  // ¿Es un superhéroe?
  60 as QuestionId,  // ¿Es de videojuegos?
  57 as QuestionId,  // ¿Es de Disney?
  72 as QuestionId,  // ¿Es un villano?
  74 as QuestionId,  // ¿Tiene superpoderes?
  61 as QuestionId,  // ¿Tiene poderes mágicos?
  62 as QuestionId,  // ¿Usa arma?
  88 as QuestionId,  // ¿Usa ropa/uniforme característico?
  54 as QuestionId,  // ¿Usa capa?
  55 as QuestionId,  // ¿Usa máscara?
  64 as QuestionId,  // ¿Usa sombrero?
  92 as QuestionId,  // ¿Tiene pelo de color inusual?
  63 as QuestionId,  // ¿Es pelirrojo/a?
  71 as QuestionId,  // ¿Es de Marvel?
  81 as QuestionId,  // ¿Es de DC Comics?
  84 as QuestionId,  // ¿Es de Dragon Ball?
  85 as QuestionId,  // ¿Es un Pokémon?
  93 as QuestionId,  // ¿Es de Naruto?
  73 as QuestionId,  // ¿Es de Star Wars?
  75 as QuestionId,  // ¿Es de Harry Potter?
  58 as QuestionId,  // ¿Es de Nintendo?
  91 as QuestionId,  // ¿Es de un juego de pelea?
  89 as QuestionId,  // ¿Es un robot o cyborg?
  87 as QuestionId,  // ¿Tiene más de una transformación?
  86 as QuestionId,  // ¿Puede volar sin alas?
  83 as QuestionId,  // ¿Puede hablar como un humano?
  90 as QuestionId,  // ¿Es conocido por frase o grito?
]

// Default priority (when no subcategory match)
const LEARN_DEFAULT_REAL: QuestionId[] = REAL_PERSON_BASE
const LEARN_DEFAULT_FICTION: QuestionId[] = FICTION_BASE

/** Pick the next question for LearnMode: subcategory list first, no generic fallback */
function getLearnQuestion(
  remaining: QuestionId[],
  subcategory: string | undefined,
  category?: string,
): QuestionId | null {
  const remainingSet = new Set(remaining)
  const defaultList = category === 'personaje' ? LEARN_DEFAULT_FICTION : LEARN_DEFAULT_REAL
  const priorityList = (subcategory && LEARN_QUESTIONS[subcategory]) || defaultList

  // Only ask questions from the subcategory's curated list
  for (const qId of priorityList) {
    if (remainingSet.has(qId)) return qId
  }

  // No more relevant questions — return null (user can pick extra or finish)
  return null
}

interface UseLearnModeProps {
  history: { questionId: QuestionId; answer: Answer }[]
  onComplete: () => void
  onCancel: () => void
  defeatedByName?: string
  gameCategory?: 'all' | 'personajes' | 'animales' | 'famosos'
}

export function useLearnMode({
  history,
  onComplete,
  onCancel,
  defeatedByName,
  gameCategory,
}: UseLearnModeProps) {
  const defaultCategory: CharacterCategory = gameCategory === 'animales' ? 'animal' : 'personaje'

  const [phase, setPhase] = useState<LearnModePhase>('name')
  const [learnName, setLearnName] = useState('')
  const [learnDescription, setLearnDescription] = useState('')
  const [learnCategory, setLearnCategory] = useState<CharacterCategory>(defaultCategory)
  const [learnSubcategory, setLearnSubcategory] = useState<CharacterSubcategory | undefined>(undefined)
  const [learnAnswers, setLearnAnswers] = useState<Record<number, Answer>>({})
  const [currentQuestionId, setCurrentQuestionId] = useState<QuestionId | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [similarityWarning, setSimilarityWarning] = useState<string | null>(null)

  // Hint (free-text clue the user writes)
  const [learnHint, setLearnHint] = useState('')

  // Practice simulation state
  const [practiceStep, setPracticeStep] = useState(0)
  const [practiceLog, setPracticeLog] = useState<{ question: string; answer: Answer }[]>([])
  const [practiceGuess, setPracticeGuess] = useState<string | null>(null)

  // Navigation stack for going back
  const [navStack, setNavStack] = useState<QuestionId[]>([])
  // Track how many answers came from seeds (not user input)
  const [seedCount, setSeedCount] = useState(0)

  // Pre-fill answers from game history
  useEffect(() => {
    if (phase !== 'name') return
    const prefilled: Record<number, Answer> = {}
    for (const h of history) {
      prefilled[h.questionId] = h.answer
    }
    setLearnAnswers(prefilled)
  }, [phase, history])

  // Start the question flow — apply subcategory seeds
  const startQuestions = useCallback(() => {
    setPhase('questions')
    setNavStack([])

    // Build seed answers from subcategory (or category fallback)
    const seeds: Record<number, Answer> = {}
    if (learnSubcategory && SUBCATEGORY_SEEDS[learnSubcategory]) {
      Object.assign(seeds, SUBCATEGORY_SEEDS[learnSubcategory])
    } else if (CATEGORY_SEEDS[learnCategory]) {
      Object.assign(seeds, CATEGORY_SEEDS[learnCategory])
    }

    // Merge seeds with any pre-filled game history answers
    const merged = { ...seeds, ...learnAnswers }
    setSeedCount(Object.keys(merged).length)
    setLearnAnswers(merged)

    // Find the first question using priority list
    const answeredIds = new Set([...Object.keys(seeds).map(Number), ...Object.keys(learnAnswers).map(Number)])
    const mergedAnswers = { ...seeds, ...learnAnswers }
    const answerMap = new Map(Object.entries(mergedAnswers).map(([k, v]) => [Number(k) as QuestionId, v as Answer]))

    const eligible = questions
      .filter((q) => !answeredIds.has(q.id) && !LEARN_EXCLUDED.has(q.id) && prerequisitesStrictMet(q.id, answerMap) && !isExcluded(q.id, answerMap))
      .map((q) => q.id)

    // Use priority-based selection
    const firstQ = getLearnQuestion(eligible, learnSubcategory, learnCategory)
    setCurrentQuestionId(firstQ)
  }, [learnSubcategory, learnCategory, learnAnswers])

  const handleLearnNameSubmit = useCallback(() => {
    if (!learnName.trim()) return
    startQuestions()
  }, [learnName, startQuestions])

  // Get the current question object
  const currentQuestion = useMemo(() => {
    if (!currentQuestionId) return null
    return questions.find((q) => q.id === currentQuestionId) || null
  }, [currentQuestionId])

  const questionsAnswered = Object.keys(learnAnswers).length

  // Check for contradictions in real-time
  useEffect(() => {
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

    const nationalities = [16, 44, 45, 46, 47]
    const yesNats = nationalities.filter((id) => learnAnswers[id] === 'yes')
    if (yesNats.length > 1) {
      errors.push('No puede ser de múltiples nacionalidades')
    }

    setValidationError(errors.length > 0 ? errors.join('. ') : null)
  }, [learnAnswers])

  // Check for similarity with existing characters
  useEffect(() => {
    if (Object.keys(learnAnswers).length < 5) {
      setSimilarityWarning(null)
      return
    }

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

    if (bestMatch && bestMatch.similarity >= 0.75) {
      setSimilarityWarning(
        `⚠️ Similar al ${Math.round(bestMatch.similarity * 100)}% con: ${bestMatch.name}. Considerá responder más preguntas específicas.`
      )
    } else {
      setSimilarityWarning(null)
    }
  }, [learnAnswers, learnName])

  const handleLearnAnswer = useCallback((answer: Answer) => {
    if (!currentQuestionId) return

    const newAnswers = { ...learnAnswers, [currentQuestionId]: answer }
    setLearnAnswers(newAnswers)
    setNavStack((prev) => [...prev, currentQuestionId])

    const answerEntries = Object.entries(newAnswers).map(
      ([k, v]) => [Number(k) as QuestionId, v as Answer] as const
    )
    const answerMap = new Map(answerEntries)
    const newHistory = answerEntries.map(([questionId, answer]) => ({ questionId, answer }))
    const contradicted = getContradictedQuestions(newHistory)
    const answeredIds = new Set(answerEntries.map(([k]) => k))
    const remaining = questions
      .filter((q) => !answeredIds.has(q.id) && !contradicted.has(q.id) && !LEARN_EXCLUDED.has(q.id))
      .filter((q) => prerequisitesStrictMet(q.id, answerMap) && !isExcluded(q.id, answerMap))
      .map((q) => q.id)

    const nextId = getLearnQuestion(remaining, learnSubcategory, learnCategory)
    setCurrentQuestionId(nextId)
  }, [currentQuestionId, learnAnswers, learnSubcategory, learnCategory])

  const handleLearnBack = useCallback(() => {
    if (navStack.length === 0) return

    const lastAnswered = navStack[navStack.length - 1]
    setNavStack((prev) => prev.slice(0, -1))

    const newAnswers = { ...learnAnswers }
    delete newAnswers[lastAnswered]
    setLearnAnswers(newAnswers)

    if (Object.keys(newAnswers).length === 0) {
      setCurrentQuestionId(1)
      return
    }

    const answerEntries = Object.entries(newAnswers).map(
      ([k, v]) => [Number(k) as QuestionId, v as Answer] as const
    )
    const answerMap = new Map(answerEntries)
    const newHistory = answerEntries.map(([questionId, answer]) => ({ questionId, answer }))
    const contradicted = getContradictedQuestions(newHistory)
    const answeredIds = new Set(answerEntries.map(([k]) => k))
    const remaining = questions
      .filter((q) => !answeredIds.has(q.id) && !contradicted.has(q.id) && !LEARN_EXCLUDED.has(q.id))
      .filter((q) => prerequisitesStrictMet(q.id, answerMap) && !isExcluded(q.id, answerMap))
      .map((q) => q.id)

    const nextId = getLearnQuestion(remaining, learnSubcategory, learnCategory)
    setCurrentQuestionId(nextId)
  }, [navStack, learnAnswers, learnSubcategory, learnCategory])

  const handleFinishLearn = useCallback(async () => {
    setValidationError(null)

    const completeAnswers: Record<number, Answer> = { ...learnAnswers }

    // Build description with hint if provided
    let description = learnDescription.trim() || learnName.trim()
    if (learnHint.trim()) {
      description = description + ' | Pista: ' + learnHint.trim()
    }

    try {
      const saved = await saveLearnedCharacter({
        name: learnName.trim(),
        description,
        category: learnCategory,
        subcategory: learnSubcategory,
        answers: completeAnswers,
      })

      if (saved.success) {
        setPhase('done')
      } else {
        const msg = saved.errors?.map((e) => e.message).join('. ') || 'Error al guardar'
        setValidationError(msg)
      }
    } catch {
      setValidationError('Error de conexión. Intentalo de nuevo.')
    }
  }, [learnAnswers, learnName, learnDescription, learnHint, learnCategory, learnSubcategory])

  // Practice simulation
  const runPractice = useCallback(() => {
    const allChars = getAllCharacters()
    const learnedChar = allChars.find((c) => c.name === learnName.trim())
    if (!learnedChar) return

    setPhase('practice')
    setPracticeStep(0)
    setPracticeLog([])
    setPracticeGuess(null)

    const simHistory: { questionId: QuestionId; answer: Answer }[] = []
    const log: { question: string; answer: Answer }[] = []

    for (let i = 0; i < 30; i++) {
      const rankedCandidates = filterCandidates(allChars, simHistory)
      const metrics = getConfidenceMetrics(rankedCandidates, false, simHistory.length)

      if (metrics.shouldGuess || rankedCandidates.length === 0) {
        setPracticeGuess(rankedCandidates[0]?.name || 'Nadie')
        break
      }

      const answeredIds = new Set(simHistory.map((h) => h.questionId))
      const remaining = questions
        .filter((q) => !answeredIds.has(q.id))
        .map((q) => q.id)

      const nextQId = getBestQuestion(remaining, rankedCandidates, simHistory)

      if (!nextQId) {
        setPracticeGuess(rankedCandidates[0]?.name || 'Nadie')
        break
      }

      const qText = questions.find((q) => q.id === nextQId)?.text || `Pregunta ${nextQId}`
      const answer = learnedChar.answers[nextQId] || 'dont_know'

      if (answer !== 'dont_know') {
        simHistory.push({ questionId: nextQId, answer })
      }

      log.push({ question: qText, answer })
    }

    setPracticeLog(log)
    setPracticeStep(log.length)

    const finalRanked = filterCandidates(allChars, simHistory)
    if (finalRanked.length > 0) {
      setPracticeGuess(finalRanked[0].name)
    }

    setPhase('practice_result')
  }, [learnName])

  const handlePracticeBack = useCallback(() => {
    setPhase('done')
    setPracticeGuess(null)
    setPracticeLog([])
    setPracticeStep(0)
  }, [])

  // Computed: manual answers (user-answered, not seeds)
  const manualAnswerCount = questionsAnswered - seedCount
  const noMoreQuestions = !currentQuestionId
  // Can finish if enough manual answers OR if curated questions ran out
  const canFinish = manualAnswerCount >= MIN_MANUAL_QUESTIONS || noMoreQuestions
  const questionsRemaining = Math.max(0, MIN_MANUAL_QUESTIONS - manualAnswerCount)

  // Enter hint phase — user writes a free-text clue
  const startHint = useCallback(() => {
    setPhase('hint')
  }, [])

  // Save hint and finish
  const handleSaveHint = useCallback(() => {
    // Hint gets appended to description in handleFinishLearn
    setPhase('questions')
    // Trigger finish immediately since hint phase means questions are done
    setCurrentQuestionId(null)
  }, [])

  return {
    phase,
    learnName,
    setLearnName,
    learnDescription,
    setLearnDescription,
    learnCategory,
    setLearnCategory,
    learnSubcategory,
    setLearnSubcategory,
    learnAnswers,
    currentQuestion,
    questionsAnswered,
    manualAnswerCount,
    canFinish,
    questionsRemaining,
    validationError,
    similarityWarning,
    practiceStep,
    practiceLog,
    practiceGuess,
    navStack,
    defeatedByName,
    handleLearnNameSubmit,
    handleLearnAnswer,
    handleLearnBack,
    handleFinishLearn,
    learnHint,
    setLearnHint,
    startHint,
    handleSaveHint,
    runPractice,
    handlePracticeBack,
    onComplete,
    onCancel,
  }
}
