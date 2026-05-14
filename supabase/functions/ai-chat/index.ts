import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const AZURE_ENDPOINT   = Deno.env.get('AZURE_OPENAI_ENDPOINT')   ?? ''
const AZURE_KEY        = Deno.env.get('AZURE_OPENAI_KEY')        ?? ''
const CHAT_DEPLOYMENT  = Deno.env.get('AZURE_OPENAI_DEPLOYMENT') ?? 'gpt-4o'
const EMBED_DEPLOYMENT = Deno.env.get('AZURE_OPENAI_EMBEDDING_DEPLOYMENT') ?? 'text-embedding-3-large'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, sessionId, useRag } = await req.json()

    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: 'message is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // ── 1. Retrieve RAG context ───────────────────────────────────────────────
    let ragContext  = ''
    let sources: { name: string; chunk: string; score: string }[] = []

    if (useRag && AZURE_ENDPOINT && AZURE_KEY) {
      const embedRes = await fetch(
        `${AZURE_ENDPOINT}/openai/deployments/${EMBED_DEPLOYMENT}/embeddings?api-version=2024-02-01`,
        {
          method:  'POST',
          headers: { 'api-key': AZURE_KEY, 'Content-Type': 'application/json' },
          body:    JSON.stringify({ input: message }),
        }
      )
      const embedJson = await embedRes.json()
      const embedding = embedJson?.data?.[0]?.embedding

      if (embedding) {
        const { data: chunks } = await supabase.rpc('match_documents', {
          query_embedding: embedding,
          match_threshold: 0.75,
          match_count:     5,
        })

        if (chunks?.length) {
          ragContext = chunks.map((c: { content: string }) => c.content).join('\n\n')
          sources = chunks.map((c: { name: string; chunk_index: number; similarity: number }) => ({
            name:  c.name,
            chunk: `chunk ${c.chunk_index}`,
            score: c.similarity.toFixed(2),
          }))
        }
      }
    }

    // ── 2. Build system prompt ────────────────────────────────────────────────
    const systemPrompt = ragContext
      ? `You are the ICT Cloud AI Assistant. Answer only using the context below.\n\nContext:\n${ragContext}`
      : `You are the ICT Cloud AI Assistant. Answer concisely from general Azure and cloud knowledge.`

    // ── 3. Call Azure OpenAI ──────────────────────────────────────────────────
    if (!AZURE_ENDPOINT || !AZURE_KEY) {
      return new Response(
        JSON.stringify({ error: 'Azure OpenAI is not configured on this server.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const chatRes = await fetch(
      `${AZURE_ENDPOINT}/openai/deployments/${CHAT_DEPLOYMENT}/chat/completions?api-version=2024-02-01`,
      {
        method:  'POST',
        headers: { 'api-key': AZURE_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user',   content: message },
          ],
          temperature: 0.3,
          max_tokens:  800,
        }),
      }
    )

    if (!chatRes.ok) {
      const err = await chatRes.text()
      console.error('Azure OpenAI error:', err)
      return new Response(
        JSON.stringify({ error: 'AI model request failed. Please try again.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const chatJson = await chatRes.json()
    const reply    = chatJson.choices?.[0]?.message?.content ?? ''

    // ── 4. Persist assistant reply ────────────────────────────────────────────
    if (sessionId) {
      await supabase
        .from('chat_messages')
        .insert([{ session_id: sessionId, role: 'assistant', content: reply }])
        .catch(() => {})
    }

    return new Response(
      JSON.stringify({ reply, sources, model: `Azure OpenAI ${CHAT_DEPLOYMENT}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('ai-chat function error:', err)
    return new Response(
      JSON.stringify({ error: 'Unexpected error. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
