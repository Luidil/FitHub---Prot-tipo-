import { adminClient, getProvider, loadOwnedCharge, markPaid, readBody, send } from '../_lib/server.js'

// Só no modo mock (sem chaves de provedor): simula a confirmação do Pix como se fosse o webhook.
export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Use POST.' })
  if (getProvider() !== 'mock') return send(res, 403, { error: 'Simulação desativada: há um provedor real configurado.' })
  try {
    const { chargeId } = await readBody(req)
    const db = adminClient()
    const charge = await loadOwnedCharge(req, db, chargeId)
    await markPaid(db, charge.id)
    return send(res, 200, { ok: true })
  } catch (e) {
    return send(res, e.status || 500, { error: e.message || 'Erro interno.' })
  }
}
