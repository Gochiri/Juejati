import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { fetchContact } from '@/lib/ghl'
import { extractFieldValue, GHL_FIELD_IDS } from '@/lib/ghl-fields'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  try {
    const contact = await fetchContact(id)
    const customFields: any[] = contact.customFields || []
    const get = (fid: string) => extractFieldValue(customFields, fid)

    return NextResponse.json({
      contactId: contact.id,
      name: [contact.firstName, contact.lastName].filter(Boolean).join(' ') || contact.name || 'Sin nombre',
      phone: contact.phone || '',
      email: contact.email || '',
      tags: contact.tags || [],
      source: contact.source || null,
      attribution: contact.attributionSource || contact.attributions?.[0] || null,
      dateAdded: contact.dateAdded || null,
      zona: get(GHL_FIELD_IDS.zona),
      operacion: get(GHL_FIELD_IDS.operacion),
      presupuesto_ia: get(GHL_FIELD_IDS.presupuesto_ia),
      ambientes: get(GHL_FIELD_IDS.ambientes),
      dormitorios: get(GHL_FIELD_IDS.dormitorios),
      tipo_propiedad: get(GHL_FIELD_IDS.tipo_propiedad),
      score_lead: get(GHL_FIELD_IDS.score_lead),
      propiedad_tokko_id: get(GHL_FIELD_IDS.propiedad_tokko_id),
      titulo_propiedad: get(GHL_FIELD_IDS.titulo_propiedad),
      precio_propiedad: get(GHL_FIELD_IDS.precio_propiedad),
      ubicacion_propiedad: get(GHL_FIELD_IDS.ubicacion_propiedad),
      link_propiedad: get(GHL_FIELD_IDS.link_propiedad),
    })
  } catch (err: any) {
    console.error('[GET /api/leads/:id]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
