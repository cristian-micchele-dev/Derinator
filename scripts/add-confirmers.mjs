/**
 * add-confirmers.mjs
 * Adds confirmer questions (Q280-Q345) for the 61 personajes without one.
 * Also fixes shared confirmers (Itachi/Kakashi Q264, Bart Q268).
 *
 * Run: node scripts/add-confirmers.mjs
 */

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', 'frontend', 'src', 'data')

// ================================================================
// NEW CONFIRMER QUESTIONS (Q280–Q345)
// ================================================================
export const NEW_QUESTIONS = [
  { id: 280, text: '¿Su nombre verdadero es Kakarot?' },
  { id: 281, text: '¿Es el príncipe de los Saiyajin?' },
  { id: 282, text: '¿Viaja en el tiempo desde el futuro con una espada?' },
  { id: 283, text: '¿Destruyó el planeta natal de los Saiyajin?' },
  { id: 284, text: '¿Alcanzó el Super Saiyajin 2 siendo niño?' },
  { id: 285, text: '¿Aprendió la Fusión con el hijo del príncipe Saiyajin de niño?' },
  { id: 286, text: '¿Es el campeón mundial de artes marciales sin poderes de ki reales?' },
  { id: 287, text: '¿Es una criatura rosada que puede absorber y copiar a sus enemigos?' },
  { id: 288, text: '¿Es un ser perfecto creado con células de los mejores guerreros?' },
  { id: 289, text: '¿Es una pequeña bola flotante con puntos rojos en la cara?' },
  { id: 290, text: '¿Es un Namekiano verde con antenas que regenera sus extremidades?' },
  { id: 291, text: '¿Masacró a su propio clan para proteger a su hermano menor?' },
  { id: 292, text: '¿Tiene el Sharingan oculto permanentemente bajo su banda de la frente?' },
  { id: 293, text: '¿Heredó el poder "One for All" de manos del mayor héroe?' },
  { id: 294, text: '¿Es el símbolo de la paz que puede transformarse entre dos formas físicas?' },
  { id: 295, text: '¿Pilota el Eva-01 morado y tiene profundos conflictos emocionales?' },
  { id: 296, text: '¿Pilota el Eva-02 rojo y tiene un carácter muy agresivo?' },
  { id: 297, text: '¿Es un cazador de monstruos con cabello blanco y ojos de gato?' },
  { id: 298, text: '¿Es un shinigami sustituto con cabello naranja?' },
  { id: 299, text: '¿Come fuego para ganar poder en batallas?' },
  { id: 300, text: '¿Es un demonio que lleva un trozo de bambú en la boca?' },
  { id: 301, text: '¿Lleva una caja de madera en la espalda para transportar a su hermana demonio?' },
  { id: 302, text: '¿Tiene un brazo y pierna de metal llamados automail?' },
  { id: 303, text: '¿Tiene un cuaderno que mata a quien escriba su nombre?' },
  { id: 304, text: '¿Tiene la cara pintada de blanco con cicatrices y una sonrisa permanente?' },
  { id: 305, text: '¿Es conocido como el soldado más fuerte de la humanidad en su mundo?' },
  { id: 306, text: '¿Es el director de Hogwarts con larga barba blanca?' },
  { id: 307, text: '¿Es el mejor amigo pelirrojo del protagonista de Hogwarts?' },
  { id: 308, text: '¿Cree en criaturas mágicas que los demás no pueden ver?' },
  { id: 309, text: '¿Tiene la Marca Tenebrosa de Voldemort grabada en el brazo?' },
  { id: 310, text: '¿Enseña pociones en Hogwarts con cabello negro lacio?' },
  { id: 311, text: '¿Es el heredero legítimo al Trono de Hierro sin saberlo?' },
  { id: 312, text: '¿Lanza una cadena con una calavera gritando "Get over here"?' },
  { id: 313, text: '¿Vive en un mundo de bloques donde puede construir y minar cualquier cosa?' },
  { id: 314, text: '¿Es arqueóloga y cazadora de tesoros que explora tumbas peligrosas?' },
  { id: 315, text: '¿Porta la Trifuerza del Valor y rescata a la Princesa Zelda?' },
  { id: 316, text: '¿Mató a todos los dioses griegos para vengar a su familia?' },
  { id: 317, text: '¿Es un supersoldado Spartan con armadura verde que nunca se quita el casco?' },
  { id: 318, text: '¿Es un asesino del Renacimiento italiano con cuchilla oculta en la muñeca?' },
  { id: 319, text: '¿Es el hermano del héroe principal que lleva gorra verde y teme a los fantasmas?' },
  { id: 320, text: '¿Es un gorila que colecciona plátanos y lanza barriles a sus enemigos?' },
  { id: 321, text: '¿Es un erizo azul que corre más rápido que el sonido?' },
  { id: 322, text: '¿Tiene el cabello extremadamente largo con poderes curativos mágicos?' },
  { id: 323, text: '¿Es un astronauta de juguete que cree ser un guardián espacial galáctico real?' },
  { id: 324, text: '¿Es un semidiós polinesio con un anzuelo mágico que le permite transformarse?' },
  { id: 325, text: '¿Es un experimento genético alienígena número 626 que parece un perro?' },
  { id: 326, text: '¿Es un cachorro de león que huye de su tierra tras la muerte de su padre?' },
  { id: 327, text: '¿Se disfrazó de hombre para unirse al ejército imperial en lugar de su padre?' },
  { id: 328, text: '¿Es la mascota original de Disney con orejas redondas negras y guantes blancos?' },
  { id: 329, text: '¿Es el Pokémon mascota del protagonista principal que nunca evoluciona?' },
  { id: 330, text: '¿Tiene una llama permanente en la punta de la cola?' },
  { id: 331, text: '¿Tiene un bulbo o semilla en la espalda?' },
  { id: 332, text: '¿Tiene cañones de agua incorporados en su caparazón?' },
  { id: 333, text: '¿Es una tortuga azul pequeña con caparazón redondeado?' },
  { id: 334, text: '¿Es un Pokémon fantasma morado que habita en las sombras?' },
  { id: 335, text: '¿Puede evolucionar en múltiples tipos distintos de Pokémon?' },
  { id: 336, text: '¿Es el Pokémon primigenio del que descienden todos los demás?' },
  { id: 337, text: '¿Es el clon creado en laboratorio del Pokémon primigenio?' },
  { id: 338, text: '¿Bloquea caminos enteros durmiéndose y comiendo cantidades enormes?' },
  { id: 339, text: '¿Es un dragón naranja con alas que escupe fuego muy intenso?' },
  { id: 340, text: '¿Es el hijo travieso de 10 años de la familia más famosa de Springfield?' },
  { id: 341, text: '¿Tiene fuerza sobrehumana acumulando chakra en sus puños?' },
  { id: 342, text: '¿Explota silenciosamente al acercarse a un jugador sin previo aviso?' },
  { id: 343, text: '¿Busca a su padre que es considerado el mejor cazador del mundo?' },
  { id: 344, text: '¿Viene de la familia de asesinos más élite y controla la electricidad?' },
  { id: 345, text: '¿Es un vaquero de juguete con sombrero y un cordón en la espalda?' },
]

// ================================================================
// CONFIRMER ASSIGNMENTS
// yes: character that gets 'yes'
// no:  same-franchise characters that get 'no'
// ================================================================
const DB_CHARS = ['Goku', 'Vegeta', 'Gohan', 'Goten', 'Trunks', 'Piccolo', 'Freezer', 'Cell', 'Majin Buu', 'Chiaotzu', 'Mr. Satan']
const NARUTO_CHARS = ['Naruto', 'Sasuke Uchiha', 'Itachi Uchiha', 'Kakashi Hatake', 'Sakura Haruno']
const HP_CHARS = ['Harry Potter', 'Lord Voldemort', 'Rubeus Hagrid', 'Albus Dumbledore', 'Ron Weasley', 'Luna Lovegood', 'Draco Malfoy', 'Severus Snape']
const POKEMON_CHARS = ['Pikachu', 'Charmander', 'Bulbasaur', 'Blastoise', 'Squirtle', 'Gengar', 'Eevee', 'Mew', 'Mewtwo', 'Snorlax', 'Charizard']
const SIMPSONS_CHARS = ['Homero Simpson', 'Bart Simpson']
const EVA_CHARS = ['Shinji Ikari', 'Asuka Langley Soryu']
const MHA_CHARS = ['Deku (Izuku Midoriya)', 'All Might']
const DS_CHARS = ['Tanjiro Kamado', 'Nezuko Kamado']
const DISNEY_CHARS = ['Mickey Mouse', 'Maui', 'Stitch', 'Simba', 'Mulan', 'Rapunzel', 'Elsa']
const TOY_STORY_CHARS = ['Woody', 'Buzz Lightyear']
const MARIO_CHARS = ['Mario', 'Luigi', 'Donkey Kong']
const HXH_CHARS = ['Gon Freecss', 'Killua Zoldyck']
const MK_CHARS = ['Scorpion', 'Sub-Zero']

const ASSIGNMENTS = [
  // Dragon Ball
  { id: 280, yes: 'Goku',      no: DB_CHARS.filter(c => c !== 'Goku') },
  { id: 281, yes: 'Vegeta',    no: DB_CHARS.filter(c => c !== 'Vegeta') },
  { id: 282, yes: 'Trunks',    no: DB_CHARS.filter(c => c !== 'Trunks') },
  { id: 283, yes: 'Freezer',   no: DB_CHARS.filter(c => c !== 'Freezer') },
  { id: 284, yes: 'Gohan',     no: DB_CHARS.filter(c => c !== 'Gohan') },
  { id: 285, yes: 'Goten',     no: DB_CHARS.filter(c => c !== 'Goten') },
  { id: 286, yes: 'Mr. Satan', no: DB_CHARS.filter(c => c !== 'Mr. Satan') },
  { id: 287, yes: 'Majin Buu', no: DB_CHARS.filter(c => c !== 'Majin Buu') },
  { id: 288, yes: 'Cell',      no: DB_CHARS.filter(c => c !== 'Cell') },
  { id: 289, yes: 'Chiaotzu',  no: DB_CHARS.filter(c => c !== 'Chiaotzu') },
  { id: 290, yes: 'Piccolo',   no: DB_CHARS.filter(c => c !== 'Piccolo') },
  // Naruto
  { id: 291, yes: 'Itachi Uchiha',  no: NARUTO_CHARS.filter(c => c !== 'Itachi Uchiha') },
  { id: 292, yes: 'Kakashi Hatake', no: NARUTO_CHARS.filter(c => c !== 'Kakashi Hatake') },
  { id: 341, yes: 'Sakura Haruno',  no: NARUTO_CHARS.filter(c => c !== 'Sakura Haruno') },
  // MHA
  { id: 293, yes: 'Deku (Izuku Midoriya)', no: MHA_CHARS.filter(c => c !== 'Deku (Izuku Midoriya)') },
  { id: 294, yes: 'All Might',             no: MHA_CHARS.filter(c => c !== 'All Might') },
  // Evangelion
  { id: 295, yes: 'Shinji Ikari',      no: EVA_CHARS.filter(c => c !== 'Shinji Ikari') },
  { id: 296, yes: 'Asuka Langley Soryu', no: EVA_CHARS.filter(c => c !== 'Asuka Langley Soryu') },
  // Singles
  { id: 297, yes: 'Geralt de Rivia',  no: [] },
  { id: 298, yes: 'Ichigo Kurosaki',  no: [] },
  { id: 299, yes: 'Natsu Dragneel',   no: [] },
  // Demon Slayer
  { id: 300, yes: 'Nezuko Kamado',  no: DS_CHARS.filter(c => c !== 'Nezuko Kamado') },
  { id: 301, yes: 'Tanjiro Kamado', no: DS_CHARS.filter(c => c !== 'Tanjiro Kamado') },
  // Singles
  { id: 302, yes: 'Edward Elric',    no: [] },
  { id: 303, yes: 'Light Yagami',    no: [] },
  { id: 304, yes: 'Joker',           no: ['Batman', 'Superman', 'Wonder Woman'] },
  { id: 305, yes: 'Levi Ackerman',   no: ['Eren Yeager'] },
  // Harry Potter
  { id: 306, yes: 'Albus Dumbledore', no: HP_CHARS.filter(c => c !== 'Albus Dumbledore') },
  { id: 307, yes: 'Ron Weasley',      no: HP_CHARS.filter(c => c !== 'Ron Weasley') },
  { id: 308, yes: 'Luna Lovegood',    no: HP_CHARS.filter(c => c !== 'Luna Lovegood') },
  { id: 309, yes: 'Draco Malfoy',     no: HP_CHARS.filter(c => c !== 'Draco Malfoy') },
  { id: 310, yes: 'Severus Snape',    no: HP_CHARS.filter(c => c !== 'Severus Snape') },
  // Singles
  { id: 311, yes: 'Jon Snow',        no: [] },
  // Mortal Kombat
  { id: 312, yes: 'Scorpion',  no: MK_CHARS.filter(c => c !== 'Scorpion') },
  // Minecraft
  { id: 313, yes: 'Steve',    no: ['Creeper'] },
  { id: 342, yes: 'Creeper',  no: ['Steve'] },
  // Singles
  { id: 314, yes: 'Lara Croft',   no: [] },
  { id: 315, yes: 'Link',         no: [] },
  { id: 316, yes: 'Kratos',       no: [] },
  { id: 317, yes: 'Master Chief', no: [] },
  { id: 318, yes: 'Ezio Auditore', no: [] },
  // Mario bros
  { id: 319, yes: 'Luigi',       no: MARIO_CHARS.filter(c => c !== 'Luigi') },
  { id: 320, yes: 'Donkey Kong', no: MARIO_CHARS.filter(c => c !== 'Donkey Kong') },
  // Singles
  { id: 321, yes: 'Sonic',     no: [] },
  // Disney
  { id: 322, yes: 'Rapunzel',      no: DISNEY_CHARS.filter(c => c !== 'Rapunzel') },
  { id: 323, yes: 'Buzz Lightyear', no: TOY_STORY_CHARS.filter(c => c !== 'Buzz Lightyear') },
  { id: 324, yes: 'Maui',          no: DISNEY_CHARS.filter(c => c !== 'Maui') },
  { id: 325, yes: 'Stitch',        no: DISNEY_CHARS.filter(c => c !== 'Stitch') },
  { id: 326, yes: 'Simba',         no: DISNEY_CHARS.filter(c => c !== 'Simba') },
  { id: 327, yes: 'Mulan',         no: DISNEY_CHARS.filter(c => c !== 'Mulan') },
  { id: 328, yes: 'Mickey Mouse',  no: DISNEY_CHARS.filter(c => c !== 'Mickey Mouse') },
  { id: 345, yes: 'Woody',         no: TOY_STORY_CHARS.filter(c => c !== 'Woody') },
  // Pokémon
  { id: 329, yes: 'Pikachu',    no: POKEMON_CHARS.filter(c => c !== 'Pikachu') },
  { id: 330, yes: 'Charmander', no: POKEMON_CHARS.filter(c => c !== 'Charmander') },
  { id: 331, yes: 'Bulbasaur',  no: POKEMON_CHARS.filter(c => c !== 'Bulbasaur') },
  { id: 332, yes: 'Blastoise',  no: POKEMON_CHARS.filter(c => c !== 'Blastoise') },
  { id: 333, yes: 'Squirtle',   no: POKEMON_CHARS.filter(c => c !== 'Squirtle') },
  { id: 334, yes: 'Gengar',     no: POKEMON_CHARS.filter(c => c !== 'Gengar') },
  { id: 335, yes: 'Eevee',      no: POKEMON_CHARS.filter(c => c !== 'Eevee') },
  { id: 336, yes: 'Mew',        no: POKEMON_CHARS.filter(c => c !== 'Mew') },
  { id: 337, yes: 'Mewtwo',     no: POKEMON_CHARS.filter(c => c !== 'Mewtwo') },
  { id: 338, yes: 'Snorlax',    no: POKEMON_CHARS.filter(c => c !== 'Snorlax') },
  { id: 339, yes: 'Charizard',  no: POKEMON_CHARS.filter(c => c !== 'Charizard') },
  // Simpsons
  { id: 340, yes: 'Bart Simpson',   no: SIMPSONS_CHARS.filter(c => c !== 'Bart Simpson') },
  // HxH
  { id: 343, yes: 'Gon Freecss',    no: HXH_CHARS.filter(c => c !== 'Gon Freecss') },
  { id: 344, yes: 'Killua Zoldyck', no: HXH_CHARS.filter(c => c !== 'Killua Zoldyck') },
]

// ================================================================
// FIXES FOR SHARED CONFIRMERS
// Characters that should lose their 'yes' on a now-shared question
// ================================================================
const SHARED_CONFIRMER_FIXES = [
  // Q264 (Sharingan) was shared by Sasuke, Itachi, Kakashi → keep only Sasuke
  { qId: 264, removeYesFrom: ['Itachi Uchiha', 'Kakashi Hatake'] },
  // Q268 (amarillo de piel) was shared by Homero and Bart → keep only Homero
  { qId: 268, removeYesFrom: ['Bart Simpson'] },
]

// ================================================================
// MAIN
// ================================================================

const personajesPath = join(ROOT, 'characters', 'personajes.json')
const characters = JSON.parse(readFileSync(personajesPath, 'utf8'))

let addedAnswers = 0
let fixedAnswers = 0

// Build a lookup map by name
const byName = {}
for (const char of characters) {
  byName[char.name] = char
}

// Apply new confirmer answers
for (const { id, yes: yesChar, no: noChars } of ASSIGNMENTS) {
  const target = byName[yesChar]
  if (!target) {
    console.warn(`  ⚠ Character not found: "${yesChar}"`)
    continue
  }
  if (target.answers[id] !== 'yes') {
    target.answers[id] = 'yes'
    addedAnswers++
  }
  for (const noChar of noChars) {
    const c = byName[noChar]
    if (!c) continue
    if (!c.answers[id]) {
      c.answers[id] = 'no'
      addedAnswers++
    }
  }
}

// Fix shared confirmers
for (const { qId, removeYesFrom } of SHARED_CONFIRMER_FIXES) {
  for (const name of removeYesFrom) {
    const char = byName[name]
    if (!char) continue
    if (char.answers[qId] === 'yes') {
      char.answers[qId] = 'no'
      fixedAnswers++
    }
  }
}

writeFileSync(personajesPath, JSON.stringify(characters, null, 2))
console.log(`✅ personajes.json updated`)
console.log(`   Added/updated: ${addedAnswers} answers`)
console.log(`   Fixed shared:  ${fixedAnswers} answers`)

// ================================================================
// REPORT: verify coverage
// ================================================================
const updatedChars = JSON.parse(readFileSync(personajesPath, 'utf8'))
const allConfirmerIds = [
  248,249,250,251,252,253,254,255,256,257,258,259,260,
  261,262,263,264,265,266,267,268,269,270,271,272,273,
  274,275,276,277,278,279,
  ...NEW_QUESTIONS.map(q => q.id)
]

const withConfirmer = []
const withoutConfirmer = []
for (const char of updatedChars) {
  const has = allConfirmerIds.some(id => char.answers[id] === 'yes')
  if (has) withConfirmer.push(char.name)
  else withoutConfirmer.push(char.name)
}

console.log(`\n📊 Coverage: ${withConfirmer.length} with confirmer, ${withoutConfirmer.length} without`)
if (withoutConfirmer.length > 0) {
  console.log('   Still without confirmer:', withoutConfirmer.join(', '))
}
