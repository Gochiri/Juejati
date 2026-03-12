# [VIS] 002 – Visita Programada (V1) - CORREGIDO CON LOCK

**Versión:** 1.1 (con lock anti-loop implementado correctamente)
**Fecha:** 2026-01-06
**Cliente:** Juejati Brokers

---

## 🎯 OBJETIVO

Cuando `Estado Visita` cambia a "Visita Programa", el sistema:
- Mueve la oportunidad a stage "Visita Programada"
- Registra el evento en Control Operativo
- Agrega tag de tracking
- Notifica internamente
- Crea nota de confirmación
- **Previene loops usando lock operativo**

---

## 📋 ESTRUCTURA DEL WORKFLOW

### **TRIGGER**

```
Tipo: Opportunity Changed
Filtros: Ninguno
```

---

### **BLOQUE 1: Guard - Verificar Lock**

**Tipo de nodo:** IF/ELSE (Condition)

**Nombre:** `Guard: Verificar Lock`

**Condición:**
```
IF op_lock does NOT include "Si"
```

**Branches:**
- **Branch TRUE (tiene lock):** → END
- **Branch None (no tiene lock):** → Continúa a Bloque 2

**💡 Por qué:**
Si el workflow ya está corriendo (lock = "Si"), termina inmediatamente para evitar ejecuciones duplicadas.

---

### **BLOQUE 2: Verificar Estado de Visita**

**Tipo de nodo:** IF/ELSE (Condition)

**Nombre:** `Verificar Estado de Visita`

**Condición:**
```
IF Estado Visita is not empty
```

**Branches:**
- **Branch TRUE (tiene valor):** → Continúa a Bloque 3
- **Branch None (vacío):** → END

**💡 Por qué:**
Solo procesa si el campo tiene algún valor seleccionado.

---

### **BLOQUE 3: Router por Estado**

**Tipo de nodo:** IF/ELSE (Condition)

**Nombre:** `Router: ¿Es Visita Programada?`

**Condición:**
```
IF Estado Visita is "Visita Programa"
```

**Branches:**
- **Branch TRUE (es Programada):** → Continúa a Bloque 4
- **Branch None (otro estado):** → END

**💡 Por qué:**
Este workflow solo maneja el estado "Visita Programa". Los otros estados (Realizada/Suspendida) tendrán sus propios workflows.

---

### **BLOQUE 4: 🔒 ACTIVAR LOCK**

**Tipo de nodo:** Update Opportunity

**Nombre:** `🔒 Activar Lock Anti-Loop`

**Campos a actualizar:**
```
op_lock = "Si"
```

**💡 CRÍTICO:**
Este bloque DEBE estar ANTES de cualquier otra acción que modifique la oportunidad.

Si el workflow se vuelve a disparar mientras está ejecutando, el Bloque 1 lo detectará y terminará inmediatamente.

---

### **BLOQUE 5: Update Opportunity - Datos Principales**

**Tipo de nodo:** Update Opportunity

**Nombre:** `Update: Pipeline, Stage y Control Operativo`

**Campos a actualizar:**

```
Pipeline: 01 - Compradores - Seguimiento IA
Pipeline Stage: Visita Programada
op_ultimo_evento: Visita programada
op_ultimo_workflow: [VIS] 002 – Visita Programada (V1)
op_fecha_ultimo_evento: {{right_now.little_endian_dmy}}
```

**Configuración adicional:**
```
Duplicate opportunity: Disabled
```

---

### **BLOQUE 6: Add Tag**

**Tipo de nodo:** Add/Remove Tag

**Nombre:** `Add Tag: visita_programada`

**Acción:**
```
ADD TAG
Tag: visita_programada
```

**💡 Nota:**
Si querés migrar a nomenclatura V1 pura, el tag podría ser `vis:programada` o `visita:programada`, pero por ahora dejamos `visita_programada` por compatibilidad.

---

### **BLOQUE 7: Internal Notification**

**Tipo de nodo:** Internal Notification

**Nombre:** `Notificación: Visita Programada`

**Destinatario:**
```
Assigned User (o User específico según tu configuración)
```

**Mensaje:**
```
🏡 Visita PROGRAMADA

Lead: {{contact.first_name}} {{contact.last_name}}
Propiedad: {{opportunity.op_prop_titulo}}
Ubicación: {{opportunity.op_prop_ubicacion}}

Estado: Visita Programa
Etapa: Visita Programada

⚠️ Coordiná los detalles de la visita.
```

---

### **BLOQUE 8: Create Note**

**Tipo de nodo:** Create Note

**Nombre:** `Nota: Confirmación Visita`

**Contenido:**
```
📋 VISITA PROGRAMADA

Estado cambiado a: Visita Programa
Fecha/Hora: {{right_now.little_endian_dmy}} {{right_now.time_24h}}

Workflow: [VIS] 002 – Visita Programada (V1)
Acción: Movido a stage "Visita Programada" y notificado a asesor.

Próximos pasos:
- Confirmar fecha/hora con el lead
- Actualizar campo "visita_fecha_hora"
- Coordinar punto de encuentro
```

**Tipo de nota:**
```
Opportunity Note
```

---

### **BLOQUE 9: 🔓 DESACTIVAR LOCK**

**Tipo de nodo:** Update Opportunity

**Nombre:** `🔓 Desactivar Lock`

**Campos a actualizar:**
```
op_lock = "No"
```

**💡 CRÍTICO:**
Este bloque DEBE ser el último del workflow, después de todas las acciones.

Una vez que el lock se desactiva, el workflow puede volver a ejecutarse normalmente para el próximo evento.

---

## 📊 DIAGRAMA VISUAL

```
┌─────────────────────────────────────────┐
│ TRIGGER: Opportunity Changed            │
└───────────────┬─────────────────────────┘
                │
        ┌───────▼────────┐
        │ BLOQUE 1       │
        │ ¿op_lock = Si? │
        └───┬────────┬───┘
            │        │
          [SI]     [NO]
            │        │
          [END]      │
                     │
             ┌───────▼────────┐
             │ BLOQUE 2       │
             │ ¿Estado lleno? │
             └───┬────────┬───┘
                 │        │
               [NO]     [SI]
                 │        │
               [END]      │
                          │
                  ┌───────▼────────────┐
                  │ BLOQUE 3           │
                  │ ¿Es "Programada"?  │
                  └───┬────────────┬───┘
                      │            │
                    [NO]         [SI]
                      │            │
                    [END]          │
                                   │
                        ┌──────────▼────────────┐
                        │ BLOQUE 4              │
                        │ 🔒 ACTIVAR LOCK       │
                        │ op_lock = "Si"        │
                        └──────────┬────────────┘
                                   │
                        ┌──────────▼────────────┐
                        │ BLOQUE 5              │
                        │ Update Opportunity    │
                        │ (Pipeline, Stage,     │
                        │  Control Operativo)   │
                        └──────────┬────────────┘
                                   │
                        ┌──────────▼────────────┐
                        │ BLOQUE 6              │
                        │ Add Tag               │
                        │ visita_programada     │
                        └──────────┬────────────┘
                                   │
                        ┌──────────▼────────────┐
                        │ BLOQUE 7              │
                        │ Internal Notification │
                        └──────────┬────────────┘
                                   │
                        ┌──────────▼────────────┐
                        │ BLOQUE 8              │
                        │ Create Note           │
                        │ Confirmación Visita   │
                        └──────────┬────────────┘
                                   │
                        ┌──────────▼────────────┐
                        │ BLOQUE 9              │
                        │ 🔓 DESACTIVAR LOCK    │
                        │ op_lock = "No"        │
                        └──────────┬────────────┘
                                   │
                                 [END]
```

---

## ⚠️ CAMBIOS RESPECTO A LA VERSIÓN ANTERIOR

### **ANTES (problema):**
```
1. Verificar lock
2. Verificar estado
3. Router
4. Update Opportunity (con op_lock = "No" al final)
5. Add Tag
6. Notification
7. Note
```

**Problema:** El lock nunca se activaba, solo se desactivaba al final.

### **AHORA (correcto):**
```
1. Verificar lock
2. Verificar estado
3. Router
4. 🔒 ACTIVAR LOCK (op_lock = "Si")
5. Update Opportunity
6. Add Tag
7. Notification
8. Note
9. 🔓 DESACTIVAR LOCK (op_lock = "No")
```

**Beneficio:** El workflow está protegido contra ejecuciones duplicadas.

---

## 🧪 TESTING

### **Test 1: Flujo normal**

1. Crear una oportunidad de prueba
2. Cambiar `Estado Visita` a "Visita Programa"
3. Verificar que:
   - Se mueve a stage "Visita Programada" ✅
   - Se agrega tag `visita_programada` ✅
   - Se recibe notificación interna ✅
   - Se crea nota ✅
   - `op_lock` queda en "No" al final ✅

### **Test 2: Anti-loop**

1. Crear oportunidad de prueba
2. Manualmente setear `op_lock = "Si"`
3. Cambiar `Estado Visita` a "Visita Programa"
4. Verificar que:
   - El workflow NO ejecuta acciones ✅
   - Termina inmediatamente en el Bloque 1 ✅

### **Test 3: Estados diferentes**

1. Cambiar `Estado Visita` a "Visita Realizada"
2. Verificar que:
   - El workflow NO ejecuta acciones ✅
   - Termina en el Bloque 3 (router) ✅

---

## 📝 NOTAS DE IMPLEMENTACIÓN

### **Orden de creación en GHL:**

1. Crear el workflow desde cero con el trigger
2. Agregar los bloques en este orden exacto:
   - BLOQUE 1: Condition (op_lock)
   - BLOQUE 2: Condition (Estado Visita not empty)
   - BLOQUE 3: Condition (Estado = Programada)
   - BLOQUE 4: Update Opportunity (lock = "Si")
   - BLOQUE 5: Update Opportunity (datos principales)
   - BLOQUE 6: Add Tag
   - BLOQUE 7: Internal Notification
   - BLOQUE 8: Create Note
   - BLOQUE 9: Update Opportunity (lock = "No")

### **Conexión de branches:**

- Bloque 1 Branch TRUE → END
- Bloque 1 Branch None → Bloque 2
- Bloque 2 Branch TRUE → Bloque 3
- Bloque 2 Branch None → END
- Bloque 3 Branch TRUE → Bloque 4
- Bloque 3 Branch None → END
- Bloques 4-9 → secuencia lineal

---

## 🔄 WORKFLOWS RELACIONADOS

Este workflow debe complementarse con:

- `[VIS] 001 – Preferencia Día` (ya creado ✅)
- `[VIS] 003 – Visita Realizada (V1)` (pendiente)
- `[VIS] 004 – Visita Suspendida (V1)` (pendiente)

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

```
☐ Workflow creado con nombre correcto
☐ Trigger configurado (Opportunity Changed, sin filtros)
☐ Bloque 1: Condition op_lock verificado
☐ Bloque 2: Condition Estado Visita verificado
☐ Bloque 3: Router por estado verificado
☐ Bloque 4: Update op_lock = "Si" agregado
☐ Bloque 5: Update con todos los campos de Control Operativo
☐ Bloque 6: Add Tag configurado
☐ Bloque 7: Internal Notification configurada
☐ Bloque 8: Create Note configurada
☐ Bloque 9: Update op_lock = "No" agregado
☐ Branches conectados correctamente
☐ Test 1 completado (flujo normal)
☐ Test 2 completado (anti-loop)
☐ Test 3 completado (otros estados)
☐ Workflow publicado
```

---

## 📊 CAMPOS UTILIZADOS

### **Opportunity Fields:**

| Campo | Tipo | Uso |
|-------|------|-----|
| `Estado Visita` | Dropdown | Trigger y router |
| `op_lock` | Dropdown | Anti-loop |
| `op_ultimo_evento` | Dropdown | Auditoría |
| `op_ultimo_workflow` | Text | Auditoría |
| `op_fecha_ultimo_evento` | Date | Timestamp |
| `Pipeline` | System | Movimiento |
| `Pipeline Stage` | System | Movimiento |
| `op_prop_titulo` | Text | Info en notificación |
| `op_prop_ubicacion` | Text | Info en notificación |

### **Contact Fields:**

| Campo | Uso |
|-------|-----|
| `first_name` | Notificación |
| `last_name` | Notificación |

### **Tags:**

| Tag | Uso |
|-----|-----|
| `visita_programada` | Tracking |

---

**Fin del documento**
**Versión 1.1 - 2026-01-06**
