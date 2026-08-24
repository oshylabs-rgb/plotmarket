export function formatNaira(amount: number): string {
  return '₦' + amount.toLocaleString('en-NG')
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

/**
 * Placeholder surface for a listing with no photo. Deliberately a flat tinted
 * panel rather than a colour gradient: gradient placeholders are the single
 * clearest tell of a generated UI, and a rainbow of category colours makes a
 * property index look like a toy.
 */
export function getPropertyGradient(type: string): string {
  switch (type) {
    case 'land':
      return 'bg-brand-cream-200'
    case 'commercial':
      return 'bg-ink-100'
    case 'development':
      return 'bg-brand-green-50'
    default:
      return 'bg-brand-cream-100'
  }
}

/** Muted status chips. Only rejected/cancelled carry real colour. */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'approved':
    case 'active':
    case 'replied':
      return 'bg-brand-green-50 text-brand-green-700 border border-brand-green-200'
    case 'pending':
    case 'unread':
      return 'bg-brand-gold-50 text-brand-gold-700 border border-brand-gold-200'
    case 'rejected':
    case 'cancelled':
      return 'bg-danger-50 text-danger-700 border border-danger-600/20'
    case 'sold':
      return 'bg-ink-900 text-white border border-ink-900'
    default:
      return 'bg-brand-cream-100 text-ink-600 border border-brand-cream-400'
  }
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}
