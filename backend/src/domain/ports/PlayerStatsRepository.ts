import { PlayerStats, SyncStatsInput } from '../entities/PlayerStats'

/**
 * Port: Player statistics persistence.
 * 
 * The domain defines WHAT data operations are needed.
 * Infrastructure provides HOW (SQLite, Postgres, in-memory, etc.).
 */
export interface PlayerStatsRepository {
  findByFingerprint(fingerprint: string): Promise<PlayerStats | null>
  findByToken(token: string): Promise<PlayerStats | null>
  upsert(stats: SyncStatsInput): Promise<PlayerStats>
}
