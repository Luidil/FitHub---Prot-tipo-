-- FitHub - Schema para Supabase (PostgreSQL)
-- Execute este SQL no SQL Editor do Supabase

-- Habilitar extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABELAS
-- =============================================

-- Usuários (perfis - complementa auth.users do Supabase)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  city TEXT,
  state TEXT,
  role TEXT DEFAULT 'player', -- player, admin, organizer
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Locais/quadras
CREATE TABLE IF NOT EXISTS venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  bairro TEXT,
  tipo TEXT,
  superficie TEXT,
  city TEXT,
  state TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Eventos/partidas
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sport TEXT NOT NULL,
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  datetime TIMESTAMPTZ NOT NULL,
  slots_total INTEGER NOT NULL,
  price_per_player DECIMAL(10,2) NOT NULL DEFAULT 1,
  level TEXT,
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Métricas configuradas para cada evento (ex.: Gols, Assistências)
CREATE TABLE IF NOT EXISTS event_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  label TEXT NOT NULL
);

-- Inscrições nas partidas
CREATE TABLE IF NOT EXISTS event_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  paid BOOLEAN DEFAULT FALSE,
  checked_in BOOLEAN DEFAULT FALSE,
  checkin_method TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Estatísticas registradas após o jogo
CREATE TABLE IF NOT EXISTS performances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  minutes_played INTEGER,
  goals INTEGER DEFAULT 0,
  passes INTEGER DEFAULT 0,
  distance_km DECIMAL(5,2) DEFAULT 0,
  mvp BOOLEAN DEFAULT FALSE,
  video_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Times fixos
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  sport TEXT,
  captain_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE(team_id, user_id)
);

-- Campeonatos
CREATE TABLE IF NOT EXISTS championships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  sport TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  organizer_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS championship_teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  championship_id UUID NOT NULL REFERENCES championships(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  UNIQUE(championship_id, team_id)
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE performances ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE championships ENABLE ROW LEVEL SECURITY;
ALTER TABLE championship_teams ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Profiles são públicos" ON profiles FOR SELECT USING (true);
CREATE POLICY "Usuários podem editar próprio perfil" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Usuários podem criar próprio perfil" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas para venues (qualquer um pode ver/criar)
CREATE POLICY "Venues são públicos" ON venues FOR SELECT USING (true);
CREATE POLICY "Usuários autenticados podem criar venues" ON venues FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem editar venues" ON venues FOR UPDATE USING (auth.role() = 'authenticated');

-- Políticas para events
CREATE POLICY "Events são públicos" ON events FOR SELECT USING (true);
CREATE POLICY "Usuários autenticados podem criar events" ON events FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Criadores podem editar events" ON events FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Criadores podem deletar events" ON events FOR DELETE USING (auth.uid() = creator_id);

-- Políticas para event_stats
CREATE POLICY "Event stats são públicos" ON event_stats FOR SELECT USING (true);
CREATE POLICY "Autenticados podem criar event_stats" ON event_stats FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Políticas para event_players
CREATE POLICY "Event players são públicos" ON event_players FOR SELECT USING (true);
CREATE POLICY "Usuários podem se inscrever" ON event_players FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem sair de eventos" ON event_players FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar própria inscrição" ON event_players FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para performances
CREATE POLICY "Performances são públicas" ON performances FOR SELECT USING (true);
CREATE POLICY "Autenticados podem criar performances" ON performances FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Políticas para teams
CREATE POLICY "Teams são públicos" ON teams FOR SELECT USING (true);
CREATE POLICY "Autenticados podem criar teams" ON teams FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Capitães podem editar teams" ON teams FOR UPDATE USING (auth.uid() = captain_id);

-- Políticas para team_members
CREATE POLICY "Team members são públicos" ON team_members FOR SELECT USING (true);
CREATE POLICY "Autenticados podem entrar em teams" ON team_members FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Membros podem sair de teams" ON team_members FOR DELETE USING (auth.uid() = user_id);

-- Políticas para championships
CREATE POLICY "Championships são públicos" ON championships FOR SELECT USING (true);
CREATE POLICY "Autenticados podem criar championships" ON championships FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Organizadores podem editar championships" ON championships FOR UPDATE USING (auth.uid() = organizer_id);

-- Políticas para championship_teams
CREATE POLICY "Championship teams são públicos" ON championship_teams FOR SELECT USING (true);
CREATE POLICY "Autenticados podem inscrever teams" ON championship_teams FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- =============================================
-- TRIGGER para criar perfil automaticamente
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- DADOS INICIAIS (opcional)
-- =============================================

-- Inserir algumas venues de exemplo
INSERT INTO venues (name, bairro, tipo, superficie, city, state) VALUES
  ('Quadra do Parque', 'Centro', 'Coberta', 'Sintético', 'Curitiba', 'PR'),
  ('Arena Fut7', 'Batel', 'Coberta', 'Grama sintética', 'Curitiba', 'PR'),
  ('Complexo Esportivo', 'Água Verde', 'Descoberta', 'Grama natural', 'Curitiba', 'PR')
ON CONFLICT DO NOTHING;
