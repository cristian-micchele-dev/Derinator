import { Database } from 'sqlite'
import sqlite3 from 'sqlite3'
import { LearnedCharacter, LearnCharacterInput, CharacterRepository } from '../../domain'

type DB = Database<sqlite3.Database, sqlite3.Statement>

interface LearnedCharacterRow {
  id: string
  name: string
  description: string
  category: string
  subcategory: string
  answers: string
  fingerprint: string | null
  created_at: string
}

export class SqliteCharacterRepository implements CharacterRepository {
  constructor(private db: DB) {}

  async findAll(limit = 1000): Promise<LearnedCharacter[]> {
    const rows = await this.db.all<LearnedCharacterRow[]>(
      'SELECT * FROM learned_characters ORDER BY created_at DESC LIMIT ?',
      [limit]
    )
    return rows.map(this.toDomain)
  }

  async findByFingerprint(fingerprint: string): Promise<LearnedCharacter[]> {
    const rows = await this.db.all<LearnedCharacterRow[]>(
      'SELECT * FROM learned_characters WHERE fingerprint = ? ORDER BY created_at DESC',
      [fingerprint]
    )
    return rows.map(this.toDomain)
  }

  async findDuplicate(name: string, fingerprint?: string): Promise<boolean> {
    let existing
    if (fingerprint) {
      existing = await this.db.get(
        'SELECT name FROM learned_characters WHERE lower(name) = lower(?) AND fingerprint = ?',
        [name, fingerprint]
      )
    } else {
      existing = await this.db.get(
        'SELECT name FROM learned_characters WHERE lower(name) = lower(?) AND fingerprint IS NULL',
        [name]
      )
    }
    return !!existing
  }

  async create(input: LearnCharacterInput): Promise<void> {
    await this.db.run(
      `INSERT INTO learned_characters (name, description, category, subcategory, answers, fingerprint)
       VALUES (?, ?, ?, ?, ?, ?)`,
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
      createdAt: row.created_at,
    }
  }
}
