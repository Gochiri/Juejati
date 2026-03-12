# 🧠 ACTUALIZACIÓN: MEMORIA CONTEXTUAL - SISTEMA STALE OPPORTUNITIES

**Fecha:** 5 de Enero 2026  
**Versión:** 2.0  
**Cliente:** Juejati Brokers

---

## 🎯 NUEVA CAPACIDAD: MEMORIA CONTEXTUAL

### ¿Qué es?

El sistema ahora puede **recuperar y analizar toda la conversación histórica** de cada lead antes de enviar mensajes de reactivación, utilizando la API de Conversaciones de GoHighLevel.

### ¿Por qué es importante?

**ANTES (Sistema básico):**
```
Hola María! 👋

¿Seguís buscando departamento en Palermo?

[Propiedades genéricas]
```

**AHORA (Con memoria contextual):**
```
Hola María! 👋

La última vez hablamos sobre deptos en Palermo cerca del parque. 
Me contaste que querías algo con balcón y buena luz natural.

¿Seguís buscando? Encontré estas opciones que coinciden 
exactamente con lo que me dijiste:

[Propiedades ultra-personalizadas]
```

**Resultado:** Los leads sienten que **realmente los escuchaste** la primera vez.

---

## 🔧 IMPLEMENTACIÓN TÉCNICA

### Endpoint de GHL utilizado:

```
GET https://services.leadconnectorhq.com/conversations/{conversationId}/messages
```

**Parámetros:**
- `conversationId`: ID de la conversación del contacto
- `limit`: Cantidad de mensajes a recuperar (recomendado: 20-50)
- `sortOrder`: Orden de mensajes (desc = más recientes primero)

**Response incluye:**
```json
{
  "messages": [
    {
      "id": "msg_123",
      "type": "SMS" | "Email" | "WhatsApp",
      "direction": "inbound" | "outbound",
      "body": "Texto del mensaje",
      "dateAdded": "2025-01-04T10:30:00Z",
      "contactId": "contact_456",
      "attachments": []
    }
  ]
}
```

---

## 📊 FLUJO ACTUALIZADO

### Workflow SR01 - Con Memoria Contextual

```
┌─────────────────────────────────────────────────────────────┐
│ PASO 1: DETECCIÓN (Sin cambios)                            │
│ GHL Native Trigger detecta lead estancado 7 días           │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ PASO 2: VERIFICACIONES (Sin cambios)                       │
│ - Tags de exclusión (detener_ia, stop bot)                 │
│ - WhatsApp válido                                           │
│ - Datos completos                                           │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ PASO 3: [NUEVO] RECUPERAR CONTEXTO                         │
│                                                             │
│ HTTP Request a GHL API:                                     │
│ GET /conversations/{conversationId}/messages?limit=20       │
│                                                             │
│ Recupera:                                                   │
│ • Últimos 20 mensajes de la conversación                   │
│ • Tanto inbound (del lead) como outbound (de Sofía)        │
│ • Timestamps de cada mensaje                               │
│ • Contexto completo de la última interacción               │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ PASO 4: [NUEVO] ANÁLISIS DE CONTEXTO                       │
│                                                             │
│ Sistema analiza mensajes históricos para extraer:          │
│                                                             │
│ ✓ Preferencias mencionadas por el lead                     │
│   "Me gustaría algo con balcón"                            │
│   "Prefiero cerca del parque"                              │
│                                                             │
│ ✓ Objeciones o preocupaciones                              │
│   "El presupuesto es un poco ajustado"                     │
│   "Necesito mudarse en 2 meses"                            │
│                                                             │
│ ✓ Propiedades ya mostradas                                 │
│   Evita repetir las mismas opciones                        │
│                                                             │
│ ✓ Última interacción significativa                         │
│   "La última propiedad que te gustó era..."                │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ PASO 5: HTTP REQUEST A N8N                                 │
│                                                             │
│ POST /webhook/Asistente_Juejati_Brokers                    │
│                                                             │
│ Body ACTUALIZADO:                                           │
│ {                                                           │
│   "contact_id": "{{contact.id}}",                          │
│   "first_name": "{{contact.first_name}}",                  │
│   "phone": "{{contact.phone}}",                            │
│   "modo": "REACTIVACION_STALE",                            │
│   "zona": "{{contact.zona}}",                              │
│   "tipo_propiedad": "{{contact.tipo_de_propiedad_2}}",    │
│   "presupuesto": "{{contact.presupuesto_ia}}",             │
│   "ambientes": "{{contact.ambientes}}",                    │
│   "intencion": "{{contact.intencion}}",                    │
│   "conversation_history": [                                │  ← NUEVO
│     {                                                       │
│       "role": "user",                                      │
│       "content": "Busco depto en Palermo con balcón",     │
│       "timestamp": "2025-01-01T10:00:00Z"                 │
│     },                                                      │
│     {                                                       │
│       "role": "assistant",                                 │
│       "content": "Perfecto! Te muestro opciones...",      │
│       "timestamp": "2025-01-01T10:01:00Z"                 │
│     }                                                       │
│   ]                                                         │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ PASO 6: AI AGENT1 (Sofía) - Con Contexto                  │
│                                                             │
│ System Prompt ACTUALIZADO:                                  │
│ """                                                         │
│ MODO 6: REACTIVACION_STALE                                 │
│                                                             │
│ Tienes acceso al historial completo de la conversación    │
│ en conversation_history.                                   │
│                                                             │
│ INSTRUCCIONES:                                              │
│ 1. Lee los últimos 5-10 mensajes del historial            │
│ 2. Identifica preferencias específicas del lead            │
│ 3. Menciona algo concreto de la última conversación       │
│ 4. Busca propiedades que coincidan con esas preferencias  │
│ 5. Genera mensaje cálido y personalizado                  │
│                                                             │
│ EJEMPLO DE REFERENCIA:                                     │
│ "La última vez me contaste que buscabas cerca del         │
│  parque y con buena luz. Encontré..."                     │
│                                                             │
│ NO menciones:                                              │
│ - "Hace 7 días"                                            │
│ - Tiempo exacto sin contacto                               │
│ - Que es un mensaje automático                            │
│ """                                                         │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ PASO 7: BÚSQUEDA DE PROPIEDADES (Sin cambios)             │
│ Sub-workflow Buscar_Propiedades                            │
│ - Supabase Vector Search                                   │
│ - Cohere Reranking                                          │
│ - Top 3 propiedades                                        │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ PASO 8: GENERACIÓN DE MENSAJE MEJORADO                    │
│                                                             │
│ Mensaje ANTES (sin contexto):                              │
│ "Hola María! ¿Seguís buscando en Palermo?"                │
│                                                             │
│ Mensaje AHORA (con contexto):                              │
│ "Hola María! La última vez hablamos sobre deptos en       │
│  Palermo. Me dijiste que querías algo con balcón y        │
│  buena luz, cerca del parque. ¿Seguís buscando?           │
│  Encontré estas opciones que coinciden exactamente..."     │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ PASO 9-11: ENVÍO Y SEGUIMIENTO (Sin cambios)              │
│ - Envío WhatsApp con propiedades                           │
│ - Add tag "busqueda tokko"                                 │
│ - Wait 48h para Mensaje 2                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 📈 IMPACTO ESPERADO

### Métricas Mejoradas:

| Métrica | Sin Memoria | Con Memoria | Mejora |
|---------|-------------|-------------|---------|
| **Tasa de respuesta Msg 1** | 15% | **25-30%** | +67% - +100% |
| **Tasa de reactivación total** | 25% | **35-40%** | +40% - +60% |
| **Percepción de personalización** | Media | **Alta** | - |
| **Quejas por "spam"** | 5% | **<1%** | -80% |

### ¿Por qué funciona mejor?

**Psicología del lead:**
1. **"Me recuerdan"** → Genera confianza
2. **"Escucharon lo que dije"** → Sentimiento de valor
3. **"No es un mensaje masivo"** → Mayor engagement
4. **"Entienden mis necesidades"** → Más probabilidad de responder

---

## 💰 IMPACTO EN ROI

### ROI Original (sin memoria contextual):
- Leads adicionales/mes: **7**
- Tasa de reactivación: 25%
- ROI mensual: 9,600%

### ROI Mejorado (con memoria contextual):
- Leads adicionales/mes: **10-12** *(+40% más)*
- Tasa de reactivación: 35-40%
- ROI mensual: **13,400%** *(+40% mejor)*

**Inversión adicional:** $0 USD
**Tiempo de implementación adicional:** +2-3 horas

**Resultado:** Mejor ROI sin costo adicional, solo configuración técnica.

---

## 🔒 CONSIDERACIONES DE PRIVACIDAD

### Datos que SE usan:
✅ Mensajes de la conversación actual con el contacto
✅ Preferencias expresadas por el lead
✅ Contexto de búsqueda de propiedades

### Datos que NO SE usan:
❌ Conversaciones de otros contactos
❌ Información personal sensible
❌ Datos fuera del contexto de búsqueda inmobiliaria

### Cumplimiento:
- Los datos ya están en GHL (no se crean nuevos)
- El lead ya consintió comunicación vía WhatsApp
- Sistema respeta tags de exclusión (detener_ia, stop bot)
- No se almacena historial fuera de GHL

---

## ⚙️ MODIFICACIONES TÉCNICAS REQUERIDAS

### 1. Workflow SR01 (GHL)

**Agregar ANTES del HTTP Request a n8n:**

```
┌─────────────────────────────────────────┐
│ NUEVO NODO: HTTP Request                │
│                                         │
│ Method: GET                             │
│ URL: https://services.leadconnectorhq  │
│      .com/conversations/messages        │
│                                         │
│ Query Params:                           │
│ - contactId: {{contact.id}}            │
│ - limit: 20                             │
│ - sortOrder: desc                       │
│                                         │
│ Headers:                                │
│ - Authorization: Bearer {{api_key}}     │
│ - Version: 2021-07-28                   │
│                                         │
│ Output variable:                        │
│ - conversation_history                  │
└─────────────────────────────────────────┘
```

### 2. HTTP Request a n8n (GHL)

**Agregar campo en JSON body:**

```json
{
  "contact_id": "{{contact.id}}",
  "first_name": "{{contact.first_name}}",
  "phone": "{{contact.phone}}",
  "modo": "REACTIVACION_STALE",
  "zona": "{{contact.zona}}",
  "tipo_propiedad": "{{contact.tipo_de_propiedad_2}}",
  "presupuesto": "{{contact.presupuesto_ia}}",
  "ambientes": "{{contact.ambientes}}",
  "intencion": "{{contact.intencion}}",
  "conversation_history": "{{conversation_history}}"  ← NUEVO
}
```

### 3. n8n Webhook (Asistente_Juejati_Brokers)

**Modificar para aceptar nuevo parámetro:**

```javascript
// En nodo Edit Fields o Code
const conversationHistory = $input.item.json.conversation_history || [];

// Parsear si viene como string
const parsedHistory = typeof conversationHistory === 'string' 
  ? JSON.parse(conversationHistory) 
  : conversationHistory;

// Pasar al AI Agent
```

### 4. AI AGENT1 System Prompt

**Agregar sección MODO 6:**

```
MODO 6: REACTIVACION_STALE (CON MEMORIA CONTEXTUAL)

Cuando detectes modo="REACTIVACION_STALE":

1. ANALIZAR CONTEXTO:
   - Lee conversation_history (últimos 10 mensajes)
   - Identifica preferencias específicas del lead
   - Nota cualquier objeción o preocupación mencionada
   - Identifica propiedades ya mostradas (para evitar repetir)

2. REFERENCIA NATURAL:
   - Menciona algo específico de la última conversación
   - Usa lenguaje natural, no forzado
   - NO digas "según nuestro historial" o similar
   - Ejemplos:
     ✓ "La última vez me contaste que..."
     ✓ "Recordás que hablamos sobre..."
     ✓ "Vi que te interesaba..."
     ✗ "De acuerdo a nuestra conversación previa..."
     ✗ "Según los registros..."

3. PERSONALIZACIÓN EXTREMA:
   - Busca propiedades que coincidan EXACTAMENTE con preferencias
   - Si mencionó "balcón", asegúrate que las propiedades tengan balcón
   - Si dijo "cerca del parque", filtra por ubicación específica
   - Si expresó presupuesto ajustado, muestra opciones en el límite

4. FORMATO DE MENSAJE:
   [Saludo + nombre]
   [Referencia a conversación previa - 1 frase específica]
   [Pregunta de reactivación]
   [Propiedades (máx 3)]
   [Pregunta de cierre]

5. PROHIBICIONES:
   - NO menciones "hace 7 días" o tiempo exacto
   - NO digas "mensaje automático"
   - NO uses lenguaje robótico
   - NO repitas propiedades ya mostradas

EJEMPLO COMPLETO:

Entrada:
{
  "modo": "REACTIVACION_STALE",
  "first_name": "María",
  "zona": "Palermo",
  "tipo_propiedad": "Departamento",
  "ambientes": 2,
  "presupuesto": 350000,
  "conversation_history": [
    {
      "role": "user",
      "content": "Me gustaría algo con balcón y mucha luz",
      "timestamp": "2025-01-01T10:00:00Z"
    },
    {
      "role": "assistant",
      "content": "Perfecto! Te muestro opciones con balcón en Palermo",
      "timestamp": "2025-01-01T10:01:00Z"
    }
  ]
}

Salida:
"Hola María! 👋

La última vez hablamos sobre departamentos en Palermo. 
Me contaste que querías algo con balcón y mucha luz natural.

¿Seguís buscando? Encontré estas opciones nuevas que tienen 
exactamente eso:

[Depto 2 amb con balcón - USD 320k]
[Luminoso 2 amb - USD 310k]
[2 amb con terraza - USD 340k]

¿Alguna te llama la atención?"
```

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: Configuración GHL (2-3h)
- [ ] Obtener API key con scope `conversations.readonly`
- [ ] Crear HTTP Request node para obtener mensajes
- [ ] Testear endpoint con contacto de prueba
- [ ] Verificar formato de respuesta
- [ ] Agregar manejo de errores (si API falla)

### Fase 2: Integración n8n (2-3h)
- [ ] Modificar webhook para aceptar `conversation_history`
- [ ] Agregar nodo de parseo de historial
- [ ] Implementar lógica de extracción de preferencias
- [ ] Testear con datos reales

### Fase 3: Actualización AI Agent (1-2h)
- [ ] Actualizar system prompt con MODO 6
- [ ] Agregar ejemplos de referencia contextual
- [ ] Testear generación de mensajes con contexto
- [ ] Validar que no repite propiedades ya mostradas

### Fase 4: Testing End-to-End (1-2h)
- [ ] Crear contacto de prueba con historial
- [ ] Simular estancamiento
- [ ] Verificar recuperación de contexto
- [ ] Validar mensaje generado
- [ ] Confirmar naturalidad del mensaje

### Fase 5: Go-Live (0.5h)
- [ ] Activar en producción
- [ ] Monitorear primeros 10 mensajes
- [ ] Ajustar si es necesario

**TIEMPO TOTAL: +6-10 horas adicionales**

---

## 🎯 PRÓXIMOS PASOS

1. **Aprobación del cliente** sobre funcionalidad de memoria contextual
2. **Revisión de privacidad** con equipo legal de Juejati (si aplica)
3. **Implementación técnica** siguiendo checklist
4. **Testing con 5-10 leads** antes de escalar
5. **Monitoreo de métricas** primeras 2 semanas
6. **Optimización** según feedback y resultados

---

## ❓ PREGUNTAS FRECUENTES

**Q: ¿Qué pasa si la conversación tiene más de 100 mensajes?**  
A: Solo recuperamos los últimos 20-50 mensajes (más recientes). Suficiente para contexto sin sobrecargar el sistema.

**Q: ¿Funciona si la última conversación fue por email en vez de WhatsApp?**  
A: Sí. El endpoint de conversaciones incluye todos los canales (WhatsApp, SMS, Email, etc.)

**Q: ¿Qué pasa si el historial está vacío (lead nuevo)?**  
A: El sistema detecta esto y genera mensaje sin referencia contextual (igual que el sistema básico).

**Q: ¿Aumenta el costo de la API de GHL?**  
A: El impacto es mínimo. Cada reactivación = 1 llamada GET adicional. Dentro de los límites de rate limit de GHL (100 req/10sec).

**Q: ¿Se puede desactivar si no funciona bien?**  
A: Sí. Se puede revertir a sistema básico en 5 minutos eliminando el nodo de recuperación de historial.

---

**Documento preparado por:** Korvance - GHL Implementation  
**Para:** Juejati Brokers  
**Versión:** 2.0 (Con Memoria Contextual)  
**Contacto:** german@korvance.com
