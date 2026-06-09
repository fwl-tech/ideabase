import { NextResponse } from 'next/server'
import { requireAuth, getOrCreateDbUser } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase'

const UPDATABLE_FIELDS = ['title', 'status', 'problem', 'solution', 'commercial_models', 'competitors', 'demand_signals']

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { user, error } = await requireAuth()
  if (error) return error

  const supabase = createSupabaseServerClient()
  const dbUser = await getOrCreateDbUser(user!.userId, user!.email)
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { data: idea, error: ideaError } = await supabase
    .from('ideas')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', dbUser.id)
    .single()

  if (ideaError || !idea) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [{ data: links }, { data: notes }, { data: conversations }] = await Promise.all([
    supabase.from('links').select('*').eq('idea_id', params.id).order('added_at', { ascending: false }),
    supabase.from('notes').select('*').eq('idea_id', params.id).order('created_at', { ascending: false }),
    supabase.from('conversations').select('*').eq('idea_id', params.id).order('created_at', { ascending: false }),
  ])

  return NextResponse.json({ ...idea, links: links ?? [], notes: notes ?? [], conversations: conversations ?? [] })
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { user, error } = await requireAuth()
  if (error) return error

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  for (const field of UPDATABLE_FIELDS) {
    if (field in body) updates[field] = body[field]
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const supabase = createSupabaseServerClient()
  const dbUser = await getOrCreateDbUser(user!.userId, user!.email)
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { data, error: dbError } = await supabase
    .from('ideas')
    .update(updates)
    .eq('id', params.id)
    .eq('user_id', dbUser.id)
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}
