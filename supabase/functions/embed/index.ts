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

    const azureEndpoint = Deno.env.get('AZURE_OPENAI_ENDPOINT')
    const azureKey      = Deno.env.get('AZURE_OPENAI_KEY')

    let url: string
    let headers: Record<string, string>
    let body: Record<string, unknown>

    if (azureEndpoint && azureKey) {
      const deployment = Deno.env.get('AZURE_OPENAI_EMBEDDING_DEPLOYMENT') ?? 'text-embedding-3-large'
      url     = `${azureEndpoint}/openai/deployments/${deployment}/embeddings?api-version=2024-02-01`
      headers = { 'Content-Type': 'application/json', 'api-key': azureKey }
      body    = { input: text }
    } else {
      const openaiKey = Deno.env.get('OPENAI_API_KEY')!
      const model     = Deno.env.get('OPENAI_EMBED_MODEL') ?? 'text-embedding-3-large'
      url     = `https://api.openai.com/v1/embeddings`
      headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey}` }
      body    = { model, input: text }
    }

    const res  = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
    const data = await res.json()
    const embedding = data.data?.[0]?.embedding
    if (!embedding) throw new Error(data.error?.message ?? 'No embedding returned')

    return new Response(JSON.stringify({ embedding }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
