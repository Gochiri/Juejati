// ═══════════════════════════════════════════════════════
// PROCESAR RESULTADO DE BÚSQUEDA DE ZONA - CON FILTRO DE CAPITAL FEDERAL
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
  console.log('═══════════════════════════════════════════════════════');
  
  return {
    zona_id: null,
    zona_name: queryzona,
    zona_type: 'unknown',
    query_original: queryzona,
    error: 'Respuesta del API sin campo objects',
    success: false
  };
}

const todosLosResultados = responseData.objects;
console.log('📊 Total resultados del API:', todosLosResultados.length);

// ═══════════════════════════════════════════════════════
// PASO 1: FILTRAR SOLO RESULTADOS RELEVANTES
// ═══════════════════════════════════════════════════════

const queryLower = queryzona.toLowerCase().trim();

// Filtrar solo zonas donde el NOMBRE contiene el query
// (no el location, que trae falsos positivos)
const resultadosFiltrados = todosLosResultados.filter(r => {
  const nombreLower = r.name.toLowerCase();
  return nombreLower.includes(queryLower);
});

console.log('🔍 Resultados filtrados (nombre contiene query):', resultadosFiltrados.length);

// Si no hay resultados filtrados, usar todos
const resultados = resultadosFiltrados.length > 0 ? resultadosFiltrados : todosLosResultados;

// Mostrar primeros 10 resultados filtrados
if (resultados.length > 0) {
  console.log('\n📋 Primeros 10 resultados relevantes:');
  resultados.slice(0, 10).forEach((r, index) => {
    console.log(`  ${index + 1}. [${r.type}] ${r.name}`);
    console.log(`     📍 ${r.full_location}`);
  });
  console.log('');
}

// ═══════════════════════════════════════════════════════
// PASO 2: PRIORIZAR CAPITAL FEDERAL
// ═══════════════════════════════════════════════════════

// Separar resultados de Capital Federal del resto
const resultadosCapital = resultados.filter(r => 
  r.full_location.includes('Capital Federal')
);

const resultadosOtros = resultados.filter(r => 
  !r.full_location.includes('Capital Federal')
);

console.log('🏛️  Resultados en Capital Federal:', resultadosCapital.length);
console.log('🌎 Resultados en otras provincias:', resultadosOtros.length);

// ═══════════════════════════════════════════════════════
// PASO 3: APLICAR LÓGICA DE SELECCIÓN CON PRIORIDADES
// ═══════════════════════════════════════════════════════

let zonaEncontrada = null;
let metodoSeleccion = '';

if (resultados.length === 0) {
  console.log('❌ No se encontraron resultados');
  metodoSeleccion = 'sin_resultados';
} else {
  
  // PRIORIDAD 1: Coincidencia exacta + Barrio + Capital Federal
  zonaEncontrada = resultadosCapital.find(r => 
    r.name.toLowerCase().trim() === queryLower && r.type === 'Barrio'
  );
  if (zonaEncontrada) {
    metodoSeleccion = 'exacta_barrio_capital';
    console.log('✅ Método 1: Coincidencia exacta + Barrio + Capital Federal');
  }
  
  // PRIORIDAD 2: Coincidencia exacta + Capital Federal (cualquier tipo)
  if (!zonaEncontrada) {
    zonaEncontrada = resultadosCapital.find(r => 
      r.name.toLowerCase().trim() === queryLower
    );
    if (zonaEncontrada) {
      metodoSeleccion = 'exacta_capital';
      console.log('✅ Método 2: Coincidencia exacta + Capital Federal (tipo: ' + zonaEncontrada.type + ')');
    }
  }
  
  // PRIORIDAD 3: Primer Barrio de Capital Federal
  if (!zonaEncontrada) {
    zonaEncontrada = resultadosCapital.find(r => r.type === 'Barrio');
    if (zonaEncontrada) {
      metodoSeleccion = 'primer_barrio_capital';
      console.log('⚠️  Método 3: Primer Barrio de Capital Federal');
    }
  }
  
  // PRIORIDAD 4: Primera zona de Capital Federal (cualquier tipo)
  if (!zonaEncontrada) {
    zonaEncontrada = resultadosCapital[0];
    if (zonaEncontrada) {
      metodoSeleccion = 'primera_zona_capital';
      console.log('⚠️  Método 4: Primera zona de Capital Federal');
    }
  }
  
  // PRIORIDAD 5: Coincidencia exacta + Barrio (cualquier provincia)
  if (!zonaEncontrada) {
    zonaEncontrada = resultados.find(r => 
      r.name.toLowerCase().trim() === queryLower && r.type === 'Barrio'
    );
    if (zonaEncontrada) {
      metodoSeleccion = 'exacta_barrio_provincia';
      console.log('⚠️  Método 5: Coincidencia exacta + Barrio (fuera de Capital)');
    }
  }
  
  // PRIORIDAD 6: Coincidencia exacta (cualquier provincia y tipo)
  if (!zonaEncontrada) {
    zonaEncontrada = resultados.find(r => 
      r.name.toLowerCase().trim() === queryLower
    );
    if (zonaEncontrada) {
      metodoSeleccion = 'exacta_provincia';
      console.log('⚠️  Método 6: Coincidencia exacta (fuera de Capital)');
    }
  }
  
  // PRIORIDAD 7: Primer Barrio (cualquier provincia)
  if (!zonaEncontrada) {
    zonaEncontrada = resultados.find(r => r.type === 'Barrio');
    if (zonaEncontrada) {
      metodoSeleccion = 'primer_barrio';
      console.log('⚠️  Método 7: Primer Barrio encontrado');
    }
  }
  
  // PRIORIDAD 8: Primer resultado (fallback absoluto)
  if (!zonaEncontrada) {
    zonaEncontrada = resultados[0];
    metodoSeleccion = 'primer_resultado';
    console.log('⚠️  Método 8: Fallback - Primer resultado');
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
  
  // Verificar si es de Capital Federal
  const esCapital = zonaEncontrada.full_location.includes('Capital Federal');
  console.log('   Capital Federal:', esCapital ? '✅ Sí' : '⚠️  No');
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
  total_resultados_api: todosLosResultados.length,
  total_filtrados: resultadosFiltrados.length,
  total_capital_federal: resultadosCapital.length,
  
  // Información adicional de la zona
  zona_full_location: zonaEncontrada?.full_location || null,
  zona_resource_uri: zonaEncontrada?.resource_uri || null,
  es_capital_federal: zonaEncontrada ? zonaEncontrada.full_location.includes('Capital Federal') : false,
  
  // Para debug - separar Capital Federal de otros
  zonas_capital_federal: resultadosCapital.slice(0, 20).map(r => ({
    id: r.id,
    name: r.name,
    type: r.type,
    location: r.full_location
  })),
  
  zonas_otras_provincias: resultadosOtros.slice(0, 10).map(r => ({
    id: r.id,
    name: r.name,
    type: r.type,
    location: r.full_location
  })),
  
  // Indicador de éxito
  success: zonaEncontrada !== null
};
