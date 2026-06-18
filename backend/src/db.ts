import sqlite3 from 'sqlite3'
import { open, Database } from 'sqlite'

const DB_PATH = process.env.DATABASE_PATH || './derinator.db'

let db: Database<sqlite3.Database, sqlite3.Statement> | null = null

export async function getDb(): Promise<Database<sqlite3.Database, sqlite3.Statement>> {
  if (db) return db

  db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database,
  })

  // Enable foreign keys and WAL mode for better concurrency
  await db.exec('PRAGMA foreign_keys = ON')
  await db.exec('PRAGMA journal_mode = WAL')

  // Initialize schema
  await initSchema(db)

  return db
}

async function initSchema(database: Database<sqlite3.Database, sqlite3.Statement>): Promise<void> {
  await database.exec(`
    CREATE TABLE IF NOT EXISTS player_stats (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      fingerprint TEXT UNIQUE NOT NULL,
      derinator_wins INTEGER NOT NULL DEFAULT 0,
      user_wins INTEGER NOT NULL DEFAULT 0,
      current_streak INTEGER NOT NULL DEFAULT 0,
      best_streak INTEGER NOT NULL DEFAULT 0,
      total_games INTEGER NOT NULL DEFAULT 0,
      achievements TEXT NOT NULL DEFAULT '[]',
      hall_of_fame TEXT NOT NULL DEFAULT '[]',
      daily_guessed INTEGER NOT NULL DEFAULT 0,
      daily_guesses INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_player_stats_fingerprint ON player_stats(fingerprint);

    CREATE TABLE IF NOT EXISTS game_history (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      player_id TEXT REFERENCES player_stats(id) ON DELETE CASCADE,
      character_name TEXT NOT NULL,
      result TEXT NOT NULL,
      questions_count INTEGER NOT NULL DEFAULT 0,
      category TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_game_history_player ON game_history(player_id);
    CREATE INDEX IF NOT EXISTS idx_game_history_created ON game_history(created_at);

    CREATE TABLE IF NOT EXISTS learned_characters (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      category TEXT NOT NULL DEFAULT 'personaje',
      subcategory TEXT,
      answers TEXT NOT NULL DEFAULT '{}',
      fingerprint TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_learned_characters_name ON learned_characters(name);
    CREATE INDEX IF NOT EXISTS idx_learned_characters_fingerprint ON learned_characters(fingerprint);
  `)
}

export default { getDb }
