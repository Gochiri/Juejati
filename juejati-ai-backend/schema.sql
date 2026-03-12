-- ============================================================
-- Schema: propiedades_vector (Supabase + pgvector)
-- Sync: Backend llama a Tokko API y escribe acá (reemplaza n8n)
-- Lectura: El agente Sofía hace búsqueda vectorial
-- ============================================================

-- Habilitar extensión pgvector (ya debería estar en Supabase)
CREATE EXTENSION IF NOT EXISTS vector;

-- Dropear tabla vieja de n8n si existe (usaba estructura LangChain con content/metadata JSONB)
-- DROP TABLE IF EXISTS propiedades_vector;

-- Tabla principal de propiedades
CREATE TABLE IF NOT EXISTS propiedades_vector (
  id            BIGSERIAL PRIMARY KEY,
  tokko_id      INTEGER UNIQUE NOT NULL,
  codigo        TEXT,

  -- Datos de la propiedad
  titulo        TEXT NOT NULL,
  descripcion   TEXT,
  tipo          TEXT,            -- departamento, casa, local comercial, terreno
  operacion     TEXT,            -- venta, alquiler

  -- Ubicación
  direccion     TEXT,
  calle         TEXT,
  altura        TEXT,
  barrio        TEXT,            -- Palermo, Recoleta, Belgrano... (= distrito en Tokko)
  geo_lat       NUMERIC,
  geo_long      NUMERIC,

  -- Valores
  precio        NUMERIC,
  moneda        TEXT DEFAULT 'USD',

  -- Características
  ambientes     INTEGER,
  dormitorios   INTEGER,
  banos         INTEGER,
  cocheras      INTEGER,
  superficie    NUMERIC,        -- area construida / surface

  -- Links y media
  imagen        TEXT,            -- URL de imagen principal
  ficha_tokko   TEXT,            -- URL ficha en Tokko (public_url)
  link_web      TEXT,            -- URL pública (juejati.com.ar)

  -- Metadata
  asesor        TEXT,
  activa        BOOLEAN DEFAULT true,

  -- Texto usado para generar el embedding (para debug/re-generación)
  embedding_text TEXT,

  -- Vector embedding (OpenAI text-embedding-3-small = 1536 dims)
  embedding     vector(1536),

  -- Timestamps
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Índice vectorial para búsqueda semántica (cosine distance)
-- NOTA: ivfflat necesita datos para crear el índice.
-- Si la tabla está vacía, usar HNSW o crear el ivfflat después del primer sync.
CREATE INDEX IF NOT EXISTS idx_propiedades_embedding
  ON propiedades_vector
  USING hnsw (embedding vector_cosine_ops);

-- Índices para filtros frecuentes
CREATE INDEX IF NOT EXISTS idx_propiedades_operacion ON propiedades_vector (operacion);
CREATE INDEX IF NOT EXISTS idx_propiedades_tipo ON propiedades_vector (tipo);
CREATE INDEX IF NOT EXISTS idx_propiedades_barrio ON propiedades_vector (barrio);
CREATE INDEX IF NOT EXISTS idx_propiedades_ambientes ON propiedades_vector (ambientes);
CREATE INDEX IF NOT EXISTS idx_propiedades_precio ON propiedades_vector (precio);
CREATE INDEX IF NOT EXISTS idx_propiedades_activa ON propiedades_vector (activa);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_propiedades_updated_at ON propiedades_vector;
CREATE TRIGGER trg_propiedades_updated_at
  BEFORE UPDATE ON propiedades_vector
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Función RPC para búsqueda vectorial desde el agente
-- ============================================================
CREATE OR REPLACE FUNCTION match_propiedades(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.3,
  match_count INT DEFAULT 5,
  filter_operacion TEXT DEFAULT NULL,
  filter_tipo TEXT DEFAULT NULL,
  filter_ambientes INT DEFAULT NULL,
  filter_barrio TEXT DEFAULT NULL,
  filter_precio_max NUMERIC DEFAULT NULL
)
RETURNS TABLE (
  id BIGINT,
  tokko_id INTEGER,
  titulo TEXT,
  descripcion TEXT,
  tipo TEXT,
  operacion TEXT,
  direccion TEXT,
  barrio TEXT,
  precio NUMERIC,
  moneda TEXT,
  ambientes INTEGER,
  dormitorios INTEGER,
  banos INTEGER,
  cocheras INTEGER,
  superficie NUMERIC,
  imagen TEXT,
  ficha_tokko TEXT,
  link_web TEXT,
  asesor TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.tokko_id,
    p.titulo,
    p.descripcion,
    p.tipo,
    p.operacion,
    p.direccion,
    p.barrio,
    p.precio,
    p.moneda,
    p.ambientes,
    p.dormitorios,
    p.banos,
    p.cocheras,
    p.superficie,
    p.imagen,
    p.ficha_tokko,
    p.link_web,
    p.asesor,
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM propiedades_vector p
  WHERE p.activa = true
    AND (filter_operacion IS NULL OR p.operacion ILIKE filter_operacion)
    AND (filter_tipo IS NULL OR p.tipo ILIKE '%' || filter_tipo || '%')
    AND (filter_ambientes IS NULL OR p.ambientes = filter_ambientes)
    AND (filter_barrio IS NULL OR p.barrio ILIKE '%' || filter_barrio || '%')
    AND (filter_precio_max IS NULL OR p.precio <= filter_precio_max)
    AND 1 - (p.embedding <=> query_embedding) > match_threshold
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
