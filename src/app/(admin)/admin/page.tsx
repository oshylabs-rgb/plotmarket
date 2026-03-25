'use client'

import { useEffect, useState } from 'react'
import { Users, Building2, CreditCard, MessageSquare, TrendingUp, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react'
import { formatNaira } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

const TYPE_COLORS: Record<string, string> = {
  house: '#14613a',
  apartment: '#7c3aed',
  land: '#d97706',
  commercial: '#2563eb',
  development: '#e11d48',
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProperties: 0,
    totalRevenue: 0,
    totalInquiries: 0,
  })
  const [stateData, setStateData] = useState<{ state: string; count: number }[]>([])
  const [typeData, setTypeData] = useState<{ name: string; value: number; color: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()

      const [usersRes, propertiesRes, subscriptionsRes, inquiriesRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('properties').select('*'),
        supabase.from('subscriptions').select('amount, status').eq('status', 'active'),
        supabase.from('inquiries').select('id', { count: 'exact', head: true }),
      ])

      const properties = propertiesRes.data || []
      const activeSubscriptions = subscriptionsRes.data || []

      setStats({
        totalUsers: usersRes.count || 0,
        totalProperties: properties.length,
        totalRevenue: activeSubscriptions.reduce((sum, s) => sum + (s.amount || 0), 0),
        totalInquiries: inquiriesRes.count || 0,
      })

      // State distribution
      const stateCounts: Record<string, number> = {}
      properties.forEach((p) => {
        stateCounts[p.state] = (stateCounts[p.state] || 0) + 1
      })
      const sortedStates = Object.entries(stateCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
        .map(([state, count]) => ({ state, count }))
      setStateData(sortedStates)

      // Type distribution
      const typeCounts: Record<string, number> = {}
      properties.forEach((p) => {
        typeCounts[p.type] = (typeCounts[p.type] || 0) + 1
      })
      const typeDistribution = Object.entries(typeCounts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: TYPE_COLORS[name] || '#6b7280',
      }))
      setTypeData(typeDistribution)

      setLoading(false)
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-green-600" />
      </div>
    )
  }

  const KPI_CARDS = [
    {
      label: 'Total Users',
      value: stats.totalUsers.toString(),
      icon: Users,
      color: 'bg-brand-green-50 text-brand-green-600',
    },
    {
      label: 'Total Properties',
      value: stats.totalProperties.toString(),
      icon: Building2,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Revenue',
      value: stats.totalRevenue > 0 ? formatNaira(stats.totalRevenue) : '₦0',
      icon: CreditCard,
      color: 'bg-brand-gold-50 text-brand-gold-600',
    },
    {
      label: 'Inquiries',
      value: stats.totalInquiries.toString(),
      icon: MessageSquare,
      color: 'bg-purple-50 text-purple-600',
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-1 text-gray-500">Platform analytics and overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPI_CARDS.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className="rounded-xl border border-brand-cream-300 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-sm text-gray-500">{card.label}</p>
            </div>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Listings by State */}
        {stateData.length > 0 && (
          <div className="rounded-xl border border-brand-cream-300 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Listings by State</h2>
            <p className="text-sm text-gray-500">Property distribution across states</p>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stateData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0e6d1" />
                  <XAxis dataKey="state" tick={{ fontSize: 12 }} stroke="#999" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#999" />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #f0e6d1' }}
                  />
                  <Bar dataKey="count" fill="#1a7a45" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Property Types */}
        {typeData.length > 0 && (
          <div className="rounded-xl border border-brand-cream-300 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Property Types</h2>
            <p className="text-sm text-gray-500">Distribution by property type</p>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {typeData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #f0e6d1' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Empty state when no data */}
      {stateData.length === 0 && typeData.length === 0 && (
        <div className="mt-8 rounded-xl border border-brand-cream-300 bg-white py-12 text-center">
          <Building2 className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No data yet</h3>
          <p className="mt-2 text-sm text-gray-500">Charts will appear once properties are listed on the platform.</p>
        </div>
      )}
    </div>
  )
}
