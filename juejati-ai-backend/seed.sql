-- ============================================================
-- Datos mock para propiedades_v2 (testing)
-- Embeddings son vectores random — el sync real genera los de OpenAI
-- ============================================================

-- Función helper para generar vector random de 1536 dims (solo para mock)
CREATE OR REPLACE FUNCTION random_embedding() RETURNS vector(1536) AS $$
  SELECT (
    SELECT array_agg(random()::float)::vector(1536)
    FROM generate_series(1, 1536)
  );
$$ LANGUAGE sql;

-- Limpiar datos previos de testing
TRUNCATE propiedades_v2 RESTART IDENTITY;

INSERT INTO propiedades_v2 (
  tokko_id, codigo, titulo, descripcion, tipo, operacion,
  direccion, calle, altura, barrio, geo_lat, geo_long,
  precio, moneda, ambientes, dormitorios, banos, cocheras, superficie,
  imagen, ficha_tokko, link_web, asesor, activa, embedding_text, embedding
) VALUES

-- 1. Departamento en Palermo - Venta
(
  10001, 'JUE-001',
  'Luminoso 3 ambientes con balcón en Palermo Soho',
  'Hermoso departamento de 3 ambientes a estrenar en el corazón de Palermo Soho. Living-comedor con salida a balcón terraza, cocina integrada con mesada de granito, 2 dormitorios con placard, baño completo. Piso de porcelanato, aire acondicionado frío/calor. Edificio con amenities: SUM, pileta, parrilla, gym.',
  'Departamento', 'venta',
  'Honduras 4800', 'Honduras', '4800', 'Palermo', -34.5875, -58.4275,
  285000, 'USD', 3, 2, 1, 0, 78,
  'https://images.tokkobroker.com/mock/palermo-3amb.jpg',
  'https://juejati.tokkobroker.com/propiedad/10001',
  '', 'David Juejati', true,
  'Departamento 3 ambientes (2 dormitorios) en Honduras 4800, Palermo. Venta USD 285.000. 1 baño, 78m². Luminoso con balcón en Palermo Soho. Hermoso departamento a estrenar con living-comedor, cocina integrada, 2 dormitorios con placard.',
  random_embedding()
),

-- 2. Departamento en Recoleta - Venta
(
  10002, 'JUE-002',
  'Elegante 4 ambientes en Recoleta con vista al parque',
  'Excelente departamento de categoría en Recoleta, frente al Parque Thays. 4 ambientes amplios, living-comedor de 30m², cocina independiente con lavadero, 3 dormitorios (suite con vestidor), 2 baños completos, toilette, dependencia de servicio. Pisos de roble, carpintería de cedro.',
  'Departamento', 'venta',
  'Av. Alvear 1500', 'Av. Alvear', '1500', 'Recoleta', -34.5860, -58.3930,
  520000, 'USD', 4, 3, 2, 1, 145,
  'https://images.tokkobroker.com/mock/recoleta-4amb.jpg',
  'https://juejati.tokkobroker.com/propiedad/10002',
  '', 'Sara Juejati', true,
  'Departamento 4 ambientes (3 dormitorios) en Av. Alvear 1500, Recoleta. Venta USD 520.000. 2 baños, 1 cochera, 145m². Elegante con vista al parque. Excelente departamento de categoría frente al Parque Thays, living-comedor de 30m², suite con vestidor.',
  random_embedding()
),

-- 3. Departamento en Belgrano - Venta
(
  10003, 'JUE-003',
  'Moderno 2 ambientes en Belgrano C',
  'Departamento de 2 ambientes a estrenar en torre premium de Belgrano C. Living-comedor con piso de porcelanato, dormitorio con placard, baño completo con mampara, cocina con desayunador. Balcón con vista abierta. Edificio con seguridad 24hs, pileta, solarium, laundry.',
  'Departamento', 'venta',
  'Echeverría 2400', 'Echeverría', '2400', 'Belgrano', -34.5610, -58.4560,
  178000, 'USD', 2, 1, 1, 0, 48,
  'https://images.tokkobroker.com/mock/belgrano-2amb.jpg',
  'https://juejati.tokkobroker.com/propiedad/10003',
  '', 'Ignacio J.', true,
  'Departamento 2 ambientes (1 dormitorio) en Echeverría 2400, Belgrano. Venta USD 178.000. 1 baño, 48m². Moderno a estrenar en torre premium. Living-comedor, dormitorio con placard, balcón con vista abierta.',
  random_embedding()
),

-- 4. Casa en Núñez - Venta
(
  10004, 'JUE-004',
  'Casa 5 ambientes con jardín y pileta en Núñez',
  'Espectacular casa en una de las mejores cuadras de Núñez. Planta baja: living-comedor amplio, cocina-comedor diario, toilette, lavadero. Planta alta: 4 dormitorios (suite principal con vestidor y baño), 2 baños. Jardín con pileta y parrilla. Garage para 2 autos.',
  'Casa', 'venta',
  'Arribeños 2800', 'Arribeños', '2800', 'Núñez', -34.5440, -58.4610,
  680000, 'USD', 5, 4, 3, 2, 320,
  'https://images.tokkobroker.com/mock/nunez-casa.jpg',
  'https://juejati.tokkobroker.com/propiedad/10004',
  '', 'Jonathan Sardar', true,
  'Casa 5 ambientes (4 dormitorios) en Arribeños 2800, Núñez. Venta USD 680.000. 3 baños, 2 cocheras, 320m². Espectacular con jardín y pileta. Living-comedor, cocina-comedor diario, suite principal con vestidor, parrilla.',
  random_embedding()
),

-- 5. Monoambiente en Villa Crespo - Alquiler
(
  10005, 'JUE-005',
  'Monoambiente divisible en Villa Crespo',
  'Práctico monoambiente divisible con excelente ubicación en Villa Crespo, a 2 cuadras del subte B. Ambiente principal amplio con cocina americana, baño completo. Ideal para jóvenes profesionales o inversión. Edificio con ascensor.',
  'Departamento', 'alquiler',
  'Corrientes 5200', 'Corrientes', '5200', 'Villa Crespo', -34.5990, -58.4370,
  450000, 'ARS', 1, 0, 1, 0, 32,
  'https://images.tokkobroker.com/mock/vcrespo-mono.jpg',
  'https://juejati.tokkobroker.com/propiedad/10005',
  '', 'Julieta Levy', true,
  'Departamento monoambiente en Corrientes 5200, Villa Crespo. Alquiler ARS 450.000. 1 baño, 32m². Monoambiente divisible a 2 cuadras del subte B. Ideal jóvenes profesionales o inversión.',
  random_embedding()
),

-- 6. Departamento en Caballito - Venta
(
  10006, 'JUE-006',
  '3 ambientes con cochera en Caballito',
  'Departamento de 3 ambientes en excelente estado en Caballito. Living-comedor, cocina separada con lavadero, 2 dormitorios amplios, baño completo, balcón corrido. Cochera cubierta incluida. A 3 cuadras del Parque Rivadavia y subte A.',
  'Departamento', 'venta',
  'Av. Rivadavia 5100', 'Av. Rivadavia', '5100', 'Caballito', -34.6180, -58.4380,
  195000, 'USD', 3, 2, 1, 1, 72,
  'https://images.tokkobroker.com/mock/caballito-3amb.jpg',
  'https://juejati.tokkobroker.com/propiedad/10006',
  '', 'David Juejati', true,
  'Departamento 3 ambientes (2 dormitorios) en Av. Rivadavia 5100, Caballito. Venta USD 195.000. 1 baño, 1 cochera, 72m². Con cochera cerca del Parque Rivadavia y subte A. Living-comedor, cocina separada, balcón corrido.',
  random_embedding()
),

-- 7. Local Comercial en Palermo - Alquiler
(
  10007, 'JUE-007',
  'Local comercial sobre Av. Santa Fe - Palermo',
  'Excelente local comercial en esquina sobre Av. Santa Fe, zona de alto tránsito peatonal. Planta baja de 60m² + entrepiso de 25m². Vidriera doble, baño, depósito. Ideal gastronomía, retail o showroom.',
  'Local Comercial', 'alquiler',
  'Av. Santa Fe 3400', 'Av. Santa Fe', '3400', 'Palermo', -34.5870, -58.4120,
  2500000, 'ARS', 1, 0, 1, 0, 85,
  'https://images.tokkobroker.com/mock/palermo-local.jpg',
  'https://juejati.tokkobroker.com/propiedad/10007',
  '', 'Sara Juejati', true,
  'Local Comercial en Av. Santa Fe 3400, Palermo. Alquiler ARS 2.500.000. 1 baño, 85m². En esquina, alto tránsito peatonal. Planta baja 60m² + entrepiso 25m². Ideal gastronomía, retail o showroom.',
  random_embedding()
),

-- 8. Departamento en Puerto Madero - Venta
(
  10008, 'JUE-008',
  'Piso alto con vista al río en Puerto Madero',
  'Increíble departamento de 3 ambientes en piso 18 con vista panorámica al río y a la reserva ecológica. Living-comedor con ventanales de piso a techo, cocina premium full equipada, 2 dormitorios en suite, toilette de recepción. Amenities premium: pileta climatizada, gym, spa, concierge 24hs.',
  'Departamento', 'venta',
  'Olga Cossettini 1200', 'Olga Cossettini', '1200', 'Puerto Madero', -34.6130, -58.3620,
  750000, 'USD', 3, 2, 2, 2, 120,
  'https://images.tokkobroker.com/mock/pmadero-3amb.jpg',
  'https://juejati.tokkobroker.com/propiedad/10008',
  '', 'Jonathan Sardar', true,
  'Departamento 3 ambientes (2 dormitorios) en Olga Cossettini 1200, Puerto Madero. Venta USD 750.000. 2 baños, 2 cocheras, 120m². Piso alto con vista al río. Ventanales piso a techo, cocina premium, amenities spa y pileta climatizada.',
  random_embedding()
),

-- 9. Departamento en Palermo - Alquiler
(
  10009, 'JUE-009',
  '2 ambientes amueblado en Palermo Hollywood',
  'Departamento de 2 ambientes completamente amueblado y equipado en Palermo Hollywood. Living con sofá cama, smart TV, cocina americana equipada, dormitorio con sommier king, placard, baño completo. Expensas bajas. A 1 cuadra de bares y restaurantes.',
  'Departamento', 'alquiler',
  'Fitz Roy 1800', 'Fitz Roy', '1800', 'Palermo', -34.5850, -58.4350,
  650000, 'ARS', 2, 1, 1, 0, 42,
  'https://images.tokkobroker.com/mock/palermo-alq-2amb.jpg',
  'https://juejati.tokkobroker.com/propiedad/10009',
  '', 'Julieta Levy', true,
  'Departamento 2 ambientes (1 dormitorio) en Fitz Roy 1800, Palermo. Alquiler ARS 650.000. 1 baño, 42m². Amueblado en Palermo Hollywood. Living con smart TV, cocina americana equipada, sommier king.',
  random_embedding()
),

-- 10. Departamento en San Telmo - Venta
(
  10010, 'JUE-010',
  'Loft reciclado en San Telmo con terraza propia',
  'Espectacular loft reciclado en edificio histórico de San Telmo. Doble altura con entrepiso, living amplio, cocina industrial, dormitorio en altillo, baño con hidromasaje. Terraza propia de 20m² con parrilla. Ideal artistas o profesionales creativos.',
  'Departamento', 'venta',
  'Defensa 900', 'Defensa', '900', 'San Telmo', -34.6210, -58.3720,
  165000, 'USD', 2, 1, 1, 0, 75,
  'https://images.tokkobroker.com/mock/santelmo-loft.jpg',
  'https://juejati.tokkobroker.com/propiedad/10010',
  '', 'Ignacio J.', true,
  'Departamento 2 ambientes (1 dormitorio) en Defensa 900, San Telmo. Venta USD 165.000. 1 baño, 75m². Loft reciclado con terraza propia y parrilla. Doble altura, cocina industrial, baño con hidromasaje.',
  random_embedding()
);

-- Verificar inserción
SELECT tokko_id, titulo, barrio, operacion, precio, moneda, ambientes
FROM propiedades_v2
ORDER BY tokko_id;

-- Limpiar función helper
DROP FUNCTION IF EXISTS random_embedding();
