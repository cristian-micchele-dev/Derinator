# Derinator

Un juego estilo Akinator donde la IA adivina en qué personaje estás pensando. Pensá en un personaje, animal o figura real/ficticia — el Derinator hace preguntas de sí/no y lo adivina. Si falla, podés enseñarle personajes nuevos.

## Stack

- **Frontend**: React 18 + TypeScript + Vite + React Router 6
- **Backend**: Express 4 + TypeScript + PostgreSQL (`pg`)
- **Tests**: Vitest + Testing Library + Playwright (E2E)

## Setup

### Requisitos

- Node.js 20+
- PostgreSQL (local o remoto vía `DATABASE_URL` — Render/Neon funcionan)

### Instalación

```bash
git clone <repo-url>
cd "Derinator y christianNator"
npm install
```

Creá un archivo `backend/.env` con:

```env
DATABASE_URL=postgresql://usuario:password@host:5432/derinator
PORT=4000
```

El esquema de la base de datos se aplica automáticamente al iniciar el backend (`src/schema.sql`).

### Desarrollo

```bash
npm run dev   # levanta frontend (puerto 3001) + backend (puerto 4000) en paralelo
```

## Comandos

### Desde la raíz

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Frontend + backend en paralelo |
| `npm run build` | Build de ambos workspaces |
| `npm run test` | Tests de ambos workspaces |
| `npm run lint` | ESLint en ambos workspaces |
| `npm run format` | Prettier en todos los archivos |

### Desde `frontend/`

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Vite dev server (puerto 3001) |
| `npm run build` | Build de producción |
| `npm test` | Vitest (cobertura mínima: 80/70/80/80) |
| `npm run test:e2e` | Playwright (requiere dev server corriendo) |

### Desde `backend/`

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | ts-node-dev con watch |
| `npm run build` | Compila a `dist/` |
| `npm test` | Vitest con pg-mem (sin tocar la DB real) |
| `npm start` | Corre el build compilado |

## Arquitectura

### Frontend (`frontend/src/`)

El juego corre completamente en el cliente — el backend es opcional y solo persiste estadísticas entre dispositivos.

**Motor de juego** en `src/data/game/`:
- `questionFlow.ts` — árbol de decisión jerárquico (`FlowNode`) con flujos por categoría (animales, personas reales, personajes ficticios)
- `logics.ts` — selección de preguntas en 7 fases: entropía Shannon, forward-chaining de implicaciones (5 pasadas), exclusión por contradicciones, umbrales de confianza
- `scoring.ts` — scoring ponderado por similitud de respuestas
- `rules/` — 100+ implicaciones y 300+ reglas de contradicción

**Personajes** en `src/data/characters/`: tres JSON (`animales.json`, `famosos.json`, `personajes.json`).

**Patrón container/presentational**: `Game.tsx` + `useGame.ts` (máquina de estados), `LearnMode.tsx` + `useLearnMode.ts` (enseñar personajes nuevos).

**Estados del juego**: `start | playing | guess | win | lose | learn_name | learn_questions`

### Backend (`backend/src/`)

Arquitectura hexagonal estricta:
- `domain/` — entidades y puertos (interfaces). Sin dependencias de framework.
- `infrastructure/repositories/` — implementaciones PostgreSQL de los puertos.
- `routes/` — routers Express (`stats.ts`, `characters.ts`).
- `middleware/rateLimit.ts` — limitador en memoria: 10 req/min sobre `POST /api/characters/learn`.

**API contract** (snake_case — no camelizar):

| Método | Ruta | Notas |
|--------|------|-------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/stats/sync` | Upsert de stats (estrategia MAX-merge) |
| `GET` | `/api/stats/:fingerprint` | Devuelve ceros por defecto, nunca 404 |
| `POST` | `/api/stats/game` | Registra partida; el jugador debe existir |
| `GET` | `/api/characters/learned` | Filtro opcional `?fingerprint=` |
| `POST` | `/api/characters/learn` | Rate-limited; valida y sanitiza input |

## Tests

```bash
# Todos los tests
npm run test

# Solo frontend (con cobertura)
cd frontend && npm test

# Solo backend (usa pg-mem, no toca la DB real)
cd backend && npm test

# E2E (requiere dev server en puerto 3001)
cd frontend && npm run test:e2e

# Filtro por nombre
npx vitest run --testNamePattern "useGame"
```

Cobertura mínima del frontend: 80% statements / 70% branches / 80% functions / 80% lines.

## Deploy

- **Frontend**: Vercel — auto-deploy desde `main`. Variable de entorno: `VITE_API_URL`.
- **Backend**: Render — config en `render.yaml`; requiere variable de entorno `DATABASE_URL` con una PostgreSQL (Render Postgres o Neon).
