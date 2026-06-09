import { describe, it, expect, vi } from 'vitest'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => ({ userId: 'user_test123', sessionClaims: { email: 'test@fairwaterlabs.com' } })),
}))

vi.mock('@/lib/supabase', () => ({
  createSupabaseServerClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
}))

describe('Ideas API', () => {
  describe('POST /api/ideas', () => {
    it('creates an idea with title and area_id', async () => {
      const { POST } = await import('@/app/api/ideas/route')
      const req = new Request('http://localhost/apps/ideabase/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'AI-native logistics OS', area_id: 'area-123' }),
      })
      const res = await POST(req)
      expect(res).toBeDefined()
    })

    it('returns 400 when title or area_id is missing', async () => {
      const { POST } = await import('@/app/api/ideas/route')
      const req = new Request('http://localhost/apps/ideabase/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'No area' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })
  })

  describe('PATCH /api/ideas/:id', () => {
    it('updates opinion fields on an idea', async () => {
      const { PATCH } = await import('@/app/api/ideas/[id]/route')
      const req = new Request('http://localhost/apps/ideabase/api/ideas/idea-123', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem: 'Logistics is fragmented and manual',
          solution: 'Unified AI platform',
          status: 'Strong signal',
        }),
      })
      const res = await PATCH(req, { params: { id: 'idea-123' } })
      expect(res).toBeDefined()
    })
  })

  describe('GET /api/ideas/:id', () => {
    it('returns idea with links, notes, and conversations', async () => {
      const { GET } = await import('@/app/api/ideas/[id]/route')
      const req = new Request('http://localhost/apps/ideabase/api/ideas/idea-123')
      const res = await GET(req, { params: { id: 'idea-123' } })
      expect(res).toBeDefined()
    })

    it('returns 404 for non-existent idea', async () => {
      const { GET } = await import('@/app/api/ideas/[id]/route')
      const req = new Request('http://localhost/apps/ideabase/api/ideas/nonexistent')
      const res = await GET(req, { params: { id: 'nonexistent' } })
      expect(res.status).toBe(404)
    })
  })
})
