import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';
import dotenv from 'dotenv';
import { upsertProperty, markInactiveExcept, queryDatabase } from './db.js';

dotenv.config();

const TOKKO_API_URL = 'https://www.tokkobroker.com/api/v1/property';
const TOKKO_API_KEY = process.env.TOKKO_API_KEY!;

// ═══════════════════════════════════════════════════════
// Tipos
// ═══════════════════════════════════════════════════════

interface TokkoProperty {
  id: number;
  reference_code?: string;
  publication_title?: string;
  description?: string;
  real_address?: string;
  public_url?: string;
  type?: { name?: string };
  operations?: {
    operation_type: string;
    prices?: { currency: string; price: number }[];
  }[];
  location?: { name?: string };
  surface?: string;
  room_amount?: number;
  bedroom_amount?: number;
  bathroom_amount?: number;
  parking_lot_amount?: number;
  geo_lat?: string;
  geo_long?: string;
  photos?: { order?: number; is_front_cover?: boolean; image?: string }[];
  producer?: { name?: string };
}

export interface PropertyData {
  tokko_id: number;
  codigo: string;
  titulo: string;
  descripcion: string;
  tipo: string;
  operacion: string;
  direccion: string;
  calle: string;
  altura: string;
  barrio: string;
  geo_lat: number | null;
  geo_long: number | null;
  precio: number | null;
  moneda: string;
  ambientes: number | null;
  dormitorios: number | null;
  banos: number | null;
  cocheras: number | null;
  superficie: number | null;
  imagen: string;
  ficha_tokko: string;
  link_web: string;
  asesor: string;
  embedding_text: string;
  embedding: number[];
}

// ═══════════════════════════════════════════════════════
// Paso 1: Fetch de Tokko API (igual al nodo "Tokko API Request1")
// ═══════════════════════════════════════════════════════

async function fetchTokkoProperties(): Promise<TokkoProperty[]> {
  const allProperties: TokkoProperty[] = [];
  let offset = 0;
  const limit = 200;

  // Paginar hasta que no haya más resultados
  while (true) {
    const url = `${TOKKO_API_URL}?key=${TOKKO_API_KEY}&format=json&limit=${limit}&offset=${offset}&lang=es_ar`;
    console.log(`📡 Fetching Tokko API offset=${offset}...`);

    const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new Error(`Tokko API error: ${res.status} ${res.statusText}`);

    const data = await res.json();
    const properties = data.objects || [];
    allProperties.push(...properties);

    console.log(`   → Got ${properties.length} properties (total: ${allProperties.length})`);

    // Si recibimos menos del limit, no hay más páginas
    if (properties.length < limit) break;
    offset += limit;
  }

  return allProperties;
}

// ═══════════════════════════════════════════════════════
// Paso 2: Transformar propiedad (igual al nodo "Split Properties")
// ═══════════════════════════════════════════════════════

function getPriceByOperation(operations: TokkoProperty['operations'], opType: string, currency: string): number | null {
  const op = operations?.find(o => o.operation_type === opType);
  const price = op?.prices?.find(p => p.currency === currency);
  return price?.price || null;
}

function getOperationType(operations: TokkoProperty['operations']): string {
  return operations?.map(op => op.operation_type).join(', ') || '';
}

function getFirstImage(photos: TokkoProperty['photos']): string {
  if (!photos || photos.length === 0) return '';
  const sorted = [...photos].sort((a, b) => (a.order || 0) - (b.order || 0));
  const cover = sorted.find(p => p.is_front_cover === true);
  return (cover || sorted[0])?.image || '';
}

function parseDireccion(direccion: string): { calle: string; altura: string } {
  if (!direccion) return { calle: '', altura: '' };
  const match = direccion.match(/^(.+?)\s+(\d+)$/);
  if (match) return { calle: match[1].trim(), altura: match[2] };
  return { calle: direccion.trim(), altura: '' };
}

function transformProperty(prop: TokkoProperty): Omit<PropertyData, 'embedding'> {
  const operacion = getOperationType(prop.operations);
  const isAlquiler = prop.operations?.[0]?.operation_type === 'Alquiler';
  const precio = isAlquiler
    ? getPriceByOperation(prop.operations, 'Alquiler', 'ARS')
    : getPriceByOperation(prop.operations, 'Venta', 'USD');
  const moneda = isAlquiler ? 'ARS' : 'USD';

  const direccion = prop.real_address || '';
  const { calle, altura } = parseDireccion(direccion);
  const distrito = prop.location?.name || '';
  const tipoInmueble = prop.type?.name || '';
  const habitaciones = prop.room_amount || (prop.bedroom_amount ? prop.bedroom_amount + 1 : null);
  const superficie = parseFloat(prop.surface || '0') || null;
  const titulo = prop.publication_title || '';
  const descripcion = prop.description || '';
  const banos = prop.bathroom_amount || null;
  const cocheras = prop.parking_lot_amount || null;

  // ═══════════════════════════════════════════════════════
  // Generar texto para embedding (igual al nodo "Generate Embedding")
  // ═══════════════════════════════════════════════════════

  let textoPrecio = precio ? `${moneda} ${precio.toLocaleString('es-AR')}` : 'Precio a consultar';

  let textoAmbientes = '';
  if (habitaciones) {
    const dorms = habitaciones - 1;
    if (habitaciones === 1) textoAmbientes = 'monoambiente';
    else if (dorms === 1) textoAmbientes = `${habitaciones} ambientes (${dorms} dormitorio)`;
    else textoAmbientes = `${habitaciones} ambientes (${dorms} dormitorios)`;
  }

  let textoUbicacion = '';
  if (direccion && distrito) textoUbicacion = `en ${direccion}, ${distrito}`;
  else if (direccion) textoUbicacion = `en ${direccion}`;
  else if (distrito) textoUbicacion = `en ${distrito}`;

  const caracteristicas: string[] = [];
  if (banos) caracteristicas.push(`${banos} baño${banos > 1 ? 's' : ''}`);
  if (cocheras) caracteristicas.push(`${cocheras} cochera${cocheras > 1 ? 's' : ''}`);
  if (superficie) caracteristicas.push(`${superficie}m²`);

  const textoDescripcion = descripcion ? descripcion.substring(0, 300).trim() : '';

  const embeddingText = [
    `${tipoInmueble} ${textoAmbientes} ${textoUbicacion}.`,
    `${operacion} ${textoPrecio}.`,
    caracteristicas.length > 0 ? caracteristicas.join(', ') + '.' : '',
    titulo,
    textoDescripcion,
  ].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

  return {
    tokko_id: prop.id,
    codigo: prop.reference_code || '',
    titulo,
    descripcion,
    tipo: tipoInmueble,
    operacion: operacion.toLowerCase(),
    direccion,
    calle,
    altura,
    barrio: distrito,
    geo_lat: prop.geo_lat ? parseFloat(prop.geo_lat) : null,
    geo_long: prop.geo_long ? parseFloat(prop.geo_long) : null,
    precio,
    moneda,
    ambientes: habitaciones,
    dormitorios: habitaciones ? habitaciones - 1 : null,
    banos,
    cocheras,
    superficie,
    imagen: getFirstImage(prop.photos),
    ficha_tokko: prop.public_url || '',
    link_web: '',
    asesor: prop.producer?.name || '',
    embedding_text: embeddingText,
  };
}

// ═══════════════════════════════════════════════════════
// Paso 3: Generar embedding con OpenAI
// ═══════════════════════════════════════════════════════

async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: text,
  });
  return embedding;
}

// ═══════════════════════════════════════════════════════
// Sync completo: Tokko → Transform → Embed → Supabase
// ═══════════════════════════════════════════════════════

export async function syncProperties(): Promise<{ total: number; synced: number; errors: number }> {
  console.log('🔄 Starting Tokko → Supabase sync...');
  const startTime = Date.now();

  // 1. Fetch todas las propiedades de Tokko
  const tokkoProperties = await fetchTokkoProperties();
  console.log(`📦 Total properties from Tokko: ${tokkoProperties.length}`);

  let synced = 0;
  let errors = 0;
  const syncedIds: number[] = [];

  // 2. Procesar cada propiedad
  for (const prop of tokkoProperties) {
    try {
      // Transformar
      const data = transformProperty(prop);

      // Generar embedding
      const embedding = await generateEmbedding(data.embedding_text);

      // Upsert en Supabase
      await upsertProperty({ ...data, embedding });

      syncedIds.push(data.tokko_id);
      synced++;

      if (synced % 10 === 0) {
        console.log(`   ✅ ${synced}/${tokkoProperties.length} synced...`);
      }
    } catch (err) {
      errors++;
      console.error(`   ❌ Error syncing property ${prop.id}:`, err);
    }
  }

  // 3. Marcar como inactivas las propiedades que ya no están en Tokko
  if (syncedIds.length > 0) {
    await markInactiveExcept(syncedIds);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`🏁 Sync complete in ${elapsed}s: ${synced} synced, ${errors} errors`);

  return { total: tokkoProperties.length, synced, errors };
}
