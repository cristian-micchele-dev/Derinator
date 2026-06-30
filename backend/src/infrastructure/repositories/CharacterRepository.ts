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
    let result
    if (fingerprint) {
      result = await this.db.query(
        'SELECT name FROM learned_characters WHERE lower(name) = lower($1) AND fingerprint = $2',
        [name, fingerprint]
      )
    } else {
      result = await this.db.query(
        'SELECT name FROM learned_characters WHERE lower(name) = lower($1) AND fingerprint IS NULL',
        [name]
      )
    }
    return result.rows.length > 0
  }

  async create(input: LearnCharacterInput): Promise<void> {
    await this.db.query(
      `INSERT INTO learned_characters (name, description, category, subcategory, answers, fingerprint)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [input.name, input.description || input.name, input.category, input.subcategory, JSON.stringify(input.answers), input.fingerprint || null]
    )
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
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    }
  }
}
