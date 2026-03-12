# 🔧 MEMORIA CONTEXTUAL - Con Agente Dedicado de Reactivación

**Archivo:** Asistente_Multi-Agente_Juejati_v2.json

---

## 🎯 ARQUITECTURA FINAL

### Flujo COMPLETO:

```
Webhook Trigger
    ↓
Check Stale Mode (IF)
    ↓                              ↓
  [TRUE]                        [FALSE]
    ↓                              ↓
Get Conversation History      Portal_Detector1
    ↓                         (flujo normal)
Parse Conversation History         ↓
    ↓                         [tu flujo actual]
🔄 REACTIVATION AGENT  ← NUEVO AGENTE
    ↓
[Merge Responses]
    ↓
[HTTP Request a GHL]
```

**Separación total:**
- **REACTIVATION AGENT:** Solo para leads estancados
- **SEARCH AGENT:** Solo para búsquedas normales
- **Cero interferencia** entre ambos

---

## 📋 PASO 1: Crear Credencial GHL API

1. Settings → Credentials → Add Credential
2. Buscar: "HTTP Header Auth"
3. Configurar:
   - **Name:** `GHL API - Conversations`
   - **Header Name:** `Authorization`
   - **Header Value:** `Bearer TU_GHL_API_KEY_AQUI`
4. Guardar

**API Key:** GHL → Settings → API Keys (scope: `conversations.readonly`)

---

## 📋 PASO 2: Agregar Nodos de Infraestructura

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
- **Input:** Webhook Trigger
- **Output TRUE:** Get Conversation History
- **Output FALSE:** Portal_Detector1

---

### **NODO 2: HTTP Request "Get Conversation History"**

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

**Conexiones:**
- **Input:** Check Stale Mode (TRUE)
- **Output:** Parse Conversation History

---

### **NODO 3: Code "Parse Conversation History"**

**Configuración:**
```json
{
  "parameters": {
    "jsCode": "// ═══════════════════════════════════════════════════════\n// PARSE CONVERSATION HISTORY - REACTIVACIÓN STALE\n// ═══════════════════════════════════════════════════════\n\nconst webhookData = $('Webhook Trigger').first().json.body;\nconst conversationData = $input.item.json;\nconst messages = conversationData.messages || [];\n\n// Extraer últimos 10 mensajes relevantes\nconst recentMessages = messages\n  .slice(0, 10)\n  .map(msg => ({\n    role: msg.direction === 'inbound' ? 'user' : 'assistant',\n    content: msg.body || msg.messageText || '',\n    timestamp: msg.dateAdded,\n    type: msg.type\n  }))\n  .filter(msg => {\n    // Filtrar mensajes vacíos o de sistema\n    if (!msg.content || msg.content.length === 0) return false;\n    if (msg.type === 'TYPE_CALL') return false;\n    return true;\n  });\n\n// Extraer preferencias del historial\nconst preferences = {\n  zona: webhookData.zona || '',\n  tipo_propiedad: webhookData.tipo_propiedad || '',\n  ambientes: webhookData.ambientes || null,\n  presupuesto: webhookData.presupuesto || null,\n  intencion: webhookData.intencion || ''\n};\n\n// Crear resumen de contexto\nconst contextSummary = {\n  total_messages: recentMessages.length,\n  last_interaction: recentMessages[0]?.timestamp || null,\n  has_history: recentMessages.length > 0,\n  days_since_last: recentMessages[0]?.timestamp \n    ? Math.floor((Date.now() - new Date(recentMessages[0].timestamp).getTime()) / (1000 * 60 * 60 * 24))\n    : null\n};\n\n// Log para debugging\nconsole.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');\nconsole.log('🔄 REACTIVACIÓN AUTOMÁTICA');\nconsole.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');\nconsole.log('Contact ID:', webhookData.contact_id);\nconsole.log('Nombre:', webhookData.first_name);\nconsole.log('Mensajes recuperados:', recentMessages.length);\nconsole.log('Última interacción:', contextSummary.last_interaction);\nconsole.log('Días sin contacto:', contextSummary.days_since_last);\nconsole.log('Preferencias:', preferences);\nconsole.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');\n\n// Retornar datos formateados para REACTIVATION AGENT\nreturn {\n  json: {\n    // Datos del contacto\n    contact_id: webhookData.contact_id,\n    first_name: webhookData.first_name,\n    phone: webhookData.phone,\n    \n    // Modo\n    modo: 'REACTIVACION_STALE',\n    \n    // Historial y contexto\n    conversation_history: recentMessages,\n    context_summary: contextSummary,\n    \n    // Datos de búsqueda (desde custom fields de GHL)\n    zona: preferences.zona,\n    tipo_propiedad: preferences.tipo_propiedad,\n    ambientes: preferences.ambientes,\n    presupuesto: preferences.presupuesto,\n    intencion: preferences.intencion,\n    \n    // Mensaje para el agente\n    mensaje_usuario: `Reactivación automática: ${webhookData.first_name} buscaba ${preferences.tipo_propiedad || 'propiedad'} en ${preferences.zona || 'zona preferida'}.`\n  }\n};"
  },
  "id": "parse-conv-history-node",
  "name": "Parse Conversation History",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [-1500, -100]
}
```

**Conexiones:**
- **Input:** Get Conversation History
- **Output:** 🔄 REACTIVATION AGENT (nuevo)

---

## 📋 PASO 3: Crear el REACTIVATION AGENT

Este es el **agente nuevo y dedicado** para reactivación.

### **NODO: AI Agent "🔄 REACTIVATION AGENT"**

**Configuración básica:**
```json
{
  "parameters": {
    "agent": "conversationalAgent",
    "promptType": "define",
    "text": "={{ $json.mensaje_usuario }}",
    "hasOutputParser": true,
    "options": {
      "systemMessage": "VER SYSTEM MESSAGE COMPLETO ABAJO",
      "maxIterations": 10,
      "returnIntermediateSteps": false
    }
  },
  "id": "reactivation-agent-node",
  "name": "🔄 REACTIVATION AGENT",
  "type": "@n8n/n8n-nodes-langchain.agent",
  "typeVersion": 1.6,
  "position": [-1300, -100]
}
```

**Conexiones:**
- **Input:** Parse Conversation History
- **Chat Model:** OpenAI Chat Model (el mismo que usás en otros agentes)
- **Tools:** 
  - buscar_propiedades (tu tool existente de Supabase)
  - Cualquier otro tool que necesites
- **Output:** Merge Responses (tu nodo existente)

---

### **SYSTEM MESSAGE del REACTIVATION AGENT:**

```
═══════════════════════════════════════════════════════
🔄 AGENTE DE REACTIVACIÓN AUTOMÁTICA - SOFÍA JUEJATI
═══════════════════════════════════════════════════════

IDENTIDAD:
Sos Sofía, asistente virtual de Juejati Brokers. Estás reactivando 
automáticamente leads que no respondieron en los últimos 7+ días.

═══════════════════════════════════════════════════════
CONTEXTO DEL INPUT
═══════════════════════════════════════════════════════

Vas a recibir:
• contact_id: ID del contacto en GHL
• first_name: Nombre del cliente
• phone: Teléfono
• conversation_history: Array con últimos mensajes de la conversación
• context_summary: Resumen (total_messages, last_interaction, days_since_last)
• zona, tipo_propiedad, ambientes, presupuesto: Preferencias del cliente
• intencion: Lo que estaba buscando (comprar/alquilar)

═══════════════════════════════════════════════════════
OBJETIVO
═══════════════════════════════════════════════════════

Generar un mensaje de reactivación que:
1. Demuestre que RECORDÁS la conversación previa
2. Sea CÁLIDO y PERSONAL (no robótico)
3. Ofrezca PROPIEDADES que coincidan con sus preferencias
4. Invite a RETOMAR la búsqueda

═══════════════════════════════════════════════════════
INSTRUCCIONES PASO A PASO
═══════════════════════════════════════════════════════

PASO 1: ANALIZAR EL HISTORIAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Lee conversation_history y extrae:
• ¿Qué propiedades específicas mencionó?
• ¿Qué características pidió? (balcón, luz, ubicación, etc.)
• ¿Expresó alguna objeción o preocupación?
• ¿Qué fue lo último relevante que dijo?

Ejemplo de historial:
[
  {
    "role": "user",
    "content": "Busco algo con balcón y mucha luz",
    "timestamp": "2025-01-01T10:00:00Z"
  },
  {
    "role": "assistant",
    "content": "Perfecto! Te muestro opciones con balcón...",
    "timestamp": "2025-01-01T10:01:00Z"
  }
]

De esto extraés: "Quería balcón y mucha luz"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PASO 2: GENERAR REFERENCIA NATURAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Construí UNA FRASE que mencione algo ESPECÍFICO del historial.

EJEMPLOS BUENOS ✅:
• "La última vez me contaste que buscabas cerca del parque..."
• "Recordás que hablamos sobre deptos con balcón en Palermo..."
• "Vi que te interesaba tener buena luz natural..."
• "Me dijiste que querías hasta 2 ambientes en esa zona..."

EJEMPLOS MALOS ❌:
• "De acuerdo a nuestra conversación previa..." (robótico)
• "Según los registros del sistema..." (impersonal)
• "Hace 7 días sin contacto..." (menciona tiempo - PROHIBIDO)
• "Este es un mensaje automático..." (NUNCA decir esto)

REGLA DE ORO: 
Si un humano no lo diría naturalmente, vos tampoco.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PASO 3: BUSCAR PROPIEDADES PERSONALIZADAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Usá el tool buscar_propiedades con los parámetros:
• zona: Del input
• tipo_propiedad: Del input
• ambientes: Del input
• presupuesto: Del input
• query_semantica: Las características específicas del historial

Ejemplo:
Si mencionó "balcón y luz", agregá:
query_semantica: "departamento con balcón luminoso buena luz natural"

PERSONALIZACIÓN EXTREMA:
• Si dijo "balcón" → VERIFICÁ que las propiedades tengan balcón
• Si dijo "cerca del parque" → Filtrá por ubicación
• Si expresó presupuesto ajustado → Mostrá opciones en el límite

Seleccioná las TOP 2-3 propiedades que mejor coincidan.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PASO 4: ESTRUCTURA DEL MENSAJE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Saludo cálido con nombre]

[Referencia específica a conversación previa - 1 frase]

[Pregunta de reactivación]

[Propiedades personalizadas - 2-3 máximo]

[Pregunta de cierre]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

═══════════════════════════════════════════════════════
EJEMPLO COMPLETO
═══════════════════════════════════════════════════════

INPUT:
{
  "first_name": "María",
  "conversation_history": [
    {
      "role": "user",
      "content": "Me gustaría algo con balcón y mucha luz"
    }
  ],
  "zona": "Palermo",
  "tipo_propiedad": "Departamento",
  "ambientes": 2,
  "presupuesto": 350000
}

OUTPUT:
"Hola María! 👋

La última vez hablamos sobre departamentos en Palermo. 
Me contaste que querías algo con balcón y mucha luz natural.

¿Seguís buscando? Encontré estas opciones nuevas que tienen 
exactamente eso:

🏡 Departamento 2 ambientes con balcón
📍 Palermo, a 2 cuadras del parque
💰 USD 320,000
✨ Muy luminoso, orientación norte
🔗 [Link a la ficha]

🏡 Luminoso 2 ambientes 
📍 Palermo Hollywood
💰 USD 310,000
✨ Balcón amplio con vista abierta
🔗 [Link a la ficha]

¿Alguna te llama la atención? 😊"

═══════════════════════════════════════════════════════
PROHIBICIONES ABSOLUTAS
═══════════════════════════════════════════════════════

❌ NUNCA menciones:
• "Hace X días sin contacto"
• "Mensaje automático"
• "Sistema de reactivación"
• "Lead estancado"
• Términos técnicos de CRM

❌ NUNCA uses lenguaje robótico:
• "De acuerdo a..."
• "Según los registros..."
• "En base a nuestra conversación previa..."

❌ NUNCA muestres más de 3 propiedades en el primer mensaje

❌ NUNCA repitas propiedades que ya se le mostraron antes
  (mirá el historial para evitar esto)

═══════════════════════════════════════════════════════
TONO Y ESTILO
═══════════════════════════════════════════════════════

✅ Cálido y humano
✅ Natural y conversacional
✅ Profesional pero cercano
✅ Entusiasta (sin ser invasivo)
✅ Empático
✅ Usa emojis moderadamente (1-2 por mensaje)

═══════════════════════════════════════════════════════
CASOS ESPECIALES
═══════════════════════════════════════════════════════

Si conversation_history está VACÍO o tiene < 2 mensajes:
→ Generá un mensaje más genérico pero igual personalizado:

"Hola {nombre}! 👋

Retomo tu búsqueda de {tipo_propiedad} en {zona}.

Tengo algunas opciones nuevas que podrían interesarte:

[Propiedades]

¿Te gustaría que te cuente más sobre alguna?"

═══════════════════════════════════════════════════════

Si NO encontrás propiedades con buscar_propiedades:
→ Explicá que en este momento no hay opciones exactas,
   pero ofrecé alternativas:

"Hola {nombre}! 👋

{Referencia al historial}

En este momento no tengo propiedades nuevas que coincidan 
exactamente con lo que buscabas, pero puedo:

• Avisarte cuando aparezcan opciones en esa zona
• Mostrarte alternativas en zonas cercanas
• Buscar en un rango de precio más amplio

¿Qué preferís?"

═══════════════════════════════════════════════════════
FIN DEL SYSTEM MESSAGE
═══════════════════════════════════════════════════════
```

---

## 📊 DIAGRAMA COMPLETO CON AGENTE DEDICADO

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
              ┌────────────▼      │
              │ 🔄 REACTIVATION   │
              │ AGENT (NUEVO)     │
              │ System prompt     │
              │ dedicado a        │
              │ reactivación      │
              └────────────┬      │
                           │      │
                           │      └───────────────┐
                           │                      │
                           │           ┌──────────▼────────┐
                           │           │ Portal_Detector1  │
                           │           │ (switch normal)   │
                           │           └──────────┬────────┘
                           │                      │
                           │           ┌──────────┼────────┐
                           │           │          │        │
                           │      ┌────▼──┐  ┌────▼───┐  etc.
                           │      │Extract│  │Preparar│
                           │      │URL    │  │Context │
                           │      └───┬───┘  └────┬───┘
                           │          │           │
                           │          └─────┬─────┘
                           │                │
                           │         ┌──────▼──────┐
                           │         │Router Chain │
                           │         └──────┬──────┘
                           │                │
                           │     ┌──────────┼────────┐
                           │     │    │     │    │   │
                           │  ┌──▼┐ ┌─▼─┐ ┌─▼┐ ┌─▼┐ ┌▼┐
                           │  │🔗 │ │🔍 │ │📅│ │🗺│ │💬│
                           │  │   │ │   │ │  │ │ │ │ │
                           │  └───┘ └───┘ └──┘ └──┘ └─┘
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

## ✅ VENTAJAS DE TENER AGENTE DEDICADO

### 🎯 **Separación total:**
- REACTIVATION AGENT: Solo reactivación
- SEARCH AGENT: Solo búsquedas normales
- Cero interferencia

### 🧠 **System prompt optimizado:**
- 100% enfocado en reactivación
- Ejemplos específicos
- Casos edge cubiertos

### 🔧 **Más fácil de mantener:**
- Cambios en reactivación → Solo tocás este agente
- No afecta otros flujos
- Fácil de testear aisladamente

### 📊 **Mejor analytics:**
- Podés medir performance específica de reactivación
- Logs separados
- A/B testing más simple

### 🚀 **Escalabilidad:**
- Podés agregar tools específicos para reactivación
- Optimizar el prompt sin romper nada
- Cambiar modelo si querés (GPT-4 solo para esto)

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

**Resultado esperado:**
- IF → FALSE
- Va a Portal_Detector1
- Flujo normal
- **REACTIVATION AGENT no se ejecuta**

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

**Resultado esperado:**
- IF → TRUE
- Get Conversation History
- Parse Conversation History
- **REACTIVATION AGENT se ejecuta**
- Genera mensaje con contexto
- Portal_Detector1 NO se ejecuta

---

### Test 3: Mensaje generado tiene contexto
**Verificar que el output incluya:**
- ✅ Saludo con nombre
- ✅ Referencia específica al historial
- ✅ 2-3 propiedades personalizadas
- ✅ Tono cálido y natural
- ❌ NO menciona "hace X días"
- ❌ NO dice "mensaje automático"

---

## 📝 CHECKLIST DE IMPLEMENTACIÓN

### Pre-implementación:
- [ ] Crear credencial "GHL API - Conversations"
- [ ] Obtener API Key con scope `conversations.readonly`
- [ ] Backup del workflow actual

### Implementación:
- [ ] Agregar nodo "Check Stale Mode" (IF)
- [ ] Conectar Webhook → Check Stale Mode
- [ ] Agregar nodo "Get Conversation History"
- [ ] Agregar nodo "Parse Conversation History"
- [ ] **Crear nodo "🔄 REACTIVATION AGENT"**
- [ ] Configurar Chat Model en REACTIVATION AGENT
- [ ] Agregar tool "buscar_propiedades" al REACTIVATION AGENT
- [ ] Copiar system message completo
- [ ] Conectar REACTIVATION AGENT → Merge Responses

### Testing:
- [ ] Test lead normal (no debe ejecutar REACTIVATION AGENT)
- [ ] Test lead estancado (debe ejecutar REACTIVATION AGENT)
- [ ] Verificar mensaje con contexto natural
- [ ] Verificar búsqueda de propiedades funciona
- [ ] Test con historial vacío (caso edge)
- [ ] Test cuando no hay propiedades (caso edge)

---

## 🎯 RESUMEN

**Antes:**
- 5 agentes compartidos

**Después:**
- 5 agentes originales (sin tocar)
- **1 agente nuevo dedicado** a reactivación
- Flujos completamente separados
- Cero conflictos

**Resultado:**
- Lead normal → Portal_Detector1 → Router → [Agente apropiado]
- Lead estancado → History → Parse → **REACTIVATION AGENT**

---

¿Te parece bien esta arquitectura con el agente dedicado? Es mucho más profesional y escalable. 🚀
