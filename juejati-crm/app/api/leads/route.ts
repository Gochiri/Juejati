import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { fetchLeads } from '@/lib/ghl'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || undefined
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

  try {
    const result = await fetchLeads({ q, page, limit })
    return NextResponse.json(result)
  } catch (err: any) {
    console.error('[GET /api/leads]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
