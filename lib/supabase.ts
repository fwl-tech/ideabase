import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SCHEMA = 'ideabase'

export function createSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    db: { schema: SCHEMA },
  })
}

export function createSupabaseServerClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, serviceKey, {
    db: { schema: SCHEMA },
    auth: { persistSession: false },
  })
}
