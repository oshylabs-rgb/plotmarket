'use client'

import { useSyncExternalStore } from 'react'
import Link from 'next/link'
import { Cookie, X } from 'lucide-react'

const STORAGE_KEY = 'plotmarket-cookie-consent'

// localStorage is an external store, so it is read through
// useSyncExternalStore rather than an effect that calls setState. Reading it in
// an effect would trigger a cascading render on every mount.
let listeners: Array<() => void> = []

function subscribe(onStoreChange: () => void) {
  listeners.push(onStoreChange)
  return () => {
    listeners = listeners.filter((l) => l !== onStoreChange)
  }
}

function getSnapshot() {
  return localStorage.getItem(STORAGE_KEY)
}

// Nothing is rendered on the server, the banner appears once the client has
// read the real value. This keeps the markup stable through hydration.
function getServerSnapshot(): string | null {
  return 'accepted'
}

export function CookieConsent() {
  const consent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, 'accepted')
    listeners.forEach((l) => l())
  }

  if (consent) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="mx-auto max-w-3xl rounded-xl border border-brand-cream-300 bg-white px-5 py-4 shadow-lg">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-brand-gold-500" />
            <p className="text-sm text-gray-600">
              We use cookies to improve your experience. By continuing to use Plotmarket, you agree to our{' '}
              <Link href="/cookies" className="font-medium text-brand-green-600 hover:underline">
                Cookie Policy
              </Link>.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleAccept}
              className="btn btn-primary text-xs px-4 py-2"
            >
              Accept
            </button>
            <button
              onClick={handleAccept}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-brand-cream-100 hover:text-gray-600 transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
