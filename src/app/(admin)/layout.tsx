import { AdminSidebar } from '@/components/AdminSidebar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-brand-cream-50 md:h-screen md:overflow-hidden">
      <AdminSidebar />
      <main className="min-w-0 flex-1 md:overflow-y-auto">
        {/* pt-20 on mobile clears the floating menu button. */}
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-20 md:px-8 md:py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
