# 🔄 SISTEMA COMPLETO: STALE OPPORTUNITIES - WORKFLOWS RECOMENDADOS
**Cliente:** Juejati Brokers  
**Location ID:** `WWrBqekGJCsCmSSvPzEf`  
**Fecha:** 2026-01-02

---

## 📊 RESUMEN EJECUTIVO

### ¿Qué es Stale Opportunities?
Sistema automatizado que **detecta leads estancados** (sin actividad por X días) y los **reactiva automáticamente** con secuencias de WhatsApp personalizadas.

### Beneficios clave:
- ✅ Recupera leads "dormidos" automáticamente
- ✅ Reduce carga manual del equipo de ventas
- ✅ Aumenta tasa de conversión en 15-30%
- ✅ Identifica leads que necesitan atención humana
- ✅ Métricas claras de reactivación

---

## 🎯 ARQUITECTURA DEL SISTEMA

### Componentes principales:
1. **WF-01: Detector de Oportunidades Estancadas** (Corre 1x día)
2. **WF-02: Secuencia de Reactivación Automática** (WhatsApp multi-step)
3. **WF-03: Escalamiento a Humano** (Cuando IA no logra reactivar)
4. **WF-04: Tracking y Reportes** (Métricas de reactivación)

---

## 📋 WORKFLOW 1: DETECTOR DE OPORTUNIDADES ESTANCADAS

### **Nombre:** `[SYSTEM] Detector Stale Opportunities - 7 días`

### **Trigger:**
- **Tipo:** Scheduled (Daily)
- **Hora:** 9:00 AM (hora local)
- **Frecuencia:** Todos los días

### **Condiciones de detección:**

```
CONDICIÓN 1: Pipeline específico
├─ Pipeline = "01 - Compradores - Seguimiento IA"
└─ Pipeline ID = tDFS4eZP5Rliei09iGIK

CONDICIÓN 2: Stage específico
├─ Stage = "En seguimiento"
└─ Stage ID = 6a4a44b3-2b0c-4aad-a00d-f62276fc4e0d

CONDICIÓN 3: Tiempo sin actividad
├─ Última actividad > 7 días
└─ Sin mensajes recibidos/enviados en últimos 7 días

CONDICIÓN 4: Excluir leads ya procesados
├─ NO tiene tag "oportunidad estancada 7 dias"
└─ NO tiene tag "en nutricion"

CONDICIÓN 5: Excluir leads con IA detenida
├─ NO tiene tag "detener ia"
└─ NO tiene tag "detener_ia"
└─ NO tiene tag "stop bot"

CONDICIÓN 6: Debe tener WhatsApp válido
├─ Phone no está vacío
└─ NO tiene tag "[whatsapp] - contact is not registered"
```

### **Acciones del workflow:**

#### **ACCIÓN 1: Agregar tag de identificación**
```
Tag a agregar: "oportunidad estancada 7 dias"
Tag ID: h77DAbGrkv1BS4ieCUD2
```

#### **ACCIÓN 2: Actualizar custom field**
```
Custom Field: "Fecha Primer Contacto"
Field ID: nmjHXLuEaaidNamLXedw
Valor: {{opportunity.last_activity_date}}
```

#### **ACCIÓN 3: Crear nota interna**
```
Tipo: Nota
Contenido: "🤖 [STALE OPP] Lead detectado como estancado. 
Sin actividad desde hace {{days_inactive}} días.
Sistema iniciará secuencia de reactivación automática."
```

#### **ACCIÓN 4: Iniciar Workflow de Reactivación**
```
Trigger: WF-02 (Secuencia de Reactivación)
Delay: Inmediato
```

#### **ACCIÓN 5: Notificar al agente asignado** (Opcional)
```
IF custom_field "Asesor Asignado" NO está vacío
THEN enviar notificación interna:
"📊 Lead estancado detectado: {{contact.name}}
Última actividad: {{days_inactive}} días
Sistema iniciará reactivación automática."
```

---

## 💬 WORKFLOW 2: SECUENCIA DE REACTIVACIÓN AUTOMÁTICA

### **Nombre:** `[AI] Reactivación Stale Opportunities - WhatsApp`

### **Trigger:**
- **Tipo:** Tag Added
- **Tag:** "oportunidad estancada 7 dias" (h77DAbGrkv1BS4ieCUD2)

### **Estructura de la secuencia:**

```
DÍA 0 (Inmediato)
    ↓
MENSAJE 1: Reactivación inicial
    ↓
ESPERAR 48 horas
    ↓
¿Respondió? 
    ├─ SÍ → MOVER A "En seguimiento" + REMOVER TAG + FIN
    └─ NO → CONTINUAR
         ↓
    MENSAJE 2: Follow-up con propiedades nuevas
         ↓
    ESPERAR 72 horas
         ↓
    ¿Respondió?
         ├─ SÍ → MOVER A "En seguimiento" + REMOVER TAG + FIN
         └─ NO → CONTINUAR
              ↓
         MENSAJE 3: Última oportunidad + escalar humano
              ↓
         ESPERAR 48 horas
              ↓
         ¿Respondió?
              ├─ SÍ → MOVER A "En seguimiento" + REMOVER TAG + FIN
              └─ NO → TRIGGER WF-03 (Escalamiento Humano)
```

### **MENSAJE 1: Reactivación inicial (Día 0)**

**Condiciones previas:**
- Verificar que contact tenga WhatsApp válido
- Verificar horario permitido (9 AM - 8 PM)

**Template del mensaje:**
```
Hola {{contact.first_name}}! 👋

Soy el asistente de Juejati Brokers. Hace unos días estuvimos conversando sobre tu búsqueda de {{custom_field.tipo_de_propiedad_2}} en {{custom_field.zona}}.

¿Seguís buscando? Tenemos propiedades nuevas que podrían interesarte 🏡

Te comparto algunas opciones que se ajustan a lo que me comentaste:
{{dynamic_properties_list}}

¿Alguna te llama la atención? 
```

**Acciones post-envío:**
```
1. Agregar tag: "busqueda tokko" (para tracking)
2. Agregar nota: "🤖 Mensaje 1 de reactivación enviado"
3. Wait 48 horas (o hasta que responda)
```

---

### **MENSAJE 2: Follow-up con propiedades (Día 2)**

**Condiciones:**
- NO respondió al mensaje anterior
- Pasaron 48 horas desde mensaje 1
- Tag "oportunidad estancada 7 dias" sigue activo

**Template del mensaje:**
```
{{contact.first_name}}, quería seguir ayudándote con tu búsqueda 🔍

Vi que te interesan {{custom_field.tipo_de_propiedad_2}}s en zona {{custom_field.zona}}, con presupuesto aproximado de {{custom_field.presupuesto_ia}} USD.

Encontré estas opciones que coinciden con lo que buscás:

📍 Opción 1: {{property_1_title}}
💰 {{property_1_price}}
📏 {{property_1_size}}
🔗 {{property_1_link}}

📍 Opción 2: {{property_2_title}}
💰 {{property_2_price}}
📏 {{property_2_size}}
🔗 {{property_2_link}}

¿Te gustaría más info de alguna? ¿O cambió algo en tu búsqueda?
```

**Acciones post-envío:**
```
1. Agregar nota: "🤖 Mensaje 2 de reactivación enviado (follow-up)"
2. Wait 72 horas (o hasta que responda)
```

---

### **MENSAJE 3: Última oportunidad (Día 5)**

**Condiciones:**
- NO respondió a mensajes anteriores
- Pasaron 72 horas desde mensaje 2
- Tag "oportunidad estancada 7 dias" sigue activo

**Template del mensaje:**
```
Hola {{contact.first_name}}! 👋

Quiero asegurarme de que estés recibiendo la mejor atención posible.

Entiendo que quizás tu búsqueda cambió o preferís que te contacte uno de nuestros asesores directamente.

¿Seguís interesado/a en encontrar {{custom_field.tipo_de_propiedad_2}} en {{custom_field.zona}}?

Si preferís, puedo conectarte con {{custom_field.asesor_asignado}} para que te asesore personalmente 🤝

Solo respondeme:
1️⃣ "SEGUIR" si querés que siga buscando opciones
2️⃣ "ASESOR" si preferís hablar con un humano
3️⃣ "PAUSA" si querés pausar tu búsqueda por ahora
```

**Acciones post-envío:**
```
1. Agregar nota: "🤖 Mensaje 3 enviado - Última oportunidad"
2. Wait 48 horas (o hasta que responda)
3. IF NO responde → Trigger WF-03 (Escalamiento)
```

---

## 🚨 WORKFLOW 3: ESCALAMIENTO A HUMANO

### **Nombre:** `[HANDOFF] Escalamiento Stale Opp a Agente Humano`

### **Trigger:**
- **Tipo:** Workflow Trigger
- **Origen:** WF-02 (Secuencia de Reactivación)
- **Condición:** Lead no respondió a 3 mensajes consecutivos

### **Acciones del workflow:**

#### **ACCIÓN 1: Remover tags de IA**
```
Tags a remover:
├─ "oportunidad estancada 7 dias" (h77DAbGrkv1BS4ieCUD2)
├─ "ia activa" (aVD3q1Ub2G2r5canpsiX)
└─ "busqueda tokko" (WSF3lp2CWeD8DVuJ3osU)
```

#### **ACCIÓN 2: Agregar tags de escalamiento**
```
Tags a agregar:
├─ "asistencia humana" (IdKjFPgZYmalZjM645e2)
├─ "seguimiento manual" (LOZIEvltoNVY9j47M39F)
└─ "en nutricion" (GniL6BLNrjctf4zgXnbw)
```

#### **ACCIÓN 3: Mover a stage de nutrición**
```
Pipeline: "01 - Compradores - Seguimiento IA"
Stage nuevo: "Nutrición"
Stage ID: 12cd3dc6-d589-4427-a1c3-5821754191b7
```

#### **ACCIÓN 4: Asignar a agente humano**
```
IF custom_field "Asesor Asignado" NO está vacío:
    Asignar opportunity a ese usuario
ELSE:
    Asignar a "Round Robin" del equipo de ventas
```

#### **ACCIÓN 5: Crear tarea para el agente**
```
Tipo: Tarea
Título: "🔥 LEAD ESTANCADO - Requiere seguimiento manual"
Descripción: 
"Lead: {{contact.name}}
Teléfono: {{contact.phone}}
Email: {{contact.email}}

🔍 BÚSQUEDA ORIGINAL:
• Tipo: {{custom_field.tipo_de_propiedad_2}}
• Zona: {{custom_field.zona}}
• Presupuesto: {{custom_field.presupuesto_ia}} USD
• Ambientes: {{custom_field.ambientes}}

📊 HISTORIAL:
• Primer contacto: {{custom_field.fecha_primer_contacto}}
• Último mensaje: {{opportunity.last_message_date}}
• Días sin actividad: {{days_inactive}}

⚠️ NO RESPONDIÓ A 3 MENSAJES DE REACTIVACIÓN AUTOMÁTICA
→ Requiere contacto telefónico o estrategia diferente

PRÓXIMOS PASOS SUGERIDOS:
1. Llamar por teléfono para validar interés
2. Enviar mensaje personalizado con propiedades MUY específicas
3. Ofrecer visita presencial a oficina
4. Si no hay interés, mover a 'Perdido/Abandonado'"

Due Date: {{today + 2 días}}
Asignado a: {{assigned_user}}
```

#### **ACCIÓN 6: Notificar al agente**
```
Medio: Email + Notificación interna GHL
Destinatario: Usuario asignado
Asunto: "🔥 Lead estancado requiere tu atención: {{contact.name}}"

Cuerpo:
"Hola {{assigned_user.first_name}},

Tenés un lead que necesita seguimiento manual urgente.

{{contact.name}} ({{contact.phone}}) no respondió a 3 intentos automáticos de reactivación.

Búsqueda original:
• {{custom_field.tipo_de_propiedad_2}} en {{custom_field.zona}}
• Presupuesto: {{custom_field.presupuesto_ia}} USD

Por favor contactalo en las próximas 48hs.

Ver lead: {{opportunity.url}}"
```

#### **ACCIÓN 7: Crear nota en opportunity**
```
Tipo: Nota
Contenido:
"🚨 ESCALADO A HUMANO

Lead no respondió a secuencia de reactivación automática:
✗ Mensaje 1 (Día 0) - Sin respuesta
✗ Mensaje 2 (Día 2) - Sin respuesta  
✗ Mensaje 3 (Día 5) - Sin respuesta

Movido a nutrición manual.
Tarea asignada a: {{assigned_user.name}}
Fecha: {{today}}"
```

---

## 📊 WORKFLOW 4: TRACKING Y REPORTES

### **Nombre:** `[METRICS] Reporte Semanal Stale Opportunities`

### **Trigger:**
- **Tipo:** Scheduled (Weekly)
- **Día:** Lunes
- **Hora:** 8:00 AM

### **Objetivo:**
Generar reporte automático con métricas de reactivación

### **Acciones del workflow:**

#### **ACCIÓN 1: Recopilar métricas**
```
MÉTRICAS A CALCULAR (últimos 7 días):

1. Leads estancados detectados: 
   COUNT(opportunities WHERE tag added = "oportunidad estancada 7 dias")

2. Leads reactivados con éxito:
   COUNT(opportunities WHERE tag removed = "oportunidad estancada 7 dias" 
   AND stage moved to "En seguimiento")

3. Leads escalados a humano:
   COUNT(opportunities WHERE tag added = "asistencia humana" 
   FROM stale opp workflow)

4. Tasa de reactivación:
   (Leads reactivados / Leads estancados) * 100

5. Tiempo promedio de reactivación:
   AVG(time between tag add and tag remove)

6. Mensajes enviados:
   COUNT(messages sent by stale opp workflow)
```

#### **ACCIÓN 2: Crear reporte visual**
```
Formato: Email HTML + Nota interna

Destinatarios:
├─ Manager de ventas
└─ Equipo de operaciones

Contenido del reporte:
┌─────────────────────────────────────────┐
│  📊 REPORTE SEMANAL - STALE OPPORTUNITIES │
│  Período: {{week_start}} - {{week_end}}    │
└─────────────────────────────────────────┘

🔍 DETECCIÓN:
• Leads estancados detectados: {{count_detected}}
• Promedio de días sin actividad: {{avg_days}}

✅ REACTIVACIÓN EXITOSA:
• Leads reactivados: {{count_reactivated}}
• Tasa de éxito: {{success_rate}}%
• Tiempo promedio: {{avg_time}} días

🚨 ESCALAMIENTO:
• Leads escalados a humano: {{count_escalated}}
• Pendientes de contacto: {{pending_contact}}

💬 MENSAJES:
• Total enviados: {{total_messages}}
• Promedio por lead: {{avg_messages}}

📈 TENDENCIA:
• Vs. semana anterior: {{trend}} {{trend_icon}}

🎯 TOP 3 ZONAS CON MÁS ESTANCADOS:
1. {{top_zone_1}} ({{count_1}} leads)
2. {{top_zone_2}} ({{count_2}} leads)
3. {{top_zone_3}} ({{count_3}} leads)

Ver detalle completo: {{report_url}}
```

---

## 🔧 CONFIGURACIONES ADICIONALES RECOMENDADAS

### **SMART LIST: Oportunidades Estancadas Activas**
```
Nombre: "🔴 Stale Opportunities - En Proceso"

Filtros:
├─ Has tag: "oportunidad estancada 7 dias"
├─ Pipeline: "01 - Compradores - Seguimiento IA"
└─ Status: Abierta

Orden: Por días sin actividad (DESC)

Uso: Dashboard para monitoreo en tiempo real
```

### **SMART LIST: Leads Reactivados Exitosamente**
```
Nombre: "✅ Reactivados - Últimos 30 días"

Filtros:
├─ Tag removed: "oportunidad estancada 7 dias" (últimos 30 días)
├─ Pipeline: "01 - Compradores - Seguimiento IA"
└─ Stage: "En seguimiento" o posterior

Orden: Por fecha de reactivación (DESC)

Uso: Análisis de efectividad
```

### **SMART LIST: Requieren Atención Humana**
```
Nombre: "🚨 Escalados - Requieren Seguimiento"

Filtros:
├─ Has tag: "asistencia humana"
├─ Has tag: "seguimiento manual"
├─ Pipeline: "01 - Compradores - Seguimiento IA"
└─ Stage: "Nutrición"

Orden: Por fecha de escalamiento (ASC)

Uso: Cola de trabajo para agentes
```

---

## ⚙️ CONFIGURACIÓN DE HORARIOS Y LÍMITES

### **Horarios de envío de WhatsApp:**
```
Días permitidos: Lunes a Viernes
Horario: 9:00 AM - 8:00 PM (hora local Argentina)
Fines de semana: NO enviar (esperar a lunes)
Feriados: NO enviar
```

### **Límites de mensajes:**
```
Máximo por lead: 3 mensajes en secuencia
Intervalo mínimo entre mensajes: 48 horas
Máximo mensajes totales por día: 50 (para evitar spam)
```

### **Exclusiones automáticas:**
```
NO procesar leads que:
├─ Tienen tag "detener ia" o "stop bot"
├─ Stage = "Perdido/Abandonado" o "Ganado"
├─ No tienen teléfono válido
├─ Están marcados como "do not contact"
└─ Ya están en campaña de reactivación activa
```

---

## 📈 MÉTRICAS CLAVE A MONITOREAR

### **Diarias:**
1. Leads detectados como estancados
2. Mensajes enviados en secuencias
3. Respuestas recibidas
4. Leads reactivados

### **Semanales:**
1. Tasa de reactivación (target: >25%)
2. Tiempo promedio de reactivación (target: <5 días)
3. Leads escalados a humano
4. Conversiones de leads reactivados

### **Mensuales:**
1. ROI de sistema de reactivación
2. Ahorro en horas de equipo de ventas
3. Revenue generado de leads reactivados
4. Tendencias por zona/tipo de propiedad

---

## 🎯 PRÓXIMOS PASOS - ORDEN DE IMPLEMENTACIÓN

### **FASE 1: Setup Básico (Día 1-2)**
1. ✅ Verificar que custom fields estén correctos
2. ✅ Crear/verificar tags necesarios
3. ✅ Configurar WF-01 (Detector)
4. ✅ Testear detección en 5 leads reales

### **FASE 2: Secuencia de Reactivación (Día 3-4)**
1. ✅ Crear templates de mensajes WhatsApp
2. ✅ Configurar WF-02 (Secuencia)
3. ✅ Testear flujo completo con 3 leads de prueba
4. ✅ Ajustar timings y mensajes según feedback

### **FASE 3: Escalamiento (Día 5)**
1. ✅ Configurar WF-03 (Handoff)
2. ✅ Crear templates de tareas para agentes
3. ✅ Configurar notificaciones
4. ✅ Testear escalamiento

### **FASE 4: Reportes y Optimización (Día 6-7)**
1. ✅ Configurar WF-04 (Métricas)
2. ✅ Crear Smart Lists
3. ✅ Setup dashboard de monitoreo
4. ✅ Capacitar equipo en uso del sistema

### **FASE 5: Go Live (Día 8)**
1. ✅ Activar WF-01 en producción
2. ✅ Monitorear primeras 24hs intensivamente
3. ✅ Ajustar según resultados iniciales
4. ✅ Documentar learnings

---

## ⚠️ CONSIDERACIONES IMPORTANTES

### **Prevención de conflictos:**
1. Antes de activar, **pausar todos los workflows que:**
   - Envíen mensajes automáticos al mismo segmento
   - Muevan leads entre stages automáticamente
   - Agreguen/remuevan los mismos tags

2. **Coordinar con equipo:**
   - Avisar que sistema automático estará activo
   - Explicar cómo reconocer leads en reactivación
   - Definir protocolo si agente quiere tomar control manual

3. **Testing exhaustivo:**
   - Probar con leads de prueba primero
   - Verificar que tags se agreguen/remuevan correctamente
   - Confirmar que mensajes lleguen en horarios correctos
   - Validar que escalamiento funcione

### **Monitoreo continuo:**
```
Primeros 7 días: Revisar DIARIAMENTE
├─ Mensajes enviados vs esperados
├─ Respuestas recibidas
├─ Leads escalados
└─ Errores o bugs

Después: Revisar SEMANALMENTE
└─ Métricas de performance
└─ Optimización de mensajes
└─ Ajustes de timings
```

---

## 📞 SOPORTE Y AJUSTES

### **Si algo no funciona:**
1. Pausar workflow problemático inmediatamente
2. Revisar logs en GHL (Workflows → History)
3. Verificar condiciones y filtros
4. Testear con 1 lead de prueba
5. Reactivar gradualmente

### **Optimización continua:**
- Cada 2 semanas: Analizar tasa de respuesta por mensaje
- Cada mes: A/B testing de diferentes templates
- Cada trimestre: Revisar y actualizar criterios de detección

---

## ✅ CHECKLIST FINAL PRE-ACTIVACIÓN

```
VERIFICACIONES TÉCNICAS:
☐ Custom fields configurados correctamente
☐ Tags creados y mapeados
☐ Workflows creados según especificaciones
☐ Horarios de envío configurados (9 AM - 8 PM)
☐ Límites de mensajes configurados
☐ Exclusiones configuradas

TESTING:
☐ WF-01 detecta leads correctamente
☐ WF-02 envía mensajes en secuencia
☐ Tags se agregan/remueven bien
☐ WF-03 escala a humano cuando corresponde
☐ Notificaciones llegan a agentes
☐ Tareas se crean correctamente

DOCUMENTACIÓN:
☐ Equipo capacitado en nuevo sistema
☐ Protocolo de handoff documentado
☐ Dashboard de métricas configurado
☐ Proceso de troubleshooting definido

GO LIVE:
☐ Workflows en DRAFT mode
☐ Testing final completado
☐ Equipo notificado
☐ Plan de rollback definido
☐ Monitoreo first-24hrs agendado
```

---

**🎯 META: Reactivar 25%+ de leads estancados en los primeros 30 días**

