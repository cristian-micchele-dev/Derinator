/**
 * enrich-franchises.mjs
 *
 * Automatically adds "no" answers for mutually exclusive franchise questions.
 * Logic: if a character has franchise X = "yes", all other franchise questions
 * get "no" (unless already answered).
 * Also derives: anime franchise → Q59=yes, game franchise → Q60=yes.
 *
 * Run: node scripts/enrich-franchises.mjs
 */

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PERSONAJES_PATH = join(__dirname, '../frontend/src/data/characters/personajes.json')

// ─── Franchise groups ────────────────────────────────────────────────────────

// Q59 = ¿Es anime?   (derived category, not a specific franchise)
// Q60 = ¿Es videojuego? (derived category, not a specific franchise)

const ANIME_FRANCHISES   = [84, 85, 93, 94, 111, 112, 113, 114, 115, 116, 117, 131, 132, 133, 219]
const GAME_FRANCHISES    = [58, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110]
const WESTERN_FRANCHISES = [57, 71, 73, 75, 81]   // Disney, Marvel, StarWars, HP, DC
const SERIES_FRANCHISES  = [134, 135, 136, 137, 138] // GoT, BB, StrangerThings, Simpsons, R&M

// All specific franchise questions — mutually exclusive
const ALL_FRANCHISE_IDS = [
  ...WESTERN_FRANCHISES,
  ...ANIME_FRANCHISES,
  ...GAME_FRANCHISES,
  ...SERIES_FRANCHISES,
]

const Q_IS_ANIME = 59
const Q_IS_GAME  = 60

// ─── Helpers ─────────────────────────────────────────────────────────────────

function setIfAbsent(answers, qId, value) {
  const key = String(qId)
  if (answers[key] === undefined) {
    answers[key] = value
    return 1
  }
  return 0
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const characters = JSON.parse(readFileSync(PERSONAJES_PATH, 'utf-8'))

let totalAdded = 0
const changeLog = []

for (const char of characters) {
  const answers = char.answers
  let added = 0

  // Find which franchises this character belongs to
  const positiveFranchises = ALL_FRANCHISE_IDS.filter(id => answers[String(id)] === 'yes')

  if (positiveFranchises.length === 0) continue

  // Add "no" for all OTHER franchise questions not yet answered
  for (const id of ALL_FRANCHISE_IDS) {
    if (!positiveFranchises.includes(id)) {
      added += setIfAbsent(answers, id, 'no')
    }
  }

  // Derive Q59 (anime) if character has an anime franchise
  const hasAnimeFranchise = ANIME_FRANCHISES.some(id => answers[String(id)] === 'yes')
  if (hasAnimeFranchise) {
    added += setIfAbsent(answers, Q_IS_ANIME, 'yes')
  } else {
    // If character is NOT from any anime franchise → is not anime
    added += setIfAbsent(answers, Q_IS_ANIME, 'no')
  }

  // Derive Q60 (game) if character has a game franchise
  const hasGameFranchise = GAME_FRANCHISES.some(id => answers[String(id)] === 'yes')
  if (hasGameFranchise) {
    added += setIfAbsent(answers, Q_IS_GAME, 'yes')
  } else {
    // If character is NOT from any game franchise → is not a game character
    added += setIfAbsent(answers, Q_IS_GAME, 'no')
  }

  if (added > 0) {
    totalAdded += added
    changeLog.push({ name: char.name, added })
  }
}

writeFileSync(PERSONAJES_PATH, JSON.stringify(characters, null, 2), 'utf-8')

console.log(`\n✔ Enrichment complete — ${totalAdded} answers added across ${changeLog.length} characters\n`)
console.log('Changes per character:')
for (const { name, added } of changeLog.sort((a, b) => b.added - a.added)) {
  console.log(`  ${name.padEnd(30)} +${added}`)
}
