# 🔧 MODIFICACIONES EXACTAS PARA TU WORKFLOW ACTUAL

**Archivo:** Asistente_Multi-Agente_Juejati_v2.json

---

## 📋 ESTRUCTURA ACTUAL DETECTADA:

```
Webhook Trigger
    ↓
Portal_Detector1 (switch)
    ├─→ Extraer URL → HTTP Request → Parsear Propiedad → Router Chain
    └─→ Preparar Contexto → Router Chain
            ↓
    Router Chain (clasifica intención)
            ↓
    [5 AI Agents especializados]
```

---

## 🎯 MODIFICACIÓN: Agregar Memoria Contextual

### PASO 1: Crear Credencial GHL API

**Antes de importar el JSON modificado:**

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

### PASO 2: Agregar 4 nodos nuevos

Voy a darte las posiciones exactas donde agregar cada nodo:

#### **NODO 1: IF "Check Stale Mode"**

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
- **Output TRUE:** Hacia "Get Conversation History" (nuevo nodo)
- **Output FALSE:** Hacia "Portal_Detector1" (ya existe)

---

#### **NODO 2: HTTP Request "Get Conversation History"**

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
  "position": [-1700, -50],
  "credentials": {
    "httpHeaderAuth": {
      "id": "ID_DE_TU_CREDENCIAL",
      "name": "GHL API - Conversations"
    }
  }
}
```

**IMPORTANTE:** Reemplazá `"ID_DE_TU_CREDENCIAL"` con el ID real de la credencial que creaste.

**Conexiones:**
- **Input:** Desde salida TRUE del "Check Stale Mode"
- **Output:** Hacia "Parse Conversation History" (nuevo nodo)

---

#### **NODO 3: Code "Parse Conversation History"**

**Conectar desde:** "Get Conversation History"

**Configuración:**
```json
{
  "parameters": {
    "jsCode": "// Parse conversation history para el AI Agent\nconst webhookData = $('Webhook Trigger').first().json.body;\nconst conversationData = $input.item.json;\nconst messages = conversationData.messages || [];\n\n// Extraer últimos 10 mensajes relevantes\nconst recentMessages = messages\n  .slice(0, 10)\n  .map(msg => ({\n    role: msg.direction === 'inbound' ? 'user' : 'assistant',\n    content: msg.body || msg.messageText || '',\n    timestamp: msg.dateAdded,\n    type: msg.type\n  }))\n  .filter(msg => {\n    // Filtrar mensajes vacíos o de sistema\n    if (!msg.content || msg.content.length === 0) return false;\n    if (msg.type === 'TYPE_CALL') return false; // Excluir llamadas\n    return true;\n  });\n\n// Crear resumen de contexto\nconst contextSummary = {\n  total_messages: recentMessages.length,\n  last_interaction: recentMessages[0]?.timestamp || null,\n  has_history: recentMessages.length > 0\n};\n\n// Log para debugging\nconsole.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');\nconsole.log('🧠 MEMORIA CONTEXTUAL');\nconsole.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');\nconsole.log('Mensajes recuperados:', recentMessages.length);\nconsole.log('Última interacción:', contextSummary.last_interaction);\nconsole.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');\n\n// Retornar TODOS los datos del webhook + historial\nreturn {\n  json: {\n    ...webhookData,\n    conversation_history: recentMessages,\n    context_summary: contextSummary\n  }\n};"
  },
  "id": "parse-conv-history-node",
  "name": "Parse Conversation History",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [-1500, -50]
}
```

**Conexiones:**
- **Input:** Desde "Get Conversation History"
- **Output:** Hacia "Merge Routes Before Router" (nuevo nodo)

---

#### **NODO 4: Merge "Merge Routes Before Router"**

**Conectar desde:**
- Input 1: "Parse Conversation History"
- Input 2: Salida FALSE del "Check Stale Mode"

**Configuración:**
```json
{
  "parameters": {
    "mode": "combine",
    "combinationMode": "mergeByPosition",
    "options": {}
  },
  "id": "merge-stale-routes",
  "name": "Merge Routes Before Router",
  "type": "n8n-nodes-base.merge",
  "typeVersion": 3,
  "position": [-1300, 96]
}
```

**Conexiones:**
- **Input 1 (izquierda):** Desde "Parse Conversation History"
- **Input 2 (derecha):** Desde salida FALSE de "Check Stale Mode"
- **Output:** Hacia "Portal_Detector1" (ya existe)

---

## 📊 FLUJO FINAL:

```
Webhook Trigger
      ↓
Check Stale Mode (IF NUEVO)
      ↓                              ↓
    [TRUE]                        [FALSE]
      ↓                              ↓
Get Conversation History          (pasa)
      ↓                              ↓
Parse Conversation History          |
      ↓                              ↓
      └─→ Merge Routes Before Router ←┘
                  ↓
           Portal_Detector1 (ya existe)
              ↓  ↓  ↓
        [tu flujo actual sin cambios]
```

---

## 🧠 PASO 3: Actualizar System Prompts de los AI Agents

En cada uno de los 5 AI Agents (🔗 LINK, 🔍 SEARCH, 📅 VISITS, 🗺️ ZONE, 💬 GENERAL), **agregar al final del system prompt**:

```
───────────────────────────────────────────────────────
MEMORIA CONTEXTUAL (Modo Reactivación)
───────────────────────────────────────────────────────

Si el input contiene el campo "conversation_history":

1. ANALIZAR CONTEXTO:
   • Lee los últimos mensajes para entender la conversación previa
   • Identifica preferencias específicas que mencionó el cliente
   • Nota objeciones o preocupaciones anteriores

2. REFERENCIA NATURAL AL CONTEXTO:
   • Menciona algo ESPECÍFICO de la última conversación
   • Usa lenguaje natural y cálido
   
   EJEMPLOS BUENOS ✅:
   - "La última vez me contaste que buscabas cerca del parque..."
   - "Recordás que hablamos sobre deptos con balcón..."
   - "Vi que te interesaba tener buena luz natural..."
   
   EJEMPLOS MALOS ❌:
   - "De acuerdo a nuestra conversación previa..."
   - "Según los registros..."
   - "En el historial veo que..."

3. PERSONALIZACIÓN EXTREMA:
   • Las propiedades deben coincidir con lo que dijo anteriormente
   • Si mencionó "balcón", asegurate que lo tengan
   • Si expresó presupuesto ajustado, muestra opciones en el límite

4. PROHIBICIONES:
   • NO menciones "hace X días" o tiempo sin contacto
   • NO digas "mensaje automático"
   • NO uses lenguaje robótico

───────────────────────────────────────────────────────
```

**¿Dónde agregarlo?**
- Abrí cada nodo AI Agent
- Andá al final del "System Message"
- Pegá el texto de arriba

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Pre-implementación:
- [ ] Crear credencial "GHL API - Conversations" en n8n
- [ ] Obtener API Key de GHL con scope `conversations.readonly`
- [ ] Hacer backup del workflow actual

### Implementación:
- [ ] Agregar nodo "Check Stale Mode" (IF)
- [ ] Agregar nodo "Get Conversation History" (HTTP Request)
- [ ] Agregar nodo "Parse Conversation History" (Code)
- [ ] Agregar nodo "Merge Routes Before Router" (Merge)
- [ ] Conectar todos los nodos según diagrama
- [ ] Actualizar system prompts de los 5 AI Agents

### Testing:
- [ ] Test 1: Lead normal (modo != REACTIVACION_STALE)
  - Debe pasar por FALSE → sin obtener historial
- [ ] Test 2: Lead estancado (modo = REACTIVACION_STALE)
  - Debe pasar por TRUE → obtener historial → parsear
- [ ] Test 3: Verificar que conversation_history llega a los AI Agents
- [ ] Test 4: Verificar que los mensajes generados hacen referencia al contexto

---

## 🐛 TROUBLESHOOTING

### Error: "Credentials not found"
**Causa:** La credencial no está creada o el ID no coincide
**Solución:** 
1. Verificá que creaste la credencial "GHL API - Conversations"
2. En el nodo "Get Conversation History", reseleccioná la credencial

### Error: "Cannot read property 'messages' of undefined"
**Causa:** GHL API no devolvió mensajes
**Solución:**
1. Verificá que el contact_id es válido
2. Verificá que el API Key tiene scope `conversations.readonly`
3. Verificá que el header `Version: 2021-07-28` está presente

### Los AI Agents no usan el contexto
**Causa:** El campo conversation_history no llegó o el prompt no está actualizado
**Solución:**
1. Ejecutá el workflow y mirá el output del "Merge Routes Before Router"
2. Verificá que `conversation_history` está presente en el JSON
3. Verificá que agregaste la sección de MEMORIA CONTEXTUAL a todos los AI Agents

### El flujo se rompe para leads normales
**Causa:** La conexión FALSE del IF no va al lugar correcto
**Solución:**
1. Verificá que la salida FALSE del "Check Stale Mode" va a "Portal_Detector1"
2. Verificá que "Portal_Detector1" recibe datos del "Merge Routes Before Router"

---

## 📸 DIAGRAMA VISUAL DETALLADO

```
                    ┌─────────────────────┐
                    │  Webhook Trigger    │
                    │  POST /asistente... │
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
                    ┌──────▼──────▼───────┐
                    │ Merge Routes        │
                    │ Before Router       │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Portal_Detector1   │
                    │  (tu switch actual) │
                    └──┬──────────────┬───┘
                       │              │
            ┌──────────▼─┐      ┌────▼──────────┐
            │ Extraer URL│      │Preparar       │
            │ HTTP Req   │      │Contexto       │
            │ Parse Prop │      │               │
            └──────┬─────┘      └────┬──────────┘
                   │                 │
                   └────────┬────────┘
                            │
                    ┌───────▼────────┐
                    │  Router Chain  │
                    │  (clasifica)   │
                    └───────┬────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │         │        │        │         │
    ┌────▼───┐ ┌──▼──┐ ┌───▼──┐ ┌───▼──┐ ┌───▼──┐
    │🔗 LINK │ │🔍   │ │📅    │ │🗺️   │ │💬    │
    │        │ │SEAR │ │VISIT │ │ZONE  │ │GENER │
    │HANDLER │ │CH   │ │S     │ │      │ │AL    │
    └────────┘ └─────┘ └──────┘ └──────┘ └──────┘
```

---

## 🎯 RESULTADO ESPERADO

### Antes (sin memoria):
**Mensaje de reactivación:**
```
Hola Juan! 👋
¿Seguís buscando propiedad?
```

### Después (con memoria):
**Mensaje de reactivación:**
```
Hola Juan! 👋

La última vez hablamos sobre departamentos en Palermo. 
Me contaste que querías algo con balcón y cerca del parque.

¿Seguís buscando? Encontré estas opciones que coinciden 
exactamente con lo que me dijiste:

[Propiedades personalizadas con balcón en Palermo]
```

---

## 📝 NOTAS FINALES

1. **No afecta el flujo normal:** Leads que no vienen con `modo=REACTIVACION_STALE` siguen funcionando igual que siempre.

2. **Graceful degradation:** Si la API de GHL falla, el flujo continúa sin contexto (por la ruta FALSE).

3. **Performance:** El HTTP Request a GHL agrega ~200-500ms al tiempo de respuesta, solo para leads estancados.

4. **Límites de GHL:** El rate limit de GHL es 100 req/10seg. Con leads estancados siendo minoría, no deberías tener problemas.

5. **Privacidad:** Solo se acceden mensajes del contacto específico, no de otros usuarios.

---

**¿Necesitás ayuda con algún paso específico?** Puedo darte más detalles sobre cualquier parte de la implementación.
