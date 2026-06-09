import { NextResponse } from 'next/server'
import { requireAuth, getOrCreateDbUser } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { user, error } = await requireAuth()
  if (error) return error

  const supabase = createSupabaseServerClient()
  const dbUser = await getOrCreateDbUser(user!.userId, user!.email)
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { data: area, error: areaError } = await supabase
    .from('areas')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', dbUser.id)
    .single()

  if (areaError || !area) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: ideas } = await supabase
    .from('ideas')
    .select('*')
    .eq('area_id', params.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ ...area, ideas: ideas ?? [] })
}
