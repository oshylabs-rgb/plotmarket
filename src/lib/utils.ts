export function formatNaira(amount: number): string {
  return '₦' + amount.toLocaleString('en-NG')
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function getPropertyGradient(type: string): string {
  switch (type) {
    case 'house':
      return 'from-brand-green-600 to-brand-green-400'
    case 'apartment':
      return 'from-purple-600 to-purple-400'
    case 'land':
      return 'from-amber-600 to-amber-400'
    case 'commercial':
      return 'from-blue-600 to-blue-400'
    case 'development':
      return 'from-rose-600 to-rose-400'
    default:
      return 'from-brand-green-600 to-brand-green-400'
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-800'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'rejected':
      return 'bg-red-100 text-red-800'
    case 'sold':
      return 'bg-blue-100 text-blue-800'
    case 'active':
      return 'bg-green-100 text-green-800'
    case 'expired':
      return 'bg-gray-100 text-gray-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    case 'unread':
      return 'bg-blue-100 text-blue-800'
    case 'read':
      return 'bg-gray-100 text-gray-800'
    case 'replied':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}
