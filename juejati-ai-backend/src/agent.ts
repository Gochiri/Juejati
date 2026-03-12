import { openai } from '@ai-sdk/openai';
import { generateText, tool, CoreMessage, embed } from 'ai';
import { z } from 'zod';
import { searchProperties } from './db.js';
import { searchZonaPropScraper } from './scraper.js';
import { addContactTag, updateContactFields } from './ghl.js';

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

const systemPrompt = `
Sos Sofía, asesora virtual de Juejati Brokers con 10 años de experiencia en el mercado inmobiliario argentino.

════════════════════ REGLAS GENERALES ════════════════════

- Respondé en español argentino neutro, con empatía y mensajes breves (máx. dos frases por turno).
- Ortografía impecable; todas las preguntas llevan «¿?» de apertura y cierre.
- No podés agendar visitas por ti misma. La coordinación de visitas la realiza un humano.

════════════════════ FLUJO DE CONVERSACIÓN ════════════════════

1. Si no tenés el nombre → «Hola, soy Sofía de Juejati Brokers. ¿Cómo te llamás?»
2. Si no tenés la zona → «¿En qué zona estás buscando?»
3. Si no tenés el tipo → «¿Buscás casa o departamento?»
4. Si no tenés ambientes → «¿Cuántos ambientes necesitás?»
5. Si no tenés presupuesto → «¿Cuál es tu presupuesto máximo en dólares?»

Inferencia de operación:
- Presupuesto > USD 80.000 → venta
- Presupuesto < USD 80.000 → alquiler
- Si menciona "comprar"/"invertir" → venta
- Si menciona "alquilar"/"rentar" → alquiler

════════════════════ BÚSQUEDA ════════════════════

Cuando tengas zona, tipo, ambientes, presupuesto y operación:
1. Usá 'search_internal_properties' INMEDIATAMENTE. No anuncies que vas a buscar.
2. Si no hay resultados internos, usá 'fallback_zonaprop_scraper'.
3. Si tampoco hay resultados externos, informá al cliente que un asesor se comunicará.

════════════════════ FORMATO DE RESULTADOS ════════════════════

Encontré estas opciones en [zona]:

1) **[Título]**
   💰 USD [precio]
   📍 [dirección/barrio]
   🏠 [ambientes] amb · [superficie] m²
   🔗 [link_web o ficha_tokko]

SIEMPRE terminá con: «¿Te interesa alguna? ¿Querés que busque en otras zonas?»

════════════════════ ACTUALIZACIÓN DE DATOS ════════════════════

Cada vez que obtengas info nueva del cliente (zona, presupuesto, tipo, etc.),
usá 'update_ghl_contact' para guardar esos datos en el CRM.
Usá 'add_ghl_tag' para etiquetar según corresponda (ej: "busqueda_activa", "quiere visitar").

════════════════════ AGENDAMIENTO ════════════════════

Si el cliente quiere ver una propiedad:
1. Preguntá: «¿Pensás comprar en efectivo o con crédito?»
2. Indicá que un asesor humano se va a comunicar para coordinar la visita.
3. Usá add_ghl_tag con "quiere visitar" y update_ghl_contact con la propiedad de interés.
`;

async function getEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: text,
  });
  return embedding;
}

export async function runAgent(contactId: string, history: CoreMessage[], userMessage: string) {
  const messages: CoreMessage[] = [
    ...history,
    { role: 'user', content: userMessage }
  ];

  const result = await generateText({
    model: openai('gpt-4o-mini'),
    system: systemPrompt,
    messages,
    maxSteps: 5,
    tools: {
      search_internal_properties: tool({
        description: 'Búsqueda semántica en la base de datos interna de propiedades (Supabase/Tokko). Usar siempre primero.',
        parameters: z.object({
          zona: z.string().optional().describe('Barrio o zona. Ej: Palermo, Recoleta'),
          tipo: z.string().optional().describe('Tipo de propiedad: departamento, casa, local comercial, terreno'),
          operacion: z.string().optional().describe('venta o alquiler'),
          ambientes: z.number().optional().describe('Cantidad de ambientes'),
          presupuesto_max: z.number().optional().describe('Presupuesto máximo en USD'),
          query_semantica: z.string().describe('Frase natural de búsqueda. Ej: Departamento luminoso con balcón en Palermo')
        }),
        execute: async (args) => {
          const embedding = await getEmbedding(args.query_semantica);
          const results = await searchProperties(embedding, {
            operacion: args.operacion,
            tipo: args.tipo,
            ambientes: args.ambientes,
            barrio: args.zona,
            presupuesto_max: args.presupuesto_max,
          });
          return results;
        }
      }),

      fallback_zonaprop_scraper: tool({
        description: 'Búsqueda externa en ZonaProp. Usar SOLO cuando search_internal_properties no devuelve resultados.',
        parameters: z.object({
          zona: z.string().optional(),
          tipo: z.string().optional(),
          operacion: z.string().optional()
        }),
        execute: async (args) => {
          return await searchZonaPropScraper({
            barrio: args.zona,
            tipo: args.tipo,
            operacion: args.operacion
          });
        }
      }),

      update_ghl_contact: tool({
        description: 'Actualiza los campos del contacto en el CRM cuando obtenés nueva información del cliente.',
        parameters: z.object({
          zona: z.string().optional().describe('Zona de interés del cliente'),
          presupuesto: z.number().optional().describe('Presupuesto en USD'),
          tipo_propiedad: z.string().optional().describe('departamento, casa, local comercial'),
          ambientes: z.number().optional().describe('Cantidad de ambientes'),
          operacion: z.string().optional().describe('venta o alquiler'),
          propiedad_de_interes: z.string().optional().describe('Título o ID de propiedad que le interesó'),
          propiedad_tokko_id: z.number().optional().describe('Tokko ID de la propiedad de interés'),
          caracteristicas: z.string().optional().describe('Características deseadas por el cliente'),
        }),
        execute: async (args) => {
          const fields: { id: string; field_value: any }[] = [];

          if (args.zona) fields.push({ id: GHL_FIELD_IDS.zona, field_value: args.zona });
          if (args.presupuesto) fields.push({ id: GHL_FIELD_IDS.presupuesto_ia, field_value: args.presupuesto });
          if (args.tipo_propiedad) fields.push({ id: GHL_FIELD_IDS.tipo_propiedad, field_value: args.tipo_propiedad });
          if (args.ambientes) fields.push({ id: GHL_FIELD_IDS.ambientes, field_value: String(args.ambientes) });
          if (args.operacion) fields.push({ id: GHL_FIELD_IDS.operacion, field_value: args.operacion });
          if (args.propiedad_de_interes) fields.push({ id: GHL_FIELD_IDS.propiedad_de_interes, field_value: args.propiedad_de_interes });
          if (args.propiedad_tokko_id) fields.push({ id: GHL_FIELD_IDS.propiedad_tokko_id, field_value: args.propiedad_tokko_id });
          if (args.caracteristicas) fields.push({ id: GHL_FIELD_IDS.caracteristicas_deseadas, field_value: args.caracteristicas });

          if (fields.length > 0) {
            await updateContactFields(contactId, fields);
          }
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

  return result.text;
}
