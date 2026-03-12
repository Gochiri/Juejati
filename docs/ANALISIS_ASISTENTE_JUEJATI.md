# 🤖 ANÁLISIS TÉCNICO: ASISTENTE JUEJATI

**Sistema:** Asistente de IA conversacional para búsqueda y consulta de propiedades  
**Cliente:** Juejati Brokers  
**Plataforma:** n8n + LangChain + Supabase Vector DB + Tokko Broker API  
**Fecha:** Enero 2026

---

## 📋 TABLA DE CONTENIDOS

1. [Arquitectura General](#arquitectura-general)
2. [Workflow Principal](#workflow-principal)
3. [Sub-workflow: Búsqueda de Propiedades](#sub-workflow-búsqueda-de-propiedades)
4. [Sistema de Prompts y Agentes](#sistema-de-prompts-y-agentes)
5. [Flujo de Conversación](#flujo-de-conversación)
6. [Integraciones](#integraciones)
7. [Análisis de Fortalezas](#análisis-de-fortalezas)
8. [Oportunidades de Mejora](#oportunidades-de-mejora)

---

## 🏗️ ARQUITECTURA GENERAL

### **Stack Tecnológico**

```
┌─────────────────────────────────────────────────────────────┐
│                    CAPA DE INTERFAZ                         │
│  WhatsApp Business API (via GHL) + Web Chat                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  CAPA DE ORQUESTACIÓN                       │
│  n8n Workflow Engine + LangChain Agent Framework            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    CAPA DE INTELIGENCIA                     │
│  OpenAI GPT-5 + Think Tool + Memory (PostgreSQL)            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     CAPA DE DATOS                           │
│  Supabase Vector DB + Tokko Broker API + GHL CRM           │
└─────────────────────────────────────────────────────────────┘
```

### **Componentes Principales**

| Componente | Tecnología | Función |
|------------|-----------|---------|
| **Workflow Engine** | n8n | Orquestación de flujos y lógica de negocio |
| **AI Agent** | LangChain + GPT-5 | Procesamiento de lenguaje natural y conversación |
| **Vector Search** | Supabase pgvector | Búsqueda semántica de propiedades |
| **Reranking** | Cohere Rerank | Mejora de relevancia en resultados |
| **Memory** | PostgreSQL | Persistencia de conversaciones |
| **CRM Integration** | GoHighLevel API | Gestión de contactos y tags |
| **Property Data** | Tokko Broker API | Fuente de datos de propiedades |

---

## 🔄 WORKFLOW PRINCIPAL

**ID:** `iHjheY856dbxTDbQ`  
**Nombre:** Asistente Juejati  
**Nodos:** 142  
**Estado:** Activo

### **Entrada: Webhook**

```
Endpoint: /webhook/Asistente_Juejati_Brokers
Método: POST
Headers: Standard n8n webhook headers

Payload esperado:
{
  "body": {
    "contact_id": "xxx",
    "first_name": "Juan",
    "phone": "+54911...",
    "email": "juan@example.com",
    "message": "Busco depto en Palermo",
    "type": "text" | "audio" | "image"
  }
}
```

### **Procesamiento de Input**

#### **1. Portal Detector**
- **Nodo:** `Portal_Detector1`
- **Función:** Detecta links de portales inmobiliarios en el mensaje
- **Portales soportados:**
  - Zonaprop
  - Argenprop
  - MercadoLibre
  - Tokko
  - Properati

#### **2. Switch por Tipo de Mensaje**
- **Nodo:** `Switch3`
- **Rutas:**
  - **Audio** → OpenAI Transcription → `Audio1`
  - **Imagen** → Gemini Vision Analysis → `Imagen1`
  - **Texto** → Direct processing → `Texto4`

#### **3. Cola con Redis**
- **Nodos:** `Redis6` → `Wait29` → `Redis7`
- **Función:** Gestión de concurrencia y prevención de duplicados
- **Queue:** Mensajes entrantes se procesan secuencialmente

### **Agente Principal: AI AGENT1**

#### **Configuración**

```json
{
  "model": "GPT-5",
  "name": "Sofía",
  "role": "Asesora virtual de Juejati Brokers",
  "temperature": 0.7,
  "maxTokens": 2000
}
```

#### **System Prompt (Resumen)**

**Personalidad:**
- Nombre: Sofía
- Experiencia: 10 años en real estate
- Tono: Español argentino neutro, empática, profesional
- Respuestas: Máximo 2 frases
- Una pregunta por mensaje

**Regla de Oro Anti-Alucinación:**
> Si no tenés un dato confirmado por el usuario o por tools, decí que no podés confirmarlo y pedí 1 dato para avanzar.

**Tools Disponibles:**
1. `think` - Memoria de trabajo para tracking de parámetros
2. `propiedades` - Búsqueda vectorial en Supabase
3. `resumen_info` - Guardar calificación en GHL
4. `añadir_etiquetas` - Tagging de contactos
5. `get_zona1` - Validación de zonas

#### **Captura de Datos Iniciales (vía Think)**

```javascript
// Datos capturados del webhook
{
  contact_id: "{{ $('Webhook1').item.json.body.contact_id }}",
  first_name: "{{ $('Webhook1').item.json.body.first_name }}",
  phone: "{{ $('Webhook1').item.json.body.phone }}",
  email: "{{ $('Webhook1').item.json.body.email }}"
}
```

**Parámetros de Búsqueda Trackeados:**
- `queryzona` - Zona de búsqueda
- `querypropiedad` - Tipo de propiedad
- `queryambientes` - Cantidad de ambientes
- `querybudget_num` - Presupuesto
- `querymoneda` - Moneda (USD/ARS)
- `queryoperacion` - Venta o Alquiler
- `query_referencia` - Para búsquedas específicas

### **Sistema de Router (5 Modos de Operación)**

El agente usa un router interno para clasificar la intención antes de responder:

#### **MODO 1: FICHA_PRIMER_MENSAJE**

**Trigger:** Usuario comparte link/ficha de propiedad con título, barrio, precio

**Acción:**
```
✓ Ejecutar tool `propiedades` INMEDIATAMENTE
✓ NO preguntar datos redundantes
✓ Guardar con `resumen_info`:
  - zona
  - intencion
  - tipo_propiedad
  - presupuesto
  - propiedad_de_interes
  - asesor
✓ Añadir tag: like_prop
```

**Ejemplo:**
```
Usuario: "Me interesa este depto de 2 ambientes en Palermo a USD 280k"

🚫 MAL: "¿En qué zona buscás?"
✅ BIEN: [Ejecuta búsqueda] "Perfecto, te muestro opciones similares..."
```

#### **MODO 2: CONSULTA_ESPECIFICA**

**Trigger:** Referencia a propiedad específica (dirección, edificio, "el de la terraza")

**Acción:**
```
✓ Ejecutar `propiedades` con query_referencia
✓ Si demasiados resultados → preguntar 1 filtro solo
```

**Formato de Query:**
```
query_referencia: "edificio libertador 3000"
```

#### **MODO 3: CONSULTA_GENERICA**

**Trigger:** Búsqueda por filtros generales

**Acción:**
```
✓ Extraer todos los filtros posibles del mensaje
✓ Inferir operación:
  - Precio > USD 10,000 = venta
  - Precio < USD 10,000 = alquiler
✓ Ejecutar cuando haya mínimo de datos
```

**Formato de Query Estructurado:**
```
zona:[X];tipo:[Y];ambientes:[Z];moneda:[M];precio_min:0;precio_max:[B];operacion:[O]
```

**Conversión de Ambientes (Argentina):**
```
1 ambiente = monoambiente (0 bedrooms)
2 ambientes = 1 bedroom
3 ambientes = 2 bedrooms
4 ambientes = 3 bedrooms
```

#### **MODO 4: SEGUIMIENTO**

**Trigger:** Usuario selecciona propiedad de resultados anteriores

**Acción:**
```
✓ Guardar con `resumen_info`:
  - propiedad_de_interes
  - Tokko_id
  - asesor
✓ Tags: like_prop, pide_visita (si aplica)
```

#### **MODO 5: OTROS**

**Trigger:** Saludos, off-topic

**Acción:**
```
✓ Responder brevemente
✓ Redirigir gentilmente a búsqueda de propiedades
```

### **Formato de Salida de Propiedades**

**FORMATO OBLIGATORIO:**
```
[Título]
Precio: [Moneda] [Monto] / "Consultar"
📍 [Barrio/zona]
🖼️ [imagen URL] - SIEMPRE incluir
🔗 Ver ficha completa: [link_web]

¿[Pregunta final obligatoria]?
```

**Ejemplo Real:**
```
[Departamento luminoso con balcón en Palermo Soho]
Precio: USD 320,000
📍 Palermo Soho
🖼️ https://tokkobroker.com/images/prop123.jpg
🔗 Ver ficha completa: https://ficha.info/prop/123

¿Te interesa coordinar una visita?
```

### **Regla CRÍTICA: Coordinación de Visitas**

```
🚫 EL ASISTENTE NO PUEDE AGENDAR VISITAS

Respuesta obligatoria:
"Perfecto. Yo no puedo coordinar visitas; eso lo maneja un asesor 
del equipo. ¿Querés que te lo derive para que te proponga horarios?"

Acción: Tag "asistencia_humana" + derivación a asesor
```

### **Procesamiento de Output (Nodo Code)**

**Función:** Parsear la respuesta del agente y estructurar mensajes

**Detecta 2 Formatos:**

1. **Formato Markdown** (legacy):
```
1) **Título**
Precio: USD 300,000
![imagen](url)
[Ver ficha](url)
```

2. **Formato Corchetes** (actual):
```
[Título]
Precio: USD 300,000
📍 Palermo
🖼️ url_imagen
🔗 url_ficha
```

**Output Estructurado:**
```javascript
[
  {
    tipo: 'cabecera',
    mensaje: 'Texto introductorio'
  },
  {
    tipo: 'propiedad',
    mensaje: 'Título - Precio',
    propiedad_index: 1,
    titulo: '...',
    precio: 'USD 300,000',
    ubicacion: 'Palermo',
    ficha: 'https://...',
    message_attachments: [
      { type: 'image', url: '...' },
      { type: 'link', url: '...', title: 'Ver ficha completa' }
    ]
  },
  {
    tipo: 'pregunta_final',
    mensaje: '¿Te interesa alguna?'
  }
]
```

### **Switch de Salida (Switch4)**

**Rutas por tipo:**
- `cabecera` → Texto simple sin adjuntos
- `propiedad` → Con imágenes y links
- `pregunta_final` → Texto de cierre

### **Envío de Mensajes**

**Nodo:** `Envio de Propiedades2`

**Lógica:**
```
If17: ¿Tiene attachments?
  ├─ Sí → Enviar con imágenes y links
  └─ No → Enviar solo texto

Wait23: Delay entre mensajes (evitar spam)

Redis5: Limpiar cola después de envío
```

---

## 🔍 SUB-WORKFLOW: BÚSQUEDA DE PROPIEDADES

**ID:** `WTHzGoaGFU4xRQY3`  
**Nombre:** sub: Buscar Propiedades  
**Nodos:** 7  
**Estado:** Activo

### **Arquitectura del Sub-workflow**

```
┌────────────────────────────────────────────────────────┐
│  ENTRADA: Workflow Trigger                             │
│  Recibe: query_id, query                               │
└────────────────────────────────────────────────────────┘
              ↓
┌────────────────────────────────────────────────────────┐
│  PASO 1: Parse Query Type                              │
│  Detecta: structured vs freetext                       │
└────────────────────────────────────────────────────────┘
              ↓
┌────────────────────────────────────────────────────────┐
│  PASO 2: Code in JavaScript1                           │
│  Extrae filtros del query estructurado                 │
└────────────────────────────────────────────────────────┘
              ↓
┌────────────────────────────────────────────────────────┐
│  PASO 3: Supabase Vector Store                         │
│  Búsqueda semántica con embeddings                     │
│  + Cohere Reranking                                    │
└────────────────────────────────────────────────────────┘
              ↓
┌────────────────────────────────────────────────────────┐
│  PASO 4: filtro (Code)                                 │
│  Aplicar filtros exactos post-búsqueda                 │
└────────────────────────────────────────────────────────┘
              ↓
┌────────────────────────────────────────────────────────┐
│  SALIDA: {success, total, propiedades[]}               │
└────────────────────────────────────────────────────────┘
```

### **Paso 1: Parse Query Type**

**Código JavaScript:**
```javascript
const query = $json.query || '';
const queryId = $json.query_id || '';

// Detectar tipo
const isStructuredQuery = query.includes(':') && query.includes(';');

let searchQuery = '';
let queryType = '';

if (isStructuredQuery) {
  // TIPO A: Query estructurado
  queryType = 'structured';
  
  // Parsear parámetros
  const params = {};
  query.split(';').forEach(pair => {
    const [key, value] = pair.split(':');
    if (key && value) params[key] = value;
  });
  
  // Construir query de texto para búsqueda vectorial
  const parts = [];
  if (params.tipo) parts.push(params.tipo);
  if (params.ambientes) parts.push(`${params.ambientes} ambientes`);
  if (params.zona) parts.push(`en ${params.zona}`);
  if (params.operacion) parts.push(params.operacion);
  if (params.moneda && params.precio_max && params.precio_max !== '9999999') {
    parts.push(`hasta ${params.moneda} ${params.precio_max}`);
  }
  if (params.caracteristicas) parts.push(params.caracteristicas);
  
  searchQuery = parts.join(' ');
  
} else {
  // TIPO B: Query de texto libre
  queryType = 'freetext';
  searchQuery = query;
}

return [{
  json: {
    query_id: queryId,
    original_query: query,
    search_query: searchQuery,
    query_type: queryType
  }
}];
```

**Ejemplo:**

**Input estructurado:**
```
query: "zona:palermo;tipo:departamento;ambientes:4;moneda:USD;precio_max:350000;operacion:venta"
```

**Output:**
```javascript
{
  search_query: "departamento 4 ambientes en palermo venta hasta USD 350000",
  query_type: "structured"
}
```

**Input texto libre:**
```
query: "busco un depto con terraza en belgrano"
```

**Output:**
```javascript
{
  search_query: "busco un depto con terraza en belgrano",
  query_type: "freetext"
}
```

### **Paso 2: Extracción de Filtros**

**Código JavaScript:**
```javascript
const query = $json.original_query || '';
const filters = {};

// Parsear filtros del query estructurado
if (query.includes(';')) {
  query.split(';').forEach(pair => {
    const [key, value] = pair.split(':');
    if (key && value) filters[key.trim()] = value.trim();
  });
}

// Construir objeto de filtros limpios
const cleanFilters = {
  ambientes: filters.ambientes ? parseInt(filters.ambientes) : null,
  precio_max: (filters.precio_max && filters.precio_max !== '9999999') 
    ? parseInt(filters.precio_max) 
    : null,
  precio_min: (filters.precio_min && filters.precio_min !== '0') 
    ? parseInt(filters.precio_min) 
    : null,
  zona: filters.zona || null,
  operacion: filters.operacion || null,
  tipo: filters.tipo || null,
  moneda: filters.moneda || null
};

return [{
  json: {
    query_id: queryId,
    search_query: searchQuery,
    query_type: queryType,
    filters: cleanFilters,
    // Filtros individuales para fácil acceso
    filter_ambientes: cleanFilters.ambientes,
    filter_precio_max: cleanFilters.precio_max,
    filter_zona: cleanFilters.zona,
    filter_operacion: cleanFilters.operacion,
    filter_tipo: cleanFilters.tipo
  }
}];
```

### **Paso 3: Búsqueda Vectorial**

**Configuración Supabase Vector Store:**
```json
{
  "mode": "load",
  "tableName": "propiedades_vector",
  "prompt": "={{ $json.search_query }}",
  "topK": 10,
  "useReranker": true
}
```

**Embeddings:** OpenAI text-embedding-3-small

**Reranker:** Cohere Rerank v3

**Tabla Supabase:**
```sql
CREATE TABLE propiedades_vector (
  id UUID PRIMARY KEY,
  content TEXT,
  metadata JSONB,
  embedding vector(1536)
);

-- Index for vector search
CREATE INDEX ON propiedades_vector 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

**Metadata Structure:**
```json
{
  "metadata": {
    "tokko_id": "12345",
    "titulo": "Departamento 3 ambientes Palermo",
    "direccion": "Av. Santa Fe 3000",
    "barrio": "Palermo",
    "zona": "Palermo",
    "distrito": "CABA",
    "precio": 320000,
    "moneda": "USD",
    "ambientes": 3,
    "dormitorios": 2,
    "banos": 2,
    "cocheras": 1,
    "superficie": 85,
    "operacion": "venta",
    "imagen": "https://...",
    "link_web": "https://...",
    "asesor": "Juan Pérez"
  }
}
```

**Proceso de Búsqueda:**
```
1. Query: "departamento 3 ambientes palermo hasta USD 350000"
   ↓
2. Generate Embedding (OpenAI)
   [0.123, -0.456, 0.789, ...]
   ↓
3. Vector Similarity Search
   SELECT *, (embedding <=> query_embedding) as distance
   FROM propiedades_vector
   ORDER BY distance
   LIMIT 50
   ↓
4. Cohere Reranking
   Re-ordena los 50 resultados por relevancia semántica
   ↓
5. Return Top 10
```

### **Paso 4: Filtrado Post-Búsqueda**

**Código JavaScript:**
```javascript
const results = $input.all();

// Obtener filtros del nodo anterior
const prevData = $('Code in JavaScript1').first().json;
const filters = prevData.filters;

console.log('📋 Filtros a aplicar:', JSON.stringify(filters));
console.log('📊 Resultados de Supabase:', results.length);

const filtered = results.filter(item => {
  const meta = item.json.document?.metadata?.metadata || {};
  
  // Filtro por ambientes (exacto)
  if (filters.ambientes !== null && meta.ambientes !== filters.ambientes) {
    console.log(`❌ Excluido: ${meta.tokko_id} - ambientes ${meta.ambientes} !== ${filters.ambientes}`);
    return false;
  }
  
  // Filtro por precio máximo
  if (filters.precio_max !== null && meta.precio > filters.precio_max) {
    console.log(`❌ Excluido: ${meta.tokko_id} - precio ${meta.precio} > ${filters.precio_max}`);
    return false;
  }
  
  // Filtro por zona (contains, case insensitive)
  if (filters.zona !== null) {
    const propZona = (meta.zona || meta.barrio || meta.distrito || '').toLowerCase();
    if (!propZona.includes(filters.zona.toLowerCase())) {
      console.log(`❌ Excluido: ${meta.tokko_id} - zona ${propZona} no incluye ${filters.zona}`);
      return false;
    }
  }
  
  // Filtro por operación (exacto)
  if (filters.operacion !== null && meta.operacion?.toLowerCase() !== filters.operacion.toLowerCase()) {
    console.log(`❌ Excluido: ${meta.tokko_id} - operacion ${meta.operacion} !== ${filters.operacion}`);
    return false;
  }
  
  console.log(`✅ Incluido: ${meta.tokko_id} - ${meta.titulo}`);
  return true;
});

console.log(`📊 Resultado: ${results.length} → ${filtered.length}`);

// Formatear propiedades para salida
const propiedades = filtered.map(item => {
  const meta = item.json.document?.metadata?.metadata || {};
  return {
    tokko_id: meta.tokko_id,
    titulo: meta.titulo,
    direccion: meta.direccion,
    barrio: meta.barrio || meta.zona,
    precio: meta.precio,
    moneda: meta.moneda,
    ambientes: meta.ambientes,
    dormitorios: meta.dormitorios,
    banos: meta.banos,
    cocheras: meta.cocheras,
    imagen: meta.imagen,
    link_web: meta.link_web,
    asesor: meta.asesor,
    score: item.json.score
  };
});

return [{
  json: {
    success: propiedades.length > 0,
    total: propiedades.length,
    propiedades: propiedades
  }
}];
```

**Ejemplo de Salida:**
```json
{
  "success": true,
  "total": 3,
  "propiedades": [
    {
      "tokko_id": "12345",
      "titulo": "Departamento 3 ambientes con balcón",
      "direccion": "Av. Santa Fe 3000",
      "barrio": "Palermo",
      "precio": 320000,
      "moneda": "USD",
      "ambientes": 3,
      "dormitorios": 2,
      "banos": 2,
      "cocheras": 1,
      "imagen": "https://tokkobroker.com/images/prop12345.jpg",
      "link_web": "https://ficha.info/prop/12345",
      "asesor": "Juan Pérez",
      "score": 0.89
    },
    // ... más propiedades
  ]
}
```

---

## 🧠 SISTEMA DE PROMPTS Y AGENTES

### **Agente Principal: Sofía**

**System Prompt Completo:**

```markdown
Eres Sofía, asesora virtual de Juejati Brokers con 10 años de experiencia. 
Tu función es asistir consultas sobre propiedades, calificar necesidades y 
mostrar opciones usando tools internos.

No estableces citas ni visitas, ni tenés la capacidad de coordinar agendas: 
la coordinación de visitas, turnos y confirmaciones la realiza exclusivamente 
un asesor humano. Cuando el usuario quiere avanzar (visita, reserva, 
documentación, negociación), derivás a un asesor humano.

═══════════════════════════════════════════════════════════════
PARTE 1: ESTILO DE COMUNICACIÓN
═══════════════════════════════════════════════════════════════

• Español argentino neutro
• Respuestas breves: máximo 2 frases
• Empática, clara y profesional
• Ortografía impecable
• Todas las preguntas llevan ¿?
• Una sola pregunta por mensaje
• Nunca suenes a formulario: humano, simple, directo

REGLA DE ORO (Anti-alucinación):
Si no tenés un dato confirmado por el usuario o por tools, decí que no podés 
confirmarlo y pedí 1 dato para avanzar.

Tools internas y silenciosas: think, propiedades, resumen_info, 
añadir_etiquetas, get_zona

⚠️ NUNCA mencionás tools ni decís "voy a buscar"

═══════════════════════════════════════════════════════════════
PARTE 2: CAPTURA DE DATOS BÁSICOS (CON THINK)
═══════════════════════════════════════════════════════════════

En el primer mensaje del usuario en este flujo, capturá desde el webhook 
con think (si están disponibles):

• contact_id: {{ $('Webhook1').item.json.body.contact_id }} 
  (CRÍTICO: nunca lo pierdas, lo usarás como query_id/queryid)
• first_name: {{ $('Webhook1').item.json.body.first_name }}
• phone: {{ $('Webhook1').item.json.body.phone }}
• email: {{ $('Webhook1').item.json.body.email }}

Guardalo con think y mantenelo siempre.

Si falta algún dato útil:
• Si falta nombre: "Hola, soy Sofía de Juejati Brokers. ¿Cómo te llamás?"
• Si falta WhatsApp: "Para derivarte con un asesor, ¿me compartís tu 
  WhatsApp con código de país?"

Cada respuesta relevante del usuario se guarda con think como JSON incremental.

═══════════════════════════════════════════════════════════════
PARTE 3: ROUTER DE INTENCIÓN (1 SOLO MODO)
═══════════════════════════════════════════════════════════════

Antes de responder, clasificá el mensaje del usuario en uno de estos 5 modos:

┌─────────────────────────────────────────────────────────────┐
│ MODO 1: FICHA_PRIMER_MENSAJE                                │
│ Usuario comparte link/ficha con título, barrio, precio      │
└─────────────────────────────────────────────────────────────┘

CRITICAL RULE: Ya tiene la info, NO preguntes datos redundantes

Actions:
1. Ejecutar tool propiedades INMEDIATAMENTE con lo que compartió
2. NO preguntar zona, tipo, presupuesto si ya están en el mensaje
3. Guardar con resumen_info:
   - zona
   - intencion
   - tipo_propiedad
   - presupuesto
   - propiedad_de_interes
   - asesor
4. Añadir tag: like_prop

Ejemplo:
User: "Me interesa este depto 2 amb Palermo USD 280k"
🚫 MAL: "¿En qué zona buscás?"
✅ BIEN: [ejecuta búsqueda] "Perfecto, encontré opciones similares..."

┌─────────────────────────────────────────────────────────────┐
│ MODO 2: CONSULTA_ESPECIFICA                                 │
│ Referencia a propiedad específica                           │
└─────────────────────────────────────────────────────────────┘

Triggers:
• Dirección exacta ("Libertador 3000")
• Nombre de edificio ("Torre Bellini")
• Descripción única ("el que tiene terraza grande")

Actions:
1. Ejecutar propiedades con query_referencia
2. Si muchos resultados: preguntar 1 filtro adicional

Formato:
```
propiedades(
  query_id=contact_id,
  query="edificio libertador 3000"
)
```

┌─────────────────────────────────────────────────────────────┐
│ MODO 3: CONSULTA_GENERICA                                   │
│ Búsqueda por filtros: zona, ambientes, precio, tipo         │
└─────────────────────────────────────────────────────────────┘

Extrae todos los filtros posibles del mensaje

Inferencia de operación:
• Precio > USD 10,000 → venta
• Precio < USD 10,000 → alquiler

Conversión de ambientes (Argentina):
• 1 ambiente = monoambiente (0 bedrooms)
• 2 ambientes = 1 bedroom
• 3 ambientes = 2 bedrooms
• 4 ambientes = 3 bedrooms

Formato de query estructurado:
```
zona:[X];tipo:[Y];ambientes:[Z];moneda:[M];precio_min:0;precio_max:[B];operacion:[O]
```

Ejemplo:
```
zona:palermo;tipo:departamento;ambientes:3;moneda:USD;precio_min:0;precio_max:350000;operacion:venta
```

Ejecuta propiedades cuando tengas mínimo de datos necesarios

┌─────────────────────────────────────────────────────────────┐
│ MODO 4: SEGUIMIENTO                                         │
│ Usuario selecciona de resultados previos                    │
└─────────────────────────────────────────────────────────────┘

Triggers:
• "Me gusta la primera"
• "Quiero ver el de Palermo"
• "¿Puedo visitar esa?"

Actions:
1. Guardar con resumen_info:
   - propiedad_de_interes
   - Tokko_id
   - asesor
2. Tags: like_prop, pide_visita (si corresponde)

Si pide visita:
"Perfecto. Yo no puedo coordinar visitas; eso lo maneja un asesor del 
equipo. ¿Querés que te lo derive para que te proponga horarios?"

Tag: asistencia_humana

┌─────────────────────────────────────────────────────────────┐
│ MODO 5: OTROS                                               │
│ Saludos, off-topic, consultas generales                     │
└─────────────────────────────────────────────────────────────┘

Response: Brief and friendly, redirect to property search

Ejemplo:
User: "Hola, ¿cómo estás?"
Response: "Hola! Muy bien, gracias. ¿Buscás alguna propiedad en particular?"

═══════════════════════════════════════════════════════════════
PARTE 4: FORMATO DE PROPIEDADES (MANDATORY)
═══════════════════════════════════════════════════════════════

SIEMPRE usar este formato EXACTO:

[Título completo de la propiedad]
Precio: USD 320,000 / "Consultar"
📍 Palermo Soho, CABA
🖼️ https://tokkobroker.com/images/prop123.jpg
🔗 Ver ficha completa: https://ficha.info/prop/123

⚠️ CRÍTICO: SIEMPRE incluir imagen con 🖼️

═══════════════════════════════════════════════════════════════
PARTE 5: PREGUNTA FINAL (MANDATORY)
═══════════════════════════════════════════════════════════════

SIEMPRE terminar con pregunta de engagement:

Opciones:
• "¿Te interesa alguna de estas opciones?"
• "¿Querés que busque en otra zona?"
• "¿Necesitás más info sobre alguna?"

═══════════════════════════════════════════════════════════════
PARTE 6: COMPLIANCE Y RESTRICCIONES
═══════════════════════════════════════════════════════════════

NO PODÉS:
• Dar asesoramiento legal, fiscal o contable
• Garantizar disponibilidad de propiedades
• Confirmar condiciones sin verificación del asesor
• Coordinar visitas o agendas
• Negociar precios o condiciones

NUNCA usar criterios discriminatorios:
• Raza, religión, nacionalidad
• Estado civil, orientación sexual
• Condición de salud

═══════════════════════════════════════════════════════════════
PARTE 7: DERIVACIÓN A ASESOR HUMANO
═══════════════════════════════════════════════════════════════

Derivar cuando el usuario:
• Pide visita o inspección
• Quiere hacer reserva
• Necesita documentación
• Pregunta sobre financiación específica
• Quiere negociar condiciones

Response:
"Perfecto. Para [acción], te voy a derivar con [nombre asesor] que te 
va a ayudar con todos los detalles. ¿Te parece?"

Tag: asistencia_humana
```

---

## 🔄 FLUJO DE CONVERSACIÓN

### **Caso de Uso 1: Búsqueda Nueva**

```
┌─────────────────────────────────────────────────────────────┐
│  USUARIO: "Hola, busco depto en Palermo"                    │
└─────────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────────┐
│  SOFÍA (Think):                                              │
│  {                                                           │
│    contact_id: "xxx",                                        │
│    first_name: "Juan",                                       │
│    queryzona: "Palermo",                                     │
│    querypropiedad: "departamento"                            │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────────┐
│  SOFÍA: "Perfecto Juan. ¿Cuántos ambientes necesitás?"      │
└─────────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────────┐
│  USUARIO: "2 o 3 ambientes"                                 │
└─────────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────────┐
│  SOFÍA (Think):                                              │
│  { ...anterior, queryambientes: 2 }                          │
└─────────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────────┐
│  SOFÍA: "¿Cuál es tu presupuesto aproximado en dólares?"    │
└─────────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────────┐
│  USUARIO: "Hasta 350 mil USD"                               │
└─────────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────────┐
│  SOFÍA (Execute):                                            │
│  propiedades(                                                │
│    query_id=contact_id,                                      │
│    query="zona:palermo;tipo:departamento;ambientes:2;       │
│           moneda:USD;precio_max:350000;operacion:venta"     │
│  )                                                           │
└─────────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────────┐
│  SUPABASE: Vector Search                                    │
│  Returns: 3 propiedades                                     │
└─────────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────────┐
│  SOFÍA:                                                      │
│  "Perfecto Juan, encontré estas opciones en Palermo:        │
│                                                              │
│  [Departamento moderno 2 ambientes con balcón]              │
│  Precio: USD 310,000                                         │
│  📍 Palermo Soho                                            │
│  🖼️ [imagen]                                                │
│  🔗 Ver ficha completa: [link]                              │
│                                                              │
│  [Luminoso 2 ambientes en Palermo Hollywood]                │
│  Precio: USD 295,000                                         │
│  📍 Palermo Hollywood                                       │
│  🖼️ [imagen]                                                │
│  🔗 Ver ficha completa: [link]                              │
│                                                              │
│  ¿Te interesa alguna de estas opciones?"                    │
└─────────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────────┐
│  USUARIO: "Me gusta la primera, quiero visitarla"           │
└─────────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────────┐
│  SOFÍA (Execute):                                            │
│  resumen_info(                                               │
│    queryid=contact_id,                                       │
│    zona="Palermo",                                           │
│    tipo_propiedad="Departamento",                            │
│    presupuesto="350000",                                     │
│    ambientes="2",                                            │
│    propiedad_de_interes="Depto moderno Palermo Soho",        │
│    Tokko_id="12345"                                          │
│  )                                                           │
│  añadir_etiquetas(                                           │
│    queryid=contact_id,                                       │
│    tag="like_prop"                                           │
│  )                                                           │
│  añadir_etiquetas(                                           │
│    queryid=contact_id,                                       │
│    tag="pide_visita"                                         │
│  )                                                           │
│  añadir_etiquetas(                                           │
│    queryid=contact_id,                                       │
│    tag="asistencia_humana"                                   │
│  )                                                           │
└─────────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────────┐
│  SOFÍA:                                                      │
│  "Perfecto Juan. Yo no puedo coordinar visitas; eso lo      │
│  maneja un asesor del equipo. ¿Querés que te lo derive      │
│  para que te proponga horarios?"                             │
└─────────────────────────────────────────────────────────────┘
```

### **Caso de Uso 2: Compartir Ficha**

```
┌─────────────────────────────────────────────────────────────┐
│  USUARIO: "Me interesa este depto:                          │
│  [link de Zonaprop]                                          │
│  2 ambientes en Palermo a USD 280k"                         │
└─────────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────────┐
│  PORTAL DETECTOR: Detecta Zonaprop link                     │
│  SCRAPER: Extrae datos del listing                          │
└─────────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────────┐
│  MODO: FICHA_PRIMER_MENSAJE                                 │
│                                                              │
│  SOFÍA (Execute immediately - NO preguntar datos):          │
│  propiedades(                                                │
│    query_id=contact_id,                                      │
│    query="zona:palermo;tipo:departamento;ambientes:2;       │
│           precio_max:300000;operacion:venta"                │
│  )                                                           │
└─────────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────────┐
│  SOFÍA: "Perfecto! Encontré propiedades similares:          │
│  [muestra resultados]                                        │
│  ¿Te interesa alguna de estas opciones?"                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔌 INTEGRACIONES

### **1. GoHighLevel (GHL)**

**API Endpoint:** `https://services.leadconnectorhq.com`

**Operaciones:**

#### **Update Contact Custom Fields**
```javascript
// Workflow: resumen_info (fbgZDTDUO5tdmjnI)

PUT /contacts/{{contact_id}}
Headers:
  Authorization: Bearer {{GHL_API_KEY}}
  Version: 2021-07-28

Body:
{
  "customFields": [
    {
      "id": "zona_id",
      "field_value": "Palermo"
    },
    {
      "id": "tipo_propiedad_id",
      "field_value": "Departamento"
    },
    {
      "id": "presupuesto_id",
      "field_value": "350000"
    },
    {
      "id": "ambientes_id",
      "field_value": "2"
    },
    {
      "id": "propiedad_interes_id",
      "field_value": "Depto moderno Palermo Soho"
    }
  ]
}
```

#### **Add Tag to Contact**
```javascript
// Workflow: añadir_etiquetas (nwerPlS1Gncba10Y)

POST /contacts/{{contact_id}}/tags
Headers:
  Authorization: Bearer {{GHL_API_KEY}}
  Version: 2021-07-28

Body:
{
  "tags": ["like_prop"]
}
```

**Tags del Sistema:**
- `like_prop` - Usuario mostró interés en propiedad
- `pide_visita` - Usuario pidió coordinar visita
- `asistencia_humana` - Requiere intervención de asesor
- `detener_ia` - Pausar asistente IA

### **2. Supabase (Vector Database)**

**Endpoint:** `https://[project-id].supabase.co`

**Table:** `propiedades_vector`

**Schema:**
```sql
CREATE TABLE propiedades_vector (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  metadata JSONB NOT NULL,
  embedding vector(1536) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_propiedades_vector_embedding 
ON propiedades_vector 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX idx_propiedades_metadata 
ON propiedades_vector 
USING GIN (metadata);
```

**RLS Policies:**
```sql
-- Allow n8n to read
CREATE POLICY "n8n_read" 
ON propiedades_vector 
FOR SELECT 
USING (true);
```

### **3. Tokko Broker API**

**Base URL:** `https://tokkobroker.com/api/v1/`

**Authentication:** `Token [API_KEY]`

**Endpoints Usados:**

#### **GET /property/**
```javascript
GET /property/?format=json
Headers:
  Authorization: Token {{TOKKO_API_KEY}}

Query Parameters:
  operation_types: 1 (venta) | 2 (alquiler)
  property_types: 1 (depto) | 2 (casa) | ...
  price_from: 250000
  price_to: 350000
  current_localization_type: division
  current_localization_id: 123
  limit: 10
  offset: 0
  ordering: -price

Response:
{
  "objects": [
    {
      "id": 12345,
      "publication_title": "Departamento 2 ambientes Palermo",
      "address": "Av. Santa Fe 3000",
      "price": 320000,
      "operations": [
        {
          "operation_type": "Venta",
          "prices": [
            {
              "currency": "USD",
              "price": 320000
            }
          ]
        }
      ],
      "location": {
        "short_location": "Palermo, CABA",
        "division": {
          "id": 123,
          "name": "Palermo"
        }
      },
      "suite_amount": 2,
      "room_amount": 1,
      "bathroom_amount": 1,
      "parking_lot_amount": 0,
      "total_surface": 45,
      "photos": [
        {
          "image": "https://tokkobroker.com/images/..."
        }
      ],
      "public_url": "https://..."
    }
  ]
}
```

### **4. OpenAI API**

**Embeddings:** `text-embedding-3-small`

**LLM:** GPT-5 (via LangChain)

**Transcription:** Whisper API

### **5. Cohere API**

**Rerank Endpoint:** `https://api.cohere.ai/v1/rerank`

**Model:** `rerank-v3`

---

## ✅ ANÁLISIS DE FORTALEZAS

### **1. Arquitectura de Búsqueda Avanzada**

✅ **Búsqueda Semántica + Filtros Exactos**
- Vector search para relevancia contextual
- Filtros post-búsqueda para precisión
- Mejor que solo búsqueda SQL tradicional

✅ **Reranking Inteligente**
- Cohere reranker mejora orden de resultados
- Reduce falsos positivos

✅ **Dual Query Support**
- Structured queries para filtros precisos
- Free text para conversación natural

### **2. Sistema de Conversación**

✅ **Router de Intenciones**
- 5 modos claramente definidos
- Evita preguntas redundantes
- Flujo conversacional natural

✅ **Think Tool para Memoria**
- Tracking persistente de parámetros
- No pierde contexto
- Inferencia inteligente

✅ **Anti-Alucinación**
- Regla explícita: no inventar datos
- Pide confirmación cuando falta info
- Tools ejecutadas silenciosamente

### **3. Integración Multi-Canal**

✅ **Portal Scraping**
- Extrae datos de Zonaprop, Argenprop, ML
- Automáticamente procesa fichas compartidas
- Ahorra preguntas al usuario

✅ **Multi-Formato Input**
- Texto, audio (Whisper), imágenes (Gemini Vision)
- Flexible y accesible

### **4. Compliance y Safety**

✅ **Restricciones Claras**
- No puede agendar visitas (humano interviene)
- No da advice legal/fiscal
- No usa criterios discriminatorios

✅ **Derivación Inteligente**
- Detecta cuando necesita humano
- Tags automáticos para workflow

### **5. Calidad de Output**

✅ **Formato Consistente**
- Template obligatorio con título, precio, ubicación
- Siempre incluye imagen
- Link a ficha completa

✅ **Pregunta Final Obligatoria**
- Mantiene conversación activa
- Engagement constante

---

## 🚀 OPORTUNIDADES DE MEJORA

### **1. Optimización de Búsqueda**

#### **A. Filtros Inteligentes por Rangos**

**Problema actual:**
```javascript
// Filtro exacto de ambientes
if (filters.ambientes !== null && meta.ambientes !== filters.ambientes) {
  return false;
}
```

**Mejora sugerida:**
```javascript
// Rango flexible ±1 ambiente
if (filters.ambientes !== null) {
  const min = filters.ambientes - 1;
  const max = filters.ambientes + 1;
  if (meta.ambientes < min || meta.ambientes > max) {
    return false;
  }
}
```

**Beneficio:** Más resultados relevantes, especialmente cuando hay poca oferta

#### **B. Precio con Margen**

**Mejora:**
```javascript
// Si precio_max = 350k, considerar hasta 370k (5% margen)
const precioMaxConMargen = filters.precio_max * 1.05;
```

#### **C. Cache de Resultados**

**Implementación:**
```javascript
// Redis cache key
const cacheKey = `search:${queryHash}:${timestamp}`;

// Cache por 5 minutos
if (cached = await redis.get(cacheKey)) {
  return cached;
}

// Si no hay cache, buscar y guardar
const results = await vectorSearch();
await redis.setex(cacheKey, 300, results);
```

**Beneficio:** Reduce llamadas a Supabase, respuesta más rápida

### **2. Mejoras en Conversación**

#### **A. Detección de Cambio de Criterios**

**Problema:** Si usuario cambia de zona mid-conversation, puede confundir al agente

**Solución:**
```javascript
// En Think tool
if (prevQueryZona && prevQueryZona !== newQueryZona) {
  return "Veo que ahora buscás en {newQueryZona}. ¿Querés que busque ahí en lugar de {prevQueryZona}?";
}
```

#### **B. Sugerencias Proactivas**

**Cuando no hay resultados:**
```javascript
if (propiedades.length === 0) {
  // Sugerir zonas cercanas
  const zonasAlternativas = await getZonasCercanas(queryZona);
  
  return `No encontré propiedades en ${queryZona} con esos criterios. 
  ¿Querés que busque en ${zonasAlternativas.join(' o ')}?`;
}
```

#### **C. Resumen de Criterios**

**Antes de búsqueda:**
```
"Perfecto, entonces busco:
• Departamento
• 2-3 ambientes
• Palermo
• Hasta USD 350,000
¿Es correcto?"
```

### **3. Analytics y Tracking**

#### **A. Métricas de Conversación**

**Implementar:**
```javascript
// Tracking de eventos
{
  event: 'search_executed',
  contact_id: 'xxx',
  query_type: 'structured',
  filters: {...},
  results_count: 3,
  timestamp: '...'
}

{
  event: 'property_liked',
  contact_id: 'xxx',
  property_id: '12345',
  timestamp: '...'
}

{
  event: 'visit_requested',
  contact_id: 'xxx',
  property_id: '12345',
  timestamp: '...'
}
```

**Beneficio:** 
- Entender qué buscan más
- Optimizar filtros
- Mejorar recomendaciones

#### **B. Dashboard de Performance**

**Métricas clave:**
- Tiempo promedio hasta primera búsqueda
- Tasa de conversión (búsqueda → like → visita)
- Propiedades más consultadas
- Zonas más buscadas
- Rangos de precio más comunes

### **4. Calidad de Datos**

#### **A. Validación de Propiedades**

**Implementar:**
```javascript
// Pre-procesamiento de propiedades
const validateProperty = (prop) => {
  const errors = [];
  
  if (!prop.imagen || prop.imagen === '') {
    errors.push('missing_image');
  }
  
  if (!prop.precio || prop.precio === 0) {
    errors.push('missing_price');
  }
  
  if (!prop.barrio || prop.barrio === '') {
    errors.push('missing_location');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

// Filtrar propiedades inválidas
const validProperties = propiedades.filter(p => 
  validateProperty(p).isValid
);
```

#### **B. Sync Job para Vector DB**

**Workflow diario:**
```
1. Fetch nuevas propiedades de Tokko
2. Generate embeddings
3. Upsert en Supabase
4. Delete propiedades desactualizadas
5. Log sync metrics
```

### **5. UX Improvements**

#### **A. Imágenes de Alta Calidad**

**Problema:** Algunas imágenes de Tokko son baja calidad

**Solución:**
```javascript
// Seleccionar mejor imagen
const selectBestImage = (photos) => {
  // Ordenar por tamaño
  const sorted = photos.sort((a, b) => 
    (b.width * b.height) - (a.width * a.height)
  );
  
  // Retornar versión de alta calidad
  return sorted[0].image.replace('/thumb/', '/large/');
};
```

#### **B. Carousel de Imágenes**

**En lugar de una sola imagen:**
```javascript
message_attachments: [
  { type: 'image', url: imagen1 },
  { type: 'image', url: imagen2 },
  { type: 'image', url: imagen3 },
  { type: 'link', url: ficha, title: 'Ver todas las fotos' }
]
```

#### **C. Quick Actions**

**Botones de acción rápida:**
```javascript
{
  type: 'interactive',
  interactive: {
    type: 'button',
    body: {
      text: '[Info de la propiedad]'
    },
    action: {
      buttons: [
        {
          type: 'reply',
          reply: {
            id: 'like',
            title: '❤️ Me gusta'
          }
        },
        {
          type: 'reply',
          reply: {
            id: 'visit',
            title: '📅 Agendar visita'
          }
        },
        {
          type: 'reply',
          reply: {
            id: 'more',
            title: 'ℹ️ Más info'
          }
        }
      ]
    }
  }
}
```

### **6. Escalabilidad**

#### **A. Rate Limiting**

**Implementar:**
```javascript
// Redis rate limiter
const checkRateLimit = async (contactId) => {
  const key = `ratelimit:${contactId}`;
  const count = await redis.incr(key);
  
  if (count === 1) {
    await redis.expire(key, 60); // 1 minuto window
  }
  
  if (count > 10) {
    throw new Error('Rate limit exceeded');
  }
};
```

#### **B. Load Balancing de Embeddings**

**Para alto volumen:**
```javascript
// Queue de embeddings con Bull
const embeddingQueue = new Queue('embeddings', {
  redis: redisConfig
});

embeddingQueue.process(async (job) => {
  const { text } = job.data;
  return await openai.createEmbedding({
    model: 'text-embedding-3-small',
    input: text
  });
});
```

### **7. Testing & Monitoring**

#### **A. Unit Tests para Filtros**

```javascript
describe('Property Filter', () => {
  it('should filter by exact ambientes', () => {
    const results = [{ambientes: 2}, {ambientes: 3}];
    const filtered = applyFilters(results, {ambientes: 2});
    expect(filtered.length).toBe(1);
  });
  
  it('should filter by price range', () => {
    const results = [
      {precio: 250000},
      {precio: 350000},
      {precio: 450000}
    ];
    const filtered = applyFilters(results, {precio_max: 350000});
    expect(filtered.length).toBe(2);
  });
});
```

#### **B. Monitoring con Prometheus**

```javascript
// Métricas
const searchDuration = new Histogram({
  name: 'search_duration_seconds',
  help: 'Duration of property search'
});

const searchResultsCount = new Histogram({
  name: 'search_results_count',
  help: 'Number of results per search'
});

// Track
searchDuration.observe(duration);
searchResultsCount.observe(results.length);
```

### **8. Seguridad**

#### **A. Sanitización de Input**

```javascript
const sanitizeQuery = (query) => {
  // Remove SQL injection attempts
  return query
    .replace(/[';\"\\]/g, '')
    .replace(/--/g, '')
    .trim();
};
```

#### **B. Validation de Contact ID**

```javascript
const validateContactId = (contactId) => {
  // GHL contact ID format: alphanumeric, 20 chars
  const regex = /^[a-zA-Z0-9]{20}$/;
  
  if (!regex.test(contactId)) {
    throw new Error('Invalid contact ID');
  }
  
  return contactId;
};
```

---

## 📊 MÉTRICAS SUGERIDAS

### **KPIs del Sistema**

| Métrica | Objetivo | Actual | Tracking |
|---------|----------|--------|----------|
| Tiempo hasta primera búsqueda | < 3 mensajes | ? | Redis events |
| Tasa de búsqueda exitosa | > 80% | ? | Search results > 0 |
| Tasa de like en propiedades | > 30% | ? | Tag "like_prop" |
| Tasa de solicitud de visita | > 15% | ? | Tag "pide_visita" |
| Precisión de filtros | > 90% | ? | User feedback |
| Latencia de búsqueda | < 3 seg | ? | Duration metrics |

---

## 🎯 ROADMAP SUGERIDO

### **Fase 1: Quick Wins (Semana 1-2)**
- ✅ Implementar rangos flexibles en filtros
- ✅ Cache de resultados con Redis
- ✅ Validación de propiedades
- ✅ Analytics básicos

### **Fase 2: UX Improvements (Semana 3-4)**
- 📸 Carousel de imágenes
- 🔘 Quick action buttons
- 📋 Resumen de criterios
- 🎨 Mejor selección de imágenes

### **Fase 3: Intelligence (Mes 2)**
- 🧠 Sugerencias proactivas
- 🔄 Detección de cambio de criterios
- 📊 Dashboard de analytics
- 🎯 Recomendaciones personalizadas

### **Fase 4: Scale (Mes 3)**
- ⚡ Rate limiting
- 📈 Load balancing
- 🔒 Security hardening
- ✅ Comprehensive testing

---

## 📝 CONCLUSIÓN

El sistema **Asistente Juejati** está **muy bien construido** con:

✅ Arquitectura sólida de búsqueda vectorial  
✅ Conversación natural con Think tool  
✅ Router inteligente de intenciones  
✅ Integración multi-canal  
✅ Compliance y safety bien definidos  

Las **oportunidades de mejora** son principalmente:

🎯 Optimización de filtros (rangos flexibles)  
🎯 UX enhancements (carousel, quick actions)  
🎯 Analytics y tracking  
🎯 Performance (cache, rate limiting)  

El sistema está **production-ready** y las mejoras sugeridas son **evolutivas**, no críticas.

---

**Última actualización:** Enero 2026  
**Versión:** 1.0  
**Autor:** Análisis técnico para Korvance
