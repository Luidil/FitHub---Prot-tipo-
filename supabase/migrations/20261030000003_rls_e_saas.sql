-- FitHub - Endurece RLS das tabelas antigas + planos/assinatura SaaS

-- ---------- Helpers ----------
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('master','admin'));
$$;

-- Políticas genéricas criadas pelo painel (permitiam qualquer autenticado inserir)
DO $$ DECLARE t TEXT; BEGIN
  FOREACH t IN ARRAY ARRAY['venues','events','event_stats','event_players','teams','team_members'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Enable insert for authenticated" ON %I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Enable read for all users" ON %I', t);
  END LOOP;
END $$;

-- ---------- venues: agora têm dono ----------
ALTER TABLE venues ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid();
DROP POLICY IF EXISTS "Usuários autenticados podem criar venues" ON venues;
DROP POLICY IF EXISTS "Usuários autenticados podem editar venues" ON venues;
CREATE POLICY "Autenticados criam venues próprios" ON venues FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());
CREATE POLICY "Dono ou admin edita venue" ON venues FOR UPDATE
  USING (created_by = auth.uid() OR is_admin()) WITH CHECK (created_by = auth.uid() OR is_admin());
CREATE POLICY "Dono ou admin remove venue" ON venues FOR DELETE
  USING (created_by = auth.uid() OR is_admin());

-- ---------- events ----------
DROP POLICY IF EXISTS "Usuários autenticados podem criar events" ON events;
DROP POLICY IF EXISTS "Criadores podem editar events" ON events;
DROP POLICY IF EXISTS "Criadores podem deletar events" ON events;
CREATE POLICY "Autenticados criam events como criador" ON events FOR INSERT WITH CHECK (creator_id = auth.uid());
CREATE POLICY "Criador ou admin edita event" ON events FOR UPDATE
  USING (creator_id = auth.uid() OR is_admin()) WITH CHECK (creator_id = auth.uid() OR is_admin());
CREATE POLICY "Criador ou admin remove event" ON events FOR DELETE USING (creator_id = auth.uid() OR is_admin());

-- ---------- event_stats: só criador do evento ----------
DROP POLICY IF EXISTS "Autenticados podem criar event_stats" ON event_stats;
CREATE POLICY "Criador do evento gerencia stats" ON event_stats FOR ALL
  USING (is_admin() OR EXISTS (SELECT 1 FROM events e WHERE e.id = event_id AND e.creator_id = auth.uid()))
  WITH CHECK (is_admin() OR EXISTS (SELECT 1 FROM events e WHERE e.id = event_id AND e.creator_id = auth.uid()));

-- ---------- event_players: jogador não pode se marcar como "pago" ----------
CREATE OR REPLACE FUNCTION public.protect_event_player_paid() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF COALESCE(auth.role(), '') = 'service_role' OR is_admin()
     OR EXISTS (SELECT 1 FROM events e WHERE e.id = NEW.event_id AND e.creator_id = auth.uid()) THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN NEW.paid := FALSE;
  ELSIF NEW.paid IS DISTINCT FROM OLD.paid THEN NEW.paid := OLD.paid;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS event_players_protect_paid ON event_players;
CREATE TRIGGER event_players_protect_paid BEFORE INSERT OR UPDATE ON event_players
  FOR EACH ROW EXECUTE FUNCTION public.protect_event_player_paid();
CREATE POLICY "Criador do evento gerencia inscrições" ON event_players FOR UPDATE
  USING (is_admin() OR EXISTS (SELECT 1 FROM events e WHERE e.id = event_id AND e.creator_id = auth.uid()));

-- ---------- performances: só a própria ----------
DROP POLICY IF EXISTS "Autenticados podem criar performances" ON performances;
CREATE POLICY "Atleta registra a própria performance" ON performances FOR INSERT WITH CHECK (user_id = auth.uid() OR is_admin());
CREATE POLICY "Atleta edita a própria performance" ON performances FOR UPDATE USING (user_id = auth.uid() OR is_admin());

-- ---------- teams / team_members ----------
DROP POLICY IF EXISTS "Autenticados podem criar teams" ON teams;
DROP POLICY IF EXISTS "Capitães podem editar teams" ON teams;
CREATE POLICY "Autenticados criam time como capitão" ON teams FOR INSERT WITH CHECK (captain_id = auth.uid());
CREATE POLICY "Capitão ou admin edita time" ON teams FOR UPDATE USING (captain_id = auth.uid() OR is_admin());
CREATE POLICY "Capitão ou admin remove time" ON teams FOR DELETE USING (captain_id = auth.uid() OR is_admin());
DROP POLICY IF EXISTS "Autenticados podem entrar em teams" ON team_members;
DROP POLICY IF EXISTS "Membros podem sair de teams" ON team_members;
CREATE POLICY "Entrar no time (si mesmo) ou capitão adiciona" ON team_members FOR INSERT WITH CHECK (
  user_id = auth.uid() OR is_admin() OR EXISTS (SELECT 1 FROM teams t WHERE t.id = team_id AND t.captain_id = auth.uid()));
CREATE POLICY "Sair do time ou capitão remove" ON team_members FOR DELETE USING (
  user_id = auth.uid() OR is_admin() OR EXISTS (SELECT 1 FROM teams t WHERE t.id = team_id AND t.captain_id = auth.uid()));

-- ---------- championships ----------
DROP POLICY IF EXISTS "Autenticados podem criar championships" ON championships;
DROP POLICY IF EXISTS "Organizadores podem editar championships" ON championships;
CREATE POLICY "Autenticados criam campeonato como organizador" ON championships FOR INSERT WITH CHECK (organizer_id = auth.uid());
CREATE POLICY "Organizador ou admin edita campeonato" ON championships FOR UPDATE USING (organizer_id = auth.uid() OR is_admin());
CREATE POLICY "Organizador ou admin remove campeonato" ON championships FOR DELETE USING (organizer_id = auth.uid() OR is_admin());
DROP POLICY IF EXISTS "Autenticados podem inscrever teams" ON championship_teams;
CREATE POLICY "Capitão inscreve o próprio time" ON championship_teams FOR INSERT WITH CHECK (
  is_admin() OR EXISTS (SELECT 1 FROM teams t WHERE t.id = team_id AND t.captain_id = auth.uid()));
CREATE POLICY "Capitão ou organizador remove inscrição" ON championship_teams FOR DELETE USING (
  is_admin()
  OR EXISTS (SELECT 1 FROM teams t WHERE t.id = team_id AND t.captain_id = auth.uid())
  OR EXISTS (SELECT 1 FROM championships c WHERE c.id = championship_id AND c.organizer_id = auth.uid()));

-- =============================================
-- SaaS: planos e assinatura do organizador
-- =============================================
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'trial' CHECK (plan IN ('trial','basico','pro')),
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarding_done BOOLEAN DEFAULT FALSE;

-- O organizador não pode alterar o próprio plano/validade (só o servidor, via webhook).
CREATE OR REPLACE FUNCTION public.protect_org_plan() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  IF COALESCE(auth.role(), '') = 'service_role' THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.plan := 'trial'; NEW.trial_ends_at := NOW() + INTERVAL '14 days'; NEW.plan_expires_at := NULL;
  ELSE
    NEW.plan := OLD.plan; NEW.trial_ends_at := OLD.trial_ends_at; NEW.plan_expires_at := OLD.plan_expires_at;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS organizations_protect_plan ON organizations;
CREATE TRIGGER organizations_protect_plan BEFORE INSERT OR UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION public.protect_org_plan();

CREATE TABLE IF NOT EXISTS saas_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('basico','pro')),
  amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','pago','cancelado')),
  provider TEXT,
  provider_payment_id TEXT,
  pix_copy_paste TEXT,
  pix_qr_base64 TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE saas_invoices ENABLE ROW LEVEL SECURITY;
-- Organizador só LÊ as próprias faturas; criação/baixa só pelo servidor (service role).
CREATE POLICY "Dono vê faturas" ON saas_invoices FOR SELECT USING (is_org_owner(organization_id) OR is_admin());

-- Limite de atletas por plano (aviso suave no app; aqui bloqueia só abusos grandes: 2x o limite)
CREATE OR REPLACE FUNCTION public.enforce_athlete_limit() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE lim INT; cnt INT; p TEXT;
BEGIN
  SELECT plan INTO p FROM organizations WHERE id = NEW.organization_id;
  lim := CASE p WHEN 'basico' THEN 50 WHEN 'pro' THEN 200 ELSE 200 END;
  SELECT COUNT(*) INTO cnt FROM athletes WHERE organization_id = NEW.organization_id AND active;
  IF cnt >= lim * 2 THEN
    RAISE EXCEPTION 'Limite de atletas do plano atingido. Faça upgrade do plano.';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS athletes_limit ON athletes;
CREATE TRIGGER athletes_limit BEFORE INSERT ON athletes FOR EACH ROW EXECUTE FUNCTION public.enforce_athlete_limit();
