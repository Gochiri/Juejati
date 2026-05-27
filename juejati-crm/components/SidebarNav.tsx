'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { MessageSquare, Building2, Calendar, Sparkles, KanbanSquare, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/', label: 'Inbox', icon: MessageSquare, exact: true },
  { href: '/pipeline', label: 'Pipeline', icon: KanbanSquare },
  { href: '/propiedades', label: 'Propiedades', icon: Building2 },
  { href: '/agenda', label: 'Agenda', icon: Calendar },
  { href: '/social', label: 'Social', icon: Sparkles },
]

interface Props {
  userName: string
}

export function SidebarNav({ userName }: Props) {
  const pathname = usePathname()

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col h-full shrink-0">
      <div className="px-4 py-4 border-b border-gray-100 flex items-center gap-2">
        <span className="font-bold text-gray-900 text-lg">Juejati</span>
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">CRM</span>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-gray-100 p-3 space-y-2">
        {userName && (
          <p className="text-xs text-gray-500 px-2 truncate">{userName}</p>
        )}
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}
