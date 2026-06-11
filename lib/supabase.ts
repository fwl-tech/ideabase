import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SCHEMA = 'ideabase'

function assertEnv(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

export function createSupabaseClient() {
  return createClient(
    assertEnv('NEXT_PUBLIC_SUPABASE_URL', supabaseUrl),
    assertEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', supabaseAnonKey),
    { db: { schema: SCHEMA } }
  )
}

export function createSupabaseServerClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  return createClient(
    assertEnv('NEXT_PUBLIC_SUPABASE_URL', supabaseUrl),
    assertEnv('SUPABASE_SERVICE_ROLE_KEY', serviceKey),
    { db: { schema: SCHEMA }, auth: { persistSession: false } }
  )
}
