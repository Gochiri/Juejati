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

// Ensure the db generates embeddings and matches the properties correctly
export async function searchProperties(embedding: number[], filters: any = {}) {
  // Vector search query placeholder
  // This will match Supabase's vector comparison operators depending on how tokkobroker sync works
  const { operacion, tipo, ambientes, limit = 5 } = filters;
  
  // Example implementation. Needs adjustment based on actual table structure in Supabase DB.
  let sql = `
    SELECT id, tokko_id, titulo, direccion, barrio, zona, precio, moneda, ambientes, link_web, imagen,
    1 - (embedding <=> $1::vector) as similarity
    FROM propiedades_vector
    WHERE 1=1
  `;
  const params: any[] = [JSON.stringify(embedding)];
  let paramIndex = 2;

  if (operacion) {
    sql += ` AND operacion = $${paramIndex++}`;
    params.push(operacion);
  }
  if (tipo) {
    sql += ` AND tipo = $${paramIndex++}`;
    params.push(tipo);
  }
  if (ambientes) {
    sql += ` AND ambientes = $${paramIndex++}`;
    params.push(ambientes);
  }

  sql += ` ORDER BY embedding <=> $1::vector LIMIT $${paramIndex}`;
  params.push(limit);

  return queryDatabase(sql, params);
}
