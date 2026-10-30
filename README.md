# FitHub — Gestão esportiva com cobrança por Pix

App (Web/PWA, Android e iOS via Capacitor) para combinar jogos, campeonatos, check-in, estatísticas e ranking — agora com **área de gestão e cobrança** para **escolinhas de futebol, organizadores de campeonato de várzea/society e donos de quadra**.

## ⚡ Recursos

- **Gestão (aba "Gestão")**: cadastro da escolinha/campeonato/quadra, atletas, agenda de treinos/jogos/reservas.
- **Cobrança por Pix**: mensalidades geradas em lote por mês (sem duplicar) e cobranças avulsas (inscrição em campeonato, jogo, aluguel de quadra).
- **Status pago / pendente / atrasado**, filtro de inadimplentes e resumo do mês (recebido, a receber, atrasado).
- **Lembrete no WhatsApp**: botão que abre `wa.me` com a mensagem pronta, link de pagamento e Pix Copia e Cola.
- **Página pública de pagamento** (`/?pagar=<id>`): QR Code + Copia e Cola, sem login; atualiza sozinha quando o pagamento cai.
- **Provedores Pix**: Mercado Pago ou Asaas com baixa automática via webhook; **modo teste (mock)** sem nenhuma chave; e **Pix direto** (QR gerado com a chave Pix do organizador, baixa manual).
- Feed de partidas, campeonatos, times, stories, ranking, perfil (já existentes).

## 🛠️ Stack

React 18 + Vite · Supabase (Auth + Postgres + RLS) · Funções serverless da Vercel (`/api`) · Capacitor 6 · PWA com service worker.

---

## 1. Rodar localmente

Requisitos: Node 18+.

```bash
npm install
cp .env.example .env      # preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm run dev               # http://localhost:5173
```

- Com `npm run dev` as funções `/api` **não** rodam: o app usa automaticamente o **Pix direto** (chave Pix cadastrada em Gestão → Configurações) e a baixa é manual ("Marcar pago").
- Para testar também as funções `/api` localmente: `npm i -g vercel && vercel dev` (lê o mesmo `.env`).

## 2. Configurar o Supabase

1. Crie um projeto em https://supabase.com (ou use o existente).
2. Em **SQL Editor**, rode **na ordem** os arquivos de `supabase/migrations/`:
   1. `20261030000001_schema_inicial.sql` (tabelas do app, se ainda não existirem)
   2. `20261030000002_cobranca_pix.sql` (gestão, cobranças, agenda, RLS, página pública)
   - Ou com a CLI: `supabase link --project-ref SEU-PROJETO && supabase db push`.
   - Se o schema inicial já foi aplicado antes, rode só o segundo.
3. Em **Authentication → Providers**, deixe **Email** ativo. Em **Authentication → URL Configuration**, coloque a URL da Vercel em *Site URL* e *Redirect URLs*.
4. Em **Project Settings → API**, copie:
   - `Project URL` → `VITE_SUPABASE_URL` e `SUPABASE_URL`
   - `anon public` → `VITE_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (**só no servidor/Vercel, nunca no front**)
5. Perfil master (painel "Master"): no SQL Editor, `update profiles set role = 'master' where id = '<uuid do seu usuário>';`. Usuários não conseguem mudar o próprio `role` (trigger de segurança).

Login: cada pessoa cria a conta com e-mail e senha na tela inicial (Supabase Auth). Não existem mais usuários/senhas fixos no código.

## 3. Configurar o provedor Pix

Defina `PIX_PROVIDER` na Vercel. Sem chave configurada, o app cai em `mock` automaticamente.

| Modo | Como funciona |
|---|---|
| `mock` (padrão) | Nada é cobrado. "Gerar Pix" usa sua chave Pix (se cadastrada) e aparece o botão **Simular webhook** para testar a baixa. |
| `mercadopago` | Gera Pix dinâmico no Mercado Pago; webhook dá baixa automática. |
| `asaas` | Gera Pix no Asaas (pede CPF/CNPJ do pagador); webhook dá baixa automática. |

**Mercado Pago**
1. Crie a conta em https://www.mercadopago.com.br/developers → *Suas integrações* → crie uma aplicação.
2. Copie o **Access Token** (use o de *teste* primeiro) → `MERCADOPAGO_ACCESS_TOKEN`. Cadastre uma chave Pix na conta Mercado Pago.
3. `PIX_PROVIDER=mercadopago`. O webhook é enviado automaticamente para `https://SEU-APP.vercel.app/api/pix/webhook?provider=mercadopago` (via `notification_url`). O servidor sempre reconsulta o pagamento na API do Mercado Pago antes de dar baixa.

**Asaas**
1. Crie a conta (sandbox: https://sandbox.asaas.com) → *Integrações* → gere a **API Key** → `ASAAS_API_KEY`; `ASAAS_ENV=sandbox` ou `production`.
2. Em *Integrações → Webhooks*, cadastre `https://SEU-APP.vercel.app/api/pix/webhook?provider=asaas`, eventos de **Cobrança** (PAYMENT_RECEIVED / PAYMENT_CONFIRMED) e um **token de autenticação** → `ASAAS_WEBHOOK_TOKEN` (mesmo valor).
3. `PIX_PROVIDER=asaas`.

## 4. Deploy na Vercel

1. Em https://vercel.com → *Add New Project* → importe este repositório do GitHub. Framework: **Vite** (o `vercel.json` já define build `npm run build` e saída `dist`).
2. Em *Settings → Environment Variables*, cadastre todas as variáveis do `.env.example` com seus valores reais (`VITE_*`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PUBLIC_APP_URL`, `VITE_PUBLIC_APP_URL`, `PIX_PROVIDER` e as do provedor).
3. *Deploy*. Teste `https://SEU-APP.vercel.app/api/health` → deve responder `{"ok":true,"provider":"..."}`.
4. Atualize a *Site URL* no Supabase e o webhook do provedor com a URL final.
5. PWA: abra o site no celular → "Adicionar à tela inicial".

## 5. Como testar o fluxo de cobrança

1. Crie uma conta e entre. Abra **Gestão** → cadastre a escolinha (com chave Pix e mensalidade padrão).
2. **Atletas** → cadastre 2 atletas com WhatsApp.
3. **Cobranças** → "Gerar mensalidades do mês"; crie também uma cobrança avulsa com vencimento no passado (vira **Atrasado**).
4. Clique **Gerar Pix** → **Ver Pix** / **Copiar link de pagamento** → abra o link numa aba anônima (página pública).
5. **Lembrar no WhatsApp** abre a conversa com a mensagem pronta.
6. Em `mock`, clique **Simular webhook** (ou **Marcar pago**) → status vira **Pago** e a página pública atualiza.

## 📱 Mobile (Capacitor)

```bash
npm run android   # build + sync + abre Android Studio
npm run ios       # build + sync + abre Xcode (macOS)
```
No app nativo, defina `VITE_PUBLIC_APP_URL` para os links de pagamento apontarem para o site.

## 🔒 Segurança

- Nenhuma chave fica no código: tudo vem de variáveis de ambiente (`.env` está no `.gitignore`).
- `SUPABASE_SERVICE_ROLE_KEY` e as chaves dos provedores só existem nas funções `/api`.
- RLS: cada organizador só vê os próprios atletas, cobranças e agenda; a página pública expõe só os dados de uma cobrança pelo UUID.

## Modo SaaS (vender para escolinhas, várzea e quadras)

- **Landing page**: quem não está logado vê a página de vendas (planos, teste grátis, WhatsApp). `/?entrar` abre direto o login.
- **Planos**: Básico R$ 49,90 (até 50 atletas) e Pro R$ 89,90 (até 200). Preços em `src/saas/plans.js` e `api/_lib/plans.js`.
- **Teste grátis de 14 dias** criado automaticamente com a organização. Plano e validade só mudam pelo servidor (trigger protege).
- **Limite suave**: o app avisa e bloqueia novos atletas acima do limite ou com plano vencido; o banco só bloqueia abuso (2x o limite).
- **Assinatura por Pix**: aba *Gestão → Plano* chama `/api/saas/subscribe`. O Pix cai na conta da plataforma (mesmo `PIX_PROVIDER`); o webhook `/api/pix/webhook` reconhece `saas:<id>` e libera 30 dias. Sem chaves = modo teste com botão "Simular pagamento".
- **Onboarding**: novo usuário sem organização vai direto para a Gestão, com checklist de primeiros passos.
- Variável nova: `VITE_SALES_WHATSAPP` (seu número com DDI, ex.: 5571999999999).
- Rode também a migration `supabase/migrations/20261030000003_rls_e_saas.sql` (corrige RLS das tabelas antigas).

## Para onde vai o dinheiro (importante)

- **Mensalidades, inscrições e aluguéis dos clientes**: sempre **Pix direto** na chave Pix da própria organização (configurada em Gestão → Configurações). O FitHub só gera o código; o organizador marca como pago.
- **Assinatura do FitHub (Básico/Pro)**: é a única coisa que passa pelo `PIX_PROVIDER` (Mercado Pago/Asaas) e cai na conta da plataforma.
- O servidor recusa gerar ou dar baixa em cobranças de clientes pelo provedor da plataforma. Só existe uma trava futura (`PIX_CLIENT_SPLIT_ENABLED=true` **e** `PIX_SPLIT_IMPLEMENTED=yes-subaccounts`) para quando houver split por subconta.
