export interface PlayerStats {
  id: string
  fingerprint: string
  derinatorWins: number
  userWins: number
  currentStreak: number
  bestStreak: number
  totalGames: number
  achievements: string  // JSON string in DB
  hallOfFame: string    // JSON string in DB
  dailyGuessed: number  // 0/1 in SQLite
  dailyGuesses: number
  createdAt: string
  updatedAt: string
}

export interface SyncStatsInput {
  fingerprint: string
  derinatorWins: number
  userWins: number
  currentStreak: number
  bestStreak: number
  totalGames: number
  achievements: unknown[]
  hallOfFame: unknown[]
  dailyGuessed: boolean
  dailyGuesses: number
}
