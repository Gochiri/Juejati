// Extraer y preparar cada propiedad individualmente
const data = $input.first().json;
const properties = data.objects || [];

console.log(`=== TOKKO PROPERTIES PROCESSING ===`);
console.log(`Total properties found: ${properties.length}`);

// Crear un item por cada propiedad
const items = [];

properties.forEach((property, index) => {
  // Función helper para obtener precio por tipo de operación
  const getPriceByOperation = (operations, operationType, currency) => {
    const operation = operations?.find(op => op.operation_type === operationType);
    const price = operation?.prices?.find(p => p.currency === currency);
    return price?.price || null;
  };

  // Función helper para obtener moneda por tipo de operación
  const getCurrencyByOperation = (operations, operationType) => {
    const operation = operations?.find(op => op.operation_type === operationType);
    return operation?.prices?.[0]?.currency || 'USD';
  };

  // Función helper para obtener operaciones
  const getOperations = (operations) => {
    return operations?.map(op => op.operation_type).join(', ') || '';
  };

  // ═══════════════════════════════════════════════════════
  // FUNCIÓN PARA EXTRAER PRIMERA IMAGEN
  // ═══════════════════════════════════════════════════════
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

  const transformedProperty = {
    // Datos originales de Tokko
    tokkoId: property.id?.toString() || '',
    codigo: property.reference_code || '',
    tipoInmueble: property.type?.name || '',
    operacion: getOperations(property.operations),
    titulo: property.publication_title || '',
    direccion: property.real_address || '',
    linkWeb: property.public_url || '',
    descripcion: property.description || '',
    distrito: property.location?.name || '',
    propietarioNombre: property.internal_data?.property_owners?.[0]?.name || '',
    propietarioCelular: property.internal_data?.property_owners?.[0]?.phone || '',
    moneda: property.operations?.[0]?.operation_type === "Alquiler" ? 
      getCurrencyByOperation(property.operations, "Alquiler") : 
      getCurrencyByOperation(property.operations, "Venta"),
    precio: property.operations?.[0]?.operation_type === "Alquiler" ? 
      getPriceByOperation(property.operations, "Alquiler", "PEN") : 
      getPriceByOperation(property.operations, "Venta", "USD"),
    asesor: property.producer?.name || '',
    areaConstruida: parseFloat(property.surface) || null,
    habitaciones: property.suite_amount || null,
    banos: property.bathroom_amount || null,
    cocheras: property.parking_lot_amount || null,
    geoLat: parseFloat(property.geo_lat) || null,
    geoLong: parseFloat(property.geo_long) || null,
    
    // ═══════════════════════════════════════════════════════
    // IMAGEN PRINCIPAL (NUEVO)
    // ═══════════════════════════════════════════════════════
    imagen: getPrimeraImagen(property.photos),
    
    // Metadatos para tracking
    propertyIndex: index + 1,
    totalProperties: properties.length,
    processedAt: new Date().toISOString()
  };

  items.push({ json: transformedProperty });
});

console.log(`Prepared ${items.length} properties for processing`);
console.log(`Properties with images: ${items.filter(i => i.json.imagen).length}`);

return items;
