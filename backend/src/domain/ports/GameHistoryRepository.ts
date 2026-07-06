import { GameHistory } from '../entities/GameHistory'

/**
 * Port: Game history persistence.
 * 
 * The domain defines WHAT data operations are needed.
 * Infrastructure provides HOW (SQLite, Postgres, in-memory, etc.).
 */
export interface GameHistoryRepository {
  findByFingerprint(fingerprint: string): Promise<GameHistory[]>
  /**
   * Creates a game history entry for the player identified by fingerprint.
   * Returns false if no player with that fingerprint exists.
   */
  create(
    fingerprint: string,
    characterName: string,
    result: string,
    questionsCount: number,
    category: string,
  ): Promise<boolean>
}
