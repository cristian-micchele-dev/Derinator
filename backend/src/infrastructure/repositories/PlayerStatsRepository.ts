import { Database } from 'sqlite'
import sqlite3 from 'sqlite3'
import { PlayerStats, SyncStatsInput, PlayerStatsRepository } from '../../domain'

type DB = Database<sqlite3.Database, sqlite3.Statement>

interface PlayerStatsRow {
  id: string
  fingerprint: string
  derinator_wins: number
  user_wins: number
  current_streak: number
  best_streak: number
  total_games: number
  achievements: string
  hall_of_fame: string
  daily_guessed: number
  daily_guesses: number
  created_at: string
  updated_at: string
}

export class SqlitePlayerStatsRepository implements PlayerStatsRepository {
  constructor(private db: DB) {}

  async findByFingerprint(fingerprint: string): Promise<PlayerStats | null> {
    const row = await this.db.get<PlayerStatsRow>(
      'SELECT * FROM player_stats WHERE fingerprint = ?',
      [fingerprint]
    )
    return row ? this.toDomain(row) : null
  }

  async upsert(stats: SyncStatsInput): Promise<PlayerStats> {
    const existing = await this.findByFingerprint(stats.fingerprint)

    if (existing) {
      await this.db.run(
        `UPDATE player_stats SET
          derinator_wins = MAX(derinator_wins, ?),
          user_wins = MAX(user_wins, ?),
          current_streak = ?,
          best_streak = MAX(best_streak, ?),
          total_games = MAX(total_games, ?),
          achievements = ?,
          hall_of_fame = ?,
          daily_guessed = ?,
          daily_guesses = ?,
          updated_at = datetime('now')
        WHERE fingerprint = ?`,
        [
          stats.derinatorWins, stats.userWins, stats.currentStreak, stats.bestStreak, stats.totalGames,
          JSON.stringify(stats.achievements), JSON.stringify(stats.hallOfFame),
          stats.dailyGuessed ? 1 : 0, stats.dailyGuesses,
          stats.fingerprint,
        ]
      )
    } else {
      await this.db.run(
        `INSERT INTO player_stats (
          fingerprint, derinator_wins, user_wins, current_streak,
          best_streak, total_games, achievements, hall_of_fame,
          daily_guessed, daily_guesses
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          stats.fingerprint, stats.derinatorWins, stats.userWins, stats.currentStreak, stats.bestStreak, stats.totalGames,
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
      derinatorWins: row.derinator_wins,
      userWins: row.user_wins,
      currentStreak: row.current_streak,
      bestStreak: row.best_streak,
      totalGames: row.total_games,
      achievements: row.achievements,
      hallOfFame: row.hall_of_fame,
      dailyGuessed: row.daily_guessed,
      dailyGuesses: row.daily_guesses,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }
}
