import { openai } from '@ai-sdk/openai';
import { generateText, tool, CoreMessage, embed } from 'ai';
import { z } from 'zod';
import { searchProperties, saveContactImages, getContactImages, PropertyCard } from './db.js';
import { searchZonaPropScraper, buildCatalogUrl } from './scraper.js';
import { addContactTag, updateContactFields } from './ghl.js';
import { getConfig, logUsage } from './admin-db.js';

// IDs reales de custom fields en GHL (Location: WWrBqekGJCsCmSSvPzEf)
const GHL_FIELD_IDS = {
  zona: 'eG9pUwxa14BaJPcniff4',
  operacion: 'eyaHssuX5zAXIAJWHLD7',
  presupuesto_ia: 'ihIevvOORQdZzHG1gAhB',
  ambientes: 'KZrsvB6kjmH89d50RssM',
  dormitorios: 'tia21zMjZpg6vssIeiAg',
  tipo_propiedad: '6MaFF03NbN1maNs2t6wp',
  propiedad_de_interes: 'JIVPrnwNHaa2xpwVF72s',
  propiedad_tokko_id: '2kErmqUh8mG4DSiPLl4c',
  caracteristicas_deseadas: 'lgdH2EYqz6j7o1ZAUlCg',
  ultima_propiedad_vista: 'SIxdiv7ssbhAzMAyIziu',
  titulo_propiedad: 'M3VU50mqHUKb9alOKPvt',
  precio_propiedad: 'oMgcrl5b9LY1WOCVLiFI',
  ubicacion_propiedad: 'XJvbVGNyvhnghesdLIYd',
  score_lead: 'zLRaEQ5pm9fWvKJsnoIo',
  link_propiedad: 'XXEy7AlJmE9PJu1bOQKs',
} as const;

const DEFAULT_SYSTEM_PROMPT = `
Sos Sofía, asesora virtual de Juejati Brokers con 10 años de experiencia en el mercado inmobiliario argentino.

════════════════════ REGLAS GENERALES ════════════════════

- Respondé en español argentino neutro, con empatía y mensajes breves (máx. dos frases por turno).
- Ortografía impecable; todas las preguntas llevan «¿?» de apertura y cierre.
- No podés agendar visitas por ti misma. La coordinación de visitas la realiza un humano.
- Juejati Brokers trabaja EXCLUSIVAMENTE con departamentos. Nunca preguntes si busca casa u otro tipo.

════════════════════ FLUJO DE CONVERSACIÓN ════════════════════

1. Si no tenés el nombre → «Hola, soy Sofía de Juejati Brokers. ¿Cómo te llamás?»
2. Si no tenés la zona → «¿En qué zona de Buenos Aires estás buscando?»
3. Si no tenés ambientes → «¿Cuántos ambientes necesitás?»
4. Si no tenés presupuesto → «¿Cuál es tu presupuesto en dólares?»

⚠️ NUNCA preguntes si busca casa o departamento. Siempre es departamento.
⚠️ El presupuesto SIEMPRE se pregunta en dólares, nunca en pesos.

Inferencia de operación:
- Presupuesto > USD 80.000 → venta
- Presupuesto < USD 80.000 → alquiler
- Si menciona "comprar"/"invertir" → venta
- Si menciona "alquilar"/"rentar" → alquiler

════════════════════ BÚSQUEDA ════════════════════

Cuando tengas zona, ambientes y presupuesto:
1. Usá 'search_internal_properties' INMEDIATAMENTE. No anuncies que vas a buscar.
2. Si no hay resultados internos, usá 'fallback_zonaprop_scraper' INMEDIATAMENTE. No preguntes al cliente si querés buscar en otro lado — simplemente buscá.
3. Si tampoco hay resultados externos, informá al cliente que un asesor se comunicará.
4. Si el cliente pide foto/imagen de una propiedad, volvé a llamar 'search_internal_properties' con los datos que ya tenés — las fotos se envían automáticamente por el sistema como adjuntos.
   ⚠️ PROHIBIDO decir "no puedo enviar imágenes/fotos" o similar. El sistema SÍ envía fotos automáticamente después de cada búsqueda.
   ⚠️ NUNCA menciones "ZonaProp" al cliente. Si usás el fallback, decí "nuestra red de propiedades asociadas".

════════════════════ FORMATO DE RESULTADOS ════════════════════

NUNCA listes las propiedades en tu respuesta — el sistema las envía
automáticamente como tarjetas individuales (imagen + datos) por WhatsApp.

Cuando tengas resultados de búsqueda:
- Solo generá una pregunta de seguimiento contextual.
  Ej: «¿Te interesa alguna? ¿Querés que busque en otras zonas?»
- Si no hay resultados, informá al cliente que un asesor se comunicará.

⚠️ No incluyas títulos, precios ni links en tu respuesta — van en las tarjetas.

════════════════════ ACTUALIZACIÓN DE DATOS ════════════════════

Llamá 'update_ghl_contact' INMEDIATAMENTE cuando el cliente dé
cada dato — NO esperes al final ni lo batchees con la búsqueda.

Secuencia obligatoria:
→ Cliente da zona      → update_ghl_contact(zona, score_lead="tibio")
→ Cliente da ambientes → update_ghl_contact(ambientes, score_lead="tibio")
→ Cliente da presupuesto → update_ghl_contact(presupuesto, operacion, score_lead="tibio")
→ RECIÉN ENTONCES → search_internal_properties

→ Cliente elige propiedad → update_ghl_contact(propiedad_de_interes,
  propiedad_tokko_id, score_lead="caliente") + add_ghl_tag("quiere visitar")

Los datos previos en GHL de conversaciones anteriores NO son válidos.
Solo guardás lo que el cliente dijo en esta conversación.

════════════════════ PROPIEDAD SELECCIONADA ════════════════════

Cuando el cliente dice "me interesa la X", "quiero ver la X", "me gusta la X":

1. Identificá qué número eligió (1, 2, 3…).
2. Llamá INMEDIATAMENTE 'seleccionar_propiedad' con ese número.
   El sistema guarda todos los datos automáticamente.
3. NO hagas una nueva búsqueda.
4. Confirmá al cliente y preguntá si quiere coordinar la visita.

NUNCA uses fallback_zonaprop_scraper para "más información".

════════════════════ AGENDAMIENTO ════════════════════

Si el cliente quiere ver una propiedad:
1. Si no sabés cuándo planea comprar, preguntá: «¿Estás pensando en algo para los próximos meses o es para más adelante?»
   → Guardá con update_ghl_contact: timeline = "ahora", "6_meses" o "1_anio"
2. Indicá que un asesor humano se va a comunicar para coordinar la visita.
3. Usá add_ghl_tag con "quiere visitar" y update_ghl_contact con la propiedad de interés y timeline.
`;

export { DEFAULT_SYSTEM_PROMPT };

async function getSystemPrompt(): Promise<string> {
  const dbPrompt = await getConfig('system_prompt');
  return dbPrompt || DEFAULT_SYSTEM_PROMPT;
}

async function getModelId(): Promise<string> {
  const model = await getConfig('openai_model');
  return model || 'gpt-4.1-mini';
}

function buildInternalCaption(r: any): string {
  const precio = r.precio
    ? `${r.moneda || 'USD'} ${Number(r.precio).toLocaleString('es-AR')}`
    : 'Consultar';
  const amb = r.ambientes ? `${r.ambientes} amb` : '';
  const sup = r.superficie ? `${r.superficie} m²` : '';
  const detalle = [amb, sup].filter(Boolean).join(' · ');
  return [
    `*${r.titulo}*`,
    `💰 ${precio}`,
    (r.direccion || r.barrio) ? `📍 ${r.direccion || r.barrio}` : '',
    detalle ? `🏠 ${detalle}` : '',
    r.ficha_tokko ? `🔗 ${r.ficha_tokko}` : '',
  ].filter(Boolean).join('\n');
}

function buildScraperCaption(r: any): string {
  return [
    `*${r.title || r.titulo || 'Propiedad'}*`,
    (r.price || r.precio) ? `💰 ${r.price || r.precio}` : '',
    (r.location || r.ubicacion) ? `📍 ${r.location || r.ubicacion}` : '',
    (r.features || r.caracteristicas) ? `🏠 ${r.features || r.caracteristicas}` : '',
    (r.rebrandedUrl || r.link_web) ? `🔗 ${r.rebrandedUrl || r.link_web}` : '',
  ].filter(Boolean).join('\n');
}

// Mapa de sub-barrios → distrito Tokko
// Tokko guarda barrios a nivel distrito, no sub-barrios
const BARRIO_ALIASES: Record<string, string> = {
  'el botanico': 'Palermo',
  'botanico': 'Palermo',
  'el botánico': 'Palermo',
  'botánico': 'Palermo',
  'palermo soho': 'Palermo',
  'soho': 'Palermo',
  'palermo hollywood': 'Palermo',
  'hollywood': 'Palermo',
  'las cañitas': 'Palermo',
  'cañitas': 'Palermo',
  'palermo chico': 'Palermo Chico',
  'barrio parque': 'Palermo Chico',
  'villa freud': 'Palermo',
  'abasto': 'Abasto',
  'corrientes': 'Abasto',
  'cid campeador': 'Cid Campeador',
  'flores norte': 'Flores Norte',
  'caballito norte': 'Caballito Norte',
  'barrio norte': 'Barrio Norte',
};

function normalizarBarrio(zona: string): string {
  const key = zona.toLowerCase().trim();
  return BARRIO_ALIASES[key] || zona;
}

// Cost per 1M tokens (approximate)
const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'gpt-4o': { input: 2.50, output: 10.00 },
  'gpt-4.1-mini': { input: 0.40, output: 1.60 },
  'gpt-4.1': { input: 2.00, output: 8.00 },
  'gpt-5.2-mini': { input: 0.15, output: 0.60 },
};

function estimateCost(model: string, promptTokens: number, completionTokens: number): number {
  const costs = MODEL_COSTS[model] || { input: 0.15, output: 0.60 };
  return (promptTokens * costs.input + completionTokens * costs.output) / 1_000_000;
}

async function getEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: text,
  });
  return embedding;
}

export async function runAgent(contactId: string, history: CoreMessage[], userMessage: string): Promise<{ text: string; images: PropertyCard[] }> {
  const messages: CoreMessage[] = [
    ...history,
    { role: 'user', content: userMessage }
  ];

  const collectedCards: PropertyCard[] = [];
  let searchPerformed = false;
  let lastSearchResults: any[] = [];
  const systemPrompt = await getSystemPrompt();
  const modelId = await getModelId();

  const result = await generateText({
    model: openai(modelId),
    system: systemPrompt,
    messages,
    maxSteps: 8,
    tools: {
      search_internal_properties: tool({
        description: 'Búsqueda semántica en la base de datos interna de departamentos (Supabase/Tokko). Usar siempre primero.',
        parameters: z.object({
          zona: z.string().optional().describe('Barrio o zona. Ej: Palermo, Recoleta'),
          operacion: z.string().optional().describe('venta o alquiler'),
          ambientes: z.number().optional().describe('Cantidad de ambientes'),
          presupuesto_max: z.number().optional().describe('Presupuesto máximo en USD'),
          query_semantica: z.string().describe('Frase natural de búsqueda. Ej: Departamento luminoso con balcón en Palermo')
        }),
        execute: async (args) => {
          const embedding = await getEmbedding(args.query_semantica);
          const barrioNormalizado = args.zona ? normalizarBarrio(args.zona) : undefined;
          let results = await searchProperties(embedding, {
            operacion: args.operacion,
            tipo: 'departamento', // Juejati works exclusively with apartments
            ambientes: args.ambientes,
            barrio: barrioNormalizado,
            presupuesto_max: args.presupuesto_max,
          });
          // If barrio filter returned nothing, retry without it — Tokko may store
          // the district name instead of the neighborhood (e.g. "Almagro" for "Abasto")
          let zonaExacta = results.length > 0;
          if (results.length === 0 && args.zona) {
            results = await searchProperties(embedding, {
              operacion: args.operacion,
              tipo: 'departamento',
              ambientes: args.ambientes,
              presupuesto_max: args.presupuesto_max,
            });
          }
          // Build property cards — cap at 3 total across all tool calls
          searchPerformed = true;
          lastSearchResults = results; // store for seleccionar_propiedad tool
          const remaining = Math.max(0, 3 - collectedCards.length);
          const cards: PropertyCard[] = results.slice(0, remaining).map((r: any) => ({
            url: r.imagen || undefined,
            caption: buildInternalCaption(r),
          }));
          console.log(`🔍 Tool results: ${results.length} properties, ${cards.length} cards`);
          collectedCards.push(...cards);
          if (cards.length > 0) {
            await saveContactImages(contactId, cards);
          }
          // Number results explicitly so the model maps "la primera" to the correct tokko_id
          const numberedResults = results.map((r: any, i: number) => ({ _numero: i + 1, ...r }));
          return {
            properties: numberedResults,
            _zona_note: !zonaExacta && args.zona
              ? `No hay propiedades exactas en "${args.zona}" en nuestra base. Estos son los más cercanos disponibles — aclaráselo al cliente y ofrecé buscar en zonas alternativas.`
              : undefined,
            _system_note: cards.length > 0
              ? `${cards.length} tarjeta(s) con foto y datos se enviarán automáticamente al cliente. NO digas que no podés enviar fotos.`
              : 'No se encontraron fotos para estas propiedades.'
          };
        }
      }),

      fallback_zonaprop_scraper: tool({
        description: 'Búsqueda en nuestra red de propiedades asociadas. Usar SOLO cuando search_internal_properties no devuelve resultados.',
        parameters: z.object({
          zona: z.string().optional(),
          operacion: z.string().optional()
        }),
        execute: async (args) => {
          const raw = await searchZonaPropScraper({
            barrio: args.zona,
            tipo: 'departamento', // Juejati works exclusively with apartments
            operacion: args.operacion
          });
          // Scraper returns { properties: [...], html: '...' } or an array
          const properties: any[] = Array.isArray(raw) ? raw : (raw?.properties || []);
          // Build property cards — cap at 3 total across all tool calls
          searchPerformed = true;
          const remaining = Math.max(0, 3 - collectedCards.length);
          const cards: PropertyCard[] = properties.slice(0, remaining).map((r: any) => ({
            url: r.image || undefined,
            caption: buildScraperCaption(r),
          }));
          collectedCards.push(...cards);
          if (cards.length > 0) {
            await saveContactImages(contactId, cards);
          }
          // Build catalog URL so the agent can share a single link with all results
          const catalogUrl = buildCatalogUrl({ tipo: 'departamento', operacion: args.operacion, barrio: args.zona });
          // Map to cleaner format so agent never sees the raw zonaprop link
          return {
            properties: properties.map((r: any) => ({
              titulo: r.title,
              precio: r.price,
              ubicacion: r.location,
              caracteristicas: r.features,
              link_web: r.rebrandedUrl || '',
            })),
            catalog_url: catalogUrl,
            _system_note: `Incluí este link al final de tu respuesta: "Ver catálogo completo: ${catalogUrl}"`,
          };
        }
      }),

      update_ghl_contact: tool({
        description: 'Actualiza los campos del contacto en el CRM cuando obtenés nueva información del cliente.',
        parameters: z.object({
          zona: z.string().optional().describe('Zona de interés del cliente'),
          presupuesto: z.number().optional().describe('Presupuesto en USD'),
          ambientes: z.number().optional().describe('Cantidad de ambientes'),
          operacion: z.string().optional().describe('venta o alquiler'),
          propiedad_de_interes: z.string().optional().describe('Título o ID de propiedad que le interesó'),
          propiedad_tokko_id: z.number().nullish().describe('Tokko ID de la propiedad de interés'),
          caracteristicas: z.string().optional().describe('Características deseadas por el cliente'),
          forma_pago: z.enum(['contado', 'credito']).optional().describe('Forma de pago declarada: contado o credito'),
          timeline: z.enum(['ahora', '6_meses', '1_anio']).optional().describe('Urgencia de compra: ahora (0-3 meses), 6_meses, o 1_anio'),
          score_lead: z.enum(['frio', 'tibio', 'caliente']).optional().describe('Score del lead: "frio" (solo pregunta), "tibio" (dio datos concretos de búsqueda), "caliente" (quiere visitar o comprar)'),
          titulo_propiedad: z.string().optional().describe('Título de la propiedad seleccionada'),
          precio_propiedad: z.number().optional().describe('Precio en USD de la propiedad seleccionada'),
          ubicacion_propiedad: z.string().optional().describe('Dirección o ubicación de la propiedad seleccionada'),
          dormitorios: z.number().optional().describe('Cantidad de dormitorios de la propiedad seleccionada'),
          link_propiedad: z.string().optional().describe('URL de la ficha de la propiedad seleccionada (ficha_tokko)'),
          ultima_propiedad_vista: z.string().optional().describe('Título de la última propiedad consultada por el cliente'),
        }),
        execute: async (args) => {
          const fields: { id: string; field_value: any }[] = [];

          if (args.zona) fields.push({ id: GHL_FIELD_IDS.zona, field_value: args.zona });
          if (args.presupuesto) fields.push({ id: GHL_FIELD_IDS.presupuesto_ia, field_value: args.presupuesto });
          // Always set tipo_propiedad = departamento — Juejati works exclusively with apartments
          fields.push({ id: GHL_FIELD_IDS.tipo_propiedad, field_value: 'departamento' });
          if (args.ambientes) fields.push({ id: GHL_FIELD_IDS.ambientes, field_value: String(args.ambientes) });
          if (args.operacion) fields.push({ id: GHL_FIELD_IDS.operacion, field_value: args.operacion });
          if (args.propiedad_de_interes) fields.push({ id: GHL_FIELD_IDS.propiedad_de_interes, field_value: args.propiedad_de_interes });
          if (args.propiedad_tokko_id) fields.push({ id: GHL_FIELD_IDS.propiedad_tokko_id, field_value: args.propiedad_tokko_id });
          if (args.caracteristicas) fields.push({ id: GHL_FIELD_IDS.caracteristicas_deseadas, field_value: args.caracteristicas });
          if (args.score_lead) fields.push({ id: GHL_FIELD_IDS.score_lead, field_value: args.score_lead });
          if (args.titulo_propiedad) fields.push({ id: GHL_FIELD_IDS.titulo_propiedad, field_value: args.titulo_propiedad });
          if (args.precio_propiedad) fields.push({ id: GHL_FIELD_IDS.precio_propiedad, field_value: args.precio_propiedad });
          if (args.ubicacion_propiedad) fields.push({ id: GHL_FIELD_IDS.ubicacion_propiedad, field_value: args.ubicacion_propiedad });
          if (args.dormitorios) fields.push({ id: GHL_FIELD_IDS.dormitorios, field_value: args.dormitorios });
          if (args.link_propiedad) fields.push({ id: GHL_FIELD_IDS.link_propiedad, field_value: args.link_propiedad });
          if (args.ultima_propiedad_vista) fields.push({ id: GHL_FIELD_IDS.ultima_propiedad_vista, field_value: args.ultima_propiedad_vista });

          if (fields.length > 0) {
            await updateContactFields(contactId, fields);
          }
          // Save forma_pago and timeline as GHL tags (no dedicated field IDs)
          if (args.forma_pago) await addContactTag(contactId, `pago_${args.forma_pago}`);
          if (args.timeline) await addContactTag(contactId, `timeline_${args.timeline}`);

          return { success: true, updated: args };
        }
      }),

      add_ghl_tag: tool({
        description: 'Añade una etiqueta al contacto. Ej: "busqueda_activa", "quiere visitar", "sin_resultados_internos".',
        parameters: z.object({ tag: z.string() }),
        execute: async (args) => {
          await addContactTag(contactId, args.tag);
          return { success: true, tag: args.tag };
        }
      }),

      seleccionar_propiedad: tool({
        description: 'Llamar cuando el cliente elige una propiedad de la lista (ej: "me interesa la primera", "quiero ver la 2"). Guarda automáticamente todos los datos de esa propiedad en GHL.',
        parameters: z.object({
          numero: z.number().describe('Posición en la lista que eligió el cliente: 1, 2, 3…'),
          timeline: z.enum(['ahora', '6_meses', '1_anio']).optional().describe('Urgencia de compra'),
        }),
        execute: async (args) => {
          const prop = lastSearchResults[args.numero - 1];
          if (!prop) return { error: `No hay propiedad número ${args.numero} en los resultados actuales.` };

          const fields: { id: string; field_value: any }[] = [
            { id: GHL_FIELD_IDS.propiedad_de_interes, field_value: prop.titulo },
            { id: GHL_FIELD_IDS.propiedad_tokko_id, field_value: prop.tokko_id },
            { id: GHL_FIELD_IDS.titulo_propiedad, field_value: prop.titulo },
            { id: GHL_FIELD_IDS.score_lead, field_value: 'caliente' },
          ];
          if (prop.precio) fields.push({ id: GHL_FIELD_IDS.precio_propiedad, field_value: prop.precio });
          const ubicacion = prop.direccion || prop.barrio;
          if (ubicacion) fields.push({ id: GHL_FIELD_IDS.ubicacion_propiedad, field_value: ubicacion });
          if (prop.dormitorios) fields.push({ id: GHL_FIELD_IDS.dormitorios, field_value: prop.dormitorios });
          if (prop.ficha_tokko) fields.push({ id: GHL_FIELD_IDS.link_propiedad, field_value: prop.ficha_tokko });

          await updateContactFields(contactId, fields);
          await addContactTag(contactId, 'quiere_visitar');
          if (args.timeline) await addContactTag(contactId, `timeline_${args.timeline}`);

          console.log(`✅ seleccionar_propiedad: tokko_id=${prop.tokko_id}, titulo="${prop.titulo}"`);
          return { success: true, tokko_id: prop.tokko_id, titulo: prop.titulo };
        }
      })
    }
  });

  // Track token usage
  const usage = result.usage;
  if (usage) {
    const cost = estimateCost(modelId, usage.promptTokens, usage.completionTokens);
    logUsage(contactId, modelId, usage.promptTokens, usage.completionTokens, cost).catch(() => {});
    console.log(`💰 Tokens: ${usage.promptTokens}+${usage.completionTokens} = ${usage.totalTokens} (~$${cost.toFixed(4)})`);
  }

  // Strip any inline image markdown the model may have included
  const cleanText = result.text.replace(/!\[(?:Foto|Imagen|foto|imagen)[^\]]*\]\(https?:\/\/[^)]+\)\n?/g, '').trim();

  // Fall back to cached cards if a search was performed but yielded no cards
  let cards = collectedCards;
  if (searchPerformed && cards.length === 0) {
    cards = await getContactImages(contactId);
    console.log(`📦 Using cached cards for ${contactId}: ${cards.length}`);
  }
  console.log(`📤 Returning ${cards.length} cards for ${contactId}`);

  return { text: cleanText, images: cards };
}

export async function handleStaleOpportunity(contactId: string, history: CoreMessage[]): Promise<{ text: string }> {
  const messages: CoreMessage[] = [
    ...history,
    {
      role: 'user',
      content: "SYSTEM_NOTE: El cliente no ha respondido en las últimas horas. Generá un mensaje muy breve, amable y no invasivo para retomar la conversación ofreciendo tu ayuda o consultando si sigue buscando propiedades. No envíes más de 2 oraciones."
    }
  ];

  const systemPrompt = await getSystemPrompt();
  const modelId = await getModelId();
  const result = await generateText({
    model: openai(modelId),
    system: systemPrompt,
    messages,
    maxSteps: 1,
  });

  const usage = result.usage;
  if (usage) {
    const cost = estimateCost(modelId, usage.promptTokens, usage.completionTokens);
    logUsage(contactId, modelId, usage.promptTokens, usage.completionTokens, cost).catch(() => {});
  }

  return { text: result.text.trim() };
}
