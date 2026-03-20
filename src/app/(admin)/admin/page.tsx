'use client'

import { Users, Building2, CreditCard, MessageSquare, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { MOCK_PROPERTIES, MOCK_PROFILES, MOCK_SUBSCRIPTIONS, MOCK_INQUIRIES } from '@/constants/mock-data'
import { formatNaira } from '@/lib/utils'
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

const KPI_CARDS = [
  {
    label: 'Total Users',
    value: MOCK_PROFILES.length.toString(),
    change: '+12%',
    up: true,
    icon: Users,
    color: 'bg-brand-green-50 text-brand-green-600',
  },
  {
    label: 'Total Properties',
    value: MOCK_PROPERTIES.length.toString(),
    change: '+8%',
    up: true,
    icon: Building2,
    color: 'bg-blue-50 text-blue-600',
  },
  {
    label: 'Revenue',
    value: formatNaira(
      MOCK_SUBSCRIPTIONS.filter((s) => s.status === 'active').reduce((sum, s) => sum + s.amount, 0)
    ),
    change: '+23%',
    up: true,
    icon: CreditCard,
    color: 'bg-brand-gold-50 text-brand-gold-600',
  },
  {
    label: 'Inquiries',
    value: MOCK_INQUIRIES.length.toString(),
    change: '-3%',
    up: false,
    icon: MessageSquare,
    color: 'bg-purple-50 text-purple-600',
  },
]

const REVENUE_DATA = [
  { month: 'Oct', revenue: 850000 },
  { month: 'Nov', revenue: 1200000 },
  { month: 'Dec', revenue: 980000 },
  { month: 'Jan', revenue: 1450000 },
  { month: 'Feb', revenue: 1650000 },
  { month: 'Mar', revenue: 1900000 },
]

const STATE_DATA = [
  { state: 'Lagos', count: 45 },
  { state: 'FCT', count: 28 },
  { state: 'Rivers', count: 15 },
  { state: 'Oyo', count: 12 },
  { state: 'Kano', count: 8 },
  { state: 'Others', count: 20 },
]

const TYPE_DATA = [
  { name: 'House', value: 35, color: '#14613a' },
  { name: 'Apartment', value: 25, color: '#7c3aed' },
  { name: 'Land', value: 20, color: '#d97706' },
  { name: 'Commercial', value: 12, color: '#2563eb' },
  { name: 'Development', value: 8, color: '#e11d48' },
]

export default function AdminDashboardPage() {
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
                <span
                  className={`flex items-center gap-0.5 text-sm font-medium ${
                    card.up ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {card.up ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  {card.change}
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-sm text-gray-500">{card.label}</p>
            </div>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Revenue Trend */}
        <div className="rounded-xl border border-brand-cream-300 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Revenue Trend</h2>
          <p className="text-sm text-gray-500">Monthly subscription revenue</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={REVENUE_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0e6d1" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#999" />
                <YAxis tick={{ fontSize: 12 }} stroke="#999" tickFormatter={(v) => `₦${(v / 1000000).toFixed(1)}M`} />
                <Tooltip
                  formatter={(value) => [formatNaira(Number(value)), 'Revenue']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #f0e6d1' }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#14613a"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#14613a' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Listings by State */}
        <div className="rounded-xl border border-brand-cream-300 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Listings by State</h2>
          <p className="text-sm text-gray-500">Property distribution across states</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={STATE_DATA}>
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
      </div>

      {/* Pie Chart */}
      <div className="mt-6 rounded-xl border border-brand-cream-300 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Property Types</h2>
        <p className="text-sm text-gray-500">Distribution by property type</p>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={TYPE_DATA}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
              >
                {TYPE_DATA.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #f0e6d1' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
