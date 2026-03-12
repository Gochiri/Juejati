import { openai } from '@ai-sdk/openai';
import { generateText, tool, CoreMessage } from 'ai';
import { z } from 'zod';
import { searchProperties } from './db.js';
import { searchZonaPropScraper } from './scraper.js';
import { addContactTag, updateContactFields } from './ghl.js';

const systemPrompt = `
Eres Sofía, asesora virtual de Juejati Brokers con 10 años de experiencia. 
Tu función es asistir consultas sobre propiedades, calificar necesidades y 
mostrar opciones usando tools internos.

No puedes agendar visitas por ti misma. La coordinación de visitas la realiza un humano.
Usa las herramientas disponibles para buscar propiedades. 

REGLAS DE BÚSQUEDA:
1. Usa 'search_internal_properties' primero.
2. Si 'search_internal_properties' no devuelve resultados o devuelve muy pocos, usa 'fallback_zonaprop_scraper' para buscar externamente.
3. Si la búsqueda externa tampoco tiene éxito, informa al cliente que no tienes opciones exactas en este momento pero que un asesor se comunicará con ellos.
4. Etiqueta al cliente y actualiza sus campos mediante 'update_ghl_contact' y 'add_ghl_tag' si obtienes nueva información (presupuesto, zona, etc).
`;

// Helper to generate a fake embedding for testing purposes (ideally use openai.embedding here)
async function getEmbedding(text: string) {
  // Mock! Must be implemented with actual text-embedding model in production
  return new Array(1536).fill(0.01);
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
    maxSteps: 5, // Allow multi-step tool calls
    tools: {
      search_internal_properties: tool({
        description: 'Búsqueda vectorial en la base de datos interna de propiedades (Supabase/Tokkobroker).',
        parameters: z.object({
          zona: z.string().optional().describe('Barrio o zona. Ej. Palermo'),
          tipo: z.string().optional().describe('Tipo de propiedad. Ej. departamento, casa'),
          operacion: z.string().optional().describe('venta o alquiler'),
          ambientes: z.number().optional().describe('Cantidad de ambientes. Ej 2, 3'),
          presupuesto_max: z.number().optional().describe('Presupuesto máximo en dolares'),
          query_semantica: z.string().describe('Frase natural de búsqueda con características. Ej. Departamento luminoso con balcón en Palermo')
        }),
        execute: async (args) => {
          const embedding = await getEmbedding(args.query_semantica);
          const results = await searchProperties(embedding, {
            operacion: args.operacion,
            tipo: args.tipo,
            ambientes: args.ambientes
          });
          return results;
        }
      }),

      fallback_zonaprop_scraper: tool({
        description: 'Búsqueda externa en ZonaProp cuando la búsqueda interna no devuelve resultados.',
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
        description: 'Actualiza los campos personalizados del contacto en GHL una vez que sabemos sus preferencias.',
        parameters: z.object({
          zona_de_interes: z.string().optional(),
          presupuesto: z.number().optional(),
          tipo_propiedad: z.string().optional(),
          ambientes: z.number().optional(),
        }),
        execute: async (args) => {
          const fields = [];
          // Note: Real IDs must replace these dummy strings based on the GHL account
          if (args.zona_de_interes) fields.push({ id: 'ZONA_ID', field_value: args.zona_de_interes });
          if (args.presupuesto) fields.push({ id: 'PRESUPUESTO_ID', field_value: args.presupuesto });
          
          if (fields.length > 0) {
            await updateContactFields(contactId, fields);
          }
          return { success: true, updated: args };
        }
      }),

      add_ghl_tag: tool({
        description: 'Añade una etiqueta al contacto. Ej: "busqueda_activa", "sin_resultados_internos".',
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
