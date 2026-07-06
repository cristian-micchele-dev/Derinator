import { QuestionId, type AnyQuestionId } from '../questions'

export const CATEGORY_QUESTIONS: QuestionId[] = [1, 2, 3, 4]

/** Broad fiction universe questions (top-level categories) */
export const BROAD_UNIVERSE_QUESTIONS: QuestionId[] = [
  57, 58, 59, 60, 71, 73, 75, 81, 84, 85, 134, 135, 136, 137, 138
]

/** Specific universe drill-down questions (only relevant after broad confirmation) */
export const SPECIFIC_UNIVERSE_QUESTIONS: QuestionId[] = [
  93, 94, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 131, 132, 133, 219
]

/** All universe questions combined */
export const UNIVERSE_QUESTIONS: QuestionId[] = [
  ...BROAD_UNIVERSE_QUESTIONS,
  ...SPECIFIC_UNIVERSE_QUESTIONS,
]

export const POKEMON_TYPE_QUESTIONS: QuestionId[] = [
  161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180
]

export const DRAGON_BALL_QUESTIONS: QuestionId[] = [228, 229, 230, 231, 232, 233, 234, 235, 236]

/** Confirmer questions — ultra-specific, each maps to a single character */
export const CONFIRMER_QUESTIONS: QuestionId[] = [
  // Fiction confirmers (248–346)
  248, 249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259, 260,
  261, 262, 263, 264, 265, 266, 267, 268, 269, 270, 271, 272, 273,
  274, 275, 276, 277, 278, 279,
  280, 281, 282, 283, 284, 285, 286, 287, 288, 289, 290, 291, 292,
  293, 294, 295, 296, 297, 298, 299, 300, 301, 302, 303, 304, 305,
  306, 307, 308, 309, 310, 311, 312, 313, 314, 315, 316, 317, 318,
  319, 320, 321, 322, 323, 324, 325, 326, 327, 328, 329, 330, 331,
  332, 333, 334, 335, 336, 337, 338, 339, 340, 341, 342, 343, 344,
  345, 346,
  // Famosos confirmers (347–499)
  347, 348, 349, 350, 351, 352, 353, 354, 355, 356, 357, 358, 359,
  360, 361, 362, 363, 364, 365, 366, 367, 368, 369, 370, 371, 372,
  373, 374, 375, 376, 377, 378, 379, 380, 381, 382, 383, 384, 385,
  386, 387, 388, 389, 390, 391, 392, 393, 394, 395, 396, 397, 398,
  399, 400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411,
  412, 413, 414, 415, 416, 417, 418, 419, 420, 421, 422, 423, 424,
  425, 426, 427, 428, 429, 430, 431, 432, 433, 434, 435, 436, 437,
  438, 439, 440, 441, 442, 443, 444, 445, 446, 447, 448, 449, 450,
  451, 452, 453, 454, 455, 456, 457, 458, 459, 460, 461, 462, 463,
  464, 465, 466, 467, 468, 469, 470, 471, 472, 473, 474, 475, 476,
  477, 478, 479, 480, 481, 482, 483, 484, 485, 486, 487, 488, 489,
  490, 491, 492, 493, 494, 495, 496, 497, 498, 499,
] as unknown as QuestionId[]

export const ROLE_QUESTIONS: QuestionId[] = [
  // Fiction roles
  72, 121, 122, 123, 124, 128, 129, 224, 225, 226,
  // Real-person professions (same exclusive group — mutually exclusive, high-signal)
  17, 18, 19, 20, 76, 77, 78, 79, 80,
]
export const POWER_QUESTIONS: QuestionId[] = [56, 61, 74, 86, 87, 127]
export const NATIONALITY_QUESTIONS: QuestionId[] = [16, 44, 45, 46, 47, 181, 182, 183, 184, 185]
export const DISCRIMINATIVE_QUESTIONS: QuestionId[] = [139, 140, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 201, 202, 203, 220, 221, 222, 223, 227, 228, 229, 230, 231, 233, 234, 235, 236]

/** Key animal discriminators — prioritized so they're asked before entropy fallback */
export const ANIMAL_DISCRIMINATIVE_QUESTIONS: QuestionId[] = [
  5,   // ¿Es doméstico?           — mascotas vs salvajes
  12,  // ¿Es pequeño?             — rata/gato vs vaca/caballo
  27,  // ¿Es un mamífero?         — mamíferos vs reptiles/aves/insectos
  70,  // ¿Es un animal de granja? — cerdo/vaca vs resto
  217, // ¿Es de color rosado?     — cerdo/flamenco vs resto
  500, // ¿Es un animal que ladra? — perro vs gato/resto
] as unknown as QuestionId[]

/** Famosos nationality equivalents to fiction's franchise question groups */
export const FAMOSOS_BROAD_NAT_QUESTIONS: QuestionId[] = [16, 44, 45] as QuestionId[]
export const FAMOSOS_SPECIFIC_EU_QUESTIONS: QuestionId[] = [183, 184, 185] as QuestionId[]
export const FAMOSOS_SPECIFIC_OTHER_QUESTIONS: QuestionId[] = [47, 181, 182, 46] as QuestionId[]

// ===== Weight lookup Sets (O(1) instead of O(n) Array.includes) =====

export const CONFIRMER_QUESTIONS_SET: ReadonlySet<number> = new Set(CONFIRMER_QUESTIONS as unknown as number[])
export const UNIVERSE_QUESTIONS_SET: ReadonlySet<number> = new Set(UNIVERSE_QUESTIONS)
export const ROLE_QUESTIONS_SET: ReadonlySet<number> = new Set(ROLE_QUESTIONS)
export const POWER_QUESTIONS_SET: ReadonlySet<number> = new Set(POWER_QUESTIONS)
export const CATEGORY_QUESTIONS_SET: ReadonlySet<number> = new Set(CATEGORY_QUESTIONS)

/** Subjective appearance features — ambiguous enough to warrant reduced weight */
export const PHYSICAL_APPEARANCE_QUESTIONS: QuestionId[] = [51, 125]
export const PHYSICAL_APPEARANCE_QUESTIONS_SET: ReadonlySet<number> = new Set(PHYSICAL_APPEARANCE_QUESTIONS)

/** Racial/physical appearance questions (Q36–Q42) */
export const RACIAL_APPEARANCE_QUESTIONS: QuestionId[] = [36, 37, 38, 39, 40, 41, 42]
export const RACIAL_APPEARANCE_QUESTIONS_SET: ReadonlySet<number> = new Set(RACIAL_APPEARANCE_QUESTIONS)

export const SPECIAL_WEIGHT_QUESTIONS: QuestionId[] = [122, 130]
export const SPECIAL_WEIGHT_QUESTIONS_SET: ReadonlySet<number> = new Set(SPECIAL_WEIGHT_QUESTIONS)

export type { AnyQuestionId }
