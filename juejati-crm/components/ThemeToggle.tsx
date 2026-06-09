'use client'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return <div className="w-8 h-8" />
  }

  const isDark = resolvedTheme === 'dark'
  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="w-8 h-8 rounded-md flex items-center justify-center text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors"
      aria-label={isDark ? 'Light mode' : 'Dark mode'}
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  )
}
