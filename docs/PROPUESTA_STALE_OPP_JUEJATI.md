# 📋 PROPUESTA: SISTEMA DE REACTIVACIÓN AUTOMÁTICA
## Mejora de Usabilidad del CRM - Juejati Brokers

**Fecha:** 4 de Enero 2026  
**Cliente:** Juejati Brokers  
**Objetivo:** Automatizar la reactivación de oportunidades estancadas para mejorar la gestión del CRM y aumentar conversiones

---

## 🎯 PROBLEMÁTICA ACTUAL

### Lo que está pasando:

❌ **Oportunidades se "pierden" en el pipeline**
- Leads quedan sin seguimiento después de 7 días
- No hay sistema automático de reactivación
- Los asesores tienen que revisar manualmente el CRM diariamente
- Se pierden oportunidades por falta de follow-up

❌ **Baja usabilidad del CRM**
- Difícil identificar qué leads necesitan atención
- No hay visibilidad clara de oportunidades estancadas
- Falta de automatización en el proceso de reactivación
- Carga manual alta para el equipo de ventas

❌ **Desaprovechamiento del asistente IA**
- El Asistente Juejati (Sofía) solo se usa para leads nuevos
- No se aprovecha para reactivación de leads fríos
- Falta integración con Tokko para propiedades personalizadas

### Impacto en el negocio:

```
📉 Estimación conservadora:
- 30-40% de leads en pipeline se estancan
- Tasa de recuperación manual: ~5-10%
- Tasa de recuperación con automatización: 20-30%

💰 Oportunidad:
Si tenés 100 oportunidades/mes:
- 35 se estancan
- Recuperás 2-3 manualmente (sin sistema)
- Podrías recuperar 7-10 con automatización
- = 5-7 oportunidades adicionales/mes
```

---

## ✅ SOLUCIÓN PROPUESTA

### Sistema Automático de Reactivación con IA

Un sistema que **automáticamente detecta, reactiva y escala** oportunidades estancadas usando:

1. **Detección automática** (GHL nativo)
2. **Reactivación personalizada** vía WhatsApp
3. **Propiedades dinámicas** desde Tokko
4. **Escalamiento inteligente** a asesores humanos
5. **Dashboard de seguimiento** y reportes

---

## 🏗️ ARQUITECTURA DEL SISTEMA

### Vista de Alto Nivel

```
┌──────────────────────────────────────────────────────────────┐
│  GHL PIPELINE: "01 - Compradores - Seguimiento IA"           │
│  Stage: "En seguimiento"                                      │
│                                                               │
│  Lead sin actividad por 7 días                               │
└──────────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────┐
│  TRIGGER AUTOMÁTICO (GHL Native)                             │
│  ✓ Detecta automáticamente oportunidades estancadas          │
│  ✓ No requiere mantenimiento                                 │
│  ✓ 100% confiable                                            │
└──────────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────┐
│  SECUENCIA DE REACTIVACIÓN (3 mensajes)                      │
│                                                               │
│  DÍA 0: Mensaje inicial + propiedades personalizadas         │
│         ↓                                                     │
│  DÍA 2: Follow-up con más opciones                           │
│         ↓                                                     │
│  DÍA 5: Última oportunidad + oferta de asesor humano         │
└──────────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────┐
│  INTEGRACIÓN CON TOKKO BROKER                                │
│  ✓ Búsqueda automática de propiedades                        │
│  ✓ Filtros basados en preferencias del lead                  │
│  ✓ Envío de fichas con imágenes                              │
└──────────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────┐
│  DECISIÓN INTELIGENTE                                        │
│                                                               │
│  ¿Respondió?                                                 │
│  ├─ SÍ → Reactivado ✅                                       │
│  │       - Remove tag "estancado"                            │
│  │       - Continúa con Asistente IA                         │
│  │                                                            │
│  └─ NO → Escalamiento a humano 👤                            │
│         - Asignación automática a asesor                     │
│         - Notificación + contexto completo                   │
│         - Llamada telefónica programada                      │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎨 FLUJO DE USUARIO (UX)

### Desde la perspectiva del lead:

**📱 Experiencia WhatsApp:**

```
DÍA 0 (Lead estancado detectado)
┌────────────────────────────────────────────┐
│ Sofía (Juejati Brokers)                    │
├────────────────────────────────────────────┤
│ Hola María! 👋                             │
│                                            │
│ Hace unos días estuvimos conversando      │
│ sobre tu búsqueda de departamento en      │
│ Palermo.                                   │
│                                            │
│ ¿Seguís buscando? Tenemos propiedades     │
│ nuevas que podrían interesarte 🏡          │
│                                            │
│ [Imagen: Depto 2 amb Palermo]              │
│ 📍 Departamento 2 ambientes con balcón    │
│ 💰 USD 320,000                             │
│ 📏 55 m²                                   │
│ 🔗 Ver ficha completa                      │
│                                            │
│ [Imagen: Depto 2 amb Palermo Hollywood]    │
│ 📍 Luminoso 2 ambientes                   │
│ 💰 USD 295,000                             │
│ 📏 48 m²                                   │
│ 🔗 Ver ficha completa                      │
│                                            │
│ ¿Alguna te llama la atención?             │
└────────────────────────────────────────────┘
```

Si el lead responde → Continúa conversación con IA

Si no responde en 48h → Mensaje 2

```
DÍA 2 (Sin respuesta)
┌────────────────────────────────────────────┐
│ Sofía (Juejati Brokers)                    │
├────────────────────────────────────────────┤
│ María, quería seguir ayudándote con tu    │
│ búsqueda 🔍                                │
│                                            │
│ Vi que te interesan departamentos en       │
│ Palermo, con presupuesto de USD 350k.     │
│                                            │
│ Encontré estas nuevas opciones:           │
│ [3 propiedades más]                        │
│                                            │
│ ¿Te gustaría más info? ¿O cambió algo     │
│ en tu búsqueda?                            │
└────────────────────────────────────────────┘
```

Si no responde en 72h → Mensaje 3 + Escalamiento

```
DÍA 5 (Última oportunidad)
┌────────────────────────────────────────────┐
│ Sofía (Juejati Brokers)                    │
├────────────────────────────────────────────┤
│ Hola María!                                │
│                                            │
│ Te escribo por última vez para ver si     │
│ podemos ayudarte con tu búsqueda.         │
│                                            │
│ Si preferís, puedo derivarte con Juan     │
│ del equipo comercial para que te llame    │
│ y te cuente sobre las últimas opciones    │
│ disponibles.                               │
│                                            │
│ ¿Te parece que te contacte?                │
└────────────────────────────────────────────┘
```

---

### Desde la perspectiva del asesor:

**🖥️ Experiencia CRM:**

#### **1. Detección Automática (Sin intervención)**

```
Pipeline: "01 - Compradores - Seguimiento IA"
┌─────────────────────────────────────────────────────────┐
│ 📊 DASHBOARD - OPORTUNIDADES ESTANCADAS                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 🔴 7 leads sin actividad (7+ días)                      │
│ 🟡 3 en secuencia de reactivación (Día 2)               │
│ 🟢 2 reactivados esta semana                            │
│                                                         │
│ [Ver detalle] [Configurar alertas]                      │
└─────────────────────────────────────────────────────────┘
```

#### **2. Notificaciones Automáticas**

```
📧 Email diario (9:00 AM):
───────────────────────────────────────────
Asunto: [Juejati] 3 leads requieren atención

Hola Juan,

El sistema detectó leads que necesitan seguimiento:

1. María González - Depto Palermo (USD 350k)
   Status: No respondió a 3 mensajes automáticos
   Acción: Llamar hoy
   [Ver contacto] [Ver historial]

2. Carlos Pérez - Casa Belgrano (USD 500k)
   Status: En secuencia (Día 2)
   Acción: Monitorear respuesta
   [Ver contacto]

[Ver todos los leads]
```

#### **3. Escalamiento a Humano**

Cuando un lead no responde a los 3 mensajes:

```
┌─────────────────────────────────────────────────────────┐
│ LEAD ESCALADO A ASESOR                                  │
├─────────────────────────────────────────────────────────┤
│ Nombre: María González                                  │
│ Tag: 🔴 "escalado a humano"                             │
│                                                         │
│ CONTEXTO COMPLETO:                                      │
│ ├─ Búsqueda original: Depto 2 amb Palermo USD 350k     │
│ ├─ Propiedades enviadas: 6                             │
│ ├─ Mensajes sin respuesta: 3                           │
│ ├─ Último mensaje: 5 días atrás                        │
│ └─ Asesor asignado: Juan Martínez                      │
│                                                         │
│ PRÓXIMA ACCIÓN SUGERIDA:                                │
│ Llamar al +54 9 11 2345-6789                            │
│ Script: "Hola María, soy Juan de Juejati. Te vengo     │
│ escribiendo Sofía sobre deptos en Palermo..."          │
│                                                         │
│ [Iniciar llamada] [Programar llamada] [Enviar email]   │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 DASHBOARD Y REPORTES

### Vista Semanal para Gerencia

```
┌─────────────────────────────────────────────────────────────┐
│  REPORTE SEMANAL - REACTIVACIÓN DE OPORTUNIDADES           │
│  Semana del 30 Dic - 5 Ene                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📈 MÉTRICAS CLAVE:                                         │
│  ├─ Oportunidades detectadas: 28                           │
│  ├─ Mensajes enviados: 84 (3 por lead)                     │
│  ├─ Tasa de respuesta: 32% (9 leads)                       │
│  ├─ Reactivaciones exitosas: 7 leads                       │
│  └─ Escalados a humano: 19 leads                           │
│                                                             │
│  💰 IMPACTO EN VENTAS:                                      │
│  ├─ Leads recuperados: 7                                   │
│  ├─ Visitas coordinadas: 4                                 │
│  ├─ Reservas concretadas: 2                                │
│  └─ Valor estimado: USD 650,000                            │
│                                                             │
│  🎯 PERFORMANCE POR ASESOR:                                 │
│  ├─ Juan Martínez: 3 reactivaciones                        │
│  ├─ Ana López: 2 reactivaciones                            │
│  └─ Carlos Díaz: 2 reactivaciones                          │
│                                                             │
│  [Descargar reporte completo PDF]                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 COMPONENTES TÉCNICOS

### Workflows de GHL a Implementar

| Workflow | Nombre | Función | Complejidad |
|----------|--------|---------|-------------|
| **SR01** | Secuencia Reactivación WhatsApp | Envío de 3 mensajes automáticos + propiedades Tokko | Media |
| **SH01** | Escalamiento a Humano | Asignación de asesor + notificaciones | Baja |
| **SM01** | Reportes Semanales | Dashboard y emails de métricas | Baja |

### Integraciones Requeridas

✅ **GoHighLevel API**
- Detección de oportunidades estancadas (trigger nativo)
- Actualización de tags y custom fields
- Envío de WhatsApp messages

✅ **Tokko Broker API**
- Búsqueda automática de propiedades
- Filtrado por zona, tipo, presupuesto, ambientes
- Extracción de imágenes y fichas

✅ **n8n Workflows** (opcional para propiedades dinámicas)
- Integración GHL ↔ Tokko
- Formateo de mensajes con propiedades
- Lógica de filtrado personalizado

### Custom Fields de GHL Necesarios

Ya existentes en tu CRM:

| Campo | ID | Uso |
|-------|-----|-----|
| zona | `yGJXxoO4nk8hQd0RVd5e` | Zona de búsqueda |
| tipo_de_propiedad_2 | `Fw4YRtbOgbSgvA5YXF7q` | Tipo de propiedad |
| presupuesto_ia | `3z3kPYZAaP2m6akjmUum` | Presupuesto en USD |
| ambientes | `vUIYrZh1AWgpZABVvPsB` | Cantidad de ambientes |
| intencion | `sIeO3VWMJVmLn22CzCh3` | Venta o Alquiler |

### Tags del Sistema

| Tag | ID | Uso |
|-----|-----|-----|
| oportunidad estancada 7 dias | `h77DAbGrkv1BS4ieCUD2` | Marca lead en reactivación |
| escalado a humano | - | Requiere atención de asesor |
| reactivado exitosamente | - | Lead respondió a secuencia |

---

## 📅 PLAN DE IMPLEMENTACIÓN

### Fase 1: Configuración Base (Semana 1)
**Tiempo estimado:** 8-12 horas

```
DÍA 1-2: Setup de Workflows GHL
├─ Configurar trigger "Stale Opportunities"
├─ Crear workflow SR01 (Secuencia Reactivación)
├─ Diseñar mensajes de WhatsApp
└─ Configurar condiciones y filtros

DÍA 3: Integración con Tokko
├─ Setup de API Tokko en n8n
├─ Crear workflow de búsqueda de propiedades
├─ Testear formateo de mensajes con propiedades
└─ Validar imágenes y links

DÍA 4: Testing
├─ Crear contacto de prueba
├─ Simular estancamiento (7 días)
├─ Verificar envío de mensajes
└─ Validar propiedades de Tokko
```

### Fase 2: Escalamiento y Notificaciones (Semana 2)
**Tiempo estimado:** 6-8 horas

```
DÍA 1: Workflow de Escalamiento (SH01)
├─ Crear workflow de asignación de asesor
├─ Setup de notificaciones por email
├─ Configurar contexto completo del lead
└─ Testear flujo completo

DÍA 2: Reportes y Dashboard (SM01)
├─ Crear workflow de métricas semanales
├─ Setup de email semanal
├─ Diseñar dashboard en GHL
└─ Testear reportes
```

### Fase 3: Go-Live y Monitoreo (Semana 3)
**Tiempo estimado:** 4-6 horas

```
DÍA 1: Activación
├─ Activar workflows en producción
├─ Monitorear primeros triggers
└─ Validar envíos reales

DÍA 2-7: Optimización
├─ Analizar métricas de respuesta
├─ Ajustar mensajes según feedback
├─ Optimizar timing de envíos
└─ Capacitación del equipo
```

---

## 💰 INVERSIÓN Y RETORNO

### Inversión Inicial

```
IMPLEMENTACIÓN:
├─ Configuración de workflows GHL: 12h × USD 50/h = USD 600
├─ Integración con Tokko API: 8h × USD 50/h = USD 400
├─ Testing y optimización: 6h × USD 50/h = USD 300
└─ Capacitación del equipo: 2h × USD 50/h = USD 100

TOTAL IMPLEMENTACIÓN: USD 1,400
```

### Costos Mensuales

```
OPERACIÓN:
├─ Mensajes WhatsApp (aprox 300/mes): USD 30
├─ Mantenimiento y ajustes (2h/mes): USD 100
└─ n8n workflow executions: USD 0 (plan actual)

TOTAL MENSUAL: USD 130
```

### Retorno Esperado (Conservador)

```
ESCENARIO CONSERVADOR (3 meses):

Base:
- 100 oportunidades nuevas/mes
- 35 se estancan (35%)
- Sin sistema: recuperás 3 (10%)
- Con sistema: recuperás 10 (30%)
= 7 oportunidades adicionales/mes

Conversión:
- 7 oportunidades × 20% conversión = 1.4 ventas/mes
- Ticket promedio: USD 300,000
- Comisión 3% = USD 9,000/venta

ROI mensual: 1.4 ventas × USD 9,000 = USD 12,600/mes
Inversión: USD 130/mes operativo

ROI = 9,600%
Recuperás la inversión inicial en 11 días
```

### Beneficios Adicionales

📈 **Cuantificables:**
- Aumento del 20-30% en recuperación de leads fríos
- Reducción del 70% en tiempo de seguimiento manual
- Mejora del 40% en tasa de respuesta vs contacto manual

✨ **No cuantificables:**
- Mayor satisfacción del equipo (menos trabajo manual)
- Mejor experiencia del cliente (respuestas rápidas)
- Información valiosa sobre preferencias del mercado
- Profesionalización del proceso de ventas

---

## 🎯 MÉTRICAS DE ÉXITO

### KPIs Principales

| Métrica | Objetivo | Tracking |
|---------|----------|----------|
| **Tasa de detección** | 100% (automático) | Semanal |
| **Tasa de respuesta** | >25% | Semanal |
| **Tasa de reactivación** | >20% | Mensual |
| **Leads escalados correctamente** | 100% | Semanal |
| **Tiempo de respuesta asesor** | <24h | Diario |
| **Satisfacción del equipo** | >8/10 | Mensual |

### Dashboard de Monitoreo

```
VISTA DIARIA (Para asesores):
├─ Leads estancados hoy: X
├─ En secuencia de reactivación: X
├─ Requieren atención: X
└─ Reactivados esta semana: X

VISTA SEMANAL (Para gerencia):
├─ Oportunidades detectadas: X
├─ Tasa de respuesta: X%
├─ Reactivaciones exitosas: X
├─ Valor total recuperado: USD X
└─ Performance por asesor
```

---

## ⚠️ CONSIDERACIONES IMPORTANTES

### Limitaciones y Restricciones

🔴 **WhatsApp Business:**
- Límite de envío: Según tu plan actual
- Ventana de 24h para respuestas
- Templates deben estar aprobados

🔴 **Tokko API:**
- Rate limits: 100 requests/min
- Disponibilidad de propiedades en tiempo real
- Calidad de imágenes variable

🔴 **GHL:**
- Trigger "Stale Opportunities" solo cuenta días completos
- No puede detectar estancamiento <24h
- Requiere que el lead tenga pipeline stage correcto

### Mejores Prácticas

✅ **Comunicación:**
- Mantener tono personal y humano
- Evitar spam (máximo 3 mensajes)
- Respetar horarios (9 AM - 8 PM)

✅ **Seguimiento:**
- Asignar asesores específicos para escalamiento
- Revisar dashboard semanalmente
- Ajustar mensajes según feedback

✅ **Cumplimiento:**
- Respetar opt-outs inmediatamente
- Tags "detener ia" siempre activos
- No enviar a leads sin WhatsApp válido

---

## 🚀 PRÓXIMOS PASOS

### Para Aprobar Esta Propuesta

**Necesitamos que confirmes:**

1. ✅ **Alcance:**
   - ¿Te parece correcto el flujo de 3 mensajes?
   - ¿Querés agregar/quitar algo?

2. ✅ **Mensajes:**
   - ¿Aprobás el tono y contenido de los mensajes?
   - ¿Querés personalizarlos?

3. ✅ **Propiedades Tokko:**
   - ¿Querés incluir propiedades dinámicas desde Tokko?
   - ¿O preferís links genéricos por ahora?

4. ✅ **Escalamiento:**
   - ¿Quién será el asesor default para escalamientos?
   - ¿Querés rotación automática?

5. ✅ **Reportes:**
   - ¿Quién debe recibir los reportes semanales?
   - ¿Qué métricas son más importantes para vos?

### Cronograma Propuesto

```
SEMANA 1 (6-12 Enero):
├─ Kickoff meeting (1h)
├─ Configuración workflows GHL
├─ Setup Tokko API
└─ Testing inicial

SEMANA 2 (13-19 Enero):
├─ Escalamiento y notificaciones
├─ Reportes y dashboard
└─ Testing completo

SEMANA 3 (20-26 Enero):
├─ Go-Live en producción
├─ Monitoreo intensivo
└─ Ajustes según feedback

SEMANA 4 (27 Enero - 2 Feb):
└─ Optimización y capacitación
```

---

## 📞 CONTACTO

**Para aprobar o hacer ajustes a esta propuesta:**

- **Email:** german@korvance.com
- **WhatsApp:** [Tu número]
- **Reunión:** Podemos coordinar una call para revisar juntos

---

## 📎 ANEXOS

### A. Mockups de Mensajes (Versión Final)

Ver archivo adjunto: `MENSAJES_WHATSAPP_FINAL.md`

### B. Diagramas de Flujo Detallados

Ver archivo adjunto: `DIAGRAMAS_FLUJO_STALE_OPP.pdf`

### C. Configuración Técnica GHL

Ver archivo adjunto: `CONFIG_TECNICA_GHL.md`

---

**Versión:** 1.0  
**Fecha:** 4 de Enero 2026  
**Estado:** PENDIENTE DE APROBACIÓN ⏳

---

## ✍️ APROBACIÓN

```
CLIENTE: Juejati Brokers
APROBADO POR: _______________________
FECHA: _______________________
FIRMA: _______________________

CAMBIOS SOLICITADOS:
_________________________________________________
_________________________________________________
_________________________________________________

FECHA DE INICIO ACORDADA: _______________________
```
