import { Logo } from './Logo'
import Link from 'next/link'
import { Mail } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-brand-cream-300 bg-brand-green-800">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-5">
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
                  className="flex items-center gap-1.5 text-sm text-brand-green-200 hover:text-brand-gold-400 transition-colors"
                >
                  <Mail className="h-3.5 w-3.5" />
                  arnold.oshenye@oshylabs.eu
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-brand-green-700 pt-6 sm:flex-row">
          <p className="text-xs text-brand-green-300">
            &copy; 2026 Oshylabs Ltd (Company No. 16883720). All rights reserved.
          </p>
          <a
            href="https://www.perplexity.ai/computer"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-brand-green-400 hover:text-brand-gold-400 transition-colors"
          >
            Created with Perplexity Computer
          </a>
        </div>
      </div>
    </footer>
  )
}
