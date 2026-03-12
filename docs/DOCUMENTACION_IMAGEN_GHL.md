# 📸 Agregar Imagen a Go High Level Custom Objects

## 🎯 Objetivo

Agregar el campo `imagen` (URL de la primera foto) al custom object "propiedades" en GHL para poder accederlo con:
```
{{ custom_objects.propiedades.imagen }}
```

---

## ✏️ Cambios Realizados

### 1️⃣ Nodo: "Split Properties to Individual Items1"

**Agregar función para extraer imagen:**

```javascript
// Nueva función agregada
const getPrimeraImagen = (photos) => {
  if (!photos || photos.length === 0) {
    return '';  // Retorna string vacío si no hay fotos
  }

  // Ordenar fotos por el campo 'order'
  const sortedPhotos = [...photos].sort((a, b) => (a.order || 0) - (b.order || 0));
  
  // Buscar imagen de portada (is_front_cover: true)
  const coverPhoto = sortedPhotos.find(p => p.is_front_cover === true);
  
  // Primera imagen (por orden o la de portada)
  const firstPhoto = coverPhoto || sortedPhotos[0];

  // Retornar la URL de la imagen
  return firstPhoto?.image || '';
};
```

**Agregar campo al transformedProperty:**

```javascript
const transformedProperty = {
  // ... todos los campos existentes ...
  
  // NUEVO CAMPO
  imagen: getPrimeraImagen(property.photos),
  
  // ... metadatos ...
};
```

---

### 2️⃣ Nodo: "Process Search Result1"

**Agregar campo imagen al ghlData:**

```javascript
const ghlData = {
  locationId: "WWrBqekGJCsCmSSvPzEf",
  propiedades: {
    "Tokko ID": propertyData.tokkoId,
    "Codigo": propertyData.codigo,
    // ... otros campos ...
    "Ficha Tokko": propertyData.linkWeb || '',
    
    // NUEVO CAMPO
    "imagen": propertyData.imagen || ''
  }
};
```

---

## 📊 Cómo Funciona

### Flujo de Datos:

```
1. Tokko API Request
   ↓
   Devuelve: property.photos = [...]
   
2. Split Properties
   ↓
   Extrae: getPrimeraImagen(property.photos)
   Crea: transformedProperty.imagen = "https://..."
   
3. Loop Over Properties
   ↓
   Pasa: propertyData.imagen
   
4. Process Search Result
   ↓
   Mapea: ghlData.propiedades.imagen = propertyData.imagen
   
5. Create/Update Property in GHL
   ↓
   Envía: { "propiedades": { "imagen": "https://..." } }
   
6. Go High Level
   ↓
   Guarda en Custom Object
   Accesible como: {{ custom_objects.propiedades.imagen }}
```

---

## 🔍 Lógica de Selección de Imagen

La función `getPrimeraImagen()` sigue esta prioridad:

```
1️⃣ Buscar foto con is_front_cover: true
   ↓ Si no existe
2️⃣ Tomar primera foto por order (0, 1, 2...)
   ↓ Si no existe
3️⃣ Tomar primera foto del array
   ↓ Si no hay fotos
4️⃣ Retornar string vacío ''
```

### Ejemplos:

#### Caso 1: Propiedad con portada definida
```javascript
photos: [
  { order: 2, is_front_cover: false, image: "foto3.jpg" },
  { order: 0, is_front_cover: false, image: "foto1.jpg" },
  { order: 1, is_front_cover: true,  image: "foto2.jpg" }  // ← Esta
]

Resultado: imagen = "foto2.jpg"
```

#### Caso 2: Propiedad sin portada
```javascript
photos: [
  { order: 2, is_front_cover: false, image: "foto3.jpg" },
  { order: 0, is_front_cover: false, image: "foto1.jpg" },  // ← Esta
  { order: 1, is_front_cover: false, image: "foto2.jpg" }
]

Resultado: imagen = "foto1.jpg"  // Por order: 0
```

#### Caso 3: Propiedad sin fotos
```javascript
photos: []

Resultado: imagen = ""  // String vacío
```

---

## 🎨 Uso en Go High Level

### En Emails/SMS:
```
Hola, mira esta propiedad:

Título: {{ custom_objects.propiedades.Titulo }}
Precio: {{ custom_objects.propiedades.Precio }}
Imagen: {{ custom_objects.propiedades.imagen }}
```

### En HTML:
```html
<img src="{{ custom_objects.propiedades.imagen }}" 
     alt="{{ custom_objects.propiedades.Titulo }}" />
```

### Verificar si tiene imagen:
```
{% if custom_objects.propiedades.imagen %}
  <img src="{{ custom_objects.propiedades.imagen }}" />
{% else %}
  <img src="https://via.placeholder.com/400x300?text=Sin+Imagen" />
{% endif %}
```

---

## 📝 Estructura del Campo en GHL

Según tu workflow, el campo debe configurarse así en GHL:

**Schema del Custom Object "propiedades":**

```json
{
  "imagen": {
    "type": "TEXT",  // o "URL" si GHL lo soporta
    "label": "Imagen",
    "description": "URL de la imagen principal de la propiedad"
  }
}
```

---

## 🔧 Testing

### Verificar en los Logs:

Después de ejecutar, deberías ver:

```
=== TOKKO PROPERTIES PROCESSING ===
Total properties found: 50
Prepared 50 properties for processing
Properties with images: 47  ← Nuevo log
```

Y en cada property:

```
=== PROCESSING PROPERTY 1/50 ===
Tokko ID: 12345
Search response total: 0
Action: create
Image: ✅ Yes  ← Nuevo log
```

### Verificar en el Output:

En el nodo "Split Properties", deberías ver:

```json
{
  "tokkoId": "12345",
  "titulo": "Departamento en Miraflores",
  "imagen": "https://static.tokkobroker.com/pictures/272...jpg",  // ← Nuevo campo
  // ... otros campos ...
}
```

En el nodo "Process Search Result":

```json
{
  "ghlData": {
    "propiedades": {
      "Tokko ID": "12345",
      "imagen": "https://static.tokkobroker.com/pictures/272...jpg",  // ← Aquí también
      // ... otros campos ...
    }
  }
}
```

---

## ⚠️ Consideraciones Importantes

### 1. Propiedades sin fotos

Si una propiedad no tiene fotos, el campo `imagen` será un **string vacío** `""`, no `null`.

Esto evita errores en GHL y puedes verificarlo fácilmente:

```javascript
if (propertyData.imagen) {
  // Tiene imagen
} else {
  // No tiene imagen
}
```

### 2. Tipo de imagen

El campo contiene la URL de **tamaño medio** (`image`), no el thumbnail ni la original.

Si necesitas otro tamaño, puedes cambiarlo en el código:

```javascript
// Para thumbnail (más liviano):
return firstPhoto?.thumb || '';

// Para original (alta resolución):
return firstPhoto?.original || '';
```

### 3. Campo en GHL

Asegúrate de que el campo "imagen" existe en tu Custom Object en GHL.

Si no existe, créalo manualmente primero:
1. GHL → Settings → Custom Objects
2. Selecciona "propiedades"
3. Add Field → Type: Text/URL
4. Name: "imagen"

---

## 📊 Estadísticas Esperadas

Basado en tu screenshot que mostraba 7 fotos por propiedad:

- **Con fotos:** ~95% de las propiedades
- **Sin fotos:** ~5% de las propiedades
- **URL de imagen:** ~200-300 caracteres

---

## ✅ Checklist de Implementación

- [ ] Actualizar código de "Split Properties to Individual Items1"
- [ ] Actualizar código de "Process Search Result1"
- [ ] Verificar que campo "imagen" existe en GHL Custom Object
- [ ] Ejecutar workflow de prueba con 1-2 propiedades
- [ ] Verificar logs que muestren "Image: ✅ Yes"
- [ ] Verificar en GHL que el campo se guardó correctamente
- [ ] Probar acceso con `{{ custom_objects.propiedades.imagen }}`

---

## 🚀 Próximos Pasos

Una vez implementado:

1. **Ejecuta el workflow** completo
2. **Revisa los logs** para confirmar que las imágenes se están capturando
3. **Verifica en GHL** que las URLs se guardaron correctamente
4. **Prueba en un email** o SMS usando `{{ custom_objects.propiedades.imagen }}`

---

## 🎓 Resumen

**Lo que se agregó:**
- ✅ Función `getPrimeraImagen()` para extraer URL
- ✅ Campo `imagen` en transformedProperty
- ✅ Campo `imagen` en ghlData.propiedades
- ✅ Logging de propiedades con/sin imagen
- ✅ Manejo de propiedades sin fotos (string vacío)

**Resultado:**
- Campo accesible en GHL como: `{{ custom_objects.propiedades.imagen }}`
- URL de imagen principal de cada propiedad
- Priorización de portada → primera por orden → primera del array

