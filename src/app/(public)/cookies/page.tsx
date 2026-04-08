import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Cookie Policy - Plotmarket',
  description: 'Learn about how Plotmarket uses cookies to provide a secure and functional experience.',
}

export default function CookiePolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900">Cookie Policy</h1>
      <p className="mt-2 text-sm text-gray-500">Effective Date: 1 January 2026 | Last Updated: 8 April 2026</p>

      <div className="mt-10 space-y-10 text-gray-700 leading-relaxed">
        {/* 1. What Are Cookies */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900">1. What Are Cookies</h2>
          <p className="mt-3">
            Cookies are small text files that are stored on your device (computer, tablet, or mobile phone) when you visit a website. They are widely used to make websites work more efficiently and to provide information to the website operators.
          </p>
        </section>

        {/* 2. How We Use Cookies */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900">2. How We Use Cookies</h2>
          <p className="mt-3">Plotmarket uses a minimal number of cookies, primarily for essential platform functionality.</p>

          <div className="mt-4 space-y-4">
            <div className="rounded-lg border border-brand-cream-300 bg-white p-4">
              <h3 className="font-semibold text-gray-800">Essential Cookies</h3>
              <p className="mt-1 text-sm">
                These cookies are strictly necessary for the platform to function. They manage your authentication session (via Supabase Auth) and ensure you stay logged in as you navigate between pages. Without these cookies, you would not be able to use account features such as listing properties, managing your profile, or sending inquiries.
              </p>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-brand-cream-200 text-left">
                      <th className="pb-2 pr-4 font-semibold text-gray-800">Cookie</th>
                      <th className="pb-2 pr-4 font-semibold text-gray-800">Purpose</th>
                      <th className="pb-2 font-semibold text-gray-800">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-cream-100">
                    <tr>
                      <td className="py-2 pr-4 font-mono text-xs">sb-*-auth-token</td>
                      <td className="py-2 pr-4">Supabase authentication session</td>
                      <td className="py-2">Session / 1 hour</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-mono text-xs">plotmarket-cookie-consent</td>
                      <td className="py-2 pr-4">Remembers your cookie consent preference</td>
                      <td className="py-2">1 year</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-lg border border-brand-cream-300 bg-white p-4">
              <h3 className="font-semibold text-gray-800">Analytics Cookies</h3>
              <p className="mt-1 text-sm">
                We currently use minimal tracking on the platform. We do not use third-party analytics cookies such as Google Analytics. If we introduce analytics in the future, we will update this policy and obtain your consent where required.
              </p>
            </div>
          </div>
        </section>

        {/* 3. Managing Cookies */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900">3. Managing Cookies</h2>
          <p className="mt-3">
            You can manage or delete cookies through your browser settings. Most browsers allow you to:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>View what cookies are stored and delete them individually</li>
            <li>Block third-party cookies</li>
            <li>Block all cookies from specific sites</li>
            <li>Delete all cookies when you close your browser</li>
          </ul>
          <p className="mt-3">
            Please note that if you disable essential cookies, some features of Plotmarket may not work correctly. In particular, you will not be able to stay logged in or use any account-related features.
          </p>
        </section>

        {/* 4. Changes */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900">4. Changes to This Policy</h2>
          <p className="mt-3">
            We may update this Cookie Policy from time to time. Any changes will be reflected on this page with an updated &ldquo;Last Updated&rdquo; date.
          </p>
        </section>

        {/* 5. Contact */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900">5. Questions</h2>
          <p className="mt-3">
            If you have any questions about our use of cookies, please contact us at{' '}
            <a href="mailto:arnold.oshenye@oshylabs.eu" className="text-brand-green-600 hover:underline">
              arnold.oshenye@oshylabs.eu
            </a>.
          </p>
          <p className="mt-3">
            For more information about how we handle your personal data, please see our{' '}
            <Link href="/privacy" className="text-brand-green-600 hover:underline">Privacy Policy</Link>.
          </p>
        </section>
      </div>
    </div>
  )
}
