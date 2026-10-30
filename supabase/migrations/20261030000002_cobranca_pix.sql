-- FitHub - Módulo de gestão e cobrança (escolinhas, campeonatos, quadras)

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'escolinha' CHECK (kind IN ('escolinha','campeonato','quadra','time')),
  city TEXT DEFAULT 'Salvador',
  whatsapp TEXT,
  pix_key TEXT,            -- chave Pix para o modo "Pix direto" (sem provedor)
  pix_merchant_name TEXT,
  default_fee NUMERIC(10,2) DEFAULT 0,
  default_due_day INT DEFAULT 10 CHECK (default_due_day BETWEEN 1 AND 28),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS athletes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  guardian_name TEXT,
  birth_date DATE,
  category TEXT,
  monthly_fee NUMERIC(10,2),
  due_day INT CHECK (due_day BETWEEN 1 AND 28),
  active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  athlete_id UUID REFERENCES athletes(id) ON DELETE SET NULL,
  payer_name TEXT NOT NULL,
  payer_phone TEXT,
  kind TEXT NOT NULL DEFAULT 'mensalidade' CHECK (kind IN ('mensalidade','inscricao_campeonato','inscricao_jogo','aluguel_quadra','outro')),
  description TEXT NOT NULL,
  reference_month TEXT,       -- ex: 2026-11 (evita mensalidade duplicada)
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','pago','cancelado')),
  provider TEXT,              -- mercadopago | asaas | mock | manual | pix_direto
  provider_payment_id TEXT,
  pix_copy_paste TEXT,
  pix_qr_base64 TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS charges_unique_monthly
  ON charges (athlete_id, reference_month) WHERE kind = 'mensalidade' AND status <> 'cancelado';
CREATE INDEX IF NOT EXISTS charges_org_status ON charges (organization_id, status, due_date);
CREATE INDEX IF NOT EXISTS charges_provider_id ON charges (provider_payment_id);

CREATE TABLE IF NOT EXISTS schedule_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  kind TEXT DEFAULT 'treino' CHECK (kind IN ('treino','jogo','campeonato','reserva')),
  starts_at TIMESTAMPTZ NOT NULL,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_items ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_org_owner(org UUID) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM organizations o WHERE o.id = org AND o.owner_id = auth.uid());
$$;

CREATE POLICY "Dono gerencia organização" ON organizations FOR ALL
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Dono gerencia atletas" ON athletes FOR ALL
  USING (is_org_owner(organization_id)) WITH CHECK (is_org_owner(organization_id));
CREATE POLICY "Dono gerencia cobranças" ON charges FOR ALL
  USING (is_org_owner(organization_id)) WITH CHECK (is_org_owner(organization_id));
CREATE POLICY "Dono gerencia agenda" ON schedule_items FOR ALL
  USING (is_org_owner(organization_id)) WITH CHECK (is_org_owner(organization_id));

-- Página pública de pagamento: devolve só o necessário de UMA cobrança (pelo UUID, impossível de adivinhar).
CREATE OR REPLACE FUNCTION public.public_charge(charge_id UUID)
RETURNS TABLE (id UUID, payer_name TEXT, description TEXT, amount NUMERIC, due_date DATE, status TEXT,
               pix_copy_paste TEXT, pix_qr_base64 TEXT, organization_name TEXT, pix_key TEXT, pix_merchant_name TEXT, city TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, c.payer_name, c.description, c.amount, c.due_date, c.status,
         c.pix_copy_paste, c.pix_qr_base64, o.name, o.pix_key, o.pix_merchant_name, o.city
  FROM charges c JOIN organizations o ON o.id = c.organization_id
  WHERE c.id = charge_id AND c.status <> 'cancelado';
$$;
GRANT EXECUTE ON FUNCTION public.public_charge(UUID) TO anon, authenticated;

-- Visão com status calculado (pago / pendente / atrasado)
CREATE OR REPLACE VIEW charges_with_status WITH (security_invoker = true) AS
  SELECT c.*, CASE
    WHEN c.status = 'pago' THEN 'pago'
    WHEN c.status = 'cancelado' THEN 'cancelado'
    WHEN c.due_date < CURRENT_DATE THEN 'atrasado'
    ELSE 'pendente' END AS computed_status
  FROM charges c;

-- Segurança: usuário não pode se promover a 'master'/'admin' editando o próprio perfil.
CREATE OR REPLACE FUNCTION public.prevent_role_escalation() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND COALESCE(auth.role(), '') <> 'service_role' THEN
    NEW.role := OLD.role;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS profiles_prevent_role_escalation ON profiles;
CREATE TRIGGER profiles_prevent_role_escalation BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_escalation();
