# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Derinator — an Akinator-style guessing game. The player thinks of a character (animal, fictional, or famous person); the AI asks yes/no questions and guesses it. If it fails, the player can teach it new characters. Built as a TypeScript monorepo.

## Project structure

```
/               — npm workspaces root (frontend + backend)
frontend/       — React 18 SPA (Vite, TypeScript, React Router 6)
backend/        — Express 4 REST API (TypeScript, SQLite)
openspec/       — SDD spec artifacts
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

## Architecture

### Frontend — `frontend/src/`

**Routing** (`App.tsx`): three lazy-loaded routes — `/` (Home), `/jugar` (GamePage), `/del-dia` (DailyCharacter).

**Game engine** lives entirely in `src/data/game/`:
- `questionFlow.ts` — hub: imports `flows/animals.ts`, `flows/real-people.ts`, `flows/fictional.ts`. Defines a hierarchical `FlowNode` decision tree.
- `logics.ts` — Shannon entropy scoring, implication forward-chaining (5 passes), contradiction exclusions, 7-phase adaptive question selection, confidence thresholds.
- `scoring.ts` — weighted similarity scoring per character.
- `questionSelection.ts` — question picker based on candidate pool size and phase.
- `rules/implications.ts`, `rules/contradictions.ts` — 100+ implications, 300+ contradiction rules.
- `validation.ts` — character answer validation.

**Characters** (`src/data/characters/`): split into three JSON files — `animales.json`, `famosos.json`, `personajes.json`. Loaded via `index.ts`.

**Component pattern** — container/presentational:
- `components/game/Game.tsx` + `useGame.ts` (game state machine)
- `components/game/LearnMode.tsx` + `useLearnMode.ts` (teach new character flow)

**State machine** (`types.ts`): `GameState = 'start' | 'playing' | 'guess' | 'win' | 'lose' | 'learn_name' | 'learn_questions'`

**API client** (`src/data/api/`): thin fetch wrappers. API contract uses **snake_case** (`derinator_wins`, `daily_guessed`) — do not camelCase.

**Offline-first**: the full game works without the backend. Backend only persists stats/hall of fame across devices.

### Backend — `backend/src/`

**Hexagonal architecture**:
- `domain/` — entities + ports (interfaces). No framework dependencies. Domain never imports from infrastructure.
- `infrastructure/repositories/` — PostgreSQL implementations of domain ports.
- `routes/` — Express routers (`stats.ts`, `characters.ts`).
- `middleware/rateLimit.ts` — in-memory IP rate limiter (10 req/min), only on `POST /api/characters/learn`.
- `validation/characterValidation.ts` — strips HTML, caps lengths. Valid categories: `animal | personaje`.

**DB** (`src/db.ts`): PostgreSQL via `pg` (Pool). Schema in `src/schema.sql`, loaded at startup. Requires `DATABASE_URL` env var.
- Tests use `pg-mem` (in-memory PostgreSQL mock) — set up in `src/test-setup.ts`. Production DB is **never** touched by tests.

**API routes**:
| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/stats/sync` | Upserts player stats (MAX-merge strategy) |
| `GET` | `/api/stats/:fingerprint` | Returns default zeros if not found (never 404) |
| `POST` | `/api/stats/game` | Records game history; player must exist |
| `GET` | `/api/characters/learned` | Optional `?fingerprint=` filter |
| `POST` | `/api/characters/learn` | Rate-limited; validates input |

## Testing

**Frontend unit tests**: Vitest + jsdom + Testing Library. Tests live alongside source files (`*.test.tsx`).

**Backend integration tests**: `src/routes/api.test.ts` — supertest against a real Express app + pg-mem. No unit tests yet.

**E2E**: Playwright in `frontend/e2e/`. Requires dev server on port 3001. Config in `frontend/playwright.config.ts`.

## Key gotchas

- `daily_guessed` is `BOOLEAN` in PostgreSQL. Sync endpoint converts with `? true : false`.
- `achievements` and `hall_of_fame` are stored as JSON strings (`TEXT`) — manual `JSON.stringify()`/`JSON.parse()`.
- No `.eslintrc` in `backend/` — lint runs with defaults only.
- Rate limiter is in-memory — resets on server restart, doesn't scale across processes.

## Deploy

- **Frontend**: Vercel (auto-deploy from main)
- **Backend**: Render (config in `render.yaml`; requires PostgreSQL database via `DATABASE_URL`)
