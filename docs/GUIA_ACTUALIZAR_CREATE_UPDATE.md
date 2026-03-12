# 📝 Guía Paso a Paso: Actualizar Nodos Create y Update

## 🎯 Objetivo

Agregar el campo `"imagen"` a los nodos que crean y actualizan propiedades en GHL.

---

## 📋 Nodos a Actualizar

1. **Create Property in GHL1** (línea 199 del workflow)
2. **Update Property in GHL1** (línea 253 del workflow)

---

## 🔧 Instrucciones Detalladas

### 1️⃣ Actualizar "Create Property in GHL1"

#### Ubicación del campo:
En el nodo **HTTP Request** → Body → JSON

#### Campo actual (jsonBody):
```json
{
  "locationId": "{{ $json.ghlData.locationId }}",
  "properties": {
    "tokko_id": "{{ $json.ghlData.propiedades['Tokko ID'] }}",
    "codigo": "{{ $json.ghlData.propiedades.Codigo }}",
    ...
    "ficha_tokko": "{{ $json.ghlData.propiedades['Ficha Tokko'] }}"
  }
}
```

#### ✏️ Agregar al final de "properties":
```json
"imagen": "{{ $json.ghlData.propiedades.imagen }}"
```

#### JSON completo actualizado:
```json
{
  "locationId": "{{ $json.ghlData.locationId }}",
  "properties": {
    "tokko_id": "{{ $json.ghlData.propiedades['Tokko ID'] }}",
    "codigo": "{{ $json.ghlData.propiedades.Codigo }}",
    "tipo_de_propiedad": "{{ $json.ghlData.propiedades.Tipo_de_propiedad }}",
    "tipo_de_operacion": "{{ $json.ghlData.propiedades.Tipo_de_operacion }}",
    "titulo": "{{ $json.ghlData.propiedades.Titulo }}",
    "direccion": "{{ $json.ghlData.propiedades.Direccion }}",
    "precio": {{ $json.ghlData.propiedades.Precio | parseFloat }},
    "moneda": "{{ $json.ghlData.propiedades.Moneda }}",
    "habitaciones": "{{ $json.ghlData.propiedades.Habitaciones }}",
    "baos": "{{ $json.ghlData.propiedades['Baños'] }}",
    "area_construida": "{{ $json.ghlData.propiedades.Area_construida }}",
    "distrito": "{{ $json.ghlData.propiedades.Distrito }}",
    "asesor": "{{ $json.ghlData.propiedades.Asesor }}",
    "ficha_tokko": "{{ $json.ghlData.propiedades['Ficha Tokko'] }}",
    "imagen": "{{ $json.ghlData.propiedades.imagen }}"
  }
}
```

---

### 2️⃣ Actualizar "Update Property in GHL1"

#### Ubicación del campo:
En el nodo **HTTP Request** → Body → JSON

#### Campo actual (jsonBody):
```json
{
  "properties": {
    "tokko_id": "{{ $json.ghlData.propiedades['Tokko ID'] }}",
    "codigo": "{{ $json.ghlData.propiedades.Codigo }}",
    ...
    "ficha_tokko": "{{ $json.ghlData.propiedades['Ficha Tokko'] }}"
  }
}
```

#### ✏️ Agregar al final de "properties":
```json
"imagen": "{{ $json.ghlData.propiedades.imagen }}"
```

#### JSON completo actualizado:
```json
{
  "properties": {
    "tokko_id": "{{ $json.ghlData.propiedades['Tokko ID'] }}",
    "codigo": "{{ $json.ghlData.propiedades.Codigo }}",
    "tipo_de_propiedad": "{{ $json.ghlData.propiedades.Tipo_de_propiedad }}",
    "tipo_de_operacion": "{{ $json.ghlData.propiedades.Tipo_de_operacion }}",
    "titulo": "{{ $json.ghlData.propiedades.Titulo }}",
    "direccion": "{{ $json.ghlData.propiedades.Direccion }}",
    "precio": {{ $json.ghlData.propiedades.Precio && $json.ghlData.propiedades.Precio !== '' ? ($json.ghlData.propiedades.Precio | parseFloat) : 0 }},
    "moneda": "{{ $json.ghlData.propiedades.Moneda }}",
    "habitaciones": "{{ $json.ghlData.propiedades.Habitaciones }}",
    "baos": "{{ $json.ghlData.propiedades['Baños'] }}",
    "area_construida": "{{ $json.ghlData.propiedades.Area_construida }}",
    "distrito": "{{ $json.ghlData.propiedades.Distrito }}",
    "asesor": "{{ $json.ghlData.propiedades.Asesor }}",
    "ficha_tokko": "{{ $json.ghlData.propiedades['Ficha Tokko'] }}",
    "imagen": "{{ $json.ghlData.propiedades.imagen }}"
  }
}
```

---

## 🖥️ Cómo Editar en n8n

### Método 1: Editor Visual (Recomendado)

1. Abre el workflow en n8n
2. Haz clic en el nodo **"Create Property in GHL1"**
3. Ve a la pestaña **Parameters**
4. Busca el campo **"Specify Body"** → JSON
5. Copia y pega el JSON actualizado del archivo `create_property_json.json`
6. Guarda el nodo
7. Repite para **"Update Property in GHL1"** con `update_property_json.json`

### Método 2: Edición Manual del JSON

Si prefieres editar directamente:

1. Busca esta línea en el JSON del workflow (línea ~199):
```json
"ficha_tokko": "{{ $json.ghlData.propiedades['Ficha Tokko'] }}"
```

2. Agrega una coma al final y la nueva línea:
```json
"ficha_tokko": "{{ $json.ghlData.propiedades['Ficha Tokko'] }}",
"imagen": "{{ $json.ghlData.propiedades.imagen }}"
```

3. Repite para el nodo Update (línea ~253)

---

## ⚠️ Importante: Comas

**¡Cuidado con las comas!** 

### ❌ Incorrecto:
```json
"ficha_tokko": "{{ $json.ghlData.propiedades['Ficha Tokko'] }}"
"imagen": "{{ $json.ghlData.propiedades.imagen }}"  // ← Falta coma arriba
```

### ✅ Correcto:
```json
"ficha_tokko": "{{ $json.ghlData.propiedades['Ficha Tokko'] }}",  // ← Coma aquí
"imagen": "{{ $json.ghlData.propiedades.imagen }}"
```

---

## 🔍 Verificar que Funcionó

### Test en n8n:

1. Ejecuta el workflow con 1 propiedad de prueba
2. En el nodo "Create Property in GHL1", revisa el Request Body
3. Deberías ver:
```json
{
  "properties": {
    ...
    "imagen": "https://static.tokkobroker.com/pictures/272..."
  }
}
```

### Test en GHL:

1. Ve a GHL → Settings → Custom Objects → propiedades
2. Abre un registro creado/actualizado
3. Deberías ver el campo "imagen" con la URL

---

## 📊 Resumen Visual

```
Flujo de Datos:

Split Properties
↓
imagen: "https://..."

Process Search Result  
↓
ghlData.propiedades.imagen: "https://..."

Create Property in GHL
↓
Body: { "properties": { "imagen": "https://..." } }
↓
GHL Custom Object ✅
```

---

## ✅ Checklist Final

### Nodo: Split Properties to Individual Items1
- [ ] Agregar función `getPrimeraImagen()`
- [ ] Agregar campo `imagen` al transformedProperty

### Nodo: Process Search Result1
- [ ] Agregar campo `"imagen"` al ghlData.propiedades

### Nodo: Create Property in GHL1
- [ ] Agregar `"imagen": "{{ $json.ghlData.propiedades.imagen }}"` al JSON body

### Nodo: Update Property in GHL1
- [ ] Agregar `"imagen": "{{ $json.ghlData.propiedades.imagen }}"` al JSON body

### En GHL
- [ ] Verificar que campo "imagen" existe en Custom Object
- [ ] Ejecutar workflow de prueba
- [ ] Confirmar que URL se guardó correctamente

---

## 🚀 Testing

### Test mínimo:
```bash
1. Ejecutar workflow con 1 propiedad
2. Verificar logs: "Image: ✅ Yes"
3. Verificar en GHL que el campo tiene URL
4. Probar acceso: {{ custom_objects.propiedades.imagen }}
```

### Test completo:
```bash
1. Ejecutar workflow con 10 propiedades
2. Verificar que ~9-10 tienen imagen
3. Verificar que propiedades sin foto tienen campo vacío ""
4. Crear email/SMS de prueba con la imagen
5. Verificar que imagen se muestra correctamente
```

---

## 🆘 Troubleshooting

### Problema: Campo "imagen" vacío en GHL
**Causa:** El campo no existe en el Custom Object
**Solución:** Crear el campo manualmente en GHL primero

### Problema: Error "Invalid JSON"
**Causa:** Falta o sobra una coma
**Solución:** Verificar que cada línea excepto la última tenga coma

### Problema: Imagen no se ve
**Causa:** URL está vacía o inválida
**Solución:** Verificar logs que digan "Image: ✅ Yes"

---

## 📞 Próximos Pasos

1. Actualizar los 4 nodos (Split, Process, Create, Update)
2. Guardar el workflow
3. Ejecutar prueba con 1-2 propiedades
4. Verificar en GHL
5. Ejecutar sync completo

¡Listo! Ahora tendrás las imágenes en tus custom objects de GHL. 📸

