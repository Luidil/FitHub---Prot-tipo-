import { supabase } from '../supabase'

// Chama as funções serverless (/api) da Vercel. Se não estiverem disponíveis
// (ex.: rodando só com `npm run dev`), o app cai no modo "Pix direto"/manual.
export async function callApi(path, body) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(`/api/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {})
    },
    body: JSON.stringify(body || {})
  })
  const type = res.headers.get('content-type') || ''
  if (!type.includes('application/json')) throw new Error('API de pagamentos indisponível neste ambiente.')
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Erro na API de pagamentos.')
  return json
}
