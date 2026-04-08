import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service - Plotmarket',
  description: 'Plotmarket terms of service. Read our terms and conditions governing the use of the Plotmarket property listing platform.',
}

export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
      <p className="mt-2 text-sm text-gray-500">Effective Date: 1 January 2026 | Last Updated: 8 April 2026</p>

      <div className="mt-10 space-y-10 text-gray-700 leading-relaxed">
        {/* 1. Acceptance */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900">1. Acceptance of Terms</h2>
          <p className="mt-3">
            By accessing or using Plotmarket (<Link href="/" className="text-brand-green-600 hover:underline">plotmarket.ng</Link>), operated by <strong>Oshylabs Ltd</strong> (Company No. 16883720), you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you do not agree to these Terms, you must not use the platform.
          </p>
          <p className="mt-2">
            These Terms constitute a legally binding agreement between you and Oshylabs Ltd. They apply to all users, including individuals, real estate agents, and property developers.
          </p>
        </section>

        {/* 2. Eligibility */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900">2. Eligibility</h2>
          <p className="mt-3">To use Plotmarket, you must:</p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>Be at least 18 years of age</li>
            <li>Be a Nigerian resident, or an individual or entity operating in Nigeria&apos;s property market</li>
            <li>Have the legal capacity to enter into binding contracts under Nigerian law</li>
            <li>Provide accurate and truthful information during registration</li>
          </ul>
        </section>

        {/* 3. Account Registration */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900">3. Account Registration and Security</h2>
          <p className="mt-3">When you register for an account, you agree to:</p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>Provide accurate, current, and complete registration information</li>
            <li>Maintain the security and confidentiality of your password</li>
            <li>Notify us immediately if you suspect unauthorised access to your account</li>
            <li>Accept responsibility for all activities that occur under your account</li>
          </ul>
          <p className="mt-2">
            We reserve the right to suspend or terminate accounts that contain false or misleading information.
          </p>
        </section>

        {/* 4. User Types */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900">4. User Types and Obligations</h2>

          <div className="mt-4 space-y-5">
            <div>
              <h3 className="font-semibold text-gray-800">4.1 Individuals</h3>
              <p className="mt-1">Users registered as individuals represent that they are listing properties they personally own or are authorised to list. Individuals must:</p>
              <ul className="mt-2 list-disc space-y-1 pl-6">
                <li>Provide accurate information about properties they list</li>
                <li>Have genuine ownership or written authorisation from the owner to list the property</li>
                <li>Ensure property descriptions, prices, and details are truthful and not misleading</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800">4.2 Real Estate Agents</h3>
              <p className="mt-1">Users registered as agents represent that they are engaged in the business of real estate brokerage. Agents must:</p>
              <ul className="mt-2 list-disc space-y-1 pl-6">
                <li>Hold valid registration or licensing where required by state regulations (e.g., LASRERA registration for agents operating in Lagos State)</li>
                <li>CAC registration is encouraged but optional for agent accounts</li>
                <li>Accurately represent client properties and have written authorisation from property owners</li>
                <li>Comply with applicable state and federal real estate regulations</li>
                <li>Clearly disclose their agency status to prospective buyers and tenants</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800">4.3 Property Developers</h3>
              <p className="mt-1">Users registered as developers represent that they are engaged in property development. Developers must:</p>
              <ul className="mt-2 list-disc space-y-1 pl-6">
                <li>Provide a valid CAC registration number (required for developer accounts)</li>
                <li>Comply with relevant building codes, planning permits, and zoning regulations</li>
                <li>Ensure that developments listed have the necessary approvals and permits</li>
                <li>Provide accurate information about development timelines, specifications, and pricing</li>
                <li>Comply with the Nigerian Urban and Regional Planning Act and applicable state building regulations</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 5. Property Listings */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900">5. Property Listing Rules</h2>
          <p className="mt-3">All users listing properties on Plotmarket agree to the following:</p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>All listing information must be accurate, truthful, and not misleading</li>
            <li>Property prices must reflect genuine asking prices and not be used to mislead buyers</li>
            <li>The listing user must have the legal right to list the property (as owner, authorised agent, or developer)</li>
            <li>Listings must not contain fraudulent, illegal, or deceptive information</li>
            <li>Duplicate listings for the same property are not permitted</li>
            <li>Listings that become unavailable (sold, rented, or withdrawn) should be removed promptly</li>
          </ul>
          <p className="mt-2">
            We reserve the right to remove any listing that violates these rules without prior notice.
          </p>
        </section>

        {/* 6. Media Upload */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900">6. Media Upload Rules</h2>
          <p className="mt-3">When uploading images and videos to the platform, you agree that:</p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>You own or have the right to use all media you upload</li>
            <li>Media must accurately represent the property being listed</li>
            <li>You will not upload copyrighted material without the copyright holder&apos;s permission</li>
            <li>Media must not contain inappropriate, offensive, or illegal content</li>
            <li>By uploading media, you grant Plotmarket a non-exclusive licence to display, reproduce, and distribute the media solely in connection with your listing on the platform</li>
          </ul>
        </section>

        {/* 7. Subscriptions and Payments */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900">7. Subscription Plans and Payments</h2>
          <p className="mt-3">Plotmarket offers subscription plans that determine the number of property listings you can maintain. By subscribing to a plan:</p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>You authorise Oshylabs Ltd to charge the applicable subscription fee through Paystack</li>
            <li>Subscriptions are billed according to the plan period you select</li>
            <li>Subscriptions may auto-renew at the end of each billing period unless cancelled</li>
            <li>You may cancel your subscription at any time through your dashboard; cancellation takes effect at the end of the current billing period</li>
            <li>Refunds are not provided for partial billing periods unless required by applicable Nigerian consumer protection law</li>
            <li>Prices may change with reasonable notice; continued use after a price change constitutes acceptance</li>
          </ul>
          <p className="mt-2">
            Payment processing is handled by Paystack in accordance with their terms of service and PCI DSS requirements.
          </p>
        </section>

        {/* 8. Intellectual Property */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900">8. Intellectual Property</h2>
          <p className="mt-3">
            The Plotmarket platform, including its design, code, features, and branding, is owned by Oshylabs Ltd and protected by intellectual property laws. You may not copy, modify, distribute, or reverse-engineer any part of the platform without our written consent.
          </p>
          <p className="mt-2">
            You retain ownership of the content you create and upload (property descriptions, images, videos). However, by posting content on Plotmarket, you grant us a non-exclusive, worldwide, royalty-free licence to display, distribute, and promote your content solely in connection with the operation of the platform.
          </p>
        </section>

        {/* 9. Disclaimer */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900">9. Disclaimer and Fair Use Notice</h2>
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="font-semibold text-amber-800">Important Notice</p>
            <p className="mt-2 text-sm text-amber-700">
              Plotmarket is a property listing platform that connects property sellers, buyers, agents, and developers. We are <strong>not a party to any property transaction</strong> conducted between users. Please read this section carefully.
            </p>
          </div>
          <ul className="mt-4 list-disc space-y-2 pl-6">
            <li><strong>Accuracy of Listings:</strong> Plotmarket does not guarantee the accuracy, completeness, or truthfulness of any property listing. All listing information is provided by the users who created them.</li>
            <li><strong>Due Diligence:</strong> Users are solely responsible for conducting their own due diligence before entering into any property transaction. This includes but is not limited to: title verification, survey plan confirmation, obtaining Governor&apos;s Consent (where applicable under the Land Use Act), verifying Certificate of Occupancy (C of O), and checking for encumbrances or disputes.</li>
            <li><strong>Legal Advice:</strong> We strongly recommend engaging qualified legal professionals (solicitors, surveyors, and estate valuers) before completing any property transaction.</li>
            <li><strong>Regulatory Compliance:</strong> Compliance with the Land Use Act, Governor&apos;s Consent requirements, local government zoning regulations, building codes, and planning permits is the sole responsibility of the transacting parties.</li>
            <li><strong>No Transaction Liability:</strong> Plotmarket and Oshylabs Ltd shall not be liable for any disputes, losses, damages, or claims arising from transactions between users, including but not limited to fraudulent listings, misrepresentation, title disputes, or failed transactions.</li>
            <li><strong>Third-Party Services:</strong> We are not responsible for the services, actions, or policies of third-party providers including Paystack and Supabase.</li>
          </ul>
        </section>

        {/* 10. Limitation of Liability */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900">10. Limitation of Liability</h2>
          <p className="mt-3">
            To the maximum extent permitted by Nigerian law:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>Plotmarket is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis without warranties of any kind, whether express or implied</li>
            <li>Oshylabs Ltd shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the platform</li>
            <li>Our total liability for any claim arising from or related to the platform shall not exceed the amount you have paid to us in subscription fees in the 12 months preceding the claim</li>
            <li>Nothing in these Terms excludes or limits liability that cannot be excluded or limited under the Federal Competition and Consumer Protection Act (FCCPA) or other applicable Nigerian law</li>
          </ul>
        </section>

        {/* 11. Dispute Resolution */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900">11. Dispute Resolution and Governing Law</h2>
          <p className="mt-3">
            These Terms are governed by and construed in accordance with the laws of the Federal Republic of Nigeria.
          </p>
          <p className="mt-2">
            Any dispute arising from or in connection with these Terms shall first be resolved through good-faith negotiation. If the parties cannot reach a resolution within 30 days, the dispute shall be submitted to the jurisdiction of the courts of Lagos State, Nigeria.
          </p>
        </section>

        {/* 12. Suspension and Termination */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900">12. Account Suspension and Termination</h2>
          <p className="mt-3">We may suspend or terminate your account, with or without notice, if:</p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>You violate these Terms of Service</li>
            <li>You provide false or misleading information</li>
            <li>You post fraudulent or illegal property listings</li>
            <li>You engage in activities that harm other users or the platform</li>
            <li>Required by law or a court order</li>
          </ul>
          <p className="mt-2">
            Upon termination, your right to use the platform ceases immediately. We may retain certain data as required by law or for legitimate business purposes.
          </p>
        </section>

        {/* 13. Modifications */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900">13. Modification of Terms</h2>
          <p className="mt-3">
            We reserve the right to modify these Terms at any time. Material changes will be communicated via the platform or email. Your continued use of Plotmarket after changes are posted constitutes your acceptance of the modified Terms. If you do not agree to the modified Terms, you must stop using the platform.
          </p>
        </section>

        {/* 14. Severability */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900">14. Severability</h2>
          <p className="mt-3">
            If any provision of these Terms is found to be invalid or unenforceable by a court of competent jurisdiction, the remaining provisions shall continue in full force and effect. The invalid provision shall be modified to the minimum extent necessary to make it valid and enforceable while preserving the original intent.
          </p>
        </section>

        {/* 15. Contact */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900">15. Contact Us</h2>
          <p className="mt-3">
            If you have any questions about these Terms of Service, please contact us:
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
      </div>
    </div>
  )
}
