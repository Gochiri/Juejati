export const GHL_FIELD_IDS = {
  zona:                     'eG9pUwxa14BaJPcniff4',
  operacion:                'eyaHssuX5zAXIAJWHLD7',
  presupuesto_ia:           'ihIevvOORQdZzHG1gAhB',
  ambientes:                'KZrsvB6kjmH89d50RssM',
  dormitorios:              'tia21zMjZpg6vssIeiAg',
  tipo_propiedad:           '6MaFF03NbN1maNs2t6wp',
  propiedad_de_interes:     'JIVPrnwNHaa2xpwVF72s',
  propiedad_tokko_id:       '2kErmqUh8mG4DSiPLl4c',
  caracteristicas_deseadas: 'lgdH2EYqz6j7o1ZAUlCg',
  ultima_propiedad_vista:   'SIxdiv7ssbhAzMAyIziu',
  titulo_propiedad:         'M3VU50mqHUKb9alOKPvt',
  precio_propiedad:         'oMgcrl5b9LY1WOCVLiFI',
  ubicacion_propiedad:      'XJvbVGNyvhnghesdLIYd',
  score_lead:               'zLRaEQ5pm9fWvKJsnoIo',
  link_propiedad:           'XXEy7AlJmE9PJu1bOQKs',
  origen_lead:              'JpyQySFLxOqx65JHYmEn',
} as const

export const GHL_API_BASE = 'https://services.leadconnectorhq.com'

export function getGhlLocationId(): string {
  const v = process.env.GHL_LOCATION_ID
  if (!v) throw new Error('GHL_LOCATION_ID env var is not set')
  return v
}

export function ghlHeaders() {
  const key = process.env.GHL_API_KEY
  if (!key) throw new Error('GHL_API_KEY env var is not set')
  return {
    Authorization: `Bearer ${key}`,
    Version: '2021-07-28',
    'Content-Type': 'application/json',
  }
}

export function extractFieldValue(customFields: any[], fieldId: string): string | null {
  if (!Array.isArray(customFields)) return null
  const f = customFields.find((cf: any) => cf.id === fieldId)
  return f?.value ?? f?.field_value ?? null
}
