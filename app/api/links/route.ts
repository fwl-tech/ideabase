import { NextResponse } from 'next/server'
import { requireAuth, getOrCreateDbUser } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase'

function isValidHttpUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

const MAX_TEXT_LENGTH = 5000

export async function POST(req: Request) {
  const { user, error } = await requireAuth()
  if (error) return error

  const body = await req.json().catch(() => null)
  if (!body?.url || !body?.idea_id) {
    return NextResponse.json({ error: 'url and idea_id are required' }, { status: 400 })
  }
  if (!isValidHttpUrl(body.url)) {
    return NextResponse.json({ error: 'url must be a valid http or https URL' }, { status: 400 })
  }
  if (body.title && typeof body.title === 'string' && body.title.length > MAX_TEXT_LENGTH) {
    return NextResponse.json({ error: 'title is too long' }, { status: 400 })
  }
  if (body.summary && typeof body.summary === 'string' && body.summary.length > MAX_TEXT_LENGTH) {
    return NextResponse.json({ error: 'summary is too long' }, { status: 400 })
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
    .from('links')
    .insert({ url: body.url, idea_id: body.idea_id, title: body.title ?? null, summary: body.summary ?? null })
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: 'Failed to save link' }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
