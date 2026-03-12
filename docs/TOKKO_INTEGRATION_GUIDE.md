# 🔗 INTEGRACIÓN TOKKO + GHL + N8N: PROPIEDADES DINÁMICAS
**Para:** Sistema Stale Opportunities  
**Objetivo:** Enviar propiedades personalizadas desde Tokko en mensajes de reactivación

---

## 🎯 ARQUITECTURA DE LA SOLUCIÓN

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO COMPLETO                            │
└─────────────────────────────────────────────────────────────┘

[GHL WORKFLOW SR01]
    │
    │ 1. Trigger: Stale Opportunity detectado
    │
    ▼
[IF Necesita propiedades dinámicas]
    │
    │ 2. Llamar webhook n8n
    │    Enviar datos del contacto:
    │    - tipo_propiedad
    │    - zona
    │    - presupuesto
    │    - ambientes
    │    - contact_id
    │
    ▼
[N8N WORKFLOW]
    │
    │ 3. Recibir datos del contacto
    │
    ▼
    │ 4. Buscar en Tokko API
    │    GET /properties
    │    Filtros:
    │    - operation_type: venta/alquiler
    │    - property_type: departamento/casa
    │    - location: zona
    │    - price_from/to: presupuesto ±20%
    │    - bedrooms: ambientes
    │
    ▼
    │ 5. Filtrar y ordenar resultados
    │    - Ordenar por: mejor match de precio
    │    - Límite: Top 3 propiedades
    │
    ▼
    │ 6. Formatear propiedades
    │    Para cada propiedad:
    │    📍 Título: {title}
    │    💰 USD {price}
    │    📏 {surface} m²
    │    🛏️ {bedrooms} amb
    │    🔗 {short_url}
    │
    ▼
    │ 7. Actualizar custom field en GHL
    │    Campo: "Última Propiedad Vista"
    │    Valor: Lista de propiedades formateada
    │
    ▼
    │ 8. Retornar a GHL
    │    Response: {
    │      "properties_text": "...",
    │      "properties_count": 3,
    │      "status": "success"
    │    }
    │
    ▼
[GHL WORKFLOW SR01] (Continúa)
    │
    │ 9. Usar {{custom_field.ultima_propiedad_vista}}
    │    en el mensaje WhatsApp
    │
    ▼
[ENVIAR WHATSAPP]
```

---

## 📋 IMPLEMENTACIÓN N8N

### **WORKFLOW N8N: "Tokko - Propiedades para Reactivación"**

#### **NODE 1: Webhook (Trigger)**

```javascript
// Configuración del Webhook
Method: POST
Path: /stale-opp-properties
Authentication: Header Auth

// Expected Input
{
  "contact_id": "xxx",
  "tipo_propiedad": "Departamento",
  "zona": "Palermo",
  "presupuesto": 300000,
  "ambientes": "2",
  "operacion": "Venta"
}
```

---

#### **NODE 2: Set Variables**

```javascript
// Mapear datos del contacto
const tipoPropiedad = $json.tipo_propiedad || 'Departamento';
const zona = $json.zona || '';
const presupuesto = parseInt($json.presupuesto) || 250000;
const ambientes = parseInt($json.ambientes) || 2;
const operacion = $json.operacion || 'Venta';

// Calcular rango de presupuesto (±20%)
const precioMin = Math.floor(presupuesto * 0.8);
const precioMax = Math.ceil(presupuesto * 1.2);

return {
  contactId: $json.contact_id,
  tipoPropiedad: tipoPropiedad,
  zona: zona,
  precioMin: precioMin,
  precioMax: precioMax,
  ambientes: ambientes,
  operacion: operacion === 'Alquiler' ? 2 : 1 // Tokko: 1=venta, 2=alquiler
};
```

---

#### **NODE 3: HTTP Request - Tokko API**

```javascript
// Configuración del HTTP Request
Method: GET
URL: https://tokkobroker.com/api/v1/property/

// Headers
{
  "Authorization": "Token {{$env.TOKKO_API_KEY}}"
}

// Query Parameters
{
  "format": "json",
  "operation_types": "{{$node["Set Variables"].json.operacion}}",
  "property_types": "{{mapTipoPropiedad($node["Set Variables"].json.tipoPropiedad)}}",
  "price_from": "{{$node["Set Variables"].json.precioMin}}",
  "price_to": "{{$node["Set Variables"].json.precioMax}}",
  "current_localization_type": "division",
  "current_localization_id": "{{mapZona($node["Set Variables"].json.zona)}}",
  "limit": 10,
  "offset": 0,
  "ordering": "-price"
}
```

**Función auxiliar para mapear tipo de propiedad:**
```javascript
// En Function node antes de HTTP Request
function mapTipoPropiedad(tipo) {
  const map = {
    'Departamento': 1,
    'Casa': 2,
    'Local Comercial': 10,
    'Terreno': 4
  };
  return map[tipo] || 1;
}

function mapZona(zona) {
  // Mapear nombres de zonas a IDs de Tokko
  const zonas = {
    'Palermo': 123,
    'Recoleta': 124,
    'Belgrano': 125,
    // ... resto de zonas
  };
  return zonas[zona] || null;
}

return {
  tipo_id: mapTipoPropiedad($json.tipoPropiedad),
  zona_id: mapZona($json.zona)
};
```

---

#### **NODE 4: Function - Filtrar y Formatear**

```javascript
// Obtener propiedades de la respuesta de Tokko
const propiedades = $json.objects || [];

// Filtrar por ambientes si se especificó
let filtered = propiedades;
if ($node["Set Variables"].json.ambientes > 0) {
  filtered = propiedades.filter(prop => 
    prop.suite_amount >= $node["Set Variables"].json.ambientes - 1 &&
    prop.suite_amount <= $node["Set Variables"].json.ambientes + 1
  );
}

// Tomar top 3
const top3 = filtered.slice(0, 3);

// Formatear para WhatsApp
const propiedadesTexto = top3.map((prop, index) => {
  const titulo = prop.publication_title || prop.address;
  const precio = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(prop.price);
  
  const superficie = prop.total_surface || prop.roofed_surface || 'N/A';
  const ambientes = prop.suite_amount || 'N/A';
  const ubicacion = prop.location?.short_location || prop.address;
  
  // Crear short URL (puedes usar bit.ly API o similar)
  const url = `https://juejati.com.ar/propiedad/${prop.id}`;
  
  return `📍 Opción ${index + 1}: ${titulo}
💰 ${precio}
📏 ${superficie} m²
🛏️ ${ambientes} amb
📌 ${ubicacion}
🔗 ${url}`;
}).join('\n\n');

return {
  properties_text: propiedadesTexto,
  properties_count: top3.length,
  properties_array: top3.map(p => ({
    id: p.id,
    title: p.publication_title,
    price: p.price,
    url: `https://juejati.com.ar/propiedad/${p.id}`
  }))
};
```

---

#### **NODE 5: GHL - Update Contact Custom Field**

```javascript
// HTTP Request a GHL API
Method: PUT
URL: https://services.leadconnectorhq.com/contacts/{{$node["Webhook"].json.contact_id}}

// Headers
{
  "Authorization": "Bearer {{$env.GHL_API_KEY}}",
  "Version": "2021-07-28",
  "Content-Type": "application/json"
}

// Body
{
  "customFields": [
    {
      "id": "SIxdiv7ssbhAzMAyIziu", // ID de "Última Propiedad Vista"
      "field_value": "{{$node["Function"].json.properties_text}}"
    }
  ]
}
```

---

#### **NODE 6: Respond to Webhook**

```javascript
// Response a GHL
return {
  status: 'success',
  properties_count: $node["Function"].json.properties_count,
  properties_text: $node["Function"].json.properties_text,
  message: 'Propiedades actualizadas en contacto'
};
```

---

## ⚙️ CONFIGURACIÓN EN GHL WORKFLOW (SR01)

### **Modificación del Mensaje 1:**

Antes del mensaje, agregar estas acciones:

#### **ACCIÓN A: Call Webhook n8n**

```
Action: HTTP Request / Custom Webhook
Method: POST
URL: https://tu-n8n.korvance.com/webhook/stale-opp-properties

Headers:
Authorization: Bearer tu_webhook_token

Body (JSON):
{
  "contact_id": "{{contact.id}}",
  "tipo_propiedad": "{{contact.tipo_de_propiedad_2}}",
  "zona": "{{contact.zona}}",
  "presupuesto": "{{contact.presupuesto_ia}}",
  "ambientes": "{{contact.ambientes}}",
  "operacion": "{{contact.intencion}}"
}

Store Response As: tokko_properties
```

#### **ACCIÓN B: Wait 3 seconds**
```
Para dar tiempo a que n8n procese y actualice el campo
```

#### **ACCIÓN C: Refresh Contact Data**
```
Action: Update Contact
(Esto fuerza a GHL a recargar los custom fields)
```

#### **ACCIÓN D: Send WhatsApp Message**

```
Mensaje (usando el custom field actualizado):

"Hola {{contact.first_name}}! 👋

Soy el asistente de Juejati Brokers. Hace unos días estuvimos conversando sobre tu búsqueda de {{contact.tipo_de_propiedad_2}} en {{contact.zona}}.

¿Seguís buscando? Tengo propiedades nuevas que podrían interesarte 🏡

{{contact.ultima_propiedad_vista}}

¿Alguna te llama la atención?"
```

---

## 🔄 OPCIÓN 2: VERSIÓN SIMPLIFICADA (Sin n8n en tiempo real)

Si querés algo más simple para empezar:

### **Actualización diaria de propiedades:**

```
N8N Workflow (Scheduled - Daily @ 7 AM)
    │
    ▼
Para cada contacto con tag "oportunidad estancada 7 dias":
    │
    ├─ Buscar propiedades en Tokko
    ├─ Formatear texto
    └─ Actualizar custom field "Última Propiedad Vista"
    
Luego, cuando GHL envíe el mensaje:
    │
    └─ Usa el custom field ya pre-cargado
```

**Ventajas:**
- ✅ Más simple
- ✅ No requiere webhook en tiempo real
- ✅ Propiedades siempre actualizadas cada mañana

**Desventajas:**
- ❌ Propiedades no son en tiempo real (se actualizan 1x día)
- ❌ Puede enviar propiedades que ya vio

---

## 🔄 OPCIÓN 3: TEMPLATE ESTÁTICO (Más simple aún)

Para MVP rápido:

```
Mensaje sin Tokko API (por ahora):

"Hola {{contact.first_name}}! 👋

Soy el asistente de Juejati Brokers. Hace unos días estuvimos conversando sobre tu búsqueda de {{contact.tipo_de_propiedad_2}} en {{contact.zona}}.

¿Seguís buscando? Tenemos propiedades nuevas que podrían interesarte 🏡

Podés ver todas nuestras opciones actualizadas acá:
🔗 https://juejati.com.ar/buscar?zona={{contact.zona}}&tipo={{contact.tipo_de_propiedad_2}}&precio={{contact.presupuesto_ia}}

¿Querés que te ayude a encontrar algo específico?"
```

**Ventajas:**
- ✅ Super simple de implementar
- ✅ No requiere integración adicional
- ✅ Link dinámico con filtros del lead

**Desventajas:**
- ❌ No muestra propiedades específicas en WhatsApp
- ❌ Requiere que el lead haga clic en el link

---

## 🎯 MI RECOMENDACIÓN

### **Para MVP (Go-Live rápido):**
👉 **OPCIÓN 3** - Template estático con link dinámico

### **Para optimización (Semana 2-3):**
👉 **OPCIÓN 2** - n8n actualiza propiedades diariamente

### **Para versión final (Mes 2):**
👉 **OPCIÓN 1** - Integración en tiempo real con webhook

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN (Opción 1)

```
N8N SETUP:
☐ Crear workflow "Tokko - Propiedades Reactivación"
☐ Configurar webhook trigger
☐ Obtener API key de Tokko
☐ Configurar HTTP Request a Tokko API
☐ Crear función de filtrado y formato
☐ Configurar actualización de GHL custom field
☐ Testear con datos de prueba
☐ Obtener URL del webhook

GHL SETUP:
☐ Agregar acción "HTTP Request" antes del mensaje
☐ Configurar llamada a webhook n8n
☐ Agregar wait de 3 segundos
☐ Modificar mensaje para usar custom field
☐ Testear flujo completo

TESTING:
☐ Crear contacto de prueba con criterios
☐ Activar trigger manualmente
☐ Verificar llamada a n8n
☐ Verificar respuesta de Tokko
☐ Verificar actualización de custom field
☐ Verificar mensaje con propiedades
```

---

## 🚀 CÓDIGO COMPLETO N8N WORKFLOW (JSON)

¿Querés que te genere el JSON completo del workflow n8n para que lo importes directamente?

