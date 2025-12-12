-- FitHub protótipo — esquema relacional básico (SQLite)
-- Este arquivo cria um banco local com entidades centrais do app.
-- Execute com: sqlite3 fithub.db < db/schema.sql

PRAGMA foreign_keys = ON;

-- Usuários da plataforma
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  password_hash TEXT,
  city TEXT,
  state TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Locais/quadras
CREATE TABLE IF NOT EXISTS venues (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  bairro TEXT,
  tipo TEXT,
  superficie TEXT,
  city TEXT,
  state TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Eventos/partidas
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  sport TEXT NOT NULL,
  venue_id TEXT NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  datetime DATETIME NOT NULL,
  slots_total INTEGER NOT NULL,
  price_per_player REAL NOT NULL DEFAULT 1,
  level TEXT,
  creator_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Métricas configuradas para cada evento (ex.: Gols, Assistências)
CREATE TABLE IF NOT EXISTS event_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  label TEXT NOT NULL
);

-- Inscrições nas partidas
CREATE TABLE IF NOT EXISTS event_players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  paid BOOLEAN DEFAULT 0,
  checked_in BOOLEAN DEFAULT 0,
  checkin_method TEXT,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, user_id)
);

-- Estatísticas registradas após o jogo
CREATE TABLE IF NOT EXISTS performances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  minutes_played INTEGER,
  goals INTEGER DEFAULT 0,
  passes INTEGER DEFAULT 0,
  distance_km REAL DEFAULT 0,
  mvp BOOLEAN DEFAULT 0,
  video_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Times fixos
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sport TEXT,
  captain_id TEXT REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS team_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(team_id, user_id)
);

-- Crianças e campeonatos kids
CREATE TABLE IF NOT EXISTS kids (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER,
  sport TEXT,
  guardian_id TEXT REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS championships (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sport TEXT,
  category TEXT,
  fee REAL DEFAULT 20,
  start_date DATE,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS championship_registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  championship_id TEXT NOT NULL REFERENCES championships(id) ON DELETE CASCADE,
  kid_id TEXT NOT NULL REFERENCES kids(id) ON DELETE CASCADE,
  team_id TEXT REFERENCES teams(id),
  UNIQUE(championship_id, kid_id)
);

-- Stories com antes/depois
CREATE TABLE IF NOT EXISTS stories (
  id TEXT PRIMARY KEY,
  athlete_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id TEXT REFERENCES events(id) ON DELETE SET NULL,
  venue_id TEXT REFERENCES venues(id) ON DELETE SET NULL,
  before_photo TEXT,
  after_photo TEXT,
  caption TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Chat e notificações
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target TEXT,
  text TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  read BOOLEAN DEFAULT 0
);

-- Ranking simples acumulado (pode ser derivado de performances)
CREATE TABLE IF NOT EXISTS rankings (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  points INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed mínimo baseado nos mocks do front
INSERT OR IGNORE INTO users (id, name, city, state) VALUES
  ('lucas', 'Lucas Santiago', 'Salvador', 'BA'),
  ('mariana', 'Mariana Lopes', 'Salvador', 'BA'),
  ('pedro', 'Pedro Souza', 'Lauro de Freitas', 'BA'),
  ('ana_runner', 'Ana Runner', 'Salvador', 'BA');

INSERT OR IGNORE INTO venues (id, name, bairro, tipo, superficie, city, state) VALUES
  ('arena_x', 'Quadra Arena X', 'Pituba', 'Sintética', 'grama sintética', 'Salvador', 'BA'),
  ('poliesportivo_y', 'Poliesportivo Y', 'Barris', 'Ginásio coberto', 'madeira', 'Salvador', 'BA'),
  ('quadra_3', 'Quadra 3', 'Stiep', 'Areia', 'areia', 'Salvador', 'BA'),
  ('orla_barra', 'Orla da Barra · Pista 5 km', 'Barra', 'Corrida', 'asfalto', 'Salvador', 'BA');

INSERT OR IGNORE INTO events (id, sport, venue_id, datetime, slots_total, price_per_player, level, creator_id) VALUES
  ('e1', 'Futebol 5x5', 'arena_x', DATETIME('now', '+1 hour'), 10, 1, 'Intermediário', 'lucas'),
  ('e2', 'Basquete 3x3', 'poliesportivo_y', DATETIME('now', '+2 hour'), 6, 1, 'Iniciante', 'mariana'),
  ('e3', 'Vôlei 6x6', 'quadra_3', DATETIME('now', '+30 minutes'), 12, 1, 'Avançado', 'pedro'),
  ('e4', 'Corrida 5 km', 'orla_barra', DATETIME('now', '+90 minutes'), 25, 1, 'Todos os ritmos', 'ana_runner');

INSERT OR IGNORE INTO event_stats (event_id, label) VALUES
  ('e1', 'Gols'), ('e1', 'Assistências'), ('e1', 'Finalizações'), ('e1', 'Km percorridos'),
  ('e2', 'Pontos'), ('e2', 'Assistências'), ('e2', 'Rebotes'), ('e2', 'Bolas recuperadas'),
  ('e3', 'Aces'), ('e3', 'Bloqueios'), ('e3', 'Defesas'), ('e3', 'Eficiência de ataque'),
  ('e4', 'Ritmo médio'), ('e4', 'Passadas por minuto'), ('e4', 'Frequência cardíaca'), ('e4', 'Negativos no fim');

INSERT OR IGNORE INTO teams (id, name, sport, captain_id) VALUES
  ('tigers', 'Salvador Tigers', 'Futebol 5x5', 'lucas');

INSERT OR IGNORE INTO team_members (team_id, user_id) VALUES
  ('tigers', 'lucas'), ('tigers', 'mariana'), ('tigers', 'pedro');

INSERT OR IGNORE INTO kids (id, name, age, sport, guardian_id) VALUES
  ('kid1', 'Theo Santiago', 10, 'Futebol Society', 'lucas');

INSERT OR IGNORE INTO championships (id, name, sport, category, fee, start_date, description) VALUES
  ('champ1', 'Copa FitHub Sub-11', 'Futebol Society', 'Sub-11', 25, DATE('now', '+7 days'), 'Rodadas rápidas aos sábados · Pais confirmam via app.');

INSERT OR IGNORE INTO championship_registrations (championship_id, kid_id) VALUES
  ('champ1', 'kid1');
