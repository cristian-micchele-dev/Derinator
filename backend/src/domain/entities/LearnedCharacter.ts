export interface LearnedCharacter {
  id: string
  name: string
  description: string
  category: string
  subcategory: string
  answers: string  // JSON string in DB
  fingerprint: string | null
  confirmerQuestion?: string
  createdAt: string
}

export interface LearnCharacterInput {
  name: string
  description: string
  category: string
  subcategory: string
  answers: Record<string, string>
  fingerprint?: string
  confirmerQuestion?: string
}
