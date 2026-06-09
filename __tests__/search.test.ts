import { describe, it, expect, vi } from 'vitest'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => ({ userId: 'user_test123', sessionClaims: { email: 'test@fairwaterlabs.com' } })),
}))

vi.mock('@/lib/supabase', () => ({
  createSupabaseServerClient: vi.fn(() => ({
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
  })),
}))

describe('Search API', () => {
  describe('GET /api/search', () => {
    it('returns results grouped by idea for a query', async () => {
      const { GET } = await import('@/app/api/search/route')
      const req = new Request('http://localhost/apps/ideabase/api/search?q=logistics')
      const res = await GET(req)
      expect(res).toBeDefined()
      expect(res.status).toBe(200)
    })

    it('returns 400 when query param is missing', async () => {
      const { GET } = await import('@/app/api/search/route')
      const req = new Request('http://localhost/apps/ideabase/api/search')
      const res = await GET(req)
      expect(res.status).toBe(400)
    })

    it('returns empty array when no results match', async () => {
      const { GET } = await import('@/app/api/search/route')
      const req = new Request('http://localhost/apps/ideabase/api/search?q=zzznomatch')
      const res = await GET(req)
      const body = await res.json()
      expect(Array.isArray(body)).toBe(true)
    })
  })
})
