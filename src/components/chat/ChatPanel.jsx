import { useState, useEffect, useRef } from 'react'
import { useChat } from '@/hooks/useChat'
import { Toggle } from '@/components/ui'

const SUGGESTIONS = [
  'How do I scale my AKS cluster?',
  "What's our DR plan?",
  'Explain our Sentinel alert process',
  'Azure OpenAI quota limits',
]

export default function ChatPanel({ user }) {
  const [ragEnabled, setRagEnabled] = useState(true)
  const [input, setInput]           = useState('')
  const [showSuggestions, setShowSuggestions] = useState(true)
  const sessionId = useRef(`session-${Date.now()}`)

  const { messages, isTyping, sendMessage, messagesEndRef } = useChat({
    ragEnabled,
    sessionId: sessionId.current,
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleSend = () => {
    if (!input.trim() || isTyping) return
    setShowSuggestions(false)
    sendMessage(input)
    setInput('')
  }

  const handleSuggestion = (text) => {
    setShowSuggestions(false)
    sendMessage(text)
  }

  const formatText = (text) =>
    text.split('\n').map((line, i) => (
      <span key={i}>{line}<br /></span>
    ))

  const initials = (user || '').split('@')[0].slice(0, 2).toUpperCase() || 'CL'

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--br)' }} className="flex items-center gap-3 px-7 py-4 flex-shrink-0">
        <div className="w-9 h-9 bg-az rounded-lg flex items-center justify-center text-white text-base">
          <i className="ti ti-robot" />
        </div>
        <div>
          <h3 className="font-syne font-semibold text-white text-[14px]">ICT Cloud AI Assistant</h3>
          <p className="font-mono text-[10px] text-mu">Powered by Azure OpenAI GPT-4o · Supabase pgvector RAG</p>
        </div>
        <span
          style={{ border: '1px solid var(--br)', background: 'rgba(0,120,212,0.08)' }}
          className={`ml-auto px-3 py-1 rounded text-[10px] font-mono ${ragEnabled ? 'text-az-light' : 'text-mu'}`}
        >
          {ragEnabled ? '// RAG: ON' : '// RAG: OFF'}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-7 py-5 flex flex-col gap-3.5">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-2.5 max-w-[80%] ${msg.role === 'user' ? 'self-end flex-row-reverse' : ''}`}>
            <div
              className={`w-7 h-7 rounded-md flex items-center justify-center text-xs flex-shrink-0 font-mono font-bold
                ${msg.role === 'bot'
                  ? 'bg-az text-white'
                  : 'text-mu border border-[var(--br)]'
                }`}
              style={msg.role === 'user' ? { background: 'var(--s3)' } : {}}
            >
              {msg.role === 'bot' ? <i className="ti ti-robot text-xs" /> : initials}
            </div>
            <div>
              <div
                className={`px-3.5 py-2.5 text-[13px] leading-relaxed
                  ${msg.role === 'bot'
                    ? 'rounded-[10px_10px_10px_2px] text-tx'
                    : 'rounded-[10px_10px_2px_10px] text-white bg-az'
                  }`}
                style={msg.role === 'bot' ? { background: 'var(--s3)', border: '1px solid var(--br)' } : {}}
              >
                <div className="font-mono text-[11px]">{formatText(msg.text)}</div>

                {/* RAG sources */}
                {msg.sources?.length > 0 && (
                  <div style={{ background: 'rgba(0,120,212,0.06)', border: '1px solid rgba(0,120,212,0.15)' }} className="mt-2.5 p-2 rounded-md">
                    <p className="font-mono text-[9px] text-mu tracking-wide mb-1.5">// SOURCES FROM KNOWLEDGE BASE</p>
                    {msg.sources.map((s, i) => (
                      <div key={i} className="flex items-center gap-1.5 font-mono text-[10px] text-az-light mb-1">
                        <i className="ti ti-file-search text-[11px]" />
                        {s.name} · {s.chunk}
                        <span style={{ background: 'rgba(0,120,212,0.15)' }} className="ml-auto px-1.5 py-px rounded text-[9px]">{s.score}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="font-mono text-[9px] text-mu mt-1">
                {msg.time?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {msg.model && ` · ${msg.model}`}
                {msg.ragUsed && ' · RAG'}
              </p>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-md bg-az flex items-center justify-center"><i className="ti ti-robot text-white text-xs" /></div>
            <div style={{ background: 'var(--s3)', border: '1px solid var(--br)' }} className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-[10px_10px_10px_2px]">
              {[0,1,2].map(i => (
                <span key={i} className="typing-dot w-1.5 h-1.5 rounded-full bg-az-light" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Toolbar */}
      <div style={{ borderTop: '1px solid var(--br)', background: 'var(--s2)' }} className="px-7 py-3 flex-shrink-0">
        {showSuggestions && (
          <div className="flex gap-2 flex-wrap mb-2.5">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => handleSuggestion(s)}
                style={{ border: '1px solid var(--br)' }}
                className="px-3 py-1.5 rounded-full text-[11px] font-mono text-mu hover:border-az hover:text-az-light transition-colors bg-transparent cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2.5 mb-2.5">
          <span className="font-mono text-[11px] text-mu flex items-center gap-1.5">
            <i className="ti ti-books text-az-light text-sm" /> Use knowledge base (RAG)
          </span>
          <Toggle checked={ragEnabled} onChange={setRagEnabled} />
          <span className={`font-mono text-[10px] ${ragEnabled ? 'text-az-light' : 'text-mu'}`}>
            {ragEnabled ? '// Supabase pgvector · 48 docs' : '// General knowledge only'}
          </span>
        </div>

        <div className="flex gap-2.5">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder="Ask anything about your Azure infrastructure..."
            style={{ background: 'var(--s)', border: '1px solid var(--br)' }}
            className="flex-1 px-3.5 py-2.5 rounded-lg text-[13px] text-tx font-mono placeholder:text-mu outline-none focus:border-az transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={isTyping || !input.trim()}
            className="flex items-center gap-2 px-4 py-2.5 bg-az hover:bg-az-dark text-white font-mono text-[12px] rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
          >
            <i className="ti ti-send" /> Send
          </button>
        </div>
      </div>
    </div>
  )
}
