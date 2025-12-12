import { supabase } from './supabase'

// =============================================
// AUTH
// =============================================

export async function signUp(email, password, name) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name }
    }
  })
  if (error) throw error
  return data
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}

// =============================================
// VENUES
// =============================================

export async function getVenues() {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .order('name')
  if (error) throw error
  return data
}

export async function createVenue(venue) {
  const { data, error } = await supabase
    .from('venues')
    .insert([venue])
    .select()
    .single()
  if (error) throw error
  return data
}

// =============================================
// EVENTS
// =============================================

export async function getEvents() {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      venue:venues(*),
      creator:profiles(id, name),
      players:event_players(
        id,
        paid,
        checked_in,
        user:profiles(id, name)
      ),
      stats:event_stats(id, label)
    `)
    .order('datetime', { ascending: true })
  if (error) throw error
  return data
}

export async function getEvent(id) {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      venue:venues(*),
      creator:profiles(id, name),
      players:event_players(
        id,
        paid,
        checked_in,
        checkin_method,
        user:profiles(id, name)
      ),
      stats:event_stats(id, label)
    `)
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createEvent(event, stats = []) {
  // Inserir evento
  const { data: newEvent, error: eventError } = await supabase
    .from('events')
    .insert([{
      sport: event.sport,
      venue_id: event.venue_id,
      datetime: event.datetime,
      slots_total: event.slots_total,
      price_per_player: event.price_per_player || 1,
      level: event.level,
      creator_id: event.creator_id
    }])
    .select()
    .single()
  
  if (eventError) throw eventError

  // Inserir stats do evento
  if (stats.length > 0) {
    const statsToInsert = stats.map(label => ({
      event_id: newEvent.id,
      label
    }))
    
    const { error: statsError } = await supabase
      .from('event_stats')
      .insert(statsToInsert)
    
    if (statsError) throw statsError
  }

  return newEvent
}

export async function updateEvent(id, updates) {
  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteEvent(id) {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// =============================================
// EVENT PLAYERS (Inscrições)
// =============================================

export async function joinEvent(eventId, userId) {
  const { data, error } = await supabase
    .from('event_players')
    .insert([{
      event_id: eventId,
      user_id: userId
    }])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function leaveEvent(eventId, userId) {
  const { error } = await supabase
    .from('event_players')
    .delete()
    .eq('event_id', eventId)
    .eq('user_id', userId)
  if (error) throw error
}

export async function checkIn(eventId, userId, method = 'photo') {
  const { data, error } = await supabase
    .from('event_players')
    .update({
      checked_in: true,
      checkin_method: method
    })
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function markAsPaid(eventId, userId) {
  const { data, error } = await supabase
    .from('event_players')
    .update({ paid: true })
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}

// =============================================
// TEAMS
// =============================================

export async function getTeams() {
  const { data, error } = await supabase
    .from('teams')
    .select(`
      *,
      captain:profiles(id, name),
      members:team_members(
        user:profiles(id, name)
      )
    `)
    .order('name')
  if (error) throw error
  return data
}

export async function createTeam(team) {
  const { data, error } = await supabase
    .from('teams')
    .insert([team])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function joinTeam(teamId, userId) {
  const { data, error } = await supabase
    .from('team_members')
    .insert([{
      team_id: teamId,
      user_id: userId
    }])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function leaveTeam(teamId, userId) {
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('user_id', userId)
  if (error) throw error
}

// =============================================
// CHAMPIONSHIPS
// =============================================

export async function getChampionships() {
  const { data, error } = await supabase
    .from('championships')
    .select(`
      *,
      organizer:profiles(id, name),
      teams:championship_teams(
        team:teams(*)
      )
    `)
    .order('start_date', { ascending: true })
  if (error) throw error
  return data
}

export async function createChampionship(championship) {
  const { data, error } = await supabase
    .from('championships')
    .insert([championship])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function registerTeamInChampionship(championshipId, teamId) {
  const { data, error } = await supabase
    .from('championship_teams')
    .insert([{
      championship_id: championshipId,
      team_id: teamId
    }])
    .select()
    .single()
  if (error) throw error
  return data
}

// =============================================
// PERFORMANCES
// =============================================

export async function getPerformances(userId) {
  const { data, error } = await supabase
    .from('performances')
    .select(`
      *,
      event:events(sport, venue:venues(name))
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function savePerformance(performance) {
  const { data, error } = await supabase
    .from('performances')
    .insert([performance])
    .select()
    .single()
  if (error) throw error
  return data
}

// =============================================
// REALTIME SUBSCRIPTIONS
// =============================================

export function subscribeToEvents(callback) {
  return supabase
    .channel('events-changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'events' },
      (payload) => callback(payload)
    )
    .subscribe()
}

export function subscribeToEventPlayers(eventId, callback) {
  return supabase
    .channel(`event-${eventId}-players`)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'event_players', filter: `event_id=eq.${eventId}` },
      (payload) => callback(payload)
    )
    .subscribe()
}
