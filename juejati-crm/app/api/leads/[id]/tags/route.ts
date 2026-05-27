import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { addContactTag, removeContactTag } from '@/lib/ghl'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const tag = (body.tag || '').trim()
  if (!tag) return NextResponse.json({ error: 'tag required' }, { status: 400 })

  try {
    await addContactTag(id, tag)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[POST /api/leads/:id/tags]', err)
    return NextResponse.json({ error: 'No se pudo agregar el tag' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { searchParams } = new URL(req.url)
  const tag = (searchParams.get('tag') || '').trim()
  if (!tag) return NextResponse.json({ error: 'tag required' }, { status: 400 })

  try {
    await removeContactTag(id, tag)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[DELETE /api/leads/:id/tags]', err)
    return NextResponse.json({ error: 'No se pudo quitar el tag' }, { status: 500 })
  }
}
