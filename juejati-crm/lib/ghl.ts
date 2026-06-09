import { GHL_API_BASE, getGhlLocationId, ghlHeaders, extractFieldValue, GHL_FIELD_IDS } from './ghl-fields'

export interface GHLLead {
  opportunityId: string
  contactId: string
  name: string
  phone: string
  email?: string
  stage: string
  stageId?: string
  pipelineId?: string
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
    stageId: opp.pipelineStageId || opp.stage?.id || '',
    pipelineId: opp.pipelineId || '',
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

export interface GHLStage {
  id: string
  name: string
  position: number
}

export interface GHLPipeline {
  id: string
  name: string
  stages: GHLStage[]
}

export async function fetchPipelines(): Promise<GHLPipeline[]> {
  const url = `${GHL_API_BASE}/opportunities/pipelines?locationId=${getGhlLocationId()}`
  const res = await fetch(url, { headers: ghlHeaders() })
  if (!res.ok) throw new Error(`GHL pipelines error: ${res.status}`)
  const data = await res.json()
  const pipelines = data.pipelines || []
  return pipelines.map((p: any): GHLPipeline => ({
    id: p.id,
    name: p.name,
    stages: (p.stages || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      position: s.position ?? 0,
    })).sort((a: GHLStage, b: GHLStage) => a.position - b.position),
  }))
}

export async function fetchLeads(params: {
  q?: string
  stage?: string
  pipelineId?: string
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

  let url = `${GHL_API_BASE}/opportunities/search?location_id=${getGhlLocationId()}&limit=${limit}&page=${page}`
  if (params.stage) url += `&pipeline_stage_id=${encodeURIComponent(params.stage)}`
  if (params.pipelineId) url += `&pipeline_id=${encodeURIComponent(params.pipelineId)}`
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

export interface GHLCalendar {
  id: string
  name: string
  isActive: boolean
}

export interface GHLAppointment {
  id: string
  calendarId: string
  contactId: string | null
  title: string
  startTime: string
  endTime: string
  status: string
  notes: string | null
  address: string | null
  contactName?: string
  contactPhone?: string
}

export async function fetchCalendars(): Promise<GHLCalendar[]> {
  const url = `${GHL_API_BASE}/calendars/?locationId=${getGhlLocationId()}`
  const res = await fetch(url, { headers: ghlHeaders() })
  if (!res.ok) throw new Error(`GHL calendars error: ${res.status}`)
  const data = await res.json()
  return (data.calendars || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    isActive: c.isActive !== false,
  }))
}

export async function fetchAppointments(params: {
  calendarId?: string
  startTime: string
  endTime: string
}): Promise<GHLAppointment[]> {
  const url = new URL(`${GHL_API_BASE}/calendars/events`)
  url.searchParams.set('locationId', getGhlLocationId())
  url.searchParams.set('startTime', params.startTime)
  url.searchParams.set('endTime', params.endTime)
  if (params.calendarId) url.searchParams.set('calendarId', params.calendarId)

  const res = await fetch(url.toString(), { headers: ghlHeaders() })
  if (!res.ok) throw new Error(`GHL appointments error: ${res.status}`)
  const data = await res.json()
  const events = data.events || []
  return events.map((e: any): GHLAppointment => ({
    id: e.id,
    calendarId: e.calendarId,
    contactId: e.contactId || null,
    title: e.title || 'Sin título',
    startTime: e.startTime,
    endTime: e.endTime,
    status: e.appointmentStatus || e.status || 'confirmed',
    notes: e.notes || null,
    address: e.address || null,
  }))
}

export async function createAppointment(params: {
  calendarId: string
  contactId: string
  startTime: string
  endTime: string
  title: string
  notes?: string
  address?: string
}): Promise<{ id: string }> {
  const res = await fetch(`${GHL_API_BASE}/calendars/events/appointments`, {
    method: 'POST',
    headers: ghlHeaders(),
    body: JSON.stringify({
      locationId: getGhlLocationId(),
      calendarId: params.calendarId,
      contactId: params.contactId,
      startTime: params.startTime,
      endTime: params.endTime,
      title: params.title,
      ...(params.notes && { notes: params.notes }),
      ...(params.address && { address: params.address }),
      appointmentStatus: 'confirmed',
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Create appointment error: ${res.status} ${err}`)
  }
  const data = await res.json()
  return { id: data.id || data.appointment?.id }
}

export interface GHLSocialAccount {
  id: string
  platform: string
  name: string
  profilePicture?: string | null
}

export interface GHLSocialPost {
  id: string
  status: string
  type: string
  summary: string
  source: string
  scheduledTime: string | null
  publishedTime: string | null
  accountIds: string[]
  mediaUrls: string[]
}

export async function fetchSocialAccounts(): Promise<GHLSocialAccount[]> {
  const url = `${GHL_API_BASE}/social-media-posting/${getGhlLocationId()}/accounts`
  const res = await fetch(url, { headers: ghlHeaders() })
  if (!res.ok) throw new Error(`GHL social accounts error: ${res.status}`)
  const data = await res.json()
  const accounts = data.accounts || data.results?.accounts || []
  return accounts.map((a: any) => ({
    id: a.id || a._id,
    platform: a.platform || a.type,
    name: a.name || a.profileName || 'Cuenta',
    profilePicture: a.profilePicture || a.picture || null,
  }))
}

// Cache de userId — GHL exige un userId válido al crear posts.
// Lo resolvemos via env var GHL_DEFAULT_USER_ID, o lo descubrimos pidiendo la lista de users.
let _cachedUserId: string | null = null

export async function getDefaultGhlUserId(): Promise<string> {
  if (_cachedUserId) return _cachedUserId
  if (process.env.GHL_DEFAULT_USER_ID) {
    _cachedUserId = process.env.GHL_DEFAULT_USER_ID
    return _cachedUserId
  }
  const url = `${GHL_API_BASE}/users/?locationId=${getGhlLocationId()}`
  const res = await fetch(url, { headers: ghlHeaders() })
  if (!res.ok) throw new Error(`GHL users error: ${res.status}`)
  const data = await res.json()
  const users = data.users || []
  if (!users.length) throw new Error('No hay usuarios en esta location de GHL')
  _cachedUserId = users[0].id
  return _cachedUserId!
}

function guessMediaType(url: string): string {
  const lower = url.toLowerCase().split('?')[0]
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.gif')) return 'image/gif'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.mp4')) return 'video/mp4'
  if (lower.endsWith('.mov')) return 'video/quicktime'
  // default: jpeg (Tokko sirve JPGs por defecto)
  return 'image/jpeg'
}

export async function fetchSocialPosts(): Promise<GHLSocialPost[]> {
  // GHL exige accountIds para listar posts. Si no tenemos cuentas, devolvemos lista vacía.
  let accountIds: string[] = []
  try {
    const accounts = await fetchSocialAccounts()
    accountIds = accounts.map((a) => a.id).filter(Boolean)
  } catch {
    return []
  }
  if (accountIds.length === 0) return []

  const url = `${GHL_API_BASE}/social-media-posting/${getGhlLocationId()}/posts/list`
  const res = await fetch(url, {
    method: 'POST',
    headers: ghlHeaders(),
    body: JSON.stringify({ type: 'all', accountIds, limit: 50, skip: 0 }),
  })
  if (!res.ok) {
    // GHL puede tirar 422 si el body no cumple. No romper la página: devolver vacío y loguear.
    const errText = await res.text().catch(() => '')
    console.error(`[fetchSocialPosts] GHL ${res.status}:`, errText)
    return []
  }
  const data = await res.json()
  const posts = data.posts || data.results?.posts || []
  return posts.map((p: any): GHLSocialPost => ({
    id: p.id || p._id,
    status: p.status || 'scheduled',
    type: p.type || 'post',
    summary: p.summary || p.text || '',
    source: p.source || 'manual',
    scheduledTime: p.scheduleDate || p.scheduledTime || null,
    publishedTime: p.publishedDate || p.publishedTime || null,
    accountIds: p.accountIds || p.accounts || [],
    mediaUrls: (p.media || []).map((m: any) => m.url || m).filter(Boolean),
  }))
}

export async function createSocialPost(params: {
  accountIds: string[]
  summary: string
  scheduleDate: string
  mediaUrl?: string
}): Promise<{ id: string }> {
  const userId = await getDefaultGhlUserId()

  const body: any = {
    accountIds: params.accountIds,
    summary: params.summary,
    scheduleDate: params.scheduleDate,
    type: 'post',
    status: 'scheduled',
    userId,
  }
  if (params.mediaUrl) {
    body.media = [{ url: params.mediaUrl, type: guessMediaType(params.mediaUrl) }]
  }

  const res = await fetch(`${GHL_API_BASE}/social-media-posting/${getGhlLocationId()}/posts`, {
    method: 'POST',
    headers: ghlHeaders(),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Create social post error: ${res.status} ${err}`)
  }
  const data = await res.json()
  return { id: data.id || data.post?.id || data._id }
}

export async function updateOpportunityStage(
  opportunityId: string,
  stageId: string,
): Promise<void> {
  const res = await fetch(`${GHL_API_BASE}/opportunities/${opportunityId}`, {
    method: 'PUT',
    headers: ghlHeaders(),
    body: JSON.stringify({ pipelineStageId: stageId }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Update opportunity stage error: ${res.status} ${err}`)
  }
}
