export type Answer = 'yes' | 'no' | 'probably' | 'probably_not' | 'dont_know'

export type CharacterCategory = 'animal' | 'personaje'

export type CharacterSubcategory =
  | 'anime-shonen'
  | 'anime-seinen'
  | 'anime-magical-girl'
  | 'videojuego'
  | 'superheroe'
  | 'disney'
  | 'nintendo'
  | 'youtuber-streamer'
  | 'historico-real'
  | 'deportista'
  | 'musico'
  | 'actor'
  | 'otro'

export type GameState = 'start' | 'playing' | 'guess' | 'win' | 'lose' | 'learn_name' | 'learn_questions'