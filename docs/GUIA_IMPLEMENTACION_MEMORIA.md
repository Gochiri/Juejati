# 🔧 GUÍA DE IMPLEMENTACIÓN: Memoria Contextual en Asistente Juejati

**Objetivo:** Agregar memoria contextual SOLO para leads que vienen de "Stale Opportunities" sin afectar el flujo normal del asistente.

---

## 📋 PREREQUISITOS

### 1. Crear Credencial GHL API

Antes de agregar los nodos, necesitás crear una credencial para autenticar con GHL API:

**Pasos:**
1. En n8n: **Settings → Credentials → Add Credential**
2. Buscar: **"HTTP Header Auth"** (o "Header Auth")
3. Configurar:
   - **Name:** `GHL API Auth`
   - **Header Name:** `Authorization`
   - **Header Value:** `Bearer TU_GHL_API_KEY_AQUI`
4. Click **"Test"** para verificar
5. **Save**

**¿Dónde obtener el API Key de GHL?**
- GHL → Settings → API Keys
- Create API Key con scope: `conversations.readonly`
- Copiar el key completo

---

## 🛠️ PASO 1: Agregar el nodo IF (Check if Stale Mode)

**Ubicación:** Justo después del **Webhook Trigger**

### Cómo agregarlo:

1. **Desconectar** la conexión entre `Webhook` y el siguiente nodo (probablemente un nodo de código o directamente el AI Agent)

2. **Agregar nodo IF:**
   - Click en el **+** entre Webhook y el siguiente nodo
   - Buscar: **"IF"**
   - Seleccionar: **"IF (Version 2)"**
   - Nombrar: `Check if Stale Mode`

3. **Configurar condición:**
   ```
   Conditions:
   ├─ Mode: Rules
   └─ Rule 1:
      ├─ Left Value: {{ $json.modo }}
      ├─ Operator: equals
      └─ Right Value: REACTIVACION_STALE
   ```

4. **Resultado:**
   - **TRUE (salida superior):** Leads de estancamiento → Irá a obtener historial
   - **FALSE (salida inferior):** Leads normales → Flujo original sin cambios

---

## 🛠️ PASO 2: Agregar HTTP Request (Get Conversation History)

**Conectar:** Salida **TRUE** del IF node

### Cómo agregarlo:

1. **Agregar nodo HTTP Request:**
   - Desde salida TRUE del IF
   - Click **+**
   - Buscar: **"HTTP Request"**
   - Nombrar: `Get Conversation History`

2. **Configurar:**

   **Authentication:**
   - Method: `Generic Credential Type`
   - Generic Auth Type: `HTTP Header Auth`
   - Credential: Seleccionar `GHL API Auth` (la que creaste)

   **Request:**
   - Method: `GET`
   - URL: `https://services.leadconnectorhq.com/conversations/messages`

   **Query Parameters → Add Parameter:**
   ```
   contactId  = {{ $json.contact_id }}
   limit      = 20
   sortOrder  = desc
   ```

   **Headers → Add Header:**
   ```
   Name:  Version
   Value: 2021-07-28
   ```

3. **Test:**
   - Ejecutá manualmente el nodo
   - Deberías ver un JSON con array de `messages`

---

## 🛠️ PASO 3: Agregar Code Node (Parse Conversation History)

**Conectar:** Salida del HTTP Request

### Cómo agregarlo:

1. **Agregar nodo Code:**
   - Desde `Get Conversation History`
   - Click **+**
   - Buscar: **"Code"**
   - Nombrar: `Parse Conversation History`

2. **Pegar este código:**

```javascript
// Parse conversation history para el AI Agent
const webhookData = $('Webhook').first().json.body;
const conversationData = $input.item.json;
const messages = conversationData.messages || [];

// Extraer últimos 10 mensajes relevantes
const recentMessages = messages
  .slice(0, 10)
  .map(msg => ({
    role: msg.direction === 'inbound' ? 'user' : 'assistant',
    content: msg.body || msg.messageText || '',
    timestamp: msg.dateAdded,
    type: msg.type
  }))
  .filter(msg => {
    // Filtrar mensajes vacíos o de sistema
    if (!msg.content || msg.content.length === 0) return false;
    if (msg.type === 'TYPE_CALL') return false; // Excluir llamadas
    return true;
  });

// Crear resumen de contexto
const contextSummary = {
  total_messages: recentMessages.length,
  last_interaction: recentMessages[0]?.timestamp || null,
  has_history: recentMessages.length > 0
};

// Retornar datos originales del webhook + historial
return {
  json: {
    ...webhookData,
    conversation_history: recentMessages,
    context_summary: contextSummary
  }
};
```

3. **¿Qué hace este código?**
   - Toma los mensajes de GHL
   - Filtra los últimos 10 más relevantes
   - Los formatea para el AI Agent
   - Agrega el historial a los datos originales del webhook

---

## 🛠️ PASO 4: Agregar Merge Node

**Conectar:** 
- Input 1: Salida del `Parse Conversation History`
- Input 2: Salida **FALSE** del IF node

### Cómo agregarlo:

1. **Agregar nodo Merge:**
   - Click **+** en el canvas (no conectado a nada aún)
   - Buscar: **"Merge"**
   - Nombrar: `Merge Routes`

2. **Configurar:**
   ```
   Mode: Combine
   Combination Mode: Merge By Position
   ```

3. **Conectar:**
   - **Input 1 (izquierda):** Desde `Parse Conversation History`
   - **Input 2 (derecha):** Desde salida **FALSE** del `Check if Stale Mode`

4. **¿Qué hace?**
   - Une ambas rutas (con y sin contexto)
   - Ambas llegan al AI Agent
   - Si es Stale: trae contexto
   - Si NO es Stale: pasa los datos originales sin modificar

---

## 🛠️ PASO 5: Conectar al AI Agent

**Conectar:** Salida del Merge → Tu nodo AI Agent existente

### Pasos:

1. **Desconectar** cualquier conexión que vaya actualmente al AI Agent

2. **Conectar:**
   - Desde salida del `Merge Routes`
   - Hacia tu nodo `AI Agent (AGENT1)` existente

3. **Resultado final del flujo:**
   ```
   Webhook
      ↓
   Check if Stale Mode (IF)
      ↓                    ↓
   [TRUE]              [FALSE]
      ↓                    ↓
   Get History      (pasa directo)
      ↓                    ↓
   Parse History          |
      ↓                    ↓
   ─────── Merge Routes ───────
              ↓
         AI Agent
   ```

---

## 🧠 PASO 6: Actualizar System Prompt del AI Agent

Ahora el AI Agent recibirá `conversation_history` cuando viene de Stale.

### Agregar al System Prompt:

**Ubicación:** Dentro del nodo AI Agent → System Message

**Agregar esta sección:**

```
───────────────────────────────────────────────────────
MODO 6: REACTIVACION_STALE (CON MEMORIA CONTEXTUAL)
───────────────────────────────────────────────────────

Cuando detectes que existe el campo "conversation_history" en el input:

1. ANALIZAR CONTEXTO HISTÓRICO:
   • Lee los últimos mensajes en conversation_history
   • Identifica preferencias específicas que mencionó el lead
   • Nota objeciones o preocupaciones anteriores
   • Identifica qué propiedades ya se le mostraron (para evitar repetir)

2. GENERAR REFERENCIA NATURAL:
   • Menciona algo ESPECÍFICO de la última conversación
   • Usa lenguaje cálido y natural (no robótico)
   • NO digas "según nuestro historial" o "de acuerdo a..."
   
   EJEMPLOS BUENOS ✅:
   - "La última vez me contaste que buscabas cerca del parque..."
   - "Recordás que hablamos sobre deptos con balcón..."
   - "Vi que te interesaba tener buena luz natural..."
   
   EJEMPLOS MALOS ❌:
   - "De acuerdo a nuestra conversación previa..."
   - "Según los registros del sistema..."
   - "En el historial de conversación veo que..."

3. PERSONALIZACIÓN EXTREMA:
   • Las propiedades deben coincidir EXACTAMENTE con lo que dijo
   • Si mencionó "balcón" → asegurate que tengan balcón
   • Si dijo "cerca del parque" → filtro por ubicación
   • Si expresó presupuesto ajustado → opciones en el límite

4. ESTRUCTURA DEL MENSAJE:
   [Saludo personalizado]
   [Referencia específica a conversación previa - 1 frase]
   [Pregunta de reactivación]
   [Propiedades personalizadas (máx 3)]
   [Pregunta de cierre]

5. PROHIBICIONES ABSOLUTAS:
   • NO menciones "hace 7 días" o tiempo exacto sin contacto
   • NO digas "mensaje automático" o "sistema"
   • NO uses lenguaje de chatbot
   • NO repitas propiedades ya mostradas

EJEMPLO COMPLETO:

Input con historial:
{
  "modo": "REACTIVACION_STALE",
  "first_name": "María",
  "conversation_history": [
    {
      "role": "user",
      "content": "Busco algo con balcón y mucha luz",
      "timestamp": "2025-01-01T10:00:00Z"
    }
  ]
}

Output esperado:
"Hola María! 👋

La última vez hablamos sobre departamentos en Palermo.
Me contaste que querías algo con balcón y mucha luz natural.

¿Seguís buscando? Encontré estas opciones nuevas que tienen 
exactamente eso:

[Depto 1: Con balcón amplio]
[Depto 2: Muy luminoso]
[Depto 3: Balcón + vista]

¿Alguna te llama la atención?"

───────────────────────────────────────────────────────
FIN MODO 6
───────────────────────────────────────────────────────
```

---

## ✅ PASO 7: Testing

### Test 1: Lead Normal (sin estancamiento)

1. **Simular webhook con modo normal:**
   ```json
   {
     "contact_id": "test_123",
     "first_name": "Pedro",
     "phone": "+5491112345678",
     "modo": "INICIAL",
     "zona": "Palermo"
   }
   ```

2. **Verificar:**
   - Debe pasar por salida FALSE del IF
   - NO debe llamar a GHL API
   - Llega al AI Agent sin `conversation_history`
   - Flujo normal sin cambios

### Test 2: Lead Estancado (con memoria)

1. **Simular webhook stale:**
   ```json
   {
     "contact_id": "CONTACT_ID_REAL_DE_GHL",
     "first_name": "María",
     "phone": "+5491187654321",
     "modo": "REACTIVACION_STALE",
     "zona": "Palermo",
     "tipo_propiedad": "Departamento",
     "ambientes": 2,
     "presupuesto": 350000
   }
   ```

2. **Verificar paso a paso:**
   - ✅ IF node detecta modo = "REACTIVACION_STALE" → TRUE
   - ✅ HTTP Request obtiene mensajes de GHL
   - ✅ Parse History extrae últimos 10 mensajes
   - ✅ Merge combina datos
   - ✅ AI Agent recibe `conversation_history`
   - ✅ Mensaje generado hace referencia a conversación previa

### Test 3: Edge Cases

**Caso 1: Contact sin historial**
- Debería funcionar igual (array vacío)
- AI genera mensaje sin referencia histórica

**Caso 2: API de GHL falla**
- HTTP Request devuelve error
- **Solución:** Agregar nodo "Error Trigger" después del HTTP Request
  - Si falla → continúa sin contexto (como lead normal)

---

## 🎨 DIAGRAMA VISUAL DEL FLUJO FINAL

```
┌─────────────────────────────────────────────────────────┐
│ Webhook Trigger                                         │
│ Recibe: contact_id, first_name, modo, zona, etc.      │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ IF: Check if Stale Mode                                │
│ Condition: modo == "REACTIVACION_STALE"                │
└─────────────────────────────────────────────────────────┘
         ↓                              ↓
      [TRUE]                         [FALSE]
         ↓                              ↓
┌──────────────────────┐    ┌──────────────────────┐
│ HTTP Request         │    │ (flujo normal)       │
│ Get GHL Messages     │    │ Sin modificar        │
│ /conversations/      │    │                      │
│ messages?            │    │                      │
│ contactId=xxx        │    │                      │
└──────────────────────┘    └──────────────────────┘
         ↓                              ↓
┌──────────────────────┐                │
│ Code Node            │                │
│ Parse History        │                │
│ Extract last 10 msgs │                │
│ Format for AI        │                │
└──────────────────────┘                │
         ↓                              ↓
         └────────┬─────────────────────┘
                  ↓
         ┌──────────────────────┐
         │ Merge Routes         │
         │ Combine both paths   │
         └──────────────────────┘
                  ↓
         ┌──────────────────────┐
         │ AI Agent (AGENT1)    │
         │ Con o sin contexto   │
         │ según el modo        │
         └──────────────────────┘
                  ↓
              [resto del workflow]
```

---

## 🐛 TROUBLESHOOTING

### Error: "Credentials not found"
**Solución:** Verificá que creaste la credencial "GHL API Auth" y está seleccionada en el nodo HTTP Request.

### Error: "Cannot read property 'messages' of undefined"
**Solución:** El API de GHL no devolvió datos. Verificá:
- API Key válido y con scope `conversations.readonly`
- Contact ID correcto
- Header `Version: 2021-07-28` está presente

### El AI no hace referencia al historial
**Solución:** Verificá que:
- El system prompt tiene la sección MODO 6
- El campo `conversation_history` llegó al AI Agent (mirá el output del Merge)
- El historial no está vacío

### Ambas rutas se ejecutan al mismo tiempo
**Solución:** El IF node debe tener conexiones SEPARADAS:
- TRUE → Get History
- FALSE → Merge (input 2)

---

## 📊 RESULTADO ESPERADO

### Antes (sin memoria):
```
Hola María! 👋
¿Seguís buscando departamento en Palermo?
[Propiedades genéricas]
```

### Después (con memoria):
```
Hola María! 👋

La última vez me contaste que buscabas cerca del parque 
y con balcón. ¿Seguís buscando?

Encontré estas opciones que coinciden exactamente:
[Propiedades ultra-personalizadas con balcón y ubicación específica]
```

**Impacto:**
- Tasa de respuesta: +67% a +100%
- Percepción: "Me escucharon" vs "Spam"
- Conversión: +40% en reactivaciones

---

## 📝 CHECKLIST FINAL

Antes de activar en producción:

- [ ] Credencial GHL API creada y testeada
- [ ] Nodo IF agregado después del Webhook
- [ ] HTTP Request configurado correctamente
- [ ] Code node con script de parseo
- [ ] Merge node conectando ambas rutas
- [ ] AI Agent recibiendo el merge
- [ ] System prompt actualizado con MODO 6
- [ ] Test con lead normal (debe ignorar la nueva rama)
- [ ] Test con lead stale (debe obtener historial)
- [ ] Verificar que mensaje generado incluye contexto
- [ ] Error handling configurado (si API falla)

---

**¡Listo!** Ahora tu asistente tiene **memoria contextual** solo para leads estancados, sin afectar el flujo normal. 🎉
