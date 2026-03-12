import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function queryDatabase(query: string, params: any[] = []) {
  const client = await pool.connect();
  try {
    const res = await client.query(query, params);
    return res.rows;
  } finally {
    client.release();
  }
}

export interface PropertyFilters {
  operacion?: string;
  tipo?: string;
  ambientes?: number;
  barrio?: string;
  presupuesto_max?: number;
  limit?: number;
  threshold?: number;
}

export async function searchProperties(embedding: number[], filters: PropertyFilters = {}) {
  const {
    operacion = null,
    tipo = null,
    ambientes = null,
    barrio = null,
    presupuesto_max = null,
    limit = 5,
    threshold = 0.5,
  } = filters;

  const sql = `
    SELECT * FROM match_propiedades($1::vector, $2, $3, $4, $5, $6, $7, $8)
  `;

  const params = [
    JSON.stringify(embedding),
    threshold,
    limit,
    operacion,
    tipo,
    ambientes,
    barrio,
    presupuesto_max,
  ];

  return queryDatabase(sql, params);
}

// ═══════════════════════════════════════════════════════
// Funciones de escritura para sync Tokko → Supabase
// ═══════════════════════════════════════════════════════

export interface PropertyUpsert {
  tokko_id: number;
  codigo: string;
  titulo: string;
  descripcion: string;
  tipo: string;
  operacion: string;
  direccion: string;
  calle: string;
  altura: string;
  barrio: string;
  geo_lat: number | null;
  geo_long: number | null;
  precio: number | null;
  moneda: string;
  ambientes: number | null;
  dormitorios: number | null;
  banos: number | null;
  cocheras: number | null;
  superficie: number | null;
  imagen: string;
  ficha_tokko: string;
  link_web: string;
  asesor: string;
  embedding_text: string;
  embedding: number[];
}

export async function upsertProperty(data: PropertyUpsert) {
  const sql = `
    INSERT INTO propiedades_vector (
      tokko_id, codigo, titulo, descripcion, tipo, operacion,
      direccion, calle, altura, barrio, geo_lat, geo_long,
      precio, moneda, ambientes, dormitorios, banos, cocheras, superficie,
      imagen, ficha_tokko, link_web, asesor, embedding_text, embedding, activa
    ) VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10, $11, $12,
      $13, $14, $15, $16, $17, $18, $19,
      $20, $21, $22, $23, $24, $25::vector, true
    )
    ON CONFLICT (tokko_id) DO UPDATE SET
      codigo = EXCLUDED.codigo,
      titulo = EXCLUDED.titulo,
      descripcion = EXCLUDED.descripcion,
      tipo = EXCLUDED.tipo,
      operacion = EXCLUDED.operacion,
      direccion = EXCLUDED.direccion,
      calle = EXCLUDED.calle,
      altura = EXCLUDED.altura,
      barrio = EXCLUDED.barrio,
      geo_lat = EXCLUDED.geo_lat,
      geo_long = EXCLUDED.geo_long,
      precio = EXCLUDED.precio,
      moneda = EXCLUDED.moneda,
      ambientes = EXCLUDED.ambientes,
      dormitorios = EXCLUDED.dormitorios,
      banos = EXCLUDED.banos,
      cocheras = EXCLUDED.cocheras,
      superficie = EXCLUDED.superficie,
      imagen = EXCLUDED.imagen,
      ficha_tokko = EXCLUDED.ficha_tokko,
      link_web = EXCLUDED.link_web,
      asesor = EXCLUDED.asesor,
      embedding_text = EXCLUDED.embedding_text,
      embedding = EXCLUDED.embedding,
      activa = true
  `;

  const params = [
    data.tokko_id, data.codigo, data.titulo, data.descripcion, data.tipo, data.operacion,
    data.direccion, data.calle, data.altura, data.barrio, data.geo_lat, data.geo_long,
    data.precio, data.moneda, data.ambientes, data.dormitorios, data.banos, data.cocheras, data.superficie,
    data.imagen, data.ficha_tokko, data.link_web, data.asesor, data.embedding_text,
    JSON.stringify(data.embedding),
  ];

  return queryDatabase(sql, params);
}

export async function markInactiveExcept(activeTokkoIds: number[]) {
  const sql = `
    UPDATE propiedades_vector
    SET activa = false
    WHERE tokko_id != ALL($1)
      AND activa = true
  `;
  return queryDatabase(sql, [activeTokkoIds]);
}
