import { describe, it, expect, vi } from 'vitest'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => ({ userId: 'user_test123', sessionClaims: { email: 'test@fairwaterlabs.com' } })),
}))

vi.mock('@/lib/supabase', () => ({
  createSupabaseServerClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'new-item-id' }, error: null }),
    })),
  })),
}))

describe('Quick Capture API', () => {
  describe('POST /api/links', () => {
    it('saves a link against an idea', async () => {
      const { POST } = await import('@/app/api/links/route')
      const req = new Request('http://localhost/apps/ideabase/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea_id: 'idea-123', url: 'https://example.com/article' }),
      })
      const res = await POST(req)
      expect(res).toBeDefined()
      expect(res.status).toBe(201)
    })

    it('returns 400 when url or idea_id is missing', async () => {
      const { POST } = await import('@/app/api/links/route')
      const req = new Request('http://localhost/apps/ideabase/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })
  })

  describe('POST /api/notes', () => {
    it('saves a note against an idea', async () => {
      const { POST } = await import('@/app/api/notes/route')
      const req = new Request('http://localhost/apps/ideabase/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea_id: 'idea-123', body: 'Spoke to a DoD procurement officer who confirmed demand.' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(201)
    })

    it('returns 400 when body or idea_id is missing', async () => {
      const { POST } = await import('@/app/api/notes/route')
      const req = new Request('http://localhost/apps/ideabase/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: 'Note with no idea' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })
  })

  describe('POST /api/conversations', () => {
    it('saves a conversation summary against an idea', async () => {
      const { POST } = await import('@/app/api/conversations/route')
      const req = new Request('http://localhost/apps/ideabase/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea_id: 'idea-123',
          summary: 'Strong interest from prime contractor. Budget cycle Q3.',
          contact_name: 'Jane Smith',
          contact_role: 'VP Programs',
          date: '2026-06-09',
        }),
      })
      const res = await POST(req)
      expect(res.status).toBe(201)
    })

    it('returns 400 when summary or idea_id is missing', async () => {
      const { POST } = await import('@/app/api/conversations/route')
      const req = new Request('http://localhost/apps/ideabase/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact_name: 'Jane Smith' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })
  })
})
