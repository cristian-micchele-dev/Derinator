/**
 * enrich-famosos.mjs
 *
 * Adds key discriminating answers to famosos.json:
 *   1. Nationality group (force-set — corrects bugs like Shakira having ARG instead of COL)
 *   2. Appearance, status and prize questions (setIfAbsent — never overwrites existing answers)
 *
 * Run: node scripts/enrich-famosos.mjs
 */

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const FAMOSOS_PATH = join(__dirname, '../frontend/src/data/characters/famosos.json')

// ---------------------------------------------------------------------------
// Nationality exclusive group
// Only ONE specific country can be "yes". All others get "no".
// 45 (europeo) is separate — it's YES for any European country.
// ---------------------------------------------------------------------------
const NAT_EXCLUSIVE = [16, 44, 46, 47, 181, 182, 183, 184, 185]

/**
 * natYes: specific country IDs that get "yes" (from NAT_EXCLUSIVE)
 * eu: whether to set 45=yes (europeo)
 *
 * All NAT_EXCLUSIVE IDs NOT in natYes are force-set to "no".
 * eu=false → 45 force-set to "no" (unless it's already handled by natYes logic)
 */
const NATIONALITY = {
  // ── DEPORTISTAS ────────────────────────────────────────────────────────────
  'Lionel Messi':           { natYes: [16],  eu: false },
  'Diego Maradona':         { natYes: [16],  eu: false },
  'Neymar':                 { natYes: [47],  eu: false },
  'Kylian Mbappé':          { natYes: [],    eu: true  }, // French
  'Pelé':                   { natYes: [47],  eu: false },
  'Cristiano Ronaldo':      { natYes: [],    eu: true  }, // Portuguese
  'Ronaldinho':             { natYes: [47],  eu: false },
  'Zinedine Zidane':        { natYes: [],    eu: true  }, // French
  'Diego Forlán':           { natYes: [],    eu: false }, // Uruguayan
  'Mohamed Salah':          { natYes: [],    eu: false }, // Egyptian
  'Roger Federer':          { natYes: [],    eu: true  }, // Swiss
  'Rafael Nadal':           { natYes: [183], eu: true  },
  'Serena Williams':        { natYes: [44],  eu: false },
  'Novak Djokovic':         { natYes: [],    eu: true  }, // Serbian
  'Michael Jordan':         { natYes: [44],  eu: false },
  'LeBron James':           { natYes: [44],  eu: false },
  'Kobe Bryant':            { natYes: [44],  eu: false },
  'Tiger Woods':            { natYes: [44],  eu: false },
  'Usain Bolt':             { natYes: [],    eu: false }, // Jamaican
  'David Beckham':          { natYes: [184], eu: true  },
  'Conor McGregor':         { natYes: [],    eu: true  }, // Irish
  'Canelo Álvarez':         { natYes: [181], eu: false },
  'Lewis Hamilton':         { natYes: [184], eu: true  },
  'Ángel Di María':         { natYes: [16],  eu: false },
  'Sergio Agüero':          { natYes: [16],  eu: false },
  'Diego Simeone':          { natYes: [16],  eu: false },
  'Lionel Scaloni':         { natYes: [16],  eu: false },
  'Ricardo Bochini':        { natYes: [16],  eu: false },
  'Alfredo Di Stéfano':     { natYes: [16],  eu: false }, // Born in ARG
  'Mario Kempes':           { natYes: [16],  eu: false },
  'Daniel Passarella':      { natYes: [16],  eu: false },
  'Ángel Labruna':          { natYes: [16],  eu: false },
  'Luis Suárez':            { natYes: [],    eu: false }, // Uruguayan
  'Sergio Ramos':           { natYes: [183], eu: true  },
  'Luka Modrić':            { natYes: [],    eu: true  }, // Croatian
  'Erling Haaland':         { natYes: [],    eu: true  }, // Norwegian
  'Vinícius Jr.':           { natYes: [47],  eu: false },
  'Jude Bellingham':        { natYes: [184], eu: true  },
  'Manu Ginóbili':          { natYes: [16],  eu: false },
  'Juan Martín del Potro':  { natYes: [16],  eu: false },
  'Gabriela Sabatini':      { natYes: [16],  eu: false },
  'Michael Phelps':         { natYes: [44],  eu: false },
  'Simone Biles':           { natYes: [44],  eu: false },
  'Tom Brady':              { natYes: [44],  eu: false },
  'Max Verstappen':         { natYes: [],    eu: true  }, // Dutch
  'Valentino Rossi':        { natYes: [185], eu: true  },
  'Floyd Mayweather':       { natYes: [44],  eu: false },
  'Robert Lewandowski':     { natYes: [],    eu: true  }, // Polish
  'Lamine Yamal':           { natYes: [183], eu: true  },
  'Kevin De Bruyne':        { natYes: [],    eu: true  }, // Belgian

  // ── HISTÓRICO-REAL ─────────────────────────────────────────────────────────
  'Michael Jackson':        { natYes: [44],  eu: false },
  'Beyoncé':                { natYes: [44],  eu: false },
  'Bad Bunny':              { natYes: [],    eu: false }, // Puerto Rican
  'Shakira':                { natYes: [182], eu: false }, // Colombian (bug fix: was 16=yes)
  'Leonardo DiCaprio':      { natYes: [44],  eu: false },
  'Meryl Streep':           { natYes: [44],  eu: false },
  'Robert Downey Jr.':      { natYes: [44],  eu: false },
  'Keanu Reeves':           { natYes: [],    eu: false }, // Canadian
  'Stephen Hawking':        { natYes: [184], eu: true  },
  'Nikola Tesla':           { natYes: [],    eu: true  }, // Serbian
  'Pablo Picasso':          { natYes: [183], eu: true  },
  'Mahatma Gandhi':         { natYes: [],    eu: false }, // Indian
  'Albert Einstein':        { natYes: [],    eu: true  }, // German-born
  'Elon Musk':              { natYes: [44],  eu: false }, // South African → US
  'Bill Gates':             { natYes: [44],  eu: false },
  'Steve Jobs':             { natYes: [44],  eu: false },
  'Barack Obama':           { natYes: [44],  eu: false },
  'Donald Trump':           { natYes: [44],  eu: false },
  'Queen Elizabeth II':     { natYes: [184], eu: true  },
  'Nelson Mandela':         { natYes: [],    eu: false }, // South African
  'Pope Francis':           { natYes: [16],  eu: false }, // Argentine
  'Oprah Winfrey':          { natYes: [44],  eu: false },
  'Eminem':                 { natYes: [44],  eu: false },
  'Taylor Swift':           { natYes: [44],  eu: false },
  'Lady Gaga':              { natYes: [44],  eu: false },
  'Rihanna':                { natYes: [],    eu: false }, // Barbadian
  'Adele':                  { natYes: [184], eu: true  },
  'Ed Sheeran':             { natYes: [184], eu: true  },
  'Freddie Mercury':        { natYes: [184], eu: true  },
  'Rosalía':                { natYes: [183], eu: true  },
  'J Balvin':               { natYes: [182], eu: false },
  'Daddy Yankee':           { natYes: [],    eu: false }, // Puerto Rican
  'Karol G':                { natYes: [182], eu: false },
  'Luis Fonsi':             { natYes: [],    eu: false }, // Puerto Rican
  'Tom Cruise':             { natYes: [44],  eu: false },
  'Brad Pitt':              { natYes: [44],  eu: false },
  'Johnny Depp':            { natYes: [44],  eu: false },
  'Will Smith':             { natYes: [44],  eu: false },
  'Angelina Jolie':         { natYes: [44],  eu: false },
  'Penélope Cruz':          { natYes: [183], eu: true  },
  'Antonio Banderas':       { natYes: [183], eu: true  },
  'Morgan Freeman':         { natYes: [44],  eu: false },
  'Jim Carrey':             { natYes: [],    eu: false }, // Canadian
  'Gustavo Cerati':         { natYes: [16],  eu: false },
  'Charly García':          { natYes: [16],  eu: false },
  'Luis Alberto Spinetta':  { natYes: [16],  eu: false },
  'Duki':                   { natYes: [16],  eu: false },
  'Tini':                   { natYes: [16],  eu: false },
  'Lali':                   { natYes: [16],  eu: false },
  'Wos':                    { natYes: [16],  eu: false },
  'Nathy Peluso':           { natYes: [16],  eu: false }, // Argentine-born
  'Paul McCartney':         { natYes: [184], eu: true  },
  'David Bowie':            { natYes: [184], eu: true  },
  'Prince':                 { natYes: [44],  eu: false },
  'Madonna':                { natYes: [44],  eu: false },
  'Ricardo Darín':          { natYes: [16],  eu: false },
  'Guillermo Francella':    { natYes: [16],  eu: false },
  'Billie Eilish':          { natYes: [44],  eu: false },
  'Drake':                  { natYes: [],    eu: false }, // Canadian
  'The Weeknd':             { natYes: [],    eu: false }, // Canadian
  'Bruno Mars':             { natYes: [44],  eu: false }, // Hawaiian/US
  'Justin Bieber':          { natYes: [],    eu: false }, // Canadian
  'Dua Lipa':               { natYes: [184], eu: true  }, // British
  'Kanye West':             { natYes: [44],  eu: false },
  'Maluma':                 { natYes: [182], eu: false },
  'Feid':                   { natYes: [182], eu: false },
  'Harry Styles':           { natYes: [184], eu: true  },
  'Rauw Alejandro':         { natYes: [],    eu: false }, // Puerto Rican
  'Dwayne Johnson':         { natYes: [44],  eu: false },
  'Scarlett Johansson':     { natYes: [44],  eu: false },
  'Ryan Reynolds':          { natYes: [],    eu: false }, // Canadian
  'Zendaya':                { natYes: [44],  eu: false },
  'Margot Robbie':          { natYes: [],    eu: false }, // Australian
  'Mark Zuckerberg':        { natYes: [44],  eu: false },
  'Jeff Bezos':             { natYes: [44],  eu: false },
  'Ariana Grande':          { natYes: [44],  eu: false },
  'Selena Gomez':           { natYes: [44],  eu: false },

  // ── YOUTUBERS / STREAMERS ──────────────────────────────────────────────────
  'MrBeast':                { natYes: [44],  eu: false },
  'AuronPlay':              { natYes: [183], eu: true  },
  'Juan Guarnizo':          { natYes: [182], eu: false },
  'Ibai Llanos':            { natYes: [183], eu: true  },
  'El Rubius':              { natYes: [183], eu: true  }, // Spanish-Norwegian
  'ElRubius':               { natYes: [183], eu: true  }, // same person
  'PewDiePie':              { natYes: [],    eu: true  }, // Swedish
  'Fernanfloo':             { natYes: [],    eu: false }, // Salvadoran
  'Vegetta777':             { natYes: [183], eu: true  },
  'Willyrex':               { natYes: [183], eu: true  },
  'Mikecrack':              { natYes: [183], eu: true  },
  'xFaRgAnx':              { natYes: [183], eu: true  },
  'LolitoFdez':             { natYes: [183], eu: true  },
  'ByViruZz':               { natYes: [183], eu: true  },
  'Spreen':                 { natYes: [16],  eu: false },
  'Coscu':                  { natYes: [16],  eu: false },
  'Davoo Xeneize':          { natYes: [16],  eu: false },
  'Alejo Igoa':             { natYes: [16],  eu: false },
  'Markiplier':             { natYes: [44],  eu: false },
  'DanTDM':                 { natYes: [184], eu: true  },
  'TheDonato':              { natYes: [16],  eu: false },
  'Luisito Comunica':       { natYes: [181], eu: false },
  'TheGrefg':               { natYes: [183], eu: true  },
  'Germán Garmendia':       { natYes: [],    eu: false }, // Chilean
  'ElMariana':              { natYes: [181], eu: false },
}

// ---------------------------------------------------------------------------
// Appearance + status (setIfAbsent — never overwrites existing data)
// Keys: 43=vivo, 48=bigote, 49=lentes, 50=calvo, 51=pelo largo,
//       126=barba, 141=+30años, 142=ganóPremio, 196=rubio,
//       197=tatuajes, 198=mejorHistoria, 199=redesInfluyente, 236=casado
// ---------------------------------------------------------------------------
const PROFILE = {
  // ── DEPORTISTAS ────────────────────────────────────────────────────────────
  'Lionel Messi':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'yes',196:'no',197:'yes',236:'yes' },
  'Diego Maradona':
    { 43:'no', 141:'yes',142:'yes',198:'yes',199:'no',  48:'no',49:'no',51:'no',126:'no',196:'no',197:'no',236:'yes' },
  'Neymar':
    { 43:'yes',141:'yes',142:'yes',198:'probably',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'yes',236:'no' },
  'Kylian Mbappé':
    { 43:'yes',141:'no', 142:'yes',198:'probably',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'no' },
  'Pelé':
    { 43:'no', 141:'yes',142:'yes',198:'yes',199:'no',  48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'yes' },
  'Cristiano Ronaldo':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'probably',196:'no',197:'yes',236:'yes' },
  'Ronaldinho':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'yes',236:'no' },
  'Zinedine Zidane':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'yes',51:'no',126:'no',196:'no',197:'no',236:'yes' },
  'Diego Forlán':
    { 43:'yes',141:'yes',142:'yes',198:'probably',199:'probably', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'yes',197:'no',236:'yes' },
  'Mohamed Salah':
    { 43:'yes',141:'yes',142:'yes',198:'probably',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'yes',196:'no',197:'no',236:'yes' },
  'Roger Federer':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'yes' },
  'Rafael Nadal':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'yes' },
  'Serena Williams':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'yes',126:'no',196:'no',197:'no',236:'yes' },
  'Novak Djokovic':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'yes' },
  'Michael Jordan':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'yes',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'yes' },
  'LeBron James':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'yes',236:'yes' },
  'Kobe Bryant':
    { 43:'no', 141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'yes' },
  'Tiger Woods':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'no' },
  'Usain Bolt':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'yes' },
  'David Beckham':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'probably',196:'yes',197:'yes',236:'yes' },
  'Conor McGregor':
    { 43:'yes',141:'yes',142:'yes',198:'probably',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'yes',196:'no',197:'yes',236:'yes' },
  'Canelo Álvarez':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'yes',197:'yes',236:'yes' },
  'Lewis Hamilton':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'yes',236:'no' },
  'Ángel Di María':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'yes',236:'yes' },
  'Sergio Agüero':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'yes',236:'no' },
  'Diego Simeone':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'yes',196:'no',197:'no',236:'yes' },
  'Lionel Scaloni':
    { 43:'yes',141:'yes',142:'yes',198:'probably',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'yes',196:'no',197:'no',236:'yes' },
  'Ricardo Bochini':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'probably', 48:'no',49:'no',50:'probably',51:'no',126:'no',196:'no',197:'no',236:'yes' },
  'Alfredo Di Stéfano':
    { 43:'no', 141:'yes',142:'yes',198:'yes',199:'no',  48:'no',49:'no',50:'probably',51:'no',126:'no',196:'no',197:'no',236:'yes' },
  'Mario Kempes':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'probably', 48:'no',49:'no',50:'no',51:'yes',126:'yes',196:'no',197:'no',236:'yes' },
  'Daniel Passarella':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'probably', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'yes' },
  'Ángel Labruna':
    { 43:'no', 141:'yes',142:'yes',198:'yes',199:'no',  48:'no',49:'no',50:'probably',51:'no',126:'no',196:'no',197:'no',236:'yes' },
  'Luis Suárez':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'yes',236:'yes' },
  'Sergio Ramos':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'yes',196:'no',197:'yes',236:'yes' },
  'Luka Modrić':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'yes' },
  'Erling Haaland':
    { 43:'yes',141:'no', 142:'yes',198:'probably',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'yes',197:'no',236:'no' },
  'Vinícius Jr.':
    { 43:'yes',141:'no', 142:'yes',198:'probably',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'yes',236:'no' },
  'Jude Bellingham':
    { 43:'yes',141:'no', 142:'yes',198:'probably',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'no' },
  'Manu Ginóbili':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'yes',51:'no',126:'no',196:'no',197:'no',236:'yes' },
  'Juan Martín del Potro':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'yes',196:'no',197:'no',236:'no' },
  'Gabriela Sabatini':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'yes',126:'no',196:'no',197:'no',236:'no' },
  'Michael Phelps':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'yes',236:'yes' },
  'Simone Biles':
    { 43:'yes',141:'no', 142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'yes' },
  'Tom Brady':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'no' },
  'Max Verstappen':
    { 43:'yes',141:'no', 142:'yes',198:'probably',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'yes' },
  'Valentino Rossi':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'yes' },
  'Floyd Mayweather':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'yes',51:'no',126:'no',196:'no',197:'yes',236:'no' },
  'Robert Lewandowski':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'yes' },
  'Lamine Yamal':
    { 43:'yes',141:'no', 142:'yes',198:'probably',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'no' },
  'Kevin De Bruyne':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'yes',197:'no',236:'yes' },

  // ── HISTÓRICO-REAL ─────────────────────────────────────────────────────────
  'Michael Jackson':
    { 43:'no', 141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'yes' },
  'Beyoncé':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'yes',126:'no',196:'no',197:'no',236:'yes' },
  'Bad Bunny':
    { 43:'yes',141:'yes',142:'yes',198:'probably',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'yes',196:'no',197:'yes',236:'yes' },
  'Shakira':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'yes',126:'no',196:'yes',197:'no',236:'no' },
  'Leonardo DiCaprio':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'probably',196:'no',197:'no',236:'no' },
  'Meryl Streep':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'yes',126:'no',196:'no',197:'no',236:'yes' },
  'Robert Downey Jr.':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'yes',196:'no',197:'yes',236:'yes' },
  'Keanu Reeves':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'yes',196:'no',197:'no',236:'yes' },
  'Stephen Hawking':
    { 43:'no', 141:'yes',142:'yes',198:'yes',199:'no',  48:'no',49:'yes',50:'yes',51:'no',126:'no',196:'no',197:'no',236:'yes' },
  'Nikola Tesla':
    { 43:'no', 141:'yes',142:'yes',198:'yes',199:'no',  48:'yes',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'no' },
  'Pablo Picasso':
    { 43:'no', 141:'yes',142:'yes',198:'yes',199:'no',  48:'no',49:'no',50:'yes',51:'no',126:'no',196:'no',197:'no',236:'yes' },
  'Mahatma Gandhi':
    { 43:'no', 141:'yes',142:'yes',198:'yes',199:'no',  48:'no',49:'yes',50:'yes',51:'no',126:'no',196:'no',197:'no',236:'yes' },
  'Albert Einstein':
    { 43:'no', 141:'yes',142:'yes',198:'yes',199:'no',  48:'yes',49:'no',50:'no',51:'yes',126:'yes',196:'no',197:'no',236:'yes' },
  'Elon Musk':
    { 43:'yes',141:'yes',142:'yes',198:'probably',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'yes' },
  'Bill Gates':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'yes',50:'no',51:'no',126:'no',196:'no',197:'no',236:'yes' },
  'Steve Jobs':
    { 43:'no', 141:'yes',142:'yes',198:'yes',199:'no',  48:'no',49:'yes',50:'no',51:'no',126:'yes',196:'no',197:'no',236:'yes' },
  'Barack Obama':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'yes' },
  'Donald Trump':
    { 43:'yes',141:'yes',142:'yes',198:'probably',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'yes',197:'no',236:'yes' },
  'Queen Elizabeth II':
    { 43:'no', 141:'yes',142:'yes',198:'yes',199:'no',  48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'yes' },
  'Nelson Mandela':
    { 43:'no', 141:'yes',142:'yes',198:'yes',199:'no',  48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'yes' },
  'Pope Francis':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'yes',51:'no',126:'no',196:'no',197:'no',236:'no' },
  'Oprah Winfrey':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'yes',126:'no',196:'no',197:'no',236:'no' },
  'Eminem':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'yes',197:'yes',236:'no' },
  'Taylor Swift':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'yes',126:'no',196:'yes',197:'no',236:'yes' },
  'Lady Gaga':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'yes',126:'no',196:'yes',197:'yes',236:'no' },
  'Rihanna':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'yes',126:'no',196:'no',197:'yes',236:'yes' },
  'Adele':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'yes' },
  'Ed Sheeran':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'yes',197:'yes',236:'yes' },
  'Freddie Mercury':
    { 43:'no', 141:'yes',142:'yes',198:'yes',199:'no',  48:'yes',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'no' },
  'Rosalía':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'yes',126:'no',196:'no',197:'no',236:'no' },
  'J Balvin':
    { 43:'yes',141:'yes',142:'yes',198:'probably',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'yes',196:'no',197:'yes',236:'yes' },
  'Daddy Yankee':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'yes',236:'yes' },
  'Karol G':
    { 43:'yes',141:'yes',142:'yes',198:'probably',199:'yes', 48:'no',49:'no',50:'no',51:'yes',126:'no',196:'probably_not',197:'yes',236:'no' },
  'Luis Fonsi':
    { 43:'yes',141:'yes',142:'yes',198:'probably',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'yes' },
  'Tom Cruise':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'no' },
  'Brad Pitt':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'yes',196:'yes',197:'yes',236:'no' },
  'Johnny Depp':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'yes',126:'yes',196:'no',197:'yes',236:'no' },
  'Will Smith':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'yes' },
  'Angelina Jolie':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'yes',126:'no',196:'no',197:'yes',236:'no' },
  'Penélope Cruz':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'yes',126:'no',196:'no',197:'no',236:'yes' },
  'Antonio Banderas':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'yes',49:'no',50:'no',51:'no',126:'yes',196:'no',197:'no',236:'no' },
  'Morgan Freeman':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'yes',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'no' },
  'Jim Carrey':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'no' },
  'Gustavo Cerati':
    { 43:'no', 141:'yes',142:'yes',198:'yes',199:'no',  48:'no',49:'no',50:'no',51:'yes',126:'no',196:'no',197:'no',236:'no' },
  'Charly García':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'yes',50:'no',51:'yes',126:'no',196:'no',197:'no',236:'yes' },
  'Luis Alberto Spinetta':
    { 43:'no', 141:'yes',142:'yes',198:'yes',199:'no',  48:'no',49:'no',50:'no',51:'yes',126:'no',196:'no',197:'no',236:'yes' },
  'Duki':
    { 43:'yes',141:'yes',142:'yes',198:'probably',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'yes',236:'yes' },
  'Tini':
    { 43:'yes',141:'no', 142:'yes',198:'probably',199:'yes', 48:'no',49:'no',50:'no',51:'yes',126:'no',196:'no',197:'no',236:'no' },
  'Lali':
    { 43:'yes',141:'yes',142:'yes',198:'probably',199:'yes', 48:'no',49:'no',50:'no',51:'yes',126:'no',196:'no',197:'yes',236:'no' },
  'Wos':
    { 43:'yes',141:'no', 142:'yes',198:'probably',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'no' },
  'Nathy Peluso':
    { 43:'yes',141:'yes',142:'yes',198:'probably',199:'yes', 48:'no',49:'no',50:'no',51:'yes',126:'no',196:'no',197:'yes',236:'no' },
  'Paul McCartney':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'yes' },
  'David Bowie':
    { 43:'no', 141:'yes',142:'yes',198:'yes',199:'no',  48:'no',49:'no',50:'no',51:'no',126:'no',196:'yes',197:'no',236:'yes' },
  'Prince':
    { 43:'no', 141:'yes',142:'yes',198:'yes',199:'no',  48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'yes' },
  'Madonna':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'yes',126:'no',196:'yes',197:'yes',236:'no' },
  'Ricardo Darín':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'yes' },
  'Guillermo Francella':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'yes' },
  'Billie Eilish':
    { 43:'yes',141:'no', 142:'yes',198:'probably',199:'yes', 48:'no',49:'no',50:'no',51:'yes',126:'no',196:'no',197:'yes',236:'no' },
  'Drake':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'yes',196:'no',197:'yes',236:'no' },
  'The Weeknd':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'yes',196:'no',197:'yes',236:'no' },
  'Bruno Mars':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'yes',236:'no' },
  'Justin Bieber':
    { 43:'yes',141:'yes',142:'yes',198:'probably',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'yes',197:'yes',236:'yes' },
  'Dua Lipa':
    { 43:'yes',141:'yes',142:'yes',198:'probably',199:'yes', 48:'no',49:'no',50:'no',51:'yes',126:'no',196:'no',197:'yes',236:'no' },
  'Kanye West':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'no' },
  'Maluma':
    { 43:'yes',141:'yes',142:'yes',198:'probably',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'yes',196:'no',197:'yes',236:'no' },
  'Feid':
    { 43:'yes',141:'yes',142:'yes',198:'probably',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'yes',196:'no',197:'yes',236:'no' },
  'Harry Styles':
    { 43:'yes',141:'yes',142:'yes',198:'probably',199:'yes', 48:'no',49:'no',50:'no',51:'yes',126:'no',196:'no',197:'yes',236:'no' },
  'Rauw Alejandro':
    { 43:'yes',141:'yes',142:'yes',198:'probably',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'yes',236:'no' },
  'Dwayne Johnson':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'yes',51:'no',126:'no',196:'no',197:'yes',236:'yes' },
  'Scarlett Johansson':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'yes',126:'no',196:'yes',197:'yes',236:'yes' },
  'Ryan Reynolds':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'yes' },
  'Zendaya':
    { 43:'yes',141:'no', 142:'yes',198:'probably',199:'yes', 48:'no',49:'no',50:'no',51:'yes',126:'no',196:'no',197:'no',236:'yes' },
  'Margot Robbie':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'yes',126:'no',196:'yes',197:'yes',236:'yes' },
  'Mark Zuckerberg':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'yes' },
  'Jeff Bezos':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'yes',51:'no',126:'no',196:'no',197:'no',236:'yes' },
  'Ariana Grande':
    { 43:'yes',141:'yes',142:'yes',198:'yes',199:'yes', 48:'no',49:'no',50:'no',51:'yes',126:'no',196:'no',197:'yes',236:'yes' },
  'Selena Gomez':
    { 43:'yes',141:'yes',142:'yes',198:'probably',199:'yes', 48:'no',49:'no',50:'no',51:'yes',126:'no',196:'no',197:'yes',236:'no' },

  // ── YOUTUBERS / STREAMERS ──────────────────────────────────────────────────
  'MrBeast':
    { 43:'yes',141:'no', 142:'no',198:'no',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'yes' },
  'AuronPlay':
    { 43:'yes',141:'yes',142:'no',198:'no',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'no' },
  'Juan Guarnizo':
    { 43:'yes',141:'no', 142:'no',198:'no',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'no' },
  'Ibai Llanos':
    { 43:'yes',141:'no', 142:'no',198:'no',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'no' },
  'El Rubius':
    { 43:'yes',141:'yes',142:'no',198:'no',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'yes',197:'no',236:'no' },
  'ElRubius':
    { 43:'yes',141:'yes',142:'no',198:'no',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'yes',197:'no',236:'no' },
  'PewDiePie':
    { 43:'yes',141:'yes',142:'no',198:'no',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'yes',197:'no',236:'yes' },
  'Fernanfloo':
    { 43:'yes',141:'yes',142:'no',198:'no',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'no' },
  'Vegetta777':
    { 43:'yes',141:'yes',142:'no',198:'no',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'no' },
  'Willyrex':
    { 43:'yes',141:'yes',142:'no',198:'no',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'no' },
  'Mikecrack':
    { 43:'yes',141:'yes',142:'no',198:'no',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'no' },
  'xFaRgAnx':
    { 43:'yes',141:'yes',142:'no',198:'no',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'no' },
  'LolitoFdez':
    { 43:'yes',141:'no', 142:'no',198:'no',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'no' },
  'ByViruZz':
    { 43:'yes',141:'no', 142:'no',198:'no',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'no' },
  'Spreen':
    { 43:'yes',141:'no', 142:'no',198:'no',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'yes',236:'no' },
  'Coscu':
    { 43:'yes',141:'yes',142:'no',198:'no',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'no' },
  'Davoo Xeneize':
    { 43:'yes',141:'yes',142:'no',198:'no',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'yes' },
  'Alejo Igoa':
    { 43:'yes',141:'no', 142:'no',198:'no',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'no' },
  'Markiplier':
    { 43:'yes',141:'yes',142:'no',198:'no',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'yes',196:'no',197:'no',236:'yes' },
  'DanTDM':
    { 43:'yes',141:'yes',142:'no',198:'no',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'yes' },
  'TheDonato':
    { 43:'yes',141:'yes',142:'no',198:'no',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'no' },
  'Luisito Comunica':
    { 43:'yes',141:'yes',142:'no',198:'no',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'yes',236:'yes' },
  'TheGrefg':
    { 43:'yes',141:'no', 142:'no',198:'no',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'no' },
  'Germán Garmendia':
    { 43:'yes',141:'yes',142:'no',198:'no',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'no' },
  'ElMariana':
    { 43:'yes',141:'no', 142:'no',198:'no',199:'yes', 48:'no',49:'no',50:'no',51:'no',126:'no',196:'no',197:'no',236:'no' },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function setIfAbsent(answers, key, value) {
  const k = String(key)
  if (!(k in answers)) answers[k] = value
}

function setForce(answers, key, value) {
  answers[String(key)] = value
}

// ---------------------------------------------------------------------------
// Apply
// ---------------------------------------------------------------------------
const famosos = JSON.parse(readFileSync(FAMOSOS_PATH, 'utf8'))
let enrichedCount = 0
let correctedCount = 0
let missingProfile = []

for (const char of famosos) {
  const nat = NATIONALITY[char.name]
  const profile = PROFILE[char.name]

  if (!nat && !profile) {
    missingProfile.push(char.name)
    continue
  }

  // 1. Nationality — force-set (corrects bugs)
  if (nat) {
    const before = JSON.stringify(char.answers)

    // Set specific countries
    for (const qId of NAT_EXCLUSIVE) {
      const value = nat.natYes.includes(qId) ? 'yes' : 'no'
      if (char.answers[String(qId)] !== value) correctedCount++
      setForce(char.answers, qId, value)
    }

    // Set europeo (45)
    const euValue = nat.eu ? 'yes' : 'no'
    if (char.answers['45'] !== euValue) correctedCount++
    setForce(char.answers, 45, euValue)

    if (JSON.stringify(char.answers) !== before) enrichedCount++
  }

  // 2. Appearance + status — setIfAbsent
  if (profile) {
    for (const [key, value] of Object.entries(profile)) {
      setIfAbsent(char.answers, key, value)
    }
  }
}

// Sort answers numerically for readability
for (const char of famosos) {
  char.answers = Object.fromEntries(
    Object.entries(char.answers).sort((a, b) => Number(a[0]) - Number(b[0]))
  )
}

writeFileSync(FAMOSOS_PATH, JSON.stringify(famosos, null, 2), 'utf8')

console.log(`Done.`)
console.log(`  Characters enriched: ${enrichedCount}`)
console.log(`  Individual corrections applied: ${correctedCount}`)
if (missingProfile.length) {
  console.log(`  WARNING — no data defined for: ${missingProfile.join(', ')}`)
}
