# 🔄 SR01: SECUENCIA DE REACTIVACIÓN - NODOS GHL NATIVOS

**Nombre del Workflow:** `[AI] Reactivación Stale Opportunities - WhatsApp`

---

## 🎯 TRIGGER

**Tipo:** Stale Opportunities (nativo GHL)

**Configuración del Trigger:**
```
Workflow Trigger Name: "Detectar Estancados 7 días"

Filtros:
├─ Duration in days: 7
├─ In pipeline: "01 - Compradores - Seguimiento IA"
│  Pipeline ID: tDFS4eZP5Rliei09iGIK
└─ Pipeline stage: "En seguimiento"
   Stage ID: 6a4a44b3-2b0c-4aad-a00d-f62276fc4e0d
```

**Click "Save Trigger"**

---

## 📊 SECUENCIA DE ACCIONES

### **ACCIÓN 1: IF/ELSE - Verificar Tags de Exclusión**

**Tipo de nodo:** IF/ELSE

**Configuración:**
```
Nombre: "Verificar Tags de Exclusión"

Condiciones (ANY - OR):
├─ Contact → Tags → Contains → "detener ia"
├─ Contact → Tags → Contains → "detener_ia"  
├─ Contact → Tags → Contains → "stop bot"
└─ Contact → Tags → Contains → "[whatsapp] - contact is not registered"

Branch TRUE (Si tiene alguno):
└─ END workflow (no continuar)

Branch FALSE (Si NO tiene ninguno):
└─ Continuar a siguiente acción
```

---

### **ACCIÓN 2: IF/ELSE - Verificar WhatsApp Válido**

**Tipo de nodo:** IF/ELSE

**Configuración:**
```
Nombre: "Verificar WhatsApp Válido"

Condición:
└─ Contact → Phone → Is Empty

Branch TRUE (Si está vacío):
└─ END workflow

Branch FALSE (Si tiene teléfono):
└─ Continuar a siguiente acción
```

---

### **ACCIÓN 3: IF/ELSE - Verificar si Ya Está en Reactivación**

**Tipo de nodo:** IF/ELSE

**Configuración:**
```
Nombre: "Verificar Duplicados"

Condición:
└─ Contact → Tags → Contains → "oportunidad estancada 7 dias"

Branch TRUE (Ya tiene el tag):
└─ END workflow (evitar duplicados)

Branch FALSE (No tiene el tag):
└─ Continuar a siguiente acción
```

---

### **ACCIÓN 4: Add/Remove Tag - Marcar como Estancado**

**Tipo de nodo:** Add/Remove Tag

**Configuración:**
```
Action: ADD TAG
Tag: "oportunidad estancada 7 dias"
Tag ID: h77DAbGrkv1BS4ieCUD2
```

---

### **ACCIÓN 5: Update Contact - Actualizar Fecha**

**Tipo de nodo:** Update Contact

**Configuración:**
```
Contact Field: "Fecha Primer Contacto"
Field ID: nmjHXLuEaaidNamLXedw
Value: {{current_date}}
```

---

### **ACCIÓN 6: Create Note - Nota Interna**

**Tipo de nodo:** Create Note

**Configuración:**
```
Note Content:
"🤖 [STALE OPP] Lead detectado como estancado automáticamente por GHL.
Sin actividad desde hace 7 días.
Sistema iniciará secuencia de reactivación."

Note Type: Opportunity Note
```

---

### **ACCIÓN 7: Wait Until - Verificar Horario**

**Tipo de nodo:** Wait Until

**Configuración:**
```
Nombre: "Verificar Horario de Envío"

Wait Until:
├─ Time is between: 09:00 AM - 08:00 PM
└─ Days: Monday, Tuesday, Wednesday, Thursday, Friday

(Si es fuera de horario, espera hasta el próximo día hábil)
```

---

### **ACCIÓN 8: Send WhatsApp Message - MENSAJE 1**

**Tipo de nodo:** Send Message > WhatsApp

**Configuración:**
```
Message Name: "MENSAJE 1: Reactivación Inicial"

To: {{contact.phone}}

Message Body:
"Hola {{contact.first_name}}! 👋

Soy el asistente de Juejati Brokers. Hace unos días estuvimos conversando sobre tu búsqueda de {{contact.tipo_de_propiedad_2}} en {{contact.zona}}.

¿Seguís buscando? Tenemos propiedades nuevas que podrían interesarte 🏡

Te comparto algunas opciones que se ajustan a lo que me comentaste:

📍 [Aquí van las propiedades desde Tokko]

¿Alguna te llama la atención?"
```

**Custom Values (si usás variables dinámicas):**
- contact.first_name
- contact.tipo_de_propiedad_2
- contact.zona

---

### **ACCIÓN 9: Add/Remove Tag - Tag Búsqueda**

**Tipo de nodo:** Add/Remove Tag

**Configuración:**
```
Action: ADD TAG
Tag: "busqueda tokko"
Tag ID: WSF3lp2CWeD8DVuJ3osU
```

---

### **ACCIÓN 10: Wait/Delay - Esperar Respuesta (48h)**

**Tipo de nodo:** Wait/Delay

**Configuración:**
```
Nombre: "Esperar Respuesta Mensaje 1"

Wait For: 48 hours

Advanced Options:
☑ Continue if contact replies (termina el workflow si responde)
```

---

### **ACCIÓN 11: IF/ELSE - ¿Respondió al Mensaje 1?**

**Tipo de nodo:** IF/ELSE

**Configuración:**
```
Nombre: "DECISIÓN 1: ¿Respondió?"

Condición:
└─ Contact → Last Inbound Message → After Date → {{step_8_date}}
   (Fecha del paso 8 cuando se envió el mensaje)

Branch TRUE (SÍ respondió):
├─ Remove Tag: "oportunidad estancada 7 dias"
├─ Create Note: "✅ REACTIVADO - Respondió al mensaje 1
   Fecha: {{current_date}}
   Hora: {{current_time}}"
└─ END workflow

Branch FALSE (NO respondió):
└─ Continuar a siguiente acción (Mensaje 2)
```

---

### **ACCIÓN 12: Send WhatsApp Message - MENSAJE 2**

**Tipo de nodo:** Send Message > WhatsApp

**Configuración:**
```
Message Name: "MENSAJE 2: Follow-up"

To: {{contact.phone}}

Message Body:
"{{contact.first_name}}, quería seguir ayudándote con tu búsqueda 🔍

Vi que te interesan {{contact.tipo_de_propiedad_2}}s en zona {{contact.zona}}, con presupuesto aproximado de {{contact.presupuesto_ia}} USD.

Encontré estas opciones que coinciden:

📍 Opción 1: [Título]
💰 [Precio]
📏 [M2]
🔗 [Link]

¿Te gustaría más info de alguna? ¿O cambió algo en tu búsqueda?"
```

---

### **ACCIÓN 13: Create Note - Nota Mensaje 2**

**Tipo de nodo:** Create Note

**Configuración:**
```
Note Content:
"🤖 Mensaje 2 de reactivación enviado
Fecha: {{current_date}}
Sin respuesta al mensaje 1."
```

---

### **ACCIÓN 14: Wait/Delay - Esperar Respuesta (72h)**

**Tipo de nodo:** Wait/Delay

**Configuración:**
```
Nombre: "Esperar Respuesta Mensaje 2"

Wait For: 72 hours

Advanced Options:
☑ Continue if contact replies
```

---

### **ACCIÓN 15: IF/ELSE - ¿Respondió al Mensaje 2?**

**Tipo de nodo:** IF/ELSE

**Configuración:**
```
Nombre: "DECISIÓN 2: ¿Respondió?"

Condición:
└─ Contact → Last Inbound Message → After Date → {{step_12_date}}

Branch TRUE (SÍ respondió):
├─ Remove Tag: "oportunidad estancada 7 dias"
├─ Create Note: "✅ REACTIVADO - Respondió al mensaje 2
   Fecha: {{current_date}}"
└─ END workflow

Branch FALSE (NO respondió):
└─ Continuar a siguiente acción (Mensaje 3)
```

---

### **ACCIÓN 16: Send WhatsApp Message - MENSAJE 3**

**Tipo de nodo:** Send Message > WhatsApp

**Configuración:**
```
Message Name: "MENSAJE 3: Última Oportunidad"

To: {{contact.phone}}

Message Body:
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

---

### **ACCIÓN 17: Create Note - Nota Mensaje 3**

**Tipo de nodo:** Create Note

**Configuración:**
```
Note Content:
"🤖 Mensaje 3 enviado - Última oportunidad
Fecha: {{current_date}}
Sin respuesta a mensaje 1 y 2."
```

---

### **ACCIÓN 18: Wait/Delay - Esperar Respuesta Final (48h)**

**Tipo de nodo:** Wait/Delay

**Configuración:**
```
Nombre: "Esperar Respuesta Final"

Wait For: 48 hours

Advanced Options:
☑ Continue if contact replies
```

---

### **ACCIÓN 19: IF/ELSE - ¿Respondió al Mensaje 3?**

**Tipo de nodo:** IF/ELSE

**Configuración:**
```
Nombre: "DECISIÓN 3: ¿Respondió?"

Condición:
└─ Contact → Last Inbound Message → After Date → {{step_16_date}}

Branch TRUE (SÍ respondió):
├─ Remove Tag: "oportunidad estancada 7 dias"
├─ Create Note: "✅ REACTIVADO - Respondió al mensaje 3
   Fecha: {{current_date}}"
└─ END workflow

Branch FALSE (NO respondió):
└─ Continuar a ACCIÓN 20 (Trigger Handoff)
```

---

### **ACCIÓN 20: Trigger Workflow - Escalamiento a Humano**

**Tipo de nodo:** Trigger Workflow

**Configuración:**
```
Workflow to Trigger: "[HANDOFF] Escalamiento Stale a Agente"
(Este es el workflow SH01 que crearás después)

Pass Contact Data: YES
Pass Opportunity Data: YES

Note:
"No respondió a ninguno de los 3 mensajes automatizados.
Escalando a seguimiento manual humano."
```

---

## 🎯 DIAGRAMA VISUAL DEL FLUJO

```
┌──────────────────────────────────────────┐
│ TRIGGER: Stale Opportunities (7 días)   │
└─────────────────┬────────────────────────┘
                  │
       ┌──────────▼──────────┐
       │ IF: Tags Exclusión? │
       └──┬──────────────┬───┘
          │              │
        [SÍ]          [NO]
          │              │
        [END]            │
                         │
              ┌──────────▼──────────┐
              │ IF: WhatsApp válido?│
              └──┬──────────────┬───┘
                 │              │
               [NO]           [SÍ]
                 │              │
               [END]            │
                                │
                     ┌──────────▼──────────┐
                     │ IF: Ya en reactiv.? │
                     └──┬──────────────┬───┘
                        │              │
                      [SÍ]          [NO]
                        │              │
                      [END]            │
                                       │
                            ┌──────────▼──────────┐
                            │ Add Tag "estancado" │
                            │ Update Contact      │
                            │ Create Note         │
                            └──────────┬──────────┘
                                       │
                            ┌──────────▼──────────┐
                            │ Wait Until Horario  │
                            │ (9 AM - 8 PM)       │
                            └──────────┬──────────┘
                                       │
                            ┌──────────▼──────────┐
                            │ 💬 MENSAJE 1        │
                            │ Add Tag "busqueda"  │
                            └──────────┬──────────┘
                                       │
                            ┌──────────▼──────────┐
                            │ Wait 48h            │
                            │ (or until reply)    │
                            └──────────┬──────────┘
                                       │
                            ┌──────────▼──────────┐
                            │ IF: ¿Respondió?     │
                            └──┬──────────────┬───┘
                               │              │
                             [SÍ]          [NO]
                               │              │
                    ┌──────────▼─────┐        │
                    │ Remove Tag     │        │
                    │ Create Note    │        │
                    │ [END SUCCESS]  │        │
                    └────────────────┘        │
                                              │
                                   ┌──────────▼──────────┐
                                   │ 💬 MENSAJE 2        │
                                   │ Create Note         │
                                   └──────────┬──────────┘
                                              │
                                   ┌──────────▼──────────┐
                                   │ Wait 72h            │
                                   └──────────┬──────────┘
                                              │
                                   ┌──────────▼──────────┐
                                   │ IF: ¿Respondió?     │
                                   └──┬──────────────┬───┘
                                      │              │
                                    [SÍ]          [NO]
                                      │              │
                           ┌──────────▼─────┐        │
                           │ Remove Tag     │        │
                           │ [END SUCCESS]  │        │
                           └────────────────┘        │
                                                     │
                                          ┌──────────▼──────────┐
                                          │ 💬 MENSAJE 3        │
                                          │ Create Note         │
                                          └──────────┬──────────┘
                                                     │
                                          ┌──────────▼──────────┐
                                          │ Wait 48h            │
                                          └──────────┬──────────┘
                                                     │
                                          ┌──────────▼──────────┐
                                          │ IF: ¿Respondió?     │
                                          └──┬──────────────┬───┘
                                             │              │
                                           [SÍ]          [NO]
                                             │              │
                                  ┌──────────▼─────┐        │
                                  │ Remove Tag     │        │
                                  │ [END SUCCESS]  │        │
                                  └────────────────┘        │
                                                            │
                                                 ┌──────────▼──────────┐
                                                 │ Trigger Workflow    │
                                                 │ [SH01: HANDOFF]     │
                                                 └─────────────────────┘
```

---

## 📋 LISTA DE VARIABLES NECESARIAS

### **Custom Fields (Contact):**
- `contact.first_name` - Nombre del lead
- `contact.phone` - Teléfono WhatsApp
- `contact.tipo_de_propiedad_2` - Tipo de propiedad buscada
- `contact.zona` - Zona de búsqueda
- `contact.presupuesto_ia` - Presupuesto aproximado
- `contact.asesor` - Asesor asignado
- `contact.fecha_primer_contacto` - Fecha del primer contacto

### **Tags Necesarios:**
- `oportunidad estancada 7 dias` (ID: h77DAbGrkv1BS4ieCUD2)
- `busqueda tokko` (ID: WSF3lp2CWeD8DVuJ3osU)
- `detener ia` (ID: GxSwNeDfHCo3LIVQ0f7C)
- `detener_ia` (ID: R9w6ZQUlQ8RYhtByBzpz)
- `stop bot` (ID: e4leD0HHY7wQ77DuPVxO)
- `[whatsapp] - contact is not registered` (ID: slsgDt9ojsvpBL1JvW9L)

---

## ⏱️ TIMELINE DEL WORKFLOW

```
Día 0: Lead detectado → Mensaje 1 enviado
         ↓
Día 2: (48h después) → Mensaje 2 enviado
         ↓
Día 5: (72h después) → Mensaje 3 enviado
         ↓
Día 7: (48h después) → Si no respondió, trigger SH01 (Handoff)
```

**Total duración:** 7 días máximo si no hay respuesta

---

## ✅ CHECKLIST DE CONFIGURACIÓN

```
ANTES DE ACTIVAR:
☐ Verificar que el pipeline ID es correcto
☐ Verificar que el stage ID es correcto
☐ Verificar que todos los tags existen en GHL
☐ Verificar que todos los custom fields existen
☐ Configurar horarios de envío (9 AM - 8 PM)
☐ Testear con 1 lead de prueba
☐ Verificar que el workflow SH01 (Handoff) ya existe
☐ Verificar número de WhatsApp Business configurado
```

---

## 🚨 IMPORTANTE

Este workflow:
- ✅ Se activa automáticamente (trigger nativo GHL)
- ✅ Termina automáticamente si el lead responde
- ✅ Respeta horarios comerciales
- ✅ Evita duplicados
- ✅ Excluye leads con tags de exclusión
- ✅ Requiere que el workflow SH01 ya exista para el paso final

**Próximo paso:** Crear el workflow SH01 (Handoff) antes de activar SR01.
