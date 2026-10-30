import React, { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { buildPixCopyPaste, chargeStatus, formatBRL } from './pix'
import './billing.css'

// Página pública: /?pagar=<id da cobrança>. Não exige login.
export default function PayPage({ chargeId }) {
  const [c, setC] = useState(null)
  const [err, setErr] = useState('')
  const [copied, setCopied] = useState(false)

  async function load() {
    const { data, error } = await supabase.rpc('public_charge', { charge_id: chargeId })
    if (error) return setErr('Não foi possível carregar a cobrança. Tente novamente.')
    if (!data?.length) return setErr('Cobrança não encontrada ou cancelada.')
    setC(data[0])
  }
  useEffect(() => {
    load()
    const t = setInterval(load, 15000) // atualiza o status depois do pagamento
    return () => clearInterval(t)
  }, [chargeId])

  const code = c && (c.pix_copy_paste || (c.pix_key ? buildPixCopyPaste({ key: c.pix_key, name: c.pix_merchant_name || c.organization_name, city: c.city, amount: c.amount, txid: c.id.replace(/-/g, '').slice(0, 25) }) : ''))
  const st = c && chargeStatus(c)

  return (
    <div className="login-shell">
      <div className="login-card billing b-pay">
        <p className="eyebrow">⚡ FitHub · Pagamento</p>
        {err && <p className="b-error">{err}</p>}
        {!c && !err && <p className="lead">Carregando...</p>}
        {c && (
          <>
            <h2>{c.organization_name}</h2>
            <p className="lead">{c.description}</p>
            <p><strong className="b-amount">{formatBRL(c.amount)}</strong></p>
            <p className="meta">Pagador: {c.payer_name} · Vencimento {new Date(c.due_date + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
            <span className={`b-badge b-${st}`}>{st === 'pago' ? 'Pago ✅' : st === 'atrasado' ? 'Atrasado' : 'Pendente'}</span>
            {st !== 'pago' && code && (
              <div className="b-pix">
                {c.pix_qr_base64
                  ? <img alt="QR Code Pix" src={`data:image/png;base64,${c.pix_qr_base64}`} />
                  : <img alt="QR Code Pix" src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(code)}`} />}
                <textarea readOnly rows={4} value={code} />
                <button className="primary" onClick={() => navigator.clipboard?.writeText(code).then(() => setCopied(true))}>
                  {copied ? 'Copiado! Cole no app do seu banco' : 'Copiar Pix Copia e Cola'}
                </button>
              </div>
            )}
            {st !== 'pago' && !code && <p className="meta">O organizador ainda não gerou o Pix desta cobrança.</p>}
          </>
        )}
      </div>
    </div>
  )
}
