import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Anonymous, cookie free Supabase client for public server side reads:
 * sitemap, location landing pages and structured data. It only ever sees what
 * row level security exposes to the anon role, which is approved listings and
 * public profile fields. Never use it for writes or for anything per user.
 */
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
