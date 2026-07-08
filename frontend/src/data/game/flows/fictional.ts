import { FlowNode } from '../questionFlow'

// ===== NON-HUMAN FICTIONAL CREATURES =====
// NOTE: Q4 (¿Es de ficción?) lives in HUB_FLOWS with prerequisites [Q1=yes].
// Do NOT add Q4 here — FLOW_MAP keeps only the last entry per ID.
export const FICTIONAL_FLOWS: FlowNode[] = [
  {
    id: 82, // ¿Tiene forma humana?
    prerequisites: [{ questionId: 3, answers: ['no'] }, { questionId: 4, answers: ['yes'] }],
    next: { default: 83 },
  },
  {
    id: 83, // ¿Habla como humano?
    prerequisites: [{ questionId: 3, answers: ['no'] }, { questionId: 4, answers: ['yes'] }],
    next: { default: 88 },
  },
  {
    id: 88, // ¿Usa ropa o armadura?
    prerequisites: [{ questionId: 3, answers: ['no'] }, { questionId: 4, answers: ['yes'] }],
    next: { default: 118 },
  },
  {
    id: 118, // ¿Es un samurái?
    prerequisites: [{ questionId: 3, answers: ['no'] }],
    next: { default: 119 },
  },
  {
    id: 119, // ¿Es un detective?
    prerequisites: [{ questionId: 3, answers: ['no'] }],
    next: { default: 120 },
  },
  {
    id: 120, // ¿Es un demonio / ser sobrenatural?
    prerequisites: [{ questionId: 3, answers: ['no'] }],
    next: { default: null },
  },

  // ===== GENERIC FICTIONAL TRAITS (reachable via fallback) =====
  {
    id: 72, // ¿Es un villano?
    prerequisites: [{ questionId: 4, answers: ['yes'] }],
    next: { default: null },
    weight: 2.0,
  },
  {
    id: 89, // ¿Es un robot o cyborg?
    prerequisites: [{ questionId: 4, answers: ['yes'] }],
    next: { default: null },
    weight: 2.0,
  },
  {
    id: 96, // ¿Tiene orejas puntiagudas?
    prerequisites: [{ questionId: 4, answers: ['yes'] }],
    next: { default: null },
    weight: 0.5,
  },

  // ===== FICTIONAL HUMAN BRANCH =====
  {
    id: 54, // ¿Usa una capa?
    prerequisites: [{ questionId: 4, answers: ['yes'] }],
    next: { default: 55 },
  },
  {
    id: 55, // ¿Usa una máscara?
    prerequisites: [{ questionId: 4, answers: ['yes'] }],
    next: { default: 56 },
  },
  {
    id: 56, // ¿Es un superhéroe?
    prerequisites: [{ questionId: 4, answers: ['yes'] }],
    next: {
      yes: 71,
      no: 57,
    },
    weight: 3.0,
  },
  {
    id: 71, // ¿Es de Marvel?
    prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 56, answers: ['yes'] }],
    next: {
      yes: null,
      no: 81,
    },
    weight: 3.0,
  },
  {
    id: 81, // ¿Es de DC Comics?
    prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 56, answers: ['yes'] }],
    next: { default: 61 },
    weight: 3.0,
  },
  {
    id: 61, // ¿Usa magia?
    prerequisites: [{ questionId: 4, answers: ['yes'] }],
    next: { default: 62 },
    weight: 2.0,
  },
  {
    id: 62, // ¿Usa un arma (espada, varita, etc.)?
    prerequisites: [{ questionId: 4, answers: ['yes'] }],
    next: { default: 74 },
    weight: 1.5,
  },
  {
    id: 74, // ¿Tiene superpoderes?
    prerequisites: [{ questionId: 4, answers: ['yes'] }],
    next: { default: 64 },
    weight: 2.0,
  },
  {
    id: 64, // ¿Es un animal fantástico o criatura mitológica?
    prerequisites: [{ questionId: 4, answers: ['yes'] }],
    next: { default: 57 },
    weight: 2.0,
  },

  // Fictional universes
  {
    id: 57, // ¿Es de Disney?
    prerequisites: [{ questionId: 4, answers: ['yes'] }],
    next: {
      yes: null,
      no: 58,
    },
    weight: 3.0,
  },
  {
    id: 58, // ¿Es de Nintendo?
    prerequisites: [{ questionId: 4, answers: ['yes'] }],
    next: {
      yes: null,
      no: 59,
    },
    weight: 3.0,
  },
  {
    id: 59, // ¿Es de anime?
    prerequisites: [{ questionId: 4, answers: ['yes'] }],
    next: {
      yes: 84,
      no: 60,
    },
    weight: 3.0,
  },
  {
    id: 84, // ¿Es de Dragon Ball?
    prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 59, answers: ['yes'] }],
    next: { default: 85 },
    weight: 3.5,
  },
  {
    id: 85, // ¿Es de Pokémon?
    prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 59, answers: ['yes'] }],
    next: { default: 86 },
    weight: 3.5,
  },
  {
    id: 86, // ¿Puede volar sin alas?
    prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 59, answers: ['yes'] }],
    next: { default: 87 },
    weight: 2.0,
  },
  {
    id: 87, // ¿Tiene transformaciones / evoluciones?
    prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 59, answers: ['yes'] }],
    next: { default: 90 },
    weight: 2.0,
  },
  {
    id: 90, // ¿Tiene una frase característica o grito de guerra?
    prerequisites: [{ questionId: 4, answers: ['yes'] }],
    next: { default: 91 },
    weight: 1.0,
  },
  {
    id: 91, // ¿Es un robot o cyborg?
    prerequisites: [{ questionId: 4, answers: ['yes'] }],
    next: { default: 92 },
    weight: 2.0,
  },
  {
    id: 92, // ¿Es un auror / mago?
    prerequisites: [{ questionId: 4, answers: ['yes'] }],
    next: { default: 93 },
    weight: 1.5,
  },
  {
    id: 93, // ¿Es de Star Wars?
    prerequisites: [{ questionId: 4, answers: ['yes'] }],
    next: {
      yes: null,
      no: 94,
    },
    weight: 3.0,
  },
  {
    id: 94, // ¿Es de Harry Potter?
    prerequisites: [{ questionId: 4, answers: ['yes'] }],
    next: {
      yes: null,
      no: 95,
    },
    weight: 3.0,
  },
  {
    id: 95, // ¿Es de El Señor de los Anillos?
    prerequisites: [{ questionId: 4, answers: ['yes'] }],
    next: {
      yes: null,
      no: 97,
    },
    weight: 3.0,
  },
  {
    id: 60, // ¿Es de un videojuego?
    prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 59, answers: ['no', 'probably_not'] }],
    next: { default: 73 },
    weight: 3.0,
  },
  {
    id: 73, // ¿Es de Star Wars?
    prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 60, answers: ['yes'] }],
    next: {
      yes: null,
      no: 75,
    },
    weight: 3.0,
  },
  {
    id: 75, // ¿Es de Harry Potter?
    prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 60, answers: ['yes'] }],
    next: { default: 97 },
    weight: 3.0,
  },

  // Game universes (97-110)
  {
    id: 97, // ¿Es de Minecraft?
    prerequisites: [{ questionId: 4, answers: ['yes'] }],
    next: { default: 98 },
    weight: 3.0,
  },
  {
    id: 98, // ¿Es de Fortnite?
    prerequisites: [{ questionId: 4, answers: ['yes'] }],
    next: { default: 99 },
    weight: 3.0,
  },
  {
    id: 99, // ¿Es de League of Legends?
    prerequisites: [{ questionId: 4, answers: ['yes'] }],
    next: { default: 100 },
    weight: 3.0,
  },
  {
    id: 100, // ¿Es de Zelda?
    prerequisites: [{ questionId: 4, answers: ['yes'] }],
    next: { default: 101 },
    weight: 3.0,
  },
  {
    id: 101, // ¿Es de Final Fantasy?
    prerequisites: [{ questionId: 4, answers: ['yes'] }],
    next: { default: 102 },
    weight: 3.0,
  },
  {
    id: 102, // ¿Es de Street Fighter?
    prerequisites: [{ questionId: 4, answers: ['yes'] }],
    next: { default: 103 },
    weight: 3.0,
  },
  {
    id: 103, // ¿Es de God of War?
    prerequisites: [{ questionId: 4, answers: ['yes'] }],
    next: { default: 104 },
    weight: 3.0,
  },
  {
    id: 104, // ¿Es de Halo?
    prerequisites: [{ questionId: 4, answers: ['yes'] }],
    next: { default: 105 },
    weight: 3.0,
  },
  {
    id: 105, // ¿Es de Assassin's Creed?
    prerequisites: [{ questionId: 4, answers: ['yes'] }],
    next: { default: 106 },
    weight: 3.0,
  },
  {
    id: 106, // ¿Es de Mortal Kombat?
    prerequisites: [{ questionId: 4, answers: ['yes'] }],
    next: { default: 107 },
    weight: 3.0,
  },
  {
    id: 107, // ¿Es de Kingdom Hearts?
    prerequisites: [{ questionId: 4, answers: ['yes'] }],
    next: { default: 108 },
    weight: 3.0,
  },
  {
    id: 108, // ¿Es de Among Us?
    prerequisites: [{ questionId: 4, answers: ['yes'] }],
    next: { default: 109 },
    weight: 3.0,
  },
  {
    id: 109, // ¿Es de The Witcher?
    prerequisites: [{ questionId: 4, answers: ['yes'] }],
    next: { default: 110 },
    weight: 3.0,
  },
  {
    id: 110, // ¿Es de Metal Gear?
    prerequisites: [{ questionId: 4, answers: ['yes'] }],
    next: { default: 111 },
    weight: 3.0,
  },

  // Anime universes (111-117)
  {
    id: 111, // ¿Es de Attack on Titan?
    prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 59, answers: ['yes'] }],
    next: { default: 112 },
    weight: 3.5,
  },
  {
    id: 112, // ¿Es de Death Note?
    prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 59, answers: ['yes'] }],
    next: { default: 113 },
    weight: 3.5,
  },
  {
    id: 113, // ¿Es de Evangelion?
    prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 59, answers: ['yes'] }],
    next: { default: 114 },
    weight: 3.5,
  },
  {
    id: 114, // ¿Es de Fullmetal Alchemist?
    prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 59, answers: ['yes'] }],
    next: { default: 115 },
    weight: 3.5,
  },
  {
    id: 115, // ¿Es de Bleach?
    prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 59, answers: ['yes'] }],
    next: { default: 116 },
    weight: 3.5,
  },
  {
    id: 116, // ¿Es de Hunter x Hunter?
    prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 59, answers: ['yes'] }],
    next: { default: 117 },
    weight: 3.5,
  },
  {
    id: 117, // ¿Es de One Punch Man?
    prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 59, answers: ['yes'] }],
    next: { default: 121 },
    weight: 3.5,
  },

  // Character traits (121-130)
  {
    id: 121, // ¿Es protagonista?
    prerequisites: [{ questionId: 4, answers: ['yes'] }],
    next: { default: 122 },
    weight: 2.0,
  },
  {
    id: 122, // ¿Es de una película?
    prerequisites: [{ questionId: 4, answers: ['yes'] }],
    next: { default: 123 },
    weight: 1.5,
  },
  {
    id: 123, // ¿Es líder / capitán?
    prerequisites: [{ questionId: 4, answers: ['yes'] }],
    next: { default: 124 },
    weight: 1.5,
  },
  {
    id: 124, // ¿Es muy inteligente / estratega?
    prerequisites: [{ questionId: 4, answers: ['yes'] }],
    next: { default: 125 },
    weight: 1.5,
  },
  {
    id: 125, // ¿Es alto / grande?
    prerequisites: [{ questionId: 3, answers: ['yes'] }],
    next: { default: 126 },
    weight: 0.8,
  },
  {
    id: 126, // ¿Tiene barba?
    prerequisites: [{ questionId: 3, answers: ['yes'] }],
    next: { default: 127 },
    weight: 0.5,
  },
  {
    id: 127, // ¿Usa tecnología avanzada / gadgets?
    prerequisites: [{ questionId: 4, answers: ['yes'] }],
    next: { default: 128 },
    weight: 1.5,
  },
  {
    id: 128, // ¿Es un anti-héroe?
    prerequisites: [{ questionId: 4, answers: ['yes'] }],
    next: { default: 129 },
    weight: 1.5,
  },
  {
    id: 129, // ¿Es un sidekick / compañero?
    prerequisites: [{ questionId: 4, answers: ['yes'] }],
    next: { default: 130 },
    weight: 1.5,
  },
  {
    id: 130, // ¿Es de una serie live-action?
    prerequisites: [{ questionId: 4, answers: ['yes'] }],
    next: { default: 131 },
    weight: 1.5,
  },
  {
    id: 224, // ¿Usa espada?
    prerequisites: [{ questionId: 4, answers: ['yes'] }],
    next: { default: null },
    weight: 2.0,
  },
  {
    id: 225, // ¿Es un pirata?
    prerequisites: [{ questionId: 4, answers: ['yes'] }],
    next: { default: null },
    weight: 2.0,
  },
  {
    id: 226, // ¿Es un ninja?
    prerequisites: [{ questionId: 4, answers: ['yes'] }],
    next: { default: null },
    weight: 2.0,
  },

  // Popular universes (131-138)
  {
    id: 131, // ¿Es de My Hero Academia?
    prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 59, answers: ['yes'] }],
    next: { default: 132 },
    weight: 3.5,
  },
  {
    id: 132, // ¿Es de Demon Slayer?
    prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 59, answers: ['yes'] }],
    next: { default: 133 },
    weight: 3.5,
  },
  {
    id: 133, // ¿Es de Jujutsu Kaisen?
    prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 59, answers: ['yes'] }],
    next: { default: 134 },
    weight: 3.5,
  },
  {
    id: 134, // ¿Es de Game of Thrones?
    prerequisites: [{ questionId: 4, answers: ['yes'] }],
    next: { default: 135 },
    weight: 3.0,
  },
  {
    id: 135, // ¿Es de Breaking Bad?
    prerequisites: [{ questionId: 4, answers: ['yes'] }],
    next: { default: 136 },
    weight: 3.0,
  },
  {
    id: 136, // ¿Es de Stranger Things?
    prerequisites: [{ questionId: 4, answers: ['yes'] }],
    next: { default: 137 },
    weight: 3.0,
  },
  {
    id: 137, // ¿Es de Los Simpsons?
    prerequisites: [{ questionId: 4, answers: ['yes'] }],
    next: { default: 138 },
    weight: 3.0,
  },
  {
    id: 138, // ¿Es de Rick and Morty?
    prerequisites: [{ questionId: 4, answers: ['yes'] }],
    next: { default: null },
    weight: 3.0,
  },
  {
    id: 219, // ¿Es de Rurouni Kenshin / Samurai X?
    prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 59, answers: ['yes'] }],
    next: { default: null },
    weight: 3.5,
  },

  // ---- Disney-specific questions (require Disney confirmed) ----
  { id: 566, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 57, answers: ['yes'] }], next: { default: null }, weight: 3.0 }, // Pixar
  { id: 567, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 57, answers: ['yes'] }], next: { default: null }, weight: 3.0 }, // princesa Disney
  { id: 568, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 57, answers: ['yes'] }], next: { default: null }, weight: 2.5 }, // clásico antes 2000
  { id: 569, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 57, answers: ['yes'] }], next: { default: null }, weight: 2.0 }, // canción icónica
  { id: 570, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 57, answers: ['yes'] }], next: { default: null }, weight: 2.5 }, // animal/criatura no humana
  { id: 571, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 57, answers: ['yes'] }], next: { default: null }, weight: 2.5 }, // villano principal de su película
  { id: 572, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 57, answers: ['yes'] }], next: { default: null }, weight: 2.0 }, // poderes/habilidades mágicas

  // ---- Nintendo-specific questions (require Nintendo confirmed) ----
  { id: 573, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 58, answers: ['yes'] }], next: { default: null }, weight: 3.5 }, // Mario
  { id: 574, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 58, answers: ['yes'] }], next: { default: null }, weight: 3.5 }, // franquicia Pokémon
  { id: 575, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 58, answers: ['yes'] }], next: { default: null }, weight: 3.0 }, // Kirby
  { id: 576, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 58, answers: ['yes'] }], next: { default: null }, weight: 3.0 }, // Metroid
  { id: 577, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 58, answers: ['yes'] }], next: { default: null }, weight: 3.0 }, // Fire Emblem
  { id: 578, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 58, answers: ['yes'] }], next: { default: null }, weight: 2.0 }, // Super Smash Bros
  { id: 579, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 58, answers: ['yes'] }], next: { default: null }, weight: 2.5 }, // copiar habilidades
  { id: 580, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 58, answers: ['yes'] }], next: { default: null }, weight: 2.0 }, // personaje principal de su franquicia

  // ---- Videojuego-specific questions (require videojuego confirmed) ----
  { id: 556, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 60, answers: ['yes'] }], next: { default: null }, weight: 2.0 }, // RPG
  { id: 557, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 60, answers: ['yes'] }], next: { default: null }, weight: 2.0 }, // shooter
  { id: 558, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 60, answers: ['yes'] }], next: { default: null }, weight: 2.0 }, // terror/survival horror
  { id: 559, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 60, answers: ['yes'] }], next: { default: null }, weight: 3.5 }, // The Last of Us
  { id: 560, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 60, answers: ['yes'] }], next: { default: null }, weight: 3.5 }, // Resident Evil
  { id: 561, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 60, answers: ['yes'] }], next: { default: null }, weight: 3.0 }, // Dark Souls/Elden Ring
  { id: 562, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 60, answers: ['yes'] }], next: { default: null }, weight: 3.0 }, // GTA
  { id: 563, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 60, answers: ['yes'] }], next: { default: null }, weight: 2.0 }, // magia/habilidades
  { id: 564, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 60, answers: ['yes'] }], next: { default: null }, weight: 2.5 }, // jefe final/antagonista
  { id: 565, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 60, answers: ['yes'] }], next: { default: null }, weight: 2.0 }, // aparece en más de un juego

  // ---- Anime shonen-specific questions (require anime confirmed) ----
  { id: 539, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 59, answers: ['yes'] }], next: { default: null }, weight: 3.0 }, // Fairy Tail
  { id: 540, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 59, answers: ['yes'] }], next: { default: null }, weight: 2.5 }, // ki/chakra/haki
  { id: 541, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 59, answers: ['yes'] }], next: { default: null }, weight: 2.0 }, // equipo de combate
  { id: 542, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 59, answers: ['yes'] }], next: { default: null }, weight: 2.0 }, // rival icónico

  // ---- Anime seinen-specific questions (require anime confirmed) ----
  { id: 543, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 59, answers: ['yes'] }], next: { default: null }, weight: 3.5 }, // Berserk
  { id: 544, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 59, answers: ['yes'] }], next: { default: null }, weight: 3.0 }, // Chainsaw Man
  { id: 545, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 59, answers: ['yes'] }], next: { default: null }, weight: 3.0 }, // Vinland Saga
  { id: 546, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 59, answers: ['yes'] }], next: { default: null }, weight: 2.0 }, // tono oscuro/trágico
  { id: 547, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 59, answers: ['yes'] }], next: { default: null }, weight: 2.0 }, // soldado/combatiente
  { id: 548, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 59, answers: ['yes'] }], next: { default: null }, weight: 2.0 }, // motivaciones ambiguas

  // ---- Anime magical-girl-specific questions (require anime confirmed) ----
  { id: 549, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 59, answers: ['yes'] }], next: { default: null }, weight: 3.5 }, // Sailor Moon
  { id: 550, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 59, answers: ['yes'] }], next: { default: null }, weight: 3.0 }, // Cardcaptor Sakura
  { id: 551, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 59, answers: ['yes'] }], next: { default: null }, weight: 3.0 }, // Madoka Magica
  { id: 552, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 59, answers: ['yes'] }], next: { default: null }, weight: 2.0 }, // grita nombre del ataque
  { id: 553, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 59, answers: ['yes'] }], next: { default: null }, weight: 2.0 }, // varita/cetro mágico
  { id: 554, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 59, answers: ['yes'] }], next: { default: null }, weight: 2.0 }, // alter ego/nombre heroína
  { id: 555, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 59, answers: ['yes'] }], next: { default: null }, weight: 2.0 }, // mascota/companion mágico

  // ---- Superhero-specific questions (require superhero confirmed) ----
  { id: 534, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 56, answers: ['yes'] }], next: { default: null }, weight: 2.0 }, // identidad secreta
  { id: 535, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 56, answers: ['yes'] }], next: { default: null }, weight: 2.0 }, // pertenece a equipo
  { id: 536, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 56, answers: ['yes'] }], next: { default: null }, weight: 2.5 }, // mutante
  { id: 537, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 56, answers: ['yes'] }], next: { default: null }, weight: 2.0 }, // poderes tecnológicos

  // ---- Hair color (fiction only) ----
  { id: 220, prerequisites: [{ questionId: 4, answers: ['yes'] }], next: { default: null }, weight: 1.0 }, // pelo azul
  { id: 221, prerequisites: [{ questionId: 4, answers: ['yes'] }], next: { default: null }, weight: 1.0 }, // pelo verde
  { id: 222, prerequisites: [{ questionId: 4, answers: ['yes'] }], next: { default: null }, weight: 1.0 }, // pelo blanco
  { id: 223, prerequisites: [{ questionId: 4, answers: ['yes'] }], next: { default: null }, weight: 1.0 }, // pelo negro

  // ---- Cicatriz / marca (fiction only) ----
  { id: 227, prerequisites: [{ questionId: 4, answers: ['yes'] }], next: { default: null }, weight: 1.0 },

  // ---- Dragon Ball specific (require DB confirmed) ----
  { id: 228, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 84, answers: ['yes'] }], next: { default: null }, weight: 2.5 }, // Saiyajin
  { id: 229, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 84, answers: ['yes'] }], next: { default: null }, weight: 2.5 }, // Namekiano
  { id: 230, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 84, answers: ['yes'] }], next: { default: null }, weight: 2.0 }, // androide
  { id: 231, prerequisites: [{ questionId: 4, answers: ['yes'] }], next: { default: null }, weight: 1.5 }, // villano principal
  { id: 232, prerequisites: [{ questionId: 4, answers: ['yes'] }], next: { default: null }, weight: 1.5 }, // múltiples formas
  { id: 233, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 84, answers: ['yes'] }], next: { default: null }, weight: 2.0 }, // humano puro DB
  { id: 235, prerequisites: [{ questionId: 4, answers: ['yes'] }], next: { default: null }, weight: 1.0 }, // realeza/príncipe (fiction)

  // ---- Pokémon starter/type (require Pokémon confirmed) ----
  { id: 161, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 85, answers: ['yes'] }], next: { default: null }, weight: 2.5 }, // starter
  { id: 162, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 85, answers: ['yes'] }], next: { default: null }, weight: 2.5 }, // tipo fuego
  { id: 163, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 85, answers: ['yes'] }], next: { default: null }, weight: 2.5 }, // tipo agua
  { id: 164, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 85, answers: ['yes'] }], next: { default: null }, weight: 2.5 }, // tipo planta
  { id: 165, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 85, answers: ['yes'] }], next: { default: null }, weight: 2.5 }, // tipo eléctrico

  // ---- Pokémon specific (require Pokémon confirmed) ----
  { id: 166, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 85, answers: ['yes'] }], next: { default: null }, weight: 2.5 }, // evolución
  { id: 167, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 85, answers: ['yes'] }], next: { default: null }, weight: 2.5 }, // legendario
  { id: 168, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 85, answers: ['yes'] }], next: { default: null }, weight: 2.0 }, // primera gen
  { id: 169, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 85, answers: ['yes'] }], next: { default: null }, weight: 2.0 }, // tipo dragón
  { id: 170, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 85, answers: ['yes'] }], next: { default: null }, weight: 2.0 }, // tipo psíquico
  { id: 171, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 85, answers: ['yes'] }], next: { default: null }, weight: 2.0 }, // tipo fantasma
  { id: 172, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 85, answers: ['yes'] }], next: { default: null }, weight: 2.0 }, // tipo hielo
  { id: 173, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 85, answers: ['yes'] }], next: { default: null }, weight: 2.0 }, // tipo lucha
  { id: 174, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 85, answers: ['yes'] }], next: { default: null }, weight: 2.0 }, // tipo volador
  { id: 175, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 85, answers: ['yes'] }], next: { default: null }, weight: 2.5 }, // compañero Ash
  { id: 176, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 85, answers: ['yes'] }], next: { default: null }, weight: 2.0 }, // dice su nombre
  { id: 177, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 85, answers: ['yes'] }], next: { default: null }, weight: 2.0 }, // evoluciona piedra
  { id: 178, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 85, answers: ['yes'] }], next: { default: null }, weight: 2.0 }, // tipo normal
  { id: 179, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 85, answers: ['yes'] }], next: { default: null }, weight: 1.5 }, // roedor
  { id: 180, prerequisites: [{ questionId: 4, answers: ['yes'] }, { questionId: 85, answers: ['yes'] }], next: { default: null }, weight: 1.5 }, // reptil
]
