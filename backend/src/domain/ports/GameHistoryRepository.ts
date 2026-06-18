import { GameHistory } from '../entities/GameHistory'

/**
 * Port: Game history persistence.
 * 
 * The domain defines WHAT data operations are needed.
 * Infrastructure provides HOW (SQLite, Postgres, in-memory, etc.).
 */
export interface GameHistoryRepository {
  findByFingerprint(fingerprint: string): Promise<GameHistory[]>
  findPlayerId(fingerprint: string): Promise<string | null>
  create(
    playerId: string,
    characterName: string,
    result: string,
    questionsCount: number,
    category: string,
  ): Promise<void>
}
