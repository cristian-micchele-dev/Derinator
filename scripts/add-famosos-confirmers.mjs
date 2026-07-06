/**
 * add-famosos-confirmers.mjs
 * Adds confirmer question answers (347-499) to famosos.json.
 * Each entry maps a famoso character ID → confirmer question ID.
 * Run: node scripts/add-famosos-confirmers.mjs
 */
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const famososPath = join(__dirname, '../frontend/src/data/characters/famosos.json')

// Map: character ID → confirmer question ID
// Each question is answered 'yes' only by this character; all others default to 'no'
const CONFIRMER_MAP = {
  201: 347,  // Messi
  202: 348,  // Maradona
  203: 349,  // Neymar
  204: 350,  // Mbappé
  205: 351,  // Pelé
  206: 352,  // Michael Jackson
  207: 353,  // Beyoncé
  208: 354,  // Bad Bunny
  209: 355,  // Shakira
  210: 356,  // Leonardo DiCaprio
  211: 357,  // Meryl Streep
  212: 358,  // Robert Downey Jr.
  213: 359,  // Keanu Reeves
  214: 360,  // Stephen Hawking
  215: 361,  // Nikola Tesla
  216: 362,  // Pablo Picasso
  217: 363,  // Mahatma Gandhi
  218: 364,  // MrBeast
  219: 365,  // AuronPlay
  220: 366,  // Juan Guarnizo
  221: 367,  // Cristiano Ronaldo
  222: 368,  // Ronaldinho
  223: 369,  // Zinedine Zidane
  224: 370,  // Diego Forlán
  225: 371,  // Mohamed Salah
  226: 372,  // Roger Federer
  227: 373,  // Rafael Nadal
  228: 374,  // Serena Williams
  229: 375,  // Novak Djokovic
  230: 376,  // Michael Jordan
  231: 377,  // LeBron James
  232: 378,  // Kobe Bryant
  233: 379,  // Tiger Woods
  234: 380,  // Usain Bolt
  235: 381,  // Eminem
  236: 382,  // Taylor Swift
  237: 383,  // Lady Gaga
  238: 384,  // Rihanna
  239: 385,  // Adele
  240: 386,  // Ed Sheeran
  241: 387,  // Freddie Mercury
  242: 388,  // Rosalía
  243: 389,  // J Balvin
  244: 390,  // Daddy Yankee
  245: 391,  // Karol G
  246: 392,  // Luis Fonsi
  247: 393,  // Tom Cruise
  248: 394,  // Brad Pitt
  249: 395,  // Johnny Depp
  250: 396,  // Will Smith
  251: 397,  // Angelina Jolie
  252: 398,  // Penélope Cruz
  253: 399,  // Antonio Banderas
  254: 400,  // Morgan Freeman
  255: 401,  // Jim Carrey
  256: 402,  // Albert Einstein
  257: 403,  // Elon Musk
  258: 404,  // Bill Gates
  259: 405,  // Steve Jobs
  260: 406,  // Barack Obama
  261: 407,  // Donald Trump
  262: 408,  // Queen Elizabeth II
  263: 409,  // Nelson Mandela
  264: 410,  // Pope Francis
  265: 411,  // Oprah Winfrey
  266: 412,  // David Beckham
  267: 413,  // Conor McGregor
  268: 414,  // Canelo Álvarez
  269: 415,  // Ariana Grande
  270: 416,  // Selena Gomez
  271: 417,  // Lewis Hamilton
  272: 418,  // Ángel Di María
  273: 419,  // Sergio Agüero
  274: 420,  // Diego Simeone
  275: 421,  // Lionel Scaloni
  276: 422,  // Ricardo Bochini
  277: 423,  // Alfredo Di Stéfano
  278: 424,  // Mario Kempes
  279: 425,  // Daniel Passarella
  280: 426,  // Ángel Labruna
  281: 427,  // Luis Suárez
  282: 428,  // Sergio Ramos
  283: 429,  // Luka Modrić
  284: 430,  // Erling Haaland
  285: 431,  // Vinícius Jr.
  286: 432,  // Jude Bellingham
  287: 433,  // Manu Ginóbili
  288: 434,  // Juan Martín del Potro
  289: 435,  // Gabriela Sabatini
  290: 436,  // Michael Phelps
  291: 437,  // Simone Biles
  292: 438,  // Tom Brady
  293: 439,  // Max Verstappen
  294: 440,  // Valentino Rossi
  295: 441,  // Floyd Mayweather
  296: 442,  // Gustavo Cerati
  297: 443,  // Charly García
  298: 444,  // Luis Alberto Spinetta
  299: 445,  // Duki
  300: 446,  // Tini
  301: 447,  // Lali
  302: 448,  // Wos
  303: 449,  // Nathy Peluso
  304: 450,  // Paul McCartney
  305: 451,  // David Bowie
  306: 452,  // Prince
  307: 453,  // Madonna
  308: 454,  // Ricardo Darín
  309: 455,  // Guillermo Francella
  310: 456,  // Coscu
  311: 457,  // Ibai Llanos
  312: 458,  // El Rubius
  313: 459,  // PewDiePie
  314: 460,  // ElRubius (duplicate entry — same person as 312, different confirmer angle)
  315: 461,  // Fernanfloo
  316: 462,  // Vegetta777
  317: 463,  // Willyrex
  318: 464,  // Mikecrack
  319: 465,  // xFaRgAnx
  320: 466,  // LolitoFdez
  321: 467,  // ByViruZz
  322: 468,  // Spreen
  323: 469,  // Coscu (duplicate entry — same person as 310)
  324: 470,  // Davoo Xeneize
  325: 471,  // Alejo Igoa
  326: 472,  // Markiplier
  327: 473,  // DanTDM
  328: 474,  // TheDonato
  329: 475,  // Billie Eilish
  330: 476,  // Drake
  331: 477,  // The Weeknd
  332: 478,  // Bruno Mars
  333: 479,  // Justin Bieber
  334: 480,  // Dua Lipa
  335: 481,  // Kanye West
  336: 482,  // Maluma
  337: 483,  // Feid
  338: 484,  // Harry Styles
  339: 485,  // Rauw Alejandro
  340: 486,  // Luisito Comunica
  341: 487,  // TheGrefg
  342: 488,  // Germán Garmendia
  343: 489,  // ElMariana
  344: 490,  // Robert Lewandowski
  345: 491,  // Lamine Yamal
  346: 492,  // Kevin De Bruyne
  347: 493,  // Dwayne Johnson
  348: 494,  // Scarlett Johansson
  349: 495,  // Ryan Reynolds
  350: 496,  // Zendaya
  351: 497,  // Margot Robbie
  352: 498,  // Mark Zuckerberg
  353: 499,  // Jeff Bezos
}

const famosos = JSON.parse(readFileSync(famososPath, 'utf8'))

let updated = 0
let missing = 0

for (const char of famosos) {
  const qId = CONFIRMER_MAP[char.id]
  if (!qId) {
    console.warn(`⚠️  No confirmer defined for ${char.id}: ${char.name}`)
    missing++
    continue
  }
  if (!char.answers[String(qId)]) {
    char.answers[String(qId)] = 'yes'
    updated++
  }
}

writeFileSync(famososPath, JSON.stringify(famosos, null, 2), 'utf8')
console.log(`✅  Updated ${updated} characters, ${missing} missing`)
console.log(`   Question IDs added: 347–499`)
