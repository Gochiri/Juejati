# 🗺️ MAPA VISUAL: SISTEMA STALE OPPORTUNITIES - JUEJATI BROKERS

**Cliente:** Juejati Brokers  
**Location ID:** `WWrBqekGJCsCmSSvPzEf`  
**Pipeline:** 01 - Compradores - Seguimiento IA (`tDFS4eZP5Rliei09iGIK`)  
**Fecha:** 4 de Enero 2026  
**Metodología:** 70% Planning, 30% Ejecución

---

## 📊 RESUMEN EJECUTIVO

### Componentes del Sistema

| Tipo | Código | Nombre | Estado |
|------|--------|--------|--------|
| **Detección** | TRIGGER | Stale Opportunities (GHL Native) | ✅ Nativo GHL |
| **Workflow 1** | SR01 | Secuencia Reactivación WhatsApp | 🔨 A implementar |
| **Workflow 2** | SH01 | Escalamiento a Humano | 🔨 A implementar |
| **Workflow 3** | SM01 | Reportes Semanales | 🔨 A implementar |
| **Integración** | N8N-01 | Asistente Juejati (Modo Reactivación) | 🔨 A modificar |
| **Integración** | N8N-02 | Búsqueda Propiedades Tokko | ✅ Existente |

### Métricas del Proyecto

```
ALCANCE:
├─ Workflows a crear: 3
├─ Workflow a modificar: 1 (Asistente IA)
├─ Custom fields: 0 nuevos (usa existentes)
├─ Tags: 4 (2 existentes + 2 nuevos)
└─ Integraciones externas: 2 (n8n + Tokko API)

TIMELINE:
├─ Fase 1 - Configuración: 8-12 horas
├─ Fase 2 - Integración: 6-8 horas
├─ Fase 3 - Testing: 4-6 horas
└─ TOTAL: 18-26 horas (3 semanas)

ROI ESPERADO:
├─ Recuperación leads: +20-30%
├─ Tiempo ahorrado: 70%
└─ Conversiones adicionales: 7 leads/mes
```

---

## 🎨 MAPA VISUAL DEL SISTEMA

### Color Coding

```
🔵 AZUL    = Detección automática (Triggers)
🟢 VERDE   = Workflows de reactivación
🔴 ROJO    = Escalamiento a humano
🟣 MORADO  = Reportes y analytics
⚪ GRIS    = Decisiones / Condiciones
🟡 AMARILLO = Integraciones externas
```

---

## 📍 MAPA COMPLETO

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  🔵 DETECCIÓN AUTOMÁTICA                                    ┃
┃  TRIGGER NATIVO GHL: Stale Opportunities                    ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
              ↓
    ┌─────────────────┐
    │ Oportunidad sin │
    │ actividad 7 días│
    │ Pipeline: SP01  │
    │ Stage: En Seg   │
    └─────────────────┘
              ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  🟢 SR01: SECUENCIA REACTIVACIÓN WHATSAPP                   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
              ↓
    ┌────────────────────────────────────────┐
    │ ⚪ CONDICIÓN 1: Verificar exclusiones  │
    │ IF Contact has tags:                   │
    │  • "detener ia"                        │
    │  • "detener_ia"                        │
    │  • "stop bot"                          │
    │  • "[whatsapp] - not registered"      │
    │ THEN: END                              │
    └────────────────────────────────────────┘
              ↓ NO (Continuar)
    ┌────────────────────────────────────────┐
    │ ⚪ CONDICIÓN 2: Verificar WhatsApp     │
    │ IF Contact.phone is EMPTY              │
    │ THEN: END                              │
    └────────────────────────────────────────┘
              ↓ NO (Tiene WhatsApp)
    ┌────────────────────────────────────────┐
    │ ⚪ CONDICIÓN 3: Verificar duplicados   │
    │ IF Contact has tag                     │
    │    "oportunidad estancada 7 dias"      │
    │ THEN: END (ya procesado)               │
    └────────────────────────────────────────┘
              ↓ NO (Primera vez)
    ┌────────────────────────────────────────┐
    │ 📌 ACCIÓN 1: Marcar como estancado    │
    │ Add tag:                               │
    │ "oportunidad estancada 7 dias"         │
    │ (h77DAbGrkv1BS4ieCUD2)                 │
    └────────────────────────────────────────┘
              ↓
    ┌────────────────────────────────────────┐
    │ 📝 ACCIÓN 2: Crear nota interna        │
    │ "[STALE OPP] Lead detectado como       │
    │  estancado automáticamente.            │
    │  Sistema iniciará reactivación."       │
    └────────────────────────────────────────┘
              ↓
    ┌────────────────────────────────────────┐
    │ ⚪ CONDICIÓN 4: Datos completos?       │
    │ IF Contact has:                        │
    │  • zona                                │
    │  • tipo_de_propiedad_2                 │
    │  • presupuesto_ia                      │
    │  • ambientes                           │
    │ THEN: Ruta A (Con IA)                  │
    │ ELSE: Ruta B (Template genérico)       │
    └────────────────────────────────────────┘
              ↓
        ┌─────┴─────┐
        │           │
   RUTA A         RUTA B
   (Con IA)       (Sin IA)
        │           │
        ↓           ↓

┌──────────────────────┐  ┌──────────────────────┐
│ 🟡 RUTA A: CON IA    │  │ RUTA B: SIN IA       │
│ (DATOS COMPLETOS)    │  │ (DATOS INCOMPLETOS)  │
└──────────────────────┘  └──────────────────────┘
        ↓                         ↓
┌──────────────────────┐  ┌──────────────────────┐
│ 🟡 N8N-01: Asistente │  │ 📱 Send WhatsApp     │
│ Juejati              │  │ Template genérico:   │
│                      │  │ "Hola! ¿Seguís       │
│ HTTP Request:        │  │  buscando propiedad? │
│ POST /webhook/       │  │  Contame y te ayudo" │
│ Asistente_Juejati    │  │                      │
│                      │  └──────────────────────┘
│ Body:                │          ↓
│ {                    │  ┌──────────────────────┐
│  contact_id,         │  │ ⏰ WAIT 48h          │
│  first_name,         │  └──────────────────────┘
│  modo: "REACTIVACION"│          ↓
│  zona,               │     [Continúa en
│  tipo_propiedad,     │      Mensaje 2]
│  presupuesto,        │
│  ambientes           │
│ }                    │
└──────────────────────┘
        ↓
┌──────────────────────────────────────────┐
│ 🤖 AI AGENT1 (Sofía)                     │
│ System Prompt Addition:                  │
│ MODO_REACTIVACION detectado              │
│                                          │
│ Acciones automáticas:                    │
│ 1. Think: Guardar contexto               │
│ 2. propiedades(query_id, query)          │
│    → Buscar en Supabase Vector DB        │
│ 3. Formatear con template específico     │
└──────────────────────────────────────────┘
        ↓
┌──────────────────────────────────────────┐
│ 🟡 N8N-02: Búsqueda Propiedades          │
│ Sub-workflow existente                   │
│                                          │
│ 1. Parse query estructurado              │
│    zona:palermo;tipo:depto;amb:2         │
│ 2. Supabase Vector Search                │
│    + OpenAI Embeddings                   │
│    + Cohere Reranking                    │
│ 3. Filtrado exacto post-búsqueda         │
│ 4. Return: Top 3 propiedades             │
└──────────────────────────────────────────┘
        ↓
┌──────────────────────────────────────────┐
│ 🤖 AI AGENT1 genera mensaje              │
│                                          │
│ Template EXACTO:                         │
│ ┌──────────────────────────────────────┐ │
│ │ Hola {{first_name}}! 👋              │ │
│ │                                      │ │
│ │ Hace unos días estuvimos conversando│ │
│ │ sobre tu búsqueda de {{tipo}} en    │ │
│ │ {{zona}}.                            │ │
│ │                                      │ │
│ │ ¿Seguís buscando? Tenemos propiedades│ │
│ │ nuevas que podrían interesarte 🏡   │ │
│ │                                      │ │
│ │ [Propiedad 1]                        │ │
│ │ Precio: USD XXX                      │ │
│ │ 📍 Barrio                            │ │
│ │ 🖼️ [imagen]                          │ │
│ │ 🔗 Ver ficha                         │ │
│ │                                      │ │
│ │ [Propiedad 2]                        │ │
│ │ [Propiedad 3]                        │ │
│ │                                      │ │
│ │ ¿Alguna te llama la atención?        │ │
│ └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘
        ↓
┌──────────────────────────────────────────┐
│ 📱 Envío WhatsApp desde n8n              │
│ (vía GHL API o directo a WhatsApp)       │
│                                          │
│ Loop por cada parte:                     │
│ 1. Cabecera (texto)                      │
│ 2. Propiedad 1 (imagen + link)           │
│ 3. Propiedad 2 (imagen + link)           │
│ 4. Propiedad 3 (imagen + link)           │
│ 5. Pregunta final (texto)                │
└──────────────────────────────────────────┘
        ↓
┌──────────────────────────────────────────┐
│ 📌 ACCIÓN 3: Actualizar estado           │
│ Add tag: "busqueda tokko"                │
│ (WSF3lp2CWeD8DVuJ3osU)                   │
└──────────────────────────────────────────┘
        ↓
┌──────────────────────────────────────────┐
│ ⏰ WAIT: 48 horas                        │
│ (O hasta que responda)                   │
└──────────────────────────────────────────┘
        ↓
┌──────────────────────────────────────────┐
│ ⚪ DECISIÓN 1: ¿Respondió?               │
│ IF: Inbound message received             │
│ THEN: REACTIVADO ✅                      │
│ ELSE: Continuar a Mensaje 2              │
└──────────────────────────────────────────┘
        ↓                    ↓
    RESPONDIÓ          NO RESPONDIÓ
        ↓                    ↓
┌──────────────┐      ┌──────────────────────┐
│ 🎉 ÉXITO     │      │ 📱 MENSAJE 2         │
│              │      │ (Día 2)              │
│ Remove tag:  │      │                      │
│ "oportunidad │      │ Follow-up con más    │
│  estancada"  │      │ propiedades          │
│              │      │                      │
│ Add note:    │      │ Template:            │
│ "Reactivado  │      │ "{{name}}, quería    │
│  - Respondió │      │  seguir ayudándote   │
│  al msg 1"   │      │  con tu búsqueda..."│
│              │      │                      │
│ END workflow │      └──────────────────────┘
└──────────────┘               ↓
                        ⏰ WAIT: 72h
                               ↓
                    ┌──────────────────────┐
                    │ ⚪ DECISIÓN 2:        │
                    │ ¿Respondió?          │
                    └──────────────────────┘
                        ↓           ↓
                   RESPONDIÓ    NO RESPONDIÓ
                        ↓           ↓
                    [ÉXITO]   ┌─────────────┐
                              │ 📱 MENSAJE 3│
                              │ (Día 5)     │
                              │             │
                              │ Última      │
                              │ oportunidad │
                              │ + Oferta de │
                              │ asesor      │
                              └─────────────┘
                                    ↓
                              ⏰ WAIT: 24h
                                    ↓
                    ┌───────────────────────────┐
                    │ ⚪ DECISIÓN 3: ¿Respondió?│
                    └───────────────────────────┘
                        ↓               ↓
                   RESPONDIÓ       NO RESPONDIÓ
                        ↓               ↓
                    [ÉXITO]      [ESCALAMIENTO]
                                       ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  🔴 SH01: ESCALAMIENTO A HUMANO                             ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
              ↓
    ┌────────────────────────────────────────┐
    │ 📌 ACCIÓN 1: Marcar para escalamiento  │
    │ Add tag: "escalado a humano"           │
    │ (Nuevo tag a crear)                    │
    └────────────────────────────────────────┘
              ↓
    ┌────────────────────────────────────────┐
    │ 👤 ACCIÓN 2: Asignar asesor            │
    │ IF Contact.assigned_user is EMPTY      │
    │ THEN: Assign to default asesor         │
    │       (Round-robin o específico)       │
    └────────────────────────────────────────┘
              ↓
    ┌────────────────────────────────────────┐
    │ 📝 ACCIÓN 3: Crear nota detallada      │
    │                                        │
    │ "🚨 LEAD REQUIERE ATENCIÓN HUMANA      │
    │                                        │
    │  Contacto: {{contact.name}}            │
    │  Teléfono: {{contact.phone}}           │
    │                                        │
    │  CONTEXTO:                             │
    │  • Búsqueda: {{tipo}} en {{zona}}     │
    │  • Presupuesto: USD {{presupuesto}}   │
    │  • Ambientes: {{ambientes}}            │
    │                                        │
    │  HISTORIAL REACTIVACIÓN:               │
    │  • Propiedades enviadas: 6             │
    │  • Mensajes enviados: 3                │
    │  • Última interacción: {{date}}        │
    │                                        │
    │  PRÓXIMA ACCIÓN SUGERIDA:              │
    │  Llamar al contacto para reactivación  │
    │  personal"                             │
    └────────────────────────────────────────┘
              ↓
    ┌────────────────────────────────────────┐
    │ 📧 ACCIÓN 4: Notificar por email       │
    │                                        │
    │ To: {{assigned_user.email}}            │
    │ Subject: [Juejati] Lead escalado       │
    │          requiere atención             │
    │                                        │
    │ Body:                                  │
    │ "Hola {{assigned_user.first_name}},   │
    │                                        │
    │  El lead {{contact.name}} requiere     │
    │  seguimiento personal.                 │
    │                                        │
    │  No respondió a 3 intentos automáticos │
    │  de reactivación.                      │
    │                                        │
    │  Ver detalle completo en GHL:          │
    │  [Link al contacto]                    │
    │                                        │
    │  Acción sugerida: Llamar hoy"          │
    └────────────────────────────────────────┘
              ↓
    ┌────────────────────────────────────────┐
    │ 📱 ACCIÓN 5: Notificación interna GHL  │
    │ (Aparece en dashboard del asesor)      │
    │                                        │
    │ "Lead {{contact.name}} escalado.       │
    │  Llamar hoy. Ver nota para contexto."  │
    └────────────────────────────────────────┘
              ↓
    ┌────────────────────────────────────────┐
    │ 📊 ACCIÓN 6: Actualizar métricas       │
    │ Update custom field:                   │
    │ "Estado Reactivación" = "Escalado"     │
    │ "Fecha Escalamiento" = {{today}}       │
    └────────────────────────────────────────┘
              ↓
         [END WORKFLOW]

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  🟣 SM01: REPORTES SEMANALES                                ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
              ↓
    ┌────────────────────────────────────────┐
    │ ⏰ TRIGGER: Scheduled (Lunes 9:00 AM)  │
    └────────────────────────────────────────┘
              ↓
    ┌────────────────────────────────────────┐
    │ 📊 ACCIÓN 1: Recopilar métricas semana │
    │                                        │
    │ Search contacts with tags:             │
    │ • "oportunidad estancada 7 dias"       │
    │   (created last 7 days)                │
    │ • "reactivado exitosamente"            │
    │   (created last 7 days)                │
    │ • "escalado a humano"                  │
    │   (created last 7 days)                │
    │                                        │
    │ Count:                                 │
    │ - Total detectados                     │
    │ - Total reactivados                    │
    │ - Total escalados                      │
    │ - Tasa de respuesta (%)                │
    └────────────────────────────────────────┘
              ↓
    ┌────────────────────────────────────────┐
    │ 📧 ACCIÓN 2: Enviar reporte email      │
    │                                        │
    │ To: gerencia@juejati.com               │
    │ Subject: [Juejati] Reporte Semanal     │
    │          Stale Opportunities           │
    │                                        │
    │ Body: [Ver template completo abajo]    │
    └────────────────────────────────────────┘
              ↓
    ┌────────────────────────────────────────┐
    │ 📱 ACCIÓN 3: Notificación Slack        │
    │ (Opcional - si tienen Slack)           │
    │                                        │
    │ Channel: #ventas                       │
    │ Message: Resumen de métricas           │
    └────────────────────────────────────────┘
              ↓
         [END WORKFLOW]
```

---

## 📋 GOOGLE SHEET ROADMAP

### TAB 1: PIPELINES

| Pipeline Name | Pipeline ID | Stages | Notas |
|---------------|-------------|--------|-------|
| 01 - Compradores - Seguimiento IA | tDFS4eZP5Rliei09iGIK | En seguimiento, Contactado, Visita Agendada | Pipeline existente |

**Stage donde se detectan estancados:**
- Stage: "En seguimiento"
- Stage ID: `6a4a44b3-2b0c-4aad-a00d-f62276fc4e0d`

---

### TAB 2: WORKFLOWS

| Código | Nombre | Trigger | Descripción | Objetivo | Estado |
|--------|--------|---------|-------------|----------|--------|
| **TRIGGER** | Stale Opportunities (Nativo) | Lead sin actividad 7 días en stage "En seguimiento" | Detección automática de GHL | Identificar leads estancados | ✅ Nativo |
| **SR01** | Secuencia Reactivación WhatsApp | Disparado por TRIGGER nativo | Envío de 3 mensajes automáticos de reactivación con propiedades de Tokko | Recuperar leads fríos | 🔨 A crear |
| **SH01** | Escalamiento a Humano | Lead no responde a 3 mensajes (SR01) | Asignación de asesor + notificaciones + contexto completo | Derivar a atención personal | 🔨 A crear |
| **SM01** | Reportes Semanales | Scheduled: Lunes 9:00 AM | Recopilación de métricas y envío de reporte por email | Visibilidad de performance | 🔨 A crear |
| **N8N-01** | Asistente Juejati - Modo Reactivación | HTTP Request desde SR01 | Modificación del asistente IA para soportar modo REACTIVACION_STALE | Generar mensajes personalizados con propiedades | 🔨 A modificar |
| **N8N-02** | Búsqueda Propiedades Tokko | Llamado por N8N-01 | Sub-workflow de búsqueda vectorial en Supabase + Tokko | Encontrar propiedades relevantes | ✅ Existente |

---

### TAB 3: CUSTOM FIELDS (Existentes - Ya creados)

| Campo | ID | Tipo | Uso en Stale Opp |
|-------|-----|------|------------------|
| zona | yGJXxoO4nk8hQd0RVd5e | Text | Parámetro de búsqueda |
| tipo_de_propiedad_2 | Fw4YRtbOgbSgvA5YXF7q | Dropdown | Parámetro de búsqueda |
| presupuesto_ia | 3z3kPYZAaP2m6akjmUum | Number | Parámetro de búsqueda |
| ambientes | vUIYrZh1AWgpZABVvPsB | Number | Parámetro de búsqueda |
| intencion | sIeO3VWMJVmLn22CzCh3 | Dropdown | Venta o Alquiler |
| Fecha Primer Contacto | nmjHXLuEaaidNamLXedw | Date | Tracking de reactivación |

**Custom Fields Nuevos (Opcionales):**

| Campo | Tipo | Propósito |
|-------|------|-----------|
| Estado Reactivación | Dropdown | "No iniciado", "En proceso", "Reactivado", "Escalado" |
| Fecha Escalamiento | Date | Cuándo se escaló a humano |
| Mensajes Enviados | Number | Contador de intentos |
| Última Propiedad Vista | Text (long) | Propiedades mostradas |

---

### TAB 4: TAGS DEL SISTEMA

| Tag | ID | Uso | Tipo |
|-----|-----|-----|------|
| oportunidad estancada 7 dias | h77DAbGrkv1BS4ieCUD2 | Marca lead en proceso de reactivación | ✅ Existente |
| busqueda tokko | WSF3lp2CWeD8DVuJ3osU | Indica que se enviaron propiedades de Tokko | ✅ Existente |
| escalado a humano | *A crear* | Lead requiere atención de asesor | 🔨 Nuevo |
| reactivado exitosamente | *A crear* | Lead respondió a secuencia | 🔨 Nuevo |
| detener ia | GxSwNeDfHCo3LIVQ0f7C | Exclusión - no enviar mensajes automáticos | ✅ Existente |
| detener_ia | R9w6ZQUlQ8RYhtByBzpz | Exclusión - no enviar mensajes automáticos | ✅ Existente |
| stop bot | e4leD0HHY7wQ77DuPVxO | Exclusión - no enviar mensajes automáticos | ✅ Existente |
| [whatsapp] - contact is not registered | slsgDt9ojsvpBL1JvW9L | Exclusión - WhatsApp inválido | ✅ Existente |

---

### TAB 5: INTEGRACIONES EXTERNAS

| Integración | Tipo | Endpoint/URL | Datos Intercambiados |
|-------------|------|--------------|----------------------|
| **n8n - Asistente Juejati** | HTTP Webhook | `https://n8n.korvance.com/webhook/Asistente_Juejati_Brokers` | GHL → n8n: contact_id, first_name, zona, tipo, presupuesto, ambientes<br>n8n → GHL: Confirmación de envío |
| **Tokko Broker API** | REST API | `https://tokkobroker.com/api/v1/property/` | n8n → Tokko: Filtros de búsqueda<br>Tokko → n8n: Array de propiedades |
| **Supabase Vector DB** | PostgreSQL + pgvector | `propiedades_vector` table | n8n: Query embedding → Supabase: Vector similarity search |
| **OpenAI API** | REST API | Embeddings + GPT-5 | Text → Embeddings (búsqueda)<br>Prompts → Respuestas (conversación) |
| **Cohere API** | REST API | Rerank endpoint | Results → Reranked results |

---

### TAB 6: TEMPLATES DE MENSAJES

#### **MENSAJE 1: Reactivación Inicial (Día 0)**

**Condición:** Datos completos (zona, tipo, presupuesto, ambientes)

```
Hola {{contact.first_name}}! 👋

Hace unos días estuvimos conversando sobre tu búsqueda de {{contact.tipo_de_propiedad_2}} en {{contact.zona}}.

¿Seguís buscando? Tenemos propiedades nuevas que podrían interesarte 🏡

[PROPIEDADES DINÁMICAS DESDE TOKKO - Máximo 3]

¿Alguna te llama la atención?
```

**Formato de cada propiedad:**
```
[Título de la propiedad]
Precio: USD XXX,XXX
📍 Barrio, Zona
🖼️ [Imagen de la propiedad]
🔗 Ver ficha completa: [Link]
```

---

#### **MENSAJE 1B: Template Genérico (Datos Incompletos)**

**Condición:** Faltan datos de búsqueda

```
Hola {{contact.first_name}}! 👋

Soy el asistente de Juejati Brokers. Hace unos días estuvimos en contacto.

¿Seguís buscando propiedad? Contame qué necesitás y te ayudo a encontrar opciones que te interesen 🏡
```

---

#### **MENSAJE 2: Follow-up (Día 2)**

```
{{contact.first_name}}, quería seguir ayudándote con tu búsqueda 🔍

Vi que te interesan {{contact.tipo_de_propiedad_2}}s en zona {{contact.zona}}, con presupuesto aproximado de {{contact.presupuesto_ia}} USD.

Encontré estas nuevas opciones que podrían gustarte:

[PROPIEDADES DINÁMICAS - Máximo 3 diferentes a Mensaje 1]

¿Te gustaría más info de alguna? ¿O cambió algo en tu búsqueda?
```

---

#### **MENSAJE 3: Última Oportunidad (Día 5)**

```
Hola {{contact.first_name}}!

Te escribo por última vez para ver si podemos ayudarte con tu búsqueda de {{contact.tipo_de_propiedad_2}} en {{contact.zona}}.

Si preferís, puedo derivarte con {{assigned_user.first_name}} del equipo comercial para que te llame y te cuente sobre las últimas opciones disponibles.

¿Te parece que te contacte?
```

---

#### **TEMPLATE: Email de Escalamiento**

**To:** `{{assigned_user.email}}`  
**Subject:** `[Juejati] Lead escalado - {{contact.first_name}} {{contact.last_name}}`

```
Hola {{assigned_user.first_name}},

El sistema detectó que el lead {{contact.first_name}} {{contact.last_name}} 
requiere seguimiento personal.

📊 RESUMEN:
• Teléfono: {{contact.phone}}
• Email: {{contact.email}}
• Búsqueda: {{contact.tipo_de_propiedad_2}} en {{contact.zona}}
• Presupuesto: USD {{contact.presupuesto_ia}}
• Ambientes: {{contact.ambientes}}

📨 HISTORIAL DE REACTIVACIÓN:
• Mensajes automáticos enviados: 3
• Propiedades mostradas: 6
• Última interacción: {{date_last_activity}}
• Sin respuesta desde hace 5 días

🎯 ACCIÓN SUGERIDA:
Llamar al contacto para reactivación personal. El lead mostró interés 
inicial pero no respondió a los mensajes automáticos.

Ver detalle completo en GHL:
{{contact.url}}

---
Sistema de Stale Opportunities - Juejati Brokers
```

---

#### **TEMPLATE: Reporte Semanal**

**To:** `gerencia@juejati.com`  
**Subject:** `[Juejati] Reporte Semanal - Stale Opportunities`

```
REPORTE SEMANAL - REACTIVACIÓN DE OPORTUNIDADES
Semana del {{start_date}} al {{end_date}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 MÉTRICAS CLAVE

Oportunidades detectadas:        {{total_detectadas}}
Mensajes enviados:                {{total_mensajes}}
Tasa de respuesta:                {{tasa_respuesta}}%
Reactivaciones exitosas:          {{total_reactivados}}
Escalados a asesor humano:        {{total_escalados}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 IMPACTO EN VENTAS

Leads recuperados:                {{leads_recuperados}}
Visitas coordinadas:              {{visitas_coordinadas}}
Oportunidades avanzadas:          {{opp_avanzadas}}
Valor estimado pipeline:          USD {{valor_total}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 DISTRIBUCIÓN POR MENSAJE

Respondieron al Mensaje 1:        {{msg1_respuestas}} ({{msg1_tasa}}%)
Respondieron al Mensaje 2:        {{msg2_respuestas}} ({{msg2_tasa}}%)
Respondieron al Mensaje 3:        {{msg3_respuestas}} ({{msg3_tasa}}%)
No respondieron (escalados):      {{escalados}} ({{escalados_tasa}}%)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 PERFORMANCE POR ASESOR

{{#each asesores}}
{{nombre}}:                       {{reactivaciones}} reactivaciones
{{/each}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 ANÁLISIS SEMANAL

Top 3 zonas más buscadas:
1. {{zona_1}} ({{zona_1_count}} leads)
2. {{zona_2}} ({{zona_2_count}} leads)
3. {{zona_3}} ({{zona_3_count}} leads)

Rango de presupuesto más común:
USD {{presupuesto_min}} - USD {{presupuesto_max}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ver dashboard completo: {{dashboard_url}}

---
Sistema de Stale Opportunities - Juejati Brokers
Generado automáticamente
```

---

### TAB 7: CHECKLIST DE IMPLEMENTACIÓN

#### **FASE 1: CONFIGURACIÓN BASE (Semana 1)**

**Estimación: 8-12 horas**

```
WORKFLOWS GHL:
├─ [ ] SR01: Crear workflow "Secuencia Reactivación"
│   ├─ [ ] Configurar trigger nativo "Stale Opportunities"
│   │   ├─ Duration: 7 días
│   │   ├─ Pipeline: tDFS4eZP5Rliei09iGIK
│   │   └─ Stage: 6a4a44b3-2b0c-4aad-a00d-f62276fc4e0d
│   ├─ [ ] IF: Verificar tags de exclusión
│   ├─ [ ] IF: Verificar WhatsApp válido
│   ├─ [ ] IF: Verificar duplicados
│   ├─ [ ] Add tag: "oportunidad estancada 7 dias"
│   ├─ [ ] Create note: Detección automática
│   ├─ [ ] IF: ¿Datos completos?
│   │   ├─ [ ] Ruta A: HTTP Request a n8n
│   │   └─ [ ] Ruta B: WhatsApp template genérico
│   ├─ [ ] Wait 48h
│   ├─ [ ] IF: ¿Respondió? → Mensaje 2
│   ├─ [ ] Wait 72h
│   ├─ [ ] IF: ¿Respondió? → Mensaje 3
│   └─ [ ] IF: No respondió → Trigger SH01
│
├─ [ ] TAGS: Crear tags nuevos
│   ├─ [ ] "escalado a humano"
│   └─ [ ] "reactivado exitosamente"
│
└─ [ ] TESTING: Workflow SR01
    ├─ [ ] Crear contacto de prueba
    ├─ [ ] Simular estancamiento 7 días
    ├─ [ ] Verificar trigger automático
    ├─ [ ] Verificar condiciones
    └─ [ ] Verificar flujo completo

N8N - ASISTENTE JUEJATI:
├─ [ ] Modificar system prompt AI AGENT1
│   ├─ [ ] Agregar MODO_REACTIVACION al router
│   ├─ [ ] Template específico de mensaje
│   └─ [ ] Limit 3 propiedades máximo
├─ [ ] Agregar detección de parámetro "modo"
├─ [ ] Modificar webhook para aceptar datos adicionales
│   ├─ [ ] zona
│   ├─ [ ] tipo_propiedad
│   ├─ [ ] presupuesto
│   └─ [ ] ambientes
└─ [ ] TESTING: Modo Reactivación
    ├─ [ ] POST manual al webhook
    ├─ [ ] Verificar búsqueda en Supabase
    ├─ [ ] Verificar formato de mensaje
    └─ [ ] Verificar envío a WhatsApp

TOKKO API:
└─ [ ] Verificar API key activa
    ├─ [ ] Rate limits: 100 req/min
    └─ [ ] Endpoints disponibles
```

---

#### **FASE 2: ESCALAMIENTO Y REPORTES (Semana 2)**

**Estimación: 6-8 horas**

```
WORKFLOW SH01 - ESCALAMIENTO:
├─ [ ] Trigger: Cuando SR01 determina "no responde"
├─ [ ] Add tag: "escalado a humano"
├─ [ ] IF: ¿Tiene asesor asignado?
│   ├─ [ ] NO: Assign round-robin o default
│   └─ [ ] SÍ: Mantener asignación
├─ [ ] Create note: Contexto completo del lead
├─ [ ] Send email: Notificar a asesor asignado
├─ [ ] Internal notification: Dashboard GHL
└─ [ ] TESTING: Workflow SH01
    ├─ [ ] Simular lead sin respuesta
    ├─ [ ] Verificar asignación correcta
    ├─ [ ] Verificar email recibido
    └─ [ ] Verificar nota creada

WORKFLOW SM01 - REPORTES:
├─ [ ] Trigger: Scheduled Monday 9:00 AM
├─ [ ] Search contacts: Con tags del sistema
│   └─ [ ] Filtrar por última semana
├─ [ ] Calculate metrics:
│   ├─ [ ] Total detectados
│   ├─ [ ] Total reactivados
│   ├─ [ ] Tasa de respuesta
│   └─ [ ] Performance por asesor
├─ [ ] Format email: Template de reporte
├─ [ ] Send email: A gerencia
└─ [ ] TESTING: Workflow SM01
    ├─ [ ] Ejecutar manualmente
    ├─ [ ] Verificar métricas correctas
    └─ [ ] Verificar formato email

CUSTOM FIELDS OPCIONALES:
├─ [ ] Estado Reactivación (Dropdown)
├─ [ ] Fecha Escalamiento (Date)
└─ [ ] Mensajes Enviados (Number)
```

---

#### **FASE 3: GO-LIVE Y OPTIMIZACIÓN (Semana 3)**

**Estimación: 4-6 horas**

```
ACTIVACIÓN:
├─ [ ] Activar SR01 en producción
├─ [ ] Activar SH01 en producción
├─ [ ] Activar SM01 en producción
└─ [ ] Monitorear primeras 24h

MONITOREO INICIAL (Días 1-7):
├─ [ ] Verificar triggers funcionando
├─ [ ] Revisar mensajes enviados
├─ [ ] Analizar tasas de respuesta
├─ [ ] Revisar escalamientos
└─ [ ] Recopilar feedback del equipo

OPTIMIZACIÓN (Días 8-14):
├─ [ ] Ajustar copy de mensajes
├─ [ ] Optimizar filtros de propiedades
├─ [ ] Afinar timing de envíos
└─ [ ] Mejorar templates según feedback

CAPACITACIÓN DEL EQUIPO:
├─ [ ] Cómo funciona el sistema
├─ [ ] Qué hacer con leads escalados
├─ [ ] Cómo interpretar el dashboard
└─ [ ] Buenas prácticas de seguimiento

DOCUMENTACIÓN:
├─ [ ] Guía de usuario
├─ [ ] Troubleshooting común
├─ [ ] Contactos de soporte
└─ [ ] Proceso de mejora continua
```

---

## 📊 MÉTRICAS DE ÉXITO

### KPIs Principales (Seguimiento Semanal)

| Métrica | Objetivo | Tracking |
|---------|----------|----------|
| **Tasa de detección** | 100% (automático) | Dashboard GHL |
| **Tasa de respuesta Mensaje 1** | >15% | Workflow SR01 |
| **Tasa de respuesta Mensaje 2** | >10% | Workflow SR01 |
| **Tasa de respuesta Mensaje 3** | >5% | Workflow SR01 |
| **Tasa de reactivación total** | >25% | Reporte SM01 |
| **Tiempo de escalamiento** | <2h | Workflow SH01 |
| **Conversión escalados** | >15% | Manual tracking |

### Dashboard de Control

```
Vista Diaria (Asesores):
┌─────────────────────────────────────────┐
│ 🔴 Leads escalados hoy:        3        │
│ 🟡 En secuencia (Mensaje 2):   5        │
│ 🟢 Reactivados esta semana:    7        │
│                                         │
│ [Ver leads escalados]                   │
│ [Ver leads en secuencia]                │
└─────────────────────────────────────────┘

Vista Semanal (Gerencia):
┌─────────────────────────────────────────┐
│ 📊 RESUMEN SEMANAL                      │
│                                         │
│ Detectados:        28 leads             │
│ Reactivados:       9 leads (32%)        │
│ Escalados:         19 leads (68%)       │
│                                         │
│ Valor recuperado:  USD 650,000          │
│                                         │
│ [Ver reporte completo]                  │
└─────────────────────────────────────────┘
```

---

## 🎯 RESUMEN DE IMPLEMENTACIÓN

### Total de Workflows a Crear: 3

| Código | Complejidad | Tiempo Est. |
|--------|-------------|-------------|
| SR01 | Media | 6-8h |
| SH01 | Baja | 3-4h |
| SM01 | Baja | 2-3h |

### Total de Modificaciones: 1

| Sistema | Cambio | Tiempo Est. |
|---------|--------|-------------|
| N8N-01 Asistente | Agregar MODO_REACTIVACION | 4-6h |

### Timeline Total

```
Semana 1: Configuración base (12h)
Semana 2: Integración + Testing (8h)
Semana 3: Go-live + Optimización (6h)
────────────────────────────────────
TOTAL: 26 horas ≈ 3 semanas
```

### Inversión

```
Implementación: USD 1,400 (28h × USD 50/h)
Operación mensual: USD 130
ROI estimado: 9,600% mensual
Recuperación: 11 días
```

---

## 📎 ARCHIVOS COMPLEMENTARIOS

### Documentos Generados

1. ✅ **PROPUESTA_STALE_OPP_JUEJATI.md** - Propuesta ejecutiva completa
2. ✅ **MODO_REACTIVACION_ASISTENTE.md** - Guía técnica de modificación n8n
3. ✅ **MAPA_VISUAL_STALE_OPP.md** - Este documento

### Próximos Pasos

1. **Revisión con cliente** - Validar flujos y mensajes
2. **Aprobación de propuesta** - Confirmar alcance y timing
3. **Kickoff meeting** - Alinear expectativas
4. **Inicio de implementación** - Fase 1

---

**Versión:** 1.0  
**Fecha:** 4 de Enero 2026  
**Creado por:** Korvance - GHL Implementation  
**Metodología:** 70% Planning / 30% Ejecución  
**Estado:** 📋 PENDIENTE DE APROBACIÓN
