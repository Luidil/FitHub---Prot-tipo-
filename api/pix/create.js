import { adminClient, getProvider, loadOwnedCharge, mercadoPagoCreate, asaasCreate, baseUrlFrom, readBody, send } from '../_lib/server.js'

// POST /api/pix/create  { chargeId, payerCpf? }  -> gera o Pix da cobrança no provedor configurado
export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Use POST.' })
  try {
    const { chargeId, payerCpf } = await readBody(req)
    if (!chargeId) return send(res, 400, { error: 'chargeId obrigatório.' })
    const db = adminClient()
    const charge = await loadOwnedCharge(req, db, chargeId)
    if (charge.status === 'pago') return send(res, 400, { error: 'Cobrança já paga.' })

    const provider = getProvider()
    let result
    if (provider === 'mercadopago') result = await mercadoPagoCreate(charge, baseUrlFrom(req))
    else if (provider === 'asaas') result = await asaasCreate(charge, payerCpf)
    else result = { provider_payment_id: `mock_${charge.id}`, pix_copy_paste: null, pix_qr_base64: null }

    const { data, error } = await db.from('charges').update({ provider, ...result }).eq('id', charge.id).select().single()
    if (error) throw error
    return send(res, 200, { provider, charge: data })
  } catch (e) {
    console.error(e)
    return send(res, e.status || 500, { error: e.message || 'Erro interno.' })
  }
}
