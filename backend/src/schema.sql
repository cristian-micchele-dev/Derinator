CREATE TABLE IF NOT EXISTS player_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint TEXT UNIQUE NOT NULL,
  player_token TEXT UNIQUE,
  derinator_wins INTEGER NOT NULL DEFAULT 0,
  user_wins INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  total_games INTEGER NOT NULL DEFAULT 0,
  achievements TEXT NOT NULL DEFAULT '[]',
  hall_of_fame TEXT NOT NULL DEFAULT '[]',
  daily_guessed BOOLEAN NOT NULL DEFAULT FALSE,
  daily_guesses INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- fingerprint and player_token are UNIQUE — PostgreSQL creates implicit B-tree indexes for them.
-- No explicit indexes needed on those columns.

CREATE TABLE IF NOT EXISTS game_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES player_stats(id) ON DELETE CASCADE,
  character_name TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('derinator_win', 'user_win')),
  questions_count INTEGER NOT NULL DEFAULT 0,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_history_player ON game_history(player_id);
CREATE INDEX IF NOT EXISTS idx_game_history_created ON game_history(created_at);

CREATE TABLE IF NOT EXISTS learned_characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'personaje',
  subcategory TEXT,
  answers TEXT NOT NULL DEFAULT '{}',
  fingerprint TEXT,
  confirmer_question TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Case-insensitive unique index: prevents "Messi" and "messi" from coexisting.
CREATE UNIQUE INDEX IF NOT EXISTS idx_learned_characters_lower_name ON learned_characters(lower(name));
CREATE INDEX IF NOT EXISTS idx_learned_characters_fingerprint ON learned_characters(fingerprint);
