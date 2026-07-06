/**
 * enrich-attributes.mjs
 *
 * Manually adds critical discriminating attributes to specific characters.
 * Uses setIfAbsent — never overwrites existing answers.
 *
 * Run: node scripts/enrich-attributes.mjs
 */

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PERSONAJES_PATH = join(__dirname, '../frontend/src/data/characters/personajes.json')

// Question IDs (verified against questions.ts)
// 72  = ¿Es un villano?
// 86  = ¿Puede volar sin alas?
// 121 = ¿Es el héroe principal?
// 224 = ¿Usa espada?
// 225 = ¿Es un pirata?
// 226 = ¿Es un ninja?

/**
 * Per-character manual attribute additions.
 * Keys are character names (exact match with personajes.json).
 * Values are { questionId: answer } — only added if question is currently unset.
 */
const MANUAL_ATTRIBUTES = {
  // ── Marvel ───────────────────────────────────────────────────────
  'Superman':         { 72: 'no', 224: 'no', 225: 'no', 226: 'no' },
  'Wonder Woman':     { 72: 'no', 86: 'yes', 224: 'yes', 225: 'no', 226: 'no' },
  'Iron Man':         { 72: 'no', 86: 'yes', 224: 'no', 225: 'no', 226: 'no' },
  'Thor':             { 72: 'no', 224: 'probably_not', 225: 'no', 226: 'no' },
  'Wolverine':        { 72: 'no', 86: 'no', 225: 'no', 226: 'no' },
  'Hulk':             { 72: 'no', 86: 'no', 224: 'no', 225: 'no', 226: 'no' },
  'Capitán América':  { 72: 'no', 86: 'no', 224: 'no', 225: 'no', 226: 'no' },
  'Black Panther':    { 72: 'no', 86: 'no', 224: 'yes', 225: 'no', 226: 'no' },
  'Thanos':           { 72: 'yes', 86: 'probably', 121: 'no', 224: 'yes', 225: 'no', 226: 'no' },
  'Spider-Man':       { 72: 'no', 225: 'no', 226: 'no' },
  // ── DC ───────────────────────────────────────────────────────────
  'Batman':           { 72: 'no', 225: 'no', 226: 'no' },
  'Joker':            { 72: 'yes', 86: 'no', 121: 'no', 224: 'no', 225: 'no', 226: 'no' },
  // ── Star Wars ────────────────────────────────────────────────────
  'Darth Vader':      { 72: 'yes', 86: 'probably_not', 121: 'no', 225: 'no', 226: 'no' },
  'Yoda':             { 72: 'no', 86: 'no', 224: 'yes', 225: 'no', 226: 'no' },
  // ── Harry Potter ─────────────────────────────────────────────────
  'Harry Potter':     { 72: 'no', 86: 'no', 224: 'no', 225: 'no', 226: 'no' },
  'Ron Weasley':      { 72: 'no', 86: 'no', 224: 'no', 225: 'no', 226: 'no' },
  'Albus Dumbledore': { 72: 'no', 86: 'no', 224: 'no', 225: 'no', 226: 'no' },
  'Lord Voldemort':   { 72: 'yes', 86: 'no', 121: 'no', 224: 'no', 225: 'no', 226: 'no' },
  'Severus Snape':    { 72: 'probably', 86: 'no', 224: 'no', 225: 'no', 226: 'no' },
  'Rubeus Hagrid':    { 72: 'no', 86: 'no', 224: 'no', 225: 'no', 226: 'no' },
  'Draco Malfoy':     { 72: 'probably', 86: 'no', 224: 'no', 225: 'no', 226: 'no' },
  'Luna Lovegood':    { 72: 'no', 86: 'no', 224: 'no', 225: 'no', 226: 'no' },
  // ── Disney ───────────────────────────────────────────────────────
  'Mickey Mouse':     { 72: 'no', 86: 'no', 224: 'no', 225: 'no', 226: 'no' },
  'Elsa':             { 72: 'probably_not', 86: 'no', 224: 'no', 225: 'no', 226: 'no' },
  'Woody':            { 72: 'no', 86: 'no', 224: 'no', 225: 'no', 226: 'no' },
  'Buzz Lightyear':   { 72: 'no', 86: 'probably_not', 224: 'no', 225: 'no', 226: 'no' },
  'Simba':            { 72: 'no', 86: 'no', 224: 'no', 225: 'no', 226: 'no' },
  'Rapunzel':         { 72: 'no', 86: 'no', 224: 'no', 225: 'no', 226: 'no' },
  'Mulan':            { 72: 'no', 86: 'no', 225: 'no', 226: 'no' },
  'Maui':             { 72: 'no', 86: 'probably', 224: 'no', 225: 'yes', 226: 'no' },
  'Stitch':           { 72: 'probably_not', 86: 'no', 224: 'no', 225: 'no', 226: 'no' },
  // ── Dragon Ball ──────────────────────────────────────────────────
  'Goku':             { 72: 'no', 225: 'no', 226: 'no' },
  'Vegeta':           { 72: 'probably', 225: 'no', 226: 'no' },
  'Gohan':            { 72: 'no', 225: 'no', 226: 'no' },
  'Piccolo':          { 72: 'probably', 86: 'yes', 225: 'no', 226: 'no' },
  'Trunks':           { 72: 'no', 86: 'yes', 224: 'yes', 225: 'no', 226: 'no' },
  'Goten':            { 72: 'no', 86: 'yes', 224: 'no', 225: 'no', 226: 'no' },
  'Mr. Satan':        { 72: 'no', 86: 'no', 224: 'no', 225: 'no', 226: 'no' },
  'Chiaotzu':         { 72: 'no', 86: 'yes', 224: 'no', 225: 'no', 226: 'no' },
  'Cell':             { 72: 'yes', 86: 'yes', 121: 'no', 224: 'no', 225: 'no', 226: 'no' },
  'Freezer':          { 72: 'yes', 86: 'yes', 121: 'no', 224: 'no', 225: 'no', 226: 'no' },
  'Majin Buu':        { 72: 'yes', 86: 'yes', 121: 'no', 224: 'no', 225: 'no', 226: 'no' },
  // ── Naruto ───────────────────────────────────────────────────────
  'Naruto':           { 72: 'no', 225: 'no' },
  'Sasuke Uchiha':    { 72: 'probably' },
  'Kakashi Hatake':   { 72: 'no', 86: 'no', 225: 'no', 226: 'yes' },
  'Itachi Uchiha':    { 72: 'probably_not', 86: 'no', 225: 'no' },
  'Sakura Haruno':    { 72: 'no', 86: 'no', 225: 'no', 226: 'yes' },
  // ── One Piece ────────────────────────────────────────────────────
  'Luffy':            { 72: 'no', 86: 'no', 226: 'no' },
  'Monkey D. Zoro':   { 72: 'no', 86: 'no', 226: 'no' },
  // ── Attack on Titan ──────────────────────────────────────────────
  'Eren Yeager':      { 72: 'probably', 86: 'probably_not', 224: 'no', 225: 'no', 226: 'no' },
  'Levi Ackerman':    { 72: 'no', 86: 'no', 224: 'yes', 225: 'no', 226: 'no' },
  // ── Death Note ───────────────────────────────────────────────────
  'Light Yagami':     { 72: 'yes', 86: 'no', 224: 'no', 225: 'no', 226: 'no' },
  // ── FMA ──────────────────────────────────────────────────────────
  'Edward Elric':     { 72: 'no', 86: 'no', 225: 'no', 226: 'no' },
  // ── Evangelion ───────────────────────────────────────────────────
  'Shinji Ikari':     { 72: 'no', 86: 'no', 224: 'no', 225: 'no', 226: 'no' },
  'Asuka Langley Soryu': { 72: 'no', 86: 'no', 224: 'no', 225: 'no', 226: 'no' },
  // ── MHA ──────────────────────────────────────────────────────────
  'Deku (Izuku Midoriya)': { 72: 'no', 86: 'probably', 224: 'no', 225: 'no', 226: 'no' },
  'All Might':        { 72: 'no', 86: 'no', 224: 'no', 225: 'no', 226: 'no' },
  // ── OPM ──────────────────────────────────────────────────────────
  'Saitama':          { 72: 'no', 86: 'probably_not', 224: 'no', 225: 'no', 226: 'no' },
  // ── HxH ──────────────────────────────────────────────────────────
  'Gon Freecss':      { 72: 'no', 86: 'no', 224: 'no', 225: 'no', 226: 'no' },
  'Killua Zoldyck':   { 72: 'no', 86: 'no', 225: 'no', 226: 'no' },
  // ── Demon Slayer ─────────────────────────────────────────────────
  'Tanjiro Kamado':   { 72: 'no', 86: 'no', 225: 'no', 226: 'no' },
  'Nezuko Kamado':    { 72: 'probably_not', 86: 'no', 225: 'no', 226: 'no' },
  // ── JJK ──────────────────────────────────────────────────────────
  'Gojo Satoru':      { 72: 'no', 86: 'probably', 224: 'no', 225: 'no', 226: 'no' },
  // ── Kenshin ──────────────────────────────────────────────────────
  'Kenshin Himura':   { 72: 'no', 86: 'no', 225: 'no', 226: 'no' },
  // ── Bleach ───────────────────────────────────────────────────────
  'Ichigo Kurosaki':  { 72: 'no', 86: 'probably', 225: 'no', 226: 'no' },
  // ── Nintendo ─────────────────────────────────────────────────────
  'Mario':            { 72: 'no', 86: 'no', 225: 'no', 226: 'no' },
  'Luigi':            { 72: 'no', 86: 'no', 225: 'no', 226: 'no' },
  'Donkey Kong':      { 72: 'no', 86: 'no', 224: 'no', 225: 'no', 226: 'no' },
  'Link':             { 72: 'no', 86: 'no', 225: 'no', 226: 'no' },
  // ── Games ────────────────────────────────────────────────────────
  'Kratos':           { 72: 'probably', 86: 'no', 225: 'no', 226: 'no' },
  'Master Chief':     { 72: 'no', 86: 'no', 224: 'no', 225: 'no', 226: 'no' },
  'Sub-Zero':         { 72: 'probably_not', 86: 'no', 225: 'no', 226: 'no' },
  'Scorpion':         { 72: 'probably', 86: 'no', 225: 'no', 226: 'no' },
  'Geralt de Rivia':  { 72: 'no', 86: 'no', 225: 'no', 226: 'no' },
  'Ezio Auditore':    { 72: 'no', 86: 'no', 224: 'yes', 225: 'no', 226: 'no' },
  'Creeper':          { 72: 'probably', 86: 'no', 224: 'no', 225: 'no', 226: 'no' },
  'Steve':            { 72: 'no', 86: 'no', 224: 'probably', 225: 'no', 226: 'no' },
  // ── TV/Series ────────────────────────────────────────────────────
  'Walter White':     { 72: 'yes', 86: 'no', 121: 'probably', 224: 'no', 225: 'no', 226: 'no' },
  'Jon Snow':         { 72: 'no', 86: 'no', 225: 'no', 226: 'no' },
  'Daenerys Targaryen': { 72: 'probably', 86: 'no', 224: 'yes', 225: 'no', 226: 'no' },
  'Eleven':           { 72: 'no', 86: 'no', 224: 'no', 225: 'no', 226: 'no' },
  'Homero Simpson':   { 72: 'no', 86: 'no', 224: 'no', 225: 'no', 226: 'no' },
  'Bart Simpson':     { 72: 'no', 86: 'no', 224: 'no', 225: 'no', 226: 'no' },
  'Rick Sanchez':     { 72: 'probably', 86: 'no', 224: 'no', 225: 'no', 226: 'no' },
}

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
const notFound = []

for (const [name, attrs] of Object.entries(MANUAL_ATTRIBUTES)) {
  const char = characters.find(c => c.name === name)
  if (!char) {
    notFound.push(name)
    continue
  }

  let added = 0
  for (const [qId, value] of Object.entries(attrs)) {
    added += setIfAbsent(char.answers, Number(qId), value)
  }

  if (added > 0) {
    totalAdded += added
    changeLog.push({ name, added })
  }
}

writeFileSync(PERSONAJES_PATH, JSON.stringify(characters, null, 2), 'utf-8')

console.log(`\n✔ Attribute enrichment complete — ${totalAdded} answers added across ${changeLog.length} characters\n`)

if (changeLog.length > 0) {
  console.log('Changes per character:')
  for (const { name, added } of changeLog.sort((a, b) => b.added - a.added)) {
    console.log(`  ${name.padEnd(30)} +${added}`)
  }
}

if (notFound.length > 0) {
  console.log(`\n⚠ Characters not found in JSON (${notFound.length}):`)
  for (const n of notFound) console.log(`  - ${n}`)
}
