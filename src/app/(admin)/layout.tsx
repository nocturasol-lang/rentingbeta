import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/server/auth'
import { AdminSidebar } from '@/components/admin/sidebar'

export const metadata: Metadata = {
  title: "Admin · Georgia's Cozy Rooms",
  robots: 'noindex, nofollow',
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/admin/login')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  )
}
