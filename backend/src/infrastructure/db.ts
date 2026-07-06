import { Pool } from 'pg'
import { readFile } from 'fs/promises'
import { join } from 'path'

let pool: Pool | null = null

export function getDb(): Pool {
  if (pool) return pool
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Explicit pool config — tune via env vars for horizontal scaling.
    // Default: 10 connections (pg default). Lower on Render free tier (max 25 total).
    max: process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX, 10) : 10,
    // Release idle connections after 30s to avoid hitting Render's 25-connection cap.
    idleTimeoutMillis: process.env.DB_IDLE_TIMEOUT ? parseInt(process.env.DB_IDLE_TIMEOUT, 10) : 30_000,
    // Fail fast if the DB is unreachable — don't let requests queue forever.
    connectionTimeoutMillis: process.env.DB_CONNECTION_TIMEOUT ? parseInt(process.env.DB_CONNECTION_TIMEOUT, 10) : 5_000,
  })
  return pool
}

/** For tests only — inject a pg-mem pool before any call to getDb() */
export function _setPoolForTests(p: Pool): void {
  pool = p
}

export async function initDb(): Promise<void> {
  const db = getDb()
  const schemaPath = join(__dirname, '../schema.sql')
  const schema = await readFile(schemaPath, 'utf-8')

  // Run each statement individually for clear error reporting
  const statements = schema.split(';').map(s => s.trim()).filter(Boolean)
  for (const sql of statements) {
    await db.query(sql)
  }

  // Migrations: PostgreSQL supports ADD COLUMN IF NOT EXISTS natively
  await db.query(
    'ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS player_token TEXT UNIQUE'
  )
  await db.query(
    'ALTER TABLE learned_characters ADD COLUMN IF NOT EXISTS confirmer_question TEXT'
  )

  // Drop redundant explicit indexes on UNIQUE columns (UNIQUE already creates an implicit B-tree index)
  await db.query('DROP INDEX IF EXISTS idx_player_stats_fingerprint')
  await db.query('DROP INDEX IF EXISTS idx_player_stats_token')
  await db.query('DROP INDEX IF EXISTS idx_learned_characters_name')

  // Migrate daily_guessed from INTEGER to BOOLEAN (idempotent: only runs if still INTEGER)
  await db.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'player_stats'
          AND column_name = 'daily_guessed'
          AND data_type = 'integer'
      ) THEN
        ALTER TABLE player_stats ALTER COLUMN daily_guessed DROP DEFAULT;
        ALTER TABLE player_stats ALTER COLUMN daily_guessed TYPE BOOLEAN USING daily_guessed::boolean;
        ALTER TABLE player_stats ALTER COLUMN daily_guessed SET DEFAULT FALSE;
      END IF;
    END $$
  `)

  // Add CHECK constraint on game_history.result (idempotent)
  await db.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'game_history' AND constraint_name = 'chk_result'
      ) THEN
        ALTER TABLE game_history ADD CONSTRAINT chk_result
          CHECK (result IN ('derinator_win', 'user_win'));
      END IF;
    END $$
  `)

  // Add case-insensitive unique index on learned_characters.name (idempotent)
  await db.query(
    'CREATE UNIQUE INDEX IF NOT EXISTS idx_learned_characters_lower_name ON learned_characters(lower(name))'
  )
}

export default { getDb, initDb }
