import { FlowNode } from '../questionFlow'

export const ANIMAL_FLOWS: FlowNode[] = [
  // ===== ANIMAL TREE =====
  {
    id: 5, // ¿Es doméstico?
    prerequisites: [{ questionId: 2, answers: ['yes'] }],
    next: { default: 6 },
  },
  {
    id: 6, // ¿Vuela?
    prerequisites: [{ questionId: 2, answers: ['yes'] }],
    next: {
      yes: 9,   // Tiene plumas
      no: 7,
    },
  },
  {
    id: 7, // ¿Es acuático?
    prerequisites: [{ questionId: 2, answers: ['yes'] }, { questionId: 6, answers: ['no'] }],
    next: { default: 8 },
  },
  {
    id: 8, // ¿Tiene pelos?
    prerequisites: [{ questionId: 2, answers: ['yes'] }],
    next: {
      yes: 27, // Es mamífero
      no: 9,
    },
  },
  {
    id: 9, // ¿Tiene plumas?
    prerequisites: [{ questionId: 2, answers: ['yes'] }],
    next: {
      yes: 26, // Es un ave
      no: 10,
    },
  },
  {
    id: 10, // ¿Es peligroso?
    prerequisites: [{ questionId: 2, answers: ['yes'] }],
    next: { default: 11 },
  },
  {
    id: 11, // ¿Es muy grande?
    prerequisites: [{ questionId: 2, answers: ['yes'] }],
    next: {
      yes: null,
      no: 12, // Es pequeño
      default: 12,
    },
  },
  {
    id: 12, // ¿Es pequeño?
    prerequisites: [{ questionId: 2, answers: ['yes'] }],
    next: { default: 13 },
  },
  {
    id: 13, // ¿Es un insecto?
    prerequisites: [{ questionId: 2, answers: ['yes'] }],
    next: {
      yes: null,
      no: 14,
    },
  },
  {
    id: 14, // ¿Es reptil?
    prerequisites: [{ questionId: 2, answers: ['yes'] }],
    next: { default: 25 },
  },
  {
    id: 25, // ¿Tiene alas?
    prerequisites: [{ questionId: 2, answers: ['yes'] }],
    next: { default: 26 },
  },
  {
    id: 26, // ¿Es un ave?
    prerequisites: [{ questionId: 2, answers: ['yes'] }],
    next: { default: 27 },
  },
  {
    id: 27, // ¿Es un mamífero?
    prerequisites: [{ questionId: 2, answers: ['yes'] }],
    next: { default: 28 },
  },
  {
    id: 28, // ¿Es un depredador?
    prerequisites: [{ questionId: 2, answers: ['yes'] }],
    next: { default: 29 },
  },
  {
    id: 29, // ¿Vive en la selva?
    prerequisites: [{ questionId: 2, answers: ['yes'] }],
    next: { default: 30 },
  },
  {
    id: 30, // ¿Vive en el océano?
    prerequisites: [{ questionId: 2, answers: ['yes'] }],
    next: { default: 31 },
  },
  {
    id: 31, // ¿Es herbívoro?
    prerequisites: [{ questionId: 2, answers: ['yes'] }],
    next: { default: 32 },
  },
  {
    id: 32, // ¿Es nocturno?
    prerequisites: [{ questionId: 2, answers: ['yes'] }],
    next: { default: 33 },
  },
  {
    id: 33, // ¿Es rápido?
    prerequisites: [{ questionId: 2, answers: ['yes'] }],
    next: {
      yes: null,
      no: 34,
    },
  },
  {
    id: 34, // ¿Es lento?
    prerequisites: [{ questionId: 2, answers: ['yes'] }],
    next: { default: 35 },
  },
  {
    id: 35, // ¿Tiene cola?
    prerequisites: [{ questionId: 2, answers: ['yes'] }],
    next: { default: 36 },
  },
  {
    id: 36, // ¿Tiene manchas?
    prerequisites: [{ questionId: 2, answers: ['yes'] }],
    next: {
      yes: null,
      no: 37,
    },
  },
  {
    id: 37, // ¿Es rayado?
    prerequisites: [{ questionId: 2, answers: ['yes'] }],
    next: { default: 38 },
  },
  {
    id: 38, // ¿Es gris?
    prerequisites: [{ questionId: 2, answers: ['yes'] }],
    next: { default: 39 },
  },
  {
    id: 39, // ¿Es blanco?
    prerequisites: [{ questionId: 2, answers: ['yes'] }],
    next: { default: 40 },
  },
  {
    id: 40, // ¿Es negro?
    prerequisites: [{ questionId: 2, answers: ['yes'] }],
    next: { default: 41 },
  },
  {
    id: 41, // ¿Es naranja?
    prerequisites: [{ questionId: 2, answers: ['yes'] }],
    next: { default: 42 },
  },
  {
    id: 42, // ¿Es amarillo?
    prerequisites: [{ questionId: 2, answers: ['yes'] }],
    next: { default: null },
  },
  {
    id: 67, // ¿Es venenoso?
    prerequisites: [{ questionId: 2, answers: ['yes'] }],
    next: { default: 68 },
  },
  {
    id: 68, // ¿Tiene cuernos?
    prerequisites: [{ questionId: 2, answers: ['yes'] }],
    next: { default: 69 },
  },
  {
    id: 69, // ¿Vive en grupos?
    prerequisites: [{ questionId: 2, answers: ['yes'] }],
    next: { default: 70 },
  },
  {
    id: 70, // ¿Es de granja?
    prerequisites: [{ questionId: 2, answers: ['yes'] }],
    next: { default: 204 },
  },
  {
    id: 204, // ¿Tiene escamas?
    prerequisites: [{ questionId: 2, answers: ['yes'] }],
    next: { default: 205 },
  },
  {
    id: 205, // ¿Es un primate?
    prerequisites: [{ questionId: 2, answers: ['yes'] }],
    next: { default: 206 },
  },
  {
    id: 206, // ¿Es un roedor?
    prerequisites: [{ questionId: 2, answers: ['yes'] }],
    next: { default: 207 },
  },
  {
    id: 207, // ¿Es un marsupial?
    prerequisites: [{ questionId: 2, answers: ['yes'] }],
    next: { default: 208 },
  },
  {
    id: 208, // ¿Es un cánido?
    prerequisites: [{ questionId: 2, answers: ['yes'] }],
    next: { default: 209 },
  },
  {
    id: 209, // ¿Es un équido?
    prerequisites: [{ questionId: 2, answers: ['yes'] }],
    next: { default: 210 },
  },
  {
    id: 210, // ¿Tiene caparazón?
    prerequisites: [{ questionId: 2, answers: ['yes'] }],
    next: { default: 211 },
  },
  {
    id: 211, // ¿Tiene cuello largo?
    prerequisites: [{ questionId: 2, answers: ['yes'] }],
    next: { default: 212 },
  },
  {
    id: 212, // ¿Es un mamífero marino?
    prerequisites: [{ questionId: 2, answers: ['yes'] }],
    next: { default: 213 },
  },
  {
    id: 213, // ¿Es de sangre fría?
    prerequisites: [{ questionId: 2, answers: ['yes'] }],
    next: { default: 214 },
  },
  {
    id: 214, // ¿Es un anfibio?
    prerequisites: [{ questionId: 2, answers: ['yes'] }],
    next: { default: 215 },
  },
  {
    id: 215, // ¿Es un invertebrado?
    prerequisites: [{ questionId: 2, answers: ['yes'] }],
    next: { default: 216 },
  },
  {
    id: 216, // ¿Es una araña?
    prerequisites: [{ questionId: 2, answers: ['yes'] }],
    next: { default: 218 },
  },
  {
    id: 218, // ¿Vive en Australia?
    prerequisites: [{ questionId: 2, answers: ['yes'] }],
    next: { default: null },
  },
]
