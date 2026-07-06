import { Answer } from '../../../types'
import { QuestionId } from '../../questions'

type Implication = [QuestionId, Answer, QuestionId, Answer]

// ─── Builders ────────────────────────────────────────────────────────────────

/**
 * All pairs A=yes → B=no for a set of mutually exclusive IDs.
 * Adding a new member only requires adding its ID to the array.
 */
function mutuallyExclusive(ids: number[]): Implication[] {
  const rules: Implication[] = []
  for (const a of ids) {
    for (const b of ids) {
      if (a !== b) rules.push([a as QuestionId, 'yes', b as QuestionId, 'no'])
    }
  }
  return rules
}


// ─── Nationality groups ───────────────────────────────────────────────────────

/** All specific-country question IDs. Mutually exclusive with each other. */
const SPECIFIC_COUNTRIES = [16, 44, 46, 47, 181, 182, 183, 184, 185, 186]
/** Q45 = ¿Es europeo? — regional, NOT in SPECIFIC_COUNTRIES */
const Q_EUROPEAN = 45

/** Countries that imply European = yes */
const EU_COUNTRIES    = [183, 184, 185, 186] // España, UK, Italia, Francia
/** Countries that imply European = no */
const NON_EU_COUNTRIES = [16, 44, 46, 47, 181, 182] // Argentina, USA, Japón, Brasil, México, Colombia

// ─── Fictional universe IDs (Q4=no implies all of these = no) ────────────────
const FICTIONAL_UNIVERSES = [
  56, 71, 81, 57, 58, 59, 73, 75, 60, 61, 54, 55, 74,
  97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110,
  111, 112, 113, 114, 115, 116, 117, 118, 119, 120,
]

// ─── Music genre IDs (mutually exclusive) ────────────────────────────────────
const MUSIC_GENRES = [154, 155, 156, 157] // pop, rock, rap, reggaeton

// ─────────────────────────────────────────────────────────────────────────────

export const IMPLICATIONS: Implication[] = [
  // --- CATEGORY IMPLICATIONS ---
  [2, 'yes', 1, 'yes'],
  [3, 'yes', 1, 'yes'],
  [21, 'yes', 1, 'no'],
  [21, 'yes', 2, 'no'],
  [21, 'yes', 3, 'no'],
  [24, 'yes', 1, 'no'],
  [24, 'yes', 2, 'no'],
  [24, 'yes', 3, 'no'],

  // --- ANIMAL → HUMAN BOUNDARIES ---
  [2, 'yes', 3, 'no'],
  [3, 'yes', 2, 'no'],
  [3, 'yes', 21, 'no'],
  [3, 'yes', 24, 'no'],

  // --- FICTIONAL IMPLICATIONS ---
  [4, 'yes', 20, 'probably_not'],
  [4, 'yes', 43, 'probably_not'],
  [4, 'yes', 15, 'probably_not'],
  [56, 'yes', 4, 'yes'],
  [56, 'yes', 74, 'probably'],
  [74, 'yes', 4, 'yes'],
  [71, 'yes', 4, 'yes'],
  [71, 'yes', 74, 'probably'],
  [81, 'yes', 4, 'yes'],
  [81, 'yes', 74, 'probably'],
  [57, 'yes', 4, 'yes'],
  [58, 'yes', 4, 'yes'],
  [58, 'yes', 60, 'yes'],
  [59, 'yes', 4, 'yes'],
  [73, 'yes', 4, 'yes'],
  [73, 'yes', 62, 'probably'],
  [75, 'yes', 4, 'yes'],
  [75, 'yes', 61, 'yes'],
  [60, 'yes', 4, 'yes'],
  [97, 'yes', 4, 'yes'],
  [98, 'yes', 4, 'yes'],
  [99, 'yes', 4, 'yes'],
  [100, 'yes', 4, 'yes'],
  [101, 'yes', 4, 'yes'],
  [102, 'yes', 4, 'yes'],
  [103, 'yes', 4, 'yes'],
  [104, 'yes', 4, 'yes'],
  [105, 'yes', 4, 'yes'],
  [106, 'yes', 4, 'yes'],
  [107, 'yes', 4, 'yes'],
  [108, 'yes', 4, 'yes'],
  [109, 'yes', 4, 'yes'],
  [110, 'yes', 4, 'yes'],
  [111, 'yes', 4, 'yes'],
  [112, 'yes', 4, 'yes'],
  [113, 'yes', 4, 'yes'],
  [114, 'yes', 4, 'yes'],
  [115, 'yes', 4, 'yes'],
  [116, 'yes', 4, 'yes'],
  [117, 'yes', 4, 'yes'],
  [118, 'yes', 4, 'yes'],
  [119, 'yes', 4, 'yes'],
  [120, 'yes', 4, 'yes'],
  [120, 'yes', 74, 'probably'],
  [120, 'yes', 82, 'yes'],
  [54, 'yes', 4, 'yes'],
  [55, 'yes', 4, 'yes'],
  [61, 'yes', 4, 'yes'],

  // --- FICTIONAL = no → universe questions = no (generated) ---
  ...FICTIONAL_UNIVERSES.map(id => [4, 'no', id, 'no'] as Implication),

  // --- NATIONALITY (all specific countries mutually exclusive) ---
  ...mutuallyExclusive(SPECIFIC_COUNTRIES),

  // European countries → Q45 (Europeo) = yes
  ...EU_COUNTRIES.map(c => [c, 'yes', Q_EUROPEAN, 'yes'] as Implication),

  // Non-European specific countries → Q45 = no
  ...NON_EU_COUNTRIES.map(c => [c, 'yes', Q_EUROPEAN, 'no'] as Implication),

  // Q45=yes → specific non-European countries = no
  ...NON_EU_COUNTRIES.map(c => [Q_EUROPEAN, 'yes', c, 'no'] as Implication),

  // Q45=probably → specific non-European countries = no
  ...NON_EU_COUNTRIES.map(c => [Q_EUROPEAN, 'probably', c, 'no'] as Implication),

  // --- ANIMAL TAXONOMY IMPLICATIONS ---
  [27, 'yes', 14, 'no'],
  [27, 'yes', 26, 'no'],
  [27, 'yes', 13, 'no'],
  [27, 'yes', 9, 'no'],
  [26, 'yes', 25, 'yes'],
  [26, 'yes', 9, 'yes'],
  [26, 'yes', 6, 'yes'],
  [26, 'yes', 27, 'no'],
  [26, 'yes', 14, 'no'],
  [26, 'yes', 13, 'no'],
  [26, 'yes', 8, 'no'],
  [14, 'yes', 27, 'no'],
  [14, 'yes', 26, 'no'],
  [14, 'yes', 13, 'no'],
  [14, 'yes', 9, 'no'],
  [14, 'yes', 8, 'no'],
  [13, 'yes', 27, 'no'],
  [13, 'yes', 26, 'no'],
  [13, 'yes', 14, 'no'],
  [13, 'yes', 9, 'no'],
  [13, 'yes', 8, 'no'],
  [9, 'yes', 25, 'yes'],
  [9, 'yes', 8, 'no'],
  [9, 'yes', 6, 'yes'],
  [8, 'yes', 27, 'probably'],
  [8, 'yes', 9, 'no'],
  [25, 'yes', 6, 'probably'],
  [6, 'yes', 25, 'yes'],
  [6, 'yes', 7, 'probably_not'],
  [7, 'yes', 6, 'probably_not'],
  [7, 'yes', 30, 'probably'],
  [7, 'yes', 25, 'probably_not'],
  [30, 'yes', 7, 'yes'],

  // --- ANIMAL BEHAVIOR ---
  [5, 'yes', 10, 'probably_not'],
  [5, 'yes', 28, 'probably_not'],
  [10, 'yes', 28, 'probably'],
  [28, 'yes', 10, 'probably'],
  [67, 'yes', 10, 'yes'],

  // --- HUMAN PROFESSION IMPLICATIONS ---
  [17, 'yes', 3, 'yes'],
  [17, 'yes', 15, 'probably'],
  [18, 'yes', 3, 'yes'],
  [18, 'yes', 15, 'probably'],
  [19, 'yes', 3, 'yes'],
  [19, 'yes', 15, 'probably'],
  [20, 'yes', 3, 'yes'],
  [20, 'yes', 43, 'no'],
  [78, 'yes', 3, 'yes'],
  [78, 'yes', 20, 'probably'],
  [79, 'yes', 3, 'yes'],
  [79, 'yes', 15, 'probably'],
  [80, 'yes', 3, 'yes'],
  [80, 'yes', 20, 'probably'],
  [76, 'yes', 3, 'yes'],
  [76, 'yes', 17, 'yes'],
  [76, 'yes', 15, 'yes'],
  [77, 'yes', 3, 'yes'],
  [77, 'yes', 15, 'yes'],
  [15, 'yes', 3, 'probably'],

  // --- GENDER ---
  [52, 'yes', 53, 'no'],
  [53, 'yes', 52, 'no'],

  // --- SIZE/SPEED ---
  [11, 'yes', 12, 'no'],
  [12, 'yes', 11, 'no'],
  [33, 'yes', 34, 'no'],
  [34, 'yes', 33, 'no'],

  // --- VILLAIN IMPLICATIONS ---
  [72, 'yes', 4, 'yes'],
  [72, 'yes', 10, 'probably'],

  // --- COLOR IMPLICATIONS ---
  [39, 'yes', 40, 'no'],
  [40, 'yes', 39, 'no'],

  // --- NEW DISCRIMINATIVE QUESTIONS (82-96) ---
  [85, 'yes', 82, 'no'],
  [85, 'yes', 83, 'no'],
  [85, 'yes', 4, 'yes'],
  [85, 'yes', 59, 'yes'],
  [84, 'yes', 4, 'yes'],
  [84, 'yes', 59, 'yes'],
  [84, 'yes', 46, 'yes'],
  [84, 'yes', 74, 'yes'],
  [93, 'yes', 4, 'yes'],
  [93, 'yes', 59, 'yes'],
  [93, 'yes', 46, 'yes'],
  [93, 'yes', 74, 'yes'],
  [94, 'yes', 4, 'yes'],
  [94, 'yes', 59, 'yes'],
  [94, 'yes', 46, 'yes'],
  [94, 'yes', 74, 'yes'],
  [89, 'yes', 4, 'yes'],
  [89, 'yes', 82, 'probably'],
  [86, 'yes', 4, 'yes'],
  [86, 'yes', 74, 'yes'],
  [87, 'yes', 4, 'yes'],
  [87, 'yes', 74, 'probably'],
  [96, 'yes', 4, 'yes'],
  [95, 'yes', 4, 'probably'],
  [88, 'yes', 82, 'probably'],
  [83, 'yes', 82, 'yes'],

  // NEW questions implications
  [122, 'yes', 4, 'yes'],
  [130, 'yes', 3, 'probably'],
  [121, 'yes', 15, 'probably'],
  [128, 'yes', 56, 'probably'],
  [127, 'yes', 4, 'probably'],
  [131, 'yes', 4, 'yes'],
  [131, 'yes', 59, 'yes'],
  [132, 'yes', 4, 'yes'],
  [132, 'yes', 59, 'yes'],
  [133, 'yes', 4, 'yes'],
  [133, 'yes', 59, 'yes'],
  [134, 'yes', 4, 'yes'],
  [134, 'yes', 130, 'yes'],
  [135, 'yes', 3, 'yes'],
  [135, 'yes', 130, 'yes'],
  [136, 'yes', 3, 'yes'],
  [136, 'yes', 130, 'yes'],
  [137, 'yes', 4, 'yes'],
  [138, 'yes', 4, 'yes'],

  // --- NEGATIVE IMPLICATIONS ---
  [52, 'no', 53, 'probably'],
  [53, 'no', 52, 'probably'],
  [1, 'no', 4, 'probably'],
  [3, 'no', 2, 'probably'],
  [2, 'no', 3, 'probably'],
  [4, 'no', 15, 'probably'],
  [15, 'no', 77, 'no'],
  [15, 'no', 19, 'no'],
  [15, 'no', 18, 'no'],
  [15, 'no', 76, 'no'],

  // --- SPORT IMPLICATIONS ---
  [187, 'yes', 17, 'yes'],
  [188, 'yes', 17, 'yes'],
  [189, 'yes', 17, 'yes'],
  [190, 'yes', 17, 'yes'],
  [187, 'yes', 76, 'no'],
  [188, 'yes', 76, 'no'],
  [189, 'yes', 76, 'no'],
  [190, 'yes', 76, 'no'],

  // --- ROLE IMPLICATIONS ---
  [191, 'yes', 15, 'probably'],
  [192, 'yes', 15, 'probably'],
  [193, 'yes', 15, 'probably'],
  [194, 'yes', 3, 'yes'],
  [194, 'yes', 43, 'no'],
  [195, 'yes', 3, 'yes'],
  [194, 'yes', 20, 'yes'],
  [200, 'yes', 15, 'probably'],

  // --- DRAGON BALL SPECIFIC IMPLICATIONS ---
  [228, 'yes', 4, 'yes'],
  [228, 'yes', 59, 'yes'],
  [228, 'yes', 84, 'yes'],
  [229, 'yes', 4, 'yes'],
  [229, 'yes', 59, 'yes'],
  [229, 'yes', 84, 'yes'],
  [230, 'yes', 4, 'yes'],
  [230, 'yes', 59, 'yes'],
  [230, 'yes', 84, 'yes'],
  [233, 'yes', 82, 'yes'],
  [233, 'yes', 228, 'no'],
  [233, 'yes', 229, 'no'],
  [233, 'yes', 230, 'no'],

  // --- ROYALTY IMPLICATIONS ---
  [235, 'yes', 3, 'yes'],
  [235, 'yes', 15, 'probably'],

  // --- MUSIC GENRE (mutually exclusive) ---
  ...mutuallyExclusive(MUSIC_GENRES),
]
