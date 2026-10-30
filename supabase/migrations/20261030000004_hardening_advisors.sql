-- Correções apontadas pelos advisors do Supabase
ALTER FUNCTION public.prevent_role_escalation() SET search_path = public;
ALTER FUNCTION public.protect_org_plan() SET search_path = public;

-- Funções de trigger não devem ser chamáveis via /rpc
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_athlete_limit() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_event_player_paid() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_org_plan() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_role_escalation() FROM PUBLIC, anon, authenticated;
-- Helpers de RLS: só para usuários logados
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_org_owner(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_owner(uuid) TO authenticated;

-- Dados de gestão/cobrança não são visíveis sem login (página de pagamento usa a RPC public_charge)
REVOKE ALL ON public.organizations, public.athletes, public.charges, public.schedule_items, public.saas_invoices, public.charges_with_status FROM anon;

-- Índices das FKs
CREATE INDEX IF NOT EXISTS athletes_org_idx ON athletes(organization_id);
CREATE INDEX IF NOT EXISTS schedule_items_org_idx ON schedule_items(organization_id);
CREATE INDEX IF NOT EXISTS saas_invoices_org_idx ON saas_invoices(organization_id);
CREATE INDEX IF NOT EXISTS organizations_owner_idx ON organizations(owner_id);
CREATE INDEX IF NOT EXISTS events_creator_idx ON events(creator_id);
CREATE INDEX IF NOT EXISTS events_venue_idx ON events(venue_id);
CREATE INDEX IF NOT EXISTS event_players_user_idx ON event_players(user_id);
CREATE INDEX IF NOT EXISTS event_stats_event_idx ON event_stats(event_id);
CREATE INDEX IF NOT EXISTS performances_event_idx ON performances(event_id);
CREATE INDEX IF NOT EXISTS performances_user_idx ON performances(user_id);
CREATE INDEX IF NOT EXISTS championships_org_idx ON championships(organizer_id);
CREATE INDEX IF NOT EXISTS championship_teams_team_idx ON championship_teams(team_id);
