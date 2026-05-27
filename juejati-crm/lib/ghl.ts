import { GHL_API_BASE, getGhlLocationId, ghlHeaders, extractFieldValue, GHL_FIELD_IDS } from './ghl-fields'

export interface GHLLead {
  opportunityId: string
  contactId: string
  name: string
  phone: string
  email?: string
  stage: string
  source?: string
  createdAt?: string
  score_lead?: string | null
  zona?: string | null
  operacion?: string | null
  presupuesto_ia?: string | null
  ambientes?: string | null
  propiedad_tokko_id?: string | null
  titulo_propiedad?: string | null
  precio_propiedad?: string | null
  ubicacion_propiedad?: string | null
  link_propiedad?: string | null
}

export interface GHLMessage {
  id: string
  direction: 'inbound' | 'outbound'
  body: string
  channel: string
  createdAt: string | null
}

function mapOpportunity(opp: any): GHLLead {
  const contact = opp.contact || {}
  const customFields: any[] = opp.customFields || contact.customFields || []
  const get = (id: string) => extractFieldValue(customFields, id)
  return {
    opportunityId: opp.id,
    contactId: contact.id || opp.contactId,
    name: contact.name || [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'Sin nombre',
    phone: contact.phone || '',
    email: contact.email || '',
    stage: opp.stage?.name || opp.pipelineStage || '',
    source: opp.source || contact.source || null,
    createdAt: opp.createdAt || opp.dateAdded || null,
    score_lead: get(GHL_FIELD_IDS.score_lead),
    zona: get(GHL_FIELD_IDS.zona),
    operacion: get(GHL_FIELD_IDS.operacion),
    presupuesto_ia: get(GHL_FIELD_IDS.presupuesto_ia),
    ambientes: get(GHL_FIELD_IDS.ambientes),
    propiedad_tokko_id: get(GHL_FIELD_IDS.propiedad_tokko_id),
    titulo_propiedad: get(GHL_FIELD_IDS.titulo_propiedad),
    precio_propiedad: get(GHL_FIELD_IDS.precio_propiedad),
    ubicacion_propiedad: get(GHL_FIELD_IDS.ubicacion_propiedad),
    link_propiedad: get(GHL_FIELD_IDS.link_propiedad),
  }
}

export async function fetchLeads(params: {
  q?: string
  stage?: string
  page?: number
  limit?: number
}): Promise<{ leads: GHLLead[]; total: number; hasMore: boolean }> {
  const { q, page = 1, limit = 50 } = params

  if (q) {
    const url = `${GHL_API_BASE}/contacts/?locationId=${getGhlLocationId()}&query=${encodeURIComponent(q)}&limit=${limit}`
    const res = await fetch(url, { headers: ghlHeaders() })
    if (!res.ok) throw new Error(`GHL search error: ${res.status}`)
    const data = await res.json()
    const contacts = data.contacts || []
    const leads: GHLLead[] = contacts.map((c: any) => {
      const cf = c.customFields || []
      const get = (id: string) => extractFieldValue(cf, id)
      return {
        opportunityId: '',
        contactId: c.id,
        name: [c.firstName, c.lastName].filter(Boolean).join(' ') || c.name || 'Sin nombre',
        phone: c.phone || '',
        email: c.email || '',
        stage: '',
        source: c.source || null,
        createdAt: c.dateAdded || null,
        score_lead: get(GHL_FIELD_IDS.score_lead),
        zona: get(GHL_FIELD_IDS.zona),
        operacion: get(GHL_FIELD_IDS.operacion),
        presupuesto_ia: get(GHL_FIELD_IDS.presupuesto_ia),
        ambientes: get(GHL_FIELD_IDS.ambientes),
        propiedad_tokko_id: get(GHL_FIELD_IDS.propiedad_tokko_id),
        titulo_propiedad: get(GHL_FIELD_IDS.titulo_propiedad),
        precio_propiedad: get(GHL_FIELD_IDS.precio_propiedad),
        ubicacion_propiedad: get(GHL_FIELD_IDS.ubicacion_propiedad),
        link_propiedad: get(GHL_FIELD_IDS.link_propiedad),
      }
    })
    return { leads, total: data.meta?.total || leads.length, hasMore: false }
  }

  const url = `${GHL_API_BASE}/opportunities/search?location_id=${getGhlLocationId()}&limit=${limit}&page=${page}`
  const res = await fetch(url, { headers: ghlHeaders() })
  if (!res.ok) throw new Error(`GHL leads error: ${res.status}`)
  const data = await res.json()
  const opportunities = data.opportunities || []
  const total = data.meta?.total || opportunities.length
  const hasMore = page * limit < total
  return { leads: opportunities.map(mapOpportunity), total, hasMore }
}

export async function fetchContact(contactId: string): Promise<any> {
  const res = await fetch(`${GHL_API_BASE}/contacts/${contactId}`, { headers: ghlHeaders() })
  if (!res.ok) throw new Error(`GHL contact error: ${res.status}`)
  const data = await res.json()
  return data.contact || data
}

export async function fetchConversationMessages(contactId: string, limit = 20): Promise<GHLMessage[]> {
  // First find the conversation for this contact
  const convRes = await fetch(
    `${GHL_API_BASE}/conversations/search?locationId=${getGhlLocationId()}&contactId=${contactId}&limit=1`,
    { headers: ghlHeaders() }
  )
  if (!convRes.ok) return []
  const convData = await convRes.json()
  const conversations = convData.conversations || []
  if (!conversations.length) return []
  const conversationId = conversations[0].id

  const msgRes = await fetch(
    `${GHL_API_BASE}/conversations/${conversationId}/messages?limit=${limit}`,
    { headers: ghlHeaders() }
  )
  if (!msgRes.ok) return []
  const msgData = await msgRes.json()
  const messages = msgData.messages?.messages || msgData.messages || []
  return messages.map((m: any): GHLMessage => ({
    id: m.id,
    direction: m.direction === 'inbound' || m.messageType === 'TYPE_INCOMING' ? 'inbound' : 'outbound',
    body: m.body || m.text || m.messageText || '',
    channel: m.channel || m.type || '',
    createdAt: m.dateAdded || m.createdAt || null,
  })).filter((m: GHLMessage) => m.body)
}

export async function sendMessage(contactId: string, text: string): Promise<void> {
  // Find conversation ID first
  const convRes = await fetch(
    `${GHL_API_BASE}/conversations/search?locationId=${getGhlLocationId()}&contactId=${contactId}&limit=1`,
    { headers: ghlHeaders() }
  )
  if (!convRes.ok) throw new Error('Cannot find conversation')
  const convData = await convRes.json()
  const conversations = convData.conversations || []
  if (!conversations.length) throw new Error('No conversation found for contact')
  const conversationId = conversations[0].id
  const TYPE_MAP: Record<string, string> = {
    TYPE_WHATSAPP: 'WhatsApp',
    TYPE_SMS: 'SMS',
  }
  const convType = conversations[0].type
  const type = TYPE_MAP[convType]
  if (!type) {
    throw new Error(`Tipo de conversación no soportado: ${convType}. Solo WhatsApp y SMS.`)
  }

  const res = await fetch(`${GHL_API_BASE}/conversations/messages`, {
    method: 'POST',
    headers: ghlHeaders(),
    body: JSON.stringify({ type, conversationId, message: text }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Send message error: ${res.status} ${err}`)
  }
}

export async function updateContactFields(contactId: string, fields: Array<{ id: string; field_value: string }>): Promise<void> {
  const res = await fetch(`${GHL_API_BASE}/contacts/${contactId}`, {
    method: 'PUT',
    headers: ghlHeaders(),
    body: JSON.stringify({ customFields: fields }),
  })
  if (!res.ok) throw new Error(`Update contact error: ${res.status}`)
}

export async function addContactTag(contactId: string, tag: string): Promise<void> {
  const contact = await fetchContact(contactId)
  const tags: string[] = contact.tags || []
  if (tags.includes(tag)) return
  const res = await fetch(`${GHL_API_BASE}/contacts/${contactId}`, {
    method: 'PUT',
    headers: ghlHeaders(),
    body: JSON.stringify({ tags: [...tags, tag] }),
  })
  if (!res.ok) throw new Error(`Add tag error: ${res.status}`)
}

export async function removeContactTag(contactId: string, tag: string): Promise<void> {
  const contact = await fetchContact(contactId)
  const tags: string[] = (contact.tags || []).filter((t: string) => t !== tag)
  const res = await fetch(`${GHL_API_BASE}/contacts/${contactId}`, {
    method: 'PUT',
    headers: ghlHeaders(),
    body: JSON.stringify({ tags }),
  })
  if (!res.ok) throw new Error(`Remove tag error: ${res.status}`)
}

export interface Property {
  tokko_id: number
  titulo: string
  barrio: string | null
  direccion: string | null
  precio: number | null
  moneda: string | null
  ambientes: number | null
  dormitorios: number | null
  superficie: number | null
  imagen: string | null
  ficha_tokko: string | null
  operacion: string | null
  tipo: string | null
}

export interface GHLContactDetail {
  contactId: string
  name: string
  phone: string
  email: string
  tags: string[]
  source: string | null
  attribution: any
  dateAdded: string | null
  zona: string | null
  operacion: string | null
  presupuesto_ia: string | null
  ambientes: string | null
  dormitorios: string | null
  tipo_propiedad: string | null
  score_lead: string | null
  propiedad_tokko_id: string | null
  titulo_propiedad: string | null
  precio_propiedad: string | null
  ubicacion_propiedad: string | null
  link_propiedad: string | null
}
