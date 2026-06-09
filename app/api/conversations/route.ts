import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase'

export async function POST(req: Request) {
  const { error } = await requireAuth()
  if (error) return error

  const body = await req.json().catch(() => null)
  if (!body?.summary || !body?.idea_id) {
    return NextResponse.json({ error: 'summary and idea_id are required' }, { status: 400 })
  }

  const supabase = createSupabaseServerClient()
  const { data, error: dbError } = await supabase
    .from('conversations')
    .insert({
      idea_id: body.idea_id,
      summary: body.summary,
      contact_name: body.contact_name ?? null,
      contact_role: body.contact_role ?? null,
      date: body.date ?? null,
    })
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
