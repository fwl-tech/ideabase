import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---- Auth mock ----
const mockAuth = vi.fn(() => ({
  userId: 'user_test123',
  sessionClaims: { email: 'test@fairwaterlabs.com' },
}))

vi.mock('@clerk/nextjs/server', () => ({ auth: mockAuth }))

// ---- Supabase mock helpers ----
// Each call to `from()` returns a fresh chainable mock.
// `single()` resolves to a configurable value per test.
let mockSingleResult: { data: unknown; error: unknown } = { data: null, error: null }
let mockOrderResult: { data: unknown; error: unknown } = { data: [], error: null }

function makeFromMock() {
  return {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn(() => Promise.resolve(mockOrderResult)),
    single: vi.fn(() => Promise.resolve(mockSingleResult)),
  }
}

vi.mock('@/lib/supabase', () => ({
  createSupabaseServerClient: vi.fn(() => ({ from: vi.fn(() => makeFromMock()) })),
}))

beforeEach(() => {
  vi.resetModules()
  mockSingleResult = { data: null, error: null }
  mockOrderResult = { data: [], error: null }
  mockAuth.mockReturnValue({ userId: 'user_test123', sessionClaims: { email: 'test@fairwaterlabs.com' } })
})

// ---- Tests ----

describe('GET /api/areas', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockReturnValue({ userId: null, sessionClaims: {} })
    const { GET } = await import('@/app/api/areas/route')
    const res = await GET(new Request('http://localhost/apps/ideabase/api/areas'))
    expect(res.status).toBe(401)
  })

  it('returns 401 when email is not @fairwaterlabs.com', async () => {
    mockAuth.mockReturnValue({ userId: 'user_test123', sessionClaims: { email: 'attacker@evil.com' } })
    const { GET } = await import('@/app/api/areas/route')
    const res = await GET(new Request('http://localhost/apps/ideabase/api/areas'))
    expect(res.status).toBe(401)
  })

  it('returns 401 when email claim is missing', async () => {
    mockAuth.mockReturnValue({ userId: 'user_test123', sessionClaims: {} })
    const { GET } = await import('@/app/api/areas/route')
    const res = await GET(new Request('http://localhost/apps/ideabase/api/areas'))
    expect(res.status).toBe(401)
  })

  it('returns empty array when authenticated user has no areas', async () => {
    // getOrCreateDbUser upsert returns a user
    mockSingleResult = { data: { id: 'db-user-1' }, error: null }
    mockOrderResult = { data: [], error: null }
    const { GET } = await import('@/app/api/areas/route')
    const res = await GET(new Request('http://localhost/apps/ideabase/api/areas'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body).toHaveLength(0)
  })

  it('returns 404 when getOrCreateDbUser fails', async () => {
    // upsert returns error → getOrCreateDbUser returns null
    mockSingleResult = { data: null, error: { message: 'DB error' } }
    const { GET } = await import('@/app/api/areas/route')
    const res = await GET(new Request('http://localhost/apps/ideabase/api/areas'))
    expect(res.status).toBe(404)
  })
})

describe('POST /api/areas', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockReturnValue({ userId: null, sessionClaims: {} })
    const { POST } = await import('@/app/api/areas/route')
    const req = new Request('http://localhost/apps/ideabase/api/areas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Logistics' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 when name is missing', async () => {
    mockSingleResult = { data: { id: 'db-user-1' }, error: null }
    const { POST } = await import('@/app/api/areas/route')
    const req = new Request('http://localhost/apps/ideabase/api/areas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: 'No name' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('creates area and returns 201 for authenticated user', async () => {
    const newArea = { id: 'area-1', name: 'Autonomous Logistics', user_id: 'db-user-1' }
    // First single() call → upsert user; second single() call → insert area
    let callCount = 0
    const { createSupabaseServerClient } = await import('@/lib/supabase')
    vi.mocked(createSupabaseServerClient).mockReturnValue({
      from: vi.fn(() => {
        callCount++
        const mock = makeFromMock()
        if (callCount === 1) {
          // upsert user
          mock.single.mockResolvedValue({ data: { id: 'db-user-1' }, error: null })
        } else {
          // insert area
          mock.single.mockResolvedValue({ data: newArea, error: null })
        }
        return mock
      }),
    } as never)

    const { POST } = await import('@/app/api/areas/route')
    const req = new Request('http://localhost/apps/ideabase/api/areas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Autonomous Logistics', description: 'Drone + autonomy' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.name).toBe('Autonomous Logistics')
  })
})

describe('GET /api/areas/:id', () => {
  it('returns 404 for area belonging to a different user', async () => {
    // getOrCreateDbUser returns user, but area query returns null (not found for this user)
    mockSingleResult = { data: { id: 'db-user-1' }, error: null }
    // Override: area lookup returns nothing
    const { createSupabaseServerClient } = await import('@/lib/supabase')
    let callCount = 0
    vi.mocked(createSupabaseServerClient).mockReturnValue({
      from: vi.fn(() => {
        callCount++
        const mock = makeFromMock()
        if (callCount === 1) {
          // upsert user
          mock.single.mockResolvedValue({ data: { id: 'db-user-1' }, error: null })
        } else {
          // area not found for this user
          mock.single.mockResolvedValue({ data: null, error: { message: 'Not found' } })
        }
        return mock
      }),
    } as never)

    const { GET } = await import('@/app/api/areas/[id]/route')
    const res = await GET(new Request('http://localhost/apps/ideabase/api/areas/other-users-area'), { params: { id: 'other-users-area' } })
    expect(res.status).toBe(404)
  })
})
