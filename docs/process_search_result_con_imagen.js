// Procesar respuesta de búsqueda y preparar datos
const searchResponse = $input.first().json;
const propertyData = $('Loop Over Properties1').item.json;

console.log(`=== PROCESSING PROPERTY ${propertyData.propertyIndex}/${propertyData.totalProperties} ===`);
console.log(`Tokko ID: ${propertyData.tokkoId}`);
console.log(`Search response total:`, searchResponse.total || 0);

// Verificar si encontramos registros
const total = searchResponse.total || 0;
const records = searchResponse.records || [];
const existingRecord = records.length > 0 ? records[0] : null;

// Preparar datos para GHL - NOMBRES EXACTOS DE GHL
const ghlData = {
  locationId: "WWrBqekGJCsCmSSvPzEf",
  propiedades: {
    "Tokko ID": propertyData.tokkoId,
    "Codigo": propertyData.codigo,
    "Tipo_de_propiedad": propertyData.tipoInmueble,
    "Tipo_de_operacion": propertyData.operacion,
    "Titulo": propertyData.titulo,
    "Direccion": propertyData.direccion,
    "Precio": propertyData.precio?.toString() || '',
    "Moneda": propertyData.moneda,
    "Habitaciones": propertyData.habitaciones?.toString() || '',
    "Baños": propertyData.banos?.toString() || '',
    "Area_construida": propertyData.areaConstruida?.toString() || '',
    "Distrito": propertyData.distrito,
    "Asesor": propertyData.asesor || '',
    "Ficha Tokko": propertyData.linkWeb || '',
    // ═══════════════════════════════════════════════════════
    // IMAGEN (NUEVO CAMPO)
    // ═══════════════════════════════════════════════════════
    "imagen": propertyData.imagen || ''
  }
};

const result = {
  action: total === 0 ? 'create' : 'update',
  existingRecordId: existingRecord?.id || null,
  ghlData: ghlData,
  propertyData: propertyData,
  searchFound: total
};

console.log(`Action: ${result.action}`);
if (result.action === 'update') {
  console.log(`Existing record ID: ${result.existingRecordId}`);
}
console.log(`Image: ${propertyData.imagen ? '✅ Yes' : '❌ No'}`);

return [{ json: result }];
