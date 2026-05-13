/**
 * chatAPI.js — AI routing layer
 *
 * LOCAL DEV  (VITE_LOCAL_AI=true):
 *   All calls go through Vite's dev-server proxy → Azure OpenAI.
 *   The Azure API key lives in .env and is injected by vite.config.js
 *   at the proxy layer — it is never bundled into the browser.
 *
 * PRODUCTION (VITE_LOCAL_AI unset / false):
 *   Calls go through Supabase Edge Functions which hold the server-side key.
 */

import { invokeFunction, semanticSearch } from '@/lib/supabase'

const LOCAL_AI = import.meta.env.VITE_LOCAL_AI === 'true'

// ── Public API ────────────────────────────────────────────────

/**
 * Send a chat request and return { reply, sources }.
 * Automatically routes to dev proxy or Edge Function.
 */
export async function sendChatRequest(messages, ragEnabled, sessionId) {
  return LOCAL_AI
    ? devChat(messages, ragEnabled)
    : prodChat(messages, ragEnabled, sessionId)
}

/**
 * Get an embedding vector for a text string.
 * Automatically routes to dev proxy or Edge Function.
 */
export async function getEmbeddingRouted(text) {
  return LOCAL_AI ? devEmbed(text) : prodEmbed(text)
}

// ── Dev path (Vite proxy → Azure OpenAI) ─────────────────────

async function devChat(messages, ragEnabled) {
  let context = ''
  let sources = []

  // Attempt RAG context injection if enabled and Supabase is configured
  if (ragEnabled) {
    try {
      const lastUser = [...messages].reverse().find(m => m.role === 'user')
      if (lastUser) {
        const embedding = await devEmbed(lastUser.text ?? lastUser.content ?? '')
        const { data: chunks } = await semanticSearch(embedding, 5)
        if (chunks?.length) {
          context = chunks.map(c => c.content).join('\n\n---\n\n')
          sources = chunks.map(c => ({
            name:  c.metadata?.document_name ?? 'Document',
            chunk: `chunk ${c.metadata?.chunk_index ?? '?'}`,
            score: (c.similarity ?? 0).toFixed(2),
          }))
        }
      }
    } catch {
      // Supabase not configured locally — proceed without RAG context
    }
  }

  const systemPrompt = ragEnabled && context
    ? `You are an AI assistant for ICT Cloud Solutions, a specialist Azure & AI consultancy. Answer using ONLY the provided context from the organisation's knowledge base. Cite document names when relevant.\n\nContext:\n${context}`
    : `You are an AI assistant for ICT Cloud Solutions, a specialist Azure & AI consultancy. Help clients with Azure infrastructure, cloud architecture, DevOps, and AI implementation. Be concise and technical.`

  const chatPayload = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({
      role:    m.role === 'bot' ? 'assistant' : m.role,
      content: m.text ?? m.content ?? '',
    })),
  ]

  const res = await fetch('/api/azure/chat', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ messages: chatPayload, max_tokens: 1200, temperature: 0.4 }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message ?? `Azure OpenAI error ${res.status}`)
  }

  const data = await res.json()
  const reply = data.choices?.[0]?.message?.content ?? 'No response generated.'
  return { reply, sources }
}

async function devEmbed(text) {
  const res = await fetch('/api/azure/embed', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ input: text }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message ?? `Embedding error ${res.status}`)
  }

  const data = await res.json()
  if (!data.data?.[0]?.embedding) throw new Error('No embedding returned from Azure OpenAI')
  return data.data[0].embedding
}

// ── Production path (Supabase Edge Functions) ─────────────────

async function prodChat(messages, ragEnabled, sessionId) {
  const { data, error } = await invokeFunction('chat', { messages, ragEnabled, sessionId })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data
}

async function prodEmbed(text) {
  const { data, error } = await invokeFunction('embed', { text })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data.embedding
}
