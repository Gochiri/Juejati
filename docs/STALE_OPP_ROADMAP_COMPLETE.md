# 🗺️ ROADMAP COMPLETO: STALE OPPORTUNITIES SYSTEM
**Cliente:** Juejati Brokers  
**Location ID:** `WWrBqekGJCsCmSSvPzEf`  
**Fecha de Mapeo:** 2026-01-02  
**Metodología:** 70% Planning / 30% Execution

---

## 📋 EXECUTIVE SUMMARY

### Objetivo del Proyecto
Implementar sistema automatizado de detección y reactivación de oportunidades estancadas (leads sin actividad >7 días) mediante secuencias inteligentes de WhatsApp con escalamiento humano.

### Componentes Principales
- **4 Workflows principales** (SD, SR, SH, SM)
- **3 Custom Fields nuevos**
- **8 Tags de control** (ya existen)
- **3 Smart Lists de monitoreo**
- **1 Pipeline existente** (modificado)

### Tiempo Estimado de Implementación
- **Planning & Setup:** 8-12 horas
- **Building & Testing:** 12-16 horas
- **QA & Go-Live:** 4-6 horas
- **TOTAL:** 24-34 horas (3-4 días laborales)

### ROI Esperado
- Recuperación del 25-35% de leads estancados
- Reducción de 15-20 horas/mes de trabajo manual
- Incremento estimado de revenue: 10-15%

---

## 🎨 VISUAL PROCESS MAP

### Color Coding Standard
- 🔵 **AZUL** = Detection & Triggers (SD)
- 🟢 **VERDE** = Reactivation Sequences (SR)
- 🔴 **ROJO** = Human Handoff (SH)
- 🟣 **MORADO** = Metrics & Reports (SM)
- ⚫ **GRIS** = Decisions/Conditions

---

## 📊 MAPA VISUAL DEL PROCESO

```
┌─────────────────────────────────────────────────────────────────┐
│                    STALE OPPORTUNITIES SYSTEM                    │
│                         PROCESS FLOW MAP                         │
└─────────────────────────────────────────────────────────────────┘

[DETECTION LAYER - BLUE BLOCK 🔵]
┌────────────────────────────────────────────┐
│  SD01: Detector Diario de Estancados       │
├────────────────────────────────────────────┤
│  TRIGGER: Scheduled - Daily @ 9:00 AM      │
├────────────────────────────────────────────┤
│  ① Buscar oportunidades en:                │
│     Pipeline: "01 - Compradores - IA"      │
│     Stage: "En seguimiento"                │
│  ② Filtrar:                                │
│     └─ Última actividad > 7 días           │
│     └─ Sin tag "oportunidad estancada"     │
│     └─ Sin tag "detener ia"                │
│     └─ WhatsApp válido                     │
│  ③ Para cada lead detectado:               │
│     └─ Agregar tag "oportunidad estancada  │
│        7 dias" (h77DAbGrkv1BS4ieCUD2)      │
│     └─ Crear nota interna                  │
│     └─ Actualizar campo "Fecha Primer      │
│        Contacto"                           │
│     └─ TRIGGER: SR01 (Secuencia)           │
└────────────────────────────────────────────┘
                     │
                     ▼
[REACTIVATION LAYER - GREEN BLOCK 🟢]
┌────────────────────────────────────────────┐
│  SR01: Secuencia Reactivación WhatsApp     │
├────────────────────────────────────────────┤
│  TRIGGER: Tag Added                        │
│  Tag: "oportunidad estancada 7 dias"       │
├────────────────────────────────────────────┤
│  MENSAJE 1 (Día 0)                         │
│  ├─ Verificar horario (9 AM - 8 PM)        │
│  ├─ Enviar mensaje inicial reactivación    │
│  ├─ Agregar tag "busqueda tokko"           │
│  └─ Wait 48 horas                          │
│                                            │
│  ┌──────────────────┐                      │
│  │  DECISIÓN 1      │  ⚫                   │
│  │  ¿Respondió?     │                      │
│  └──────────────────┘                      │
│      │            │                        │
│     SÍ           NO                        │
│      │            │                        │
│      │            ▼                        │
│      │     MENSAJE 2 (Día 2)               │
│      │     ├─ Follow-up con propiedades    │
│      │     ├─ Crear nota                   │
│      │     └─ Wait 72 horas                │
│      │                                     │
│      │     ┌──────────────────┐            │
│      │     │  DECISIÓN 2      │  ⚫        │
│      │     │  ¿Respondió?     │            │
│      │     └──────────────────┘            │
│      │         │            │              │
│      │        SÍ           NO              │
│      │         │            │              │
│      │         │            ▼              │
│      │         │     MENSAJE 3 (Día 5)     │
│      │         │     ├─ Última oportunidad │
│      │         │     ├─ Ofrecer asesor     │
│      │         │     └─ Wait 48 horas      │
│      │         │                           │
│      │         │     ┌──────────────────┐  │
│      │         │     │  DECISIÓN 3      │⚫│
│      │         │     │  ¿Respondió?     │  │
│      │         │     └──────────────────┘  │
│      │         │         │           │     │
│      │         │        SÍ          NO     │
│      ▼         ▼         ▼           │     │
│  [LEAD REACTIVADO]                   │     │
│  ├─ Remover tag "oportunidad..."     │     │
│  ├─ Mover a stage "En seguimiento"   │     │
│  ├─ Crear nota "✅ Reactivado"        │     │
│  └─ END                               │     │
│                                       ▼     │
└───────────────────────────────────────┼─────┘
                                        │
                                        ▼
[HUMAN HANDOFF LAYER - RED BLOCK 🔴]
┌────────────────────────────────────────────┐
│  SH01: Escalamiento a Agente Humano        │
├────────────────────────────────────────────┤
│  TRIGGER: SR01 - No respondió 3 mensajes   │
├────────────────────────────────────────────┤
│  ① Remover tags de IA:                     │
│     └─ "oportunidad estancada 7 dias"      │
│     └─ "ia activa"                         │
│     └─ "busqueda tokko"                    │
│  ② Agregar tags de handoff:                │
│     └─ "asistencia humana"                 │
│     └─ "seguimiento manual"                │
│     └─ "en nutricion"                      │
│  ③ Mover a stage "Nutrición"               │
│     Pipeline: "01 - Compradores - IA"      │
│     Stage ID: 12cd3dc6-d589-4427...        │
│  ④ Asignar a agente:                       │
│     └─ IF "Asesor Asignado" existe         │
│        THEN asignar a ese user             │
│        ELSE Round Robin                    │
│  ⑤ Crear tarea urgente:                    │
│     └─ Título: "🔥 LEAD ESTANCADO"         │
│     └─ Due: +2 días                        │
│     └─ Descripción completa con historial  │
│  ⑥ Notificar agente:                       │
│     └─ Email + Notificación GHL            │
│  ⑦ Crear nota final en opportunity         │
└────────────────────────────────────────────┘
                     │
                     ▼
         [AGENTE HUMANO TOMA CONTROL]

[METRICS & REPORTING - PURPLE BLOCK 🟣]
┌────────────────────────────────────────────┐
│  SM01: Reporte Semanal Automático          │
├────────────────────────────────────────────┤
│  TRIGGER: Scheduled - Weekly               │
│  Día: Lunes @ 8:00 AM                      │
├────────────────────────────────────────────┤
│  ① Recopilar métricas (últimos 7 días):    │
│     └─ Leads detectados como estancados    │
│     └─ Leads reactivados exitosamente      │
│     └─ Leads escalados a humano            │
│     └─ Tasa de reactivación (%)            │
│     └─ Tiempo promedio de reactivación     │
│     └─ Total mensajes enviados             │
│  ② Generar reporte HTML                    │
│  ③ Enviar email a:                         │
│     └─ Manager de ventas                   │
│     └─ Equipo de operaciones               │
│  ④ Crear nota en dashboard interno         │
└────────────────────────────────────────────┘
```

---

## 📑 GOOGLE SHEET ROADMAP STRUCTURE

### TAB 1: PIPELINES

| Pipeline Name | Pipeline ID | Stages Afectados | Modificaciones Necesarias |
|---------------|-------------|------------------|--------------------------|
| 01 - Compradores - Seguimiento IA | tDFS4eZP5Rliei09iGIK | En seguimiento, Nutrición | Ninguna (ya existe) |

**Stage de enfoque principal:**
- **En seguimiento** (ID: `6a4a44b3-2b0c-4aad-a00d-f62276fc4e0d`)
- Este es el stage donde se detectan leads estancados

---

### TAB 2: WORKFLOWS

| Code | Workflow Name | Trigger Type | Trigger Details | Goal/Objetivo | Phase |
|------|---------------|--------------|-----------------|---------------|-------|
| SD01 | Detector Diario Estancados | Scheduled | Daily @ 9:00 AM | Identificar automáticamente leads sin actividad >7 días y marcarlos para reactivación | Planning |
| SR01 | Secuencia Reactivación WhatsApp | Tag Added | Tag: "oportunidad estancada 7 dias" | Reactivar leads estancados con 3 mensajes progresivos en WhatsApp | Planning |
| SH01 | Escalamiento Agente Humano | Workflow Trigger | From SR01 (no response) | Transferir leads no reactivados a seguimiento humano con contexto completo | Planning |
| SM01 | Reporte Semanal Métricas | Scheduled | Weekly Monday @ 8:00 AM | Generar reporte automático de performance del sistema | Backlog |

**Nomenclatura:**
- **SD** = Stale Detection
- **SR** = Stale Reactivation
- **SH** = Stale Handoff
- **SM** = Stale Metrics

---

### TAB 3: CUSTOM FIELDS

| Field Name | Field Key | Field Type | Field ID | Folder/Parent | Status | Notas |
|------------|-----------|------------|----------|---------------|--------|-------|
| Fecha Primer Contacto | contact.fecha_primer_contacto | DATE | nmjHXLuEaaidNamLXedw | Búsqueda IA | ✅ Existe | Se actualiza cuando se detecta estancamiento |
| Asesor Asignado | contact.asesor | TEXT | QrklwUOejneSuhN9WZEp | Búsqueda IA | ✅ Existe | Para asignación de handoff |
| Estado Visita | contact.estado_visita | SINGLE_OPTIONS | wZdiUcCYudAst5wp8nxR | Búsqueda IA | ✅ Existe | Tracking de estado |
| Última Propiedad Vista | contact.ltima_propiedad_vista | TEXT | SIxdiv7ssbhAzMAyIziu | Búsqueda IA | ✅ Existe | Para personalización mensajes |
| Características Deseadas | contact.caractersticas_deseadas | LARGE_TEXT | lgdH2EYqz6j7o1ZAUlCg | Búsqueda IA | ✅ Existe | Para matching propiedades |

**Campos adicionales recomendados (OPCIONAL):**

| Field Name | Field Key | Field Type | Folder/Parent | Uso |
|------------|-----------|------------|---------------|-----|
| Contador Reactivaciones | contact.contador_reactivaciones | NUMERICAL | Búsqueda IA | Trackear cuántas veces se reactivó |
| Última Fecha Reactivación | contact.ultima_fecha_reactivacion | DATE | Búsqueda IA | Evitar reactivar muy seguido |
| Respuesta Preferida | contact.respuesta_preferida | SINGLE_OPTIONS | Búsqueda IA | WhatsApp/Llamada/Email |

---

### TAB 4: TAGS

| Tag Name | Tag ID | Category | Usage | Created |
|----------|--------|----------|-------|---------|
| oportunidad estancada 7 dias | h77DAbGrkv1BS4ieCUD2 | Detection | Tag principal para identificar leads estancados | ✅ Existe |
| ia activa | aVD3q1Ub2G2r5canpsiX | Control IA | Indica que IA está activa en el lead | ✅ Existe |
| detener ia | GxSwNeDfHCo3LIVQ0f7C | Control IA | Excluir de automatización | ✅ Existe |
| detener_ia | R9w6ZQUlQ8RYhtByBzpz | Control IA | Excluir de automatización (alt) | ✅ Existe |
| asistencia humana | IdKjFPgZYmalZjM645e2 | Handoff | Requiere intervención humana | ✅ Existe |
| seguimiento manual | LOZIEvltoNVY9j47M39F | Handoff | En seguimiento por agente | ✅ Existe |
| en nutricion | GniL6BLNrjctf4zgXnbw | Pipeline | Lead en nutrición/warming | ✅ Existe |
| busqueda tokko | WSF3lp2CWeD8DVuJ3osU | Tracking | Lead en búsqueda activa Tokko | ✅ Existe |

**Tags de WhatsApp (control de errores):**

| Tag Name | Tag ID | Usage |
|----------|--------|-------|
| [whatsapp] - contact is not registered | slsgDt9ojsvpBL1JvW9L | Excluir de secuencias WA |
| [whatsapp] - phone device disconnected | 3EdVnSw69J0TH0Hm6OwG | Device WA inactivo |

---

### TAB 5: SMART LISTS

| List Name | Filter Conditions | Usage | Sort Order |
|-----------|------------------|-------|------------|
| 🔴 Stale Opportunities - Activos | Tag: "oportunidad estancada 7 dias" + Pipeline: "01 - Compradores - IA" + Status: Open | Dashboard monitoreo en tiempo real | Por días sin actividad DESC |
| ✅ Reactivados - Últimos 30 días | Tag removed: "oportunidad estancada 7 dias" (last 30d) + Stage: "En seguimiento"+ | Análisis de efectividad | Por fecha reactivación DESC |
| 🚨 Requieren Atención Humana | Tag: "asistencia humana" + Tag: "seguimiento manual" + Stage: "Nutrición" | Cola de trabajo para agentes | Por fecha escalamiento ASC |

---

### TAB 6: MESSAGE TEMPLATES

#### **TEMPLATE 1: Mensaje Inicial (Día 0)**

```
Hola {{contact.first_name}}! 👋

Soy el asistente de Juejati Brokers. Hace unos días estuvimos conversando sobre tu búsqueda de {{custom_field.tipo_de_propiedad_2}} en {{custom_field.zona}}.

¿Seguís buscando? Tenemos propiedades nuevas que podrían interesarte 🏡

Te comparto algunas opciones que se ajustan a lo que me comentaste:

📍 Opción 1: [TÍTULO PROPIEDAD]
💰 USD [PRECIO]
📏 [M2] m²
🔗 [LINK]

📍 Opción 2: [TÍTULO PROPIEDAD]
💰 USD [PRECIO]
📏 [M2] m²
🔗 [LINK]

¿Alguna te llama la atención?
```

**Variables dinámicas:**
- `{{contact.first_name}}`
- `{{custom_field.tipo_de_propiedad_2}}`
- `{{custom_field.zona}}`
- Propiedades: Buscar en Tokko API según criterios del lead

---

#### **TEMPLATE 2: Follow-up (Día 2)**

```
{{contact.first_name}}, quería seguir ayudándote con tu búsqueda 🔍

Vi que te interesan {{custom_field.tipo_de_propiedad_2}}s en zona {{custom_field.zona}}, con presupuesto aproximado de {{custom_field.presupuesto_ia}} USD.

Encontré estas opciones que coinciden con lo que buscás:

📍 Opción 1: [TÍTULO]
💰 [PRECIO]
📏 [M2]
🔗 [LINK]

📍 Opción 2: [TÍTULO]
💰 [PRECIO]
📏 [M2]
🔗 [LINK]

¿Te gustaría más info de alguna? ¿O cambió algo en tu búsqueda?
```

---

#### **TEMPLATE 3: Última Oportunidad (Día 5)**

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

---

### TAB 7: ACTION ITEMS & CHECKLIST

| Phase | Task | Subtasks | Owner | Status | Hours | Notes |
|-------|------|----------|-------|--------|-------|-------|
| **PLANNING (70%)** | | | | | | |
| 1.1 | Auditoría de workflows existentes | Pausar workflows conflictivos | German | ⏳ Pending | 2h | Evitar duplicación |
| 1.2 | Validar custom fields | Verificar que campos existen y están mapeados correctamente | German | ⏳ Pending | 1h | |
| 1.3 | Verificar tags | Confirmar IDs de tags en sistema | German | ⏳ Pending | 0.5h | |
| 1.4 | Diseñar templates de mensajes | Crear variaciones por tipo de propiedad/zona | German | ⏳ Pending | 3h | A/B testing |
| 1.5 | Definir horarios y límites | Configurar ventanas de envío y rate limits | German | ⏳ Pending | 1h | |
| 1.6 | Mapear integraciones | Tokko API para propiedades dinámicas | German | ⏳ Pending | 2h | |
| **BUILDING (30%)** | | | | | | |
| 2.1 | Crear WF: SD01 (Detector) | Configurar trigger, condiciones, acciones | German | ⏳ Pending | 3h | |
| 2.2 | Crear WF: SR01 (Secuencia) | Configurar 3 mensajes + timings | German | ⏳ Pending | 4h | |
| 2.3 | Crear WF: SH01 (Handoff) | Configurar escalamiento y tareas | German | ⏳ Pending | 3h | |
| 2.4 | Crear WF: SM01 (Reportes) | Configurar métricas y email | German | ⏳ Pending | 2h | |
| 2.5 | Configurar Smart Lists | Crear 3 listas de monitoreo | German | ⏳ Pending | 1h | |
| **TESTING** | | | | | | |
| 3.1 | Test unitario SD01 | Verificar detección correcta con 5 leads | German | ⏳ Pending | 1h | |
| 3.2 | Test unitario SR01 | Enviar secuencia completa a lead de prueba | German | ⏳ Pending | 2h | |
| 3.3 | Test unitario SH01 | Verificar handoff y creación de tarea | German | ⏳ Pending | 1h | |
| 3.4 | Test integración completa | Flujo end-to-end con 3 leads reales | German | ⏳ Pending | 2h | |
| 3.5 | QA de mensajes | Verificar formato, variables, links | German | ⏳ Pending | 1h | |
| **GO LIVE** | | | | | | |
| 4.1 | Capacitar equipo | Training de 30min sobre nuevo sistema | German | ⏳ Pending | 0.5h | |
| 4.2 | Documentar procesos | Crear SOP para agentes | German | ⏳ Pending | 2h | |
| 4.3 | Activar workflows | Publicar en producción | German | ⏳ Pending | 0.5h | |
| 4.4 | Monitoreo first 24h | Revisar performance inicial | German | ⏳ Pending | 2h | |
| 4.5 | Ajustes post-lanzamiento | Optimizar según resultados | German | ⏳ Pending | 2h | |

**TOTAL ESTIMADO: 30-34 horas**

---

## 🎯 IMPLEMENTATION TIMELINE

### Week 1: Planning & Setup (70%)
```
DÍA 1-2: Auditoría y Preparación
├─ Pausar workflows conflictivos
├─ Validar custom fields y tags
├─ Diseñar templates de mensajes
└─ Definir configuraciones (horarios, límites)

DÍA 3: Building Foundation
├─ Crear WF: SD01 (Detector)
└─ Crear WF: SR01 (Secuencia) - Parte 1
```

### Week 2: Building & Testing (30%)
```
DÍA 4: Complete Building
├─ Finalizar WF: SR01 (Secuencia)
├─ Crear WF: SH01 (Handoff)
└─ Crear WF: SM01 (Reportes)

DÍA 5: Testing & QA
├─ Tests unitarios de cada workflow
├─ Test de integración end-to-end
└─ QA de mensajes y variables

DÍA 6-7: Go Live
├─ Capacitar equipo
├─ Documentar procesos
├─ Activar workflows
└─ Monitoreo intensivo first 24-48h
```

---

## 📊 SUCCESS METRICS (KPIs)

### Métricas Primarias (Week 1)
| KPI | Target | Tracking Method |
|-----|--------|-----------------|
| Leads detectados/día | 10-20 | Smart List + Daily report |
| Tasa de envío exitoso | >95% | Workflow history |
| Errores de WhatsApp | <5% | Tag "whatsapp - not registered" |

### Métricas de Performance (Month 1)
| KPI | Target | Tracking Method |
|-----|--------|-----------------|
| Tasa de reactivación | >25% | Weekly report SM01 |
| Tiempo promedio reactivación | <5 días | Custom calculation |
| Leads escalados a humano | <50% | Handoff count |
| Conversión de reactivados | >10% | Pipeline tracking |

### Métricas de Eficiencia (Ongoing)
| KPI | Target | Tracking Method |
|-----|--------|-----------------|
| Horas ahorradas/mes | 15-20h | Manual calculation |
| Cost per reactivation | <$5 USD | Total cost / reactivations |
| Revenue from reactivated | Track | Opportunities won |

---

## ⚠️ RISK MITIGATION & CONTINGENCY

### Riesgos Identificados

**RIESGO 1: Conflicto con workflows existentes**
- **Probabilidad:** Media
- **Impacto:** Alto
- **Mitigación:** Auditoría previa completa + pausar workflows conflictivos
- **Plan B:** Rollback inmediato si se detectan duplicaciones

**RIESGO 2: Rate limit de WhatsApp**
- **Probabilidad:** Baja
- **Impacto:** Medio
- **Mitigación:** Configurar límites diarios (máx 50 mensajes/día)
- **Plan B:** Queue system para distribuir envíos

**RIESGO 3: Leads se sienten spammeados**
- **Probabilidad:** Baja-Media
- **Impacto:** Alto
- **Mitigación:** Máximo 3 mensajes + espaciado de 48-72h
- **Plan B:** Opción de "PAUSA" en cada mensaje

**RIESGO 4: Agentes no responden a handoffs**
- **Probabilidad:** Media
- **Impacto:** Medio
- **Mitigación:** Notificaciones múltiples (email + GHL + tarea)
- **Plan B:** Escalamiento a manager si no se atiende en 72h

---

## 🔄 CONTINUOUS OPTIMIZATION PLAN

### Week 2-4: Initial Optimization
- Analizar tasa de respuesta por mensaje
- A/B test de diferentes wording
- Ajustar timings entre mensajes
- Refinar criterios de detección (quizás 5 días en vez de 7)

### Month 2-3: Advanced Optimization
- Segmentar por tipo de propiedad/zona
- Templates personalizados por segmento
- Integración dinámica con Tokko para propiedades actualizadas
- Scoring de leads para priorizar reactivación

### Quarter 2: Scaling
- Expandir a otros pipelines
- Implementar IA conversacional en respuestas
- Sistema de recomendación automático de propiedades
- Dashboard ejecutivo con métricas avanzadas

---

## 📞 SUPPORT & ESCALATION

### Niveles de Soporte

**NIVEL 1: German (Implementador)**
- Troubleshooting workflows
- Ajustes de configuración
- Optimización de mensajes

**NIVEL 2: Equipo de Ventas**
- Feedback sobre calidad de reactivaciones
- Reportar leads mal clasificados
- Sugerencias de mejora

**NIVEL 3: Management**
- Decisiones de estrategia
- Cambios mayores en proceso
- Budget para optimizaciones

---

## ✅ FINAL CHECKLIST PRE-GO-LIVE

```
TECHNICAL READINESS:
☐ SD01 workflow creado y testeado
☐ SR01 workflow creado con 3 mensajes configurados
☐ SH01 workflow creado con handoff completo
☐ SM01 workflow creado (puede ir después)
☐ Tags verificados y mapeados
☐ Custom fields validados
☐ Smart Lists creadas
☐ Horarios configurados (9 AM - 8 PM)
☐ Rate limits establecidos (50/día)

CONTENT READINESS:
☐ Templates de mensajes finalizados
☐ Variables dinámicas testeadas
☐ Links de propiedades funcionando
☐ Personalización por segmento lista

TEAM READINESS:
☐ Equipo capacitado en nuevo sistema
☐ SOP documentado y compartido
☐ Protocolo de handoff comunicado
☐ Dashboard de monitoreo accesible

TESTING COMPLETED:
☐ Test unitario de cada workflow (✅)
☐ Test de integración end-to-end (✅)
☐ Test con 3-5 leads reales (✅)
☐ QA de mensajes y formato (✅)
☐ Verificación de horarios (✅)

SAFETY NET:
☐ Workflows en DRAFT mode
☐ Plan de rollback documentado
☐ Backup de configuración actual
☐ Monitoreo first-48h agendado
☐ Slack channel para issues creado

GO/NO-GO DECISION:
☐ Technical readiness: ____%
☐ Content readiness: ____%
☐ Team readiness: ____%
☐ Testing completed: ____%

APPROVED BY: ________________  DATE: __________
```

---

## 📚 APPENDIX: DETAILED WORKFLOW SPECIFICATIONS

*(Ver documento separado: STALE_OPPORTUNITIES_WORKFLOWS.md para specs técnicas completas de cada workflow)*

---

**🎯 OBJETIVO FINAL:** 
Reactivar automáticamente el 25-35% de leads estancados, liberando 15-20 horas/mes del equipo de ventas, mientras se mantiene experiencia de usuario de alta calidad.

**📈 PRÓXIMO MILESTONE:**
- Week 1: Sistema en producción
- Week 2: Primera optimización basada en datos
- Month 1: Target de 25% reactivación alcanzado

---

*Roadmap creado usando metodología GHL Onboarding Mapper*  
*70% Planning / 30% Execution*  
*Versión 1.0 - 2026-01-02*
