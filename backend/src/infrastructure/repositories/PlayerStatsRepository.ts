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
  daily_guessed: boolean
  daily_guesses: number
  created_at: Date
  updated_at: Date
}

export class PgPlayerStatsRepository implements PlayerStatsRepository {
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
    const result = await this.db.query<PlayerStatsRow>(
      `INSERT INTO player_stats (
        fingerprint, player_token, derinator_wins, user_wins, current_streak,
        best_streak, total_games, achievements, hall_of_fame,
        daily_guessed, daily_guesses
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (fingerprint) DO UPDATE SET
        derinator_wins = GREATEST(player_stats.derinator_wins, EXCLUDED.derinator_wins),
        user_wins = GREATEST(player_stats.user_wins, EXCLUDED.user_wins),
        current_streak = EXCLUDED.current_streak,
        best_streak = GREATEST(player_stats.best_streak, EXCLUDED.best_streak),
        total_games = GREATEST(player_stats.total_games, EXCLUDED.total_games),
        achievements = EXCLUDED.achievements,
        hall_of_fame = EXCLUDED.hall_of_fame,
        daily_guessed = EXCLUDED.daily_guessed,
        daily_guesses = EXCLUDED.daily_guesses,
        updated_at = NOW()
      RETURNING *`,
      [
        // $2: token only used on INSERT — UPDATE preserves the existing player_token
        stats.fingerprint, randomUUID(), stats.derinatorWins, stats.userWins, stats.currentStreak,
        stats.bestStreak, stats.totalGames,
        JSON.stringify(stats.achievements), JSON.stringify(stats.hallOfFame),
        stats.dailyGuessed, stats.dailyGuesses,
      ]
    )

    return this.toDomain(result.rows[0])
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
