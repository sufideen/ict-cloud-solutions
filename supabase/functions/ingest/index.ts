import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CHUNK_SIZE    = 1000
const CHUNK_OVERLAP = 150

function chunkText(text: string): string[] {
  const chunks: string[] = []
  let start = 0
  while (start < text.length) {
    chunks.push(text.slice(start, start + CHUNK_SIZE).trim())
    start += CHUNK_SIZE - CHUNK_OVERLAP
  }
  return chunks.filter(c => c.length > 50)
}

async function getEmbedding(text: string, key: string, model: string): Promise<number[]> {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({ model, input: text }),
  })
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

    const openaiKey  = Deno.env.get('OPENAI_API_KEY')!
    const embedModel = Deno.env.get('OPENAI_EMBED_MODEL') ?? 'text-embedding-3-large'

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

    // 2. Chunk and embed
    const chunks = chunkText(content)
    for (let i = 0; i < chunks.length; i++) {
      const embedding = await getEmbedding(chunks[i], openaiKey, embedModel)
      const { error: chunkErr } = await supabase.from('document_chunks').insert({
        document_id: doc.id,
        content:     chunks[i],
        embedding,
        metadata: { document_name: name, chunk_index: i, total_chunks: chunks.length },
      })
      if (chunkErr) throw chunkErr
    }

    // 3. Mark as indexed
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
