import { createClient } from '@supabase/supabase-js'

export function env(name, fallback = '') {
  return process.env[name] || fallback
}

export function getProvider() {
  const p = env('PIX_PROVIDER', 'mock').toLowerCase()
  if (p === 'mercadopago' && !env('MERCADOPAGO_ACCESS_TOKEN')) return 'mock'
  if (p === 'asaas' && !env('ASAAS_API_KEY')) return 'mock'
  return ['mercadopago', 'asaas'].includes(p) ? p : 'mock'
}

export function adminClient() {
  const url = env('SUPABASE_URL') || env('VITE_SUPABASE_URL')
  const key = env('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) throw httpError(500, 'Servidor sem SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY configurados.')
  return createClient(url, key, { auth: { persistSession: false } })
}

export function httpError(status, message) {
  const e = new Error(message)
  e.status = status
  return e
}

export function send(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

export async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body
  if (typeof req.body === 'string') { try { return JSON.parse(req.body) } catch { return {} } }
  const chunks = []
  for await (const c of req) chunks.push(c)
  try { return JSON.parse(Buffer.concat(chunks).toString() || '{}') } catch { return {} }
}

// Garante que quem chama é o dono da organização da cobrança.
export async function loadOwnedCharge(req, db, chargeId) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!token) throw httpError(401, 'Faça login.')
  const { data: u, error } = await db.auth.getUser(token)
  if (error || !u?.user) throw httpError(401, 'Sessão inválida.')
  const { data: charge } = await db.from('charges').select('*, organizations(owner_id, name)').eq('id', chargeId).single()
  if (!charge) throw httpError(404, 'Cobrança não encontrada.')
  if (charge.organizations?.owner_id !== u.user.id) throw httpError(403, 'Sem permissão.')
  return charge
}

export async function markPaid(db, chargeId, providerPaymentId) {
  let q = db.from('charges').update({ status: 'pago', paid_at: new Date().toISOString() }).eq('id', chargeId).neq('status', 'pago')
  if (providerPaymentId) q = q.eq('provider_payment_id', String(providerPaymentId))
  const { error } = await q
  if (error) throw error
}

// ---------- Mercado Pago ----------
export async function mercadoPagoCreate(charge, baseUrl) {
  const body = {
    transaction_amount: Number(charge.amount),
    description: charge.description,
    payment_method_id: 'pix',
    external_reference: charge.id,
    notification_url: `${baseUrl}/api/pix/webhook?provider=mercadopago`,
    payer: { email: env('MERCADOPAGO_PAYER_EMAIL_FALLBACK', 'pagador@fithub.app'), first_name: charge.payer_name }
  }
  const r = await fetch('https://api.mercadopago.com/v1/payments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env('MERCADOPAGO_ACCESS_TOKEN')}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': `fithub-${charge.id}`
    },
    body: JSON.stringify(body)
  })
  const j = await r.json()
  if (!r.ok) throw httpError(502, `Mercado Pago: ${j.message || r.status}`)
  const td = j.point_of_interaction?.transaction_data || {}
  return { provider_payment_id: String(j.id), pix_copy_paste: td.qr_code, pix_qr_base64: td.qr_code_base64 }
}

export async function mercadoPagoGet(paymentId) {
  const r = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${env('MERCADOPAGO_ACCESS_TOKEN')}` }
  })
  if (!r.ok) throw httpError(502, 'Não foi possível consultar o pagamento no Mercado Pago.')
  return r.json()
}

// ---------- Asaas ----------
function asaasBase() {
  return env('ASAAS_ENV', 'sandbox') === 'production' ? 'https://api.asaas.com/v3' : 'https://api-sandbox.asaas.com/v3'
}
async function asaas(path, init = {}) {
  const r = await fetch(asaasBase() + path, {
    ...init,
    headers: { access_token: env('ASAAS_API_KEY'), 'Content-Type': 'application/json', 'User-Agent': 'FitHub' }
  })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw httpError(502, `Asaas: ${j.errors?.[0]?.description || r.status}`)
  return j
}

export async function asaasCreate(charge, payerCpf) {
  if (!payerCpf) throw httpError(400, 'O Asaas exige o CPF/CNPJ do pagador.')
  const customer = await asaas('/customers', {
    method: 'POST',
    body: JSON.stringify({ name: charge.payer_name, cpfCnpj: String(payerCpf).replace(/\D/g, ''), mobilePhone: charge.payer_phone || undefined })
  })
  const payment = await asaas('/payments', {
    method: 'POST',
    body: JSON.stringify({
      customer: customer.id, billingType: 'PIX', value: Number(charge.amount),
      dueDate: charge.due_date < new Date().toISOString().slice(0, 10) ? new Date().toISOString().slice(0, 10) : charge.due_date,
      description: charge.description, externalReference: charge.id
    })
  })
  const qr = await asaas(`/payments/${payment.id}/pixQrCode`)
  return { provider_payment_id: payment.id, pix_copy_paste: qr.payload, pix_qr_base64: qr.encodedImage }
}

export function baseUrlFrom(req) {
  if (env('PUBLIC_APP_URL')) return env('PUBLIC_APP_URL').replace(/\/$/, '')
  const proto = req.headers['x-forwarded-proto'] || 'https'
  return `${proto}://${req.headers['x-forwarded-host'] || req.headers.host}`
}
