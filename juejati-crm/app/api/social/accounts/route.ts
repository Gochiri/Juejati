import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { fetchSocialAccounts } from '@/lib/ghl'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const accounts = await fetchSocialAccounts()
    return NextResponse.json({ accounts })
  } catch (err: any) {
    console.error('[GET /api/social/accounts]', err)
    return NextResponse.json({ error: 'Error al cargar cuentas sociales' }, { status: 500 })
  }
}
