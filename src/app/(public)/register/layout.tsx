import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'List a property free',
  description:
    'Create a Plotmarket account and list up to three properties free. State your title document, add photos or a 360 tour, and buyers who want to see the paper first reach you directly.',
  alternates: { canonical: 'https://plotmarket.ng/register' },
  robots: { index: true, follow: true },
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children
}
