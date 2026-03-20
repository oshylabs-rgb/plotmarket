import Link from 'next/link'

export function Logo({ className = '', light = false }: { className?: string; light?: boolean }) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Plotmarket"
      >
        <rect width="32" height="32" rx="6" fill="#14613a" />
        <path
          d="M8 22V12L16 7L24 12V22L16 27L8 22Z"
          stroke="#f0c435"
          strokeWidth="1.5"
          fill="none"
        />
        <path d="M16 7V27" stroke="#f0c435" strokeWidth="1.5" />
        <path d="M8 12L24 22" stroke="#f0c435" strokeWidth="1" opacity="0.5" />
        <path d="M24 12L8 22" stroke="#f0c435" strokeWidth="1" opacity="0.5" />
        <circle cx="16" cy="16" r="2.5" fill="#f0c435" />
      </svg>
      <span
        className={`text-xl font-bold tracking-tight ${
          light ? 'text-white' : 'text-brand-green-800'
        }`}
      >
        Plot<span className={light ? 'text-brand-gold-400' : 'text-brand-gold-500'}>market</span>
      </span>
    </Link>
  )
}
