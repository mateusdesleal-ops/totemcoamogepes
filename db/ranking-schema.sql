-- Executar somente no banco Neon de homologação; idempotente.
CREATE TABLE IF NOT EXISTS ranking_control (
  id integer PRIMARY KEY CHECK (id = 1),
  epoch bigint NOT NULL DEFAULT 1 CHECK (epoch >= 1)
);
INSERT INTO ranking_control (id, epoch) VALUES (1, 1)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS ranking_game_epoch (
  game text PRIMARY KEY,
  epoch bigint NOT NULL DEFAULT 1 CHECK (epoch >= 1)
);
INSERT INTO ranking_game_epoch (game) VALUES
  ('grain'), ('silo'), ('classificacao'), ('silo3d'), ('cadeia3d'),
  ('memoria3d'), ('memoria'), ('cadeia'), ('jornada')
ON CONFLICT (game) DO NOTHING;

CREATE TABLE IF NOT EXISTS ranking_entries (
  submission_id uuid PRIMARY KEY,
  event_epoch bigint NOT NULL,
  game_epoch bigint NOT NULL,
  game text NOT NULL REFERENCES ranking_game_epoch(game),
  player_name varchar(40) NOT NULL,
  phone_digits varchar(11) NOT NULL,
  score bigint NOT NULL CHECK (score >= 0),
  duration double precision,
  accuracy double precision,
  phase integer,
  stars integer,
  created_at_ms bigint NOT NULL,
  import_key text UNIQUE,
  received_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ranking_entries_top_idx
  ON ranking_entries (event_epoch, game, game_epoch, score DESC, duration DESC, accuracy DESC, phase DESC, created_at_ms ASC);
-- Dados pessoais não devem ser acessados diretamente pelo cliente.
-- Limpar/anonimizar registros antigos conforme política de privacidade do evento.
