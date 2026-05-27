import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { updateOpportunityStage } from '@/lib/ghl'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }
  const stageId = body?.stageId

  if (!stageId || typeof stageId !== 'string') {
    return NextResponse.json({ error: 'stageId requerido' }, { status: 400 })
  }

  try {
    await updateOpportunityStage(id, stageId)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[PATCH /api/opportunities/:id/stage]', err)
    return NextResponse.json({ error: err.message || 'Error' }, { status: 500 })
  }
}
