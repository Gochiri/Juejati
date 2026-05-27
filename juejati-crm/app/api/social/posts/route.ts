import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { fetchSocialPosts, createSocialPost } from '@/lib/ghl'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const posts = await fetchSocialPosts()
    return NextResponse.json({ posts })
  } catch (err: any) {
    console.error('[GET /api/social/posts]', err)
    return NextResponse.json({ error: 'Error al cargar posts' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { accountIds, summary, scheduleDate, mediaUrl } = body
  if (!Array.isArray(accountIds) || accountIds.length === 0 || !summary || !scheduleDate) {
    return NextResponse.json(
      { error: 'accountIds, summary y scheduleDate son requeridos' },
      { status: 400 }
    )
  }

  try {
    const post = await createSocialPost({ accountIds, summary, scheduleDate, mediaUrl })
    return NextResponse.json({ success: true, id: post.id })
  } catch (err: any) {
    console.error('[POST /api/social/posts]', err)
    return NextResponse.json({ error: 'No se pudo crear el post' }, { status: 500 })
  }
}
