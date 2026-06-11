import { NextResponse } from 'next/server'
import { requireAuth, getOrCreateDbUser } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase'

const MAX_TITLE_LENGTH = 500

export async function POST(req: Request) {
  const { user, error } = await requireAuth()
  if (error) return error

  const body = await req.json().catch(() => null)
  if (!body?.title || !body?.area_id) {
    return NextResponse.json({ error: 'title and area_id are required' }, { status: 400 })
  }
  if (typeof body.title === 'string' && body.title.length > MAX_TITLE_LENGTH) {
    return NextResponse.json({ error: 'title is too long' }, { status: 400 })
  }

  const supabase = createSupabaseServerClient()
  const dbUser = await getOrCreateDbUser(user!.userId, user!.email)
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Verify the area belongs to this user
  const { data: area } = await supabase
    .from('areas')
    .select('id')
    .eq('id', body.area_id)
    .eq('user_id', dbUser.id)
    .single()
  if (!area) return NextResponse.json({ error: 'Area not found' }, { status: 404 })

  const { data, error: dbError } = await supabase
    .from('ideas')
    .insert({ title: body.title, area_id: body.area_id, user_id: dbUser.id })
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: 'Failed to create idea' }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
