import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase'

export async function POST(req: Request) {
  const { error } = await requireAuth()
  if (error) return error

  const body = await req.json().catch(() => null)
  if (!body?.body || !body?.idea_id) {
    return NextResponse.json({ error: 'body and idea_id are required' }, { status: 400 })
  }

  const supabase = createSupabaseServerClient()
  const { data, error: dbError } = await supabase
    .from('notes')
    .insert({ body: body.body, idea_id: body.idea_id })
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
