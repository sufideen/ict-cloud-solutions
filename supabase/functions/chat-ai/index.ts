import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { message, sessionId, ragEnabled, history = [] } = await req.json()

    const azureEndpoint = Deno.env.get('AZURE_OPENAI_ENDPOINT')
    const azureKey      = Deno.env.get('AZURE_OPENAI_KEY')
    const chatDeploy    = Deno.env.get('AZURE_OPENAI_DEPLOYMENT')      ?? 'gpt-4o'
    const embedDeploy   = Deno.env.get('AZURE_OPENAI_EMBEDDING_DEPLOYMENT') ?? 'text-embedding-3-large'

    if (!azureEndpoint || !azureKey) {
      return json({ error: 'Azure OpenAI credentials not configured' }, 500)
    }

    // ── RAG: embed → pgvector search ──────────────────────────
    let ragContext = ''
    let sources: Array<{ name: string; chunk: string; score: string }> = []

    if (ragEnabled) {
      const embedRes = await fetch(
        `${azureEndpoint}/openai/deployments/${embedDeploy}/embeddings?api-version=2024-02-01`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'api-key': azureKey },
          body: JSON.stringify({ input: message }),
        }
      )

      if (embedRes.ok) {
        const embedData = await embedRes.json()
        const embedding: number[] = embedData.data[0].embedding

        const supabase = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )

        const { data: chunks } = await supabase.rpc('match_documents', {
          query_embedding:  embedding,
          match_threshold:  0.75,
          match_count:      5,
        })

        if (chunks?.length) {
          ragContext = chunks.map((c: { content: string }) => c.content).join('\n\n')
          sources = chunks.map((c: { metadata: Record<string, unknown>; similarity: number }) => ({
            name:  String(c.metadata?.source ?? 'document'),
            chunk: `chunk ${c.metadata?.chunk_index ?? '?'}`,
            score: Number(c.similarity).toFixed(2),
          }))
        }
      }
    }

    // ── Build prompt ──────────────────────────────────────────
    const systemContent = ragEnabled && ragContext
      ? `You are the ICT Cloud AI Assistant for an Azure & cloud infrastructure team. Answer questions using the knowledge base context below. Be concise and technical.\n\nKnowledge Base Context:\n${ragContext}`
      : `You are the ICT Cloud AI Assistant for an Azure & cloud infrastructure team. Provide helpful, concise technical guidance on Azure, cloud infrastructure, and DevOps topics.`

    const messages = [
      { role: 'system', content: systemContent },
      ...history.slice(-10),
      { role: 'user', content: message },
    ]

    // ── Call Azure OpenAI ─────────────────────────────────────
    const chatRes = await fetch(
      `${azureEndpoint}/openai/deployments/${chatDeploy}/chat/completions?api-version=2024-02-01`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': azureKey },
        body: JSON.stringify({ messages, max_tokens: 1000, temperature: 0.3 }),
      }
    )

    if (!chatRes.ok) {
      const err = await chatRes.text()
      return json({ error: `Azure OpenAI error: ${err}` }, 502)
    }

    const chatData = await chatRes.json()
    const reply: string = chatData.choices[0].message.content

    return json({ reply, sources, model: chatDeploy, ragUsed: ragEnabled })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return json({ error: msg }, 500)
  }
})
