import { Pool } from 'pg'
import { LearnedCharacter, LearnCharacterInput, CharacterRepository } from '../../domain'

interface LearnedCharacterRow {
  id: string
  name: string
  description: string
  category: string
  subcategory: string
  answers: string
  fingerprint: string | null
  confirmer_question: string | null
  created_at: Date
}

export class PgCharacterRepository implements CharacterRepository {
  constructor(private db: Pool) {}

  async findAll(limit = 1000): Promise<LearnedCharacter[]> {
    const result = await this.db.query<LearnedCharacterRow>(
      'SELECT * FROM learned_characters ORDER BY created_at DESC LIMIT $1',
      [limit]
    )
    return result.rows.map(this.toDomain)
  }

  async findByFingerprint(fingerprint: string): Promise<LearnedCharacter[]> {
    const result = await this.db.query<LearnedCharacterRow>(
      'SELECT * FROM learned_characters WHERE fingerprint = $1 ORDER BY created_at DESC',
      [fingerprint]
    )
    return result.rows.map(this.toDomain)
  }

  async findDuplicate(name: string, fingerprint?: string): Promise<boolean> {
    const result = fingerprint
      ? await this.db.query(
          'SELECT 1 FROM learned_characters WHERE lower(name) = lower($1) AND fingerprint = $2 LIMIT 1',
          [name, fingerprint]
        )
      : await this.db.query(
          'SELECT 1 FROM learned_characters WHERE lower(name) = lower($1) AND fingerprint IS NULL LIMIT 1',
          [name]
        )
    return result.rows.length > 0
  }

  async create(input: LearnCharacterInput): Promise<void> {
    await this.db.query(
      `INSERT INTO learned_characters (name, description, category, subcategory, answers, fingerprint, confirmer_question)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [input.name, input.description || input.name, input.category, input.subcategory, JSON.stringify(input.answers), input.fingerprint || null, input.confirmerQuestion || null]
    )
  }

  async deleteByName(name: string): Promise<boolean> {
    const result = await this.db.query(
      'DELETE FROM learned_characters WHERE lower(name) = lower($1)',
      [name]
    )
    return (result.rowCount ?? 0) > 0
  }

  async countRecentByFingerprint(fingerprint: string, windowMinutes: number): Promise<number> {
    const result = await this.db.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM learned_characters
       WHERE fingerprint = $1 AND created_at > NOW() - ($2 || ' minutes')::INTERVAL`,
      [fingerprint, windowMinutes]
    )
    return parseInt(result.rows[0].count, 10)
  }

  private toDomain(row: LearnedCharacterRow): LearnedCharacter {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category,
      subcategory: row.subcategory,
      answers: row.answers,
      fingerprint: row.fingerprint,
      confirmerQuestion: row.confirmer_question ?? undefined,
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    }
  }
}
