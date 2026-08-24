import { Logo } from './Logo'
import Link from 'next/link'
import { Mail } from 'lucide-react'
import { APP_VERSION } from '@/constants/changelog'

export function Footer() {
  return (
    <footer className="border-t border-brand-cream-300 bg-brand-green-800">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="md:col-span-2">
            <Logo light />
            <p className="mt-3 text-sm text-brand-green-200">
              Nigeria&apos;s premier property listing platform. Find your dream property across all 36 states.
            </p>
            <p className="mt-2 text-xs text-brand-green-300">
              Plotmarket is a product of Oshylabs Ltd
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white">Quick Links</h4>
            <ul className="mt-3 space-y-2">
              <li><Link href="/properties" className="text-sm text-brand-green-200 hover:text-brand-gold-400 transition-colors">Browse Properties</Link></li>
              <li><Link href="/pricing" className="text-sm text-brand-green-200 hover:text-brand-gold-400 transition-colors">Pricing Plans</Link></li>
              <li><Link href="/register" className="text-sm text-brand-green-200 hover:text-brand-gold-400 transition-colors">List Your Property</Link></li>
              <li><Link href="/changelog" className="text-sm text-brand-green-200 hover:text-brand-gold-400 transition-colors">Changelog</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white">Legal</h4>
            <ul className="mt-3 space-y-2">
              <li><Link href="/privacy" className="text-sm text-brand-green-200 hover:text-brand-gold-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm text-brand-green-200 hover:text-brand-gold-400 transition-colors">Terms of Service</Link></li>
              <li><Link href="/cookies" className="text-sm text-brand-green-200 hover:text-brand-gold-400 transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white">Support</h4>
            <ul className="mt-3 space-y-2">
              <li>
                <a
                  href="mailto:arnold.oshenye@oshylabs.eu"
                  className="flex items-start gap-1.5 text-sm text-brand-green-200 hover:text-brand-gold-400 transition-colors"
                >
                  <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span className="break-all">arnold.oshenye@oshylabs.eu</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-brand-green-700 pt-6 sm:flex-row">
          <p className="text-xs text-brand-green-300">
            &copy; 2026 Oshylabs Ltd (Company No. 16883720). All rights reserved.{' '}
            <Link href="/changelog" className="tabular hover:text-brand-gold-400">
              v{APP_VERSION}
            </Link>
          </p>
          <p className="max-w-md text-xs text-brand-green-300 sm:text-right">
            Listings are submitted by users. Plotmarket does not verify title documents. Always
            confirm at the state land registry before you pay.
          </p>
        </div>
      </div>
    </footer>
  )
}
