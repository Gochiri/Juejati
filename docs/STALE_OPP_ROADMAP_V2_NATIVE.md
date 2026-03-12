# 🚀 ROADMAP ACTUALIZADO: STALE OPPORTUNITIES (USANDO TRIGGER NATIVO GHL)
**Cliente:** Juejati Brokers  
**Location ID:** `WWrBqekGJCsCmSSvPzEf`  
**Fecha:** 2026-01-02  
**Versión:** 2.0 (Con trigger nativo)

---

## 🎉 CAMBIO IMPORTANTE: GHL TIENE TRIGGER NATIVO

### ✅ **Ventajas del trigger nativo:**
1. **No necesitamos crear detector manual** (eliminamos SD01)
2. **Configuración más simple** (solo 3 workflows en vez de 4)
3. **Más confiable** (GHL maneja la detección automáticamente)
4. **Menos mantenimiento** (una cosa menos que puede fallar)

### 📉 **Reducción de complejidad:**
- **Antes:** 4 workflows (SD01, SR01, SH01, SM01)
- **Ahora:** 3 workflows (SR01, SH01, SM01)
- **Tiempo de implementación:** 24-34h → **16-24h** (30% menos)

---

## 🎯 ARQUITECTURA SIMPLIFICADA

### Nuevos componentes:
1. **TRIGGER NATIVO GHL:** "Stale Opportunities" (built-in)
2. **SR01:** Secuencia de Reactivación WhatsApp
3. **SH01:** Escalamiento a Humano
4. **SM01:** Reportes Semanales (opcional)

---

## 📋 WORKFLOW 1: TRIGGER NATIVO + SECUENCIA DE REACTIVACIÓN

### **Nombre:** `[AI] Reactivación Stale Opportunities - WhatsApp`

### **Trigger Configuración:**

```
Tipo de Trigger: "Stale Opportunities" (nativo de GHL)
Nombre del Trigger: "Detectar Estancados 7 días"

FILTROS:
├─ Duration in days: 7
├─ In pipeline: "01 - Compradores - Seguimiento IA"
│  Pipeline ID: tDFS4eZP5Rliei09iGIK
└─ Pipeline stage: "En seguimiento"
   Stage ID: 6a4a44b3-2b0c-4aad-a00d-f62276fc4e0d
```

### **Condiciones adicionales (IF/Else):**

Antes de iniciar la secuencia, verificar:

```
CONDICIÓN 1: Verificar tags de exclusión
IF Contact has ANY of these tags:
├─ "detener ia" (GxSwNeDfHCo3LIVQ0f7C)
├─ "detener_ia" (R9w6ZQUlQ8RYhtByBzpz)
├─ "stop bot" (e4leD0HHY7wQ77DuPVxO)
└─ "[whatsapp] - contact is not registered" (slsgDt9ojsvpBL1JvW9L)
THEN: END workflow (no procesar)
ELSE: CONTINUAR

CONDICIÓN 2: Verificar WhatsApp válido
IF Contact.phone is EMPTY
THEN: END workflow
ELSE: CONTINUAR

CONDICIÓN 3: Verificar si ya está en reactivación
IF Contact has tag "oportunidad estancada 7 dias"
THEN: END workflow (evitar duplicados)
ELSE: CONTINUAR → AGREGAR TAG
```

---

### **ACCIÓN 1: Marcar como estancado**

```
Action: Add Tag
Tag: "oportunidad estancada 7 dias"
Tag ID: h77DAbGrkv1BS4ieCUD2
```

---

### **ACCIÓN 2: Actualizar custom field**

```
Action: Update Contact
Field: "Fecha Primer Contacto"
Field ID: nmjHXLuEaaidNamLXedw
Value: {{current_date}}
```

---

### **ACCIÓN 3: Crear nota interna**

```
Action: Create Note
Content:
"🤖 [STALE OPP] Lead detectado como estancado automáticamente por GHL.
Sin actividad desde hace 7 días.
Sistema iniciará secuencia de reactivación."
```

---

### **ACCIÓN 4: Verificar horario de envío**

```
Action: Wait Until
Condition: Time is between 9:00 AM - 8:00 PM
AND Day is Monday-Friday
```

---

### **MENSAJE 1: Reactivación inicial (Día 0)**

```
Action: Send WhatsApp Message
From: [Tu número de WhatsApp Business]

Mensaje:
"Hola {{contact.first_name}}! 👋

Soy el asistente de Juejati Brokers. Hace unos días estuvimos conversando sobre tu búsqueda de {{contact.tipo_de_propiedad_2}} en {{contact.zona}}.

¿Seguís buscando? Tenemos propiedades nuevas que podrían interesarte 🏡

Te comparto algunas opciones que se ajustan a lo que me comentaste:

📍 [Propiedades dinámicas desde Tokko]

¿Alguna te llama la atención?"
```

**Post-mensaje:**
```
Action: Add Tag
Tag: "busqueda tokko"
Tag ID: WSF3lp2CWeD8DVuJ3osU

Action: Wait for 48 hours
(O hasta que responda)
```

---

### **DECISIÓN 1: ¿Respondió al mensaje 1?**

```
IF: Inbound message received
OR: Contact replied
THEN: 
  ├─ Remove tag "oportunidad estancada 7 dias"
  ├─ Create note "✅ Reactivado - Respondió al mensaje 1"
  └─ END workflow
ELSE:
  └─ CONTINUAR a Mensaje 2
```

---

### **MENSAJE 2: Follow-up (Día 2)**

```
Action: Wait 48 hours (desde mensaje 1)

Action: Send WhatsApp Message

Mensaje:
"{{contact.first_name}}, quería seguir ayudándote con tu búsqueda 🔍

Vi que te interesan {{contact.tipo_de_propiedad_2}}s en zona {{contact.zona}}, con presupuesto aproximado de {{contact.presupuesto_ia}} USD.

Encontré estas opciones que coinciden:

📍 Opción 1: [Título]
💰 [Precio]
📏 [M2]
🔗 [Link]

¿Te gustaría más info de alguna? ¿O cambió algo en tu búsqueda?"
```

**Post-mensaje:**
```
Action: Create Note
Content: "🤖 Mensaje 2 de reactivación enviado"

Action: Wait for 72 hours
```

---

### **DECISIÓN 2: ¿Respondió al mensaje 2?**

```
IF: Inbound message received
THEN:
  ├─ Remove tag "oportunidad estancada 7 dias"
  ├─ Create note "✅ Reactivado - Respondió al mensaje 2"
  └─ END workflow
ELSE:
  └─ CONTINUAR a Mensaje 3
```

---

### **MENSAJE 3: Última oportunidad (Día 5)**

```
Action: Wait 72 hours (desde mensaje 2)

Action: Send WhatsApp Message

Mensaje:
"Hola {{contact.first_name}}! 👋

Quiero asegurarme de que estés recibiendo la mejor atención posible.

Entiendo que quizás tu búsqueda cambió o preferís que te contacte uno de nuestros asesores directamente.

¿Seguís interesado/a en encontrar {{contact.tipo_de_propiedad_2}} en {{contact.zona}}?

Si preferís, puedo conectarte con {{contact.asesor}} para que te asesore personalmente 🤝

Solo respondeme:
1️⃣ "SEGUIR" si querés que siga buscando
2️⃣ "ASESOR" si preferís hablar con un humano
3️⃣ "PAUSA" si querés pausar tu búsqueda"
```

**Post-mensaje:**
```
Action: Create Note
Content: "🤖 Mensaje 3 enviado - Última oportunidad"

Action: Wait for 48 hours
```

---

### **DECISIÓN 3: ¿Respondió al mensaje 3?**

```
IF: Inbound message received
THEN:
  ├─ Remove tag "oportunidad estancada 7 dias"
  ├─ Create note "✅ Reactivado - Respondió al mensaje 3"
  └─ END workflow
ELSE:
  └─ TRIGGER WF: SH01 (Escalamiento a Humano)
```

---

## 🚨 WORKFLOW 2: ESCALAMIENTO A HUMANO

### **Nombre:** `[HANDOFF] Escalamiento Stale a Agente`

### **Trigger:**
```
Tipo: Workflow Trigger
Triggered by: SR01 (Secuencia de Reactivación)
Condition: No response after 3 messages
```

### **ACCIONES:**

#### **1. Remover tags de IA**
```
Action: Remove Tags
Tags:
├─ "oportunidad estancada 7 dias" (h77DAbGrkv1BS4ieCUD2)
├─ "ia activa" (aVD3q1Ub2G2r5canpsiX)
└─ "busqueda tokko" (WSF3lp2CWeD8DVuJ3osU)
```

#### **2. Agregar tags de handoff**
```
Action: Add Tags
Tags:
├─ "asistencia humana" (IdKjFPgZYmalZjM645e2)
├─ "seguimiento manual" (LOZIEvltoNVY9j47M39F)
└─ "en nutricion" (GniL6BLNrjctf4zgXnbw)
```

#### **3. Mover a stage de nutrición**
```
Action: Update Opportunity
Pipeline: "01 - Compradores - Seguimiento IA"
New Stage: "Nutrición"
Stage ID: 12cd3dc6-d589-4427-a1c3-5821754191b7
```

#### **4. Asignar a agente humano**
```
IF: Custom Field "Asesor Asignado" is NOT empty
THEN: Assign opportunity to that user
ELSE: Assign to Round Robin (sales team)
```

#### **5. Crear tarea urgente**
```
Action: Create Task
Title: "🔥 LEAD ESTANCADO - Requiere seguimiento manual"
Assigned to: {{assigned_user}}
Due date: {{today + 2 días}}

Description:
"Lead: {{contact.name}}
Teléfono: {{contact.phone}}
Email: {{contact.email}}

🔍 BÚSQUEDA ORIGINAL:
• Tipo: {{contact.tipo_de_propiedad_2}}
• Zona: {{contact.zona}}
• Presupuesto: {{contact.presupuesto_ia}} USD
• Ambientes: {{contact.ambientes}}

📊 HISTORIAL:
• Primer contacto: {{contact.fecha_primer_contacto}}
• Días sin actividad: 7+

⚠️ NO RESPONDIÓ A 3 MENSAJES DE REACTIVACIÓN AUTOMÁTICA

PRÓXIMOS PASOS SUGERIDOS:
1. Llamar por teléfono
2. Enviar mensaje muy personalizado
3. Ofrecer visita a oficina
4. Si no hay interés → mover a 'Perdido/Abandonado'"
```

#### **6. Notificar al agente**
```
Action: Send Email
To: {{assigned_user.email}}
Subject: "🔥 Lead estancado requiere tu atención: {{contact.name}}"

Body:
"Hola {{assigned_user.first_name}},

Tenés un lead que necesita seguimiento manual urgente.

{{contact.name}} ({{contact.phone}}) no respondió a 3 intentos automáticos de reactivación.

Búsqueda original:
• {{contact.tipo_de_propiedad_2}} en {{contact.zona}}
• Presupuesto: {{contact.presupuesto_ia}} USD

Por favor contactalo en las próximas 48hs.

Ver lead: {{opportunity.url}}"
```

#### **7. Crear nota final**
```
Action: Create Note
Content:
"🚨 ESCALADO A HUMANO

No respondió a secuencia de reactivación:
✗ Mensaje 1 (Día 0) - Sin respuesta
✗ Mensaje 2 (Día 2) - Sin respuesta
✗ Mensaje 3 (Día 5) - Sin respuesta

Movido a nutrición manual.
Tarea asignada a: {{assigned_user.name}}
Fecha: {{today}}"
```

---

## 📊 WORKFLOW 3: REPORTE SEMANAL (OPCIONAL)

### **Nombre:** `[METRICS] Reporte Semanal Stale Opportunities`

### **Trigger:**
```
Tipo: Scheduled
Frequency: Weekly
Day: Monday
Time: 8:00 AM
```

### **Acciones:**

```
1. Buscar oportunidades con tag "oportunidad estancada 7 dias" (última semana)
2. Contar leads reactivados (tag removido + volvieron a "En seguimiento")
3. Contar leads escalados (tag "asistencia humana" agregado)
4. Calcular tasa de reactivación
5. Generar reporte en email HTML
6. Enviar a manager de ventas
```

*(Este workflow es opcional y puede implementarse después del go-live)*

---

## ⚙️ CONFIGURACIÓN PASO A PASO EN GHL

### **PASO 1: Crear SR01 (Secuencia de Reactivación)**

1. Ir a **Automation** → **Workflows**
2. Click **"+ Create Workflow"**
3. **"Start from scratch"**
4. Click **"+ Add new Trigger"**
5. Seleccionar **"Stale Opportunities"** de la lista

**Configurar el trigger:**
```
Workflow Trigger Name: "Detectar Estancados 7 días"

FILTROS:
Duration in days: 7
In pipeline: "01 - Compradores - Seguimiento IA"
Pipeline stage: "En seguimiento"
```

6. Click **"Save Trigger"**

**Agregar condiciones de filtro:**

7. Click **"+ Add Action"** → **"IF/ELSE"**

```
Condición 1:
IF Contact has tag "detener ia"
OR Contact has tag "detener_ia"
OR Contact has tag "stop bot"
OR Contact has tag "[whatsapp] - contact is not registered"
THEN: END workflow
```

8. En la rama **ELSE**, agregar:

```
Action: Add Tag
Tag: "oportunidad estancada 7 dias"
```

9. Agregar **"Wait Until"**:
```
Time is between: 9:00 AM - 8:00 PM
Days: Monday - Friday
```

10. Agregar **"Send WhatsApp Message"** (Mensaje 1)

11. Agregar **"Wait for 48 hours"**

12. Agregar **"IF/ELSE"** para verificar respuesta

13. Si NO respondió, agregar **"Send WhatsApp Message"** (Mensaje 2)

14. Repetir proceso para Mensaje 3

15. Si NO respondió a los 3, **"Trigger Workflow"** → SH01

16. **"Save"** workflow

---

### **PASO 2: Crear SH01 (Escalamiento)**

1. Crear nuevo workflow
2. **Trigger:** "Workflow Trigger"
3. Seleccionar workflow SR01
4. Configurar acciones de handoff (ver sección anterior)
5. **"Save"** y **"Publish"**

---

### **PASO 3: Testing**

**Test con lead de prueba:**

1. Crear un lead de prueba en pipeline "01 - Compradores - IA"
2. Moverlo a stage "En seguimiento"
3. **NO interactuar con él por 7 días** (o modificar el trigger a 1 día para testing)
4. Verificar que el trigger se active
5. Verificar que se agregue el tag
6. Verificar que llegue el mensaje 1
7. NO responder
8. Verificar que llegue mensaje 2 después de 48h
9. Continuar test hasta verificar handoff completo

---

## ✅ CHECKLIST IMPLEMENTACIÓN

```
SETUP INICIAL:
☐ Workflow SR01 creado con trigger "Stale Opportunities"
☐ Configurado: 7 días, pipeline correcto, stage correcto
☐ Condiciones IF/ELSE agregadas (tags de exclusión)
☐ Tag "oportunidad estancada 7 dias" configurado

MENSAJES:
☐ Mensaje 1 configurado con variables dinámicas
☐ Mensaje 2 configurado con follow-up
☐ Mensaje 3 configurado con opciones
☐ Wait times configurados (48h, 72h, 48h)
☐ Horarios de envío configurados (9 AM - 8 PM)

DECISIONES:
☐ IF/ELSE para detectar respuestas agregado
☐ Remoción de tag en caso de respuesta configurada
☐ Trigger a SH01 si no hay respuesta configurado

HANDOFF (SH01):
☐ Workflow SH01 creado
☐ Remoción de tags de IA configurada
☐ Agregado de tags de handoff configurado
☐ Mover a stage "Nutrición" configurado
☐ Asignación de agente configurada
☐ Creación de tarea configurada
☐ Notificación por email configurada

TESTING:
☐ Test con lead de prueba completado
☐ Verificado envío de mensajes
☐ Verificado timings (48h, 72h)
☐ Verificado handoff a humano
☐ Verificado creación de tarea

GO LIVE:
☐ Workflows en modo DRAFT
☐ Review final de configuración
☐ Equipo notificado del nuevo sistema
☐ Publicar SR01
☐ Publicar SH01
☐ Monitorear primeras 48 horas
```

---

## 📈 MÉTRICAS A TRACKEAR

### **Dashboards a crear:**

**1. Smart List: "🔴 En Reactivación Ahora"**
```
Filtros:
- Has tag "oportunidad estancada 7 dias"
- Pipeline = "01 - Compradores - IA"
- Status = Open

Ordenar por: Date tag added (DESC)
```

**2. Smart List: "✅ Reactivados Últimos 30 Días"**
```
Filtros:
- Tag "oportunidad estancada 7 dias" removed (last 30 days)
- Stage = "En seguimiento" o posterior

Ordenar por: Date tag removed (DESC)
```

**3. Smart List: "🚨 Escalados a Humano"**
```
Filtros:
- Has tag "asistencia humana"
- Stage = "Nutrición"
- Status = Open

Ordenar por: Date tag added (ASC)
```

---

## 🎯 ESTIMACIÓN DE TIEMPO ACTUALIZADA

### **Con trigger nativo:**

| Fase | Tiempo Original | Tiempo Nuevo | Reducción |
|------|----------------|--------------|-----------|
| Planning | 8-12h | 6-8h | -25% |
| Building | 12-16h | 8-12h | -33% |
| Testing | 4-6h | 4-6h | 0% |
| **TOTAL** | **24-34h** | **18-26h** | **-29%** |

**Nuevo timeline: 2-3 días laborales en vez de 3-4 días** 🎉

---

## 🚀 VENTAJAS DEL TRIGGER NATIVO

1. ✅ **Detección automática confiable** (GHL la maneja)
2. ✅ **Menos workflows** (3 en vez de 4)
3. ✅ **Configuración más simple**
4. ✅ **Menos puntos de falla**
5. ✅ **Filtros nativos por pipeline y stage**
6. ✅ **Escalable** (puede aplicarse a múltiples pipelines)

---

## 📞 PRÓXIMOS PASOS

1. **Crear SR01** usando trigger "Stale Opportunities"
2. **Configurar los 3 mensajes** con timings
3. **Crear SH01** para handoff
4. **Testear con 1 lead de prueba**
5. **Ajustar y publicar**

---

**¿Arrancamos con la implementación de SR01?** 🚀

