import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from './supabase'

export async function getAuthenticatedUser() {
  const { userId, sessionClaims } = await auth()
  if (!userId) return null
  const email = sessionClaims?.email as string | undefined
  if (!email?.endsWith('@fairwaterlabs.com')) return null
  return { userId, email }
}

export async function requireAuth() {
  const user = await getAuthenticatedUser()
  if (!user) {
    return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  return { user, error: null }
}

export async function getOrCreateDbUser(clerkUserId: string, email: string, name?: string) {
  const supabase = createSupabaseServerClient()
  const { data: existing } = await supabase
    .from('users')
    .select('*')
    .eq('google_id', clerkUserId)
    .single()
  if (existing) return existing
  const { data: created } = await supabase
    .from('users')
    .insert({ email, name: name ?? null, google_id: clerkUserId })
    .select()
    .single()
  return created
}
