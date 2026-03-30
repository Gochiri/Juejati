# Juejati AI Backend — CLAUDE.md

## Descripción del proyecto

Backend del asistente virtual **Sofía** para **Juejati Brokers** (inmobiliaria argentina).
Recibe mensajes de leads via webhook de GoHighLevel (WhatsApp/SMS), corre un agente LLM que busca propiedades y responde, y sincroniza el catálogo desde Tokko Broker hacia Supabase.

---

## Stack

- **Runtime**: Node.js + TypeScript (ESM, `"type": "module"`)
- **Framework**: Express
- **LLM**: OpenAI `gpt-4o-mini` via Vercel AI SDK (`ai`, `@ai-sdk/openai`)
- **Embeddings**: OpenAI `text-embedding-3-small` (1536 dims)
- **DB**: PostgreSQL (Supabase) con extensión `pgvector`
- **CRM**: GoHighLevel (GHL) via API REST
- **Scraper fallback**: Servicio interno `zonaprop-scraper` en el mismo Swarm
- **Deploy**: Docker Swarm + Traefik en `agent.korvance.com`

---

## Estructura de archivos

```
src/
  index.ts    — Express server, endpoints, sync scheduler
  agent.ts    — Agente Sofía (generateText + tools con Vercel AI SDK)
  db.ts       — Pool pg, searchProperties (vectorial), upsertProperty, contact images
  ghl.ts      — API GoHighLevel: getConversationHistory, sendMessage, addContactTag, updateContactFields
  scraper.ts  — Cliente HTTP al servicio zonaprop-scraper
  sync.ts     — Sync Tokko → embed → Supabase (corre al inicio y cada 6h)
schema.sql    — DDL completo: tabla propiedades_v2, índices HNSW, función match_propiedades_v2
seed.sql      — Datos de prueba
```

---

## Endpoints

| Método | Path | Descripción |
|--------|------|-------------|
| POST | `/webhook/ghl` | Webhook principal de GHL — recibe mensajes entrantes |
| POST | `/api/followup` | Follow-up para oportunidades sin respuesta (llamado desde workflow GHL) |
| POST | `/sync` | Dispara sync manual Tokko → Supabase |
| GET | `/health` | Health check |

### Flujo del webhook `/webhook/ghl`
1. Responde 200 inmediatamente (evita retries de GHL)
2. Obtiene historial de la conversación (últimos 10 mensajes)
3. Corre `runAgent()` → devuelve `{ text, images }`
4. Envía texto vía `sendMessage()`
5. Envía cada imagen como mensaje separado con attachment

---

## Agente Sofía (`agent.ts`)

El agente usa `generateText` con `maxSteps: 5` y estos tools:

| Tool | Cuándo usarlo |
|------|---------------|
| `search_internal_properties` | Siempre primero — búsqueda vectorial en Supabase |
| `fallback_zonaprop_scraper` | Solo si el interno no devuelve resultados |
| `update_ghl_contact` | Cada vez que el cliente da info nueva (zona, presupuesto, tipo, etc.) |
| `add_ghl_tag` | Para etiquetar leads (ej: `busqueda_activa`, `quiere visitar`) |

**Datos guardados en GHL** (custom field IDs hardcodeados en `GHL_FIELD_IDS`):
`zona`, `operacion`, `presupuesto_ia`, `ambientes`, `dormitorios`, `tipo_propiedad`,
`propiedad_de_interes`, `propiedad_tokko_id`, `caracteristicas_deseadas`, `ultima_propiedad_vista`,
`titulo_propiedad`, `precio_propiedad`, `ubicacion_propiedad`, `score_lead`

**Location GHL**: `WWrBqekGJCsCmSSvPzEf`

**Lógica de imágenes**:
- Las imágenes se recolectan durante el tool call y se persisten en `contact_last_images`
- Si no hay imágenes nuevas en el turno, se devuelven las del cache de la última búsqueda
- Se envían como mensajes separados (attachment-only), no embebidas en el texto

---

## Base de datos (Supabase + pgvector)

### Tabla `propiedades_v2`
Columnas clave: `tokko_id` (unique), `titulo`, `tipo`, `operacion`, `barrio`, `precio`, `moneda`, `ambientes`, `imagen`, `embedding vector(1536)`, `activa`

### Función RPC `match_propiedades_v2`
Búsqueda vectorial con filtros opcionales: `operacion`, `tipo`, `ambientes`, `barrio`, `precio_max`.
Threshold por defecto: `0.5` (en `db.ts`), definido como `0.3` en la función SQL.

### Tabla `contact_last_images`
Cache de imágenes por contacto: `contact_id` (unique), `images jsonb`, `updated_at`

---

## Sincronización Tokko → Supabase (`sync.ts`)

1. Pagina Tokko API (`/api/v1/property`, limit=200, lang=es_ar)
2. Transforma cada propiedad → genera `embedding_text` natural
3. Genera embedding con `text-embedding-3-small`
4. Upsert en `propiedades_v2` (conflict on `tokko_id`)
5. Marca como `activa = false` las que ya no están en Tokko
6. Corre automáticamente cada 6 horas via `setInterval`

**Regla de precio**: alquiler → ARS, venta → USD

---

## Variables de entorno (`.env`)

```
PORT=4000
OPENAI_API_KEY=sk-...
GHL_API_KEY=eyJhb...
GHL_LOCATION_ID=...          # usado en sendMessage
GHL_FROM_NUMBER=...          # número desde el que se envían mensajes
DATABASE_URL=postgresql://...
SCRAPER_API_URL=http://zonaprop-scraper:3000/api/search
TOKKO_API_KEY=...
SYNC_SECRET=...             # Bearer token para POST /sync (requerido para auth)
```

---

## Comandos

```bash
npm run dev       # desarrollo con hot-reload (tsx watch)
npm run build     # compilar TypeScript → dist/
npm start         # producción (node dist/index.js)
```

---

## Deploy

Desplegado como servicio Docker Swarm en la red `korvancenet`.
Traefik maneja TLS y routing en `agent.korvance.com`.

```bash
# Rebuild y redeploy en el swarm
docker build -t juejati-ai-backend:latest .
docker service update --image juejati-ai-backend:latest juejati-ai-agent
```

---

## Estado de implementación (~90%)

### Completo

| Módulo | Estado |
|--------|--------|
| Webhook GHL → respuesta WhatsApp/SMS | ✅ |
| Agente Sofía (flujo de preguntas, búsqueda, respuesta) | ✅ |
| Búsqueda vectorial interna (Supabase + pgvector) | ✅ |
| Fallback scraper ZonaProp + rebranded URLs | ✅ |
| Sync Tokko → Supabase (automático cada 6h) | ✅ |
| Guardar datos del lead en GHL (custom fields + tags) | ✅ |
| Envío de imágenes como attachments separados | ✅ |
| Cache de imágenes por contacto (`contact_last_images`) | ✅ |
| Follow-up de oportunidades estancadas | ✅ |
| Deploy Docker Swarm + Traefik | ✅ |

### Issues resueltos (marzo 2026)

| Issue | Solución |
|-------|----------|
| `GHL_LOCATION_ID`/`GHL_FROM_NUMBER` ausentes | Validación al startup con `process.exit(1)` |
| Bug "no puedo enviar fotos" | `_system_note` en tool result + refuerzo en system prompt |
| Respuestas vacías del agente | Skip de `sendMessage` cuando texto es vacío |
| `/sync` sin autenticación | Bearer token via `SYNC_SECRET` env var |
| `score_lead` nunca se escribe | Nuevo param en `update_ghl_contact` (frio/tibio/caliente) |
| Threshold inconsistente | Unificado a `0.35` en `db.ts` |

### Descartado

- `link_web` vacío en `sync.ts` — Tokko no expone la URL del sitio propio; se usa `ficha_tokko` como link de referencia.

---

## Convenciones

- El agente responde en **español argentino**, mensajes cortos (máx. 2 frases por turno)
- Nunca anunciar que "va a buscar" — ejecutar el tool directamente
- Nunca mostrar URLs de ZonaProp directamente; usar `rebrandedUrl`
- Los tipos de canal GHL: `20` = WhatsApp, `1` = SMS, `3` = Email
- GHL a veces anida los mensajes: `msgData.messages.messages` — ver `ghl.ts:33`
