import { NextResponse } from 'next/server'
import { requireAuth, getOrCreateDbUser } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase'

export async function GET() {
  const { user, error } = await requireAuth()
  if (error) return error

  const supabase = createSupabaseServerClient()
  const dbUser = await getOrCreateDbUser(user!.userId, user!.email)
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { data: areas, error: dbError } = await supabase
    .from('areas')
    .select('*, ideas(count)')
    .eq('user_id', dbUser.id)
    .order('created_at', { ascending: false })

  if (dbError) return NextResponse.json({ error: 'Failed to fetch areas' }, { status: 500 })
  return NextResponse.json(areas ?? [])
}

export async function POST(req: Request) {
  const { user, error } = await requireAuth()
  if (error) return error

  const body = await req.json().catch(() => null)
  if (!body?.name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  const supabase = createSupabaseServerClient()
  const dbUser = await getOrCreateDbUser(user!.userId, user!.email)
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { data, error: dbError } = await supabase
    .from('areas')
    .insert({ name: body.name, description: body.description ?? null, user_id: dbUser.id })
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: 'Failed to create area' }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
