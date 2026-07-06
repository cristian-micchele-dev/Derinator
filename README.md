# Derinator

Juego de deducción estilo Akinator construido desde cero. Pensás en un personaje — el motor hace preguntas de sí/no, infiere respuestas implícitas, descarta candidatos por contradicción y adivina. Si falla, podés enseñarle personajes nuevos que quedan persistidos para todos.

**[→ Demo en vivo](https://derinator-frontend.vercel.app/jugar)**

---

## Cómo funciona el motor de inferencia

El juego no tiene una lista de preguntas fijas. En cada turno calcula cuál es la **mejor pregunta posible** dado el estado actual del juego.

### Pipeline por respuesta

```
Respuesta del usuario
    ↓
Forward-chaining de implicaciones (5 pasadas)
    → "¿Es de anime?" = yes  →  "¿Es de ficción?" = yes (implícito)
    ↓
Filtrado por contradicciones
    → Si "¿Es un Pokémon?" = yes, excluir "¿Es de Dragon Ball?" de las preguntas restantes
    ↓
Scoring ponderado de candidatos
    → Confirmers (preguntas ultra-específicas): peso 5.0x
    → Universe questions (franquicia): peso 2.5x
    → Role/Power questions: peso 1.8x
    → Category questions: peso 1.5x
    → Appearance: peso 0.6x
    ↓
Selección de siguiente pregunta por entropía / ganancia de información esperada
    ↓
Evaluación de confianza → ¿adivinar ahora o seguir preguntando?
```

### Por qué el scoring usa solo respuestas directas (no las implícitas)

Decisión deliberada: aplicar las implicaciones al scoring haría que `Q4='no'` (personaje no ficticio) derive 25+ respuestas de universos ficticios, que coinciden con *todos* los personajes reales — destruyendo la señal discriminante. Las implicaciones solo se usan para **excluir preguntas ya respondidas**, no para calcular similitud.

### Dos motores coexistiendo

| Motor | Algoritmo | Selección de preguntas |
|-------|-----------|----------------------|
| Legacy (`useGame`) | Entropía de Shannon + 7 fases adaptativas | Scoring por similitud de respuestas |
| Bayesian (`useGameBayesian`) | Teorema de Bayes sobre `ProbabilityProfile` por personaje | Expected Information Gain (EIG) |

Se selecciona con `?engine=bayesian` en la URL. El motor legacy es el default en producción.

---

## Arquitectura

### Frontend — separación estricta de lógica y UI

```
src/
├── data/game/          ← lógica pura (sin React, testeable de forma aislada)
│   ├── logics.ts       ← filterCandidates, applyImplications, getConfidenceMetrics
│   ├── scoring.ts      ← calculateScore con pesos por tipo de pregunta
│   ├── questionFlow.ts ← árbol de decisión jerárquico (FlowNode)
│   ├── questionGroups.ts ← grupos nombrados de preguntas (UNIVERSE_QUESTIONS, etc.)
│   └── rules/
│       ├── implications.ts    ← 100+ reglas de inferencia
│       └── contradictions.ts  ← 300+ reglas de exclusión (generadas programáticamente)
│
└── components/game/    ← React: estado, efectos, UI
    ├── useGame.ts       ← máquina de estados del juego (legacy engine)
    ├── useGameBayesian.ts ← drop-in replacement con motor Bayesiano
    ├── useGameEffects.ts  ← side-effects extraídos: confetti, stats, sync
    └── useLearnMode.ts    ← flujo de enseñanza de personajes nuevos
```

La lógica de juego no importa nada de React. Podría correrse en un worker, en Node, o en cualquier otro frontend.

### Backend — arquitectura hexagonal

```
src/
├── domain/                    ← entidades + puertos (interfaces puras, sin frameworks)
├── infrastructure/
│   └── repositories/          ← implementaciones PostgreSQL de los puertos
├── routes/                    ← Express routers (adapters de entrada)
├── application/               ← servicios de aplicación (LearnCharacterService)
└── middleware/                ← rate limiting, error handling
```

El dominio nunca importa de Express ni de `pg`. Las rutas solo orquestan — no tienen lógica de negocio.

### Diseño offline-first

El juego funciona completamente sin servidor. El backend es una capa opcional de persistencia:
- Las stats se guardan primero en `localStorage`
- Se sincronizan al servidor al finalizar cada partida
- Si el servidor no responde, el juego sigue funcionando

Identidad de jugador por fingerprint (sin login). El token de sesión se genera server-side y se persiste localmente.

---

## Decisiones técnicas

**El pool de candidatos es monotónicamente decreciente.** Una vez que un personaje sale del pool no vuelve a entrar, aunque el scoring posterior lo favorecería. Esto evita oscilaciones en los candidatos y hace la experiencia predecible.

**`EXCLUSIVE_GROUPS` (LearnMode) y `CONTRADICTIONS` (motor de juego) deben estar sincronizados.** Ambos definen los mismos conjuntos de exclusión mutua — uno para auto-rellenar respuestas al enseñar, el otro para filtrar preguntas durante el juego. Hay un test que detecta divergencias automáticamente (`contradictions.test.ts`).

**Los tests del backend nunca tocan la DB real.** Se usa `pg-mem` (PostgreSQL en memoria) con el mismo schema SQL de producción. Cualquier contribuidor puede correr `npm test` sin configurar nada.

**Rate limiting en memoria, no en Redis.** Decisión consciente para un proyecto de portfolio: se reinicia con el servidor y no escala horizontalmente. El tradeoff está documentado — el juego no lo necesita en esta escala.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18, TypeScript, Vite, React Router 6 |
| Backend | Express 4, TypeScript, PostgreSQL (`pg`) |
| Tests | Vitest, Testing Library, Playwright (E2E), pg-mem |
| Deploy | Vercel (frontend) + Render (backend + PostgreSQL) |

---

## API

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/health` | Health check |
| `PUT` | `/api/v1/stats/:fingerprint` | Upsert de stats — 201 para jugador nuevo, 200 para update |
| `GET` | `/api/v1/stats/:fingerprint` | Stats del jugador — devuelve ceros si no existe, nunca 404 |
| `POST` | `/api/v1/stats/game` | Registra resultado de partida (requiere token) |
| `GET` | `/api/v1/characters` | Personajes aprendidos — filtro opcional `?fingerprint=` |
| `POST` | `/api/v1/characters` | Enseñar personaje nuevo — rate-limited, valida y sanitiza |

---

## Setup local

**Requisitos:** Node.js 20+, PostgreSQL

```bash
git clone <repo-url>
cd "Derinator y christianNator"
npm install
```

Creá `backend/.env`:

```env
DATABASE_URL=postgresql://usuario:password@host:5432/derinator
PORT=4000
CORS_ORIGIN=http://localhost:3001
```

El schema se aplica automáticamente al iniciar el backend.

```bash
npm run dev        # frontend :3001 + backend :4000 en paralelo
npm run test       # todos los tests
npm run test:e2e   # Playwright (requiere dev server corriendo)
```
