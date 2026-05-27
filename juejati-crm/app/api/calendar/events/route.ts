import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { fetchAppointments, createAppointment } from '@/lib/ghl'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const startTime = searchParams.get('startTime')
  const endTime = searchParams.get('endTime')
  const calendarId = searchParams.get('calendarId') || undefined

  if (!startTime || !endTime) {
    return NextResponse.json({ error: 'startTime and endTime required' }, { status: 400 })
  }

  try {
    const events = await fetchAppointments({ startTime, endTime, calendarId })
    return NextResponse.json({ events })
  } catch (err: any) {
    console.error('[GET /api/calendar/events]', err)
    return NextResponse.json({ error: 'Error al cargar citas' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { calendarId, contactId, startTime, endTime, title, notes, address } = body

  if (!calendarId || !contactId || !startTime || !endTime || !title) {
    return NextResponse.json(
      { error: 'calendarId, contactId, startTime, endTime y title son requeridos' },
      { status: 400 }
    )
  }

  try {
    const appointment = await createAppointment({
      calendarId,
      contactId,
      startTime,
      endTime,
      title,
      notes,
      address,
    })
    return NextResponse.json({ success: true, id: appointment.id })
  } catch (err: any) {
    console.error('[POST /api/calendar/events]', err)
    return NextResponse.json({ error: 'No se pudo crear la cita' }, { status: 500 })
  }
}
