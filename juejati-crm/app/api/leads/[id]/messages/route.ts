import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { fetchConversationMessages, sendMessage } from '@/lib/ghl'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

  try {
    const messages = await fetchConversationMessages(id, limit)
    return NextResponse.json({ messages })
  } catch (err: any) {
    console.error('[GET /api/leads/:id/messages]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const text = (body.text || '').trim()
  if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 })

  try {
    await sendMessage(id, text)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[POST /api/leads/:id/messages]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
