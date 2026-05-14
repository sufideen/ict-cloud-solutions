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

  // Keep a rolling history of the last 10 exchanges for context
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

    try {
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: {
          message: text,
          history: historyRef.current,
          useRag: ragEnabled,
        },
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error)

      const reply = data.reply ?? ''
      const sources = data.sources ?? []

      historyRef.current = [
        ...historyRef.current,
        { role: 'user', content: text },
        { role: 'assistant', content: reply },
      ].slice(-20)

      const botMsg = {
        id: Date.now() + 1,
        role: 'bot',
        text: reply,
        sources,
        time: new Date(),
        model: 'Azure OpenAI GPT-4o',
        ragUsed: data.ragUsed,
      }
      setMessages(prev => [...prev, botMsg])
      if (sessionId) saveChatMessage(sessionId, 'assistant', reply).catch(() => {})
    } catch (err) {
      const isConfigError =
        err?.message?.includes('Failed to send') ||
        err?.message?.includes('Edge Function') ||
        err?.message?.includes('fetch') ||
        err?.message?.includes('AZURE_OPENAI')

      const errorText = isConfigError
        ? 'The AI service is not reachable. Please check that the Supabase Edge Function is deployed and Azure OpenAI environment variables are configured.'
        : `Sorry, something went wrong: ${err?.message || 'Unknown error'}. Please try again.`

      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'error',
          text: errorText,
          sources: [],
          time: new Date(),
        },
      ])
    } finally {
      setIsTyping(false)
    }
  }, [isTyping, ragEnabled, sessionId])

  return { messages, isTyping, sendMessage, messagesEndRef, scrollToBottom }
}
