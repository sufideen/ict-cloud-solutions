import { useState, useRef, useCallback } from 'react'
import { supabase, saveChatMessage } from '@/lib/supabase'

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
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const historyRef = useRef([])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isTyping) return

    const userMsg = { id: Date.now(), role: 'user', text, time: new Date() }
    setMessages(prev => [...prev, userMsg])
    setIsTyping(true)

    if (sessionId) saveChatMessage(sessionId, 'user', text).catch(() => {})

    const history = historyRef.current.slice(-10).map(m => ({
      role: m.role === 'bot' ? 'assistant' : 'user',
      content: m.text,
    }))

    try {
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: { message: text, sessionId, ragEnabled, history },
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error)

      const botMsg = {
        id: Date.now() + 1,
        role: 'bot',
        text: data.reply,
        sources: data.sources ?? [],
        time: new Date(),
        model: data.model ?? 'Azure OpenAI GPT-4o',
        ragUsed: data.ragUsed,
      }
      setMessages(prev => [...prev, botMsg])
      historyRef.current = [...historyRef.current, userMsg, botMsg]

      if (sessionId) saveChatMessage(sessionId, 'assistant', data.reply).catch(() => {})
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'error',
          text: err?.message ?? 'Failed to get a response. Please try again.',
          time: new Date(),
        },
      ])
    } finally {
      setIsTyping(false)
    }
  }, [isTyping, ragEnabled, sessionId])

  return { messages, isTyping, sendMessage, messagesEndRef, scrollToBottom }
}
