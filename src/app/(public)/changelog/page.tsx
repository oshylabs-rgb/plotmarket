import type { Metadata } from 'next'
import { APP_VERSION, CHANGELOG } from '@/constants/changelog'

export const metadata: Metadata = {
  title: 'Changelog',
  description: 'What has shipped on Plotmarket, and when.',
}

export default function ChangelogPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-ink-900">Changelog</h1>
      <p className="mt-2 text-ink-500">
        Everything we ship, dated. Currently on v{APP_VERSION}.
      </p>

      <div className="mt-10 space-y-10">
        {CHANGELOG.map((release) => (
          <section key={release.version}>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="text-xl font-semibold text-ink-900">v{release.version}</h2>
              <time dateTime={release.date} className="tabular text-sm text-ink-400">
                {new Date(release.date).toLocaleDateString('en-NG', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </time>
            </div>
            <ul className="mt-4 space-y-2 border-l border-brand-cream-300 pl-5">
              {release.changes.map((change) => (
                <li key={change} className="text-sm leading-relaxed text-ink-600">
                  {change}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
