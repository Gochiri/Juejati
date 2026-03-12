# 🔧 MODIFICACIONES CORREGIDAS - Memoria Contextual v2

**Archivo:** Asistente_Multi-Agente_Juejati_v2.json

---

## ⚠️ CORRECCIÓN IMPORTANTE

**Problema identificado:** Si un lead estancado tiene "zonaprop" en su historial, el Portal_Detector1 lo detectaría y lo mandaría al flujo de análisis de URLs, lo cual causaría un error.

**Solución:** Los leads de reactivación (STALE) deben **SALTEAR completamente** el Portal_Detector1 e ir **directo al SEARCH AGENT**.

---

## 🎯 ARQUITECTURA CORREGIDA

### Flujo para Leads ESTANCADOS (modo = REACTIVACION_STALE):
```
Webhook Trigger
    ↓
Check Stale Mode (IF)
    ↓
  [TRUE]
    ↓
Get Conversation History (GHL API)
    ↓
Parse Conversation History
    ↓
Preparar Contexto para Búsqueda  ← NUEVO nodo
    ↓
🔍 SEARCH AGENT (directo, sin pasar por Portal_Detector1)
    ↓
[Merge Responses, HTTP Request a GHL, etc.]
```

### Flujo para Leads NORMALES:
```
Webhook Trigger
    ↓
Check Stale Mode (IF)
    ↓
  [FALSE]
    ↓
Portal_Detector1 (switch - flujo normal)
    ↓
[Extraer URL / Preparar Contexto / etc.]
    ↓
Router Chain
    ↓
[5 AI Agents según clasificación]
```

---

## 📋 PASO 1: Crear Credencial GHL API

**Antes de empezar:**

1. Settings → Credentials → Add Credential
2. Buscar: "HTTP Header Auth"
3. Configurar:
   - **Name:** `GHL API - Conversations`
   - **Header Name:** `Authorization`
   - **Header Value:** `Bearer TU_GHL_API_KEY_AQUI`
4. Guardar

**¿Dónde obtener el API Key?**
- GHL → Settings → API Keys
- Create API Key con scope: `conversations.readonly`

---

## 📋 PASO 2: Agregar Nodos Nuevos

### **NODO 1: IF "Check Stale Mode"**

**Ubicación:** Entre "Webhook Trigger" y "Portal_Detector1"

**Configuración:**
```json
{
  "parameters": {
    "conditions": {
      "options": {
        "caseSensitive": true,
        "leftValue": "",
        "typeValidation": "strict"
      },
      "conditions": [
        {
          "id": "stale-check",
          "leftValue": "={{ $json.body.modo }}",
          "rightValue": "REACTIVACION_STALE",
          "operator": {
            "type": "string",
            "operation": "equals"
          }
        }
      ],
      "combinator": "and"
    },
    "options": {}
  },
  "id": "check-stale-mode-node",
  "name": "Check Stale Mode",
  "type": "n8n-nodes-base.if",
  "typeVersion": 2,
  "position": [-1900, 96]
}
```

**Conexiones:**
- **Input:** Desde "Webhook Trigger"
- **Output TRUE:** Hacia "Get Conversation History" (nuevo)
- **Output FALSE:** Hacia "Portal_Detector1" (ya existe - flujo normal)

---

### **NODO 2: HTTP Request "Get Conversation History"**

**Conectar desde:** Salida TRUE del IF

**Configuración:**
```json
{
  "parameters": {
    "method": "GET",
    "url": "https://services.leadconnectorhq.com/conversations/messages",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpHeaderAuth",
    "sendQuery": true,
    "queryParameters": {
      "parameters": [
        {
          "name": "contactId",
          "value": "={{ $json.body.contact_id }}"
        },
        {
          "name": "limit",
          "value": "20"
        },
        {
          "name": "sortOrder",
          "value": "desc"
        }
      ]
    },
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "Version",
          "value": "2021-07-28"
        }
      ]
    },
    "options": {}
  },
  "id": "get-conv-history-node",
  "name": "Get Conversation History",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [-1700, -100],
  "credentials": {
    "httpHeaderAuth": {
      "id": "ID_DE_TU_CREDENCIAL",
      "name": "GHL API - Conversations"
    }
  }
}
```

**IMPORTANTE:** Reemplazá `"ID_DE_TU_CREDENCIAL"` con el ID de tu credencial.

**Conexiones:**
- **Input:** Desde salida TRUE del "Check Stale Mode"
- **Output:** Hacia "Parse Conversation History" (nuevo)

---

### **NODO 3: Code "Parse Conversation History"**

**Conectar desde:** "Get Conversation History"

**Configuración:**
```json
{
  "parameters": {
    "jsCode": "// Parse conversation history para el AI Agent\nconst webhookData = $('Webhook Trigger').first().json.body;\nconst conversationData = $input.item.json;\nconst messages = conversationData.messages || [];\n\n// Extraer últimos 10 mensajes relevantes\nconst recentMessages = messages\n  .slice(0, 10)\n  .map(msg => ({\n    role: msg.direction === 'inbound' ? 'user' : 'assistant',\n    content: msg.body || msg.messageText || '',\n    timestamp: msg.dateAdded,\n    type: msg.type\n  }))\n  .filter(msg => {\n    // Filtrar mensajes vacíos o de sistema\n    if (!msg.content || msg.content.length === 0) return false;\n    if (msg.type === 'TYPE_CALL') return false;\n    return true;\n  });\n\n// Extraer preferencias del historial\nconst preferences = {\n  zona: webhookData.zona || '',\n  tipo_propiedad: webhookData.tipo_propiedad || '',\n  ambientes: webhookData.ambientes || null,\n  presupuesto: webhookData.presupuesto || null\n};\n\n// Crear resumen de contexto\nconst contextSummary = {\n  total_messages: recentMessages.length,\n  last_interaction: recentMessages[0]?.timestamp || null,\n  has_history: recentMessages.length > 0\n};\n\n// Log para debugging\nconsole.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');\nconsole.log('🧠 MEMORIA CONTEXTUAL - REACTIVACIÓN');\nconsole.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');\nconsole.log('Contact ID:', webhookData.contact_id);\nconsole.log('Nombre:', webhookData.first_name);\nconsole.log('Mensajes recuperados:', recentMessages.length);\nconsole.log('Última interacción:', contextSummary.last_interaction);\nconsole.log('Preferencias detectadas:', preferences);\nconsole.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');\n\n// Retornar datos formateados para SEARCH AGENT\nreturn {\n  json: {\n    contact_id: webhookData.contact_id,\n    first_name: webhookData.first_name,\n    phone: webhookData.phone,\n    mensaje_usuario: `Reactivación automática para ${webhookData.first_name}. Búsqueda: ${preferences.tipo_propiedad || 'propiedad'} en ${preferences.zona || 'zona preferida'}.`,\n    modo: 'REACTIVACION_STALE',\n    conversation_history: recentMessages,\n    context_summary: contextSummary,\n    // Datos de búsqueda\n    zona: preferences.zona,\n    tipo_propiedad: preferences.tipo_propiedad,\n    ambientes: preferences.ambientes,\n    presupuesto: preferences.presupuesto\n  }\n};"
  },
  "id": "parse-conv-history-node",
  "name": "Parse Conversation History",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [-1500, -100]
}
```

**Conexiones:**
- **Input:** Desde "Get Conversation History"
- **Output:** Hacia "🔍 SEARCH AGENT" (ya existe - salteamos Portal_Detector1)

---

## 🔗 PASO 3: Conectar al SEARCH AGENT

**IMPORTANTE:** Los leads de reactivación van **DIRECTO** al SEARCH AGENT, salteando completamente:
- Portal_Detector1
- Router Chain
- Todos los demás agentes

**Nueva conexión:**
```
Parse Conversation History → 🔍 SEARCH AGENT
```

El SEARCH AGENT ya existe en tu workflow y ya tiene toda la lógica de búsqueda de propiedades.

---

## 🧠 PASO 4: Actualizar System Prompt del SEARCH AGENT

Abrí el nodo **🔍 SEARCH AGENT** y agregá al final del system prompt:

```
───────────────────────────────────────────────────────
MODO ESPECIAL: REACTIVACIÓN CON MEMORIA CONTEXTUAL
───────────────────────────────────────────────────────

Si detectás que el input tiene:
• modo = "REACTIVACION_STALE"
• conversation_history presente

Entonces estás reactivando un lead que estuvo estancado 7+ días.

INSTRUCCIONES DE REACTIVACIÓN:

1. ANALIZAR HISTORIAL:
   • Lee conversation_history para entender la conversación previa
   • Identifica qué propiedades específicas mencionó el cliente
   • Nota preferencias exactas (ej: "con balcón", "cerca del parque")
   • Identifica objeciones o preocupaciones

2. GENERAR MENSAJE PERSONALIZADO:
   
   ESTRUCTURA:
   [Saludo cálido con nombre]
   [Referencia ESPECÍFICA a la última conversación - 1 frase]
   [Pregunta de reactivación]
   [Búsqueda de propiedades con sus preferencias]
   [Mostrar 2-3 propiedades que coincidan EXACTAMENTE]
   [Pregunta de cierre]

   EJEMPLOS DE REFERENCIA NATURAL ✅:
   - "La última vez hablamos sobre deptos en Palermo con balcón..."
   - "Me contaste que buscabas algo cerca del parque y con buena luz..."
   - "Vi que te interesaban propiedades de 2 ambientes en esa zona..."
   - "Recordás que estabas viendo opciones de hasta USD 350k..."

   NUNCA USES ❌:
   - "De acuerdo a nuestra conversación previa..."
   - "Según los registros..."
   - "Hace 7 días hablamos..."
   - "Este es un mensaje automático..."

3. PERSONALIZACIÓN EXTREMA:
   • Las propiedades DEBEN coincidir con lo que dijo en el historial
   • Si mencionó "balcón" → Verifica que las propiedades tengan balcón
   • Si dijo "cerca del parque" → Filtra por ubicación
   • Si expresó presupuesto → Respeta ese límite

4. TONO:
   • Cálido y humano (no robótico)
   • Natural y conversacional
   • Demuestra que recordás la conversación
   • Sin mencionar el tiempo sin contacto

EJEMPLO COMPLETO DE MENSAJE:

"Hola María! 👋

La última vez hablamos sobre departamentos en Palermo. 
Me contaste que querías algo con balcón y buena luz natural, 
cerca del parque.

¿Seguís buscando? Encontré estas opciones nuevas que tienen 
exactamente eso:

[Ejecutar búsqueda con tool buscar_propiedades]

[Mostrar 2-3 propiedades con balcón en Palermo]

¿Alguna te llama la atención? 🏡"

───────────────────────────────────────────────────────
FIN MODO REACTIVACIÓN
───────────────────────────────────────────────────────
```

---

## 📊 DIAGRAMA COMPLETO DEL FLUJO CORREGIDO

```
                    ┌─────────────────────┐
                    │  Webhook Trigger    │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ Check Stale Mode    │
                    │ IF: modo==REACT..?  │
                    └──────┬──────┬───────┘
                           │      │
                       [TRUE]  [FALSE]
                           │      │
              ┌────────────▼      │
              │ Get Conversation  │
              │ History (GHL API) │
              └────────────┬      │
                           │      │
              ┌────────────▼      │
              │ Parse             │
              │ Conversation      │
              │ History           │
              └────────────┬      │
                           │      │
                           │      └───────────────┐
                           │                      │
                  ┌────────▼───────┐    ┌─────────▼────────┐
                  │ 🔍 SEARCH      │    │ Portal_Detector1 │
                  │ AGENT          │    │ (switch normal)  │
                  │ (directo!)     │    └─────────┬────────┘
                  └────────┬───────┘              │
                           │                      │
                           │         ┌────────────┼────────┐
                           │         │            │        │
                           │    ┌────▼──┐   ┌─────▼───┐  etc.
                           │    │Extraer│   │Preparar │
                           │    │URL    │   │Contexto │
                           │    └───┬───┘   └────┬────┘
                           │        │            │
                           │        └──────┬─────┘
                           │               │
                           │        ┌──────▼──────┐
                           │        │Router Chain │
                           │        └──────┬──────┘
                           │               │
                           │    ┌──────────┼────────┐
                           │    │    │     │    │   │
                           │ ┌──▼┐ ┌─▼─┐ ┌─▼┐ ┌─▼┐ ┌▼┐
                           │ │🔗 │ │🔍 │ │📅│ │🗺│ │💬│
                           │ │   │ │   │ │  │ │ │ │ │
                           │ └───┘ └───┘ └──┘ └──┘ └─┘
                           │
                      ┌────▼──────────┐
                      │ Merge         │
                      │ Responses     │
                      └────┬──────────┘
                           │
                      ┌────▼──────────┐
                      │ HTTP Request  │
                      │ to GHL        │
                      └───────────────┘
```

---

## ✅ VENTAJAS DE ESTA ARQUITECTURA

### ✅ **No hay conflictos:**
- Portal_Detector1 solo procesa leads normales
- Leads estancados van directo al SEARCH AGENT
- No hay riesgo de que detecte "zonaprop" en el historial

### ✅ **Lógica clara:**
- Lead normal → Portal_Detector1 → Router → Agente apropiado
- Lead estancado → Get History → Parse → SEARCH AGENT directo

### ✅ **Mantenible:**
- Separación clara de concerns
- Fácil de debuggear
- Cada flujo es independiente

### ✅ **Performance:**
- Leads estancados: Solo 1 HTTP request adicional (GHL API)
- Leads normales: Cero impacto, flujo sin cambios

---

## 🧪 TESTING

### Test 1: Lead Normal
**Input:**
```json
{
  "body": {
    "contact_id": "test_123",
    "first_name": "Pedro",
    "phone": "+5491112345678",
    "message": {
      "body": "Busco depto en Palermo"
    }
  }
}
```

**Esperado:**
- IF detecta que NO es REACTIVACION_STALE → FALSE
- Va a Portal_Detector1
- Flujo normal sin cambios

---

### Test 2: Lead Estancado
**Input:**
```json
{
  "body": {
    "contact_id": "CONTACT_ID_REAL",
    "first_name": "María",
    "phone": "+5491187654321",
    "modo": "REACTIVACION_STALE",
    "zona": "Palermo",
    "tipo_propiedad": "Departamento",
    "ambientes": 2,
    "presupuesto": 350000
  }
}
```

**Esperado:**
- IF detecta REACTIVACION_STALE → TRUE
- Get Conversation History (obtiene mensajes de GHL)
- Parse Conversation History (extrae últimos 10 mensajes)
- Va DIRECTO a SEARCH AGENT (saltea Portal_Detector1)
- SEARCH AGENT genera mensaje con contexto + búsqueda de propiedades

---

### Test 3: Lead Estancado con "zonaprop" en historial
**Historial contiene:** "La última vez me pasaste un link de zonaprop"

**Esperado:**
- No importa lo que diga el historial
- NO pasa por Portal_Detector1
- Va directo a SEARCH AGENT
- ✅ No hay error de extracción de URL

---

## 🐛 TROUBLESHOOTING

### Error: "Cannot find node 'Webhook Trigger'"
**Causa:** El nombre del webhook en el código es diferente
**Solución:** En el nodo "Parse Conversation History", cambiá:
```javascript
const webhookData = $('Webhook Trigger').first().json.body;
```
Por el nombre exacto de tu webhook.

---

### SEARCH AGENT no usa el contexto
**Causa:** El system prompt no fue actualizado
**Solución:** Verificá que agregaste la sección "MODO ESPECIAL: REACTIVACIÓN" al SEARCH AGENT

---

### Leads estancados van a Portal_Detector1
**Causa:** La conexión está mal
**Solución:** Verificá que:
1. Parse Conversation History → conecta directo a SEARCH AGENT
2. NO hay conexión entre Parse y Portal_Detector1

---

## 📝 CHECKLIST FINAL

### Pre-implementación:
- [ ] Crear credencial "GHL API - Conversations"
- [ ] Obtener API Key con scope `conversations.readonly`
- [ ] Backup del workflow actual

### Implementación:
- [ ] Agregar nodo "Check Stale Mode" (IF)
- [ ] Conectar Webhook → Check Stale Mode
- [ ] Conectar Check Stale Mode (FALSE) → Portal_Detector1
- [ ] Agregar nodo "Get Conversation History"
- [ ] Conectar Check Stale Mode (TRUE) → Get Conversation History
- [ ] Agregar nodo "Parse Conversation History"
- [ ] Conectar Get History → Parse History
- [ ] **CRÍTICO:** Conectar Parse History → 🔍 SEARCH AGENT (directo)
- [ ] Actualizar system prompt del SEARCH AGENT

### Testing:
- [ ] Test lead normal (debe ir a Portal_Detector1)
- [ ] Test lead estancado (debe saltear Portal_Detector1)
- [ ] Test lead estancado con "zonaprop" en historial (no debe fallar)
- [ ] Verificar que mensaje incluye referencia al contexto

---

## 🎯 RESUMEN DE LA CORRECCIÓN

**Problema original:**
```
Lead estancado → Merge → Portal_Detector1 → ❌ Error
```

**Solución correcta:**
```
Lead estancado → Parse History → 🔍 SEARCH AGENT → ✅ Funciona
Lead normal → Portal_Detector1 → Router → [Agentes] → ✅ Sin cambios
```

**Resultado:** Separación completa de flujos, sin conflictos, sin errores.

---

¿Te parece mejor esta arquitectura? Es mucho más limpia y evita completamente el problema que identificaste. 🚀
