/**
 * Domain ports barrel export.
 * 
 * These interfaces define WHAT the domain needs from infrastructure.
 * Implementations live in infrastructure/repositories/.
 */
export type { PlayerStatsRepository } from './PlayerStatsRepository'
export type { CharacterRepository } from './CharacterRepository'
export type { GameHistoryRepository } from './GameHistoryRepository'
