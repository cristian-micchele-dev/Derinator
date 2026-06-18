import { Database } from 'sqlite'
import sqlite3 from 'sqlite3'
import { GameHistory, GameHistoryRepository } from '../../domain'

type DB = Database<sqlite3.Database, sqlite3.Statement>

interface GameHistoryRow {
  id: string
  player_id: string
  character_name: string
  result: string
  questions_count: number
  category: string
  created_at: string
}

interface PlayerIdRow {
  id: string
}

export class SqliteGameHistoryRepository implements GameHistoryRepository {
  constructor(private db: DB) {}

  async findByFingerprint(fingerprint: string): Promise<GameHistory[]> {
    const rows = await this.db.all<GameHistoryRow[]>(
      `SELECT gh.* FROM game_history gh
       JOIN player_stats ps ON gh.player_id = ps.id
       WHERE ps.fingerprint = ?
       ORDER BY gh.created_at DESC`,
      [fingerprint]
    )
    return rows.map(this.toDomain)
  }

  async create(playerId: string, characterName: string, result: string, questionsCount: number, category: string): Promise<void> {
    await this.db.run(
      `INSERT INTO game_history (player_id, character_name, result, questions_count, category)
       VALUES (?, ?, ?, ?, ?)`,
      [playerId, characterName, result, questionsCount || 0, category || '']
    )
  }

  async findPlayerId(fingerprint: string): Promise<string | null> {
    const row = await this.db.get<PlayerIdRow>(
      'SELECT id FROM player_stats WHERE fingerprint = ?',
      [fingerprint]
    )
    return row?.id || null
  }

  private toDomain(row: GameHistoryRow): GameHistory {
    return {
      id: row.id,
      playerId: row.player_id,
      characterName: row.character_name,
      result: row.result,
      questionsCount: row.questions_count,
      category: row.category,
      createdAt: row.created_at,
    }
  }
}
