import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { messages, ragEnabled, sessionId } = await req.json()

    const openaiKey   = Deno.env.get('OPENAI_API_KEY')!
    const chatModel   = Deno.env.get('OPENAI_CHAT_MODEL')   ?? 'gpt-4o'
    const embedModel  = Deno.env.get('OPENAI_EMBED_MODEL')  ?? 'text-embedding-3-large'

    let context = ''
    let sources: { name: string; chunk: string; score: string }[] = []

    if (ragEnabled && messages?.length) {
      const lastUser = [...messages].reverse().find((m: { role: string }) => m.role === 'user')
      if (lastUser) {
        // Get embedding for the user's query
        const embRes = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: embedModel,
            input: lastUser.text ?? lastUser.content,
          }),
        })
        const embData = await embRes.json()
        const embedding = embData.data?.[0]?.embedding

        if (embedding) {
          const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
          )
          const { data: chunks } = await supabase.rpc('match_documents', {
            query_embedding: embedding,
            match_threshold: 0.75,
            match_count: 5,
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
      ? `You are an AI assistant for ICT Cloud Solutions, a specialist Azure & AI consultancy. Answer questions using ONLY the provided context from the organisation's knowledge base. Be precise and cite document names when relevant.\n\nContext:\n${context}`
      : `You are an AI assistant for ICT Cloud Solutions, a specialist Azure & AI consultancy. Help clients with Azure infrastructure, cloud architecture, DevOps, and AI implementation. Be concise and technical.`

    const chatPayload = [
      { role: 'system', content: systemPrompt },
      ...(messages as { role: string; text?: string; content?: string }[]).map(m => ({
        role:    m.role === 'bot' ? 'assistant' : m.role,
        content: m.text ?? m.content ?? '',
      })),
    ]

    const chatRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model:       chatModel,
        messages:    chatPayload,
        max_tokens:  1200,
        temperature: 0.4,
      }),
    })
    const chatData = await chatRes.json()
    const reply = chatData.choices?.[0]?.message?.content ?? 'Sorry, I could not generate a response.'

    return new Response(JSON.stringify({ reply, sources }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
