import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface RequestBody {
  message: string
  history?: Message[]
  useRag?: boolean
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl  = Deno.env.get('SUPABASE_URL')!
    const supabaseKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const azureEndpoint   = Deno.env.get('AZURE_OPENAI_ENDPOINT')!
    const azureKey        = Deno.env.get('AZURE_OPENAI_KEY')!
    const chatDeployment  = Deno.env.get('AZURE_OPENAI_DEPLOYMENT') || 'gpt-4o'
    const embedDeployment = Deno.env.get('AZURE_OPENAI_EMBEDDING_DEPLOYMENT') || 'text-embedding-3-large'

    const { message, history = [], useRag = true }: RequestBody = await req.json()

    if (!message?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // ── RAG: embed the query and fetch relevant chunks ──────────
    let ragContext = ''
    let sources: { name: string; chunk: string; score: string }[] = []

    if (useRag) {
      const embedRes = await fetch(
        `${azureEndpoint}/openai/deployments/${embedDeployment}/embeddings?api-version=2024-02-01`,
        {
          method: 'POST',
          headers: { 'api-key': azureKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: message }),
        }
      )

      if (embedRes.ok) {
        const embedData = await embedRes.json()
        const embedding = embedData.data[0].embedding

        const { data: chunks } = await supabase.rpc('match_documents', {
          query_embedding: embedding,
          match_threshold: 0.75,
          match_count: 5,
        })

        if (chunks?.length) {
          ragContext = chunks
            .map((c: { content: string }) => c.content)
            .join('\n\n---\n\n')

          sources = chunks.map((c: { metadata?: { source?: string }; similarity: number }, i: number) => ({
            name: c.metadata?.source || `Document ${i + 1}`,
            chunk: `chunk ${i + 1}`,
            score: c.similarity?.toFixed(2) || '0.00',
          }))
        }
      }
    }

    // ── Build the system prompt ──────────────────────────────────
    const systemPrompt = ragContext
      ? `You are an ICT Cloud Solutions AI Assistant with deep expertise in Azure infrastructure, Kubernetes (AKS), Cloudflare, Supabase, and enterprise IT operations. Answer based on the organisation's knowledge base excerpts below. Be concise and precise.\n\n## Knowledge Base Context\n\n${ragContext}`
      : `You are an ICT Cloud Solutions AI Assistant with deep expertise in Azure infrastructure, Kubernetes (AKS), Cloudflare, Supabase, and enterprise IT operations. Answer questions clearly and concisely. When organisation-specific details are needed, suggest enabling RAG to search the knowledge base.`

    // ── Call Azure OpenAI chat completion ────────────────────────
    const chatMessages: Message[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10),
      { role: 'user', content: message },
    ]

    const chatRes = await fetch(
      `${azureEndpoint}/openai/deployments/${chatDeployment}/chat/completions?api-version=2024-02-01`,
      {
        method: 'POST',
        headers: { 'api-key': azureKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatMessages,
          temperature: 0.3,
          max_tokens: 1024,
        }),
      }
    )

    if (!chatRes.ok) {
      const err = await chatRes.text()
      throw new Error(`Azure OpenAI error: ${chatRes.status} — ${err}`)
    }

    const chatData = await chatRes.json()
    const reply = chatData.choices[0].message.content

    return new Response(
      JSON.stringify({ reply, sources, ragUsed: useRag && sources.length > 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('chat-ai error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
