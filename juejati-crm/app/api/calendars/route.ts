import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { fetchCalendars } from '@/lib/ghl'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const calendars = await fetchCalendars()
    return NextResponse.json({ calendars: calendars.filter((c) => c.isActive) })
  } catch (err: any) {
    console.error('[GET /api/calendars]', err)
    return NextResponse.json({ error: 'Error al cargar calendarios' }, { status: 500 })
  }
}
