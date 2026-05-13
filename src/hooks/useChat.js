import { useState, useRef, useCallback } from 'react'
import { saveChatMessage } from '@/lib/supabase'
import { sendChatRequest } from '@/lib/chatAPI'

export function useChat({ ragEnabled, sessionId }) {
  const [messages, setMessages] = useState([
    {
      id:      'welcome',
      role:    'bot',
      text:    "Hello! I'm your ICT Cloud AI Assistant, connected to your organisation's knowledge base via RAG. I can answer questions about your Azure infrastructure, support runbooks, architecture decisions, and more.\n\nWhat can I help you with today?",
      sources: [],
      time:    new Date(),
    }
  ])
  const [isTyping, setIsTyping] = useState(false)
  const [error,    setError]    = useState(null)
  const messagesEndRef          = useRef(null)

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
      const history = [...messages, userMsg].filter(m => m.id !== 'welcome')
      const result  = await sendChatRequest(history, ragEnabled, sessionId)

      const botMsg = {
        id:      Date.now() + 1,
        role:    'bot',
        text:    result.reply,
        sources: result.sources ?? [],
        time:    new Date(),
        model:   import.meta.env.VITE_LOCAL_AI === 'true' ? 'Azure OpenAI GPT-4o' : 'OpenAI GPT-4o',
        ragUsed: ragEnabled,
      }
      setMessages(prev => [...prev, botMsg])
      if (sessionId) saveChatMessage(sessionId, 'assistant', result.reply).catch(() => {})
    } catch (err) {
      setError(err.message ?? 'Failed to get a response. Please try again.')
      setMessages(prev => prev.filter(m => m.id !== userMsg.id))
    } finally {
      setIsTyping(false)
    }
  }, [isTyping, ragEnabled, sessionId, messages])

  return { messages, isTyping, error, sendMessage, messagesEndRef, scrollToBottom }
}
