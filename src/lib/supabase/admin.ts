import { createClient } from '@supabase/supabase-js'

/**
 * Service role Supabase client, for server to server work only.
 *
 * Never import this into anything that reaches the browser. The service role
 * key bypasses row level security entirely.
 *
 * This exists because the Paystack webhook is called by Paystack, not by a
 * signed in visitor, so there are no auth cookies on the request and
 * auth.uid() is null. An anon key client would be silently blocked by every
 * row level security policy on subscriptions and profiles.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL must be set for server to server Supabase access'
    )
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
