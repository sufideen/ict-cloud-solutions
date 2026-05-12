import { useState, useRef, useCallback } from 'react'
import { saveChatMessage, invokeFunction } from '@/lib/supabase'

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
  const [error, setError]         = useState(null)
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

    try {
      const { data, error: fnError } = await invokeFunction('chat', {
        messages: [...messages, userMsg].filter(m => m.id !== 'welcome'),
        ragEnabled,
        sessionId,
      })

      if (fnError) throw fnError
      if (data?.error) throw new Error(data.error)

      const botMsg = {
        id:       Date.now() + 1,
        role:     'bot',
        text:     data.reply,
        sources:  data.sources ?? [],
        time:     new Date(),
        model:    'Azure OpenAI GPT-4o',
        ragUsed:  ragEnabled,
      }
      setMessages(prev => [...prev, botMsg])
      if (sessionId) saveChatMessage(sessionId, 'assistant', data.reply).catch(() => {})
    } catch (err) {
      setError(err.message ?? 'Failed to get a response. Please try again.')
      // Remove the user message on failure so they can retry
      setMessages(prev => prev.filter(m => m.id !== userMsg.id))
    } finally {
      setIsTyping(false)
    }
  }, [isTyping, ragEnabled, sessionId, messages])

  return { messages, isTyping, error, sendMessage, messagesEndRef, scrollToBottom }
}
