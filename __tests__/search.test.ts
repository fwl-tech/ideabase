import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockAuth = vi.fn(() => ({
  userId: 'user_test123',
  sessionClaims: { email: 'test@fairwaterlabs.com' },
}))

vi.mock('@clerk/nextjs/server', () => ({ auth: mockAuth }))

let mockRpcResult: { data: unknown; error: unknown } = { data: [], error: null }
let mockSingleResult: { data: unknown; error: unknown } = { data: { id: 'db-user-1' }, error: null }

vi.mock('@/lib/supabase', () => ({
  createSupabaseServerClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(() => Promise.resolve(mockSingleResult)),
    })),
    rpc: vi.fn(() => Promise.resolve(mockRpcResult)),
  })),
}))

beforeEach(() => {
  vi.resetModules()
  mockRpcResult = { data: [], error: null }
  mockSingleResult = { data: { id: 'db-user-1' }, error: null }
  mockAuth.mockReturnValue({ userId: 'user_test123', sessionClaims: { email: 'test@fairwaterlabs.com' } })
})

describe('GET /api/search', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockReturnValue({ userId: null, sessionClaims: {} })
    const { GET } = await import('@/app/api/search/route')
    const res = await GET(new Request('http://localhost/apps/ideabase/api/search?q=test'))
    expect(res.status).toBe(401)
  })

  it('returns 401 when email is not @fairwaterlabs.com', async () => {
    mockAuth.mockReturnValue({ userId: 'user_123', sessionClaims: { email: 'outsider@evil.com' } })
    const { GET } = await import('@/app/api/search/route')
    const res = await GET(new Request('http://localhost/apps/ideabase/api/search?q=test'))
    expect(res.status).toBe(401)
  })

  it('returns 400 when query param is missing', async () => {
    const { GET } = await import('@/app/api/search/route')
    const res = await GET(new Request('http://localhost/apps/ideabase/api/search'))
    expect(res.status).toBe(400)
  })

  it('returns 400 when query param is blank', async () => {
    const { GET } = await import('@/app/api/search/route')
    const res = await GET(new Request('http://localhost/apps/ideabase/api/search?q='))
    expect(res.status).toBe(400)
  })

  it('returns empty array when no results match', async () => {
    mockRpcResult = { data: [], error: null }
    const { GET } = await import('@/app/api/search/route')
    const res = await GET(new Request('http://localhost/apps/ideabase/api/search?q=zzznomatch'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body).toHaveLength(0)
  })

  it('groups matches by idea_id', async () => {
    mockRpcResult = {
      data: [
        { idea_id: 'idea-1', idea_title: 'Logistics AI', area_id: 'area-1', area_name: 'Logistics', match_type: 'idea', excerpt: 'Logistics AI platform' },
        { idea_id: 'idea-1', idea_title: 'Logistics AI', area_id: 'area-1', area_name: 'Logistics', match_type: 'note', excerpt: 'spoke to a VP' },
        { idea_id: 'idea-2', idea_title: 'Drone Nav', area_id: 'area-1', area_name: 'Logistics', match_type: 'idea', excerpt: 'drone logistics' },
      ],
      error: null,
    }
    const { GET } = await import('@/app/api/search/route')
    const res = await GET(new Request('http://localhost/apps/ideabase/api/search?q=logistics'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveLength(2)
    const idea1 = body.find((r: { idea_id: string }) => r.idea_id === 'idea-1')
    expect(idea1.matches).toHaveLength(2)
  })

  it('returns 500 on DB error without leaking internal message', async () => {
    mockRpcResult = { data: null, error: { message: 'internal pg error with schema details' } }
    const { GET } = await import('@/app/api/search/route')
    const res = await GET(new Request('http://localhost/apps/ideabase/api/search?q=test'))
    expect(res.status).toBe(500)
    const body = await res.json()
    // Should not expose raw DB error message
    expect(body.error).not.toBe('internal pg error with schema details')
  })
})
