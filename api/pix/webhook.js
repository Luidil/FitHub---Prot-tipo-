import { adminClient, env, getProvider, markAnyPaid, mercadoPagoGet, readBody, send } from '../_lib/server.js'

// Webhook dos provedores. Configure a URL: https://SEU-APP.vercel.app/api/pix/webhook?provider=mercadopago|asaas
export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Use POST.' })
  try {
    const body = await readBody(req)
    const provider = (req.query?.provider || getProvider()).toLowerCase()
    const db = adminClient()

    if (provider === 'mercadopago') {
      const paymentId = body?.data?.id || req.query?.['data.id'] || req.query?.id
      if (!paymentId || (body.type && body.type !== 'payment')) return send(res, 200, { ignored: true })
      // Nunca confia no corpo: consulta o pagamento direto na API do Mercado Pago.
      const p = await mercadoPagoGet(paymentId)
      if (p.status === 'approved' && p.external_reference) await markAnyPaid(db, p.external_reference, p.id)
      return send(res, 200, { ok: true, status: p.status })
    }

    if (provider === 'asaas') {
      const expected = env('ASAAS_WEBHOOK_TOKEN')
      if (!expected || req.headers['asaas-access-token'] !== expected) return send(res, 401, { error: 'Token inválido.' })
      const ev = body?.event
      const pay = body?.payment
      if (['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED'].includes(ev) && pay?.externalReference) {
        await markAnyPaid(db, pay.externalReference, pay.id)
      }
      return send(res, 200, { ok: true })
    }

    return send(res, 200, { ignored: true })
  } catch (e) {
    console.error(e)
    return send(res, e.status || 500, { error: e.message || 'Erro interno.' })
  }
}
