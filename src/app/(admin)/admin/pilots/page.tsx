'use client'

import { useCallback, useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getStatusColor } from '@/lib/utils'
import { NIGERIAN_STATES } from '@/constants/states'
import { LISTING_LIMITS, PILOT_DAYS } from '@/constants/plans'
import type { Pilot, PilotStatus, Profile } from '@/types/database'

type PilotRow = Pilot & { profile: Pick<Profile, 'email' | 'full_name' | 'user_type'> | null }

/**
 * Founding Developer Pilot admin. Every decision is a write the database
 * checks (admins only); activating starts the 30 day clock server side.
 * After any change that alters an account's allowance, the account is
 * rebalanced so its public listings match the new plan straight away.
 */
export default function AdminPilotsPage() {
  const [pilots, setPilots] = useState<PilotRow[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data, error: loadError } = await supabase
      .from('pilots')
      .select('*, profile:profiles!pilots_user_id_fkey(email, full_name, user_type)')
      .order('created_at', { ascending: false })
    if (loadError) setError(`Could not load pilots. ${loadError.message}`)
    setPilots((data as PilotRow[] | null) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  const update = async (pilot: PilotRow, patch: Partial<Pilot>, done: string) => {
    setBusyId(pilot.id)
    setError('')
    setMessage('')
    const supabase = createClient()
    const { error: updateError } = await supabase.from('pilots').update(patch).eq('id', pilot.id)
    if (updateError) {
      setError(updateError.message)
      setBusyId(null)
      return
    }
    const { data: balance, error: balanceError } = await supabase.rpc('apply_allowance', {
      p_user: pilot.user_id,
    })
    const b = (balance as { paused: number; restored: number }[] | null)?.[0]
    setMessage(
      balanceError
        ? `${done} Could not rebalance listings: ${balanceError.message}`
        : `${done}${b && (b.paused || b.restored) ? ` Listings paused: ${b.paused}, restored: ${b.restored}.` : ''}`
    )
    setBusyId(null)
    load()
  }

  const extend = (pilot: PilotRow) => {
    const input = prompt('New end date and time (YYYY-MM-DD HH:MM, your local time). This is an exception to the one-pilot, 30-day rule.')
    if (!input) return
    const when = new Date(input.replace(' ', 'T'))
    if (Number.isNaN(when.getTime())) {
      setError('That date was not understood. Use YYYY-MM-DD HH:MM.')
      return
    }
    update(pilot, { status: 'active', ends_at: when.toISOString() }, 'End date changed.')
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-green-600" />
      </div>
    )
  }

  const byStatus = (s: PilotStatus) => pilots.filter((p) => p.status === s)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Founding Developer Pilots</h1>
      <p className="mt-1 text-gray-500">
        Invitation only. Activation gives {LISTING_LIMITS.pilot} active listings in one estate for {PILOT_DAYS} days
        from the moment you activate. One pilot per account and per CAC number.
      </p>

      {message && <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{message}</p>}
      {error && (
        <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        {(['requested', 'active', 'expired', 'rejected'] as PilotStatus[]).map((s) => (
          <div key={s} className="rounded-xl border border-brand-cream-300 bg-white p-4">
            <p className="text-sm capitalize text-gray-500">{s}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 tabular">{byStatus(s).length}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-brand-cream-300 bg-white shadow-sm">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="border-b border-brand-cream-200 bg-brand-cream-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">Company and estate</th>
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Dates</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-cream-200">
            {pilots.map((p) => (
              <tr key={p.id} className="align-top">
                <td className="px-4 py-3 text-sm">
                  <p className="font-medium text-gray-900">{p.company_name}</p>
                  <p className="text-xs text-gray-500">CAC {p.cac_number}</p>
                  <p className="mt-1 text-gray-700">
                    {p.project_name}, {p.project_area ? `${p.project_area}, ` : ''}
                    {p.project_state}
                  </p>
                </td>
                <td className="px-4 py-3 text-sm">
                  <p className="text-gray-900">{p.profile?.full_name}</p>
                  <p className="text-xs text-gray-500">{p.profile?.email}</p>
                  <p className="text-xs capitalize text-gray-500">{p.profile?.user_type}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${getStatusColor(p.status)}`}>
                    {p.status}
                  </span>
                  {p.setup_session_at && (
                    <p className="mt-1 text-xs text-gray-500">Setup session done</p>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-gray-600">
                  <p>Requested {format(new Date(p.requested_at), 'd MMM yyyy')}</p>
                  {p.activated_at && <p>Activated {format(new Date(p.activated_at), 'd MMM yyyy HH:mm')}</p>}
                  {p.ends_at && <p>Ends {format(new Date(p.ends_at), 'd MMM yyyy HH:mm')}</p>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-2">
                    {p.status === 'requested' && (
                      <>
                        <button
                          type="button"
                          className="btn btn-primary text-xs"
                          disabled={busyId === p.id}
                          onClick={() => {
                            if (confirm(`Activate the pilot for ${p.company_name}? The ${PILOT_DAYS}-day clock starts now.`)) {
                              update(p, { status: 'active' }, 'Pilot activated.')
                            }
                          }}
                        >
                          Approve and activate
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline text-xs"
                          disabled={busyId === p.id}
                          onClick={() => update(p, { status: 'rejected' }, 'Request rejected.')}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {p.status === 'active' && !p.setup_session_at && (
                      <button
                        type="button"
                        className="btn btn-outline text-xs"
                        disabled={busyId === p.id}
                        onClick={() => update(p, { setup_session_at: new Date().toISOString() }, 'Setup session recorded.')}
                      >
                        Setup session done
                      </button>
                    )}
                    {p.status === 'active' && (
                      <button
                        type="button"
                        className="btn btn-outline text-xs"
                        disabled={busyId === p.id}
                        onClick={() => {
                          if (confirm('End this pilot now? Listings over the Free Starter limit will be paused, not deleted.')) {
                            update(p, { status: 'revoked' }, 'Pilot ended.')
                          }
                        }}
                      >
                        End now
                      </button>
                    )}
                    {(p.status === 'active' || p.status === 'expired') && (
                      <button
                        type="button"
                        className="btn btn-outline text-xs"
                        disabled={busyId === p.id}
                        onClick={() => extend(p)}
                      >
                        Change end date
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pilots.length === 0 && <p className="py-12 text-center text-gray-500">No pilot requests yet</p>}
      </div>

      <GrantPilot onGranted={load} />
    </div>
  )
}

/**
 * Grant a pilot directly, for example to honour an offer made in writing
 * before the pilot existed. The end date can be set to what was promised.
 */
function GrantPilot({ onGranted }: { onGranted: () => void }) {
  const [form, setForm] = useState({
    email: '',
    company_name: '',
    cac_number: '',
    project_name: '',
    project_state: '',
    ends_at: '',
  })
  const [status, setStatus] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('')
    const supabase = createClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', form.email.trim().toLowerCase())
      .maybeSingle()
    if (!profile) {
      setStatus('No account with that email. The developer must register first.')
      return
    }
    const { error } = await supabase.from('pilots').insert({
      user_id: profile.id,
      status: 'active',
      company_name: form.company_name,
      cac_number: form.cac_number,
      project_name: form.project_name,
      project_state: form.project_state,
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
    })
    if (error) {
      setStatus(error.code === '23505' ? 'That account or CAC number already has a pilot.' : error.message)
      return
    }
    await supabase.rpc('apply_allowance', { p_user: profile.id })
    setStatus('Pilot granted and active.')
    onGranted()
  }

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  return (
    <section className="mt-10 rounded-xl border border-brand-cream-300 bg-white p-6 shadow-sm" aria-labelledby="grant-pilot">
      <h2 id="grant-pilot" className="text-lg font-semibold text-gray-900">Grant a pilot directly</h2>
      <p className="mt-1 text-sm text-gray-500">
        For offers already made in writing. Leave the end date empty for {PILOT_DAYS} days from now.
      </p>
      <form onSubmit={submit} className="mt-4 grid gap-4 sm:grid-cols-3">
        <label className="text-sm font-medium text-gray-700">
          Account email
          <input name="email" type="email" value={form.email} onChange={change} className="input-field mt-1" required />
        </label>
        <label className="text-sm font-medium text-gray-700">
          Company name
          <input name="company_name" value={form.company_name} onChange={change} className="input-field mt-1" required />
        </label>
        <label className="text-sm font-medium text-gray-700">
          CAC number
          <input name="cac_number" value={form.cac_number} onChange={change} className="input-field mt-1" required />
        </label>
        <label className="text-sm font-medium text-gray-700">
          Estate or project
          <input name="project_name" value={form.project_name} onChange={change} className="input-field mt-1" required />
        </label>
        <label className="text-sm font-medium text-gray-700">
          State
          <select name="project_state" value={form.project_state} onChange={change} className="input-field mt-1" required>
            <option value="">Select state</option>
            {NIGERIAN_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-gray-700">
          Ends (optional)
          <input name="ends_at" type="datetime-local" value={form.ends_at} onChange={change} className="input-field mt-1" />
        </label>
        <div className="sm:col-span-3">
          <button type="submit" className="btn btn-primary">Grant pilot</button>
          {status && <p className="mt-2 text-sm text-gray-700">{status}</p>}
        </div>
      </form>
    </section>
  )
}
