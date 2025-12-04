import React, { useState, useEffect } from 'react'

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
  { id: 'arena_x', label: 'Quadra Arena X · Pituba', tipo: 'Sintética', bairro: 'Pituba', superficie: 'grama sintética' },
  { id: 'poliesportivo_y', label: 'Poliesportivo Y · Barris', tipo: 'Ginásio coberto', bairro: 'Barris', superficie: 'madeira' },
  { id: 'quadra_3', label: 'Quadra 3 · Stiep', tipo: 'Areia', bairro: 'Stiep', superficie: 'areia' },
  { id: 'areia_ribeira', label: 'Arena de Areia Ribeira', tipo: 'Areia', bairro: 'Ribeira', superficie: 'areia' },
  { id: 'condominio_lagos', label: 'Condomínio Lagos · Paralela', tipo: 'Quadra de condomínio', bairro: 'Paralela', superficie: 'piso flexível' },
  { id: 'orla_barra', label: 'Orla da Barra · Pista 5 km', tipo: 'Corrida', bairro: 'Barra', superficie: 'asfalto' },
  { id: 'condominio_mar_azul', label: 'Condomínio Mar Azul · Jaguaribe', tipo: 'Quadra de areia', bairro: 'Jaguaribe', superficie: 'areia' }
]

const DEFAULT_TEAMS = [
  {
    id: 'tigers',
    name: 'Salvador Tigers',
    sport: 'Futebol 5x5',
    captain: 'Lucas Santiago',
    members: ['Lucas Santiago', 'João Vilar', 'Caio Silva', 'Igor Passos']
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
    beforePhoto: 'https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?auto=format&fit=crop&w=500&q=80',
    afterPhoto: 'https://images.unsplash.com/photo-1502810190503-830027aa7e2e?auto=format&fit=crop&w=500&q=80',
    caption: 'Antes e depois do treino — check-in feito com o squad inteiro.',
    createdAt: Date.now() - 1000 * 60 * 45
  },
  {
    id: 'story2',
    athlete: 'Mariana Lopes',
    eventName: 'Basquete 3x3 · Barris',
    venue: 'Poliesportivo Y',
    beforePhoto: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=500&q=80',
    afterPhoto: 'https://images.unsplash.com/photo-1461897104016-0b3b00cc81ee?auto=format&fit=crop&w=500&q=80',
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
    registrations: ['kid1']
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
    datetime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
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
    datetime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
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
    datetime: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
    slots_total: 25,
    slots_taken: 12,
    price_per_player: 1,
    creator: 'Ana Runner',
    level: 'Todos os ritmos',
    stats: statsPresetFor('Corrida')
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
  city: 'Salvador'
}
const AUTH_PASSWORD = '123'

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
  kids: 'demo_kids'
}

const hasWindow = () => typeof window !== 'undefined'

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
  const [user, setUser] = useState(() => readLocalJSON(STORAGE_KEYS.user, null))
  const [events, setEvents] = useState(() => {
    const stored = readLocalJSON(STORAGE_KEYS.events, defaultEvents)
    return hydrateEvents(stored)
  })
  const [swipeIndex, setSwipeIndex] = useState(0)
  const [view, setView] = useState('home')
  const [joined, setJoined] = useState(() => readLocalJSON(STORAGE_KEYS.joined, {}))
  const [fund, setFund] = useState(() => readLocalNumber(STORAGE_KEYS.fund, 0))
  const [ranking, setRanking] = useState(() => readLocalJSON(STORAGE_KEYS.ranking, DEFAULT_RANKING))
  const [performance, setPerformance] = useState(() =>
    readLocalJSON(STORAGE_KEYS.performance, { totals: {}, videos: [] })
  )
  const [history, setHistory] = useState(() => readLocalJSON(STORAGE_KEYS.history, []))
  const [venues, setVenues] = useState(() => readLocalJSON(STORAGE_KEYS.venues, SALVADOR_LOCATIONS))
  const [teams, setTeams] = useState(() => readLocalJSON(STORAGE_KEYS.teams, DEFAULT_TEAMS))
  const [friends, setFriends] = useState(() => readLocalJSON(STORAGE_KEYS.friends, DEFAULT_FRIENDS))
  const [chatMessages, setChatMessages] = useState(() => readLocalJSON(STORAGE_KEYS.chat, DEFAULT_CHAT))
  const [notifications, setNotifications] = useState(() => readLocalJSON(STORAGE_KEYS.notifications, []))
  const [stories, setStories] = useState(() => readLocalJSON(STORAGE_KEYS.stories, DEFAULT_STORIES))
  const [championships, setChampionships] = useState(() =>
    readLocalJSON(STORAGE_KEYS.championships, DEFAULT_CHAMPIONSHIPS)
  )
  const [kids, setKids] = useState(() => readLocalJSON(STORAGE_KEYS.kids, DEFAULT_KIDS))
  const [authError, setAuthError] = useState('')
  const [showPayments, setShowPayments] = useState(false)
  const [activePerformance, setActivePerformance] = useState(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [activeFriend, setActiveFriend] = useState(null)

  useEffect(() => {
    if (user) {
      persistJSON(STORAGE_KEYS.user, user)
    } else {
      removeKey(STORAGE_KEYS.user)
    }
  }, [user])

  useEffect(() => {
    persistJSON(STORAGE_KEYS.events, safeEventsArr())
    persistJSON(STORAGE_KEYS.joined, joined)
    persistString(STORAGE_KEYS.fund, String(fund))
    persistJSON(STORAGE_KEYS.ranking, ranking)
    persistJSON(STORAGE_KEYS.performance, performance)
    persistJSON(STORAGE_KEYS.history, history)
    persistJSON(STORAGE_KEYS.venues, venues)
    persistJSON(STORAGE_KEYS.teams, teams)
    persistJSON(STORAGE_KEYS.friends, friends)
    persistJSON(STORAGE_KEYS.chat, chatMessages)
    persistJSON(STORAGE_KEYS.notifications, notifications)
    persistJSON(STORAGE_KEYS.stories, stories)
    persistJSON(STORAGE_KEYS.championships, championships)
    persistJSON(STORAGE_KEYS.kids, kids)
  }, [
    events,
    joined,
    fund,
    ranking,
    performance,
    history,
    venues,
    teams,
    friends,
    chatMessages,
    notifications,
    stories,
    championships,
    kids
  ])

  useEffect(() => {
    if (user) {
      setRanking(prev => {
        if (prev[user.id]) return prev
        return { ...prev, [user.id]: 0 }
      })
    }
  }, [user])

  function safeEventsArr() {
    return Array.isArray(events) ? events : defaultEvents
  }

  function handleLogin({ name, password }) {
    const normalized = name.trim().toLowerCase()
    const expected = AUTH_USER.name.toLowerCase()
    if (normalized === expected && password === AUTH_PASSWORD) {
      setUser(AUTH_USER)
      setAuthError('')  
    } else {
      setAuthError('Credenciais inválidas para este ambiente.')
    }
  }

  function handleLogout() {
    setUser(null)
    setAuthError('')
    setView('home')
  }

  function acceptEvent(event) {
    if (!user) {
      alert('Faça login para entrar nas partidas.')
      return
    }
    const arr = safeEventsArr()
    const found = arr.find(ev => ev.id === event.id)
    if (!found) {
      alert('Evento não encontrado')
      return
    }
    if (found.slots_taken < found.slots_total) {
      const updated = arr.map(ev =>
        ev.id === event.id ? { ...ev, slots_taken: ev.slots_taken + 1 } : ev
      )

      setEvents(updated)
      setJoined(prev => ({
        ...prev,
        [event.id]: { userId: user.id, checked_in: false, paid: false }
      }))
      const fundAdd = FEE * FUND_SHARE
      setFund(prev => +(prev + fundAdd).toFixed(2))

      setRanking(prev => ({
        ...prev,
        [user.id]: (prev[user.id] || 0) + 1
      }))

      const eventTime = new Date(found.datetime).getTime()
      const reminderTime = eventTime - 30 * 60 * 1000
      const now = Date.now()

      if (reminderTime > now) {
        setTimeout(() => {
          alert(`⏰ Lembrete: sua partida de ${found.sport} começa em 30 minutos!`)
        }, reminderTime - now)
      }

      alert('Você entrou na partida — confirme presença quando chegar (Check-in).')
    } else {
      alert('Desculpa, essa partida já está cheia.')
    }

    setSwipeIndex(i => i + 1)
  }

  function rejectEvent() {
    setSwipeIndex(i => i + 1)
  }

  function togglePaymentStatus(eventId) {
    setJoined(prev => {
      if (!prev[eventId]) return prev
      return {
        ...prev,
        [eventId]: { ...prev[eventId], paid: !prev[eventId].paid }
      }
    })
  }

  function openPerformanceModal(eventId) {
    const ev = safeEventsArr().find(item => item.id === eventId)
    if (!ev) {
      alert('Evento não encontrado para registrar estatísticas.')
      return
    }
    setActivePerformance({ eventId, event: ev })
  }

  function closePerformanceModal() {
    setActivePerformance(null)
  }

  function addCustomLocation({ name, bairro, tipo, superficie }) {
    if (!name || !bairro) return null
    const label = `${name} · ${bairro}`
    const entry = {
      id: slugify(label + Date.now()),
      label,
      bairro,
      tipo: tipo || 'Quadra',
      superficie: superficie || 'misto'
    }
    setVenues(prev => {
      if (prev.find(item => item.label === entry.label)) return prev
      return [...prev, entry]
    })
    return entry
  }

  function createTeamEntry({ name, sport, members }) {
    if (!name) return null
    const entry = {
      id: slugify(name + Date.now()),
      name,
      sport: sport || 'Futebol 5x5',
      captain: AUTH_USER.name,
      members: members && members.length ? members : [AUTH_USER.name]
    }
    setTeams(prev => [...prev, entry])
    notifyTeamMembers(entry.id, null, 'Novo time criado', entry)
    return entry
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
      alert('Informe o nome da criança.')
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
      alert('Nome obrigatório para o campeonato.')
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
      alert('Selecione campeonato e atleta mirim.')
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

  function createEvent(form) {
    const id = 'e' + Math.floor(Math.random() * 100000)
    const stats = Array.isArray(form.stats) && form.stats.length ? form.stats : statsPresetFor(form.sport)
    const ev = { id, ...form, price_per_player: 1, stats }
    setEvents([ev, ...safeEventsArr()])
    setView('home')
    if (form.teamId) {
      notifyTeamMembers(form.teamId, ev, 'Convite para jogo')
    }
  }

  function checkIn(eventId, method = 'qr') {
    if (!user) {
      alert('Faça login para confirmar presença.')
      return
    }
    if (!joined[eventId]) {
      alert('Você ainda não entrou nessa partida.')
      return
    }

    setJoined(prev => ({
      ...prev,
      [eventId]: { ...prev[eventId], checked_in: true, method }
    }))

    const points = method === 'qr' ? 5 : method === 'photo' ? 3 : 6

    setRanking(prev => ({
      ...prev,
      [user.id]: (prev[user.id] || 0) + points
    }))

    alert(`Check-in registrado por ${method}. Você ganhou ${points} pontos!`)
  }

  function finishEvent(eventId, { minutes = 60, mvp = false, goals = 0, passes = 0, distance = 0, videoUrl = '' } = {}) {
    if (!user) {
      alert('Faça login para finalizar partidas.')
      return false
    }
    if (!joined[eventId]) {
      alert('Você não está inscrito nessa partida.')
      return false
    }
    const ev = safeEventsArr().find(e => e.id === eventId)
    if (!ev) {
      alert('Evento não encontrado.')
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
    alert(`Partida finalizada. Ganhou ${base + bonus} pontos.`)
    return true
  }

  const onlineCount = safeEventsArr().reduce((total, ev) => total + (ev.slots_taken || 0), 0)

  if (!user) {
    return <LoginScreen onSubmit={handleLogin} error={authError} />
  }

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
                togglePaymentStatus={togglePaymentStatus}
                openPerformanceModal={openPerformanceModal}
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
          openPerformanceModal={openPerformanceModal}
          togglePaymentStatus={togglePaymentStatus}
        />
      )
    }
    if (view === 'teams') {
      return (
        <TeamsView
          teams={teams}
          onCreateTeam={createTeamEntry}
          notifyTeam={teamId => notifyTeamMembers(teamId, null, 'Ping manual')}
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
      <Footer fund={fund} />
      <PaymentStatusModal
        open={showPayments}
        onClose={() => setShowPayments(false)}
        joined={joined}
        events={safeEventsArr()}
        togglePaymentStatus={togglePaymentStatus}
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
  return (
    <header className="app-header">
      <div className="brand">
        <span className="spark">⚡</span>
        FitHub
      </div>
      <nav>
        {['home', 'stories', 'create', 'teams', 'campeonatos', 'ranking', 'fund', 'inscricoes', 'profile'].map(item => (
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
          {user.name}
        </button>
        <button className="ghost icon-button" onClick={onShowNotifications}>
          🔔
          {unreadCount > 0 && <span className="icon-badge">{unreadCount}</span>}
        </button>
        <button className="ghost icon-button" onClick={onShowChat}>
          💬
        </button>
        <button className="ghost" onClick={onLogout}>
          Sair
        </button>
      </div>
    </header>
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
    profile: 'Perfil'
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
        <li>Check-in via QR, foto ou vídeo para pontuar.</li>
        <li>Uma taxa simbólica abastece o fundo comunitário.</li>
      </ol>
      <div className="fund-pill">
        Fundo comunitário atual
        <span>R$ {fund.toFixed(2)}</span>
      </div>
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
  togglePaymentStatus,
  openPerformanceModal
}) {
  const [search, setSearch] = useState('')
  const filtered = events.filter(ev => ev.sport.toLowerCase().includes(search.toLowerCase()))
  const deck = filtered.slice(swipeIndex)

  return (
    <div className="view home">
      <div className="home-grid">
        <div>
          <div className="section-head">
            <div>
              <h3>Partidas perto</h3>
              <p>Atualizado em tempo real a cada confirmação.</p>
            </div>
            <input
              className="search"
              placeholder="Buscar esporte"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {deck.length === 0 && <EmptyState message="Sem partidas — crie uma nova!" />}
          {deck.slice(0, 3).map(ev => (
            <EventCard key={ev.id} event={ev} onReject={rejectEvent} onAccept={() => acceptEvent(ev)} />
          ))}
        </div>
        <PlayerPanel
          joined={joined}
          events={events}
          user={user}
          checkIn={checkIn}
          fund={fund}
          history={history}
          performance={performance}
          togglePaymentStatus={togglePaymentStatus}
          openPerformanceModal={openPerformanceModal}
        />
      </div>
    </div>
  )
}

function EventCard({ event, onAccept, onReject }) {
  const openSlots = event.slots_total - event.slots_taken
  const when = new Date(event.datetime).toLocaleString('pt-BR', {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <article className="event-card">
      <div>
        <p className="sport">{event.sport}</p>
        <h4>{event.venue}</h4>
        <p className="meta">
          {when} · {event.level} · Host: {event.creator}
        </p>
      </div>
      <div className="details">
        <div>
          <small>Vagas</small>
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
        <button className="primary" onClick={onAccept}>
          Entrar
        </button>
      </div>
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
  togglePaymentStatus,
  openPerformanceModal
}) {
  const entries = Object.entries(joined)
  const totals = performance.totals || {}
  const lastVideos = performance.videos || []

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
          return (
            <div key={eid} className="enrollment">
              <div>
                <p className="sport">{ev.sport}</p>
                <p className="meta">{ev.venue}</p>
                <p className="meta">Status: {data.checked_in ? 'Check-in feito' : 'Pendente'}</p>
                <p className={`meta payment ${data.paid ? 'paid' : 'pending'}`}>
                  Pagamento: {data.paid ? 'Confirmado' : 'Pendente'}
                </p>
                {Array.isArray(ev.stats) && ev.stats.length > 0 && (
                  <p className="meta stats-line">Métricas: {ev.stats.slice(0, 3).join(', ')}</p>
                )}
              </div>
              <div className="enrollment-actions">
                {!data.checked_in && (
                  <>
                    <button onClick={() => checkIn(eid, 'qr')}>QR</button>
                    <button onClick={() => checkIn(eid, 'photo')}>Foto</button>
                    <button onClick={() => checkIn(eid, 'video')}>Vídeo</button>
                  </>
                )}
                <button className="ghost" onClick={() => togglePaymentStatus(eid)}>
                  {data.paid ? 'Marcar pendente' : 'Confirmar pagamento'}
                </button>
                <button className="primary" onClick={() => openPerformanceModal(eid)}>
                  Estatísticas
                </button>
              </div>
            </div>
          )
        })}
      </div>
      <div className="panel-block fund">
        <p>Fundo comunitário</p>
        <strong>R$ {fund.toFixed(2)}</strong>
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
  const [locationForm, setLocationForm] = useState({ name: '', bairro: '', tipo: 'Quadra', superficie: '' })
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
      setLocationForm({ name: '', bairro: '', tipo: 'Quadra', superficie: '' })
      setShowLocationForm(false)
    } else {
      alert('Preencha nome e bairro do local.')
    }
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
  const feed = [...stories].sort((a, b) => b.createdAt - a.createdAt)

  function submit(e) {
    e.preventDefault()
    onAddStory(form)
    setForm({ eventName: '', venue: '', beforePhoto: '', afterPhoto: '', caption: '' })
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
          <p className="eyebrow">Modo Strava</p>
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
              <button className="ghost" onClick={() => alert('Link copiado para Stories!')}>
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
          <label>Foto pré-jogo (URL)</label>
          <input value={form.beforePhoto} onChange={e => setForm(prev => ({ ...prev, beforePhoto: e.target.value }))} />
          <label>Foto pós-jogo (URL)</label>
          <input value={form.afterPhoto} onChange={e => setForm(prev => ({ ...prev, afterPhoto: e.target.value }))} />
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

function TeamsView({ teams, onCreateTeam, notifyTeam }) {
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
        {sortedTeams.map(team => (
          <article key={team.id} className="team-card">
            <div className="team-head">
              <h4>{team.name}</h4>
              <span className="team-tag">{team.sport}</span>
            </div>
            <p className="meta">Capitão: {team.captain}</p>
            <div className="team-members">
              {team.members.map(member => (
                <span key={member}>{member}</span>
              ))}
            </div>
            <div className="team-actions">
              <button className="ghost" onClick={() => notifyTeam(team.id)}>
                Ping do grupo
              </button>
            </div>
          </article>
        ))}
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

function ChampionshipsView({ kids, championships, onAddKid, onCreateChampionship, onEnroll }) {
  const [kidForm, setKidForm] = useState({ name: '', age: '', sport: '', guardian: '' })
  const [champForm, setChampForm] = useState({
    name: '',
    sport: 'Futebol Society',
    category: 'Sub-11',
    fee: 25,
    startDate: '',
    description: ''
  })
  const [selection, setSelection] = useState({ champId: '', kidId: '' })

  function submitKid(e) {
    e.preventDefault()
    const created = onAddKid(kidForm)
    if (created) setKidForm({ name: '', age: '', sport: '', guardian: '' })
  }

  function submitChamp(e) {
    e.preventDefault()
    const created = onCreateChampionship(champForm)
    if (created) setChampForm({ name: '', sport: 'Futebol Society', category: 'Sub-11', fee: 25, startDate: '', description: '' })
  }

  function handleEnroll(e) {
    e.preventDefault()
    onEnroll(selection.champId, selection.kidId)
  }

  return (
    <div className="view championships-view">
      <div className="section-head">
        <div>
          <h3>Campeonatos e categorias kids</h3>
          <p>Pais e responsáveis cadastram atletas mirins e pagam uma taxa simbólica para disputar.</p>
        </div>
      </div>
      <div className="champ-grid">
        {championships.map(champ => (
          <article key={champ.id} className="champ-card">
            <header>
              <div>
                <h4>{champ.name}</h4>
                <p className="meta">{champ.sport} · {champ.category}</p>
              </div>
              <span className="fee-pill">R$ {champ.fee.toFixed(2)}</span>
            </header>
            <p>{champ.description}</p>
            <p className="meta">Início: {new Date(champ.startDate).toLocaleDateString('pt-BR')}</p>
            <div className="champ-registrations">
              <strong>{champ.registrations.length}</strong>
              <span>atletas confirmados</span>
            </div>
          </article>
        ))}
      </div>
      <div className="registration-box">
        <div>
          <h4>1. Cadastre seu filho(a)</h4>
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
              placeholder="Responsável"
              value={kidForm.guardian}
              onChange={e => setKidForm(prev => ({ ...prev, guardian: e.target.value }))}
            />
            <button className="primary" type="submit">
              Salvar atleta kids
            </button>
          </form>
        </div>
        <div>
          <h4>2. Criar campeonato relâmpago</h4>
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
            <input
              placeholder="Categoria (ex.: Sub-9)"
              value={champForm.category}
              onChange={e => setChampForm(prev => ({ ...prev, category: e.target.value }))}
            />
            <input
              placeholder="Taxa simbólica"
              type="number"
              value={champForm.fee}
              onChange={e => setChampForm(prev => ({ ...prev, fee: e.target.value }))}
            />
            <input
              type="date"
              value={champForm.startDate}
              onChange={e => setChampForm(prev => ({ ...prev, startDate: e.target.value }))}
            />
            <textarea
              placeholder="Descrição / regulamento"
              value={champForm.description}
              onChange={e => setChampForm(prev => ({ ...prev, description: e.target.value }))}
            />
            <button className="primary" type="submit">
              Anunciar campeonato
            </button>
          </form>
        </div>
      </div>
      <div className="enroll-box">
        <h4>3. Vincular atleta ao campeonato</h4>
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
                {champ.name}
              </option>
            ))}
          </select>
          <button className="primary" type="submit">
            Confirmar vaga kids
          </button>
        </form>
        <p className="meta">
          Pagamento simbólico é processado via app e repassa verba para arbitragem e materiais.
        </p>
      </div>
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
          <h3>Ranking mensal</h3>
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
  openPerformanceModal,
  togglePaymentStatus
}) {
  const entries = Object.entries(joined)
  return (
    <div className="view">
      <div className="section-head">
        <div>
          <h3>Minhas inscrições</h3>
          <p>Faça check-in para não perder pontos.</p>
        </div>
      </div>
      {entries.length === 0 && <EmptyState message="Você ainda não tem jogos confirmados." />}
      {entries.map(([eid, data]) => {
        const ev = events.find(e => e.id === eid)
        if (!ev) return null
        return (
          <article key={eid} className="event-card">
            <div>
              <p className="sport">{ev.sport}</p>
              <h4>{ev.venue}</h4>
              <p className="meta">{new Date(ev.datetime).toLocaleString()}</p>
              <p className="meta">Status: {data.checked_in ? 'Check-in feito' : 'Pendente'}</p>
              <p className={`meta payment ${data.paid ? 'paid' : 'pending'}`}>
                Pagamento: {data.paid ? 'Confirmado' : 'Pendente'}
              </p>
              {Array.isArray(ev.stats) && ev.stats.length > 0 && (
                <p className="meta stats-line">Métricas: {ev.stats.slice(0, 3).join(', ')}</p>
              )}
            </div>
            <div className="card-actions">
              {!data.checked_in && (
                <>
                  <button onClick={() => checkIn(eid, 'qr')}>QR</button>
                  <button onClick={() => checkIn(eid, 'photo')}>Foto</button>
                  <button onClick={() => checkIn(eid, 'video')}>Vídeo</button>
                </>
              )}
              <button className="ghost" onClick={() => togglePaymentStatus(eid)}>
                {data.paid ? 'Marcar pendente' : 'Confirmar pagamento'}
              </button>
              <button className="primary" onClick={() => openPerformanceModal(eid)}>
                Estatísticas
              </button>
            </div>
          </article>
        )
      })}
    </div>
  )
}

function PaymentStatusModal({ open, onClose, joined, events, togglePaymentStatus }) {
  if (!open) return null
  const entries = Object.entries(joined)
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <header>
          <h4>Pagamentos por atividade</h4>
          <button onClick={onClose}>Fechar</button>
        </header>
        {entries.length === 0 && <p className="meta">Sem inscrições no momento.</p>}
        {entries.map(([eid, data]) => {
          const ev = events.find(item => item.id === eid)
          if (!ev) return null
          return (
            <div key={eid} className="payment-row">
              <div>
                <strong>{ev.sport}</strong>
                <p className="meta">{ev.venue}</p>
                <p className={`meta payment ${data.paid ? 'paid' : 'pending'}`}>
                  {data.paid ? 'Pago' : 'Pendente'}
                </p>
              </div>
              <button onClick={() => togglePaymentStatus(eid)}>
                {data.paid ? 'Reabrir cobrança' : 'Confirmar R$ 1,00'}
              </button>
            </div>
          )
        })}
        <p className="modal-foot">Cada pagamento envia R$ {(FEE * FUND_SHARE).toFixed(2)} para a quadra.</p>
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
    const isRun = config.event.sport.toLowerCase().includes('corrida')
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
      sportLabel: config.event.sport,
      datetime: config.event.datetime
    })
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card wide" onClick={e => e.stopPropagation()}>
        <header>
          <div>
            <h4>Registrar estatísticas</h4>
            <p className="meta">{config.event.sport}</p>
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
          <small>Pagamentos pendentes</small>
          <strong>{unpaid}</strong>
          <p className="meta">Cheque o modal no topo para quitar.</p>
        </div>
      </div>
      <div className="profile-card stats-breakdown">
        <div>
          <small>Gols</small>
          <strong>{totals.goals || 0}</strong>
        </div>
        <div>
          <small>Passes</small>
          <strong>{totals.passes || 0}</strong>
        </div>
        <div>
          <small>Km</small>
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

function HowItWorks() {
  const steps = [
    {
      title: 'Escolha esportes',
      body: 'Futebol, vôlei, basquete, futevôlei ou corridas coletivas. Configure alertas por nível e horário.'
    },
    {
      title: 'Veja jogos perto',
      body: 'Filtros por bairro, quadra, estado e faixa etária. Entre em 1 toque com taxa fixa de R$ 1,00.'
    },
    {
      title: 'Check-in + estatísticas',
      body: 'QR, foto ou vídeo validam presença. Registre gols, passes e distância percorrida com link do seu highlight.'
    },
    {
      title: 'Ranking + Fundo',
      body: 'Pontos viram brindes e filtros mostram quem domina cada quadra. Cada atividade injeta R$ 0,50 no fundo.'
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

function Footer({ fund }) {
  return (
    <footer className="footer">
      <div>
        <p>Demo funcional — dados locais.</p>
        <small>Fundo atual: R$ {fund.toFixed(2)}</small>
      </div>
      <p>FitHub · Construído em Salvador</p>
    </footer>
  )
}

function EmptyState({ message, compact }) {
  return <div className={`empty ${compact ? 'compact' : ''}`}>{message}</div>
}

function LoginScreen({ onSubmit, error }) {
  const [form, setForm] = useState({ name: '', password: '' })

  function update(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function submit(e) {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <p className="eyebrow">FitHub protótipo</p>
        <h1>Entrar para jogar</h1>
        <p className="lead">
          Use o acesso de demonstração para ver como o "FitHub" funciona na prática.
        </p>
        <form onSubmit={submit}>
          <label>Nome completo</label>
          <input
            placeholder="Lucas Santiago"
            value={form.name}
            onChange={e => update('name', e.target.value)}
          />
          <label>Senha</label>
          <input
            type="password"
            placeholder="123"
            value={form.password}
            onChange={e => update('password', e.target.value)}
          />
          {error && <p className="login-error">{error}</p>}
          <button className="primary" type="submit">
            Acessar painel
          </button>
        </form>
      </div>
    </div>
  )
}
