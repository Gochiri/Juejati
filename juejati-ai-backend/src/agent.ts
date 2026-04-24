import { openai } from '@ai-sdk/openai';
import { generateText, tool, CoreMessage, embed } from 'ai';
import { z } from 'zod';
import { searchProperties, saveContactImages, getContactImages } from './db.js';
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

Encontré estas opciones en [zona]:

1) **[Título]**
   💰 [precio] (si no hay precio → «Consultar»)
   📍 [dirección/barrio]
   🏠 [ambientes] amb · [superficie] m²
   🔗 [link_web]

⚠️ SIEMPRE mostrá el precio. Si el dato no está disponible, escribí «Consultar» — nunca omitas la línea de precio.
SIEMPRE terminá con: «¿Te interesa alguna? ¿Querés que busque en otras zonas?»

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

Cuando el cliente eligió una propiedad específica (dijo "me gusta
la X", "quiero info de esa", "más información"):

1. NO hagas una nueva búsqueda.
2. Usá los datos que ya tenés en la conversación: título, precio,
   dirección, superficie, link.
3. Respondé con lo que sabés de esa propiedad.
4. Si el cliente pide FOTO específicamente → ahí sí llamá
   search_internal_properties con el tokko_id que ya guardaste.
5. Si el cliente quiere visitarla → add_ghl_tag("quiere visitar")
   + update_ghl_contact con propiedad_de_interes y timeline.

NUNCA uses fallback_zonaprop_scraper para "más información" —
ese tool es solo para cuando no hay resultados internos en la
búsqueda inicial.

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

export async function runAgent(contactId: string, history: CoreMessage[], userMessage: string): Promise<{ text: string; images: string[] }> {
  const messages: CoreMessage[] = [
    ...history,
    { role: 'user', content: userMessage }
  ];

  const collectedImages: string[] = [];
  let searchPerformed = false;
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
          // Collect image URLs for attachments — cap total across all tools at 3
          searchPerformed = true;
          const remaining = Math.max(0, 3 - collectedImages.length);
          const imgs = results.filter((r: any) => r.imagen).map((r: any) => r.imagen).slice(0, remaining);
          console.log(`🔍 Tool results: ${results.length} properties, ${imgs.length} images: ${JSON.stringify(imgs)}`);
          collectedImages.push(...imgs);
          if (imgs.length > 0) {
            await saveContactImages(contactId, imgs);
          }
          return {
            properties: results,
            _zona_note: !zonaExacta && args.zona
              ? `No hay propiedades exactas en "${args.zona}" en nuestra base. Estos son los más cercanos disponibles — aclaráselo al cliente y ofrecé buscar en zonas alternativas.`
              : undefined,
            _system_note: imgs.length > 0
              ? `${imgs.length} foto(s) se enviarán automáticamente al cliente. NO digas que no podés enviar fotos.`
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
          // Collect images — cap total across all tools at 3
          searchPerformed = true;
          const remaining = Math.max(0, 3 - collectedImages.length);
          const imgs = properties.filter((r: any) => r.image).map((r: any) => r.image).slice(0, remaining);
          collectedImages.push(...imgs);
          if (imgs.length > 0) {
            await saveContactImages(contactId, imgs);
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
          propiedad_tokko_id: z.number().optional().describe('Tokko ID de la propiedad de interés'),
          caracteristicas: z.string().optional().describe('Características deseadas por el cliente'),
          forma_pago: z.enum(['contado', 'credito']).optional().describe('Forma de pago declarada: contado o credito'),
          timeline: z.enum(['ahora', '6_meses', '1_anio']).optional().describe('Urgencia de compra: ahora (0-3 meses), 6_meses, o 1_anio'),
          score_lead: z.enum(['frio', 'tibio', 'caliente']).optional().describe('Score del lead: "frio" (solo pregunta), "tibio" (dio datos concretos de búsqueda), "caliente" (quiere visitar o comprar)'),
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

  // Extract image URLs from markdown patterns in text: ![Foto](url) or ![Imagen](url)
  const inlineImageRegex = /!\[(?:Foto|Imagen|foto|imagen)[^\]]*\]\((https?:\/\/[^)]+)\)/g;
  let match;
  while ((match = inlineImageRegex.exec(result.text)) !== null) {
    if (!collectedImages.includes(match[1])) collectedImages.push(match[1]);
  }
  // Strip inline image markdown from text
  const cleanText = result.text.replace(/!\[(?:Foto|Imagen|foto|imagen)[^\]]*\]\(https?:\/\/[^)]+\)\n?/g, '').trim();

  // Only return cached images if a search was performed this turn but yielded no images
  let images = collectedImages;
  if (searchPerformed && images.length === 0) {
    images = await getContactImages(contactId);
    console.log(`📦 Using cached images for ${contactId}: ${images.length}`);
  }
  console.log(`📤 Returning ${images.length} images for ${contactId}`);

  return { text: cleanText, images };
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
