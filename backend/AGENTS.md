# AGENTS.md — backend

Express + SQLite API for the Derinator game. TypeScript, no framework (plain Express routers).

## Commands

```bash
npm run dev      # ts-node-dev --respawn --transpile-only src/index.ts
npm run build    # tsc (emits to dist/)
npm run start    # node dist/index.js (production)
npm test         # vitest run
npm run lint     # eslint . --ext ts (no config file — uses defaults only)
```

There is no `npm run lint:fix`, no formatter, and no typecheck-only command. `npm run build` is the closest thing to a typecheck.

## Architecture

- **Entry**: `src/index.ts` — Express app on `PORT` (default 4000)
- **DB**: `src/db.ts` — SQLite via `sqlite`/`sqlite3` drivers. Schema auto-initialized on first connection (embedded in `db.ts`, not `schema.sql`). WAL mode + foreign keys enabled at runtime.
- **DB file**: `./derinator.db` (overridable via `DATABASE_PATH` env var). Tests use `derinator-test.db` via `src/test-setup.ts` (sets `DATABASE_PATH` env var). Production DB is never touched by tests.

### Routes

| Path | File | Notes |
|------|------|-------|
| `POST /api/stats/sync` | `routes/stats.ts` | Upserts player stats with MAX-merge strategy |
| `GET /api/stats/:fingerprint` | `routes/stats.ts` | Returns default zeros if player not found (never 404) |
| `POST /api/stats/game` | `routes/stats.ts` | Records game history; requires existing player |
| `GET /api/characters/learned` | `routes/characters.ts` | Optional `?fingerprint=` filter |
| `POST /api/characters/learn` | `routes/characters.ts` | Rate-limited (10/min per IP). Validates via `characterValidation.ts` |

### Middleware / Validation

- `src/middleware/rateLimit.ts` — in-memory IP-based rate limiter (10 req/min). Only applied to `POST /api/characters/learn`.
- `src/validation/characterValidation.ts` — input sanitization (strips HTML, caps lengths). Categories: `animal | personaje`. Subcategories: anime-shonen, anime-seinen, anime-magical-girl, videojuego, superheroe, youtuber-streamer, historico-real, deportista, otro. Answers use question IDs 1-138 with values: `yes | no | probably | probably_not | dont_know`.

## Testing

- **Runner**: Vitest (`vitest run`)
- **Config**: `vitest.config.ts` — `globals: true`, `environment: 'node'`
- **Tests**: `src/routes/api.test.ts` — integration tests using `supertest` against a real Express app + isolated SQLite DB
- **Test setup**: `src/test-setup.ts` — sets `DATABASE_PATH=derinator-test.db`, cleans tables before each test, removes test DB file after run
- **No unit tests** exist yet, only the integration suite
- Tests use an isolated DB file (`derinator-test.db`) — production DB is never touched

### Running a single test

```bash
npx vitest run --testNamePattern "Stats API"
```

## Key gotchas

- **`daily_guessed`** is `INTEGER` (0/1) in SQLite, not `BOOLEAN` — the sync endpoint converts with `dailyGuessed ? 1 : 0`. The GET endpoint returns it as `0`/`1`, not a boolean.
- **`achievements` and `hall_of_fame`** are stored as JSON strings in SQLite (`TEXT`), not `JSONB`. `JSON.stringify()`/`JSON.parse()` is manual.
- No `.eslintrc` or `eslint.config.*` file exists. The `npm run lint` script runs with default settings only.
- CORS is wide-open (`app.use(cors())`) — no origin restriction.
- The rate limiter uses an in-memory `Map` — resets on server restart and doesn't scale across processes.