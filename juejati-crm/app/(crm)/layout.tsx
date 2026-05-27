import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signOut } from '@/lib/auth'

export default async function CRMLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top nav */}
      <header className="h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-4 shrink-0 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-900">Juejati</span>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">CRM</span>
        </div>
        <nav className="flex items-center gap-1 ml-4">
          <Link href="/" className="text-sm px-3 py-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors">
            Inbox
          </Link>
          <Link href="/propiedades" className="text-sm px-3 py-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors">
            Propiedades
          </Link>
          <Link href="/agenda" className="text-sm px-3 py-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors">
            Agenda
          </Link>
          <Link href="/social" className="text-sm px-3 py-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors">
            Social
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-gray-500">{session.user?.name}</span>
          <form action={async () => { 'use server'; await signOut({ redirectTo: '/login' }) }}>
            <button type="submit" className="text-xs text-gray-400 hover:text-gray-600">
              Salir
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
}
