import { useState, useEffect } from 'react'
import { supabase } from './supabase'

export function useSupabaseAuth() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Erro ao buscar perfil:', error)
    } finally {
      setLoading(false)
    }
  }

  async function signUp(email, password, name) {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      })
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  async function signIn(email, password) {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  async function signOut() {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
      setProfile(null)
    } catch (error) {
      console.error('Erro ao sair:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateProfile(updates) {
    if (!user) return { error: new Error('Não autenticado') }
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()
      
      if (error) throw error
      setProfile(data)
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  return {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    isAuthenticated: !!user
  }
}

export function useSupabaseData(table, options = {}) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const { select = '*', order, filter, realtime = false } = options

  useEffect(() => {
    fetchData()

    if (realtime) {
      const channel = supabase
        .channel(`${table}-changes`)
        .on('postgres_changes',
          { event: '*', schema: 'public', table },
          () => fetchData()
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [table, select, JSON.stringify(order), JSON.stringify(filter)])

  async function fetchData() {
    setLoading(true)
    try {
      let query = supabase.from(table).select(select)
      
      if (filter) {
        Object.entries(filter).forEach(([key, value]) => {
          query = query.eq(key, value)
        })
      }
      
      if (order) {
        query = query.order(order.column, { ascending: order.ascending ?? true })
      }

      const { data: result, error: queryError } = await query

      if (queryError) throw queryError
      setData(result || [])
      setError(null)
    } catch (err) {
      setError(err)
      console.error(`Erro ao buscar ${table}:`, err)
    } finally {
      setLoading(false)
    }
  }

  async function insert(record) {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert([record])
        .select()
        .single()
      
      if (error) throw error
      setData(prev => [...prev, result])
      return { data: result, error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  }

  async function update(id, updates) {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      setData(prev => prev.map(item => item.id === id ? result : item))
      return { data: result, error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  }

  async function remove(id) {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id)
      
      if (error) throw error
      setData(prev => prev.filter(item => item.id !== id))
      return { error: null }
    } catch (err) {
      return { error: err }
    }
  }

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    insert,
    update,
    remove
  }
}
