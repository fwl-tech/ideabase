import { NextResponse } from 'next/server'
import { requireAuth, getOrCreateDbUser } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase'

export async function GET(req: Request) {
  const { user, error } = await requireAuth()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')
  if (!q?.trim()) return NextResponse.json({ error: 'q parameter is required' }, { status: 400 })

  const supabase = createSupabaseServerClient()
  const dbUser = await getOrCreateDbUser(user!.userId, user!.email)
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { data: rows, error: dbError } = await supabase.rpc('search_all', {
    query: q.trim(),
    p_user_id: dbUser.id,
  })

  if (dbError) return NextResponse.json({ error: 'Search failed' }, { status: 500 })

  // Group matches by idea
  const grouped: Record<string, { idea_id: string; idea_title: string; area_id: string; area_name: string; matches: { type: string; excerpt: string }[] }> = {}
  for (const row of rows ?? []) {
    if (!grouped[row.idea_id]) {
      grouped[row.idea_id] = { idea_id: row.idea_id, idea_title: row.idea_title, area_id: row.area_id, area_name: row.area_name, matches: [] }
    }
    grouped[row.idea_id].matches.push({ type: row.match_type, excerpt: row.excerpt })
  }

  return NextResponse.json(Object.values(grouped))
}
