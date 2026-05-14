import { useState, useEffect, useRef } from 'react'
import { supabase, fetchDocuments } from '@/lib/supabase'

const STATUS_STYLE = {
  indexed:    { background: 'rgba(22,163,74,0.15)',  color: '#4ADE80' },
  processing: { background: 'rgba(234,179,8,0.15)',  color: '#EAB308' },
  error:      { background: 'rgba(220,38,38,0.15)',  color: '#F87171' },
}

const ACCEPTED = '.pdf,.docx,.md,.txt'

export default function RagPanel() {
  const [documents, setDocuments]   = useState([])
  const [docsError, setDocsError]   = useState(null)
  const [docsLoading, setDocsLoading] = useState(true)

  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState(null)

  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const fileInputRef = useRef(null)

  const loadDocuments = async () => {
    setDocsLoading(true)
    setDocsError(null)
    const { data, error } = await fetchDocuments()
    if (error) setDocsError(error.message)
    else setDocuments(data ?? [])
    setDocsLoading(false)
  }

  useEffect(() => { loadDocuments() }, [])

  const handleUpload = async (files) => {
    if (!files?.length) return
    setUploading(true)
    setUploadError(null)

    for (const file of Array.from(files)) {
      try {
        const text = await readFileAsText(file)
        const { error } = await supabase.functions.invoke('ingest-document', {
          body: { name: file.name, content: text, type: file.type },
        })
        if (error) throw error
      } catch (err) {
        setUploadError(`${file.name}: ${err?.message ?? 'Upload failed'}`)
      }
    }

    setUploading(false)
    loadDocuments()
  }

  const doSearch = async () => {
    if (!query.trim()) return
    setSearching(true)
    setSearchError(null)

    try {
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: { message: query, ragEnabled: true, searchOnly: true },
      })
      if (error) throw error
      setResults(data.sources ?? [])
    } catch (err) {
      setSearchError(err?.message ?? 'Search failed')
      setResults([])
    } finally {
      setSearching(false)
    }
  }

  const indexedCount = documents.filter(d => d.status === 'indexed').length

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--br)' }} className="flex items-center gap-3 px-7 py-4 flex-shrink-0">
        <div>
          <h3 className="font-syne font-bold text-white text-[15px] flex items-center gap-2">
            <i className="ti ti-books text-az-light" /> Knowledge Base — RAG Pipeline
          </h3>
          <p className="font-mono text-[11px] text-mu mt-0.5">
            Supabase pgvector · {docsLoading ? '…' : documents.length} documents · Azure OpenAI text-embedding-3-large
          </p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-az hover:bg-az-dark text-white font-mono text-[12px] rounded-lg transition-colors border-0 cursor-pointer disabled:opacity-50"
        >
          <i className={`ti ${uploading ? 'ti-loader-2 animate-spin' : 'ti-plus'}`} />
          {uploading ? 'Processing…' : 'Upload Document'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED}
          multiple
          className="hidden"
          onChange={e => handleUpload(e.target.files)}
        />
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden" style={{ background: 'var(--br)', gap: '2px' }}>

        {/* Left — Document library */}
        <div className="flex flex-col overflow-hidden" style={{ background: 'var(--s3)', flex: 1 }}>
          <div style={{ borderBottom: '1px solid var(--br)' }} className="flex items-center justify-between px-4 py-3 font-mono text-[11px] text-mu flex-shrink-0">
            <strong className="text-tx">Document Library</strong>
            <span>{docsLoading ? '…' : `${indexedCount} indexed`}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {uploadError && (
              <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)' }} className="flex items-center gap-2 px-3 py-2 rounded-lg font-mono text-[11px] text-red-400 mb-2">
                <i className="ti ti-alert-circle flex-shrink-0" /> {uploadError}
              </div>
            )}

            {docsError && (
              <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)' }} className="flex items-center gap-2 px-3 py-2 rounded-lg font-mono text-[11px] text-red-400 mb-2">
                <i className="ti ti-alert-circle flex-shrink-0" /> {docsError}
              </div>
            )}

            {docsLoading ? (
              <div className="flex flex-col items-center justify-center h-32 text-mu font-mono text-[11px]">
                <i className="ti ti-loader-2 text-2xl mb-2 block animate-spin" />
                Loading documents…
              </div>
            ) : documents.length === 0 && !docsError ? (
              <div className="flex flex-col items-center justify-center h-32 text-mu">
                <i className="ti ti-file-off text-2xl mb-2 block" />
                <p className="font-mono text-[11px]">No documents yet — upload one below</p>
              </div>
            ) : (
              documents.map(doc => (
                <div
                  key={doc.id}
                  style={{ background: 'var(--s2)', border: '1px solid var(--br)' }}
                  className="flex items-center gap-2.5 p-3 rounded-lg mb-2"
                >
                  <div style={{ background: 'rgba(0,120,212,0.1)', border: '1px solid rgba(0,120,212,0.2)' }} className="w-8 h-8 rounded-md flex items-center justify-center text-az-light flex-shrink-0">
                    <i className="ti ti-file-text text-sm" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[12px] text-tx truncate">{doc.name}</p>
                    <p className="font-mono text-[10px] text-mu mt-0.5">
                      {new Date(doc.created_at).toLocaleDateString()}
                      {doc.chunk_count ? ` · ${doc.chunk_count} chunks` : ''}
                    </p>
                  </div>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded ml-auto flex-shrink-0" style={STATUS_STYLE[doc.status] ?? STATUS_STYLE.processing}>
                    {doc.status === 'indexed' ? 'Indexed' : doc.status === 'error' ? 'Error' : 'Processing'}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Drop zone */}
          <div
            style={{ margin: '0 12px 12px', border: '1px dashed var(--br)' }}
            className="rounded-lg p-5 text-center cursor-pointer hover:border-az transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleUpload(e.dataTransfer.files) }}
          >
            <i className="ti ti-cloud-upload text-2xl text-mu mb-1.5 block" />
            <p className="font-mono text-[11px] text-mu">
              Drop files here or <span className="text-az-light">browse</span>
            </p>
            <p className="font-mono text-[10px] text-mu mt-1">PDF, DOCX, MD, TXT · Max 50MB</p>
          </div>
        </div>

        {/* Right — Semantic search */}
        <div className="flex flex-col overflow-hidden" style={{ background: 'var(--s3)', flex: 1 }}>
          <div style={{ borderBottom: '1px solid var(--br)' }} className="flex items-center justify-between px-4 py-3 font-mono text-[11px] text-mu flex-shrink-0">
            <strong className="text-tx">Semantic Search</strong>
            <span>pgvector cosine similarity</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {searching ? (
              <div className="flex flex-col items-center justify-center h-32 text-mu font-mono text-[11px]">
                <i className="ti ti-search text-2xl mb-2 block animate-pulse" />
                Searching pgvector…
              </div>
            ) : searchError ? (
              <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)' }} className="flex items-center gap-2 px-3 py-2 rounded-lg font-mono text-[11px] text-red-400">
                <i className="ti ti-alert-circle flex-shrink-0" /> {searchError}
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-mu">
                <i className="ti ti-search text-2xl mb-2 block" />
                <p className="font-mono text-[11px]">Enter a query to search semantically</p>
              </div>
            ) : (
              <>
                <p className="font-mono text-[10px] text-mu mb-2.5 px-0.5">{results.length} results for: "{query}"</p>
                {results.map((r, i) => (
                  <div key={i} style={{ background: 'var(--s2)', border: '1px solid var(--br)' }} className="p-3 rounded-lg mb-2">
                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-az-light mb-1.5">
                      <i className="ti ti-file-search text-[11px]" />
                      {r.name} · {r.chunk}
                      <span style={{ background: 'rgba(0,120,212,0.15)' }} className="ml-auto px-1.5 py-px rounded text-[10px]">{r.score}</span>
                    </div>
                    <p className="text-[12px] text-mu leading-relaxed">{r.text ?? r.content}</p>
                  </div>
                ))}
              </>
            )}
          </div>

          <div style={{ borderTop: '1px solid var(--br)' }} className="flex gap-2 p-3 flex-shrink-0">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch()}
              placeholder="Search knowledge base semantically…"
              style={{ background: 'var(--s)', border: '1px solid var(--br)' }}
              className="flex-1 px-3 py-2 rounded-lg text-[12px] font-mono text-tx placeholder:text-mu outline-none focus:border-az transition-colors"
            />
            <button
              onClick={doSearch}
              disabled={searching || !query.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-az hover:bg-az-dark text-white font-mono text-[12px] rounded-lg transition-colors border-0 cursor-pointer disabled:opacity-50"
            >
              <i className="ti ti-search" /> Search
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsText(file)
  })
}
