// Planos do FitHub (SaaS). Ajuste os preços aqui e em api/_lib/plans.js.
export const PLANS = {
  basico: { id: 'basico', name: 'Básico', price: 49.9, athletes: 50, features: ['Até 50 atletas ativos', 'Mensalidades e inscrições por Pix', 'Lembrete no WhatsApp', 'Agenda de treinos e jogos', 'Página de pagamento para os pais'] },
  pro: { id: 'pro', name: 'Pro', price: 89.9, athletes: 200, features: ['Até 200 atletas ativos', 'Tudo do Básico', 'Baixa automática do Pix (Mercado Pago/Asaas)', 'Campeonatos e cobrança de inscrição por time', 'Suporte prioritário no WhatsApp'] }
}
export const TRIAL_DAYS = 14
export const TRIAL_LIMIT = 200

export function planState(org) {
  if (!org) return null
  const now = Date.now()
  const plan = org.plan || 'trial'
  if (plan === 'trial') {
    const end = new Date(org.trial_ends_at || now).getTime()
    const daysLeft = Math.ceil((end - now) / 86400000)
    return { plan, label: 'Teste grátis', active: daysLeft > 0, daysLeft, limit: TRIAL_LIMIT }
  }
  const end = org.plan_expires_at ? new Date(org.plan_expires_at).getTime() : 0
  const daysLeft = Math.ceil((end - now) / 86400000)
  return { plan, label: PLANS[plan]?.name || plan, active: daysLeft > -3, daysLeft, limit: PLANS[plan]?.athletes || 50 }
}

export function salesWhatsAppLink(text = 'Olá! Quero conhecer o FitHub para minha escolinha/campeonato.') {
  const n = (import.meta.env.VITE_SALES_WHATSAPP || '').replace(/\D/g, '')
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`
}
