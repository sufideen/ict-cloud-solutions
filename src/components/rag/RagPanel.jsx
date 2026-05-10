import { useState } from 'react'

const DOCUMENTS = [
  { name: 'AKS-runbook-v3.pdf',         updated: '3h ago',  chunks: 24,  status: 'indexed' },
  { name: 'DR-plan-2026.pdf',           updated: '1d ago',  chunks: 56,  status: 'indexed' },
  { name: 'azure-sentinel-playbook.md', updated: '2d ago',  chunks: 18,  status: 'indexed' },
  { name: 'network-architecture.docx',  updated: '5d ago',  chunks: 31,  status: 'indexed' },
  { name: 'onboarding-guide-2026.pdf',  updated: 'Now',     chunks: null, status: 'processing' },
  { name: 'cost-optimisation-report.pdf', updated: '1w ago', chunks: 42, status: 'indexed' },
  { name: 'security-baseline.pdf',      updated: '2w ago',  chunks: 67,  status: 'indexed' },
]

const DEMO_RESULTS = (q) => [
  { file: 'AKS-runbook-v3.pdf',     chunk: 'chunk 7',  score: '0.94', text: `Relevant section from your AKS runbook regarding "${q}". Contains procedural guidance and configuration details aligned with your infrastructure standards.` },
  { file: 'security-baseline.pdf',  chunk: 'chunk 14', score: '0.88', text: `Security baseline reference for "${q}" — includes compliance requirements, access control policies, and approved configuration patterns.` },
  { file: 'DR-plan-2026.pdf',       chunk: 'chunk 5',  score: '0.79', text: `DR context for "${q}". Covers failover procedures, RTO/RPO targets, and escalation contacts.` },
]

export default function RagPanel() {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState(DEMO_RESULTS('AKS node pools'))
  const [searching, setSearching] = useState(false)

  const doSearch = async () => {
    if (!query.trim()) return
    setSearching(true)
    // TODO: replace with real Supabase pgvector RPC call
    // const embedding = await getEmbedding(query)
    // const { data } = await semanticSearch(embedding)
    await new Promise(r => setTimeout(r, 900))
    setResults(DEMO_RESULTS(query))
    setSearching(false)
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
            Supabase pgvector · 48 documents · Azure OpenAI text-embedding-3-large
          </p>
        </div>
        <button className="ml-auto flex items-center gap-2 px-4 py-2 bg-az hover:bg-az-dark text-white font-mono text-[12px] rounded-lg transition-colors border-0 cursor-pointer">
          <i className="ti ti-plus" /> Upload Document
        </button>
      </div>

      {/* Body — two columns */}
      <div className="flex flex-1 overflow-hidden" style={{ background: 'var(--br)', gap: '2px' }}>

        {/* Left — Document library */}
        <div className="flex flex-col overflow-hidden" style={{ background: 'var(--s3)', flex: 1 }}>
          <div style={{ borderBottom: '1px solid var(--br)' }} className="flex items-center justify-between px-4 py-3 font-mono text-[11px] text-mu flex-shrink-0">
            <strong className="text-tx">Document Library</strong>
            <span>48 indexed</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {DOCUMENTS.map(doc => (
              <div
                key={doc.name}
                style={{ background: 'var(--s2)', border: '1px solid var(--br)' }}
                className="flex items-center gap-2.5 p-3 rounded-lg mb-2 cursor-pointer hover:border-az transition-colors"
              >
                <div style={{ background: 'rgba(0,120,212,0.1)', border: '1px solid rgba(0,120,212,0.2)' }} className="w-8 h-8 rounded-md flex items-center justify-center text-az-light flex-shrink-0">
                  <i className="ti ti-file-text text-sm" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[12px] text-tx truncate">{doc.name}</p>
                  <p className="font-mono text-[10px] text-mu mt-0.5">
                    Updated {doc.updated}{doc.chunks ? ` · ${doc.chunks} chunks` : ''}
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
            ))}
          </div>

          {/* Upload zone */}
          <div style={{ margin: '0 12px 12px', border: '1px dashed var(--br)' }} className="rounded-lg p-5 text-center cursor-pointer hover:border-az transition-colors">
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
                Searching pgvector...
              </div>
            ) : (
              <>
                {query && (
                  <p className="font-mono text-[10px] text-mu mb-2.5 px-0.5">
                    {results.length} results for: "{query}"
                  </p>
                )}
                {results.map((r, i) => (
                  <div key={i} style={{ background: 'var(--s2)', border: '1px solid var(--br)' }} className="p-3 rounded-lg mb-2">
                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-az-light mb-1.5">
                      <i className="ti ti-file-search text-[11px]" />
                      {r.file} · {r.chunk}
                      <span style={{ background: 'rgba(0,120,212,0.15)' }} className="ml-auto px-1.5 py-px rounded text-[10px]">{r.score}</span>
                    </div>
                    <p className="text-[12px] text-mu leading-relaxed">{r.text}</p>
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
              disabled={searching}
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
