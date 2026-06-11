import { NextResponse } from 'next/server'
import { requireAuth, getOrCreateDbUser } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase'

const MAX_TEXT_LENGTH = 50000

export async function POST(req: Request) {
  const { user, error } = await requireAuth()
  if (error) return error

  const body = await req.json().catch(() => null)
  if (!body?.body || !body?.idea_id) {
    return NextResponse.json({ error: 'body and idea_id are required' }, { status: 400 })
  }
  if (typeof body.body === 'string' && body.body.length > MAX_TEXT_LENGTH) {
    return NextResponse.json({ error: 'note body is too long' }, { status: 400 })
  }

  const supabase = createSupabaseServerClient()
  const dbUser = await getOrCreateDbUser(user!.userId, user!.email)
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Verify the idea belongs to this user before inserting
  const { data: idea } = await supabase
    .from('ideas')
    .select('id')
    .eq('id', body.idea_id)
    .eq('user_id', dbUser.id)
    .single()
  if (!idea) return NextResponse.json({ error: 'Idea not found' }, { status: 404 })

  const { data, error: dbError } = await supabase
    .from('notes')
    .insert({ body: body.body, idea_id: body.idea_id })
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: 'Failed to save note' }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
