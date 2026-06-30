import { Answer } from '../../../types'
import { QuestionId } from '../../questions'

type Implication = [QuestionId, Answer, QuestionId, Answer]

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

  // --- FICTIONAL = no → REAL WORLD IMPLICATIONS ---
  [4, 'no', 56, 'no'],
  [4, 'no', 71, 'no'],
  [4, 'no', 81, 'no'],
  [4, 'no', 57, 'no'],
  [4, 'no', 58, 'no'],
  [4, 'no', 59, 'no'],
  [4, 'no', 73, 'no'],
  [4, 'no', 75, 'no'],
  [4, 'no', 60, 'no'],
  [4, 'no', 61, 'no'],
  [4, 'no', 54, 'no'],
  [4, 'no', 55, 'no'],
  [4, 'no', 74, 'no'],
  [4, 'no', 97, 'no'],
  [4, 'no', 98, 'no'],
  [4, 'no', 99, 'no'],
  [4, 'no', 100, 'no'],
  [4, 'no', 101, 'no'],
  [4, 'no', 102, 'no'],
  [4, 'no', 103, 'no'],
  [4, 'no', 104, 'no'],
  [4, 'no', 105, 'no'],
  [4, 'no', 106, 'no'],
  [4, 'no', 107, 'no'],
  [4, 'no', 108, 'no'],
  [4, 'no', 109, 'no'],
  [4, 'no', 110, 'no'],
  [4, 'no', 111, 'no'],
  [4, 'no', 112, 'no'],
  [4, 'no', 113, 'no'],
  [4, 'no', 114, 'no'],
  [4, 'no', 115, 'no'],
  [4, 'no', 116, 'no'],
  [4, 'no', 117, 'no'],
  [4, 'no', 118, 'no'],
  [4, 'no', 119, 'no'],
  [4, 'no', 120, 'no'],

  // --- NATIONALITY IMPLICATIONS (mutually exclusive) ---
  [16, 'yes', 44, 'no'],
  [16, 'yes', 45, 'no'],
  [16, 'yes', 46, 'no'],
  [16, 'yes', 47, 'no'],
  [44, 'yes', 16, 'no'],
  [44, 'yes', 45, 'no'],
  [44, 'yes', 46, 'no'],
  [44, 'yes', 47, 'no'],
  [45, 'yes', 16, 'no'],
  [45, 'yes', 44, 'no'],
  [45, 'yes', 46, 'no'],
  [45, 'yes', 47, 'no'],
  [46, 'yes', 16, 'no'],
  [46, 'yes', 44, 'no'],
  [46, 'yes', 45, 'no'],
  [46, 'yes', 47, 'no'],
  [47, 'yes', 16, 'no'],
  [47, 'yes', 44, 'no'],
  [47, 'yes', 45, 'no'],
  [47, 'yes', 46, 'no'],

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

  // --- NEGATIVE IMPLICATIONS (No → implies something) ---
  // Not woman → probably man (in this binary game context)
  [52, 'no', 53, 'probably'],
  // Not man → probably woman
  [53, 'no', 52, 'probably'],
  // Not alive → probably fictional or historical
  [1, 'no', 4, 'probably'],
  // Not human → probably animal
  [3, 'no', 2, 'probably'],
  // Not animal → probably human
  [2, 'no', 3, 'probably'],
  // Not fictional → probably famous/real (alive or historical — no bias, q43 asked directly)
  [4, 'no', 15, 'probably'],
  // Not famous → probably not a youtuber, actor, musician
  [15, 'no', 77, 'no'],
  [15, 'no', 19, 'no'],
  [15, 'no', 18, 'no'],
  [15, 'no', 76, 'no'],

  // --- NEW NATIONALITY IMPLICATIONS (mutually exclusive) ---
  [181, 'yes', 16, 'no'],  // Mexican → not Argentine
  [181, 'yes', 44, 'no'],  // Mexican → not American
  [181, 'yes', 45, 'no'],  // Mexican → not European
  [181, 'yes', 46, 'no'],  // Mexican → not Japanese
  [181, 'yes', 47, 'no'],  // Mexican → not Brazilian
  [181, 'yes', 182, 'no'], // Mexican → not Colombian
  [181, 'yes', 183, 'no'], // Mexican → not Spanish
  [181, 'yes', 184, 'no'], // Mexican → not British
  [181, 'yes', 185, 'no'], // Mexican → not Italian
  [181, 'yes', 186, 'no'], // Mexican → not French
  [182, 'yes', 16, 'no'],
  [182, 'yes', 44, 'no'],
  [182, 'yes', 45, 'no'],
  [182, 'yes', 46, 'no'],
  [182, 'yes', 47, 'no'],
  [182, 'yes', 181, 'no'],
  [182, 'yes', 183, 'no'],
  [182, 'yes', 184, 'no'],
  [182, 'yes', 185, 'no'],
  [182, 'yes', 186, 'no'],
  [183, 'yes', 16, 'no'],
  [183, 'yes', 44, 'no'],
  [183, 'yes', 45, 'yes'], // Spanish → European
  [183, 'yes', 46, 'no'],
  [183, 'yes', 47, 'no'],
  [183, 'yes', 181, 'no'],
  [183, 'yes', 182, 'no'],
  [183, 'yes', 184, 'no'],
  [183, 'yes', 185, 'no'],
  [183, 'yes', 186, 'no'],
  [184, 'yes', 16, 'no'],
  [184, 'yes', 44, 'no'],
  [184, 'yes', 45, 'yes'], // British → European
  [184, 'yes', 46, 'no'],
  [184, 'yes', 47, 'no'],
  [184, 'yes', 181, 'no'],
  [184, 'yes', 182, 'no'],
  [184, 'yes', 183, 'no'],
  [184, 'yes', 185, 'no'],
  [184, 'yes', 186, 'no'],
  [185, 'yes', 16, 'no'],
  [185, 'yes', 44, 'no'],
  [185, 'yes', 45, 'yes'], // Italian → European
  [185, 'yes', 46, 'no'],
  [185, 'yes', 47, 'no'],
  [185, 'yes', 181, 'no'],
  [185, 'yes', 182, 'no'],
  [185, 'yes', 183, 'no'],
  [185, 'yes', 184, 'no'],
  [185, 'yes', 186, 'no'],
  [186, 'yes', 16, 'no'],
  [186, 'yes', 44, 'no'],
  [186, 'yes', 45, 'yes'], // French → European
  [186, 'yes', 46, 'no'],
  [186, 'yes', 47, 'no'],
  [186, 'yes', 181, 'no'],
  [186, 'yes', 182, 'no'],
  [186, 'yes', 183, 'no'],
  [186, 'yes', 184, 'no'],
  [186, 'yes', 185, 'no'],

  // --- SPORT IMPLICATIONS ---
  [187, 'yes', 17, 'yes'],  // Basketball → athlete
  [188, 'yes', 17, 'yes'],  // Tennis → athlete
  [189, 'yes', 17, 'yes'],  // Golf → athlete
  [190, 'yes', 17, 'yes'],  // Boxing → athlete
  [187, 'yes', 76, 'no'],   // Basketball → not football
  [188, 'yes', 76, 'no'],   // Tennis → not football
  [189, 'yes', 76, 'no'],   // Golf → not football
  [190, 'yes', 76, 'no'],   // Boxing → not football

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
  [228, 'yes', 4, 'yes'],   // Saiyajin → fiction
  [228, 'yes', 59, 'yes'],  // Saiyajin → anime
  [228, 'yes', 84, 'yes'],  // Saiyajin → Dragon Ball
  [229, 'yes', 4, 'yes'],   // Namekiano → fiction
  [229, 'yes', 59, 'yes'],  // Namekiano → anime
  [229, 'yes', 84, 'yes'],  // Namekiano → Dragon Ball
  [230, 'yes', 4, 'yes'],   // Androide → fiction
  [230, 'yes', 59, 'yes'],  // Androide → anime
  [230, 'yes', 84, 'yes'],  // Androide → Dragon Ball
  [233, 'yes', 82, 'yes'],  // Humano puro → forma humana
  [233, 'yes', 228, 'no'],  // Humano puro → not Saiyajin
  [233, 'yes', 229, 'no'],  // Humano puro → not Namekiano
  [233, 'yes', 230, 'no'],  // Humano puro → not androide

  // --- ROYALTY/Couple IMPLICATIONS ---
  [235, 'yes', 3, 'yes'],   // Realeza → humano
  [235, 'yes', 15, 'probably'],  // Realeza → probablemente famoso
]
