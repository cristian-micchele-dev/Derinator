import { Pool } from 'pg'
import { GameHistory, GameHistoryRepository } from '../../domain'

interface GameHistoryRow {
  id: string
  player_id: string
  character_name: string
  result: string
  questions_count: number
  category: string
  created_at: Date
}

export class PgGameHistoryRepository implements GameHistoryRepository {
  constructor(private db: Pool) {}

  async findByFingerprint(fingerprint: string): Promise<GameHistory[]> {
    const result = await this.db.query<GameHistoryRow>(
      `SELECT gh.* FROM game_history gh
       JOIN player_stats ps ON gh.player_id = ps.id
       WHERE ps.fingerprint = $1
       ORDER BY gh.created_at DESC`,
      [fingerprint]
    )
    return result.rows.map(this.toDomain)
  }

  async create(fingerprint: string, characterName: string, result: string, questionsCount: number, category: string): Promise<boolean> {
    const res = await this.db.query<{ id: string }>(
      `INSERT INTO game_history (player_id, character_name, result, questions_count, category)
       SELECT id, $2, $3, $4, $5 FROM player_stats WHERE fingerprint = $1
       RETURNING id`,
      [fingerprint, characterName, result, questionsCount || 0, category || '']
    )
    return res.rows.length > 0
  }

  private toDomain(row: GameHistoryRow): GameHistory {
    return {
      id: row.id,
      playerId: row.player_id,
      characterName: row.character_name,
      result: row.result,
      questionsCount: row.questions_count,
      category: row.category,
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    }
  }
}
