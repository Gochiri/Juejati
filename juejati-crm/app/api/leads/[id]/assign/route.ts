import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { updateContactFields } from '@/lib/ghl'
import { GHL_FIELD_IDS } from '@/lib/ghl-fields'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { tokko_id, titulo, precio, moneda, link, ubicacion } = body
  if (!tokko_id) return NextResponse.json({ error: 'tokko_id required' }, { status: 400 })

  const precioStr = precio
    ? `${moneda || 'USD'} ${Number(precio).toLocaleString('es-AR')}`
    : ''

  try {
    await updateContactFields(id, [
      { id: GHL_FIELD_IDS.propiedad_tokko_id, field_value: String(tokko_id) },
      { id: GHL_FIELD_IDS.titulo_propiedad, field_value: titulo || '' },
      { id: GHL_FIELD_IDS.propiedad_de_interes, field_value: titulo || '' },
      { id: GHL_FIELD_IDS.precio_propiedad, field_value: precioStr },
      { id: GHL_FIELD_IDS.ubicacion_propiedad, field_value: ubicacion || '' },
      { id: GHL_FIELD_IDS.link_propiedad, field_value: link || '' },
    ])
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[POST /api/leads/:id/assign]', err)
    return NextResponse.json({ error: 'No se pudo asignar la propiedad' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    await updateContactFields(id, [
      { id: GHL_FIELD_IDS.propiedad_tokko_id, field_value: '' },
      { id: GHL_FIELD_IDS.titulo_propiedad, field_value: '' },
      { id: GHL_FIELD_IDS.propiedad_de_interes, field_value: '' },
      { id: GHL_FIELD_IDS.precio_propiedad, field_value: '' },
      { id: GHL_FIELD_IDS.ubicacion_propiedad, field_value: '' },
      { id: GHL_FIELD_IDS.link_propiedad, field_value: '' },
    ])
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[DELETE /api/leads/:id/assign]', err)
    return NextResponse.json({ error: 'No se pudo quitar la propiedad' }, { status: 500 })
  }
}
