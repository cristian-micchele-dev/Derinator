import type { CharacterCategory, CharacterSubcategory } from '../types'

const CATEGORY_EMOJIS: Record<CharacterCategory, string> = {
  personaje: '👤',
  animal: '🐾',
}

const SUBCATEGORY_EMOJIS: Record<CharacterSubcategory, string> = {
  'anime-shonen': '⚔️',
  'anime-seinen': '🌑',
  'anime-magical-girl': '✨',
  videojuego: '🎮',
  superheroe: '🦸',
  disney: '🏰',
  nintendo: '🎌',
  'youtuber-streamer': '📹',
  'historico-real': '📜',
  deportista: '⚽',
  otro: '❓',
}

export function getCategoryEmoji(
  category: CharacterCategory,
  subcategory?: CharacterSubcategory | null
): string {
  if (subcategory && SUBCATEGORY_EMOJIS[subcategory]) {
    return SUBCATEGORY_EMOJIS[subcategory]
  }
  return CATEGORY_EMOJIS[category] || '❓'
}

export function getCategoryLabel(
  category: CharacterCategory,
  subcategory?: CharacterSubcategory | null
): string {
  const labels: Record<string, string> = {
    personaje: 'Personaje',
    animal: 'Animal',
    objeto: 'Objeto',
    lugar: 'Lugar',
    'anime-shonen': 'Anime Shonen',
    'anime-seinen': 'Anime Seinen',
    'anime-magical-girl': 'Anime Magical Girl',
    videojuego: 'Videojuego',
    superheroe: 'Superhéroe',
    disney: 'Disney',
    nintendo: 'Nintendo',
    'youtuber-streamer': 'YouTuber/Streamer',
    'historico-real': 'Histórico/Real',
    deportista: 'Deportista',
    otro: 'Otro',
  }

  if (subcategory && labels[subcategory]) {
    return labels[subcategory]
  }
  return labels[category] || category
}
