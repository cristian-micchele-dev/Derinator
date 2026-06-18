import { beforeAll, afterAll } from 'vitest'
import { getDb } from './db'
import * as fs from 'fs'
import * as path from 'path'

const TEST_DB_PATH = './derinator-test.db'

// Set test DB path before any imports that use getDb
process.env.DATABASE_PATH = TEST_DB_PATH

beforeAll(async () => {
  const db = await getDb()
  // Clean all tables
  await db.run('DELETE FROM game_history')
  await db.run('DELETE FROM player_stats')
  await db.run('DELETE FROM learned_characters')
})

afterAll(async () => {
  const db = await getDb()
  await db.close()
  // Remove test DB file
  const dbFile = path.resolve(TEST_DB_PATH)
  if (fs.existsSync(dbFile)) {
    fs.unlinkSync(dbFile)
  }
  // Also remove WAL and SHM files
  if (fs.existsSync(dbFile + '-wal')) fs.unlinkSync(dbFile + '-wal')
  if (fs.existsSync(dbFile + '-shm')) fs.unlinkSync(dbFile + '-shm')
})
