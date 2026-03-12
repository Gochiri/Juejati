# 🗺️ Workflow GET_ZONA - Versión Mejorada

## 📋 Cambios Principales

### 1. ✅ Orden de Nodos Corregido

**ANTES (Incorrecto):**
```
Trigger → Code → HTTP Request ❌
```

**AHORA (Correcto):**
```
Trigger → HTTP Request → Code ✅
```

### 2. 🔧 URL del HTTP Request Corregida

**ANTES:**
```javascript
{{ $json.belgrano }}  // ❌ Variable que no existe
```

**AHORA:**
```javascript
{{ $json.queryzona }}  // ✅ Lee el input del trigger
```

---

## 🎯 Mejoras en la Lógica de Filtrado

### Sistema de Prioridades (5 niveles)

El código ahora busca la zona en este orden:

#### ✅ **Prioridad 1: Coincidencia Exacta + División**
```javascript
// Busca: nombre exacto (case-insensitive) + type="division"
// Ejemplo: "belgrano" encuentra "Belgrano" (division)
```

#### ✅ **Prioridad 2: Coincidencia Exacta (Cualquier Tipo)**
```javascript
// Si no hay division, busca nombre exacto de cualquier tipo
// Ejemplo: "belgrano" encuentra "Belgrano" (locality)
```

#### ⚠️ **Prioridad 3: Primera División Disponible**
```javascript
// Si no hay match exacto, toma la primera zona tipo "division"
// Útil cuando hay variaciones en el nombre
```

#### ⚠️ **Prioridad 4: Coincidencia Parcial en División**
```javascript
// Busca si el query está contenido en alguna division
// Ejemplo: "bel" puede encontrar "Belgrano"
```

#### ⚠️ **Prioridad 5: Primer Resultado (Fallback)**
```javascript
// Como último recurso, toma el primer resultado
// Garantiza que siempre hay un resultado si la API responde
```

---

## 📊 Output Mejorado

### Estructura del JSON de salida:

```json
{
  // Datos principales
  "zona_id": 1234,
  "zona_name": "Belgrano",
  "zona_type": "division",
  
  // Metadata útil
  "query_original": "belgrano",
  "metodo_seleccion": "coincidencia_exacta_division",
  "total_resultados": 5,
  
  // Info adicional
  "zona_parent": "Capital Federal",
  "zona_full_location": "Belgrano, Capital Federal, Argentina",
  
  // Para debugging
  "todas_las_zonas": [
    {"id": 1234, "name": "Belgrano", "type": "division"},
    {"id": 1235, "name": "Belgrano C", "type": "division"},
    // ... más resultados
  ],
  
  // Indicador de éxito
  "success": true
}
```

---

## 🔍 Logging Detallado

### Logs en Consola

El código ahora muestra información completa:

```
═══════════════════════════════════════════════════════
🗺️  GET_ZONA - BÚSQUEDA DE ZONA
═══════════════════════════════════════════════════════
📍 Query original: Belgrano
📊 Resultados encontrados: 5

🔍 Todos los resultados:
  1. [division] Belgrano (ID: 1234)
     └─ Parent: Capital Federal
  2. [division] Belgrano C (ID: 1235)
     └─ Parent: Capital Federal
  3. [locality] Belgrano (ID: 5678)
  
✅ Método 1: Coincidencia exacta + division

🎯 Zona seleccionada:
   ID: 1234
   Nombre: Belgrano
   Tipo: division
   Parent: Capital Federal
   Método: coincidencia_exacta_division
═══════════════════════════════════════════════════════
```

---

## 🛡️ Validaciones Agregadas

### 1. Validación de Estructura del API
```javascript
if (!responseData.objects) {
  // Maneja respuestas inesperadas del API
  return {
    zona_id: null,
    error: 'Respuesta del API sin campo objects',
    raw_response: responseData
  };
}
```

### 2. Normalización de Texto
```javascript
const queryLower = queryzona.toLowerCase().trim();
// Maneja mayúsculas, espacios extras, etc.
```

### 3. Fallback en Todos los Niveles
```javascript
// Garantiza que siempre hay un resultado válido
// o un null explícito con información del error
```

---

## 🚀 Cómo Usar

### Importar el Workflow

1. Copia el contenido de `workflow_get_zona_mejorado.json`
2. En n8n: Menu → Import from File/URL
3. Pega el JSON y guarda

### Probar el Workflow

```javascript
// Input de prueba
{
  "queryzona": "Belgrano"
}

// Otros ejemplos para probar:
{
  "queryzona": "palermo"      // Minúsculas
}
{
  "queryzona": " Recoleta "   // Con espacios
}
{
  "queryzona": "Villa Urquiza"
}
```

---

## 📈 Ventajas de Esta Versión

| Aspecto | Versión Anterior | Versión Mejorada |
|---------|-----------------|------------------|
| **Orden de ejecución** | ❌ Incorrecto | ✅ Correcto |
| **Filtrado** | Simple (1 nivel) | Inteligente (5 niveles) |
| **Coincidencias** | Solo tipo "division" | Exacta, parcial, fallback |
| **Logging** | Básico | Detallado y estructurado |
| **Manejo errores** | Sin validación | Validación completa |
| **Output** | 4 campos | 11 campos + metadata |
| **Debug** | Difícil | Lista de todas las zonas |

---

## 🔧 Configuración Adicional

### Timeout del HTTP Request

El timeout está configurado en 10 segundos:

```json
"options": {
  "timeout": 10000
}
```

Ajusta según tu conexión y necesidades.

### API Key de Tokko

La API key está hardcodeada en la URL. Para mayor seguridad, considera:

1. Usar una variable de entorno
2. Almacenarla en n8n credentials
3. Usar un nodo Set antes del HTTP Request

---

## 🐛 Troubleshooting

### No encuentra la zona esperada

**Revisa el log de "Todos los resultados"** para ver qué devuelve el API.

### Error de "objects" no existe

El API cambió su estructura. Revisa `raw_response` en el output para ver qué devuelve.

### Zona incorrecta seleccionada

Revisa el campo `metodo_seleccion` para entender qué prioridad se usó.

---

## 📝 Próximas Mejoras Sugeridas

1. **Cache de resultados** - Guardar búsquedas recientes
2. **Sinónimos** - Manejar "Bs As" → "Buenos Aires"
3. **Corrección de typos** - Distancia de Levenshtein
4. **Geolocalización** - Coordenadas de la zona
5. **Validación previa** - Verificar que queryzona no esté vacío

---

## 📞 Soporte

Si tienes dudas sobre este workflow, revisa:
- Los logs en la consola de n8n
- El campo `todas_las_zonas` en el output
- La documentación de la API de Tokko

