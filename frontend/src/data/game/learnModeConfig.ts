import type { Answer } from '../../types'
import type { QuestionId } from '../questions'

export const MIN_MANUAL_QUESTIONS = 30

// Questions excluded from LearnMode (irrelevant for teaching)
export const LEARN_EXCLUDED: Set<QuestionId> = new Set([
  12 as QuestionId,   // ¿Es pequeño?
  95 as QuestionId,   // ¿Es pequeño como un niño?
  234 as QuestionId,  // ¿Es pequeño/a?
  186 as QuestionId,  // ¿Es de Francia?
])

// Pre-filled answers based on subcategory selection
// These are "known facts" that the user already told us by picking the subcategory
export const SUBCATEGORY_SEEDS: Record<string, Record<number, Answer>> = {
  // Fiction subcategories
  'anime-shonen': { 1: 'yes', 3: 'yes', 4: 'yes', 54: 'yes', 55: 'yes' },
  'anime-seinen': { 1: 'yes', 3: 'yes', 4: 'yes', 54: 'yes', 55: 'yes' },
  'anime-magical-girl': { 1: 'yes', 3: 'yes', 4: 'yes', 54: 'yes', 52: 'yes' },
  videojuego: { 1: 'yes', 4: 'yes', 60: 'yes' },
  superheroe: { 1: 'yes', 4: 'yes', 56: 'yes', 74: 'yes' },
  disney: { 1: 'yes', 4: 'yes', 57: 'yes' },
  nintendo: { 1: 'yes', 4: 'yes', 58: 'yes', 60: 'yes' },
  // Real-person subcategories
  'historico-real': { 1: 'yes', 3: 'yes', 4: 'no', 15: 'yes', 20: 'yes', 82: 'yes', 83: 'yes' },
  deportista: { 1: 'yes', 3: 'yes', 4: 'no', 15: 'yes', 17: 'yes', 82: 'yes', 83: 'yes' },
  musico: { 1: 'yes', 3: 'yes', 4: 'no', 15: 'yes', 18: 'yes', 82: 'yes', 83: 'yes' },
  actor: { 1: 'yes', 3: 'yes', 4: 'no', 15: 'yes', 19: 'yes', 82: 'yes', 83: 'yes' },
  'youtuber-streamer': { 1: 'yes', 3: 'yes', 4: 'no', 15: 'yes', 77: 'yes', 82: 'yes', 83: 'yes' },
}

// Category-level seeds (applied when no subcategory is chosen)
export const CATEGORY_SEEDS: Record<string, Record<number, Answer>> = {
  animal: { 1: 'yes', 2: 'yes' },
  personaje: { 1: 'yes', 3: 'yes', 4: 'yes' },  // fiction default
  famoso: { 1: 'yes', 3: 'yes', 4: 'no' },       // real person, not fictional
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
  199 as QuestionId, // ¿Es influyente en redes?
  198 as QuestionId, // ¿Es de los mejores de la historia?
  142 as QuestionId, // ¿Ganó un premio importante (Oscar, Grammy, Balón de Oro, etc.)?
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
export const LEARN_QUESTIONS: Record<string, QuestionId[]> = {
  disney: [
    52 as QuestionId,  // ¿Es mujer?
    82 as QuestionId,  // ¿Tiene forma humana?
    570 as QuestionId, // ¿Es un animal o criatura no humana?
    121 as QuestionId, // ¿Es el protagonista principal?
    72 as QuestionId,  // ¿Es un villano?
    571 as QuestionId, // ¿Es el villano principal de su película?
    567 as QuestionId, // ¿Es una princesa Disney?
    566 as QuestionId, // ¿Es de Pixar?
    568 as QuestionId, // ¿Es de un clásico animado (antes del año 2000)?
    569 as QuestionId, // ¿Tiene una canción icónica?
    572 as QuestionId, // ¿Tiene poderes o habilidades mágicas?
    61 as QuestionId,  // ¿Tiene poderes mágicos?
    86 as QuestionId,  // ¿Puede volar sin alas?
    62 as QuestionId,  // ¿Usa arma?
    88 as QuestionId,  // ¿Usa ropa/uniforme característico?
    92 as QuestionId,  // ¿Tiene pelo de color inusual?
    129 as QuestionId, // ¿Tiene compañero, mascota o sidekick?
    89 as QuestionId,  // ¿Es un robot o cyborg?
    56 as QuestionId,  // ¿Es un superhéroe?
  ],
  nintendo: [
    52 as QuestionId,  // ¿Es mujer?
    82 as QuestionId,  // ¿Tiene forma humana?
    121 as QuestionId, // ¿Es el protagonista principal?
    72 as QuestionId,  // ¿Es un villano?
    580 as QuestionId, // ¿Es el personaje principal de su franquicia?
    74 as QuestionId,  // ¿Tiene superpoderes?
    62 as QuestionId,  // ¿Usa arma?
    88 as QuestionId,  // ¿Usa ropa/uniforme característico?
    89 as QuestionId,  // ¿Es un robot o cyborg?
    129 as QuestionId, // ¿Tiene compañero, mascota o sidekick?
    578 as QuestionId, // ¿Aparece en Super Smash Bros?
    579 as QuestionId, // ¿Puede copiar habilidades de otros personajes?
    85 as QuestionId,  // ¿Es un Pokémon?
    573 as QuestionId, // ¿Es de Mario?
    574 as QuestionId, // ¿Es de la franquicia Pokémon?
    100 as QuestionId, // ¿Es de The Legend of Zelda?
    575 as QuestionId, // ¿Es de Kirby?
    576 as QuestionId, // ¿Es de Metroid?
    577 as QuestionId, // ¿Es de Fire Emblem?
  ],
  videojuego: [
    52 as QuestionId,  // ¿Es mujer?
    121 as QuestionId, // ¿Es el protagonista principal?
    72 as QuestionId,  // ¿Es un villano?
    128 as QuestionId, // ¿Es un anti-héroe?
    89 as QuestionId,  // ¿Es un robot o cyborg?
    74 as QuestionId,  // ¿Tiene superpoderes?
    563 as QuestionId, // ¿Puede usar magia o habilidades especiales?
    62 as QuestionId,  // ¿Usa arma?
    127 as QuestionId, // ¿Usa tecnología o gadgets avanzados?
    88 as QuestionId,  // ¿Usa ropa/uniforme característico?
    92 as QuestionId,  // ¿Tiene pelo de color inusual?
    129 as QuestionId, // ¿Tiene compañero, mascota o sidekick?
    91 as QuestionId,  // ¿Es de un juego de pelea?
    564 as QuestionId, // ¿Es el jefe final o antagonista principal?
    565 as QuestionId, // ¿Aparece en más de un juego de la misma saga?
    556 as QuestionId, // ¿Es de un RPG?
    557 as QuestionId, // ¿Es de un juego de disparos (shooter)?
    558 as QuestionId, // ¿Es de un juego de terror / survival horror?
    58 as QuestionId,  // ¿Es de Nintendo?
    100 as QuestionId, // ¿Es de The Legend of Zelda?
    101 as QuestionId, // ¿Es de Final Fantasy?
    103 as QuestionId, // ¿Es de God of War?
    107 as QuestionId, // ¿Es de Kingdom Hearts?
    109 as QuestionId, // ¿Es de The Witcher?
    110 as QuestionId, // ¿Es de Metal Gear?
    559 as QuestionId, // ¿Es de The Last of Us?
    560 as QuestionId, // ¿Es de Resident Evil?
    561 as QuestionId, // ¿Es de Dark Souls / Elden Ring?
    562 as QuestionId, // ¿Es de Grand Theft Auto?
    99 as QuestionId,  // ¿Es de League of Legends?
    102 as QuestionId, // ¿Es de Street Fighter?
    106 as QuestionId, // ¿Es de Mortal Kombat?
  ],
  'anime-shonen': [
    52 as QuestionId,  // ¿Es mujer?
    121 as QuestionId, // ¿Es el protagonista principal?
    72 as QuestionId,  // ¿Es un villano?
    128 as QuestionId, // ¿Es un anti-héroe?
    74 as QuestionId,  // ¿Tiene superpoderes?
    87 as QuestionId,  // ¿Tiene más de una transformación?
    62 as QuestionId,  // ¿Usa arma?
    92 as QuestionId,  // ¿Tiene pelo de color inusual?
    90 as QuestionId,  // ¿Es conocido/a por frase o grito?
    120 as QuestionId, // ¿Es un demonio o ser sobrenatural?
    118 as QuestionId, // ¿Es un samurái?
    124 as QuestionId, // ¿Es muy inteligente o estratega?
    129 as QuestionId, // ¿Tiene compañero, mascota o sidekick?
    233 as QuestionId, // ¿Es humano puro sin poderes especiales?
    84 as QuestionId,  // ¿Es de Dragon Ball?
    93 as QuestionId,  // ¿Es de Naruto?
    94 as QuestionId,  // ¿Es de One Piece?
    115 as QuestionId, // ¿Es de Bleach?
    116 as QuestionId, // ¿Es de Hunter x Hunter?
    131 as QuestionId, // ¿Es de My Hero Academia?
    132 as QuestionId, // ¿Es de Demon Slayer?
    133 as QuestionId, // ¿Es de Jujutsu Kaisen?
    117 as QuestionId, // ¿Es de One Punch Man?
    539 as QuestionId, // ¿Es de Fairy Tail?
    540 as QuestionId, // ¿Usa poder basado en ki, chakra o haki?
    541 as QuestionId, // ¿Es parte de un equipo o grupo de combate?
    542 as QuestionId, // ¿Tiene un rival icónico?
  ],
  'anime-seinen': [
    52 as QuestionId,  // ¿Es mujer?
    121 as QuestionId, // ¿Es el protagonista principal?
    72 as QuestionId,  // ¿Es un villano?
    128 as QuestionId, // ¿Es un anti-héroe?
    74 as QuestionId,  // ¿Tiene superpoderes?
    61 as QuestionId,  // ¿Tiene poderes mágicos?
    62 as QuestionId,  // ¿Usa arma?
    92 as QuestionId,  // ¿Tiene pelo de color inusual?
    120 as QuestionId, // ¿Es un demonio o ser sobrenatural?
    118 as QuestionId, // ¿Es un samurái?
    119 as QuestionId, // ¿Es un detective o investigador?
    124 as QuestionId, // ¿Es muy inteligente o estratega?
    233 as QuestionId, // ¿Es humano puro sin poderes especiales?
    111 as QuestionId, // ¿Es de Attack on Titan?
    112 as QuestionId, // ¿Es de Death Note?
    113 as QuestionId, // ¿Es de Evangelion?
    114 as QuestionId, // ¿Es de Fullmetal Alchemist?
    116 as QuestionId, // ¿Es de Hunter x Hunter?
    543 as QuestionId, // ¿Es de Berserk?
    544 as QuestionId, // ¿Es de Chainsaw Man?
    545 as QuestionId, // ¿Es de Vinland Saga?
    546 as QuestionId, // ¿La historia tiene un tono oscuro o trágico?
    547 as QuestionId, // ¿Es soldado o combatiente en una guerra?
    548 as QuestionId, // ¿Tiene motivaciones moralmente ambiguas?
  ],
  'anime-magical-girl': [
    52 as QuestionId,  // ¿Es mujer?
    121 as QuestionId, // ¿Es el protagonista principal?
    72 as QuestionId,  // ¿Es un villano?
    61 as QuestionId,  // ¿Tiene poderes mágicos?
    87 as QuestionId,  // ¿Tiene más de una transformación?
    92 as QuestionId,  // ¿Tiene pelo de color inusual?
    90 as QuestionId,  // ¿Es conocido/a por frase o grito?
    86 as QuestionId,  // ¿Puede volar sin alas?
    129 as QuestionId, // ¿Tiene compañero, mascota o sidekick?
    549 as QuestionId, // ¿Es de Sailor Moon?
    550 as QuestionId, // ¿Es de Cardcaptor Sakura?
    551 as QuestionId, // ¿Es de Madoka Magica?
    552 as QuestionId, // ¿Grita el nombre de su ataque al usarlo?
    553 as QuestionId, // ¿Usa varita o cetro mágico?
    554 as QuestionId, // ¿Tiene un alter ego o nombre de heroína?
    555 as QuestionId, // ¿Tiene mascota o companion mágico?
  ],
  musico: [
    ...REAL_PERSON_BASE,
    154 as QuestionId, // ¿Es de pop?
    155 as QuestionId, // ¿Es de rock?
    156 as QuestionId, // ¿Es de rap / hip-hop?
    157 as QuestionId, // ¿Es de reggaeton?
    // Pop sub-genres (shown only if Q154=yes via prerequisites)
    514 as QuestionId, // ¿Es dance-pop?
    515 as QuestionId, // ¿Es electropop?
    516 as QuestionId, // ¿Es K-pop?
    // Rap sub-genres (shown only if Q156=yes via prerequisites)
    517 as QuestionId, // ¿Es trap?
    518 as QuestionId, // ¿Es rap consciente / lírico?
    519 as QuestionId, // ¿Tiene un beef famoso con otro artista?
    // Reggaeton sub-genres (shown only if Q157=yes via prerequisites)
    520 as QuestionId, // ¿Es de la vieja escuela del reggaetón (años 90s/2000s)?
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
    126 as QuestionId, // ¿Tiene barba?
    511 as QuestionId, // ¿Compone sus propias canciones?
    512 as QuestionId, // ¿Es parte de una banda o grupo musical?
    513 as QuestionId, // ¿Tiene más de 20 años de carrera artística?
  ],
  actor: [
    ...REAL_PERSON_BASE,
    150 as QuestionId, // ¿Ganó un Oscar?
    151 as QuestionId, // ¿Es conocido/a por acción?
    152 as QuestionId, // ¿Es conocido/a por comedias?
    153 as QuestionId, // ¿Es conocido/a por dramas?
    142 as QuestionId, // ¿Ganó un premio importante?
    126 as QuestionId, // ¿Tiene barba?
    130 as QuestionId, // ¿Es de una serie live-action?
    122 as QuestionId, // ¿Es de una película?
    521 as QuestionId, // ¿Es conocido/a por películas de terror?
    522 as QuestionId, // ¿Es conocido/a por el thriller / suspenso?
    523 as QuestionId, // ¿Ganó un Emmy?
    524 as QuestionId, // ¿Protagonizó una saga o franquicia importante?
    525 as QuestionId, // ¿Es también director/a o productor/a?
    538 as QuestionId, // ¿Es conocido/a por series de acción?
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
    143 as QuestionId, // ¿Es delantero / atacante?
    144 as QuestionId, // ¿Es conocido/a por su velocidad?
    145 as QuestionId, // ¿Es conocido/a por su técnica?
    146 as QuestionId, // ¿Es defensor?
    147 as QuestionId, // ¿Es arquero / portero?
    149 as QuestionId, // ¿Jugó en más de un país?
    126 as QuestionId, // ¿Tiene barba?
    526 as QuestionId, // ¿Compite en deportes individuales?
    527 as QuestionId, // ¿Ganó una medalla olímpica?
    528 as QuestionId, // ¿Sigue activo/a actualmente?
  ],
  'youtuber-streamer': [
    ...REAL_PERSON_BASE,
    142 as QuestionId, // ¿Ganó premio importante?
    126 as QuestionId, // ¿Tiene barba?
    191 as QuestionId, // ¿Es comediante?
    160 as QuestionId, // ¿Es conocido/a por bailar?
    529 as QuestionId, // ¿Es principalmente gamer?
    530 as QuestionId, // ¿Hace streams en vivo regularmente?
    531 as QuestionId, // ¿Tiene más de 10 millones de suscriptores?
    532 as QuestionId, // ¿Es conocido/a por un personaje o alter ego?
    533 as QuestionId, // ¿Colabora frecuentemente con otros creadores?
  ],
  'historico-real': [
    ...REAL_PERSON_BASE,
    80 as QuestionId,  // ¿Es líder político?
    195 as QuestionId, // ¿Ganó un Nobel?
    194 as QuestionId, // ¿Es de la realeza?
    200 as QuestionId, // ¿Es líder espiritual?
    78 as QuestionId,  // ¿Es científico/a?
    126 as QuestionId, // ¿Tiene barba?
    193 as QuestionId, // ¿Es directivo/a o empresario/a?
    46 as QuestionId,  // ¿Es japonés?
    47 as QuestionId,  // ¿Es brasileño?
    185 as QuestionId, // ¿Es de Italia?
  ],
  superheroe: [
    52 as QuestionId,  // ¿Es mujer?
    71 as QuestionId,  // ¿Es de Marvel?
    81 as QuestionId,  // ¿Es de DC Comics?
    72 as QuestionId,  // ¿Es un villano?
    86 as QuestionId,  // ¿Puede volar sin alas?
    54 as QuestionId,  // ¿Usa capa?
    55 as QuestionId,  // ¿Usa máscara?
    62 as QuestionId,  // ¿Usa arma?
    89 as QuestionId,  // ¿Es un robot o cyborg?
    87 as QuestionId,  // ¿Tiene más de una transformación?
    61 as QuestionId,  // ¿Tiene poderes mágicos?
    88 as QuestionId,  // ¿Usa ropa/uniforme característico?
    82 as QuestionId,  // ¿Tiene forma humana?
    128 as QuestionId, // ¿Es un anti-héroe?
    121 as QuestionId, // ¿Es el protagonista principal?
    90 as QuestionId,  // ¿Es conocido por frase o grito?
    127 as QuestionId, // ¿Usa tecnología avanzada / gadgets?
    534 as QuestionId, // ¿Tiene una identidad secreta?
    535 as QuestionId, // ¿Pertenece a un equipo de superhéroes?
    536 as QuestionId, // ¿Es mutante?
    537 as QuestionId, // ¿Sus poderes son de origen tecnológico?
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

// Exclusive groups: when one is answered "yes", the rest auto-fill "no" in LearnMode.
//
// SYNC REQUIRED with rules/contradictions.ts:
// The universe/franchise groups here must mirror the UNIVERSES array in buildContradictions().
// Both define the same mutual exclusion — this one for LearnMode answer propagation,
// that one for the game engine's question filtering.
// Adding a new franchise? Update BOTH files. A sync test exists in rules/contradictions.test.ts.
export const EXCLUSIVE_GROUPS: QuestionId[][] = [
  // Music genres
  [154, 155, 156, 157].map(n => n as QuestionId),
  // Metal sub-genres
  [237, 238, 239, 240, 241, 242, 243, 244].map(n => n as QuestionId),
  // Rap sub-genres (trap vs consciente are mutually exclusive)
  [517, 518].map(n => n as QuestionId),
  // Sports
  [76, 187, 188, 189, 190].map(n => n as QuestionId),
  // Comic franchises
  [71, 81].map(n => n as QuestionId),
  // Anime universes
  [84, 93, 94, 111, 112, 113, 114, 115, 116, 117, 131, 132, 133].map(n => n as QuestionId),
  // Game universes
  [97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110].map(n => n as QuestionId),
  // Movie/TV franchises
  [73, 75, 134, 135, 136, 137, 138].map(n => n as QuestionId),
  // Soccer positions
  [143, 146, 147].map(n => n as QuestionId),
  // Professions (real people)
  [17, 18, 19, 20, 76, 77, 78, 79, 80].map(n => n as QuestionId),
  // Nationalities (specific countries only — regional Q45=European is not exclusive)
  [16, 44, 46, 47, 181, 182, 183, 184, 185, 186].map(n => n as QuestionId),
  // Gender
  [52, 53].map(n => n as QuestionId),
]

// Default priority lists
export const LEARN_DEFAULT_REAL: QuestionId[] = REAL_PERSON_BASE
export const LEARN_DEFAULT_FICTION: QuestionId[] = FICTION_BASE
