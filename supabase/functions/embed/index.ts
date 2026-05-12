import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { text } = await req.json()
    if (!text?.trim()) throw new Error('text is required')

    const openaiKey  = Deno.env.get('OPENAI_API_KEY')!
    const embedModel = Deno.env.get('OPENAI_EMBED_MODEL') ?? 'text-embedding-3-large'

    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({ model: embedModel, input: text }),
    })
    const data = await res.json()
    const embedding = data.data?.[0]?.embedding
    if (!embedding) throw new Error(data.error?.message ?? 'No embedding returned')

    return new Response(JSON.stringify({ embedding }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
