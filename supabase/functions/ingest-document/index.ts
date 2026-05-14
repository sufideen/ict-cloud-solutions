import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CHUNK_SIZE    = 1800  // characters (~450 tokens)
const CHUNK_OVERLAP = 200

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })

  try {
    const { name, content, type } = await req.json()
    if (!name || !content) return json({ error: 'name and content are required' }, 400)

    const azureEndpoint = Deno.env.get('AZURE_OPENAI_ENDPOINT')
    const azureKey      = Deno.env.get('AZURE_OPENAI_KEY')
    const embedDeploy   = Deno.env.get('AZURE_OPENAI_EMBEDDING_DEPLOYMENT') ?? 'text-embedding-3-large'

    if (!azureEndpoint || !azureKey) return json({ error: 'Azure OpenAI credentials not configured' }, 500)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get the calling user from the JWT
    const authHeader = req.headers.get('Authorization') ?? ''
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))

    // ── 1. Insert document record ─────────────────────────────
    const { data: doc, error: docErr } = await supabase
      .from('documents')
      .insert({ name, content: content.slice(0, 500), status: 'processing', user_id: user?.id })
      .select()
      .single()

    if (docErr) return json({ error: docErr.message }, 500)

    // ── 2. Chunk the text ─────────────────────────────────────
    const chunks = chunkText(content, CHUNK_SIZE, CHUNK_OVERLAP)

    // ── 3. Embed each chunk and insert ────────────────────────
    let insertedCount = 0
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]

      const embedRes = await fetch(
        `${azureEndpoint}/openai/deployments/${embedDeploy}/embeddings?api-version=2024-02-01`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'api-key': azureKey },
          body: JSON.stringify({ input: chunk }),
        }
      )

      if (!embedRes.ok) {
        const err = await embedRes.text()
        // Mark document as error and return
        await supabase.from('documents').update({ status: 'error' }).eq('id', doc.id)
        return json({ error: `Embedding error on chunk ${i}: ${err}` }, 502)
      }

      const embedData = await embedRes.json()
      const embedding: number[] = embedData.data[0].embedding

      const { error: chunkErr } = await supabase.from('document_chunks').insert({
        document_id: doc.id,
        content: chunk,
        embedding,
        metadata: { source: name, chunk_index: i, type },
      })

      if (!chunkErr) insertedCount++
    }

    // ── 4. Mark document as indexed ───────────────────────────
    await supabase
      .from('documents')
      .update({ status: 'indexed', chunk_count: insertedCount })
      .eq('id', doc.id)

    return json({ success: true, document_id: doc.id, chunks: insertedCount })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return json({ error: msg }, 500)
  }
})

function chunkText(text: string, size: number, overlap: number): string[] {
  const chunks: string[] = []
  let start = 0
  const cleaned = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()

  while (start < cleaned.length) {
    let end = start + size
    // Try to break on a paragraph or sentence boundary
    if (end < cleaned.length) {
      const para = cleaned.lastIndexOf('\n\n', end)
      const sent = cleaned.lastIndexOf('. ', end)
      const boundary = Math.max(para, sent)
      if (boundary > start + size / 2) end = boundary + 1
    }
    chunks.push(cleaned.slice(start, end).trim())
    start = end - overlap
    if (start >= cleaned.length) break
  }
  return chunks.filter(c => c.length > 0)
}
