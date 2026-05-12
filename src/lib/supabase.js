import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  || 'https://YOUR_PROJECT.supabase.co'
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseKey)

// ── Auth helpers ──────────────────────────────────────────────

export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { data, error }
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/dashboard` }
  })
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// ── Edge Function helpers ─────────────────────────────────────

export async function invokeFunction(name, body) {
  const { data, error } = await supabase.functions.invoke(name, { body })
  return { data, error }
}

export async function getEmbedding(text) {
  const { data, error } = await invokeFunction('embed', { text })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data.embedding
}

// ── RAG / Documents ───────────────────────────────────────────

export async function fetchDocuments() {
  const { data, error } = await supabase
    .from('documents')
    .select('id, name, created_at, chunk_count, status')
    .order('created_at', { ascending: false })
  return { data, error }
}

export async function semanticSearch(embedding, matchCount = 5) {
  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: embedding,
    match_threshold: 0.75,
    match_count: matchCount,
  })
  return { data, error }
}

export async function ingestDocument(name, content, userId) {
  const { data, error } = await invokeFunction('ingest', { name, content, userId })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data
}

// ── Support Tickets ───────────────────────────────────────────

export async function fetchTickets() {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false })
  return { data, error }
}

export async function createTicket(ticket) {
  const { data, error } = await supabase
    .from('tickets')
    .insert([ticket])
    .select()
  return { data, error }
}

// ── Chat history ──────────────────────────────────────────────

export async function saveChatMessage(sessionId, role, content) {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert([{ session_id: sessionId, role, content }])
  return { data, error }
}

export async function fetchChatHistory(sessionId) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
  return { data, error }
}
