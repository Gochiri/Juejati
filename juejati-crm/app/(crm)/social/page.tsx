'use client'
import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SocialPostList } from '@/components/social/SocialPostList'
import { CreatePostModal } from '@/components/social/CreatePostModal'
import type { GHLSocialPost, GHLSocialAccount } from '@/lib/ghl'

export default function SocialPage() {
  const [posts, setPosts] = useState<GHLSocialPost[]>([])
  const [accounts, setAccounts] = useState<GHLSocialAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [createOpen, setCreateOpen] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [postsRes, accountsRes] = await Promise.all([
        fetch('/api/social/posts'),
        fetch('/api/social/accounts'),
      ])
      if (!postsRes.ok) throw new Error((await postsRes.json()).error || 'Error al cargar posts')
      const postsData = await postsRes.json()
      setPosts(postsData.posts || [])
      if (accountsRes.ok) {
        const accountsData = await accountsRes.json()
        setAccounts(accountsData.accounts || [])
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shrink-0">
        <div>
          <h1 className="font-bold text-lg">Social Planner</h1>
          <p className="text-xs text-gray-400">Programá posts de propiedades en Instagram y Facebook</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Nuevo post
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
        <SocialPostList posts={posts} accounts={accounts} loading={loading} />
      </div>

      {createOpen && (
        <CreatePostModal
          onClose={() => setCreateOpen(false)}
          onCreated={load}
        />
      )}
    </div>
  )
}
