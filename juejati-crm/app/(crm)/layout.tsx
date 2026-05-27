import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SidebarNav } from '@/components/SidebarNav'

export default async function CRMLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      <SidebarNav userName={session.user?.name || ''} />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
}
