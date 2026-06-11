import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockAuth = vi.fn(() => ({
  userId: 'user_test123',
  sessionClaims: { email: 'test@fairwaterlabs.com' },
}))

vi.mock('@clerk/nextjs/server', () => ({ auth: mockAuth }))

function makeFromMock() {
  return {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(() => Promise.resolve({ data: { id: 'new-item-id' }, error: null })),
  }
}

vi.mock('@/lib/supabase', () => ({
  createSupabaseServerClient: vi.fn(() => ({ from: vi.fn(() => makeFromMock()) })),
}))

beforeEach(() => {
  vi.resetModules()
  mockAuth.mockReturnValue({ userId: 'user_test123', sessionClaims: { email: 'test@fairwaterlabs.com' } })
})

// Helper: sequence of single() results across consecutive from() calls.
// Must be called AFTER vi.resetModules() so the re-imported mock is fresh.
async function mockSequence(results: Array<{ data: unknown; error: unknown }>) {
  let callCount = 0
  const { createSupabaseServerClient } = await import('@/lib/supabase')
  vi.mocked(createSupabaseServerClient).mockReturnValue({
    from: vi.fn(() => {
      const mock = makeFromMock()
      const result = results[callCount] ?? { data: null, error: null }
      callCount++
      mock.single.mockResolvedValue(result)
      return mock
    }),
  } as never)
}

// ---- Links ----

describe('POST /api/links', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockReturnValue({ userId: null, sessionClaims: {} })
    const { POST } = await import('@/app/api/links/route')
    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea_id: 'idea-1', url: 'https://example.com' }),
    }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when url or idea_id is missing', async () => {
    const { POST } = await import('@/app/api/links/route')
    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com' }),
    }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for a javascript: URL', async () => {
    const { POST } = await import('@/app/api/links/route')
    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea_id: 'idea-1', url: 'javascript:alert(1)' }),
    }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/http/i)
  })

  it('returns 400 for a data: URL', async () => {
    const { POST } = await import('@/app/api/links/route')
    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea_id: 'idea-1', url: 'data:text/html,<script>alert(1)</script>' }),
    }))
    expect(res.status).toBe(400)
  })

  it('returns 404 when idea_id does not belong to the authenticated user', async () => {
    await mockSequence([
      { data: { id: 'db-user-1' }, error: null },     // upsert user
      { data: null, error: { message: 'Not found' } }, // idea ownership check fails
    ])
    const { POST } = await import('@/app/api/links/route')
    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea_id: 'other-users-idea', url: 'https://example.com' }),
    }))
    expect(res.status).toBe(404)
  })

  it('creates a link and returns 201 when idea is owned by user', async () => {
    const newLink = { id: 'link-1', url: 'https://example.com', idea_id: 'idea-1' }
    await mockSequence([
      { data: { id: 'db-user-1' }, error: null }, // upsert user
      { data: { id: 'idea-1' }, error: null },     // idea ownership check passes
      { data: newLink, error: null },               // insert link
    ])
    const { POST } = await import('@/app/api/links/route')
    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea_id: 'idea-1', url: 'https://example.com/article' }),
    }))
    expect(res.status).toBe(201)
  })
})

// ---- Notes ----

describe('POST /api/notes', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockReturnValue({ userId: null, sessionClaims: {} })
    const { POST } = await import('@/app/api/notes/route')
    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea_id: 'idea-1', body: 'test' }),
    }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when body or idea_id is missing', async () => {
    const { POST } = await import('@/app/api/notes/route')
    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: 'Note with no idea' }),
    }))
    expect(res.status).toBe(400)
  })

  it('returns 404 when idea_id does not belong to the authenticated user', async () => {
    await mockSequence([
      { data: { id: 'db-user-1' }, error: null },
      { data: null, error: { message: 'Not found' } },
    ])
    const { POST } = await import('@/app/api/notes/route')
    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea_id: 'other-users-idea', body: 'Hijack note' }),
    }))
    expect(res.status).toBe(404)
  })

  it('saves a note and returns 201 when idea is owned by user', async () => {
    const newNote = { id: 'note-1', body: 'Good signal', idea_id: 'idea-1' }
    await mockSequence([
      { data: { id: 'db-user-1' }, error: null },
      { data: { id: 'idea-1' }, error: null },
      { data: newNote, error: null },
    ])
    const { POST } = await import('@/app/api/notes/route')
    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea_id: 'idea-1', body: 'Good signal from DoD officer' }),
    }))
    expect(res.status).toBe(201)
  })
})

// ---- Conversations ----

describe('POST /api/conversations', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockReturnValue({ userId: null, sessionClaims: {} })
    const { POST } = await import('@/app/api/conversations/route')
    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea_id: 'idea-1', summary: 'test' }),
    }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when summary or idea_id is missing', async () => {
    const { POST } = await import('@/app/api/conversations/route')
    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact_name: 'Jane Smith' }),
    }))
    expect(res.status).toBe(400)
  })

  it('returns 404 when idea_id does not belong to the authenticated user', async () => {
    await mockSequence([
      { data: { id: 'db-user-1' }, error: null },
      { data: null, error: { message: 'Not found' } },
    ])
    const { POST } = await import('@/app/api/conversations/route')
    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea_id: 'other-users-idea', summary: 'Hijack' }),
    }))
    expect(res.status).toBe(404)
  })

  it('saves a conversation and returns 201 when idea is owned by user', async () => {
    const newConvo = { id: 'convo-1', summary: 'Strong interest', idea_id: 'idea-1' }
    await mockSequence([
      { data: { id: 'db-user-1' }, error: null },
      { data: { id: 'idea-1' }, error: null },
      { data: newConvo, error: null },
    ])
    const { POST } = await import('@/app/api/conversations/route')
    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idea_id: 'idea-1',
        summary: 'Strong interest from prime contractor. Budget cycle Q3.',
        contact_name: 'Jane Smith',
        contact_role: 'VP Programs',
        date: '2026-06-09',
      }),
    }))
    expect(res.status).toBe(201)
  })
})
