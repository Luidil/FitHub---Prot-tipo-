import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey)

if (!isSupabaseConfigured) {
  console.error('FitHub: defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env (veja .env.example).')
}

// Cliente com valores fictícios quando não configurado, para a UI exibir o aviso em vez de quebrar.
export const supabase = createClient(
  supabaseUrl || 'https://nao-configurado.supabase.co',
  supabaseKey || 'chave-nao-configurada'
)
