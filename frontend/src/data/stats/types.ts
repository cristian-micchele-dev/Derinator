import type { GameState } from '../../types'
import { Answer } from '../../types'
import { QuestionId } from '../questions'

export const STATS_KEY = 'derinator_stats'
export const GAME_STATE_KEY = 'derinator_game_state'
export const ONBOARDING_KEY = 'derinator_onboarding_seen'
export const HALL_OF_FAME_KEY = 'derinator_hall_of_fame'
export const ACHIEVEMENTS_KEY = 'derinator_achievements'
export const DAILY_CHARACTER_KEY = 'derinator_daily_character'

export interface GameStats {
  derinatorWins: number
  userWins: number
  currentStreak: number
  bestStreak: number
  mostDefeatedCharacter: string
  mostDefeatedCount: number
  totalGames: number
  characterGuessCounts: Record<string, number>
}


export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  unlockedAt?: string
  progress: number
  maxProgress: number
}

export interface HallOfFameEntry {
  name: string
  questionsCount: number
}

export interface DailyCharacter {
  characterName: string
  date: string
  guessed: boolean
  guesses: number
}

export interface SavedGameState {
  history: { questionId: QuestionId; answer: Answer }[]
  selectedCategory: string
  gameState: GameState
  timestamp: number
}
