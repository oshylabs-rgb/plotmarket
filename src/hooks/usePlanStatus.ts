'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { PlanStatus } from '@/types/database'

/**
 * The signed-in seller's plan, straight from the database function that also
 * enforces it, so what the dashboard shows is what the server will allow.
 */
export function usePlanStatus(userId: string | undefined) {
  const [status, setStatus] = useState<PlanStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    if (!userId) return
    const supabase = createClient()
    const { data, error: rpcError } = await supabase.rpc('plan_status')
    if (rpcError) {
      setError(rpcError.message)
    } else {
      setError('')
      setStatus(((data as PlanStatus[] | null) ?? [])[0] ?? null)
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    // Reads from the database and then sets state; not a render-time update.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh()
  }, [refresh])

  return { status, loading, error, refresh }
}
