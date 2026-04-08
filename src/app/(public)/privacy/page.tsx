import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy - Plotmarket',
  description: 'Plotmarket privacy policy. Learn how we collect, use, and protect your personal data in compliance with the Nigeria Data Protection Act 2023.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
      <p className="mt-2 text-sm text-gray-500">Effective Date: 1 January 2026 | Last Updated: 8 April 2026</p>

      <div className="mt-10 space-y-10 text-gray-700 leading-relaxed">
        {/* 1. Who We Are */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900">1. Who We Are</h2>
          <p className="mt-3">
            Plotmarket (<Link href="/" className="text-brand-green-600 hover:underline">plotmarket.ng</Link>) is a property listing platform operated by <strong>Oshylabs Ltd</strong> (Company No. 16883720). We enable individuals, real estate agents, and property developers to list, discover, and inquire about properties across Nigeria.
          </p>
          <p className="mt-2">
            For the purposes of the Nigeria Data Protection Act 2023 (&ldquo;NDPA&rdquo;) and the Nigeria Data Protection Regulation (&ldquo;NDPR&rdquo;), Oshylabs Ltd is the data controller responsible for your personal data.
          </p>
        </section>

        {/* 2. Data We Collect */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900">2. What Data We Collect</h2>
          <p className="mt-3">We collect the following categories of personal data:</p>
          <div className="mt-4 space-y-4">
            <div>
              <h3 className="font-semibold text-gray-800">Account Information</h3>
              <p className="mt-1">Full name, email address, phone number, password (hashed), user type (individual, agent, or developer).</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Business Information</h3>
              <p className="mt-1">Company or agency name and CAC registration number (for agents and developers).</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Property Listing Data</h3>
              <p className="mt-1">Property details you submit including title, description, type, price, location, features, and specifications.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Media Files</h3>
              <p className="mt-1">Images and videos uploaded in connection with property listings.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Payment Information</h3>
              <p className="mt-1">Payment-related data processed through our payment provider, Paystack. We do not store your full card details on our servers. Paystack handles payment processing in accordance with PCI DSS standards.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Communication Data</h3>
              <p className="mt-1">Messages sent through the property inquiry system between users.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Usage and Technical Data</h3>
              <p className="mt-1">Browser type, device information, IP address, pages visited, and interaction patterns collected automatically when you use the platform.</p>
            </div>
          </div>
        </section>

        {/* 3. How We Use Your Data */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900">3. How We Use Your Data</h2>
          <p className="mt-3">We process your personal data for the following purposes:</p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li><strong>Account Management:</strong> Creating and maintaining your user account, authenticating your identity, and managing your profile settings.</li>
            <li><strong>Property Listings:</strong> Displaying your property listings to other users, enabling search and discovery of properties.</li>
            <li><strong>Payments and Subscriptions:</strong> Processing subscription payments, managing billing cycles, and sending payment confirmations.</li>
            <li><strong>Communication:</strong> Facilitating property inquiries between users, sending transactional emails (account verification, password resets), and important platform notifications.</li>
            <li><strong>Platform Improvement:</strong> Analysing usage patterns to improve features, fix bugs, and enhance user experience.</li>
            <li><strong>Legal Compliance:</strong> Meeting our obligations under Nigerian law including NDPA, anti-money laundering regulations, and responding to lawful requests from authorities.</li>
            <li><strong>Safety and Security:</strong> Detecting and preventing fraud, abuse, and unauthorised access to the platform.</li>
          </ul>
        </section>

        {/* 4. Legal Basis */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900">4. Legal Basis for Processing</h2>
          <p className="mt-3">Under the NDPA 2023, we rely on the following legal bases:</p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li><strong>Consent:</strong> Where you have given clear consent for us to process your personal data for specific purposes, such as creating an account or receiving communications.</li>
            <li><strong>Contractual Necessity:</strong> Processing necessary to perform our contract with you, including providing the listing platform, managing subscriptions, and facilitating property inquiries.</li>
            <li><strong>Legitimate Interest:</strong> Processing necessary for our legitimate business interests, such as improving the platform, ensuring security, and preventing fraud, provided these interests do not override your fundamental rights.</li>
            <li><strong>Legal Obligation:</strong> Processing necessary to comply with Nigerian legal requirements, including tax regulations and responses to lawful government requests.</li>
          </ul>
        </section>

        {/* 5. Data Sharing */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900">5. Who We Share Your Data With</h2>
          <p className="mt-3">We do not sell your personal data. We share your data only with the following categories of recipients, as necessary to operate the platform:</p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li><strong>Supabase:</strong> Our database and authentication provider. Supabase stores your account data, profile information, property listings, and media files securely.</li>
            <li><strong>Paystack:</strong> Our payment processor. Paystack handles all payment transactions for subscription plans. Paystack is PCI DSS compliant and governed by Nigerian financial regulations.</li>
            <li><strong>Vercel:</strong> Our hosting provider. Vercel serves the Plotmarket web application and may process technical data (IP addresses, request logs) as part of delivering the service.</li>
            <li><strong>Other Users:</strong> When you list a property, certain information (name, phone number, email, company name) is visible to users who view your listings or send inquiries.</li>
            <li><strong>Law Enforcement:</strong> We may disclose data if required by Nigerian law, court order, or a valid request from a government authority.</li>
          </ul>
        </section>

        {/* 6. Data Subject Rights */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900">6. Your Rights Under the NDPA</h2>
          <p className="mt-3">As a data subject under the Nigeria Data Protection Act 2023, you have the following rights:</p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li><strong>Right of Access:</strong> You may request a copy of the personal data we hold about you.</li>
            <li><strong>Right to Rectification:</strong> You may request correction of inaccurate or incomplete personal data.</li>
            <li><strong>Right to Erasure:</strong> You may request deletion of your personal data, subject to legal retention requirements.</li>
            <li><strong>Right to Restriction:</strong> You may request that we restrict the processing of your data in certain circumstances.</li>
            <li><strong>Right to Data Portability:</strong> You may request a machine-readable copy of the personal data you provided to us.</li>
            <li><strong>Right to Object:</strong> You may object to the processing of your personal data where we rely on legitimate interest as a legal basis.</li>
            <li><strong>Right to Withdraw Consent:</strong> Where processing is based on consent, you may withdraw your consent at any time without affecting the lawfulness of processing carried out before withdrawal.</li>
          </ul>
          <p className="mt-3">
            To exercise any of these rights, please contact us at{' '}
            <a href="mailto:arnold.oshenye@oshylabs.eu" className="text-brand-green-600 hover:underline">arnold.oshenye@oshylabs.eu</a>.
            We will respond to your request within 30 days.
          </p>
        </section>

        {/* 7. Data Security */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900">7. Data Security</h2>
          <p className="mt-3">
            We implement appropriate technical and organisational measures to protect your personal data against unauthorised access, alteration, disclosure, or destruction. These measures include:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>Encryption of data in transit using TLS/SSL</li>
            <li>Secure password hashing (passwords are never stored in plain text)</li>
            <li>Row-level security policies on database tables</li>
            <li>Access controls limiting data access to authorised personnel</li>
            <li>Secure authentication via Supabase Auth with email verification</li>
            <li>Regular security reviews of our infrastructure and dependencies</li>
          </ul>
          <p className="mt-3">
            While we take reasonable steps to protect your data, no method of transmission or storage is 100% secure. We cannot guarantee absolute security.
          </p>
        </section>

        {/* 8. Cookies */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900">8. Cookies and Tracking</h2>
          <p className="mt-3">
            We use essential cookies to manage authentication and maintain your session. These cookies are strictly necessary for the platform to function and cannot be disabled.
          </p>
          <p className="mt-2">
            For more details on how we use cookies, please see our{' '}
            <Link href="/cookies" className="text-brand-green-600 hover:underline">Cookie Policy</Link>.
          </p>
        </section>

        {/* 9. Data Retention */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900">9. Data Retention</h2>
          <p className="mt-3">We retain your personal data for the following periods:</p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li><strong>Account Data:</strong> Retained for the duration of your account and for up to 12 months after account deletion to handle any disputes or legal claims.</li>
            <li><strong>Property Listings:</strong> Retained for the duration of the listing. Deleted listings are removed within 30 days.</li>
            <li><strong>Media Files:</strong> Retained for the duration of the associated listing. Removed when the listing is deleted.</li>
            <li><strong>Payment Records:</strong> Retained for 6 years to comply with Nigerian tax and financial regulations.</li>
            <li><strong>Communication Data:</strong> Inquiry messages are retained for up to 24 months.</li>
            <li><strong>Usage Data:</strong> Aggregated and anonymised data may be retained indefinitely for analytical purposes.</li>
          </ul>
        </section>

        {/* 10. Cross-Border Transfers */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900">10. Cross-Border Data Transfers</h2>
          <p className="mt-3">
            Some of our service providers (Supabase and Vercel) may store or process your data on servers located outside Nigeria. Where your data is transferred outside Nigeria, we ensure that adequate safeguards are in place in accordance with the NDPA 2023, including:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>Transfers to jurisdictions with adequate data protection standards</li>
            <li>Contractual clauses requiring service providers to protect your data to standards equivalent to Nigerian law</li>
            <li>Use of service providers with robust security certifications (SOC 2, ISO 27001, PCI DSS)</li>
          </ul>
        </section>

        {/* 11. Children's Privacy */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900">11. Children&apos;s Privacy</h2>
          <p className="mt-3">
            Plotmarket is not directed at individuals under the age of 18. We do not knowingly collect personal data from children. If you are under 18, you may not create an account or use the platform. If we become aware that we have collected data from a child under 18, we will take steps to delete that information promptly.
          </p>
        </section>

        {/* 12. Contact */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900">12. How to Contact Us</h2>
          <p className="mt-3">
            If you have any questions about this Privacy Policy, wish to exercise your data subject rights, or have concerns about how we handle your data, please contact us:
          </p>
          <div className="mt-4 rounded-lg border border-brand-cream-300 bg-brand-cream-50 p-4">
            <p className="font-semibold text-gray-900">Oshylabs Ltd</p>
            <p className="mt-1 text-sm">Company No. 16883720</p>
            <p className="mt-2 text-sm">
              Email:{' '}
              <a href="mailto:arnold.oshenye@oshylabs.eu" className="text-brand-green-600 hover:underline">
                arnold.oshenye@oshylabs.eu
              </a>
            </p>
          </div>
        </section>

        {/* 13. Complaints */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900">13. Right to Complain</h2>
          <p className="mt-3">
            If you believe that your data protection rights have been violated, you have the right to lodge a complaint with the <strong>Nigeria Data Protection Commission (NDPC)</strong>, the supervisory authority established under the NDPA 2023.
          </p>
          <p className="mt-2">
            We encourage you to contact us first at{' '}
            <a href="mailto:arnold.oshenye@oshylabs.eu" className="text-brand-green-600 hover:underline">arnold.oshenye@oshylabs.eu</a>{' '}
            so we can attempt to resolve your concern directly.
          </p>
        </section>

        {/* 14. Updates */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900">14. Updates to This Policy</h2>
          <p className="mt-3">
            We may update this Privacy Policy from time to time to reflect changes in our practices, legal requirements, or platform features. When we make material changes, we will notify you by posting a notice on the platform or sending an email to your registered address. Your continued use of Plotmarket after changes are posted constitutes acceptance of the updated policy.
          </p>
        </section>
      </div>
    </div>
  )
}
