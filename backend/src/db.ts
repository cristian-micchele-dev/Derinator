import { Pool } from 'pg'
import { readFile } from 'fs/promises'
import { join } from 'path'

let pool: Pool | null = null

export function getDb(): Pool {
  if (pool) return pool
  pool = new Pool({ connectionString: process.env.DATABASE_URL })
  return pool
}

/** For tests only — inject a pg-mem pool before any call to getDb() */
export function _setPoolForTests(p: Pool): void {
  pool = p
}

export async function initDb(): Promise<void> {
  const db = getDb()
  const schemaPath = join(__dirname, 'schema.sql')
  const schema = await readFile(schemaPath, 'utf-8')

  // Run each statement individually for clear error reporting
  const statements = schema.split(';').map(s => s.trim()).filter(Boolean)
  for (const sql of statements) {
    await db.query(sql)
  }

  // Migration: PostgreSQL supports ADD COLUMN IF NOT EXISTS natively
  await db.query(
    'ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS player_token TEXT UNIQUE'
  )
}

export default { getDb, initDb }
