# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Derinator — an Akinator-style guessing game. The player thinks of a character (animal, fictional, or famous person); the AI asks yes/no questions and guesses it. If it fails, the player can teach it new characters. Built as a TypeScript monorepo.

## Project structure

```
/               — npm workspaces root (frontend + backend)
frontend/       — React 18 SPA (Vite, TypeScript, React Router 6)
backend/        — Express 4 REST API (TypeScript, PostgreSQL)
openspec/       — SDD spec artifacts
scripts/        — Data enrichment scripts (Node ESM)
```

## Commands

From the root (runs both workspaces):
```bash
npm run dev           # concurrently: frontend (port 3001) + backend (port 4000)
npm run build         # tsc + vite build (both)
npm run test          # vitest run (both)
npm run lint          # eslint (both)
npm run format        # prettier on all files
```

From `frontend/`:
```bash
npm run dev           # Vite dev server (port 3001)
npm run build         # tsc && vite build
npm test              # vitest run (jsdom, coverage thresholds: 80/70/80/80)
npm run test:e2e      # Playwright (requires dev server running on port 3001)
npx vitest run --testNamePattern "useGame"   # single test filter
```

From `backend/`:
```bash
npm run dev           # ts-node-dev --respawn --transpile-only src/index.ts
npm run build         # tsc (emits to dist/)
npm test              # vitest run
npx vitest run --testNamePattern "Stats API"  # single test filter
```

Data enrichment (run from root):
```bash
node scripts/enrich-attributes.mjs   # add discriminating attributes to personajes.json
node scripts/enrich-franchises.mjs   # add franchise data to personajes.json
```

## Architecture

### Frontend — `frontend/src/`

**Routing** (`App.tsx`): three lazy-loaded routes — `/` (Home), `/jugar` (GamePage), `/del-dia` (DailyCharacter).

**Game engine** (`src/data/game/`):
- `logics.ts` — Shannon entropy scoring, implication forward-chaining (5 passes), contradiction exclusions, confidence metrics.
- `scoring.ts` — weighted similarity scoring per character.
- `questionSelection.ts` — question picker based on candidate pool size and phase.
- `questionFlow.ts` — hierarchical `FlowNode` decision tree (imports `flows/animals.ts`, `flows/real-people.ts`, `flows/fictional.ts`).
- `rules/implications.ts`, `rules/contradictions.ts` — 100+ implications, 300+ contradiction rules.
- `validation.ts` — character answer validation.
- `gameConstants.ts` — `GameCategory`, `EXCLUDED_BY_CATEGORY`, `CATEGORY_SEED_ANSWERS`, `filterByCategory`.

**Game infrastructure** (`src/components/game/`):
- `useGame.ts` — game state machine hook (wraps `logics.ts`).
- `useGameEffects.ts` — side-effects hook: confetti, stats recording, daily character tracking, server sync.

**Characters** (`src/data/characters/`): split into three JSON files — `animales.json`, `famosos.json`, `personajes.json`. Loaded via `index.ts` with a module-level cache (`builtInCache`) so JSON parsing only runs once.

**LearnMode** (`src/components/game/`): teach new character flow, split across:
- `LearnMode.tsx` + `useLearnMode.ts` — component and state hook.
- `learnModeConfig.ts` — subcategory seeds, question lists per subcategory (`LEARN_QUESTIONS`), exclusive groups (`EXCLUSIVE_GROUPS`), min question threshold.
- `learnModeLogic.ts` — question sequencing logic.
- `learnModeValidation.ts` — input validation.

**Component pattern** — container/presentational:
- `components/game/Game.tsx` — renders game UI, delegates all logic to `useGame`.
- `components/layout/NetworkIndicator.tsx` + `useOnlineStatus.ts` — online/offline detection and indicator.

**State machine** (`types.ts`): `GameState = 'start' | 'playing' | 'guess' | 'win' | 'lose' | 'learn_name' | 'learn_questions'`

**API client** (`src/data/api/`): thin fetch wrappers. API contract uses **snake_case** (`derinator_wins`, `daily_guessed`) — do not camelCase.

**Offline-first**: the full game works without the backend. Backend only persists stats/hall of fame across devices.

### Backend — `backend/src/`

**Hexagonal architecture**:
- `domain/` — entities + ports (interfaces). No framework dependencies. Domain never imports from infrastructure.
- `infrastructure/repositories/` — PostgreSQL implementations of domain ports.
- `infrastructure/stores/rateLimitStore.ts` — creates the rate limit store. Returns a `RedisStore` (ioredis) when `REDIS_URL` is set; otherwise falls back to MemoryStore.
- `routes/` — Express routers (`stats.ts`, `characters.ts`).
- `middleware/rateLimit.ts` — three limiters: `rateLimitLearn` (10/min), `rateLimitStats` (30/min), `rateLimitPublic` (60/min). Store is injected from `infrastructure/stores/`.
- `application/characterValidation.ts` — strips HTML, caps lengths. Valid categories: `animal | personaje`.

**DB** (`src/infrastructure/db.ts`): PostgreSQL via `pg` (Pool). Schema in `src/schema.sql`, loaded at startup. Requires `DATABASE_URL` env var. Pool size and timeouts are configurable via `DB_POOL_MAX`, `DB_IDLE_TIMEOUT`, `DB_CONNECTION_TIMEOUT` env vars.
- Tests use `pg-mem` (in-memory PostgreSQL mock) — set up in `src/test-setup.ts`. Production DB is **never** touched by tests.

**API routes**:
| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/api/health` | Health check |
| `PUT` | `/api/v1/stats/:fingerprint` | Upserts player stats; 201 for new player, 200 for update |
| `GET` | `/api/v1/stats/:fingerprint` | Returns default zeros if not found (never 404) |
| `POST` | `/api/v1/stats/game` | Records game history; player must exist |
| `GET` | `/api/v1/characters` | Optional `?fingerprint=` filter |
| `POST` | `/api/v1/characters` | Rate-limited; validates input |

## Testing

**Frontend unit tests**: Vitest + jsdom + Testing Library. Tests live alongside source files (`*.test.tsx`).

**Backend integration tests**: `src/routes/api.test.ts` — supertest against a real Express app + pg-mem. Repository-level unit tests live alongside each repository file.

**E2E**: Playwright in `frontend/e2e/`. Requires dev server on port 3001. Config in `frontend/playwright.config.ts`.

## Key gotchas

- `daily_guessed` is `BOOLEAN` in PostgreSQL. Sync endpoint converts with `? true : false`.
- `achievements` and `hall_of_fame` are stored as JSON strings (`TEXT`) — manual `JSON.stringify()`/`JSON.parse()`.
- No `.eslintrc` in `backend/` — lint runs with defaults only.
- Rate limiter store lives in `infrastructure/stores/rateLimitStore.ts`. Set `REDIS_URL` to activate a Redis-backed store (ioredis + rate-limit-redis). Without it, falls back to MemoryStore (resets on restart, single-process only).
- `GET /api/v1/characters` (no fingerprint) sets `Cache-Control: public, max-age=30` — CDN-cacheable. With fingerprint: `private, no-store`. Stats endpoints always `private, no-store`.
- Bearer tokens are validated for max length (500 chars) before hitting the DB.
- Data enrichment scripts use `setIfAbsent` semantics — they never overwrite existing answers in the JSON files.
- `learnModeConfig.ts` `EXCLUSIVE_GROUPS` must stay consistent with `rules/contradictions.ts` — if you add a new exclusive pair in one, add it to the other.

## Deploy

- **Frontend**: Vercel (auto-deploy from main)
- **Backend**: Render (config in `render.yaml`; requires PostgreSQL database via `DATABASE_URL`)
