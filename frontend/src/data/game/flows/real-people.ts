import { FlowNode } from '../questionFlow'

export const REAL_PEOPLE_FLOWS: FlowNode[] = [
  {
    id: 16, // ¿Es de Argentina?
    prerequisites: [{ questionId: 3, answers: ['yes'] }, { questionId: 4, answers: ['no', 'probably_not'] }],
    next: {
      yes: null,
      no: 44,
    },
    weight: 2.5,
  },
  {
    id: 44, // ¿Es de Estados Unidos?
    prerequisites: [{ questionId: 3, answers: ['yes'] }, { questionId: 4, answers: ['no', 'probably_not'] }],
    next: {
      yes: null,
      no: 45,
    },
    weight: 2.5,
  },
  {
    id: 45, // ¿Es europeo?
    prerequisites: [{ questionId: 3, answers: ['yes'] }, { questionId: 4, answers: ['no', 'probably_not'] }],
    next: {
      yes: null,
      no: 46,
    },
    weight: 2.5,
  },
  {
    id: 46, // ¿Es japonés?
    prerequisites: [{ questionId: 3, answers: ['yes'] }, { questionId: 4, answers: ['no', 'probably_not'] }],
    next: {
      yes: null,
      no: 47,
    },
    weight: 2.5,
  },
  {
    id: 47, // ¿Es de otro país de América / África / Asia?
    prerequisites: [{ questionId: 3, answers: ['yes'] }, { questionId: 4, answers: ['no', 'probably_not'] }],
    next: { default: 52 },
    weight: 2.0,
  },
  {
    id: 52, // ¿Es mujer?
    prerequisites: [{ questionId: 3, answers: ['yes'] }, { questionId: 4, answers: ['no', 'probably_not'] }],
    next: {
      yes: null,
      no: 53,
    },
    weight: 2.0,
  },
  {
    id: 53, // ¿Es hombre?
    prerequisites: [{ questionId: 3, answers: ['yes'] }, { questionId: 4, answers: ['no', 'probably_not'] }],
    next: { default: 141 },
    weight: 2.0,
  },
  {
    id: 141, // ¿Tiene más de 30 años?
    prerequisites: [{ questionId: 3, answers: ['yes'] }, { questionId: 4, answers: ['no', 'probably_not'] }],
    next: { default: 17 },
    weight: 1.0,
  },
  {
    id: 17, // ¿Es atleta?
    prerequisites: [{ questionId: 3, answers: ['yes'] }, { questionId: 4, answers: ['no', 'probably_not'] }],
    exclusions: [
      { questionId: 18, answers: ['yes'] },
      { questionId: 19, answers: ['yes'] },
      { questionId: 20, answers: ['yes'] },
      { questionId: 77, answers: ['yes'] },
      { questionId: 78, answers: ['yes'] },
    ],
    next: {
      yes: 76,
      no: 18,
    },
    weight: 2.5,
  },
  {
    id: 76, // ¿Es futbolista?
    prerequisites: [
      { questionId: 3, answers: ['yes'] },
      { questionId: 4, answers: ['no', 'probably_not'] },
      { questionId: 17, answers: ['yes'] },
    ],
    exclusions: [
      { questionId: 187, answers: ['yes'] },
      { questionId: 188, answers: ['yes'] },
      { questionId: 189, answers: ['yes'] },
      { questionId: 190, answers: ['yes'] },
    ],
    next: { default: 139 },
    weight: 3.0,
  },
  {
    id: 187, // ¿Juega al baloncesto / básquet?
    prerequisites: [
      { questionId: 3, answers: ['yes'] },
      { questionId: 4, answers: ['no', 'probably_not'] },
      { questionId: 17, answers: ['yes'] },
    ],
    exclusions: [
      { questionId: 76, answers: ['yes'] },
      { questionId: 188, answers: ['yes'] },
      { questionId: 189, answers: ['yes'] },
      { questionId: 190, answers: ['yes'] },
    ],
    next: { default: null },
    weight: 2.5,
  },
  {
    id: 188, // ¿Juega al tenis?
    prerequisites: [
      { questionId: 3, answers: ['yes'] },
      { questionId: 4, answers: ['no', 'probably_not'] },
      { questionId: 17, answers: ['yes'] },
    ],
    exclusions: [
      { questionId: 76, answers: ['yes'] },
      { questionId: 187, answers: ['yes'] },
      { questionId: 189, answers: ['yes'] },
      { questionId: 190, answers: ['yes'] },
    ],
    next: { default: null },
    weight: 2.5,
  },
  {
    id: 189, // ¿Juega al golf?
    prerequisites: [
      { questionId: 3, answers: ['yes'] },
      { questionId: 4, answers: ['no', 'probably_not'] },
      { questionId: 17, answers: ['yes'] },
    ],
    exclusions: [
      { questionId: 76, answers: ['yes'] },
      { questionId: 187, answers: ['yes'] },
      { questionId: 188, answers: ['yes'] },
      { questionId: 190, answers: ['yes'] },
    ],
    next: { default: null },
    weight: 2.5,
  },
  {
    id: 190, // ¿Es boxeador/a o luchador/a?
    prerequisites: [
      { questionId: 3, answers: ['yes'] },
      { questionId: 4, answers: ['no', 'probably_not'] },
      { questionId: 17, answers: ['yes'] },
    ],
    exclusions: [
      { questionId: 76, answers: ['yes'] },
      { questionId: 187, answers: ['yes'] },
      { questionId: 188, answers: ['yes'] },
      { questionId: 189, answers: ['yes'] },
    ],
    next: { default: null },
    weight: 2.5,
  },
  {
    id: 139, // ¿Es zurdo/a?
    prerequisites: [
      { questionId: 3, answers: ['yes'] },
      { questionId: 4, answers: ['no', 'probably_not'] },
      { questionId: 76, answers: ['yes'] },
    ],
    next: { default: 143 },
    weight: 2.0,
  },
  {
    id: 143, // ¿Es delantero / atacante?
    prerequisites: [
      { questionId: 3, answers: ['yes'] },
      { questionId: 4, answers: ['no', 'probably_not'] },
      { questionId: 76, answers: ['yes'] },
    ],
    next: {
      yes: 144,
      no: 146,
    },
    weight: 2.5,
  },
  {
    id: 144, // ¿Es conocido/a por su velocidad?
    prerequisites: [
      { questionId: 3, answers: ['yes'] },
      { questionId: 4, answers: ['no', 'probably_not'] },
      { questionId: 76, answers: ['yes'] },
    ],
    next: { default: 145 },
    weight: 1.5,
  },
  {
    id: 145, // ¿Es conocido/a por su técnica o habilidad?
    prerequisites: [
      { questionId: 3, answers: ['yes'] },
      { questionId: 4, answers: ['no', 'probably_not'] },
      { questionId: 76, answers: ['yes'] },
    ],
    next: { default: 140 },
    weight: 1.5,
  },
  {
    id: 146, // ¿Es defensor?
    prerequisites: [
      { questionId: 3, answers: ['yes'] },
      { questionId: 4, answers: ['no', 'probably_not'] },
      { questionId: 76, answers: ['yes'] },
    ],
    next: {
      yes: null,
      no: 147,
    },
    weight: 2.5,
  },
  {
    id: 147, // ¿Es arquero / portero?
    prerequisites: [
      { questionId: 3, answers: ['yes'] },
      { questionId: 4, answers: ['no', 'probably_not'] },
      { questionId: 76, answers: ['yes'] },
    ],
    next: { default: 140 },
    weight: 2.5,
  },
  {
    id: 140, // ¿Ganó un Mundial / Copa del Mundo?
    prerequisites: [
      { questionId: 3, answers: ['yes'] },
      { questionId: 4, answers: ['no', 'probably_not'] },
      { questionId: 76, answers: ['yes'] },
    ],
    next: { default: 148 },
    weight: 3.0,
  },
  {
    id: 148, // ¿Es considerado/a una leyenda de su deporte?
    prerequisites: [
      { questionId: 3, answers: ['yes'] },
      { questionId: 4, answers: ['no', 'probably_not'] },
      { questionId: 76, answers: ['yes'] },
    ],
    next: { default: 149 },
    weight: 2.5,
  },
  {
    id: 149, // ¿Jugó en más de un país (clubes de diferentes países)?
    prerequisites: [
      { questionId: 3, answers: ['yes'] },
      { questionId: 4, answers: ['no', 'probably_not'] },
      { questionId: 76, answers: ['yes'] },
    ],
    next: { default: null },
    weight: 1.5,
  },
  {
    id: 18, // ¿Es músico?
    prerequisites: [{ questionId: 3, answers: ['yes'] }, { questionId: 4, answers: ['no', 'probably_not'] }],
    exclusions: [
      { questionId: 17, answers: ['yes'] },
      { questionId: 19, answers: ['yes'] },
      { questionId: 20, answers: ['yes'] },
      { questionId: 77, answers: ['yes'] },
      { questionId: 78, answers: ['yes'] },
    ],
    next: {
      yes: 154,
      no: 19,
    },
    weight: 2.5,
  },
  {
    id: 154, // ¿Es de pop?
    prerequisites: [
      { questionId: 3, answers: ['yes'] },
      { questionId: 4, answers: ['no', 'probably_not'] },
      { questionId: 18, answers: ['yes'] },
    ],
    next: {
      yes: null,
      no: 155,
    },
    weight: 2.0,
  },
  {
    id: 155, // ¿Es de rock?
    prerequisites: [
      { questionId: 3, answers: ['yes'] },
      { questionId: 4, answers: ['no', 'probably_not'] },
      { questionId: 18, answers: ['yes'] },
    ],
    next: {
      yes: null,
      no: 156,
    },
    weight: 2.0,
  },
  {
    id: 156, // ¿Es de rap / hip-hop?
    prerequisites: [
      { questionId: 3, answers: ['yes'] },
      { questionId: 4, answers: ['no', 'probably_not'] },
      { questionId: 18, answers: ['yes'] },
    ],
    next: {
      yes: null,
      no: 157,
    },
    weight: 2.0,
  },
  {
    id: 157, // ¿Es de reggaeton?
    prerequisites: [
      { questionId: 3, answers: ['yes'] },
      { questionId: 4, answers: ['no', 'probably_not'] },
      { questionId: 18, answers: ['yes'] },
    ],
    next: {
      yes: null,
      no: 158,
    },
    weight: 2.0,
  },
  {
    id: 158, // ¿Toca guitarra?
    prerequisites: [
      { questionId: 3, answers: ['yes'] },
      { questionId: 4, answers: ['no', 'probably_not'] },
      { questionId: 18, answers: ['yes'] },
    ],
    next: {
      yes: null,
      no: 159,
    },
    weight: 1.5,
  },
  {
    id: 159, // ¿Toca piano?
    prerequisites: [
      { questionId: 3, answers: ['yes'] },
      { questionId: 4, answers: ['no', 'probably_not'] },
      { questionId: 18, answers: ['yes'] },
    ],
    next: {
      yes: null,
      no: 160,
    },
    weight: 1.5,
  },
  {
    id: 160, // ¿Es conocido/a por bailar?
    prerequisites: [
      { questionId: 3, answers: ['yes'] },
      { questionId: 4, answers: ['no', 'probably_not'] },
      { questionId: 18, answers: ['yes'] },
    ],
    next: { default: null },
    weight: 1.5,
  },
  {
    id: 19, // ¿Es actor/actriz?
    prerequisites: [{ questionId: 3, answers: ['yes'] }, { questionId: 4, answers: ['no', 'probably_not'] }],
    exclusions: [
      { questionId: 17, answers: ['yes'] },
      { questionId: 18, answers: ['yes'] },
      { questionId: 20, answers: ['yes'] },
      { questionId: 77, answers: ['yes'] },
      { questionId: 78, answers: ['yes'] },
    ],
    next: {
      yes: 150,
      no: 20,
    },
    weight: 2.5,
  },
  {
    id: 150, // ¿Ganó un Oscar?
    prerequisites: [
      { questionId: 3, answers: ['yes'] },
      { questionId: 4, answers: ['no', 'probably_not'] },
      { questionId: 19, answers: ['yes'] },
    ],
    next: { default: 151 },
    weight: 2.5,
  },
  {
    id: 151, // ¿Es conocido/a por películas de acción?
    prerequisites: [
      { questionId: 3, answers: ['yes'] },
      { questionId: 4, answers: ['no', 'probably_not'] },
      { questionId: 19, answers: ['yes'] },
    ],
    next: {
      yes: null,
      no: 152,
    },
    weight: 2.0,
  },
  {
    id: 152, // ¿Es conocido/a por comedias?
    prerequisites: [
      { questionId: 3, answers: ['yes'] },
      { questionId: 4, answers: ['no', 'probably_not'] },
      { questionId: 19, answers: ['yes'] },
    ],
    next: {
      yes: null,
      no: 153,
    },
    weight: 2.0,
  },
  {
    id: 153, // ¿Es conocido/a por dramas?
    prerequisites: [
      { questionId: 3, answers: ['yes'] },
      { questionId: 4, answers: ['no', 'probably_not'] },
      { questionId: 19, answers: ['yes'] },
    ],
    next: { default: null },
    weight: 2.0,
  },
  {
    id: 20, // ¿Es figura histórica / política?
    prerequisites: [{ questionId: 3, answers: ['yes'] }, { questionId: 4, answers: ['no', 'probably_not'] }],
    exclusions: [
      { questionId: 17, answers: ['yes'] },
      { questionId: 18, answers: ['yes'] },
      { questionId: 19, answers: ['yes'] },
      { questionId: 77, answers: ['yes'] },
      { questionId: 78, answers: ['yes'] },
    ],
    next: {
      yes: 79,
      no: 77,
    },
    weight: 2.5,
  },
  {
    id: 77, // ¿Es youtuber / streamer?
    prerequisites: [{ questionId: 3, answers: ['yes'] }, { questionId: 4, answers: ['no', 'probably_not'] }],
    exclusions: [
      { questionId: 17, answers: ['yes'] },
      { questionId: 18, answers: ['yes'] },
      { questionId: 19, answers: ['yes'] },
      { questionId: 20, answers: ['yes'] },
      { questionId: 78, answers: ['yes'] },
    ],
    next: {
      yes: null,
      no: 78,
    },
    weight: 2.5,
  },
  {
    id: 78, // ¿Es científico / inventor?
    prerequisites: [{ questionId: 3, answers: ['yes'] }, { questionId: 4, answers: ['no', 'probably_not'] }],
    exclusions: [
      { questionId: 17, answers: ['yes'] },
      { questionId: 18, answers: ['yes'] },
      { questionId: 19, answers: ['yes'] },
      { questionId: 20, answers: ['yes'] },
      { questionId: 77, answers: ['yes'] },
    ],
    next: {
      yes: null,
      no: 80,
    },
    weight: 2.5,
  },
  {
    id: 79, // ¿Es artista / pintor?
    prerequisites: [{ questionId: 3, answers: ['yes'] }, { questionId: 4, answers: ['no', 'probably_not'] }],
    exclusions: [
      { questionId: 17, answers: ['yes'] },
      { questionId: 18, answers: ['yes'] },
      { questionId: 19, answers: ['yes'] },
      { questionId: 77, answers: ['yes'] },
      { questionId: 78, answers: ['yes'] },
    ],
    next: { default: null },
    weight: 2.0,
  },
  {
    id: 80, // ¿Es político / líder?
    prerequisites: [{ questionId: 3, answers: ['yes'] }, { questionId: 4, answers: ['no', 'probably_not'] }],
    exclusions: [
      { questionId: 17, answers: ['yes'] },
      { questionId: 18, answers: ['yes'] },
      { questionId: 19, answers: ['yes'] },
      { questionId: 77, answers: ['yes'] },
      { questionId: 78, answers: ['yes'] },
    ],
    next: { default: null },
    weight: 2.0,
  },
  {
    id: 48, // ¿Tiene bigote?
    prerequisites: [{ questionId: 3, answers: ['yes'] }, { questionId: 4, answers: ['no', 'probably_not'] }],
    next: { default: 49 },
    weight: 0.5,
  },
  {
    id: 49, // ¿Usa lentes?
    prerequisites: [{ questionId: 3, answers: ['yes'] }, { questionId: 4, answers: ['no', 'probably_not'] }],
    next: { default: 50 },
    weight: 0.5,
  },
  {
    id: 50, // ¿Es calvo/a?
    prerequisites: [{ questionId: 3, answers: ['yes'] }, { questionId: 4, answers: ['no', 'probably_not'] }],
    next: { default: 51 },
    weight: 0.5,
  },
  {
    id: 51, // ¿Tiene el pelo largo?
    prerequisites: [{ questionId: 3, answers: ['yes'] }, { questionId: 4, answers: ['no', 'probably_not'] }],
    next: { default: 63 },
    weight: 0.5,
  },
  {
    id: 63, // ¿Es joven (menos de 30)?
    prerequisites: [{ questionId: 3, answers: ['yes'] }, { questionId: 4, answers: ['no', 'probably_not'] }],
    next: { default: null },
    weight: 0.8,
  },

  // ---- Real-people appearance/trait questions ----
  { id: 196, prerequisites: [{ questionId: 3, answers: ['yes'] }, { questionId: 4, answers: ['no', 'probably_not'] }], next: { default: null }, weight: 0.5 }, // pelo rubio
  { id: 197, prerequisites: [{ questionId: 3, answers: ['yes'] }, { questionId: 4, answers: ['no', 'probably_not'] }], next: { default: null }, weight: 0.5 }, // tatuajes
  { id: 198, prerequisites: [{ questionId: 3, answers: ['yes'] }, { questionId: 4, answers: ['no', 'probably_not'] }], next: { default: null }, weight: 1.5 }, // mejor de la historia
  { id: 199, prerequisites: [{ questionId: 3, answers: ['yes'] }, { questionId: 4, answers: ['no', 'probably_not'] }], next: { default: null }, weight: 1.0 }, // influyente redes
  { id: 236, prerequisites: [{ questionId: 3, answers: ['yes'] }, { questionId: 4, answers: ['no', 'probably_not'] }], next: { default: null }, weight: 0.5 }, // casado/pareja

  // ---- Additional nationalities (real people) ----
  { id: 181, prerequisites: [{ questionId: 3, answers: ['yes'] }, { questionId: 4, answers: ['no', 'probably_not'] }], next: { default: null }, weight: 2.5 }, // México
  { id: 182, prerequisites: [{ questionId: 3, answers: ['yes'] }, { questionId: 4, answers: ['no', 'probably_not'] }], next: { default: null }, weight: 2.5 }, // Colombia
  { id: 183, prerequisites: [{ questionId: 3, answers: ['yes'] }, { questionId: 4, answers: ['no', 'probably_not'] }], next: { default: null }, weight: 2.5 }, // España
  { id: 184, prerequisites: [{ questionId: 3, answers: ['yes'] }, { questionId: 4, answers: ['no', 'probably_not'] }], next: { default: null }, weight: 2.5 }, // Reino Unido
  { id: 185, prerequisites: [{ questionId: 3, answers: ['yes'] }, { questionId: 4, answers: ['no', 'probably_not'] }], next: { default: null }, weight: 2.5 }, // Italia
  { id: 186, prerequisites: [{ questionId: 3, answers: ['yes'] }, { questionId: 4, answers: ['no', 'probably_not'] }], next: { default: null }, weight: 2.5 }, // Francia

  // ---- Real-people professions/roles (not covered by main profession tree) ----
  { id: 191, prerequisites: [{ questionId: 3, answers: ['yes'] }, { questionId: 4, answers: ['no', 'probably_not'] }], next: { default: null }, weight: 2.0 }, // comediante
  { id: 192, prerequisites: [{ questionId: 3, answers: ['yes'] }, { questionId: 4, answers: ['no', 'probably_not'] }], next: { default: null }, weight: 2.0 }, // modelo
  { id: 193, prerequisites: [{ questionId: 3, answers: ['yes'] }, { questionId: 4, answers: ['no', 'probably_not'] }], next: { default: null }, weight: 2.0 }, // empresario
  { id: 194, prerequisites: [{ questionId: 3, answers: ['yes'] }, { questionId: 4, answers: ['no', 'probably_not'] }], next: { default: null }, weight: 2.0 }, // realeza
  { id: 195, prerequisites: [{ questionId: 3, answers: ['yes'] }, { questionId: 4, answers: ['no', 'probably_not'] }], next: { default: null }, weight: 2.0 }, // Nobel
  { id: 200, prerequisites: [{ questionId: 3, answers: ['yes'] }, { questionId: 4, answers: ['no', 'probably_not'] }], next: { default: null }, weight: 1.5 }, // líder espiritual

  // ---- Football-specific (require futbolista confirmed) ----
  { id: 201, prerequisites: [{ questionId: 3, answers: ['yes'] }, { questionId: 4, answers: ['no', 'probably_not'] }, { questionId: 76, answers: ['yes'] }], next: { default: null }, weight: 2.5 }, // Champions League
  { id: 202, prerequisites: [{ questionId: 3, answers: ['yes'] }, { questionId: 4, answers: ['no', 'probably_not'] }, { questionId: 76, answers: ['yes'] }], next: { default: null }, weight: 2.0 }, // Serie A italiana
  { id: 203, prerequisites: [{ questionId: 3, answers: ['yes'] }, { questionId: 4, answers: ['no', 'probably_not'] }, { questionId: 76, answers: ['yes'] }], next: { default: null }, weight: 3.0 }, // Balón de Oro
]
