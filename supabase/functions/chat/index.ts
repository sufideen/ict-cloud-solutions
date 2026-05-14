import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Supports both Azure OpenAI and standard OpenAI.
// Set either AZURE_OPENAI_* or OPENAI_API_KEY in Supabase secrets.
function buildChatURL(): { url: string; headers: Record<string, string> } {
  const azureEndpoint = Deno.env.get('AZURE_OPENAI_ENDPOINT')
  const azureKey      = Deno.env.get('AZURE_OPENAI_KEY')

  if (azureEndpoint && azureKey) {
    const deployment = Deno.env.get('AZURE_OPENAI_DEPLOYMENT') ?? 'gpt-4o'
    return {
      url:     `${azureEndpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-02-01`,
      headers: { 'Content-Type': 'application/json', 'api-key': azureKey },
    }
  }

  const openaiKey   = Deno.env.get('OPENAI_API_KEY')!
  const openaiModel = Deno.env.get('OPENAI_CHAT_MODEL') ?? 'gpt-4o'
  return {
    url:     `https://api.openai.com/v1/chat/completions`,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey}` },
    // model is added in the request body for OpenAI
  }
}

function buildEmbedURL(): { url: string; headers: Record<string, string>; model?: string } {
  const azureEndpoint = Deno.env.get('AZURE_OPENAI_ENDPOINT')
  const azureKey      = Deno.env.get('AZURE_OPENAI_KEY')

  if (azureEndpoint && azureKey) {
    const deployment = Deno.env.get('AZURE_OPENAI_EMBEDDING_DEPLOYMENT') ?? 'text-embedding-3-large'
    return {
      url:     `${azureEndpoint}/openai/deployments/${deployment}/embeddings?api-version=2024-02-01`,
      headers: { 'Content-Type': 'application/json', 'api-key': azureKey },
    }
  }

  const openaiKey   = Deno.env.get('OPENAI_API_KEY')!
  const openaiModel = Deno.env.get('OPENAI_EMBED_MODEL') ?? 'text-embedding-3-large'
  return {
    url:     `https://api.openai.com/v1/embeddings`,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey}` },
    model:   openaiModel,
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  if (!req.headers.get('authorization')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  try {
    const { messages, ragEnabled, sessionId } = await req.json()

    let context = ''
    let sources: { name: string; chunk: string; score: string }[] = []

    if (ragEnabled && messages?.length) {
      const lastUser = [...messages].reverse().find((m: { role: string }) => m.role === 'user')
      if (lastUser) {
        const embedConfig = buildEmbedURL()
        const embBody: Record<string, unknown> = { input: lastUser.text ?? lastUser.content }
        if (embedConfig.model) embBody.model = embedConfig.model

        const embRes  = await fetch(embedConfig.url, { method: 'POST', headers: embedConfig.headers, body: JSON.stringify(embBody) })
        const embData = await embRes.json()
        const embedding = embData.data?.[0]?.embedding

        if (embedding) {
          const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
          const { data: chunks } = await supabase.rpc('match_documents', {
            query_embedding: embedding,
            match_threshold:  0.75,
            match_count:      5,
          })
          if (chunks?.length) {
            context = (chunks as { content: string }[]).map(c => c.content).join('\n\n---\n\n')
            sources = (chunks as { content: string; similarity: number; metadata: Record<string, string> }[]).map(c => ({
              name:  c.metadata?.document_name ?? 'Document',
              chunk: `chunk ${c.metadata?.chunk_index ?? '?'}`,
              score: (c.similarity ?? 0).toFixed(2),
            }))
          }
        }
      }
    }

    const systemPrompt = ragEnabled && context
      ? `You are an AI assistant for ICT Cloud Solutions, a specialist Azure & AI consultancy. Answer using ONLY the provided context.\n\nContext:\n${context}`
      : `You are an AI assistant for ICT Cloud Solutions, a specialist Azure & AI consultancy. Be concise and technical.`

    const chatPayload = [
      { role: 'system', content: systemPrompt },
      ...(messages as { role: string; text?: string; content?: string }[]).map(m => ({
        role:    m.role === 'bot' ? 'assistant' : m.role,
        content: m.text ?? m.content ?? '',
      })),
    ]

    const chatConfig  = buildChatURL()
    const chatBody: Record<string, unknown> = { messages: chatPayload, max_tokens: 1200, temperature: 0.4 }
    // Standard OpenAI requires model in body; Azure uses the deployment URL
    if (!Deno.env.get('AZURE_OPENAI_KEY')) chatBody.model = Deno.env.get('OPENAI_CHAT_MODEL') ?? 'gpt-4o'

    const chatRes  = await fetch(chatConfig.url, { method: 'POST', headers: chatConfig.headers, body: JSON.stringify(chatBody) })
    const chatData = await chatRes.json()
    const reply    = chatData.choices?.[0]?.message?.content ?? 'Sorry, I could not generate a response.'

    return new Response(JSON.stringify({ reply, sources }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('chat function error:', err)
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
