import { randomUUID } from 'crypto'
import { Pool } from 'pg'
import { PlayerStats, SyncStatsInput, PlayerStatsRepository } from '../../domain'

interface PlayerStatsRow {
  id: string
  fingerprint: string
  player_token: string | null
  derinator_wins: number
  user_wins: number
  current_streak: number
  best_streak: number
  total_games: number
  achievements: string
  hall_of_fame: string
  daily_guessed: number
  daily_guesses: number
  created_at: Date
  updated_at: Date
}

export class SqlitePlayerStatsRepository implements PlayerStatsRepository {
  constructor(private db: Pool) {}

  async findByFingerprint(fingerprint: string): Promise<PlayerStats | null> {
    const result = await this.db.query<PlayerStatsRow>(
      'SELECT * FROM player_stats WHERE fingerprint = $1',
      [fingerprint]
    )
    return result.rows[0] ? this.toDomain(result.rows[0]) : null
  }

  async findByToken(token: string): Promise<PlayerStats | null> {
    const result = await this.db.query<PlayerStatsRow>(
      'SELECT * FROM player_stats WHERE player_token = $1',
      [token]
    )
    return result.rows[0] ? this.toDomain(result.rows[0]) : null
  }

  async upsert(stats: SyncStatsInput): Promise<PlayerStats> {
    const existing = await this.findByFingerprint(stats.fingerprint)

    if (existing) {
      await this.db.query(
        `UPDATE player_stats SET
          derinator_wins = GREATEST(derinator_wins, $1),
          user_wins = GREATEST(user_wins, $2),
          current_streak = $3,
          best_streak = GREATEST(best_streak, $4),
          total_games = GREATEST(total_games, $5),
          achievements = $6,
          hall_of_fame = $7,
          daily_guessed = $8,
          daily_guesses = $9,
          updated_at = NOW()
        WHERE fingerprint = $10`,
        [
          stats.derinatorWins, stats.userWins, stats.currentStreak, stats.bestStreak, stats.totalGames,
          JSON.stringify(stats.achievements), JSON.stringify(stats.hallOfFame),
          stats.dailyGuessed ? 1 : 0, stats.dailyGuesses,
          stats.fingerprint,
        ]
      )
    } else {
      const token = randomUUID()
      await this.db.query(
        `INSERT INTO player_stats (
          fingerprint, player_token, derinator_wins, user_wins, current_streak,
          best_streak, total_games, achievements, hall_of_fame,
          daily_guessed, daily_guesses
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          stats.fingerprint, token, stats.derinatorWins, stats.userWins, stats.currentStreak, stats.bestStreak, stats.totalGames,
          JSON.stringify(stats.achievements), JSON.stringify(stats.hallOfFame),
          stats.dailyGuessed ? 1 : 0, stats.dailyGuesses,
        ]
      )
    }

    return (await this.findByFingerprint(stats.fingerprint))!
  }

  private toDomain(row: PlayerStatsRow): PlayerStats {
    return {
      id: row.id,
      fingerprint: row.fingerprint,
      playerToken: row.player_token,
      derinatorWins: row.derinator_wins,
      userWins: row.user_wins,
      currentStreak: row.current_streak,
      bestStreak: row.best_streak,
      totalGames: row.total_games,
      achievements: row.achievements,
      hallOfFame: row.hall_of_fame,
      dailyGuessed: row.daily_guessed,
      dailyGuesses: row.daily_guesses,
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
      updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
    }
  }
}
