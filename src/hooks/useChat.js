import { useState, useRef, useCallback } from 'react'
import { supabase, saveChatMessage } from '@/lib/supabase'

const DEMO_RAG_RESPONSES = [
  {
    text: `Based on your organisation's runbooks:\n\nFor AKS scaling, your standard procedure:\n\n  az aks nodepool scale \\\n    --resource-group myRG \\\n    --cluster-name myAKS \\\n    --name nodepool1 \\\n    --node-count 5\n\nYour cluster autoscales between 2–10 nodes per pool.`,
    sources: [
      { name: 'AKS-runbook-v3.pdf',        chunk: 'chunk 7',  score: '0.94' },
      { name: 'network-architecture.docx', chunk: 'chunk 2',  score: '0.87' },
    ]
  },
  {
    text: `From your DR plan (DR-plan-2026.pdf):\n\n• RTO: 4 hours\n• RPO: 1 hour\n• Primary: UK South  →  DR: West Europe\n• Failover via Azure Traffic Manager (3 failed health probes)\n• Supabase backups: hourly PITR enabled`,
    sources: [
      { name: 'DR-plan-2026.pdf',      chunk: 'chunk 12', score: '0.92' },
      { name: 'security-baseline.pdf', chunk: 'chunk 4',  score: '0.78' },
    ]
  },
  {
    text: `From your Azure Sentinel playbook:\n\n1. Triage in Sentinel Incidents → assign to on-call engineer\n2. Check MITRE ATT&CK mapping in the alert\n3. Run the linked Logic App playbook for automated containment\n4. Log response in the incident timeline\n5. Escalate to ICT Cloud support if unresolved in 30 min`,
    sources: [
      { name: 'azure-sentinel-playbook.md', chunk: 'chunk 3', score: '0.96' },
    ]
  },
]

const DEMO_GENERAL_RESPONSES = [
  { text: `I'm working from general knowledge (RAG is off). Toggle the RAG switch to include your knowledge base for org-specific answers. What would you like to know?`, sources: [] },
  { text: `Happy to help with your Azure or AI question. Enable RAG for organisation-specific responses from your Supabase knowledge base.`, sources: [] },
]

// Check whether a real Supabase project is wired up
const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL || ''
  return url.length > 0 && !url.includes('YOUR_PROJECT')
}

let _msgCount = 0

export function useChat({ ragEnabled, sessionId }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'bot',
      text: "Hello! I'm your ICT Cloud AI Assistant, connected to your organisation's knowledge base via RAG. I can answer questions about your Azure infrastructure, support runbooks, architecture decisions, and more.\n\nWhat can I help you with today?",
      sources: [],
      time: new Date(),
    }
  ])
  const [isTyping, setIsTyping]   = useState(false)
  const [error,    setError]      = useState(null)
  const messagesEndRef            = useRef(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isTyping) return

    setError(null)
    const userMsg = { id: Date.now(), role: 'user', text, time: new Date() }
    setMessages(prev => [...prev, userMsg])
    setIsTyping(true)

    if (sessionId) saveChatMessage(sessionId, 'user', text).catch(() => {})

    let botMsg

    if (isSupabaseConfigured()) {
      // ── Real path: call the Supabase Edge Function ────────────────────────
      try {
        const { data, error: fnError } = await supabase.functions.invoke('ai-chat', {
          body: {
            message:   text,
            sessionId,
            useRag:    ragEnabled,
          },
        })

        if (fnError) throw fnError

        botMsg = {
          id:      Date.now() + 1,
          role:    'bot',
          text:    data.reply,
          sources: data.sources ?? [],
          time:    new Date(),
          model:   data.model ?? 'Azure OpenAI GPT-4o',
          ragUsed: ragEnabled,
        }
      } catch (err) {
        console.error('[AI Assistant] Edge Function error:', err)
        setError('AI service is temporarily unavailable. Please try again in a moment.')
        setIsTyping(false)
        return
      }
    } else {
      // ── Demo / local-dev path ─────────────────────────────────────────────
      await new Promise(r => setTimeout(r, 1200 + Math.random() * 800))
      const pool = ragEnabled ? DEMO_RAG_RESPONSES : DEMO_GENERAL_RESPONSES
      const resp = pool[_msgCount % pool.length]
      _msgCount++

      botMsg = {
        id:      Date.now() + 1,
        role:    'bot',
        text:    resp.text,
        sources: resp.sources,
        time:    new Date(),
        model:   'Demo mode',
        ragUsed: ragEnabled,
      }
    }

    setMessages(prev => [...prev, botMsg])
    setIsTyping(false)

    if (sessionId) saveChatMessage(sessionId, 'assistant', botMsg.text).catch(() => {})
  }, [isTyping, ragEnabled, sessionId])

  const clearError = useCallback(() => setError(null), [])

  return { messages, isTyping, error, clearError, sendMessage, messagesEndRef, scrollToBottom }
}
