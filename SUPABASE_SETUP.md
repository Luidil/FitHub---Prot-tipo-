# Configuração do Supabase para FitHub

## 1. Criar as Tabelas

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá para o projeto: `lwzdkfwemrpejxqlzhgl`
3. Clique em **SQL Editor** no menu lateral
4. Copie o conteúdo de `db/supabase-schema.sql`
5. Cole no editor e clique em **Run**

## 2. Configurar Autenticação

### Habilitar Email/Password
1. Vá em **Authentication** > **Providers**
2. Confirme que "Email" está habilitado
3. (Opcional) Desabilite "Confirm email" para testes

### (Opcional) Login Social
1. Em **Providers**, habilite Google/GitHub/etc
2. Configure os OAuth credentials

## 3. Verificar RLS (Row Level Security)

O schema já inclui políticas RLS. Verifique se estão ativas:

1. Vá em **Table Editor**
2. Para cada tabela, clique nos 3 pontos → **View policies**
3. Confirme que as políticas estão listadas

## 4. Testar a Conexão

```bash
npm run dev
```

Abra o console do navegador e teste:

```javascript
import { supabase } from './src/supabase'

// Listar venues
const { data } = await supabase.from('venues').select('*')
console.log(data)
```

## 5. Estrutura dos Arquivos

```
src/
├── supabase.js          # Cliente Supabase configurado
├── supabaseService.js   # Funções de serviço (CRUD)
└── useSupabase.js       # Hooks React para auth e dados
```

## 6. Como Usar

### Autenticação

```jsx
import { useSupabaseAuth } from './useSupabase'

function LoginForm() {
  const { signIn, signUp, signOut, user, loading } = useSupabaseAuth()

  const handleLogin = async () => {
    const { error } = await signIn('email@exemplo.com', 'senha123')
    if (error) alert(error.message)
  }

  if (loading) return <p>Carregando...</p>
  if (user) return <button onClick={signOut}>Sair</button>
  
  return <button onClick={handleLogin}>Entrar</button>
}
```

### Buscar Dados

```jsx
import { useSupabaseData } from './useSupabase'

function EventsList() {
  const { data: events, loading } = useSupabaseData('events', {
    select: '*, venue:venues(*)',
    order: { column: 'datetime', ascending: true },
    realtime: true // Atualiza automaticamente quando mudar
  })

  if (loading) return <p>Carregando...</p>

  return (
    <ul>
      {events.map(ev => <li key={ev.id}>{ev.sport}</li>)}
    </ul>
  )
}
```

### Funções de Serviço

```jsx
import * as db from './supabaseService'

// Criar evento
await db.createEvent({
  sport: 'Futebol 5x5',
  venue_id: 'uuid-da-venue',
  datetime: '2025-12-15T19:00:00',
  slots_total: 10,
  creator_id: user.id
}, ['Gols', 'Assistências'])

// Entrar em evento
await db.joinEvent(eventId, userId)

// Check-in
await db.checkIn(eventId, userId, 'photo')
```

## 7. Migração Gradual

O app atualmente usa localStorage. Para migrar gradualmente:

1. Mantenha o localStorage como fallback
2. Sincronize com Supabase quando online
3. Migre componente por componente

Exemplo de hook híbrido:

```jsx
function useHybridData(key, supabaseTable) {
  const local = useLocalStorage(key)
  const cloud = useSupabaseData(supabaseTable)
  
  // Preferir dados da nuvem quando disponíveis
  return cloud.data.length > 0 ? cloud : local
}
```

## 8. URLs Úteis

- **Dashboard**: https://supabase.com/dashboard/project/lwzdkfwemrpejxqlzhgl
- **API Docs**: https://supabase.com/dashboard/project/lwzdkfwemrpejxqlzhgl/api
- **SQL Editor**: https://supabase.com/dashboard/project/lwzdkfwemrpejxqlzhgl/sql
