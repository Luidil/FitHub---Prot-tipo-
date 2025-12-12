import React, { useState, useEffect, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet/dist/leaflet.css'
import { supabase } from './supabase'

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
})

const SPORT_STATS_PRESETS = {
  futebol: ['Gols', 'Assistências', 'Finalizações', 'Km percorridos'],
  basquete: ['Pontos', 'Assistências', 'Rebotes', 'Bolas recuperadas'],
  volei: ['Aces', 'Bloqueios', 'Defesas', 'Eficiência de ataque'],
  tenis: ['Aces', 'Duplas faltas', 'Primeiro saque %', 'Quebras'],
  corrida: ['Ritmo médio', 'Passadas por minuto', 'Frequência cardíaca', 'Negativos no fim'],
  generico: ['Participação confirmada', 'Pontuação Fair Play']
}

function statsPresetFor(rawSport) {
  const normalized = (rawSport || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  if (normalized.includes('fut')) return [...SPORT_STATS_PRESETS.futebol]
  if (normalized.includes('basq')) return [...SPORT_STATS_PRESETS.basquete]
  if (normalized.includes('vole')) return [...SPORT_STATS_PRESETS.volei]
  if (normalized.includes('tenis')) return [...SPORT_STATS_PRESETS.tenis]
  if (normalized.includes('corrid')) return [...SPORT_STATS_PRESETS.corrida]
  return [...SPORT_STATS_PRESETS.generico]
}

const PLAYER_DIRECTORY = {
  lucas: { name: 'Lucas Santiago', quadra: 'Arena X', cidade: 'Salvador', estado: 'BA', idade: 29 },
  mariana: { name: 'Mariana Lopes', quadra: 'Poliesportivo Y', cidade: 'Salvador', estado: 'BA', idade: 24 },
  pedro: { name: 'Pedro Souza', quadra: 'Quadra 3', cidade: 'Lauro de Freitas', estado: 'BA', idade: 31 },
  ana_runner: { name: 'Ana Runner', quadra: 'Orla Barra', cidade: 'Salvador', estado: 'BA', idade: 34 }
}

const SALVADOR_LOCATIONS = [
  {
    id: 'arena_x',
    label: 'Quadra Arena X · Pituba',
    tipo: 'Sintética',
    bairro: 'Pituba',
    superficie: 'grama sintética',
    lat: -12.9995,
    lng: -38.4494,
    photo: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=800&q=75'
  },
  {
    id: 'poliesportivo_y',
    label: 'Poliesportivo Y · Barris',
    tipo: 'Ginásio coberto',
    bairro: 'Barris',
    superficie: 'madeira',
    lat: -12.9825,
    lng: -38.5145,
    photo: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d4?auto=format&fit=crop&w=800&q=75'
  },
  {
    id: 'quadra_3',
    label: 'Quadra 3 · Stiep',
    tipo: 'Areia',
    bairro: 'Stiep',
    superficie: 'areia',
    lat: -12.9858,
    lng: -38.4557,
    photo: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=75'
  },
  {
    id: 'areia_ribeira',
    label: 'Arena de Areia Ribeira',
    tipo: 'Areia',
    bairro: 'Ribeira',
    superficie: 'areia',
    lat: -12.9184,
    lng: -38.5046,
    photo: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=800&q=75'
  },
  {
    id: 'condominio_lagos',
    label: 'Condomínio Lagos · Paralela',
    tipo: 'Quadra de condomínio',
    bairro: 'Paralela',
    superficie: 'piso flexível',
    lat: -12.9095,
    lng: -38.3698,
    photo: 'https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf?auto=format&fit=crop&w=800&q=75'
  },
  {
    id: 'orla_barra',
    label: 'Orla da Barra · Pista 5 km',
    tipo: 'Corrida',
    bairro: 'Barra',
    superficie: 'asfalto',
    lat: -13.0104,
    lng: -38.5326,
    photo: 'https://images.unsplash.com/photo-1508606572321-901ea443707f?auto=format&fit=crop&w=800&q=75'
  },
  {
    id: 'condominio_mar_azul',
    label: 'Condomínio Mar Azul · Jaguaribe',
    tipo: 'Quadra de areia',
    bairro: 'Jaguaribe',
    superficie: 'areia',
    lat: -12.9508,
    lng: -38.4128,
    photo: 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?auto=format&fit=crop&w=800&q=75'
  }
]

const DEFAULT_TEAMS = [
  {
    id: 'tigers',
    name: 'Salvador Tigers',
    sport: 'Futebol 5x5',
    captain: 'Lucas Santiago',
    members: ['Lucas Santiago', 'João Vilar', 'Caio Silva', 'Igor Passos'],
    lastPing: null,
    pingResponses: {}
  }
]

const DEFAULT_FRIENDS = [
  { id: 'ana', name: 'Ana Runner', status: 'Correndo na orla' },
  { id: 'mariana', name: 'Mariana Lopes', status: 'Livre pra basquete' }
]

const DEFAULT_CHAT = [
  { id: 'msg1', from: 'Ana Runner', text: 'Bora 5 km amanhã 6h?', timestamp: Date.now() - 1000 * 60 * 30 },
  { id: 'msg2', from: 'Você', text: 'Confirmado! Levo o time.', timestamp: Date.now() - 1000 * 60 * 15 }
]

const DEFAULT_STORIES = [
  {
    id: 'story1',
    athlete: 'Lucas Santiago',
    eventName: 'Pelada 5x5 · Pituba',
    venue: 'Quadra Arena X',
    beforePhoto: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=500&q=80',
    afterPhoto: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=500&q=80',
    caption: 'Antes e depois do treino — check-in feito com o squad inteiro.',
    createdAt: Date.now() - 1000 * 60 * 45
  },
  {
    id: 'story2',
    athlete: 'Mariana Lopes',
    eventName: 'Basquete 3x3 · Barris',
    venue: 'Poliesportivo Y',
    beforePhoto: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=500&q=80',
    afterPhoto: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&w=500&q=80',
    caption: 'Quadra cheia + foto final pra liberar no Stories.',
    createdAt: Date.now() - 1000 * 60 * 60 * 2
  }
]

const DEFAULT_KIDS = [
  { id: 'kid1', name: 'Theo Santiago', age: 10, sport: 'Futebol Society', guardian: 'Lucas Santiago' }
]

const DEFAULT_CHAMPIONSHIPS = [
  {
    id: 'champ1',
    name: 'Copa FitHub Sub-11',
    sport: 'Futebol Society',
    category: 'Sub-11',
    fee: 25,
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    description: 'Rodadas rápidas aos sábados · Pais confirmam via app.',
    prizes: '1º lugar: Troféu + Medalhas | 2º: Medalhas',
    rules: 'Jogos de 2 tempos de 10min. Cartão vermelho = suspensão.',
    maxTeams: 8,
    playersPerTeam: 5,
    registrations: ['kid1'],
    teams: [
      { id: 'team1', name: 'Tigres FC', members: ['Lucas', 'João', 'Pedro'], captain: 'Lucas' }
    ],
    soloPlayers: []
  }
]

const DEFAULT_RANKING = {
  lucas: 42,
  mariana: 36,
  pedro: 28,
  ana_runner: 31
}

const defaultEvents = [
  {
    id: 'e1',
    sport: 'Futebol 5x5',
    venue: 'Quadra Arena X — Salvador',
    venueId: 'arena_x',
    venuePhoto: SALVADOR_LOCATIONS.find(v => v.id === 'arena_x')?.photo,
    datetime: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    slots_total: 10,
    slots_taken: 6,
    price_per_player: 1,
    creator: 'Lucas',
    level: 'Intermediário',
    stats: statsPresetFor('Futebol 5x5')
  },
  {
    id: 'e2',
    sport: 'Basquete 3x3',
    venue: 'Poliesportivo Y — Salvador',
    venueId: 'poliesportivo_y',
    venuePhoto: SALVADOR_LOCATIONS.find(v => v.id === 'poliesportivo_y')?.photo,
    datetime: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    slots_total: 6,
    slots_taken: 2,
    price_per_player: 1,
    creator: 'Mariana',
    level: 'Iniciante',
    stats: statsPresetFor('Basquete 3x3')
  },
  {
    id: 'e3',
    sport: 'Vôlei 6x6',
    venue: 'Quadra 3 — Salvador',
    venueId: 'quadra_3',
    venuePhoto: SALVADOR_LOCATIONS.find(v => v.id === 'quadra_3')?.photo,
    datetime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    slots_total: 12,
    slots_taken: 9,
    price_per_player: 1,
    creator: 'Pedro',
    level: 'Avançado',
    stats: statsPresetFor('Vôlei 6x6')
  },
  {
    id: 'e4',
    sport: 'Corrida em grupo · 5 km',
    venue: 'Orla da Barra — Salvador',
    venueId: 'orla_barra',
    venuePhoto: SALVADOR_LOCATIONS.find(v => v.id === 'orla_barra')?.photo,
    datetime: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
    slots_total: 25,
    slots_taken: 12,
    price_per_player: 1,
    creator: 'Ana Runner',
    level: 'Todos os ritmos',
    stats: statsPresetFor('Corrida')
  },
  {
    id: 'e5',
    sport: 'Futebol de areia',
    venue: 'Arena de Areia Ribeira — Salvador',
    venueId: 'areia_ribeira',
    venuePhoto: SALVADOR_LOCATIONS.find(v => v.id === 'areia_ribeira')?.photo,
    datetime: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    slots_total: 12,
    slots_taken: 8,
    price_per_player: 1,
    creator: 'Caio',
    level: 'Intermediário',
    stats: statsPresetFor('Vôlei 6x6')
  },
  {
    id: 'e6',
    sport: 'Basquete 5x5',
    venue: 'Poliesportivo Y — Salvador',
    venueId: 'poliesportivo_y',
    venuePhoto: SALVADOR_LOCATIONS.find(v => v.id === 'poliesportivo_y')?.photo,
    datetime: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    slots_total: 10,
    slots_taken: 7,
    price_per_player: 1,
    creator: 'Marcos',
    level: 'Avançado',
    stats: ['Pontos', 'Assistências', 'Rebotes', 'Roubos']
  }
]

function hydrateEvents(list) {
  const source = Array.isArray(list) ? list : defaultEvents
  return source.map(ev => ({
    ...ev,
    stats: Array.isArray(ev.stats) && ev.stats.length ? ev.stats : statsPresetFor(ev.sport)
  }))
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

const FUND_SHARE = 0.5
const FEE = 1
const DISCOUNT_PLAN = {
  weeklyBase: 4,
  promoValue: 3.5,
  requirement: 'Usar por 4 semanas seguidas'
}
const AUTH_USER = {
  id: 'lucas',
  name: 'Lucas Santiago',
  city: 'Salvador',
  role: 'player'
}
const AUTH_PASSWORD = '123'

const AUTH_MASTER = {
  id: 'admin',
  name: 'Luidil Gois',
  city: 'Salvador',
  role: 'master'
}
const MASTER_PASSWORD = '123'

const STORAGE_KEYS = {
  events: 'demo_events',
  joined: 'demo_joined',
  fund: 'demo_fund',
  ranking: 'demo_ranking',
  user: 'demo_user',
  performance: 'demo_performance',
  history: 'demo_history',
  venues: 'demo_venues',
  teams: 'demo_teams',
  friends: 'demo_friends',
  chat: 'demo_chat',
  notifications: 'demo_notifications',
  stories: 'demo_stories',
  championships: 'demo_championships',
  kids: 'demo_kids',
  cancellations: 'demo_cancellations',
  billing: 'demo_billing'
}

const CANCEL_THRESHOLD = 3
const SUSPENSION_DAYS = 7
const CANCEL_PENALTY_POINTS = 2

const currentMonthId = () => new Date().toISOString().slice(0, 7)

const hasWindow = () => typeof window !== 'undefined'

function pickProof(method, onConfirm) {
  if (!hasWindow() || typeof onConfirm !== 'function') return
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = method === 'photo' ? 'image/*' : 'video/*'
  input.capture = 'environment'

  input.onchange = () => {
    const file = input.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      onConfirm(url)
      return
    }

    const promptLabel = method === 'photo'
      ? 'Cole o link da foto do check-in'
      : 'Cole o link do vídeo (Drive, YouTube...)'
    const link = window.prompt(promptLabel, '')
    if (link) onConfirm(link.trim())
  }

  input.click()
}

function readLocalJSON(key, fallback) {
  if (!hasWindow()) return fallback
  const raw = window.localStorage.getItem(key)
  if (!raw) return fallback
  try {
    const parsed = JSON.parse(raw)
    return typeof parsed === 'undefined' ? fallback : parsed
  } catch {
    return fallback
  }
}

function readLocalNumber(key, fallback) {
  if (!hasWindow()) return fallback
  const raw = window.localStorage.getItem(key)
  if (!raw) return fallback
  const asNumber = Number(raw)
  return Number.isNaN(asNumber) ? fallback : asNumber
}

function persistJSON(key, value) {
  if (!hasWindow()) return
  window.localStorage.setItem(key, JSON.stringify(value))
}

function persistString(key, value) {
  if (!hasWindow()) return
  window.localStorage.setItem(key, value)
}

function removeKey(key) {
  if (!hasWindow()) return
  window.localStorage.removeItem(key)
}

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState([])
  const [swipeIndex, setSwipeIndex] = useState(0)
  const [view, setView] = useState('home')
  const [joined, setJoined] = useState({})
  const [fund, setFund] = useState(0)
  const [ranking, setRanking] = useState({})
  const [performance, setPerformance] = useState({ totals: {}, videos: [] })
  const [history, setHistory] = useState([])
  const [venues, setVenues] = useState([])
  const [teams, setTeams] = useState([])
  const [friends, setFriends] = useState([])
  const [chatMessages, setChatMessages] = useState([])
  const [notifications, setNotifications] = useState([])
  const [stories, setStories] = useState([])
  const [championships, setChampionships] = useState([])
  const [kids, setKids] = useState([])
  const [cancellations, setCancellations] = useState({ count: 0, suspendedUntil: null })
  const [billing, setBilling] = useState({ month: currentMonthId(), paid: false })
  const [userLocation, setUserLocation] = useState(null)
  const [toast, setToast] = useState({ message: '', type: 'info', visible: false })
  const [authError, setAuthError] = useState('')
  const [showPayments, setShowPayments] = useState(false)
  const [activePerformance, setActivePerformance] = useState(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [activeFriend, setActiveFriend] = useState(null)

  // =============================================
  // SUPABASE: Auth listener
  // =============================================
  useEffect(() => {
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Escutar mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await loadUserProfile(session.user.id)
        } else {
          setUser(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function loadUserProfile(userId) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) throw error
      setUser({ ...profile, id: userId })
    } catch (err) {
      console.error('Erro ao carregar perfil:', err)
    } finally {
      setLoading(false)
    }
  }

  // =============================================
  // SUPABASE: Carregar dados iniciais
  // =============================================
  useEffect(() => {
    loadVenues()
    loadEvents()
    loadTeams()
    loadChampionships()
  }, [])

  async function loadVenues() {
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .order('name')
      if (error) throw error
      setVenues(data || [])
    } catch (err) {
      console.error('Erro ao carregar venues:', err)
      setVenues(SALVADOR_LOCATIONS) // fallback
    }
  }

  async function loadEvents() {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          venue:venues(*),
          creator:profiles(id, name),
          players:event_players(
            id, paid, checked_in, checkin_method,
            user:profiles(id, name)
          ),
          stats:event_stats(id, label)
        `)
        .order('datetime', { ascending: true })
      
      if (error) throw error
      
      // Transformar para formato esperado pelo app
      const formatted = (data || []).map(ev => ({
        id: ev.id,
        sport: ev.sport,
        venue: ev.venue ? `${ev.venue.name} — ${ev.venue.city}` : 'Local não definido',
        venueId: ev.venue_id,
        venuePhoto: SALVADOR_LOCATIONS.find(v => v.id === ev.venue_id)?.photo,
        datetime: ev.datetime,
        slots_total: ev.slots_total,
        slots_taken: ev.players?.length || 0,
        price_per_player: ev.price_per_player,
        creator: ev.creator?.name || 'Anônimo',
        creator_id: ev.creator_id,
        level: ev.level,
        stats: ev.stats?.map(s => s.label) || statsPresetFor(ev.sport),
        players: ev.players || []
      }))
      
      setEvents(formatted)
      
      // Atualizar joined baseado nos players
      if (user) {
        const userJoined = {}
        formatted.forEach(ev => {
          const myEntry = ev.players?.find(p => p.user?.id === user.id)
          if (myEntry) {
            userJoined[ev.id] = {
              checked_in: myEntry.checked_in,
              method: myEntry.checkin_method,
              paid: myEntry.paid
            }
          }
        })
        setJoined(userJoined)
      }
    } catch (err) {
      console.error('Erro ao carregar eventos:', err)
      setEvents(hydrateEvents(defaultEvents)) // fallback
    }
  }

  async function loadTeams() {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          captain:profiles(id, name),
          members:team_members(user:profiles(id, name))
        `)
        .order('name')
      
      if (error) throw error
      
      const formatted = (data || []).map(t => ({
        id: t.id,
        name: t.name,
        sport: t.sport,
        captain: t.captain?.name || 'Sem capitão',
        captain_id: t.captain_id,
        members: t.members?.map(m => m.user?.name) || [],
        lastPing: null,
        pingResponses: {}
      }))
      
      setTeams(formatted)
    } catch (err) {
      console.error('Erro ao carregar times:', err)
      setTeams(DEFAULT_TEAMS) // fallback
    }
  }

  async function loadChampionships() {
    try {
      const { data, error } = await supabase
        .from('championships')
        .select(`
          *,
          organizer:profiles(id, name),
          teams:championship_teams(team:teams(*))
        `)
        .order('start_date', { ascending: true })
      
      if (error) throw error
      
      const formatted = (data || []).map(c => ({
        id: c.id,
        name: c.name,
        sport: c.sport,
        category: c.category || '',
        fee: c.fee || 0,
        startDate: c.start_date,
        endDate: c.end_date,
        description: c.description || '',
        prizes: c.prizes || '',
        rules: c.rules || '',
        maxTeams: c.max_teams || 8,
        playersPerTeam: c.players_per_team || 5,
        organizer_id: c.organizer_id,
        registrations: [],
        teams: c.teams?.map(t => t.team) || [],
        soloPlayers: []
      }))
      
      setChampionships(formatted)
    } catch (err) {
      console.error('Erro ao carregar campeonatos:', err)
      setChampionships(DEFAULT_CHAMPIONSHIPS) // fallback
    }
  }

  // =============================================
  // SUPABASE: Realtime subscriptions
  // =============================================
  useEffect(() => {
    const eventsChannel = supabase
      .channel('events-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'events' },
        () => loadEvents()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'event_players' },
        () => loadEvents()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(eventsChannel)
    }
  }, [user])

  function hardReset() {
    supabase.auth.signOut()
    setUser(null)
    setEvents([])
    setTeams([])
    setChampionships([])
    setVenues([])
    if (hasWindow()) {
      window.location.reload()
    }
  }

  // Move any inscrições já comprovadas (checked_in) para o histórico
  useEffect(() => {
    const completed = Object.entries(joined).filter(([, data]) => data?.checked_in)
    if (!completed.length) return

    const eventsById = Object.fromEntries(safeEventsArr().map(ev => [ev.id, ev]))

    const newEntries = completed.map(([id, data]) => {
      const ev = eventsById[id]
      return {
        id,
        sport: ev?.sport || data.sport || 'Partida',
        venue: ev?.venue || data.venue || 'Local não informado',
        datetime: ev?.datetime || data.datetime || new Date().toISOString(),
        method: data.method || 'photo',
        proof: data.proof || '',
        videoUrl: (data.method || 'photo') === 'video' ? (data.proof || '') : ''
      }
    })

    setJoined(prev => {
      const next = { ...prev }
      completed.forEach(([id]) => { delete next[id] })
      return next
    })

    setHistory(prev => {
      const seen = new Set(prev.map(item => item.id))
      const merged = [...newEntries.filter(item => !seen.has(item.id)), ...prev]
      return merged.slice(0, 30)
    })
  }, [joined])

  function requestLocation() {
    if (!hasWindow()) return
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy })
      },
      () => {
        setUserLocation(null)
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    )
  }

  function showToast(msg, type = 'info', duration = 3500) {
    setToast({ message: msg, type, visible: true })
    if (duration > 0) {
      setTimeout(() => setToast(prev => ({ ...prev, visible: false })), duration)
    }
  }

  useEffect(() => {
    requestLocation()
  }, [])

  useEffect(() => {
    if (billing.month !== currentMonthId()) {
      setBilling({ month: currentMonthId(), paid: false })
    }
  }, [billing.month])

  useEffect(() => {
    if (user) {
      setRanking(prev => {
        if (prev[user.id]) return prev
        return { ...prev, [user.id]: 0 }
      })
    }
  }, [user])

  function safeEventsArr() {
    return Array.isArray(events) ? events : []
  }

  async function handleLogin({ name, password, isRegister = false }) {
    setAuthError('')
    setLoading(true)
    
    // Verificar se é um email válido
    const email = name.trim()
    if (!email.includes('@') || !email.includes('.')) {
      setAuthError('Digite um email válido (ex: seu@email.com)')
      setLoading(false)
      return
    }
    
    console.log('Tentando autenticação:', { email, isRegister })
    
    try {
      if (isRegister) {
        // Cadastrar novo usuário
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name: email.split('@')[0] }
          }
        })
        
        console.log('Resultado signUp:', { data, error })
        
        if (error) throw error
        
        if (data?.user?.identities?.length === 0) {
          setAuthError('Este email já está cadastrado. Faça login.')
          setLoading(false)
          return
        }
        
        showToast('Conta criada com sucesso! Agora faça login.', 'success')
        setLoading(false)
        return
      }
      
      // Login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      console.log('Resultado signIn:', { data, error })
      
      if (error) throw error
      
      setView('home')
      showToast(`Bem-vindo, ${data.user?.user_metadata?.name || email}!`, 'success')
      
      // Recarregar dados
      loadEvents()
      loadTeams()
      loadChampionships()
      
    } catch (err) {
      console.error('Erro de autenticação:', err)
      setAuthError(err.message || 'Erro ao autenticar. Verifique suas credenciais.')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
    setAuthError('')
    setView('home')
    showToast('Você saiu da conta.', 'info')
  }

  async function acceptEvent(event) {
    if (!user) {
      showToast('Faça login para participar.', 'warn')
      return
    }
    liftSuspensionIfExpired()
    if (isSuspended()) {
      const until = new Date(cancellations.suspendedUntil)
      showToast(`Você está suspenso até ${until.toLocaleDateString()} ${until.toLocaleTimeString()}.`, 'error', 6000)
      return
    }
    if (joined[event.id]) {
      showToast('Você já está inscrito.', 'info')
      return
    }
    const startTime = new Date(event.datetime).getTime()
    if (startTime - Date.now() <= 10 * 60 * 1000) {
      showToast('Entrada fechada: faltam menos de 10 minutos para o início.', 'warn')
      return
    }
    const arr = safeEventsArr()
    const found = arr.find(ev => ev.id === event.id)
    if (!found) {
      showToast('Evento não encontrado', 'error')
      return
    }
    if (found.slots_taken >= found.slots_total) {
      showToast('Desculpa, essa partida já está cheia.', 'warn')
      return
    }

    const updated = arr.map(ev =>
      ev.id === event.id ? { ...ev, slots_taken: ev.slots_taken + 1 } : ev
    )
    setEvents(updated)
    setJoined(prev => ({
      ...prev,
      [event.id]: { userId: user.id, checked_in: false }
    }))
    setBilling({ month: currentMonthId(), paid: false })
    setRanking(prev => ({
      ...prev,
      [user.id]: (prev[user.id] || 0) + 1
    }))

    const eventTime = new Date(found.datetime).getTime()
    const reminderTime = eventTime - 30 * 60 * 1000
    const now = Date.now()
    if (reminderTime > now) {
      setTimeout(() => {
        showToast(`⏰ Sua partida de ${found.sport} começa em 30 minutos!`, 'info', 4000)
      }, reminderTime - now)
    }
    showToast('Você entrou na partida — confira em "Inscrições".', 'success')
    setView('inscricoes')
    
    // Salvar no Supabase
    try {
      await supabase.from('event_players').insert([{
        event_id: event.id,
        user_id: user.id
      }])
      loadEvents() // Recarregar
    } catch (err) {
      console.error('Erro ao salvar inscrição:', err)
    }
  }

  async function rejectEvent(event) {
    setEvents(prev => prev.filter(ev => ev.id !== event.id))
    showToast('Evento removido do feed.', 'info')
  }

  async function addCustomLocation({ name, bairro, tipo, superficie, photo, lat, lng }) {
    if (!name || !bairro || !photo) {
      showToast('Informe nome, bairro e uma foto do local.', 'warn')
      return null
    }
    
    try {
      const { data, error } = await supabase.from('venues').insert([{
        name,
        bairro,
        tipo: tipo || 'Quadra',
        superficie: superficie || 'misto',
        city: user?.city || 'Salvador',
        state: user?.state || 'BA'
      }]).select().single()
      
      if (error) throw error
      
      const entry = {
        id: data.id,
        label: `${name} · ${bairro}`,
        bairro,
        tipo: tipo || 'Quadra',
        superficie: superficie || 'misto',
        photo,
        lat: lat ? Number(lat) : null,
        lng: lng ? Number(lng) : null
      }
      
      setVenues(prev => [...prev, entry])
      showToast('Local adicionado com sucesso!', 'success')
      return entry
    } catch (err) {
      console.error('Erro ao criar local:', err)
      showToast('Erro ao salvar local.', 'error')
      return null
    }
  }

  async function createTeamEntry({ name, sport, members }) {
    if (!name) return null
    
    try {
      const { data, error } = await supabase.from('teams').insert([{
        name,
        sport: sport || 'Futebol 5x5',
        captain_id: user?.id
      }]).select().single()
      
      if (error) throw error
      
      // Adicionar o próprio usuário como membro
      if (user?.id) {
        await supabase.from('team_members').insert([{
          team_id: data.id,
          user_id: user.id
        }])
      }
      
      const entry = {
        id: data.id,
        name,
        sport: sport || 'Futebol 5x5',
        captain: user?.name || 'Você',
        captain_id: user?.id,
        members: [user?.name || 'Você']
      }
      
      setTeams(prev => [...prev, entry])
      notifyTeamMembers(entry.id, null, 'Novo time criado', entry)
      showToast('Time criado com sucesso!', 'success')
      return entry
    } catch (err) {
      console.error('Erro ao criar time:', err)
      showToast('Erro ao criar time.', 'error')
      return null
    }
  }

  function notifyTeamMembers(teamId, eventRef = null, prefix = 'Convite enviado', directTeam = null) {
    const team = directTeam || teams.find(t => t.id === teamId)
    if (!team) return
    const body = eventRef
      ? `${prefix}: ${eventRef.sport} em ${eventRef.venue}. Ping para ${team.members.join(', ')}`
      : `${prefix} para o ${team.name}`
    const payload = {
      id: `ntf_${Date.now()}`,
      team: team.name,
      body,
      time: new Date().toLocaleTimeString()
    }
    setNotifications(prev => [payload, ...prev].slice(0, 30))
    setChatMessages(prev => [
      ...prev,
      {
        id: payload.id,
        from: team.name,
        text: body,
        timestamp: Date.now()
      }
    ])
    // Create ping with pending responses
    const pingResponses = {}
    team.members.forEach(member => {
      pingResponses[member] = 'pending'
    })
    setTeams(prev => prev.map(t => 
      t.id === teamId 
        ? { ...t, lastPing: Date.now(), pingResponses } 
        : t
    ))
  }

  function respondToPing(teamId, member, response) {
    setTeams(prev => prev.map(t => 
      t.id === teamId 
        ? { ...t, pingResponses: { ...t.pingResponses, [member]: response } }
        : t
    ))
  }

  function addFriend(name) {
    const trimmed = name?.trim()
    if (!trimmed) return
    const entry = { id: slugify(trimmed + Date.now()), name: trimmed, status: 'Online' }
    setFriends(prev => [...prev, entry])
  }

  function sendChatMessage(targetName, text) {
    const trimmed = text.trim()
    if (!trimmed) return
    const payload = {
      id: `chat_${Date.now()}`,
      from: AUTH_USER.name,
      to: targetName || 'Feed',
      text: trimmed,
      timestamp: Date.now()
    }
    setChatMessages(prev => [...prev, payload])
  }

  function clearNotifications() {
    setNotifications([])
  }

  function addStoryEntry({ eventName, venue, beforePhoto, afterPhoto, caption }) {
    const payload = {
      id: `story_${Date.now()}`,
      athlete: user?.name || AUTH_USER.name,
      eventName: eventName || 'Treino livre',
      venue: venue || user?.city || 'Salvador',
      beforePhoto: beforePhoto || 'https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&w=500&q=80',
      afterPhoto: afterPhoto || 'https://images.unsplash.com/photo-1461897104016-0b3b00cc81ee?auto=format&fit=crop&w=500&q=80',
      caption: caption || 'Check-in registrado com foto antes/depois.',
      createdAt: Date.now()
    }
    setStories(prev => [payload, ...prev].slice(0, 50))
  }

  function addKidProfile({ name, age, sport, guardian }) {
    if (!name?.trim()) {
      showToast('Informe o nome da criança.', 'warn')
      return null
    }
    const payload = {
      id: slugify(name + Date.now()),
      name: name.trim(),
      age: Number(age) || 0,
      sport: sport || 'Multiesporte',
      guardian: guardian || (user?.name || 'Responsável')
    }
    setKids(prev => [...prev, payload])
    return payload
  }

  function createChampionshipEntry({ name, sport, category, fee, startDate, description }) {
    if (!name?.trim()) {
      showToast('Nome obrigatório para o campeonato.', 'warn')
      return null
    }
    const payload = {
      id: slugify(name + Date.now()),
      name: name.trim(),
      sport: sport || 'Futebol Society',
      category: category || 'Aberto',
      fee: Number(fee) || 20,
      startDate: startDate || new Date().toISOString().slice(0, 10),
      description: description || 'Rodadas confirmadas pelo app.',
      registrations: []
    }
    setChampionships(prev => [payload, ...prev])
    return payload
  }

  function enrollKidInChampionship(champId, kidId) {
    if (!champId || !kidId) {
      showToast('Selecione campeonato e atleta mirim.', 'warn')
      return
    }
    setChampionships(prev =>
      prev.map(champ =>
        champ.id === champId && !champ.registrations.includes(kidId)
          ? { ...champ, registrations: [...champ.registrations, kidId] }
          : champ
      )
    )
  }

  function joinChampionship(champId, enrollForm) {
    const { mode, playerName, playerPhone, selectedTeamId, newTeamName } = enrollForm
    if (!playerName || !playerPhone) {
      showToast('Preencha nome e telefone.', 'warn')
      return
    }

    setChampionships(prev => prev.map(champ => {
      if (champ.id !== champId) return champ

      const champTeams = champ.teams || []
      const soloPlayers = champ.soloPlayers || []
      const playersPerTeam = champ.playersPerTeam || 5
      const maxTeams = champ.maxTeams || 8
      const player = { id: `p_${Date.now()}`, name: playerName, phone: playerPhone }

      if (mode === 'solo') {
        // Try to add to incomplete team first
        const incompleteTeam = champTeams.find(t => t.members.length < playersPerTeam)
        if (incompleteTeam) {
          const updatedTeams = champTeams.map(t => 
            t.id === incompleteTeam.id 
              ? { ...t, members: [...t.members, playerName] }
              : t
          )
          showToast(`Você entrou no time ${incompleteTeam.name}!`, 'success')
          return { ...champ, teams: updatedTeams, registrations: [...champ.registrations, player.id] }
        }
        // Otherwise add to solo queue
        showToast('Você está na fila. Será alocado quando um time abrir vaga.', 'info')
        return { ...champ, soloPlayers: [...soloPlayers, player], registrations: [...champ.registrations, player.id] }
      }

      if (mode === 'team' && selectedTeamId) {
        const userTeam = teams.find(t => t.id === selectedTeamId)
        if (!userTeam) {
          showToast('Time não encontrado.', 'warn')
          return champ
        }
        if (champTeams.length >= maxTeams) {
          showToast('Limite de times atingido.', 'warn')
          return champ
        }
        const newTeam = {
          id: `ct_${Date.now()}`,
          name: userTeam.name,
          members: userTeam.members,
          captain: userTeam.captain
        }
        showToast(`Time ${userTeam.name} inscrito!`, 'success')
        return { 
          ...champ, 
          teams: [...champTeams, newTeam], 
          registrations: [...champ.registrations, ...userTeam.members.map((_, i) => `${newTeam.id}_${i}`)]
        }
      }

      if (mode === 'create-team' && newTeamName) {
        if (champTeams.length >= maxTeams) {
          showToast('Limite de times atingido.', 'warn')
          return champ
        }
        const newTeam = {
          id: `ct_${Date.now()}`,
          name: newTeamName,
          members: [playerName],
          captain: playerName,
          openSlots: playersPerTeam - 1
        }
        // Automatically fill with solo players if available
        const slotsToFill = Math.min(soloPlayers.length, playersPerTeam - 1)
        const playersToAdd = soloPlayers.slice(0, slotsToFill)
        const remainingSolo = soloPlayers.slice(slotsToFill)
        
        newTeam.members = [playerName, ...playersToAdd.map(p => p.name)]
        newTeam.openSlots = playersPerTeam - newTeam.members.length

        if (playersToAdd.length > 0) {
          showToast(`Time ${newTeamName} criado! ${playersToAdd.length} jogador(es) da fila entraram.`, 'success')
        } else {
          showToast(`Time ${newTeamName} criado! Aguardando jogadores.`, 'success')
        }

        return { 
          ...champ, 
          teams: [...champTeams, newTeam],
          soloPlayers: remainingSolo,
          registrations: [...champ.registrations, player.id, ...playersToAdd.map(p => p.id)]
        }
      }

      return champ
    }))
  }

  function handlePerformanceSubmit(eventId, payload) {
    const success = finishEvent(eventId, payload)
    if (!success) return

    setPerformance(prev => {
      const totals = prev.totals || {}
      const updatedTotals = {
        goals: (totals.goals || 0) + (Number(payload.goals) || 0),
        passes: (totals.passes || 0) + (Number(payload.passes) || 0),
        distance: (totals.distance || 0) + (Number(payload.distance) || 0)
      }

      const videos = payload.videoUrl
        ? [{
            eventId,
            url: payload.videoUrl,
            sport: payload.sportLabel,
            datetime: payload.datetime
          }, ...(prev.videos || [])].slice(0, 10)
        : prev.videos || []

      return { totals: updatedTotals, videos }
    })

    if (payload.beforePhoto || payload.afterPhoto || payload.caption) {
      const reference = safeEventsArr().find(item => item.id === eventId) || {}
      addStoryEntry({
        eventName: reference.sport || payload.sportLabel,
        venue: reference.venue,
        beforePhoto: payload.beforePhoto,
        afterPhoto: payload.afterPhoto,
        caption: payload.caption
      })
    }

    setActivePerformance(null)
  }

  function openPerformanceModal(eventId) {
    const ev = safeEventsArr().find(e => e.id === eventId)
    if (!ev) {
      showToast('Evento não encontrado.', 'error')
      return
    }
    setActivePerformance({ eventId, sportLabel: ev.sport, datetime: ev.datetime, venue: ev.venue })
  }

  function closePerformanceModal() {
    setActivePerformance(null)
  }

  async function createEvent(form) {
    if (!user) {
      showToast('Faça login para criar um evento.', 'warn')
      return
    }
    
    const stats = Array.isArray(form.stats) && form.stats.length ? form.stats : statsPresetFor(form.sport)
    const venueMeta = venues.find(v => v.label === form.venue || v.id === form.venueId)
    
    try {
      // Criar evento no Supabase
      const { data: newEvent, error: eventError } = await supabase.from('events').insert([{
        sport: form.sport,
        venue_id: venueMeta?.id || form.venueId,
        datetime: form.datetime,
        slots_total: form.slots_total || 10,
        price_per_player: 1,
        level: form.level,
        creator_id: user.id
      }]).select().single()
      
      if (eventError) throw eventError
      
      // Inserir stats do evento
      if (stats.length > 0) {
        const statsToInsert = stats.map(label => ({
          event_id: newEvent.id,
          label
        }))
        await supabase.from('event_stats').insert(statsToInsert)
      }
      
      // Recarregar eventos
      await loadEvents()
      
      setView('home')
      showToast('Evento criado com sucesso!', 'success')
      
      if (form.teamId) {
        const ev = {
          ...form,
          id: newEvent.id,
          venue: venueMeta?.label || form.venue
        }
        notifyTeamMembers(form.teamId, ev, 'Convite para jogo')
      }
    } catch (err) {
      console.error('Erro ao criar evento:', err)
      showToast('Erro ao criar evento. Tente novamente.', 'error')
    }
  }

  async function checkIn(eventId, method = 'photo', proofUrl = '') {
    if (!user) {
      showToast('Faça login para confirmar presença.', 'warn')
      return
    }
    if (!joined[eventId]) {
      showToast('Você ainda não entrou nessa partida.', 'warn')
      return
    }

    const ev = safeEventsArr().find(e => e.id === eventId)
    if (!ev) {
      showToast('Evento não encontrado.', 'error')
      return
    }

    if (!['photo', 'video'].includes(method)) {
      showToast('Use foto ou vídeo para comprovar presença.', 'warn')
      return
    }

    const proof = (proofUrl || '').trim()
    if (!proof) {
      showToast(`Anexe um ${method === 'photo' ? 'link de foto' : 'link de vídeo'} para validar o check-in.`, 'warn')
      return
    }

    try {
      // Atualizar no Supabase
      await supabase.from('event_players')
        .update({
          checked_in: true,
          checkin_method: method
        })
        .eq('event_id', eventId)
        .eq('user_id', user.id)
      
      setJoined(prev => {
        const { [eventId]: _, ...rest } = prev
        return rest
      })

      const historyEntry = {
        id: eventId,
        sport: ev.sport,
        venue: ev.venue,
        datetime: ev.datetime,
        method,
        proof,
        videoUrl: method === 'video' ? proof : ''
      }

      setHistory(prev => [historyEntry, ...prev].slice(0, 30))

      const points = method === 'photo' ? 5 : 7

      setRanking(prev => ({
        ...prev,
        [user.id]: (prev[user.id] || 0) + points
      }))

      showToast(`Check-in registrado com ${method === 'photo' ? 'foto' : 'vídeo'}. Você ganhou ${points} pontos!`, 'success')
      
      loadEvents() // Recarregar
    } catch (err) {
      console.error('Erro ao fazer check-in:', err)
      showToast('Erro ao registrar check-in.', 'error')
    }
  }

  function monthlyDue() {
    if (billing.paid) return 0
    return Object.keys(joined).length * FEE
  }

  function handleMonthlyPayment(method = 'cartão') {
    const due = monthlyDue()
    if (due <= 0) {
      showToast('Sem valores a pagar no mês.', 'info')
      return
    }
    setBilling({ month: currentMonthId(), paid: true })
    const fundAdd = due * FUND_SHARE
    setFund(prev => +(prev + fundAdd).toFixed(2))
    showToast(`Pagamento mensal de R$ ${due.toFixed(2)} registrado via ${method}.`, 'success')
  }

  function finishEvent(eventId, { minutes = 60, mvp = false, goals = 0, passes = 0, distance = 0, videoUrl = '' } = {}) {
    if (!user) {
      showToast('Faça login para finalizar partidas.', 'warn')
      return false
    }
    if (!joined[eventId]) {
      showToast('Você não está inscrito nessa partida.', 'warn')
      return false
    }
    const ev = safeEventsArr().find(e => e.id === eventId)
    if (!ev) {
      showToast('Evento não encontrado.', 'error')
      return false
    }
    const base = Math.max(1, Math.floor(minutes / 10))
    const bonus = mvp ? 10 : 0
    setRanking(prev => ({
      ...prev,
      [user.id]: (prev[user.id] || 0) + base + bonus
    }))
    setJoined(prev => {
      const { [eventId]: _, ...rest } = prev
      return rest
    })
    setHistory(prev => [
      {
        id: eventId,
        sport: ev.sport,
        venue: ev.venue,
        datetime: ev.datetime,
        goals: Number(goals) || 0,
        passes: Number(passes) || 0,
        distance: Number(distance) || 0,
        videoUrl
      },
      ...prev
    ].slice(0, 30))
    showToast(`Partida finalizada. Ganhou ${base + bonus} pontos.`, 'success')
    return true
  }

  function isSuspended() {
    if (!cancellations.suspendedUntil) return false
    const until = new Date(cancellations.suspendedUntil).getTime()
    return Date.now() < until
  }

  function liftSuspensionIfExpired() {
    if (cancellations.suspendedUntil && !isSuspended()) {
      setCancellations({ count: 0, suspendedUntil: null })
    }
  }

  useEffect(() => {
    liftSuspensionIfExpired()
  }, [])

  function cancelEnrollment(eventId) {
    if (!user) {
      showToast('Faça login para cancelar.', 'warn')
      return
    }
    if (!joined[eventId]) {
      showToast('Você não está inscrito nessa partida.', 'warn')
      return
    }
    const penalty = CANCEL_PENALTY_POINTS
    setJoined(prev => {
      const { [eventId]: _, ...rest } = prev
      return rest
    })
    setRanking(prev => ({
      ...prev,
      [user.id]: Math.max(0, (prev[user.id] || 0) - penalty)
    }))

    setCancellations(prev => {
      const nextCount = prev.count + 1
      if (nextCount >= CANCEL_THRESHOLD) {
        const suspendUntil = new Date(Date.now() + SUSPENSION_DAYS * 24 * 60 * 60 * 1000).toISOString()
        showToast(`Cancelou ${nextCount} vezes. Acesso suspenso por ${SUSPENSION_DAYS} dias.`, 'error', 5000)
        return { count: 0, suspendedUntil: suspendUntil }
      }
      showToast(`Cancelamento registrado. -${penalty} pontos. Restam ${CANCEL_THRESHOLD - nextCount} antes de suspensão.`, 'warn', 4500)
      return { ...prev, count: nextCount }
    })
  }

  const onlineCount = safeEventsArr().reduce((total, ev) => total + (ev.slots_taken || 0), 0)

  const isAuthenticated = user && typeof user.name === 'string'

  function renderShellContent() {
    if (view === 'home') {
      return (
        <>
          <div className="product-panel">
            <div className="view-wrapper">
              <HomeView
                swipeIndex={swipeIndex}
                events={safeEventsArr()}
                rejectEvent={rejectEvent}
                acceptEvent={acceptEvent}
                joined={joined}
                user={user}
                checkIn={checkIn}
                fund={fund}
                history={history}
                performance={performance}
                openPerformanceModal={openPerformanceModal}
                userLocation={userLocation}
                venues={venues}
                championships={championships}
                onViewChampionships={() => setView('campeonatos')}
                onRefreshNearby={() => {
                  setSwipeIndex(0)
                  requestLocation()
                }}
              />
            </div>
          </div>
          <Hero setView={setView} onlineCount={onlineCount} />
          <StoryPanel fund={fund} />
          <HowItWorks />
        </>
      )
    }

    if (view === 'stories') {
      return <StoriesView stories={stories} onAddStory={addStoryEntry} />
    }

    if (view === 'create') {
      return (
        <CreateView
          onCreate={createEvent}
          locations={venues}
          onAddLocation={addCustomLocation}
          teams={teams}
          onCreateTeam={createTeamEntry}
          initialVenue={venues[0]?.label || ''}
        />
      )
    }
    if (view === 'ranking') return <RankingView ranking={ranking} user={user} />
    if (view === 'fund') return <FundView fund={fund} />
    if (view === 'inscricoes') {
      return (
        <EnrollmentsView
          events={safeEventsArr()}
          joined={joined}
          checkIn={checkIn}
          history={history}
          openPerformanceModal={openPerformanceModal}
        />
      )
    }
    if (view === 'admin') {
      return user?.role === 'master' ? (
        <AdminView
          events={safeEventsArr()}
          fund={fund}
          joined={joined}
          ranking={ranking}
          chatMessages={chatMessages}
          notifications={notifications}
          history={history}
        />
      ) : null
    }
    if (view === 'teams') {
      return (
        <TeamsView
          teams={teams}
          onCreateTeam={createTeamEntry}
          notifyTeam={teamId => notifyTeamMembers(teamId, null, 'Ping manual')}
          onRespondPing={respondToPing}
        />
      )
    }
    if (view === 'campeonatos') {
      return (
        <ChampionshipsView
          kids={kids}
          championships={championships}
          onAddKid={addKidProfile}
          onCreateChampionship={createChampionshipEntry}
          onEnroll={enrollKidInChampionship}
          onJoinChampionship={joinChampionship}
          user={user}
          teams={teams}
        />
      )
    }
    if (view === 'profile') {
      return (
        <ProfileView
          user={user}
          ranking={ranking}
          joined={joined}
          history={history}
          performance={performance}
          teams={teams}
        />
      )
    }

    return null
  }

  // Loading screen
  if (loading) {
    return (
      <div className="login-shell">
        <div className="login-card" style={{ textAlign: 'center' }}>
          <p className="eyebrow">FitHub</p>
          <h1>Carregando...</h1>
          <p className="lead">Aguarde enquanto verificamos sua sessão.</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginScreen onSubmit={handleLogin} error={authError} onReset={hardReset} loading={loading} />
  }

  const isHome = view === 'home'
  const body = renderShellContent()

  return (
    <div className="app-shell">
      <Header
        setView={setView}
        view={view}
        onLogout={handleLogout}
        user={user}
        onShowPayments={() => setShowPayments(true)}
        onShowNotifications={() => setShowNotifications(true)}
        onShowChat={() => setShowChat(true)}
        unreadCount={notifications.length}
      />
      {isHome ? body : <div className="single-surface">{body}</div>}
      <MonthlyPaymentModal
        open={showPayments}
        onClose={() => setShowPayments(false)}
        totalDue={monthlyDue()}
        billing={billing}
        onPay={handleMonthlyPayment}
      />
      <PerformanceModal
        config={activePerformance}
        onClose={closePerformanceModal}
        onSubmit={handlePerformanceSubmit}
      />
      <NotificationsModal
        open={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onClear={clearNotifications}
      />
      <ChatModal
        open={showChat}
        onClose={() => {
          setShowChat(false)
          setActiveFriend(null)
        }}
        friends={friends}
        chatMessages={chatMessages}
        activeFriend={activeFriend}
        onSelectFriend={setActiveFriend}
        onAddFriend={addFriend}
        onSendMessage={(target, text) => sendChatMessage(target, text)}
      />
      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
      <MobileNav view={view} setView={setView} />
    </div>
  )
}

function Header({
  setView,
  view,
  onLogout,
  user,
  onShowPayments,
  onShowNotifications,
  onShowChat,
  unreadCount
}) {
  const navItems = ['home', 'stories', 'create', 'teams', 'campeonatos', 'ranking', 'inscricoes', 'profile']
  if (user?.role === 'master' && !navItems.includes('admin')) navItems.push('admin')

  return (
    <header className="app-header">
      <div className="brand">
        <span className="spark">⚡</span>
        FitHub
      </div>
      <nav>
        {navItems.map(item => (
          <button
            key={item}
            className={view === item ? 'nav-active' : ''}
            onClick={() => setView(item)}
          >
            {labelFor(item)}
          </button>
        ))}
      </nav>
      <div className="header-actions">
        <button className="user-pill" onClick={onShowPayments}>
          <span className="user-name">{user.name}</span>
          {user.role === 'master' && <span className="role-badge"> · Master</span>}
        </button>
        <button className="ghost icon-button" onClick={onShowNotifications}>
          🔔
          {unreadCount > 0 && <span className="icon-badge">{unreadCount}</span>}
        </button>
        <button className="ghost icon-button" onClick={onShowChat}>
          💬
        </button>
        <button className="ghost" onClick={onLogout}>
          <span className="logout-text">Sair</span>
          <span className="logout-icon">🚪</span>
        </button>
      </div>
    </header>
  )
}

function MobileNav({ view, setView }) {
  const navItems = [
    { id: 'home', icon: '🏟️', label: 'Partidas' },
    { id: 'campeonatos', icon: '🏆', label: 'Campeonatos' },
    { id: 'create', icon: '➕', label: 'Criar' },
    { id: 'teams', icon: '👥', label: 'Times' },
    { id: 'profile', icon: '👤', label: 'Perfil' }
  ]

  return (
    <nav className="mobile-nav">
      {navItems.map(item => (
        <button
          key={item.id}
          className={view === item.id ? 'active' : ''}
          onClick={() => setView(item.id)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}

function labelFor(item) {
  return {
    home: 'Partidas',
    stories: 'Stories',
    create: 'Criar',
    teams: 'Times',
    campeonatos: 'Campeonatos',
    ranking: 'Ranking',
    fund: 'Fundo',
    inscricoes: 'Inscrições',
    profile: 'Perfil',
    admin: 'Master'
  }[item]
}

function Hero({ setView, onlineCount }) {
  return (
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow">Agenda esportiva instantânea</p>
        <h1>Para combinar jogos com a galera.</h1>
        <p className="lead">
          Clique em "Ver partidas agora" e veja partidas confirmadas perto de você.
          Entre, faça check-in na quadra e pontue no ranking mensal.
        </p>
        <div className="hero-cta">
          <button className="primary" onClick={() => setView('home')}>
            Ver partidas agora
          </button>
          <button className="secondary" onClick={() => setView('create')}>
            Hospedar treino
          </button>
        </div>
        <div className="hero-badges">
          <span>#futebol</span>
          <span>#vôlei</span>
          <span>#basquete</span>
          <span>#futevôlei</span>
          <span>#Altinha</span>
        </div>
      </div>
      <div className="hero-card">
        <div className="card-row">
          <p>Check-ins validados</p>
          <strong>+420</strong>
        </div>
        <div className="card-row">
          <p>Quadras apoiadas</p>
          <strong>12 bairros</strong>
        </div>
        <div className="card-row">
          <p>Tempo médio para fechar um jogo</p>
          <strong>14 minutos</strong>
        </div>
        <div className="card-row">
          <p>Jogadores on-line agora</p>
          <strong>{onlineCount}</strong>
        </div>
        <div className="card-row">
          <p>Partidas criadas hoje</p>
          <strong>32</strong>
        </div>
        <div className="card-row">
          <p>Novos atletas esta semana</p>
          <strong>+58</strong>
        </div>
        <div className="card-row">
          <p>Comunidades ativas</p>
          <strong>5 regiões</strong>
        </div>
        <div className="card-row">
          <p>Taxa de confirmação</p>
          <strong>94%</strong>
        </div>
      </div>
    </section>
  )
}

function StoryPanel({ fund }) {
  return (
    <aside className="story-panel">
      <p className="eyebrow">Como funciona</p>
      <h2>Entre, confirme presença e invista na evolução do esporte.</h2>
      <ol>
        <li>Escolha esportes e receba partidas em tempo real.</li>
        <li>Entre com um swipe, pague pelo app e garanta a vaga.</li>
        <li>Check-in via foto ou vídeo para pontuar.</li>
        <li>Acumule pontos e suba no ranking da comunidade.</li>
        <li>Vote em melhorias para quadras e locais parceiros.</li>
        <li>Conecte-se com atletas do seu nível e região.</li>
      </ol>
    </aside>
  )
}

function HomeView({
  swipeIndex,
  events,
  rejectEvent,
  acceptEvent,
  joined,
  user,
  checkIn,
  fund,
  history,
  performance,
  openPerformanceModal,
  userLocation,
  venues,
  championships,
  onViewChampionships,
  onRefreshNearby
}) {
  const [search, setSearch] = useState('')
  const venueMap = useMemo(() => Object.fromEntries(venues.map(v => [v.label, v])), [venues])

  function distanceFromUser(ev) {
    const venue = ev.venueId ? venues.find(v => v.id === ev.venueId) : venueMap[ev.venue]
    if (!venue || !userLocation || !venue.lat || !venue.lng) return null
    const R = 6371
    const dLat = ((venue.lat - userLocation.lat) * Math.PI) / 180
    const dLon = ((venue.lng - userLocation.lng) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(userLocation.lat * Math.PI / 180) *
        Math.cos(venue.lat * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return +(R * c).toFixed(1)
  }

  const filtered = events
    .map(ev => ({ ...ev, distance_km: distanceFromUser(ev) }))
    .filter(ev => ev.sport.toLowerCase().includes(search.toLowerCase()))
    .filter(ev => !joined[ev.id])
    .sort((a, b) => {
      if (a.distance_km == null && b.distance_km == null) return 0
      if (a.distance_km == null) return 1
      if (b.distance_km == null) return -1
      return a.distance_km - b.distance_km
    })

  const deck = filtered.slice(swipeIndex)
  const now = Date.now()
  const durationMs = 90 * 60 * 1000
  const cutoffMs = 10 * 60 * 1000
  const canEnter = ev => new Date(ev.datetime).getTime() - now > cutoffMs
  const inProgress = deck.filter(ev => {
    const start = new Date(ev.datetime).getTime()
    return start <= now && now <= start + durationMs
  })
  const upcoming = deck.filter(ev => new Date(ev.datetime).getTime() > now)

  return (
    <div className="view home">
      <div className="home-grid">
        <div>
          <div className="section-head with-actions">
            <div>
              <h3>Partidas perto</h3>
              <p>Atualizado em tempo real a cada confirmação.</p>
            </div>
            <div className="head-actions">
              <input
                className="search"
                placeholder="Buscar esporte"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <button className="ghost" onClick={onRefreshNearby}>Atualizar</button>
            </div>
          </div>

          <div className="section-split">
            <div>
              <div className="section-head mini">
                <h4>Em andamento</h4>
              </div>
              {inProgress.length === 0 && <EmptyState message="Nenhuma partida em andamento agora." />}
              {inProgress.map(ev => (
                <EventCard
                  key={ev.id}
                  event={ev}
                  onReject={rejectEvent}
                  onAccept={() => acceptEvent(ev)}
                  canEnter={canEnter(ev)}
                  venue={ev.venueId ? venues.find(v => v.id === ev.venueId) : venueMap[ev.venue]}
                />
              ))}
            </div>
            <div>
              <div className="section-head mini">
                <h4>A começar</h4>
              </div>
              {upcoming.length === 0 && <EmptyState message="Nenhuma partida futura disponível." />}
              {upcoming.slice(0, 4).map(ev => (
                <EventCard
                  key={ev.id}
                  event={ev}
                  onReject={rejectEvent}
                  onAccept={() => acceptEvent(ev)}
                  canEnter={canEnter(ev)}
                  venue={ev.venueId ? venues.find(v => v.id === ev.venueId) : venueMap[ev.venue]}
                />
              ))}
            </div>
          </div>
        </div>
        <PlayerPanel
          joined={joined}
          events={events}
          user={user}
          checkIn={checkIn}
          fund={fund}
          history={history}
          performance={performance}
          openPerformanceModal={openPerformanceModal}
          userLocation={userLocation}
          venues={venues}
        />
      </div>

      {championships && championships.length > 0 && (
        <section className="home-championships">
          <div className="section-head with-actions">
            <div>
              <p className="eyebrow">🏆 Campeonatos</p>
              <h3>Competições abertas</h3>
              <p>Inscreva-se e dispute com a galera.</p>
            </div>
            <button className="ghost" onClick={onViewChampionships}>Ver todos</button>
          </div>
          <div className="champ-preview-grid">
            {championships.slice(0, 3).map(champ => (
              <article key={champ.id} className="champ-preview-card" onClick={onViewChampionships}>
                <div className="champ-preview-header">
                  <h4>{champ.name}</h4>
                  <span className="fee-pill">R$ {(Number(champ.fee) || 0).toFixed(2)}</span>
                </div>
                <p className="meta">{champ.sport} · {champ.category}</p>
                {champ.prizes && <p className="champ-prize">🏆 {champ.prizes.slice(0, 50)}{champ.prizes.length > 50 ? '...' : ''}</p>}
                <div className="champ-preview-footer">
                  <span>{champ.registrations?.length || 0} inscritos</span>
                  <span>Início: {new Date(champ.startDate).toLocaleDateString('pt-BR')}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <VenueMap venues={venues} userLocation={userLocation} />
    </div>
  )
}

function VenueMap({ venues, userLocation }) {
  const hydrated = useMemo(() => {
    const baseById = Object.fromEntries(SALVADOR_LOCATIONS.map(v => [v.id, v]))
    return venues.map(v => ({ ...baseById[v.id], ...v }))
  }, [venues])

  const points = useMemo(() => {
    const withCoords = hydrated.filter(v => v.lat && v.lng)
    if (withCoords.length) return withCoords
    return SALVADOR_LOCATIONS
  }, [hydrated])
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!points.length || !mounted || !hasWindow()) return null

  const positions = [...points.map(p => [p.lat, p.lng])]
  if (userLocation) positions.push([userLocation.lat, userLocation.lng])

  const bounds = positions.length ? L.latLngBounds(positions) : null
  const centerPoint = bounds ? bounds.getCenter() : L.latLng(points[0].lat, points[0].lng)

  return (
    <section className="map-card">
      <div>
        <p className="eyebrow">Mapa rápido</p>
        <h3>Quadras em Salvador</h3>
        <p className="lead">Mapa interativo com os pontos cadastrados.</p>
        <div className="map-legend">
          {points.slice(0, 6).map(p => (
            <div key={p.id} className="legend-line">
              <span className="dot" />
              <div>
                <strong>{p.label}</strong>
                <p className="meta">{p.tipo} · {p.bairro}</p>
              </div>
            </div>
          ))}
        </div>
        <a className="map-link" href={`https://www.openstreetmap.org/#map=13/${centerPoint.lat}/${centerPoint.lng}`} target="_blank" rel="noreferrer">Abrir no mapa completo</a>
      </div>
      <div className="map-viewport">
        <MapContainer
          center={centerPoint}
          bounds={bounds}
          scrollWheelZoom
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {points.map(p => (
            <Marker key={p.id} position={[p.lat, p.lng]}>
              <Popup>
                <strong>{p.label}</strong><br />{p.tipo} · {p.bairro}
              </Popup>
            </Marker>
          ))}
          {userLocation && (
            <CircleMarker
              center={[userLocation.lat, userLocation.lng]}
              radius={10}
              pathOptions={{ color: '#19f18f', fillColor: '#19f18f', fillOpacity: 0.4 }}
            />
          )}
        </MapContainer>
      </div>
    </section>
  )
}

function EventCard({ event, onAccept, onReject, venue, canEnter = true }) {
  const openSlots = event.slots_total - event.slots_taken
  const when = new Date(event.datetime).toLocaleString('pt-BR', {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
  const distanceLabel = event.distance_km != null ? `${event.distance_km} km` : null
  const venuePhoto = event.venuePhoto || venue?.photo

  return (
    <article className="event-card">
      <div className="event-head">
        <div>
          <p className="sport">{event.sport}</p>
          <h4>{event.venue}</h4>
          <p className="meta">
            {when} · {event.level} · Host: {event.creator}
          </p>
          {distanceLabel && <p className="meta">Distância: {distanceLabel}</p>}
        </div>
        {venuePhoto && <img className="venue-thumb" src={venuePhoto} alt={event.venue} />}
      </div>
      <div className="details">
        <div>
          <small>Vagas </small>
          <strong>{openSlots}</strong>
        </div>
  
      </div>
      {Array.isArray(event.stats) && event.stats.length > 0 && (
        <div className="stat-tags">
          {event.stats.slice(0, 4).map(stat => (
            <span key={stat}>{stat}</span>
          ))}
        </div>
      )}
      <div className="card-actions">
        <button className="ghost" onClick={onReject}>
          Ignorar
        </button>
        {canEnter && (
          <button className="primary" onClick={onAccept}>
            Entrar
          </button>
        )}
      </div>
      {!canEnter && <p className="meta">Entrada fechada: precisa confirmar até 10 min antes.</p>}
    </article>
  )
}

function PlayerPanel({
  joined,
  events,
  user,
  checkIn,
  fund,
  history,
  performance,
  openPerformanceModal,
  userLocation,
  venues
}) {
  const entries = Object.entries(joined)
  const totals = performance.totals || {}
  const lastVideos = performance.videos || []

  const venueMap = useMemo(() => Object.fromEntries(venues.map(v => [v.label, v])), [venues])

  function distanceFromUser(ev) {
    const venue = ev.venueId ? venues.find(v => v.id === ev.venueId) : venueMap[ev.venue]
    if (!venue || !userLocation || !venue.lat || !venue.lng) return null
    const R = 6371
    const dLat = ((venue.lat - userLocation.lat) * Math.PI) / 180
    const dLon = ((venue.lng - userLocation.lng) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(userLocation.lat * Math.PI / 180) *
        Math.cos(venue.lat * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return +(R * c).toFixed(1)
  }

  return (
    <div className="player-panel">
      <div className="player-card">
        <div className="avatar">{user.name[0]}</div>
        <div>
          <p className="sport">{user.name}</p>
          <p className="meta">{user.city}</p>
        </div>
      </div>
      <div className="panel-block stats-board">
        <div className="panel-head">
          <h4>Estatísticas pessoais</h4>
          <span>Desde sempre</span>
        </div>
        <div className="stat-grid">
          <div>
            <small>Gols:  </small>
            <strong>{totals.goals || 0}</strong>
          </div>
          <div>
            <small>Passes:  </small>
            <strong>{totals.passes || 0}</strong>
          </div>
          <div>
            <small>Km:  </small>
            <strong>{(totals.distance || 0).toFixed(1)}</strong>
          </div>
        </div>
        {history.length > 0 && (
          <div className="history-glimpse">
            <p className="meta">
              Último jogo: {history[0].sport} · {new Date(history[0].datetime).toLocaleDateString('pt-BR')}
            </p>
            {history[0].videoUrl && (
              <button
                type="button"
                className="ghost"
                onClick={() => hasWindow() && window.open(history[0].videoUrl, '_blank')}
              >
                Ver melhor momento
              </button>
            )}
          </div>
        )}
        {lastVideos.length > 1 && (
          <div className="video-thumbs">
            {lastVideos.slice(0, 3).map(video => (
              <button key={video.eventId} onClick={() => hasWindow() && window.open(video.url, '_blank')}>
                {video.sport}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="panel-block">
        <div className="panel-head">
          <h4>Inscrições</h4>
          <span>{entries.length}</span>
        </div>
        {entries.length === 0 && <EmptyState message="Você ainda não entrou em partidas." compact />}
        {entries.map(([eid, data]) => {
          const ev = events.find(e => e.id === eid)
          if (!ev) return null
          function handleProof(method) {
            pickProof(method, proof => {
              if (!proof) return
              checkIn(eid, method, proof)
            })
          }
          return (
            <div key={eid} className="enrollment">
              <div>
                <p className="sport">{ev.sport}</p>
                <p className="meta">{ev.venue}</p>
                <p className="meta">Status: {data.checked_in ? 'Check-in feito' : 'Pendente'}</p>
                {Array.isArray(ev.stats) && ev.stats.length > 0 && (
                  <p className="meta stats-line">Métricas: {ev.stats.slice(0, 3).join(', ')}</p>
                )}
                {data.proof && (
                  <p className="meta stats-line">Comprovante: <a className="proof-link" href={data.proof} target="_blank" rel="noreferrer">ver</a></p>
                )}
              </div>
              <div className="enrollment-actions">
                {!data.checked_in && (
                  <>
                    <button onClick={() => handleProof('photo')}>Foto</button>
                    <button onClick={() => handleProof('video')}>Vídeo</button>
                  </>
                )}
                <button className="primary" onClick={() => openPerformanceModal(eid)}>
                  Estatísticas
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CreateView({ onCreate, locations, onAddLocation, teams, onCreateTeam, initialVenue }) {
  const [form, setForm] = useState({
    sport: 'Futebol 5x5',
    venue: initialVenue || '',
    datetime: '',
    slots_total: 10,
    level: 'Intermediário',
    stats: statsPresetFor('Futebol 5x5'),
    teamId: ''
  })
  const [customStat, setCustomStat] = useState('')
  const [showLocationForm, setShowLocationForm] = useState(false)
  const [locationForm, setLocationForm] = useState({ name: '', bairro: '', tipo: 'Quadra', superficie: '', photo: '', lat: '', lng: '' })
  const [showTeamForm, setShowTeamForm] = useState(false)
  const [teamForm, setTeamForm] = useState({ name: '', sport: 'Futebol 5x5', members: '' })

  useEffect(() => {
    if (initialVenue) {
      setForm(prev => ({ ...prev, venue: prev.venue || initialVenue }))
    }
  }, [initialVenue])

  function update(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function updateSport(value) {
    setForm(prev => ({ ...prev, sport: value, stats: statsPresetFor(value) }))
  }

  function toggleStat(stat) {
    setForm(prev => ({
      ...prev,
      stats: prev.stats.includes(stat)
        ? prev.stats.filter(item => item !== stat)
        : [...prev.stats, stat]
    }))
  }

  function addCustomStat() {
    const trimmed = customStat.trim()
    if (!trimmed) return
    setForm(prev => ({
      ...prev,
      stats: prev.stats.includes(trimmed) ? prev.stats : [...prev.stats, trimmed]
    }))
    setCustomStat('')
  }

  function submit(e) {
    e.preventDefault()
    if (!form.venue) {
      alert('Escolha ou cadastre um local para o jogo.')
      return
    }
    onCreate(form)
  }

  function handleAddLocation() {
    const created = onAddLocation(locationForm)
    if (created) {
      setForm(prev => ({ ...prev, venue: created.label }))
      setLocationForm({ name: '', bairro: '', tipo: 'Quadra', superficie: '', photo: '', lat: '', lng: '' })
      setShowLocationForm(false)
    } else {
      alert('Preencha nome, bairro e uma foto do local.')
    }
  }

  function handlePhotoFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setLocationForm(prev => ({ ...prev, photo: reader.result }))
    }
    reader.readAsDataURL(file)
  }

  function handleCreateTeam() {
    if (!teamForm.name) {
      alert('Nome do time obrigatório.')
      return
    }
    const members = teamForm.members
      .split(',')
      .map(m => m.trim())
      .filter(Boolean)
    const created = onCreateTeam({ ...teamForm, members })
    if (created) {
      setForm(prev => ({ ...prev, teamId: created.id }))
      setTeamForm({ name: '', sport: 'Futebol 5x5', members: '' })
      setShowTeamForm(false)
    }
  }

  const statsOptions = statsPresetFor(form.sport)
  const statPool = Array.from(new Set([...(statsOptions || []), ...(form.stats || [])]))

  return (
    <div className="view">
      <div className="section-head">
        <div>
          <h3>Criar partida</h3>
          <p>Publique um treino em menos de um minuto.</p>
        </div>
      </div>
      <form className="form" onSubmit={submit}>
        <label>Esporte</label>
        <input value={form.sport} onChange={e => updateSport(e.target.value)} />

        <label>Local</label>
        <select value={form.venue} onChange={e => update('venue', e.target.value)}>
          <option value="">Selecione uma quadra</option>
          {locations.map(loc => (
            <option key={loc.id} value={loc.label}>
              {loc.label} · {loc.tipo}
            </option>
          ))}
        </select>
        <button type="button" className="ghost" onClick={() => setShowLocationForm(s => !s)}>
          {showLocationForm ? 'Cancelar novo local' : 'Adicionar novo local'}
        </button>
        {showLocationForm && (
          <div className="location-form">
            <input
              placeholder="Nome do espaço"
              value={locationForm.name}
              onChange={e => setLocationForm(prev => ({ ...prev, name: e.target.value }))}
            />
            <input
              placeholder="Bairro"
              value={locationForm.bairro}
              onChange={e => setLocationForm(prev => ({ ...prev, bairro: e.target.value }))}
            />
            <input
              placeholder="Tipo (areia, ginásio, condomínio)"
              value={locationForm.tipo}
              onChange={e => setLocationForm(prev => ({ ...prev, tipo: e.target.value }))}
            />
            <input
              placeholder="Superfície (areia, sintética, madeira)"
              value={locationForm.superficie}
              onChange={e => setLocationForm(prev => ({ ...prev, superficie: e.target.value }))}
            />
            <label className="file-label">
              Foto da quadra (anexar obrigatório)
              <input type="file" accept="image/*" onChange={handlePhotoFile} />
            </label>
            <div className="latlng-row">
              <input
                placeholder="Latitude (opcional)"
                value={locationForm.lat}
                onChange={e => setLocationForm(prev => ({ ...prev, lat: e.target.value }))}
              />
              <input
                placeholder="Longitude (opcional)"
                value={locationForm.lng}
                onChange={e => setLocationForm(prev => ({ ...prev, lng: e.target.value }))}
              />
            </div>
            <button type="button" onClick={handleAddLocation}>
              Salvar local
            </button>
          </div>
        )}

        <label>Data e hora</label>
        <input type="datetime-local" value={form.datetime} onChange={e => update('datetime', e.target.value)} />

        <label>Vagas</label>
        <input type="number" value={form.slots_total} onChange={e => update('slots_total', Number(e.target.value))} />

        <div className="plan-callout">
          <strong>Taxa fixa R$ 1,00 por atleta</strong>
          <p className="meta">
            A assinatura FitHub cobra cada participante automaticamente, envia R$ {(FEE * FUND_SHARE).toFixed(2)} para o fundo e ativa o desconto semanal de R$ {DISCOUNT_PLAN.promoValue.toFixed(2)}.
          </p>
        </div>

        <label>Nível</label>
        <select value={form.level} onChange={e => update('level', e.target.value)}>
          <option>Iniciante</option>
          <option>Intermediário</option>
          <option>Avançado</option>
        </select>

        <label>Time convidado</label>
        <select value={form.teamId} onChange={e => update('teamId', e.target.value)}>
          <option value="">Sem time fixo</option>
          {teams.map(team => (
            <option key={team.id} value={team.id}>
              {team.name} · {team.sport}
            </option>
          ))}
        </select>
        <button type="button" className="ghost" onClick={() => setShowTeamForm(s => !s)}>
          {showTeamForm ? 'Cancelar novo time' : 'Criar time rápido'}
        </button>
        {showTeamForm && (
          <div className="team-form">
            <input
              placeholder="Nome do time"
              value={teamForm.name}
              onChange={e => setTeamForm(prev => ({ ...prev, name: e.target.value }))}
            />
            <input
              placeholder="Esporte"
              value={teamForm.sport}
              onChange={e => setTeamForm(prev => ({ ...prev, sport: e.target.value }))}
            />
            <input
              placeholder="Integrantes (separados por vírgula)"
              value={teamForm.members}
              onChange={e => setTeamForm(prev => ({ ...prev, members: e.target.value }))}
            />
            <button type="button" onClick={handleCreateTeam}>
              Salvar time
            </button>
          </div>
        )}

        <label>Estatísticas do jogo</label>
        <p className="form-hint">Escolha o que a galera vai medir durante a partida.</p>
        <div className="stats-grid">
          {statPool.map(stat => (
            <label
              key={stat}
              className={`stat-chip ${form.stats.includes(stat) ? 'active' : ''}`}
            >
              <input
                type="checkbox"
                checked={form.stats.includes(stat)}
                onChange={() => toggleStat(stat)}
              />
              {stat}
            </label>
          ))}
          {statPool.length === 0 && <span className="meta">Nenhuma métrica definida.</span>}
        </div>
        <div className="custom-stat-row">
          <input
            placeholder="Adicionar métrica (ex.: Cartões amarelos)"
            value={customStat}
            onChange={e => setCustomStat(e.target.value)}
          />
          <button type="button" onClick={addCustomStat}>
            Adicionar
          </button>
        </div>

        <button className="primary" type="submit">
          Publicar
        </button>
      </form>
    </div>
  )
}

function StoriesView({ stories, onAddStory }) {
  const [form, setForm] = useState({ eventName: '', venue: '', beforePhoto: '', afterPhoto: '', caption: '' })
  const [beforePreview, setBeforePreview] = useState(null)
  const [afterPreview, setAfterPreview] = useState(null)
  const feed = [...stories].sort((a, b) => b.createdAt - a.createdAt)

  function handleFileChange(e, type) {
    const file = e.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target.result
      if (type === 'before') {
        setBeforePreview(dataUrl)
        setForm(prev => ({ ...prev, beforePhoto: dataUrl }))
      } else {
        setAfterPreview(dataUrl)
        setForm(prev => ({ ...prev, afterPhoto: dataUrl }))
      }
    }
    reader.readAsDataURL(file)
  }

  function submit(e) {
    e.preventDefault()
    onAddStory(form)
    setForm({ eventName: '', venue: '', beforePhoto: '', afterPhoto: '', caption: '' })
    setBeforePreview(null)
    setAfterPreview(null)
  }

  async function shareStory(story) {
    const shareText = `🏆 ${story.eventName}\n📍 ${story.venue}\n\n${story.caption}\n\n#FitHub #Esporte #CheckIn`
    const shareUrl = window.location.href

    // Try native share (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: story.eventName,
          text: shareText,
          url: shareUrl
        })
        return
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.log('Share cancelled or failed')
        }
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(shareText + '\n\n' + shareUrl)
      alert('✅ Texto copiado! Cole no Instagram ou WhatsApp.')
    } catch (err) {
      // Last fallback: prompt with text
      prompt('Copie o texto abaixo para compartilhar:', shareText)
    }
  }

  return (
    <div className="view stories-view">
      <div className="section-head">
        <div>
          <h3>Stories esportivos</h3>
          <p>Foto antes + foto depois para validar check-in e liberar no Insta.</p>
        </div>
      </div>
      <div className="stories-hero">
        <div>
          <p className="eyebrow">Modo FitHub Social</p>
          <h4>Registre o visual da galera antes e depois da partida.</h4>
          <p className="meta">
            Cada postagem gera um carrossel compartilhável e fica salvo no histórico da equipe.
          </p>
        </div>
        <div className="stories-count">
          <span>{feed.length}</span>
          <p>Stories salvos</p>
        </div>
      </div>
      <div className="story-grid">
        {feed.map(story => (
          <article key={story.id} className="story-card">
            <header>
              <div className="avatar tiny">{story.athlete?.[0] || '?'}</div>
              <div>
                <strong>{story.athlete}</strong>
                <p className="meta">{story.eventName} · {new Date(story.createdAt).toLocaleTimeString('pt-BR')}</p>
              </div>
            </header>
            <div className="story-photos">
              <figure>
                <span>Antes</span>
                <img src={story.beforePhoto} alt={`Antes de ${story.eventName}`} />
              </figure>
              <figure>
                <span>Depois</span>
                <img src={story.afterPhoto} alt={`Depois de ${story.eventName}`} />
              </figure>
            </div>
            <p>{story.caption}</p>
            <div className="story-footer">
              <small>{story.venue}</small>
              <button className="ghost" onClick={() => shareStory(story)}>
                Compartilhar
              </button>
            </div>
          </article>
        ))}
        {feed.length === 0 && <EmptyState message="Ainda não há registros visuais." />}
      </div>
      <div className="story-form">
        <h4>Postar novo registro</h4>
        <form onSubmit={submit}>
          <label>Evento / título</label>
          <input value={form.eventName} onChange={e => setForm(prev => ({ ...prev, eventName: e.target.value }))} />
          <label>Quadra / local</label>
          <input value={form.venue} onChange={e => setForm(prev => ({ ...prev, venue: e.target.value }))} />
          
          <div className="photo-upload-row">
            <div className="photo-upload-box">
              <label>📸 Foto pré-jogo</label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={e => handleFileChange(e, 'before')}
                id="before-photo-input"
              />
              <label htmlFor="before-photo-input" className="upload-area">
                {beforePreview ? (
                  <img src={beforePreview} alt="Preview antes" />
                ) : (
                  <div className="upload-placeholder">
                    <span>📷</span>
                    <p>Clique para anexar</p>
                  </div>
                )}
              </label>
            </div>
            
            <div className="photo-upload-box">
              <label>📸 Foto pós-jogo</label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={e => handleFileChange(e, 'after')}
                id="after-photo-input"
              />
              <label htmlFor="after-photo-input" className="upload-area">
                {afterPreview ? (
                  <img src={afterPreview} alt="Preview depois" />
                ) : (
                  <div className="upload-placeholder">
                    <span>📷</span>
                    <p>Clique para anexar</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <label>Legenda</label>
          <textarea value={form.caption} onChange={e => setForm(prev => ({ ...prev, caption: e.target.value }))} />
          <button type="submit" className="primary">
            Salvar e compartilhar
          </button>
        </form>
      </div>
    </div>
  )
}

function TeamsView({ teams, onCreateTeam, notifyTeam, onRespondPing }) {
  const [form, setForm] = useState({ name: '', sport: 'Futebol 5x5', members: '' })

  function submit(e) {
    e.preventDefault()
    if (!form.name.trim()) {
      alert('Nome obrigatório para o time.')
      return
    }
    const members = form.members
      .split(',')
      .map(item => item.trim())
      .filter(Boolean)
    onCreateTeam({ ...form, members })
    setForm({ name: '', sport: 'Futebol 5x5', members: '' })
  }

  function getResponseIcon(status) {
    if (status === 'confirmed') return '✅'
    if (status === 'declined') return '❌'
    return '⏳'
  }

  function getResponseLabel(status) {
    if (status === 'confirmed') return 'Confirmado'
    if (status === 'declined') return 'Recusou'
    return 'Aguardando'
  }

  const sortedTeams = [...teams].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="view">
      <div className="section-head">
        <div>
          <h3>Times fixos</h3>
          <p>Monte squads, convide a galera e dispare convites instantâneos.</p>
        </div>
      </div>
      {sortedTeams.length === 0 && <EmptyState message="Cadastre o primeiro time." />}
      <div className="team-grid">
        {sortedTeams.map(team => {
          const hasActivePing = team.lastPing && team.pingResponses
          const confirmedCount = hasActivePing 
            ? Object.values(team.pingResponses).filter(r => r === 'confirmed').length 
            : 0
          const declinedCount = hasActivePing 
            ? Object.values(team.pingResponses).filter(r => r === 'declined').length 
            : 0
          const pendingCount = hasActivePing 
            ? Object.values(team.pingResponses).filter(r => r === 'pending').length 
            : 0

          return (
            <article key={team.id} className="team-card">
              <div className="team-head">
                <h4>{team.name}</h4>
                <span className="team-tag">{team.sport}</span>
              </div>
              <p className="meta">Capitão: {team.captain}</p>
              
              <div className="team-members-status">
                {team.members.map(member => {
                  const status = team.pingResponses?.[member] || null
                  return (
                    <div key={member} className={`member-row ${status || ''}`}>
                      <span className="member-name">{member}</span>
                      {status && (
                        <div className="member-response">
                          <span className="response-icon">{getResponseIcon(status)}</span>
                          <span className="response-label">{getResponseLabel(status)}</span>
                          {status === 'pending' && (
                            <div className="response-actions">
                              <button 
                                className="mini-btn confirm" 
                                onClick={() => onRespondPing(team.id, member, 'confirmed')}
                                title="Simular confirmação"
                              >
                                ✓
                              </button>
                              <button 
                                className="mini-btn decline" 
                                onClick={() => onRespondPing(team.id, member, 'declined')}
                                title="Simular recusa"
                              >
                                ✗
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {hasActivePing && (
                <div className="ping-summary">
                  <span className="confirmed">✅ {confirmedCount}</span>
                  <span className="declined">❌ {declinedCount}</span>
                  <span className="pending">⏳ {pendingCount}</span>
                </div>
              )}

              <div className="team-actions">
                <button className="ghost" onClick={() => notifyTeam(team.id)}>
                  {hasActivePing ? '🔄 Novo ping' : '📢 Ping do grupo'}
                </button>
              </div>
            </article>
          )
        })}
      </div>
      <div className="team-create">
        <h4>Criar novo time</h4>
        <form onSubmit={submit}>
          <input
            placeholder="Nome do time"
            value={form.name}
            onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
          />
          <input
            placeholder="Esporte"
            value={form.sport}
            onChange={e => setForm(prev => ({ ...prev, sport: e.target.value }))}
          />
          <textarea
            placeholder="Integrantes (separe por vírgula)"
            value={form.members}
            onChange={e => setForm(prev => ({ ...prev, members: e.target.value }))}
          />
          <button type="submit" className="primary">
            Registrar time
          </button>
        </form>
      </div>
    </div>
  )
}

function ChampionshipsView({ kids, championships, onAddKid, onCreateChampionship, onEnroll, onJoinChampionship, user, teams }) {
  const [kidForm, setKidForm] = useState({ name: '', age: '', sport: '', guardian: '' })
  const [champForm, setChampForm] = useState({
    name: '',
    sport: 'Futebol Society',
    category: 'Livre',
    fee: '',
    startDate: '',
    description: '',
    prizes: '',
    rules: '',
    maxTeams: 8,
    playersPerTeam: 5
  })
  const [selection, setSelection] = useState({ champId: '', kidId: '' })
  const [showKidsSection, setShowKidsSection] = useState(false)
  const [enrollModal, setEnrollModal] = useState(null) // championship being enrolled
  const [enrollForm, setEnrollForm] = useState({
    mode: 'solo', // 'solo' | 'team' | 'create-team'
    playerName: user?.name || '',
    playerPhone: '',
    selectedTeamId: '',
    newTeamName: ''
  })

  function submitKid(e) {
    e.preventDefault()
    const created = onAddKid(kidForm)
    if (created) setKidForm({ name: '', age: '', sport: '', guardian: '' })
  }

  function submitChamp(e) {
    e.preventDefault()
    const created = onCreateChampionship(champForm)
    if (created) setChampForm({ 
      name: '', sport: 'Futebol Society', category: 'Livre', fee: '', startDate: '', 
      description: '', prizes: '', rules: '', maxTeams: 8, playersPerTeam: 5 
    })
  }

  function handleEnroll(e) {
    e.preventDefault()
    onEnroll(selection.champId, selection.kidId)
  }

  function openEnrollModal(champ) {
    setEnrollModal(champ)
    setEnrollForm({
      mode: 'solo',
      playerName: user?.name || '',
      playerPhone: '',
      selectedTeamId: '',
      newTeamName: ''
    })
  }

  function submitEnrollment(e) {
    e.preventDefault()
    if (!enrollModal) return
    onJoinChampionship(enrollModal.id, enrollForm)
    setEnrollModal(null)
  }

  function getTeamStatus(champ) {
    const champTeams = champ.teams || []
    const soloCount = champ.soloPlayers?.length || 0
    const filledTeams = champTeams.length
    const maxTeams = champ.maxTeams || 8
    const playersPerTeam = champ.playersPerTeam || 5
    const incompleteTeams = champTeams.filter(t => t.members.length < playersPerTeam)
    return { filledTeams, maxTeams, playersPerTeam, soloCount, incompleteTeams }
  }

  return (
    <div className="view championships-view">
      <div className="section-head">
        <div>
          <h3>Campeonatos</h3>
          <p>Crie e participe de campeonatos relâmpago para qualquer modalidade e categoria.</p>
        </div>
      </div>
      <div className="champ-grid">
        {championships.map(champ => {
          const status = getTeamStatus(champ)
          return (
            <article key={champ.id} className="champ-card clickable" onClick={() => openEnrollModal(champ)}>
              <header>
                <div>
                  <h4>{champ.name}</h4>
                  <p className="meta">{champ.sport} · {champ.category}</p>
                </div>
                <span className="fee-pill">R$ {(Number(champ.fee) || 0).toFixed(2)}</span>
              </header>
              <p>{champ.description}</p>
              {champ.prizes && (
                <div className="champ-info">
                  <span className="info-icon">🏆</span>
                  <p>{champ.prizes}</p>
                </div>
              )}
              {champ.rules && (
                <div className="champ-info">
                  <span className="info-icon">📋</span>
                  <p>{champ.rules}</p>
                </div>
              )}
              <p className="meta">Início: {new Date(champ.startDate).toLocaleDateString('pt-BR')}</p>
              
              <div className="champ-team-status">
                <div className="status-item">
                  <span className="status-label">Times</span>
                  <span className="status-value">{status.filledTeams}/{status.maxTeams}</span>
                </div>
                <div className="status-item">
                  <span className="status-label">Por time</span>
                  <span className="status-value">{status.playersPerTeam} jogadores</span>
                </div>
                {status.soloCount > 0 && (
                  <div className="status-item solo">
                    <span className="status-label">Aguardando time</span>
                    <span className="status-value">{status.soloCount}</span>
                  </div>
                )}
              </div>

              <button className="primary enroll-btn" onClick={(e) => { e.stopPropagation(); openEnrollModal(champ) }}>
                Inscrever-se
              </button>
            </article>
          )
        })}
      </div>

      {/* Modal de Inscrição */}
      {enrollModal && (
        <div className="modal-overlay" onClick={() => setEnrollModal(null)}>
          <div className="modal enroll-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setEnrollModal(null)}>✕</button>
            <h3>Inscrição: {enrollModal.name}</h3>
            <p className="meta">{enrollModal.sport} · {enrollModal.category} · R$ {(Number(enrollModal.fee) || 0).toFixed(2)}</p>
            
            <form onSubmit={submitEnrollment} className="enroll-form">
              <div className="input-group">
                <label>Seu nome completo</label>
                <input
                  placeholder="Nome"
                  value={enrollForm.playerName}
                  onChange={e => setEnrollForm(prev => ({ ...prev, playerName: e.target.value }))}
                  required
                />
              </div>
              <div className="input-group">
                <label>Telefone / WhatsApp</label>
                <input
                  placeholder="(00) 00000-0000"
                  value={enrollForm.playerPhone}
                  onChange={e => setEnrollForm(prev => ({ ...prev, playerPhone: e.target.value }))}
                  required
                />
              </div>

              <div className="enroll-mode-selector">
                <label>Como deseja participar?</label>
                <div className="mode-options">
                  <button
                    type="button"
                    className={`mode-btn ${enrollForm.mode === 'solo' ? 'active' : ''}`}
                    onClick={() => setEnrollForm(prev => ({ ...prev, mode: 'solo' }))}
                  >
                    <span className="mode-icon">🎲</span>
                    <span>Time aleatório</span>
                    <small>Entro em qualquer time com vaga</small>
                  </button>
                  <button
                    type="button"
                    className={`mode-btn ${enrollForm.mode === 'team' ? 'active' : ''}`}
                    onClick={() => setEnrollForm(prev => ({ ...prev, mode: 'team' }))}
                  >
                    <span className="mode-icon">👥</span>
                    <span>Meu time</span>
                    <small>Já tenho um time formado</small>
                  </button>
                  <button
                    type="button"
                    className={`mode-btn ${enrollForm.mode === 'create-team' ? 'active' : ''}`}
                    onClick={() => setEnrollForm(prev => ({ ...prev, mode: 'create-team' }))}
                  >
                    <span className="mode-icon">➕</span>
                    <span>Criar time</span>
                    <small>Criar novo e abrir vagas</small>
                  </button>
                </div>
              </div>

              {enrollForm.mode === 'solo' && (
                <div className="enroll-info-box">
                  <p>🎲 Você será alocado automaticamente em um time que precise de jogadores, ou aguardará na fila até um time abrir vaga.</p>
                </div>
              )}

              {enrollForm.mode === 'team' && (
                <div className="input-group">
                  <label>Selecione seu time</label>
                  <select
                    value={enrollForm.selectedTeamId}
                    onChange={e => setEnrollForm(prev => ({ ...prev, selectedTeamId: e.target.value }))}
                    required
                  >
                    <option value="">Escolha um time...</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.members.length} membros)</option>
                    ))}
                  </select>
                </div>
              )}

              {enrollForm.mode === 'create-team' && (
                <div className="input-group">
                  <label>Nome do novo time</label>
                  <input
                    placeholder="Ex: Tigres FC"
                    value={enrollForm.newTeamName}
                    onChange={e => setEnrollForm(prev => ({ ...prev, newTeamName: e.target.value }))}
                    required
                  />
                  <small className="meta">Você será o capitão. Outros jogadores solo poderão entrar para completar o time.</small>
                </div>
              )}

              <button type="submit" className="primary full-width">
                Confirmar inscrição - R$ {(Number(enrollModal.fee) || 0).toFixed(2)}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="registration-box">
        <div>
          <h4>Criar campeonato</h4>
          <form onSubmit={submitChamp} className="champ-form">
            <input
              placeholder="Nome do campeonato"
              value={champForm.name}
              onChange={e => setChampForm(prev => ({ ...prev, name: e.target.value }))}
            />
            <input
              placeholder="Modalidade"
              value={champForm.sport}
              onChange={e => setChampForm(prev => ({ ...prev, sport: e.target.value }))}
            />
            <select
              value={champForm.category}
              onChange={e => setChampForm(prev => ({ ...prev, category: e.target.value }))}
            >
              <option value="Livre">Livre (todas as idades)</option>
              <option value="Adulto">Adulto (18+)</option>
              <option value="Sub-17">Sub-17</option>
              <option value="Sub-15">Sub-15</option>
              <option value="Sub-13">Sub-13</option>
              <option value="Sub-11">Sub-11</option>
              <option value="Sub-9">Sub-9</option>
              <option value="Master">Master (40+)</option>
            </select>
            <div className="input-group">
              <label>Taxa de inscrição por atleta (R$)</label>
              <input
                placeholder="Ex: 25.00"
                type="number"
                step="0.01"
                min="0"
                value={champForm.fee}
                onChange={e => setChampForm(prev => ({ ...prev, fee: e.target.value }))}
              />
            </div>
            <div className="input-group">
              <label>Data de início: </label>
              <input
                type="date"
                value={champForm.startDate}
                onChange={e => setChampForm(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div className="input-group">
              <label>🏆 Prêmios e troféus: </label>
              <textarea
                placeholder="Ex: 1º lugar: Troféu + R$500 | 2º lugar: Medalha + R$200 | 3º lugar: Medalha"
                value={champForm.prizes}
                onChange={e => setChampForm(prev => ({ ...prev, prizes: e.target.value }))}
              />
            </div>
            <div className="input-group">
              <label>📋 Regras do campeonato: </label>
              <textarea
                placeholder="Ex: Jogos de 2 tempos de 15min, cartão vermelho = suspensão de 1 jogo..."
                value={champForm.rules}
                onChange={e => setChampForm(prev => ({ ...prev, rules: e.target.value }))}
              />
            </div>
            <div className="input-row">
              <div className="input-group">
                <label>Limite de times</label>
                <input
                  type="number"
                  min="2"
                  max="32"
                  value={champForm.maxTeams}
                  onChange={e => setChampForm(prev => ({ ...prev, maxTeams: e.target.value }))}
                />
              </div>
              <div className="input-group">
                <label>Jogadores por time</label>
                <input
                  type="number"
                  min="1"
                  max="22"
                  value={champForm.playersPerTeam}
                  onChange={e => setChampForm(prev => ({ ...prev, playersPerTeam: e.target.value }))}
                />
              </div>
            </div>
            <textarea
              placeholder="Descrição geral / informações adicionais"
              value={champForm.description}
              onChange={e => setChampForm(prev => ({ ...prev, description: e.target.value }))}
            />
            <button className="primary" type="submit">
              Anunciar campeonato
            </button>
          </form>
        </div>
      </div>

      <div className="kids-toggle">
        <button 
          className={showKidsSection ? 'secondary' : 'ghost'} 
          onClick={() => setShowKidsSection(!showKidsSection)}
        >
          {showKidsSection ? 'Ocultar seção Kids' : 'Cadastrar atleta kids'}
        </button>
      </div>

      {showKidsSection && (
        <div className="registration-box kids-box">
          <div>
            <h4>Cadastrar atleta kids</h4>
            <p className="meta">Para menores de idade, pais e responsáveis cadastram e acompanham.</p>
            <form onSubmit={submitKid} className="kid-form">
              <input
                placeholder="Nome completo"
                value={kidForm.name}
                onChange={e => setKidForm(prev => ({ ...prev, name: e.target.value }))}
              />
              <input
                placeholder="Idade"
                type="number"
                value={kidForm.age}
                onChange={e => setKidForm(prev => ({ ...prev, age: e.target.value }))}
              />
              <input
                placeholder="Modalidade favorita"
                value={kidForm.sport}
                onChange={e => setKidForm(prev => ({ ...prev, sport: e.target.value }))}
              />
              <input
                placeholder="Nome do responsável"
                value={kidForm.guardian}
                onChange={e => setKidForm(prev => ({ ...prev, guardian: e.target.value }))}
              />
              <button className="primary" type="submit">
                Salvar atleta kids
              </button>
            </form>
          </div>
          <div>
            <h4>Vincular atleta ao campeonato</h4>
            <form onSubmit={handleEnroll}>
              <select value={selection.kidId} onChange={e => setSelection(prev => ({ ...prev, kidId: e.target.value }))}>
                <option value="">Selecione o atleta</option>
                {kids.map(kid => (
                  <option key={kid.id} value={kid.id}>
                    {kid.name} · {kid.age} anos
                  </option>
                ))}
              </select>
              <select value={selection.champId} onChange={e => setSelection(prev => ({ ...prev, champId: e.target.value }))}>
                <option value="">Selecione o campeonato</option>
                {championships.map(champ => (
                  <option key={champ.id} value={champ.id}>
                    {champ.name} ({champ.category})
                  </option>
                ))}
              </select>
              <button className="primary" type="submit">
                Confirmar inscrição
              </button>
            </form>
            <p className="meta">
              Pagamento é processado via app e repassa verba para arbitragem e materiais.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function RankingView({ ranking, user }) {
  const [filters, setFilters] = useState({ estado: 'todos', quadra: 'todos', cidade: 'todos', faixa: 'todos' })

  const entries = Object.entries(ranking).sort((a, b) => b[1] - a[1])

  const estados = Array.from(new Set(Object.values(PLAYER_DIRECTORY).map(p => p.estado)))
  const cidades = Array.from(new Set(Object.values(PLAYER_DIRECTORY).map(p => p.cidade)))
  const quadras = Array.from(new Set(Object.values(PLAYER_DIRECTORY).map(p => p.quadra)))

  function matchesFilters(uid) {
    const meta = PLAYER_DIRECTORY[uid]
    if (!meta) return true
    const faixa = meta.idade < 20 ? 'Sub-20' : meta.idade < 30 ? '20-29' : meta.idade < 40 ? '30-39' : '40+'
    if (filters.estado !== 'todos' && meta.estado !== filters.estado) return false
    if (filters.cidade !== 'todos' && meta.cidade !== filters.cidade) return false
    if (filters.quadra !== 'todos' && meta.quadra !== filters.quadra) return false
    if (filters.faixa !== 'todos' && faixa !== filters.faixa) return false
    return true
  }

  const filteredEntries = entries.filter(([uid]) => matchesFilters(uid)).slice(0, 10)

  return (
    <div className="view">
      <div className="section-head">
        <div>
          <h3>Ranking</h3>
          <p>Quem joga mais, pontua mais e destrava brindes.</p>
        </div>
      </div>
      <div className="filter-grid">
        <select value={filters.estado} onChange={e => setFilters(prev => ({ ...prev, estado: e.target.value }))}>
          <option value="todos">Estado</option>
          {estados.map(estado => (
            <option key={estado}>{estado}</option>
          ))}
        </select>
        <select value={filters.cidade} onChange={e => setFilters(prev => ({ ...prev, cidade: e.target.value }))}>
          <option value="todos">Cidade</option>
          {cidades.map(cidade => (
            <option key={cidade}>{cidade}</option>
          ))}
        </select>
        <select value={filters.quadra} onChange={e => setFilters(prev => ({ ...prev, quadra: e.target.value }))}>
          <option value="todos">Quadra / Orla</option>
          {quadras.map(q => (
            <option key={q}>{q}</option>
          ))}
        </select>
        <select value={filters.faixa} onChange={e => setFilters(prev => ({ ...prev, faixa: e.target.value }))}>
          <option value="todos">Idade</option>
          <option value="Sub-20">Sub-20</option>
          <option value="20-29">20-29</option>
          <option value="30-39">30-39</option>
          <option value="40+">40+</option>
        </select>
      </div>
      <ol className="ranking">
        {filteredEntries.map(([uid, pts], idx) => (
          <li key={uid} className={uid === user.id ? 'me' : ''}>
            <span>
              {idx + 1}. {PLAYER_DIRECTORY[uid]?.name || uid}
              {PLAYER_DIRECTORY[uid] && (
                <small>
                  {' '}
                  · {PLAYER_DIRECTORY[uid].cidade} · {PLAYER_DIRECTORY[uid].quadra}
                </small>
              )}
            </span>
            <strong>{pts} pts</strong>
          </li>
        ))}
      </ol>
    </div>
  )
}

function FundView({ fund }) {
  return (
    <div className="view">
      <div className="fund-hero">
        <p>Fundo comunitário</p>
        <h3>R$ {fund.toFixed(2)}</h3>
        <p>
          Cada partida contribui com R$ {FEE.toFixed(2)} e metade disso abastece melhorias
          votadas pela comunidade: novas redes, lâmpadas e pintura.
        </p>
      </div>
    </div>
  )
}

function EnrollmentsView({
  events,
  joined,
  checkIn,
  history,
  openPerformanceModal
}) {
  const entries = Object.entries(joined)
  return (
    <div className="view">
      <div className="section-head">
        <div>
          <h3>Minhas inscrições</h3>
          <p>Faça check-in</p>
        </div>
      </div>
      {entries.length === 0 && <EmptyState message="Você ainda não tem jogos confirmados." />}
      {entries.map(([eid, data]) => {
        const ev = events.find(e => e.id === eid)
        if (!ev) return null
        function handleProof(method) {
          pickProof(method, proof => {
            if (!proof) return
            checkIn(eid, method, proof)
          })
        }
        return (
          <article key={eid} className="event-card">
            <div>
              <p className="sport">{ev.sport}</p>
              <h4>{ev.venue}</h4>
              <p className="meta">{new Date(ev.datetime).toLocaleString()}</p>
              <p className="meta">Status: {data.checked_in ? 'Check-in feito' : 'Pendente'}</p>
              {Array.isArray(ev.stats) && ev.stats.length > 0 && (
                <p className="meta stats-line">Métricas: {ev.stats.slice(0, 3).join(', ')}</p>
              )}
            </div>
            <div className="card-actions">
              {!data.checked_in && (
                <>
                  <button onClick={() => handleProof('photo')}>Foto</button>
                  <button onClick={() => handleProof('video')}>Vídeo</button>
                </>
              )}
              <button className="primary" onClick={() => openPerformanceModal(eid)}>
                Estatísticas
              </button>
            </div>
          </article>
        )
      })}

      <div className="section-head mini">
        <h4>Histórico</h4>
      </div>
      {history.length === 0 && <EmptyState message="Nenhum check-in registrado ainda." />}
      {history.map(item => (
        <article key={`${item.id}-${item.datetime}`} className="event-card">
          <div>
            <p className="sport">{item.sport}</p>
            <h4>{item.venue}</h4>
            <p className="meta">{new Date(item.datetime).toLocaleString('pt-BR')}</p>
            <p className="meta">Comprovado por {item.method === 'photo' ? 'foto' : 'vídeo'}</p>
            {item.proof && (
              <p className="meta stats-line">
                Comprovante: <a className="proof-link" href={item.proof} target="_blank" rel="noreferrer">ver</a>
              </p>
            )}
          </div>
        </article>
      ))}
    </div>
  )
}

function MonthlyPaymentModal({ open, onClose, totalDue, billing, onPay }) {
  if (!open) return null
  const paid = billing.paid && totalDue === 0
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <header>
          <div>
            <h4>Pagamento do mês</h4>
            <p className="meta">Cobra uma vez no fechamento.</p>
          </div>
          <button onClick={onClose}>Fechar</button>
        </header>
        {paid ? (
          <p className="meta">Mês atual quitado.</p>
        ) : (
          <>
            <p className="meta">Total devido: R$ {totalDue.toFixed(2)}</p>
            <div className="pay-actions">
              <button className="primary" onClick={() => onPay('cartão')}>
                Pagar no cartão
              </button>
              <button className="ghost" onClick={() => onPay('pix')}>
                Pagar via PIX
              </button>
            </div>
            <p className="meta">O valor considera todas as inscrições do mês.</p>
          </>
        )}
      </div>
    </div>
  )
}

function NotificationsModal({ open, onClose, notifications, onClear }) {
  if (!open) return null
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card wide notifications" onClick={e => e.stopPropagation()}>
        <header>
          <div>
            <h4>Notificações em tempo real</h4>
            <p className="meta">Convites de times e alertas de quadra aparecem aqui.</p>
          </div>
          <div className="modal-actions">
            <button className="ghost" onClick={onClose}>
              Fechar
            </button>
            <button className="ghost" onClick={onClear}>
              Limpar
            </button>
          </div>
        </header>
        <div className="notifications-list">
          {notifications.length === 0 && <p className="meta">Sem alertas por enquanto.</p>}
          {notifications.map(item => (
            <div key={item.id} className="notification-item">
              <div>
                <strong>{item.team}</strong>
                <p>{item.body}</p>
              </div>
              <small>{item.time}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PerformanceModal({ config, onClose, onSubmit }) {
  const defaults = {
    goals: '',
    passes: '',
    distance: '',
    minutes: 60,
    mvp: false,
    videoUrl: '',
    beforePhoto: '',
    afterPhoto: '',
    caption: ''
  }
  const [form, setForm] = useState(defaults)

  useEffect(() => {
    if (!config) return
    const isRun = (config.sportLabel || '').toLowerCase().includes('corrida')
    setForm({ ...defaults, distance: isRun ? 5 : 0 })
  }, [config])

  if (!config) return null

  function update(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function submit(e) {
    e.preventDefault()
    onSubmit(config.eventId, {
      ...form,
      goals: Number(form.goals) || 0,
      passes: Number(form.passes) || 0,
      distance: Number(form.distance) || 0,
      minutes: Number(form.minutes) || 60,
      sportLabel: config.sportLabel,
      datetime: config.datetime
    })
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card wide" onClick={e => e.stopPropagation()}>
        <header>
          <div>
            <h4>Registrar estatísticas</h4>
            <p className="meta">{config.sportLabel} · {config.venue}</p>
            <p className="meta">{new Date(config.datetime).toLocaleString('pt-BR')}</p>
          </div>
          <button onClick={onClose}>Fechar</button>
        </header>
        <form className="modal-form" onSubmit={submit}>
          <label>Gols marcados</label>
          <input
            type="number"
            min="0"
            value={form.goals}
            onChange={e => update('goals', e.target.value)}
          />
          <label>Passes</label>
          <input
            type="number"
            min="0"
            value={form.passes}
            onChange={e => update('passes', e.target.value)}
          />
          <label>Distância (km) · ideal para corridas</label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={form.distance}
            onChange={e => update('distance', e.target.value)}
          />
          <label>Minutos jogados</label>
          <input
            type="number"
            min="10"
            max="180"
            value={form.minutes}
            onChange={e => update('minutes', e.target.value)}
          />
          <label>Link do vídeo (YouTube, Drive...)</label>
          <input
            placeholder="https://..."
            value={form.videoUrl}
            onChange={e => update('videoUrl', e.target.value)}
          />
          <label>Foto pré-jogo (URL)</label>
          <input
            placeholder="https://..."
            value={form.beforePhoto}
            onChange={e => update('beforePhoto', e.target.value)}
          />
          <label>Foto pós-jogo (URL)</label>
          <input
            placeholder="https://..."
            value={form.afterPhoto}
            onChange={e => update('afterPhoto', e.target.value)}
          />
          <label>Legenda para o Stories</label>
          <textarea
            value={form.caption}
            onChange={e => update('caption', e.target.value)}
          />
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.mvp}
              onChange={e => update('mvp', e.target.checked)}
            />
            Fui destaque (MVP)
          </label>
          <div className="modal-actions">
            <button type="button" className="ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="primary">
              Salvar e finalizar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ChatModal({
  open,
  onClose,
  friends,
  chatMessages,
  activeFriend,
  onSelectFriend,
  onAddFriend,
  onSendMessage
}) {
  const [friendName, setFriendName] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!open) {
      setFriendName('')
      setMessage('')
    }
  }, [open])

  if (!open) return null

  const targetName = activeFriend ? activeFriend.name : 'Feed'
  const filteredMessages = chatMessages.filter(msg => {
    if (!activeFriend) return true
    return msg.from === targetName || msg.to === targetName
  })

  function handleSend(e) {
    e.preventDefault()
    if (!message.trim()) return
    onSendMessage(targetName, message)
    setMessage('')
  }

  function handleAddFriend(e) {
    e.preventDefault()
    if (!friendName.trim()) return
    onAddFriend(friendName)
    setFriendName('')
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card wide chat-modal" onClick={e => e.stopPropagation()}>
        <header>
          <div>
            <h4>Chat esportivo</h4>
            <p className="meta">
              Selecione amigos ou mantenha no feed geral para avisos rápidos.
            </p>
          </div>
          <button className="ghost" onClick={onClose}>
            Fechar
          </button>
        </header>
        <div className="chat-wrapper">
          <div className="friend-panel">
            <button
              className={`friend-card ${!activeFriend ? 'active' : ''}`}
              onClick={() => onSelectFriend(null)}
            >
              Feed geral
              <small>Todos</small>
            </button>
            {friends.map(friend => (
              <button
                key={friend.id}
                className={`friend-card ${activeFriend?.id === friend.id ? 'active' : ''}`}
                onClick={() => onSelectFriend(friend)}
              >
                {friend.name}
                <small>{friend.status}</small>
              </button>
            ))}
            <form className="friend-form" onSubmit={handleAddFriend}>
              <input
                placeholder="Adicionar amigo"
                value={friendName}
                onChange={e => setFriendName(e.target.value)}
              />
              <button type="submit">Salvar</button>
            </form>
          </div>
          <div className="chat-feed">
            <div className="chat-messages">
              {filteredMessages.length === 0 && (
                <p className="meta">Nenhuma conversa ainda por aqui.</p>
              )}
              {filteredMessages.map(msg => (
                <div
                  key={msg.id}
                  className={`chat-message ${msg.from === AUTH_USER.name ? 'me' : ''}`}
                >
                  <div>
                    <strong>{msg.from}</strong>
                    <p>{msg.text}</p>
                  </div>
                  <small>
                    {new Date(msg.timestamp).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </small>
                </div>
              ))}
            </div>
            <form className="chat-form" onSubmit={handleSend}>
              <input
                placeholder={`Mensagem para ${targetName}`}
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
              <button type="submit" className="primary">
                Enviar
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProfileView({ user, ranking, joined, history, performance }) {
  const unpaid = Object.values(joined).filter(item => !item.paid).length
  const totals = performance.totals || {}
  return (
    <div className="view">
      <div className="section-head">
        <div>
          <h3>Perfil</h3>
          <p>Seus números no mês.</p>
        </div>
      </div>
      <div className="profile-card">
        <div className="avatar large">{user.name[0]}</div>
        <div>
          <h4>{user.name}</h4>
          <p className="meta">{user.city}</p>
          <div className="stats">
            <div>
              <small>Pontos: </small>
              <strong>{ranking[user.id] || 0}</strong>
            </div>
            <div>
              <small>Inscrições: </small>
              <strong>{Object.keys(joined).length}</strong>
            </div>
          </div>
        </div>
      </div>
      <div className="profile-card plan-card">
        <div>
          <h4>Plano FitHub R$ 1,00</h4>
          <p className="meta">
            Cada atividade custa R$ 1,00 · {(
              FEE * FUND_SHARE
            ).toFixed(2)}{' '}
            vai direto para o fundo da quadra.
          </p>
          <p className="meta">
            Promo: {DISCOUNT_PLAN.requirement} → R$ {DISCOUNT_PLAN.promoValue.toFixed(2)} / semana.
          </p>
        </div>
        <div>
          <small>Pagamentos pendentes:  </small>
          <strong>{unpaid}</strong>
          <p className="meta">Cheque o modal no topo para quitar.</p>
        </div>
      </div>
      <div className="profile-card stats-breakdown">
        <div>
          <small>Gols:  </small>
          <strong>{totals.goals || 0}</strong>
        </div>
        <div>
          <small>Passes:  </small>
          <strong>{totals.passes || 0}</strong>
        </div>
        <div>
          <small>Km:  </small>
          <strong>{(totals.distance || 0).toFixed(1)}</strong>
        </div>
      </div>
      {history.length > 0 && (
        <div className="history-timeline">
          <h4>Últimos registros</h4>
          {history.slice(0, 4).map(item => (
            <div key={item.id + item.datetime} className="history-row">
              <div>
                <p className="sport">{item.sport}</p>
                <p className="meta">
                  {new Date(item.datetime).toLocaleDateString('pt-BR')} · {item.venue}
                </p>
              </div>
              <div className="stat-line">
                <span>Gols {item.goals}</span>
                <span>Passes {item.passes}</span>
                {item.distance > 0 && <span>{item.distance} km</span>}
                {item.videoUrl && (
                  <button onClick={() => hasWindow() && window.open(item.videoUrl, '_blank')}>
                    Vídeo
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AdminView({ events, fund, joined, ranking, chatMessages, notifications, history }) {
  const totalEvents = events.length
  const totalSlots = events.reduce((acc, ev) => acc + (ev.slots_total || 0), 0)
  const totalTaken = events.reduce((acc, ev) => acc + (ev.slots_taken || 0), 0)
  const fillRate = totalSlots ? Math.round((totalTaken / totalSlots) * 100) : 0
  const gross = totalTaken * FEE
  const paid = Object.values(joined).filter(item => item.paid).length
  const pending = Object.values(joined).filter(item => !item.paid).length
  const checkins = Object.values(joined).filter(item => item.checked_in).length
  const topRanking = Object.entries(ranking).sort((a, b) => b[1] - a[1]).slice(0, 5)

  return (
    <div className="view admin-view">
      <div className="section-head">
        <div>
          <h3>Painel master</h3>
          <p>Visão consolidada: arrecadação, ocupação e alertas locais.</p>
        </div>
      </div>

      <div className="admin-grid">
        <div className="admin-card">
          <p className="meta">Eventos publicados</p>
          <h4>{totalEvents}</h4>
        </div>
        <div className="admin-card">
          <p className="meta">Vagas preenchidas</p>
          <h4>{totalTaken} / {totalSlots}</h4>
          <small className="meta">Taxa de ocupação: {fillRate}%</small>
        </div>
        <div className="admin-card">
          <p className="meta">Receita bruta estimada</p>
          <h4>R$ {gross.toFixed(2)}</h4>
          <small className="meta">Taxa fixa de R$ {FEE.toFixed(2)} por atleta</small>
        </div>
        <div className="admin-card">
          <p className="meta">Fundo comunitário</p>
          <h4>R$ {fund.toFixed(2)}</h4>
        </div>
        <div className="admin-card">
          <p className="meta">Pagamentos</p>
          <h4>{paid} pagos · {pending} pendentes</h4>
        </div>
        <div className="admin-card">
          <p className="meta">Check-ins validados</p>
          <h4>{checkins}</h4>
        </div>
      </div>

      <div className="admin-card wide">
        <div className="panel-head">
          <h4>Eventos e ocupação</h4>
          <span className="meta">Dados locais (demo)</span>
        </div>
        <div className="table">
          <div className="table-head">
            <span>Esporte</span>
            <span>Local</span>
            <span>Vagas</span>
            <span>Nível</span>
            <span>Host</span>
            <span>Receita</span>
          </div>
          {events.map(ev => (
            <div key={ev.id} className="table-row">
              <span>{ev.sport}</span>
              <span>{ev.venue}</span>
              <span>{ev.slots_taken}/{ev.slots_total}</span>
              <span>{ev.level}</span>
              <span>{ev.creator}</span>
              <span>R$ {(ev.slots_taken * FEE).toFixed(2)}</span>
            </div>
          ))}
          {events.length === 0 && <p className="meta">Sem eventos cadastrados.</p>}
        </div>
      </div>

      <div className="admin-split">
        <div className="admin-card">
          <div className="panel-head">
            <h4>Cobranças e check-ins</h4>
            <span className="meta">Base: sessão local</span>
          </div>
          {Object.keys(joined).length === 0 && <p className="meta">Nenhuma inscrição local.</p>}
          {Object.entries(joined).map(([eid, data]) => (
            <div key={eid} className="admin-line">
              <div>
                <strong>{eid}</strong>
                <p className="meta">Pago: {data.paid ? 'Sim' : 'Não'} · Check-in: {data.checked_in ? data.method || 'Sim' : 'Não'}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="admin-card">
          <div className="panel-head">
            <h4>Top ranking</h4>
            <span className="meta">Top 5</span>
          </div>
          <ol className="ranking small">
            {topRanking.map(([uid, pts], idx) => (
              <li key={uid}>
                <span>{idx + 1}. {PLAYER_DIRECTORY[uid]?.name || uid}</span>
                <strong>{pts} pts</strong>
              </li>
            ))}
            {topRanking.length === 0 && <p className="meta">Sem pontuações.</p>}
          </ol>
        </div>
      </div>

      <div className="admin-split">
        <div className="admin-card">
          <div className="panel-head">
            <h4>Alertas recentes</h4>
            <span className="meta">Notificações locais</span>
          </div>
          <div className="stack">
            {notifications.length === 0 && <p className="meta">Sem alertas.</p>}
            {notifications.slice(0, 5).map(item => (
              <div key={item.id} className="admin-line">
                <strong>{item.team || 'Feed'}</strong>
                <p className="meta">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="admin-card">
          <div className="panel-head">
            <h4>Chat (últimas 5)</h4>
            <span className="meta">Visão leitura</span>
          </div>
          <div className="stack">
            {chatMessages.length === 0 && <p className="meta">Sem mensagens.</p>}
            {chatMessages.slice(-5).reverse().map(msg => (
              <div key={msg.id} className="admin-line">
                <strong>{msg.from}</strong>
                <p className="meta">{msg.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="panel-head">
          <h4>Histórico finalizado</h4>
          <span className="meta">Últimos 5</span>
        </div>
        <div className="stack">
          {history.slice(0, 5).map(item => (
            <div key={item.id + item.datetime} className="admin-line">
              <strong>{item.sport}</strong>
              <p className="meta">{new Date(item.datetime).toLocaleString('pt-BR')} · {item.venue}</p>
              <p className="meta">Gols {item.goals} · Passes {item.passes} · Km {item.distance}</p>
            </div>
          ))}
          {history.length === 0 && <p className="meta">Sem partidas encerradas.</p>}
        </div>
      </div>
    </div>
  )
}

function HowItWorks() {
  const steps = [
    {
      title: 'Escolha esportes',
      body: 'Futebol, vôlei, basquete, futevôlei ou corridas coletivas. Configure alertas por nível e horário.'
    },
    {
      title: 'Veja jogos perto',
      body: 'Filtros por bairro, quadra, estado e faixa etária. Entre em 1 toque.'
    },
    {
      title: 'Check-in + estatísticas',
      body: 'foto ou vídeo validam presença. Registre gols, passes e distância percorrida com link do seu highlight.'
    },
    {
      title: 'Ranking + Fundo',
      body: 'Pontos viram brindes e filtros mostram quem domina cada quadra. Cada atividade realizada injeta um valor ao fundo.'
    }
  ]

  return (
    <section className="how">
      <h2>Do match ao apito final.</h2>
      <div className="steps">
        {steps.map(step => (
          <article key={step.title}>
            <h4>{step.title}</h4>
            <p>{step.body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function EmptyState({ message, compact }) {
  return <div className={`empty ${compact ? 'compact' : ''}`}>{message}</div>
}

function LoginScreen({ onSubmit, error, onReset, loading }) {
  const [form, setForm] = useState({ name: '', password: '' })
  const [mode, setMode] = useState('login') // login | register | recover
  const [status, setStatus] = useState('')
  const [lookAway, setLookAway] = useState(false)
  const [peek, setPeek] = useState(false)
  const [eyeDir, setEyeDir] = useState('center') // left | right | center
  const [mouthOpen, setMouthOpen] = useState(false)
  const typingTimer = useRef(null)

  function update(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
    setMouthOpen(true)
    if (typingTimer.current) clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => setMouthOpen(false), 900)
  }

  function handleMode(next) {
    setMode(next)
    setStatus('')
    setForm({ name: '', password: '' })
    setLookAway(false)
    setPeek(false)
    setEyeDir('center')
    setMouthOpen(false)
    if (typingTimer.current) clearTimeout(typingTimer.current)
  }

  function submit(e) {
    e.preventDefault()
    if (mode === 'recover') {
      setStatus('Enviamos um link de redefinição para o seu e-mail.')
      setMouthOpen(false)
      return
    }
    setMouthOpen(false)
    onSubmit({ ...form, isRegister: mode === 'register' })
  }

  const title = mode === 'login' ? 'Entrar para jogar' : mode === 'register' ? 'Criar conta' : 'Recuperar acesso'
  const subtitle = mode === 'login'
    ? 'Use seu email ou nome para entrar. Ainda não tem conta? Clique em Criar conta.'
    : mode === 'register'
      ? 'Cadastre-se para salvar partidas e ranking.'
      : 'Informe seu e-mail para receber o link de redefinição.'

  return (
    <div className="login-shell">
      <div className="login-card">
        <p className="eyebrow">FitHub protótipo</p>
        <h1>{title}</h1>
        <p className="lead">{subtitle}</p>

        <div className="mascot-row">
          {[0, 1, 2].map(idx => {
            const isPeeker = idx === 1
            const closed = lookAway && !isPeeker
            const peekOneEye = lookAway && isPeeker
            return (
              <div
                key={idx}
                className={`mascot ${lookAway ? 'look-away' : ''} ${peekOneEye ? 'peek' : ''} dir-${eyeDir}`}
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <div className="mascot-face">
                  <div className="mascot-eyes">
                    <span className={`eye ${closed ? 'closed' : ''}`} />
                    <span className={`eye ${peekOneEye ? 'peek-eye' : closed ? 'closed' : ''}`} />
                  </div>
                  <div className={`mascot-mouth ${closed ? 'shy' : mouthOpen ? 'open' : ''}`} />
                  <div className="mascot-hands">
                    <span className={`hand left ${lookAway ? 'cover' : ''}`} />
                    <span className={`hand right ${lookAway ? 'cover' : ''} ${peekOneEye ? 'peek-hand' : ''}`} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="login-switch">
          <button className={mode === 'login' ? 'active' : ''} type="button" onClick={() => handleMode('login')}>
            Entrar
          </button>
          <button className={mode === 'register' ? 'active' : ''} type="button" onClick={() => handleMode('register')}>
            Criar conta
          </button>
          <button className={mode === 'recover' ? 'active' : ''} type="button" onClick={() => handleMode('recover')}>
            Esqueci senha
          </button>
        </div>

        <form onSubmit={submit}>
          <label>E-mail</label>
          <input
            type="email"
            placeholder="seu@email.com"
            value={form.name}
            onFocus={() => { setLookAway(false); setPeek(false); setEyeDir('left') }}
            onBlur={() => { setEyeDir('center'); setPeek(false); setLookAway(false); setMouthOpen(false) }}
            onChange={e => update('name', e.target.value)}
          />
          {mode !== 'recover' && (
            <>
              <label>Senha</label>
              <input
                type={peek ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onFocus={() => { setLookAway(true); setPeek(true); setEyeDir('left') }}
                onBlur={() => { setEyeDir('center'); setPeek(false); setLookAway(false); setMouthOpen(false) }}
                onChange={e => update('password', e.target.value)}
              />
              <small className="login-error">{error}</small>
            </>
          )}
          {mode === 'recover' && <small className="login-status">{status}</small>}
          <button className="primary" type="submit" disabled={loading}>
            {loading ? 'Aguarde...' : mode === 'login' ? 'Acessar painel' : mode === 'register' ? 'Registrar' : 'Enviar link'}
          </button>
          {onReset && (
            <button className="ghost" type="button" onClick={onReset}>
              Limpar dados
            </button>
          )}
        </form>
      </div>
    </div>
  )
}

function Toast({ message, type, visible }) {
  if (!visible) return null
  return (
    <div className={`toast toast-${type}`}>
      {message}
    </div>
  )
}
