import { adminClient, asaasCreate, baseUrlFrom, env, getProvider, mercadoPagoCreate, readBody, send, userFromReq, markSaasPaid } from '../_lib/server.js'
import { PLAN_PRICES } from '../_lib/plans.js'

// POST { plan: 'basico'|'pro', cpf?, simulate?: invoiceId }
// Gera a fatura mensal da assinatura do organizador (Pix da PLATAFORMA). Sem chaves -> modo mock.
export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Use POST.' })
  try {
    const body = await readBody(req)
    const db = adminClient()
    const user = await userFromReq(req, db)
    const { data: org } = await db.from('organizations').select('*').eq('owner_id', user.id).limit(1).single()
    if (!org) return send(res, 400, { error: 'Crie sua organização primeiro.' })

    if (body.simulate) {
      if (getProvider() !== 'mock') return send(res, 403, { error: 'Simulação desativada.' })
      const { data: inv } = await db.from('saas_invoices').select('id, organization_id').eq('id', body.simulate).single()
      if (!inv || inv.organization_id !== org.id) return send(res, 404, { error: 'Fatura não encontrada.' })
      await markSaasPaid(db, inv.id)
      return send(res, 200, { ok: true })
    }

    const plan = body.plan
    if (!PLAN_PRICES[plan]) return send(res, 400, { error: 'Plano inválido.' })
    const amount = PLAN_PRICES[plan]
    const { data: inv, error } = await db.from('saas_invoices')
      .insert({ organization_id: org.id, plan, amount, provider: getProvider() }).select().single()
    if (error) throw error

    const provider = getProvider()
    const charge = {
      id: inv.id, external_reference: `saas:${inv.id}`, amount, payer_name: org.name, payer_phone: org.whatsapp,
      description: `FitHub plano ${plan} - 30 dias`, due_date: new Date().toISOString().slice(0, 10)
    }
    let pix
    if (provider === 'mercadopago') pix = await mercadoPagoCreate(charge, baseUrlFrom(req))
    else if (provider === 'asaas') pix = await asaasCreate(charge, body.cpf)
    else pix = { provider_payment_id: null, pix_copy_paste: `MOCK-PIX-FITHUB-${inv.id}`, pix_qr_base64: null }

    const { data: saved } = await db.from('saas_invoices').update(pix).eq('id', inv.id).select().single()
    return send(res, 200, { invoice: saved, provider, salesKey: env('PLATFORM_NAME', 'FitHub') })
  } catch (e) {
    console.error(e)
    return send(res, e.status || 500, { error: e.message || 'Erro interno.' })
  }
}
