// ═══════════════════════════════════════════════════════
// PROCESAR RESULTADO DE BÚSQUEDA DE ZONA - CORREGIDO PARA TOKKO API
// ═══════════════════════════════════════════════════════

const queryzona = $('When Executed by Another Workflow').item.json.queryzona;
const responseData = $input.item.json;

console.log('═══════════════════════════════════════════════════════');
console.log('🗺️  GET_ZONA - BÚSQUEDA DE ZONA');
console.log('═══════════════════════════════════════════════════════');
console.log('📍 Query original:', queryzona);

// Validar estructura de respuesta
if (!responseData.objects) {
  console.log('⚠️  Respuesta sin campo "objects"');
  console.log('📦 Estructura recibida:', Object.keys(responseData));
  console.log('═══════════════════════════════════════════════════════');
  
  return {
    zona_id: null,
    zona_name: queryzona,
    zona_type: 'unknown',
    query_original: queryzona,
    error: 'Respuesta del API sin campo objects',
    raw_response: responseData
  };
}

const resultados = responseData.objects;
console.log('📊 Resultados encontrados:', resultados.length);
console.log('📈 Total en base de datos:', responseData.meta?.total_count || 'N/A');

// Mostrar primeros 10 resultados para debug
if (resultados.length > 0) {
  console.log('\n🔍 Primeros 10 resultados:');
  resultados.slice(0, 10).forEach((r, index) => {
    console.log(`  ${index + 1}. [${r.type}] ${r.name} (ID: ${r.id})`);
    console.log(`     📍 ${r.full_location}`);
  });
  console.log('');
}

// ═══════════════════════════════════════════════════════
// LÓGICA DE FILTRADO PARA API TOKKO
// Tipos disponibles: "Barrio", "Localidad", "Área"
// ═══════════════════════════════════════════════════════

let zonaEncontrada = null;
let metodoSeleccion = '';

if (resultados.length === 0) {
  console.log('❌ No se encontraron resultados');
  metodoSeleccion = 'sin_resultados';
} else {
  const queryLower = queryzona.toLowerCase().trim();
  
  // PRIORIDAD 1: Coincidencia exacta + tipo "Barrio"
  zonaEncontrada = resultados.find(r => 
    r.name.toLowerCase().trim() === queryLower && r.type === 'Barrio'
  );
  if (zonaEncontrada) {
    metodoSeleccion = 'coincidencia_exacta_barrio';
    console.log('✅ Método 1: Coincidencia exacta + Barrio');
  }
  
  // PRIORIDAD 2: Coincidencia exacta (cualquier tipo)
  if (!zonaEncontrada) {
    zonaEncontrada = resultados.find(r => 
      r.name.toLowerCase().trim() === queryLower
    );
    if (zonaEncontrada) {
      metodoSeleccion = 'coincidencia_exacta';
      console.log('✅ Método 2: Coincidencia exacta (tipo: ' + zonaEncontrada.type + ')');
    }
  }
  
  // PRIORIDAD 3: Primera zona tipo "Barrio"
  if (!zonaEncontrada) {
    zonaEncontrada = resultados.find(r => r.type === 'Barrio');
    if (zonaEncontrada) {
      metodoSeleccion = 'primer_barrio';
      console.log('⚠️  Método 3: Primer Barrio encontrado');
    }
  }
  
  // PRIORIDAD 4: Coincidencia parcial en "Barrio"
  if (!zonaEncontrada) {
    zonaEncontrada = resultados.find(r => 
      r.type === 'Barrio' && 
      r.name.toLowerCase().includes(queryLower)
    );
    if (zonaEncontrada) {
      metodoSeleccion = 'coincidencia_parcial_barrio';
      console.log('⚠️  Método 4: Coincidencia parcial en Barrio');
    }
  }
  
  // PRIORIDAD 5: Primera zona tipo "Localidad" (más general que Barrio)
  if (!zonaEncontrada) {
    zonaEncontrada = resultados.find(r => r.type === 'Localidad');
    if (zonaEncontrada) {
      metodoSeleccion = 'primera_localidad';
      console.log('⚠️  Método 5: Primera Localidad encontrada');
    }
  }
  
  // PRIORIDAD 6: Primer resultado (fallback absoluto)
  if (!zonaEncontrada) {
    zonaEncontrada = resultados[0];
    metodoSeleccion = 'primer_resultado';
    console.log('⚠️  Método 6: Fallback - Primer resultado');
  }
}

// ═══════════════════════════════════════════════════════
// RESULTADO FINAL
// ═══════════════════════════════════════════════════════

if (zonaEncontrada) {
  console.log('\n🎯 Zona seleccionada:');
  console.log('   ID:', zonaEncontrada.id);
  console.log('   Nombre:', zonaEncontrada.name);
  console.log('   Tipo:', zonaEncontrada.type);
  console.log('   Ubicación:', zonaEncontrada.full_location);
  console.log('   Método:', metodoSeleccion);
} else {
  console.log('\n❌ No se pudo seleccionar ninguna zona');
}

console.log('═══════════════════════════════════════════════════════');

// Retornar datos estructurados
return {
  // Datos principales
  zona_id: zonaEncontrada ? zonaEncontrada.id : null,
  zona_name: zonaEncontrada ? zonaEncontrada.name : queryzona,
  zona_type: zonaEncontrada ? zonaEncontrada.type : 'unknown',
  
  // Metadata
  query_original: queryzona,
  metodo_seleccion: metodoSeleccion,
  total_resultados: resultados.length,
  total_en_db: responseData.meta?.total_count || null,
  
  // Información adicional de la zona
  zona_full_location: zonaEncontrada?.full_location || null,
  zona_resource_uri: zonaEncontrada?.resource_uri || null,
  
  // Para debug - solo primeros 50 para no sobrecargar
  todas_las_zonas: resultados.slice(0, 50).map(r => ({
    id: r.id,
    name: r.name,
    type: r.type,
    location: r.full_location
  })),
  
  // Indicador de éxito
  success: zonaEncontrada !== null
};
