import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CHUNK_SIZE  = 1000  // characters per chunk
const CHUNK_OVERLAP = 150 // overlap between adjacent chunks

function chunkText(text: string): string[] {
  const chunks: string[] = []
  let start = 0
  while (start < text.length) {
    const end = start + CHUNK_SIZE
    chunks.push(text.slice(start, end).trim())
    start = end - CHUNK_OVERLAP
  }
  return chunks.filter(c => c.length > 50)
}

async function getEmbedding(text: string, endpoint: string, key: string, deployment: string): Promise<number[]> {
  const res = await fetch(
    `${endpoint}/openai/deployments/${deployment}/embeddings?api-version=2024-02-01`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': key },
      body: JSON.stringify({ input: text }),
    }
  )
  const data = await res.json()
  if (!data.data?.[0]?.embedding) throw new Error(data.error?.message ?? 'Embedding failed')
  return data.data[0].embedding
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) throw new Error('Missing authorization header')

    const { name, content, userId } = await req.json()
    if (!name || !content) throw new Error('name and content are required')

    const azureEndpoint = Deno.env.get('AZURE_OPENAI_ENDPOINT')!
    const azureKey      = Deno.env.get('AZURE_OPENAI_KEY')!
    const embDeployment = Deno.env.get('AZURE_OPENAI_EMBEDDING_DEPLOYMENT') ?? 'text-embedding-3-large'

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 1. Create document record
    const { data: doc, error: docErr } = await supabase
      .from('documents')
      .insert({ name, content, status: 'processing', user_id: userId })
      .select('id')
      .single()
    if (docErr) throw docErr

    // 2. Chunk the content
    const chunks = chunkText(content)

    // 3. Embed + store each chunk (sequential to avoid rate-limit)
    for (let i = 0; i < chunks.length; i++) {
      const embedding = await getEmbedding(chunks[i], azureEndpoint, azureKey, embDeployment)
      const { error: chunkErr } = await supabase.from('document_chunks').insert({
        document_id: doc.id,
        content:     chunks[i],
        embedding,
        metadata: { document_name: name, chunk_index: i, total_chunks: chunks.length },
      })
      if (chunkErr) throw chunkErr
    }

    // 4. Mark document as indexed
    await supabase
      .from('documents')
      .update({ status: 'indexed', chunk_count: chunks.length })
      .eq('id', doc.id)

    return new Response(
      JSON.stringify({ id: doc.id, chunk_count: chunks.length }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
