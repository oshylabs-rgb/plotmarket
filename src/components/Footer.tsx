import { Logo } from './Logo'
import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-brand-cream-300 bg-brand-green-800">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <Logo light />
            <p className="mt-3 text-sm text-brand-green-200">
              Nigeria&apos;s premier property listing platform. Find your dream property across all 36 states.
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
            <h4 className="font-semibold text-white">Company</h4>
            <ul className="mt-3 space-y-2">
              <li><span className="text-sm text-brand-green-200">About Us</span></li>
              <li><span className="text-sm text-brand-green-200">Contact</span></li>
              <li><span className="text-sm text-brand-green-200">Careers</span></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white">Legal</h4>
            <ul className="mt-3 space-y-2">
              <li><span className="text-sm text-brand-green-200">Terms of Service</span></li>
              <li><span className="text-sm text-brand-green-200">Privacy Policy</span></li>
              <li><span className="text-sm text-brand-green-200">Cookie Policy</span></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-brand-green-700 pt-6 sm:flex-row">
          <p className="text-xs text-brand-green-300">
            © 2026 Plotmarket. All rights reserved.
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
