'use client'
import { Badge } from '@/components/ui/badge'
import { Calendar, Instagram, Facebook, Globe } from 'lucide-react'
import type { GHLSocialPost, GHLSocialAccount } from '@/lib/ghl'

interface Props {
  posts: GHLSocialPost[]
  accounts: GHLSocialAccount[]
  loading: boolean
}

const STATUS_VARIANT: Record<string, 'green' | 'blue' | 'yellow' | 'red' | 'default'> = {
  scheduled: 'blue',
  published: 'green',
  failed: 'red',
  draft: 'yellow',
}

const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Programado',
  published: 'Publicado',
  failed: 'Falló',
  draft: 'Borrador',
}

function platformIcon(platform: string) {
  const p = platform.toLowerCase()
  if (p.includes('instagram')) return <Instagram className="w-4 h-4" />
  if (p.includes('facebook')) return <Facebook className="w-4 h-4" />
  return <Globe className="w-4 h-4" />
}

export function SocialPostList({ posts, accounts, loading }: Props) {
  if (loading) {
    return <p className="text-sm text-gray-400 text-center py-8">Cargando posts...</p>
  }
  if (posts.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-8">Sin posts. Creá el primero arriba.</p>
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => {
        const date = post.scheduledTime || post.publishedTime
        const dateStr = date
          ? new Date(date).toLocaleString('es-AR', {
              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
            })
          : '—'
        const postAccounts = accounts.filter((a) => post.accountIds.includes(a.id))
        const variant = STATUS_VARIANT[post.status] || 'default'

        return (
          <div key={post.id} className="bg-white rounded-xl border border-gray-200 p-4 flex gap-4">
            {post.mediaUrls[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.mediaUrls[0]} alt="" className="w-24 h-24 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                <span className="text-3xl">📷</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-sm text-gray-900 line-clamp-2">{post.summary || 'Sin texto'}</p>
                <Badge variant={variant}>{STATUS_LABEL[post.status] || post.status}</Badge>
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {dateStr}
                </div>
                <div className="flex items-center gap-1.5">
                  {postAccounts.map((acc) => (
                    <span key={acc.id} className="flex items-center gap-1" title={acc.name}>
                      {platformIcon(acc.platform)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
