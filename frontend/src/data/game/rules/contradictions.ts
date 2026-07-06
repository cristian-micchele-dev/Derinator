import { Answer } from '../../../types'
import { QuestionId } from '../../questions'

type Contradiction = [QuestionId, Answer, QuestionId]

export function buildContradictions(): Contradiction[] {
  const contradictions: Contradiction[] = []

  const add = (srcId: QuestionId, srcAnswer: Answer, ...excludeIds: QuestionId[]) => {
    for (const eid of excludeIds) contradictions.push([srcId, srcAnswer, eid])
  }

  // --- LIVING BEING BOUNDARIES ---
  add(1, 'no', 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81)

  // --- ANIMAL = yes → skip ALL human-specific questions ---
  add(2, 'yes', 15, 16, 17, 18, 19, 20, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81)

  // --- ANIMAL = no → skip ALL animal-specific questions ---
  add(2, 'no', 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 67, 68, 69, 70)

  // --- HUMAN = yes → skip ALL animal-specific questions ---
  add(3, 'yes', 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 67, 68, 69, 70)

  // --- HUMAN = no → skip ALL human profession/identity questions ---
  add(3, 'no', 15, 16, 17, 18, 19, 20, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 76, 77, 78, 79, 80)

  // --- FICTIONAL = yes → skip ALL real-world profession/identity questions ---
  add(4, 'yes', 16, 17, 18, 19, 20, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 76, 77, 78, 79, 80)

  // --- FICTIONAL = no → skip ALL fictional-universe questions ---
  add(4, 'no', 54, 55, 56, 57, 58, 59, 60, 61, 62, 71, 72, 73, 74, 75, 81)

  // --- SUPERHERO = yes → skip real-world professions ---
  add(56, 'yes', 16, 17, 18, 19, 20, 76, 77, 78, 79, 80)

  // --- HAS SUPERPOWERS = yes → skip real-world professions ---
  add(74, 'yes', 16, 17, 18, 19, 20, 76, 77, 78, 79, 80)

  // --- MARVEL/DC = yes → skip real-world professions and other universe questions ---
  add(71, 'yes', 16, 17, 18, 19, 20, 76, 77, 78, 79, 80, 81, 57, 58, 59, 73, 75)
  add(81, 'yes', 16, 17, 18, 19, 20, 76, 77, 78, 79, 80, 71, 57, 58, 59, 73, 75)

  // --- DISNEY = yes → skip Marvel/DC/Star Wars specific, real professions ---
  add(57, 'yes', 71, 81, 73, 76, 77, 78, 79, 80)

  // --- NINTENDO = yes → skip Marvel/DC/Disney/Star Wars/HP, real professions ---
  add(58, 'yes', 71, 81, 57, 59, 73, 75, 76, 77, 78, 79, 80)

  // --- ANIME = yes → skip Marvel/DC/Disney/Nintendo/Star Wars/HP, real professions, live-action ---
  add(59, 'yes', 71, 81, 57, 58, 73, 75, 76, 77, 78, 79, 80, 130, 134, 135, 136)

  // --- STAR WARS = yes → skip Marvel/DC/Disney/Nintendo/Anime/HP, real professions ---
  add(73, 'yes', 71, 81, 57, 58, 59, 75, 76, 77, 78, 79, 80)

  // --- HARRY POTTER = yes → skip Marvel/DC/Disney/Nintendo/Anime/Star Wars, real professions ---
  add(75, 'yes', 71, 81, 57, 58, 59, 73, 76, 77, 78, 79, 80)

  // --- VIDEO GAME = yes → skip real professions, movie/TV specific ---
  add(60, 'yes', 76, 77, 78, 79, 80)

  // --- ANIMAL TAXONOMY CONTRADICTIONS ---
  add(27, 'yes', 14, 26, 13, 9, 8)
  add(26, 'yes', 27, 14, 13, 8)
  add(14, 'yes', 27, 26, 13, 9, 8)
  add(13, 'yes', 27, 26, 14, 9, 8)
  add(9, 'yes', 8)

  // --- SIZE/SPEED CONTRADICTIONS ---
  add(11, 'yes', 12)
  add(12, 'yes', 11)
  add(33, 'yes', 34)
  add(34, 'yes', 33)

  // --- GENDER CONTRADICTIONS ---
  add(52, 'yes', 53)
  add(53, 'yes', 52)

  // --- FLY vs AQUATIC ---
  add(6, 'yes', 7)
  add(7, 'yes', 6)

  // --- PROFESSION MUTUAL EXCLUSION ---
  // If one profession is confirmed, skip all other profession questions
  const PROFESSIONS: QuestionId[] = [17, 18, 19, 20, 76, 77, 78, 79, 80]
  for (const p of PROFESSIONS) {
    const others = PROFESSIONS.filter((o) => o !== p)
    add(p, 'yes', ...others)
  }

  // --- NATIONALITY MUTUAL EXCLUSION ---
  // Specific countries only — Q45 (Europeo) is regional, not a country,
  // so answering European should NOT exclude asking about Spain, UK, etc.
  const NATIONALITIES: QuestionId[] = [16, 44, 46, 47, 181, 182, 183, 184, 185, 186]
  for (const n of NATIONALITIES) {
    const others = NATIONALITIES.filter((o) => o !== n)
    add(n, 'yes', ...others)
  }

  // --- MUSIC GENRE MUTUAL EXCLUSION ---
  const MUSIC_GENRES: QuestionId[] = [154, 155, 156, 157]
  for (const g of MUSIC_GENRES) {
    const others = MUSIC_GENRES.filter((o) => o !== g)
    add(g, 'yes', ...others)
  }

  // --- SPORT MUTUAL EXCLUSION (only one primary sport) ---
  const SPORTS: QuestionId[] = [76, 187, 188, 189, 190]
  for (const s of SPORTS) {
    const others = SPORTS.filter((o) => o !== s)
    add(s, 'yes', ...others)
  }

  // --- ROYALTY → skip many real-world profession questions ---
  add(194, 'yes', 76, 77, 78, 79, 80, 187, 188, 189, 190, 191)

  // --- FICTIONAL = no → skip sport/role questions that only apply to fictional ---
  add(4, 'yes', 187, 188, 189, 190, 191, 194)

  // --- NOT HUMAN → skip new nationality/profession questions ---
  add(3, 'no', 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200)

  // --- NOT ALIVE → skip alive-only questions ---
  add(1, 'no', 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200)

  // --- HAS SUPERPOWERS = no → skip universe-specific superpower questions ---
  add(74, 'no', 71, 81, 56, 61)

  // --- NEW QUESTIONS (82-138) CONTRADICTIONS ---
  add(4, 'no', 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138)

  // Animal = yes → NOT humanoid (82), NOT speak like human (83)
  add(2, 'yes', 82, 83)

  // Humanoid = no → skip speak (83), clothing (88)
  add(82, 'no', 83, 88)

  // UNIVERSE MUTUAL EXCLUSION
  // SYNC REQUIRED with learnModeConfig.ts:
  // The universe/franchise entries here must mirror the corresponding EXCLUSIVE_GROUPS in learnModeConfig.ts.
  // Adding a new franchise? Update BOTH files. A sync test exists in contradictions.test.ts.
  const UNIVERSES: QuestionId[] = [57, 58, 59, 71, 73, 75, 81, 84, 85, 93, 94, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 131, 132, 133, 134, 135, 136, 137, 138]
  for (const u of UNIVERSES) {
    const others = UNIVERSES.filter((o) => o !== u)
    add(u, 'yes', ...others)
  }

  // Universe-specific trait exclusions
  add(85, 'yes', 86, 87, 91)
  add(89, 'yes', 84, 85, 93, 94)

  // Dragon Ball specific contradictions
  add(228, 'yes', 229, 230, 233)  // Saiyajin → not Namekiano, not androide, not humano puro
  add(229, 'yes', 228, 230, 233)  // Namekiano → not Saiyajin, not androide, not humano puro
  add(230, 'yes', 228, 229, 233)  // Androide → not Saiyajin, not Namekiano, not humano puro
  add(233, 'yes', 228, 229, 230)  // Humano puro → not Saiyajin, not Namekiano, not androide

  // Deduplicate
  const seen = new Set<string>()
  return contradictions.filter(rule => {
    const key = rule.join(',')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export const CONTRADICTIONS: Contradiction[] = buildContradictions()
