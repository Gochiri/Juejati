import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { fetchContact, addContactTag, removeContactTag } from '@/lib/ghl'

const SOFIA_TAG = 'sofia_activa'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  try {
    const contact = await fetchContact(id)
    const tags: string[] = contact.tags || []
    const isActive = tags.includes(SOFIA_TAG)
    if (isActive) await removeContactTag(id, SOFIA_TAG)
    else await addContactTag(id, SOFIA_TAG)
    return NextResponse.json({ active: !isActive })
  } catch (err: any) {
    console.error('[POST /api/leads/:id/ai-toggle]', err)
    return NextResponse.json({ error: 'No se pudo cambiar el estado de Sofía' }, { status: 500 })
  }
}
