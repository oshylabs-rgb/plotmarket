'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { createClient } from '@/lib/supabase/client'

type Ranked = { key: string; views: number }
type Summary = {
  views: number
  by_day: { day: string; views: number }[]
  top_paths: Ranked[]
  referrers: Ranked[]
  campaigns: Ranked[]
  countries: Ranked[]
  devices: Ranked[]
  funnel: {
    signups: number
    listings_created: number
    listings_live: number
    enquiries: number
    pilot_requests: number
    business_payments: number
  }
}

const RANGES = [7, 30, 90] as const

const FUNNEL_STEPS: { key: keyof Summary['funnel']; label: string; note?: string }[] = [
  { key: 'signups', label: 'Sign ups' },
  { key: 'listings_created', label: 'Listings created', note: 'demo excluded' },
  { key: 'listings_live', label: 'Live listings now', note: 'demo excluded' },
  { key: 'enquiries', label: 'Enquiries' },
  { key: 'pilot_requests', label: 'Pilot requests' },
  { key: 'business_payments', label: 'Business payments' },
]

function RankedTable({ title, rows, empty }: { title: string; rows: Ranked[]; empty: string }) {
  return (
    <div className="rounded-xl border border-brand-cream-300 bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-gray-900">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">{empty}</p>
      ) : (
        <table className="mt-3 w-full text-sm">
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-t border-brand-cream-200 first:border-0">
                <td className="max-w-0 truncate py-1.5 pr-3 text-gray-700" title={r.key}>
                  {r.key}
                </td>
                <td className="tabular py-1.5 text-right font-medium text-gray-900">{r.views}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

/**
 * Cookieless visit counts (migration 0009) next to the seller funnel from the
 * same period, so outreach links tagged with utm_campaign can be followed
 * from visit to sign up to listing.
 */
export function TrafficPanel() {
  const [days, setDays] = useState<(typeof RANGES)[number]>(30)
  const [data, setData] = useState<Summary | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    createClient()
      .rpc('admin_traffic_summary', { p_days: days })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          setError(
            error.code === 'PGRST202'
              ? 'Visit counts are not set up on this database yet (migration 0009).'
              : 'Could not load visit counts.'
          )
          setData(null)
        } else {
          setError(null)
          setData(data as Summary)
        }
      })
    return () => {
      cancelled = true
    }
  }, [days])

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Traffic and funnel</h2>
          <p className="text-sm text-gray-500">
            Production page views, counted without cookies or personal data. Admin pages excluded.
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-brand-cream-300 bg-white p-0.5" role="group" aria-label="Period">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setDays(r)}
              aria-pressed={days === r}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                days === r ? 'bg-brand-green-700 text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {r} days
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{error}</p>
      ) : !data ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-brand-green-600" />
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            <div className="rounded-xl border border-brand-cream-300 bg-white p-4 shadow-sm">
              <p className="tabular text-2xl font-bold text-gray-900">{data.views}</p>
              <p className="text-sm text-gray-500">Page views</p>
            </div>
            {FUNNEL_STEPS.map((s) => (
              <div key={s.key} className="rounded-xl border border-brand-cream-300 bg-white p-4 shadow-sm">
                <p className="tabular text-2xl font-bold text-gray-900">{data.funnel[s.key]}</p>
                <p className="text-sm text-gray-500">{s.label}</p>
                {s.note && <p className="text-xs text-gray-400">{s.note}</p>}
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-brand-cream-300 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900">Page views per day</h3>
            <div className="mt-3 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.by_day}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0e6d1" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#999" tickFormatter={(d: string) => d.slice(5)} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#999" width={32} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #f0e6d1' }} />
                  <Bar dataKey="views" fill="#1a7a45" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <RankedTable title="Top pages" rows={data.top_paths} empty="No page views yet." />
            <RankedTable title="Where visitors came from" rows={data.referrers} empty="No page views yet." />
            <RankedTable
              title="Campaigns (utm source / medium / campaign)"
              rows={data.campaigns}
              empty="No tagged links used yet. Add ?utm_source=whatsapp&utm_campaign=pilot to outreach links."
            />
            <RankedTable title="Countries" rows={data.countries} empty="No page views yet." />
            <RankedTable title="Devices" rows={data.devices} empty="No page views yet." />
          </div>
        </>
      )}
    </section>
  )
}
