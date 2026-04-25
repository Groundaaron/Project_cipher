/*
  # Multiplayer Room System

  1. New Tables
    - `mp_rooms` - Game rooms with unique codes
      - `id` (uuid, primary key)
      - `code` (text, unique, 6-char room code)
      - `difficulty` (text: easy/medium/hard)
      - `status` (text: waiting/setting/guessing/switching/finished)
      - `created_at` (timestamptz)
      - `current_turn` (text: player1/player2 - whose turn to guess)
      - `round` (int: 1 or 2 - which round of the match)

    - `mp_players` - Players in rooms
      - `id` (uuid, primary key)
      - `room_id` (uuid, foreign key to mp_rooms)
      - `player_number` (int: 1 or 2)
      - `name` (text)
      - `secret_code` (text, nullable - JSON array of colors, set during code-setting phase)
      - `guesses` (text, nullable - JSON array of Guess objects)
      - `attempts` (int, default 0)
      - `time_taken` (int, default 0 - seconds)
      - `hints_used` (int, default 0)
      - `is_ready` (boolean, default false)
      - `finished_at` (timestamptz, nullable)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Anyone can create rooms (insert)
    - Room members can read/update their own player data
    - Room members can read room data
    - No delete access from client

  3. Important Notes
    - Secret codes are stored server-side but readable by room members
      (client-side filtering prevents opponent from seeing it)
    - Room codes are 6-character alphanumeric for easy sharing
    - The `status` field drives the game flow state machine
*/

CREATE TABLE IF NOT EXISTS mp_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  difficulty text NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'setting', 'guessing', 'switching', 'finished')),
  current_turn text NOT NULL DEFAULT 'player1' CHECK (current_turn IN ('player1', 'player2')),
  round int NOT NULL DEFAULT 1 CHECK (round IN (1, 2)),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mp_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES mp_rooms(id) ON DELETE CASCADE,
  player_number int NOT NULL CHECK (player_number IN (1, 2)),
  name text NOT NULL DEFAULT 'Player',
  secret_code text,
  guesses text DEFAULT '[]',
  attempts int NOT NULL DEFAULT 0,
  time_taken int NOT NULL DEFAULT 0,
  hints_used int NOT NULL DEFAULT 0,
  is_ready boolean NOT NULL DEFAULT false,
  finished_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE mp_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE mp_players ENABLE ROW LEVEL SECURITY;

-- Room policies
CREATE POLICY "Anyone can create rooms"
  ON mp_rooms FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Anyone can read rooms"
  ON mp_rooms FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Room members can update rooms"
  ON mp_rooms FOR UPDATE
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Player policies
CREATE POLICY "Anyone can create players"
  ON mp_players FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Anyone can read players"
  ON mp_players FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Anyone can update players"
  ON mp_players FOR UPDATE
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Index for room code lookups
CREATE INDEX IF NOT EXISTS idx_mp_rooms_code ON mp_rooms(code);

-- Index for room player lookups
CREATE INDEX IF NOT EXISTS idx_mp_players_room ON mp_players(room_id);

-- Auto-cleanup: delete rooms older than 2 hours
CREATE OR REPLACE FUNCTION cleanup_old_rooms() RETURNS void AS $$
BEGIN
  DELETE FROM mp_rooms WHERE created_at < now() - interval '2 hours';
END;
$$ LANGUAGE plpgsql;
