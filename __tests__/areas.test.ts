import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => ({ userId: 'user_test123', sessionClaims: { email: 'test@fairwaterlabs.com' } })),
}))

vi.mock('@/lib/supabase', () => ({
  createSupabaseServerClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  })),
}))

describe('Areas API', () => {
  describe('GET /api/areas', () => {
    it('returns list of areas for authenticated user', async () => {
      const { GET } = await import('@/app/api/areas/route')
      const req = new Request('http://localhost/apps/ideabase/api/areas')
      const res = await GET(req)
      expect(res).toBeDefined()
      expect(res.status).toBe(200)
    })

    it('returns empty array when user has no areas', async () => {
      const { GET } = await import('@/app/api/areas/route')
      const req = new Request('http://localhost/apps/ideabase/api/areas')
      const res = await GET(req)
      const body = await res.json()
      expect(Array.isArray(body)).toBe(true)
    })
  })

  describe('POST /api/areas', () => {
    it('creates a new area with name and description', async () => {
      const { POST } = await import('@/app/api/areas/route')
      const req = new Request('http://localhost/apps/ideabase/api/areas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Autonomous Logistics', description: 'Drone + autonomy for supply chain' }),
      })
      const res = await POST(req)
      expect(res).toBeDefined()
    })

    it('returns 400 when name is missing', async () => {
      const { POST } = await import('@/app/api/areas/route')
      const req = new Request('http://localhost/apps/ideabase/api/areas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: 'No name provided' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/areas/:id', () => {
    it('returns area with its ideas', async () => {
      const { GET } = await import('@/app/api/areas/[id]/route')
      const req = new Request('http://localhost/apps/ideabase/api/areas/area-123')
      const res = await GET(req, { params: { id: 'area-123' } })
      expect(res).toBeDefined()
    })

    it('returns 404 for non-existent area', async () => {
      const { GET } = await import('@/app/api/areas/[id]/route')
      const req = new Request('http://localhost/apps/ideabase/api/areas/nonexistent')
      const res = await GET(req, { params: { id: 'nonexistent' } })
      expect(res.status).toBe(404)
    })
  })
})
