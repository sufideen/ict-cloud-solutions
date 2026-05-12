import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useChat } from '@/hooks/useChat'

// Mock supabase helpers
vi.mock('@/lib/supabase', () => ({
  saveChatMessage: vi.fn().mockResolvedValue({}),
  invokeFunction:  vi.fn().mockResolvedValue({
    data:  { reply: 'Hello from GPT-4o', sources: [] },
    error: null,
  }),
}))

describe('useChat', () => {
  beforeEach(() => vi.clearAllMocks())

  it('starts with a welcome message', () => {
    const { result } = renderHook(() => useChat({ ragEnabled: false, sessionId: 'test-1' }))
    expect(result.current.messages).toHaveLength(1)
    expect(result.current.messages[0].role).toBe('bot')
  })

  it('adds user message then bot reply after send', async () => {
    const { result } = renderHook(() => useChat({ ragEnabled: false, sessionId: 'test-2' }))

    await act(async () => {
      await result.current.sendMessage('What is our DR plan?')
    })

    const msgs = result.current.messages
    expect(msgs.find(m => m.role === 'user')?.text).toBe('What is our DR plan?')
    expect(msgs.find(m => m.text === 'Hello from GPT-4o')).toBeTruthy()
  })

  it('does not send empty messages', async () => {
    const { result } = renderHook(() => useChat({ ragEnabled: false, sessionId: 'test-3' }))
    const before = result.current.messages.length

    await act(async () => { await result.current.sendMessage('   ') })

    expect(result.current.messages).toHaveLength(before)
  })

  it('sets error and removes user message on API failure', async () => {
    const { invokeFunction } = await import('@/lib/supabase')
    vi.mocked(invokeFunction).mockResolvedValueOnce({ data: null, error: new Error('Network error') })

    const { result } = renderHook(() => useChat({ ragEnabled: false, sessionId: 'test-4' }))
    const before = result.current.messages.length

    await act(async () => { await result.current.sendMessage('test') })

    expect(result.current.error).toBeTruthy()
    expect(result.current.messages).toHaveLength(before)
  })
})
