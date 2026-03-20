'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  Users,
  Building2,
  CreditCard,
  LogOut,
  Menu,
  X,
  Shield,
} from 'lucide-react'
import { Logo } from './Logo'
import { createClient } from '@/lib/supabase/client'

const SIDEBAR_LINKS = [
  { href: '/admin', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/properties', label: 'Properties', icon: Building2 },
  { href: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="fixed left-4 top-4 z-50 rounded-lg bg-brand-green-700 p-2 text-white shadow-lg md:hidden"
      >
        {collapsed ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Overlay */}
      {collapsed && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setCollapsed(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-full w-64 flex-col bg-brand-green-700 transition-transform md:translate-x-0 ${
          collapsed ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:flex`}
      >
        <div className="flex h-16 items-center px-5">
          <Logo light />
          <span className="ml-2 rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
            Admin
          </span>
        </div>

        <div className="mx-3 mt-2 flex items-center gap-2 rounded-lg bg-brand-green-800/50 px-3 py-2">
          <Shield className="h-4 w-4 text-brand-gold-400" />
          <span className="text-xs font-medium text-brand-green-200">Admin Panel</span>
        </div>

        <nav className="mt-4 flex-1 space-y-1 px-3">
          {SIDEBAR_LINKS.map((link) => {
            const isActive = pathname === link.href
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setCollapsed(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-green-800 text-brand-gold-400'
                    : 'text-brand-green-100 hover:bg-brand-green-600 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                {link.label}
                {isActive && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-gold-400" />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-brand-green-600 p-4">
          <Link
            href="/dashboard"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-brand-green-200 hover:bg-brand-green-600 hover:text-white transition-colors mb-1"
          >
            <Building2 className="h-5 w-5" />
            Dashboard
          </Link>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-brand-green-200 hover:bg-brand-green-600 hover:text-white transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}
