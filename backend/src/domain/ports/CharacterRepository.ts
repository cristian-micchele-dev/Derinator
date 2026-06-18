import { LearnedCharacter, LearnCharacterInput } from '../entities/LearnedCharacter'

/**
 * Port: Learned character persistence.
 * 
 * The domain defines WHAT data operations are needed.
 * Infrastructure provides HOW (SQLite, Postgres, in-memory, etc.).
 */
export interface CharacterRepository {
  findAll(limit?: number): Promise<LearnedCharacter[]>
  findByFingerprint(fingerprint: string): Promise<LearnedCharacter[]>
  findDuplicate(name: string, fingerprint?: string): Promise<boolean>
  create(input: LearnCharacterInput): Promise<void>
}
