import { describe, it, expect, vi } from 'vitest'

// Smoke-test the supabase helper exports
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signOut:            vi.fn().mockResolvedValue({ error: null }),
      getSession:         vi.fn().mockResolvedValue({ data: { session: null } }),
      signInWithOAuth:    vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
    from:      vi.fn(() => ({ select: vi.fn().mockReturnThis(), order: vi.fn().mockResolvedValue({ data: [], error: null }) })),
    rpc:       vi.fn().mockResolvedValue({ data: [], error: null }),
    functions: { invoke: vi.fn().mockResolvedValue({ data: { embedding: [0.1, 0.2] }, error: null }) },
  })),
}))

describe('supabase helpers', () => {
  it('exports expected functions', async () => {
    const mod = await import('@/lib/supabase')
    expect(typeof mod.signInWithEmail).toBe('function')
    expect(typeof mod.signOut).toBe('function')
    expect(typeof mod.fetchDocuments).toBe('function')
    expect(typeof mod.semanticSearch).toBe('function')
    expect(typeof mod.getEmbedding).toBe('function')
    expect(typeof mod.ingestDocument).toBe('function')
    expect(typeof mod.saveChatMessage).toBe('function')
  })
})
