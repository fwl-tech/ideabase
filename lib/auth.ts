import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from './supabase'

export async function getAuthenticatedUser() {
  const { userId, sessionClaims } = await auth()
  if (!userId) return null
  const email = sessionClaims?.email as string | undefined
  // Require a valid FWL email — reject sessions where email is missing or wrong domain
  if (!email || !email.endsWith('@fairwaterlabs.com')) return null
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

  // Atomic upsert — avoids TOCTOU race on concurrent first-logins
  const { data, error } = await supabase
    .from('users')
    .upsert(
      { email, name: name ?? null, clerk_id: clerkUserId },
      { onConflict: 'clerk_id', ignoreDuplicates: false }
    )
    .select()
    .single()

  if (error) {
    console.error('[getOrCreateDbUser] upsert failed:', error.message)
    return null
  }
  return data
}
