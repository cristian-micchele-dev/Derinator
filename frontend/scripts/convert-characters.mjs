/**
 * One-time script: converts frontend/src/data/characters.ts → JSON files.
 * Run: node scripts/convert-characters.mjs from frontend/
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const tsPath = path.resolve(__dirname, '..', 'src', 'data', 'characters.ts')
const outDir = path.resolve(__dirname, '..', 'src', 'data', 'characters')

const content = fs.readFileSync(tsPath, 'utf-8')

// 1. Extract all buildAnswers blocks: const NAME = buildAnswers([...])
const answerBlockRegex = /const\s+(\w+Answers)\s*=\s*buildAnswers\(\s*\[([\s\S]*?)\]\s*\)/g
const answerMap = new Map()

let match
while ((match = answerBlockRegex.exec(content)) !== null) {
  const [, varName, entriesBlock] = match
  const answers = {}

  // Parse individual entries: y(1), n(2), pr(3), q(4, 'probably_not'), etc.
  const entryRegex = /(\w+)\((\d+)(?:\s*,\s*'(?:yes|no|probably|probably_not|dont_know)')?\)/g
  let entryMatch
  while ((entryMatch = entryRegex.exec(entriesBlock)) !== null) {
    const fn = entryMatch[1]
    const id = parseInt(entryMatch[2], 10)

    let answer
    switch (fn) {
      case 'y': answer = 'yes'; break
      case 'n': answer = 'no'; break
      case 'pr': answer = 'probably'; break
      default:
        // q(id, 'answer') — extract from full match
        const inlineMatch = entryMatch[0].match(/'([^']+)'/)
        answer = inlineMatch ? inlineMatch[1] : null
    }

    // Only store non-'no' answers (no is default)
    if (answer && answer !== 'no') {
      answers[id] = answer
    }
  }

  answerMap.set(varName, answers)
}

console.log(`Parsed ${answerMap.size} answer blocks`)

// 2. Extract character entries from the characters array
const charArrayStart = content.indexOf('export const characters: Character[] = [')
const charArrayEnd = content.lastIndexOf(']')
const charArrayBlock = content.slice(charArrayStart, charArrayEnd + 1)

const charEntryRegex = /\{\s*id:\s*(\d+)\s*,\s*name:\s*'([^']*)'\s*,\s*description:\s*'([^']*)'\s*,\s*category:\s*'([^']*)'\s*(?:,\s*subcategory:\s*'([^']*)')?\s*,\s*answers:\s*(\w+Answers)\s*\}/g

const categories = { animales: [], personajes: [], famosos: [] }

let charMatch
while ((charMatch = charEntryRegex.exec(charArrayBlock)) !== null) {
  const [, id, name, description, category, subcategory, answersVar] = charMatch
  const answers = answerMap.get(answersVar) || {}

  const entry = {
    id: parseInt(id, 10),
    name,
    description,
    category,
    ...(subcategory ? { subcategory } : {}),
    ...(Object.keys(answers).length > 0 ? { answers } : {}),
  }

  // Sort by ID range
  if (category === 'animal') {
    categories.animales.push(entry)
  } else if (subcategory === 'deportista' || subcategory === 'historico-real' || subcategory === 'youtuber-streamer') {
    categories.famosos.push(entry)
  } else {
    categories.personajes.push(entry)
  }
}

// 3. Write JSON files
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true })
}

for (const [catName, chars] of Object.entries(categories)) {
  const filePath = path.join(outDir, `${catName}.json`)
  // Sort by id for stable output
  chars.sort((a, b) => a.id - b.id)
  fs.writeFileSync(filePath, JSON.stringify(chars, null, 2) + '\n')
  console.log(`Wrote ${chars.length} characters to ${filePath}`)
}

// 4. Write answer block validation (count non-'no' per character)
console.log('\nAnswers summary:')
for (const [name, answers] of answerMap) {
  const count = Object.keys(answers).length
  if (count > 0) {
    console.log(`  ${name}: ${count} non-'no' answers, IDs: [${Object.keys(answers).join(', ')}]`)
  }
}

console.log('\nDone!')
