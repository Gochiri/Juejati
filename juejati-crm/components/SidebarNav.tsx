'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { MessageSquare, Building2, Calendar, Sparkles, KanbanSquare, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from './ThemeToggle'

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
    <aside className="w-52 bg-surface border-r border-border flex flex-col h-full shrink-0">
      <div className="px-4 h-14 flex items-center gap-2 border-b border-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/propify.png" alt="Propify" className="h-8 w-auto select-none" />
        <span className="font-display font-semibold text-fg text-lg tracking-tight">propify</span>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-1.5 rounded text-sm transition-colors relative',
                active
                  ? 'text-fg bg-surface-2 font-medium'
                  : 'text-fg-muted hover:text-fg hover:bg-surface-2/60'
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-brand" />
              )}
              <Icon className={cn('w-4 h-4 shrink-0', active && 'text-brand')} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border p-2 space-y-1">
        {userName && (
          <div className="px-2.5 py-1.5 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-brand/15 text-brand text-xs font-medium flex items-center justify-center font-mono shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-fg-muted truncate flex-1">{userName}</span>
            <ThemeToggle />
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-sm text-fg-muted hover:text-fg hover:bg-surface-2/60 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}
