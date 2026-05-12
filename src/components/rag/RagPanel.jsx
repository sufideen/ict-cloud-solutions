import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { fetchDocuments, getEmbedding, semanticSearch, ingestDocument } from '@/lib/supabase'

const ACCEPTED_TYPES = ['.pdf', '.md', '.txt', '.docx']
const MAX_BYTES      = 50 * 1024 * 1024 // 50 MB

export default function RagPanel() {
  const { user }    = useAuth()
  const fileInputRef = useRef(null)

  const [documents,  setDocuments]  = useState([])
  const [docsLoading, setDocsLoading] = useState(true)
  const [docsError,  setDocsError]  = useState(null)

  const [query,      setQuery]      = useState('')
  const [results,    setResults]    = useState([])
  const [searching,  setSearching]  = useState(false)
  const [searchErr,  setSearchErr]  = useState(null)

  const [uploading,  setUploading]  = useState(false)
  const [uploadErr,  setUploadErr]  = useState(null)
  const [dragOver,   setDragOver]   = useState(false)

  // Load documents on mount
  useEffect(() => {
    loadDocuments()
  }, [])

  async function loadDocuments() {
    setDocsLoading(true)
    setDocsError(null)
    const { data, error } = await fetchDocuments()
    if (error) setDocsError(error.message)
    else setDocuments(data ?? [])
    setDocsLoading(false)
  }

  async function doSearch() {
    if (!query.trim()) return
    setSearching(true)
    setSearchErr(null)
    try {
      const embedding = await getEmbedding(query)
      const { data, error } = await semanticSearch(embedding, 5)
      if (error) throw error
      setResults(data ?? [])
    } catch (err) {
      setSearchErr(err.message ?? 'Search failed')
      setResults([])
    } finally {
      setSearching(false)
    }
  }

  async function handleFile(file) {
    if (!file) return
    const ext = '.' + file.name.split('.').pop().toLowerCase()
    if (!ACCEPTED_TYPES.includes(ext)) {
      setUploadErr(`Unsupported file type: ${ext}. Accepted: ${ACCEPTED_TYPES.join(', ')}`)
      return
    }
    if (file.size > MAX_BYTES) {
      setUploadErr('File exceeds 50 MB limit')
      return
    }
    setUploading(true)
    setUploadErr(null)
    try {
      const content = await file.text()
      await ingestDocument(file.name, content, user?.id)
      await loadDocuments()
    } catch (err) {
      setUploadErr(err.message ?? 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  function onDropZoneClick() { fileInputRef.current?.click() }
  function onFileInput(e)    { handleFile(e.target.files?.[0]) }
  function onDrop(e)         { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]) }
  function onDragOver(e)     { e.preventDefault(); setDragOver(true) }
  function onDragLeave()     { setDragOver(false) }

  const fmtDate = (iso) => {
    const d = new Date(iso)
    const diff = Date.now() - d.getTime()
    if (diff < 60_000) return 'just now'
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
    return `${Math.floor(diff / 86_400_000)}d ago`
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--br)' }} className="flex items-center gap-3 px-7 py-4 flex-shrink-0">
        <div>
          <h3 className="font-syne font-bold text-white text-[15px] flex items-center gap-2">
            <i className="ti ti-books text-az-light" /> Knowledge Base — RAG Pipeline
          </h3>
          <p className="font-mono text-[11px] text-mu mt-0.5">
            Supabase pgvector · {documents.length} documents · Azure OpenAI text-embedding-3-large
          </p>
        </div>
        <button
          onClick={onDropZoneClick}
          disabled={uploading}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-az hover:bg-az-dark text-white font-mono text-[12px] rounded-lg transition-colors border-0 cursor-pointer disabled:opacity-50"
        >
          {uploading
            ? <><i className="ti ti-loader-2 animate-spin" /> Ingesting...</>
            : <><i className="ti ti-plus" /> Upload Document</>}
        </button>
        <input ref={fileInputRef} type="file" accept={ACCEPTED_TYPES.join(',')} className="hidden" onChange={onFileInput} />
      </div>

      {/* Body — two columns */}
      <div className="flex flex-1 overflow-hidden" style={{ background: 'var(--br)', gap: '2px' }}>

        {/* Left — Document library */}
        <div className="flex flex-col overflow-hidden" style={{ background: 'var(--s3)', flex: 1 }}>
          <div style={{ borderBottom: '1px solid var(--br)' }} className="flex items-center justify-between px-4 py-3 font-mono text-[11px] text-mu flex-shrink-0">
            <strong className="text-tx">Document Library</strong>
            <span>{documents.filter(d => d.status === 'indexed').length} indexed</span>
          </div>

          {/* Upload error */}
          {uploadErr && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}
              className="mx-3 mt-2 px-3 py-2 rounded-lg font-mono text-[10px] text-red-400 flex items-center gap-2">
              <i className="ti ti-alert-circle" /> {uploadErr}
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-3">
            {docsLoading ? (
              <div className="flex items-center justify-center h-24 font-mono text-[11px] text-mu">
                <i className="ti ti-loader-2 animate-spin mr-2" /> Loading documents...
              </div>
            ) : docsError ? (
              <div className="font-mono text-[11px] text-red-400 p-2">{docsError}</div>
            ) : documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-24 font-mono text-[11px] text-mu">
                <i className="ti ti-file-off text-2xl mb-1.5" />
                No documents yet — upload one below
              </div>
            ) : (
              documents.map(doc => (
                <div
                  key={doc.id}
                  style={{ background: 'var(--s2)', border: '1px solid var(--br)' }}
                  className="flex items-center gap-2.5 p-3 rounded-lg mb-2 cursor-pointer hover:border-az transition-colors"
                >
                  <div style={{ background: 'rgba(0,120,212,0.1)', border: '1px solid rgba(0,120,212,0.2)' }}
                    className="w-8 h-8 rounded-md flex items-center justify-center text-az-light flex-shrink-0">
                    <i className="ti ti-file-text text-sm" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[12px] text-tx truncate">{doc.name}</p>
                    <p className="font-mono text-[10px] text-mu mt-0.5">
                      Updated {fmtDate(doc.created_at)}{doc.chunk_count ? ` · ${doc.chunk_count} chunks` : ''}
                    </p>
                  </div>
                  <span
                    className="font-mono text-[10px] px-2 py-0.5 rounded ml-auto flex-shrink-0"
                    style={
                      doc.status === 'indexed'
                        ? { background: 'rgba(22,163,74,0.15)', color: '#4ADE80' }
                        : { background: 'rgba(234,179,8,0.15)', color: '#EAB308' }
                    }
                  >
                    {doc.status === 'indexed' ? 'Indexed' : 'Processing'}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Upload zone */}
          <div
            onClick={onDropZoneClick}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            style={{
              margin: '0 12px 12px',
              border: `1px dashed ${dragOver ? 'var(--az)' : 'var(--br)'}`,
              background: dragOver ? 'rgba(0,120,212,0.05)' : 'transparent',
            }}
            className="rounded-lg p-5 text-center cursor-pointer transition-colors"
          >
            <i className={`ti ${uploading ? 'ti-loader-2 animate-spin' : 'ti-cloud-upload'} text-2xl text-mu mb-1.5 block`} />
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
                Embedding query and searching pgvector...
              </div>
            ) : searchErr ? (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}
                className="m-2 px-3 py-2 rounded-lg font-mono text-[10px] text-red-400 flex items-center gap-2">
                <i className="ti ti-alert-circle" /> {searchErr}
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-mu font-mono text-[11px]">
                <i className="ti ti-search text-2xl mb-2 block" />
                {query ? 'No results above similarity threshold' : 'Enter a query to search semantically'}
              </div>
            ) : (
              <>
                <p className="font-mono text-[10px] text-mu mb-2.5 px-0.5">
                  {results.length} result{results.length !== 1 ? 's' : ''} for: &quot;{query}&quot;
                </p>
                {results.map((r, i) => (
                  <div key={i} style={{ background: 'var(--s2)', border: '1px solid var(--br)' }} className="p-3 rounded-lg mb-2">
                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-az-light mb-1.5">
                      <i className="ti ti-file-search text-[11px]" />
                      {r.metadata?.document_name ?? 'Document'} · chunk {r.metadata?.chunk_index ?? '?'}
                      <span style={{ background: 'rgba(0,120,212,0.15)' }} className="ml-auto px-1.5 py-px rounded text-[10px]">
                        {(r.similarity ?? 0).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-[12px] text-mu leading-relaxed line-clamp-4">{r.content}</p>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Search bar */}
          <div style={{ borderTop: '1px solid var(--br)' }} className="flex gap-2 p-3 flex-shrink-0">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch()}
              placeholder="Search knowledge base semantically..."
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
