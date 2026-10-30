// Gerador de "Pix Copia e Cola" (BR Code estático, padrão EMV do Banco Central).
// Usado no modo "Pix direto": funciona sem provedor, com a chave Pix do organizador.
function field(id, value) {
  const v = String(value)
  return id + String(v.length).padStart(2, '0') + v
}

function crc16(payload) {
  let crc = 0xffff
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1
      crc &= 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

function clean(text, max) {
  return String(text || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, '').trim().slice(0, max) || 'NA'
}

export function buildPixCopyPaste({ key, name, city, amount, txid }) {
  if (!key) return ''
  const account = field('00', 'br.gov.bcb.pix') + field('01', key.trim())
  let payload =
    field('00', '01') +
    field('26', account) +
    field('52', '0000') +
    field('53', '986') +
    (amount ? field('54', Number(amount).toFixed(2)) : '') +
    field('58', 'BR') +
    field('59', clean(name, 25)) +
    field('60', clean(city, 15)) +
    field('62', field('05', String(txid || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 25) || '***'))
  payload += '6304'
  return payload + crc16(payload)
}

export function formatBRL(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function todayISO() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

export function chargeStatus(charge) {
  if (charge.status === 'pago') return 'pago'
  if (charge.status === 'cancelado') return 'cancelado'
  return charge.due_date < todayISO() ? 'atrasado' : 'pendente'
}

export function onlyDigits(phone) {
  let d = String(phone || '').replace(/\D/g, '')
  if (d && d.length <= 11) d = '55' + d
  return d
}

export function payLink(chargeId) {
  const base = import.meta.env.VITE_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')
  return `${base.replace(/\/$/, '')}/?pagar=${chargeId}`
}

export function whatsappReminderLink(charge, orgName) {
  const status = chargeStatus(charge)
  const venc = new Date(charge.due_date + 'T12:00:00').toLocaleDateString('pt-BR')
  const intro = status === 'atrasado'
    ? `Olá, ${charge.payer_name}! Tudo bem? Passando para lembrar que a cobrança "${charge.description}" de ${formatBRL(charge.amount)} venceu em ${venc}.`
    : `Olá, ${charge.payer_name}! Segue a cobrança "${charge.description}" de ${formatBRL(charge.amount)}, com vencimento em ${venc}.`
  const text = `${intro}\n\nPague por Pix aqui: ${payLink(charge.id)}${charge.pix_copy_paste ? `\n\nPix Copia e Cola:\n${charge.pix_copy_paste}` : ''}\n\nObrigado! ${orgName || ''}`.trim()
  const phone = onlyDigits(charge.payer_phone)
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
}
