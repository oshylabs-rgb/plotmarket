'use client'

import { useEffect, useState } from 'react'
import { MessageSquare, Clock, User, Loader2 } from 'lucide-react'
import { getStatusColor } from '@/lib/utils'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import type { Inquiry, Property, Profile } from '@/types/database'

export default function InquiriesPage() {
  const { user, loading: authLoading } = useAuth()
  const [tab, setTab] = useState<'received' | 'sent'>('received')
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      const supabase = createClient()

      const [inquiriesRes, propertiesRes, profilesRes] = await Promise.all([
        supabase
          .from('inquiries')
          .select('*')
          .or(`receiver_id.eq.${user.id},sender_id.eq.${user.id}`)
          .order('created_at', { ascending: false }),
        supabase
          .from('properties')
          .select('id, title')
          .eq('status', 'approved'),
        supabase
          .from('profiles')
          .select('id, full_name, email'),
      ])

      setInquiries(inquiriesRes.data || [])
      setProperties(propertiesRes.data as Property[] || [])
      setProfiles(profilesRes.data as Profile[] || [])
      setLoading(false)
    }

    fetchData()
  }, [user])

  if (authLoading || loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-green-600" />
      </div>
    )
  }

  const received = inquiries.filter((i) => i.receiver_id === user?.id)
  const sent = inquiries.filter((i) => i.sender_id === user?.id)
  const displayed = tab === 'received' ? received : sent

  const getProperty = (id: string) => properties.find((p) => p.id === id)
  const getProfile = (id: string) => profiles.find((p) => p.id === id)

  const handleMarkRead = async (inquiryId: string) => {
    const supabase = createClient()
    await supabase.from('inquiries').update({ status: 'read' }).eq('id', inquiryId)
    setInquiries((prev) =>
      prev.map((i) => (i.id === inquiryId ? { ...i, status: 'read' } : i))
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Inquiries</h1>
      <p className="mt-1 text-gray-500">Manage messages about your properties</p>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 rounded-lg bg-brand-cream-100 p-1">
        <button
          onClick={() => setTab('received')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'received'
              ? 'bg-white text-brand-green-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Received ({received.length})
        </button>
        <button
          onClick={() => setTab('sent')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'sent'
              ? 'bg-white text-brand-green-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Sent ({sent.length})
        </button>
      </div>

      {/* Inquiry list */}
      <div className="mt-6 space-y-4">
        {displayed.length > 0 ? (
          displayed.map((inquiry) => {
            const property = getProperty(inquiry.property_id)
            const person = tab === 'received'
              ? getProfile(inquiry.sender_id)
              : getProfile(inquiry.receiver_id)

            return (
              <div
                key={inquiry.id}
                className="rounded-xl border border-brand-cream-300 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-green-100">
                      <User className="h-5 w-5 text-brand-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{person?.full_name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{person?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${getStatusColor(inquiry.status)}`}>
                      {inquiry.status}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="h-3 w-3" />
                      {format(new Date(inquiry.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>

                {property && (
                  <div className="mt-3 rounded-lg bg-brand-cream-50 px-3 py-2">
                    <p className="text-xs text-gray-500">Regarding:</p>
                    <p className="text-sm font-medium text-brand-green-700">{property.title}</p>
                  </div>
                )}

                <p className="mt-3 text-sm leading-relaxed text-gray-600">{inquiry.message}</p>

                {tab === 'received' && inquiry.status === 'unread' && (
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleMarkRead(inquiry.id)}
                      className="btn btn-outline text-xs py-1.5 px-3"
                    >
                      Mark as Read
                    </button>
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <div className="rounded-xl border border-brand-cream-300 bg-white py-12 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">No inquiries</h3>
            <p className="mt-2 text-sm text-gray-500">
              {tab === 'received'
                ? 'You haven\'t received any inquiries yet.'
                : 'You haven\'t sent any inquiries yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
