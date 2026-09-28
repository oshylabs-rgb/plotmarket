'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Sends one cookieless page view to /api/visit per page. The external
 * referrer is sent with the first page only; later navigations are internal.
 */
export function VisitBeacon() {
  const pathname = usePathname()
  const firstView = useRef(true)

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    const body = JSON.stringify({
      path: pathname,
      referrer: firstView.current ? document.referrer : '',
      search: window.location.search,
    })
    firstView.current = false
    try {
      const sent = navigator.sendBeacon?.('/api/visit', new Blob([body], { type: 'text/plain' }))
      if (!sent) fetch('/api/visit', { method: 'POST', body, keepalive: true }).catch(() => {})
    } catch {
      // Counting a visit is never worth an error in the page.
    }
  }, [pathname])

  return null
}
