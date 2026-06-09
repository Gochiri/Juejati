import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { fetchPipelines } from '@/lib/ghl'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const pipelines = await fetchPipelines()
    return NextResponse.json({ pipelines })
  } catch (err: any) {
    console.error('[GET /api/pipelines]', err)
    return NextResponse.json({ error: 'Error al cargar pipelines' }, { status: 500 })
  }
}
