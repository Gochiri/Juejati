import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import pool from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || null
  const barrio = searchParams.get('barrio') || null
  const ambientes = searchParams.get('ambientes') ? parseInt(searchParams.get('ambientes')!) : null
  const precio_max = searchParams.get('precio_max') ? parseFloat(searchParams.get('precio_max')!) : null
  const operacion = searchParams.get('operacion') || null
  const limit = Math.min(parseInt(searchParams.get('limit') || '48'), 100)
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    const params = [q, barrio, ambientes, precio_max, operacion, limit, offset]
    const result = await pool.query(
      `SELECT tokko_id, titulo, barrio, direccion, precio, moneda,
              ambientes, dormitorios, superficie, imagen, ficha_tokko, operacion, tipo
       FROM propiedades_v2
       WHERE activa = true
         AND ($1::text IS NULL OR titulo ILIKE '%' || $1 || '%' OR direccion ILIKE '%' || $1 || '%')
         AND ($2::text IS NULL OR barrio ILIKE '%' || $2 || '%')
         AND ($3::int IS NULL OR ambientes = $3)
         AND ($4::numeric IS NULL OR precio <= $4)
         AND ($5::text IS NULL OR operacion ILIKE '%' || $5 || '%')
       ORDER BY updated_at DESC NULLS LAST
       LIMIT $6 OFFSET $7`,
      params
    )
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM propiedades_v2
       WHERE activa = true
         AND ($1::text IS NULL OR titulo ILIKE '%' || $1 || '%' OR direccion ILIKE '%' || $1 || '%')
         AND ($2::text IS NULL OR barrio ILIKE '%' || $2 || '%')
         AND ($3::int IS NULL OR ambientes = $3)
         AND ($4::numeric IS NULL OR precio <= $4)
         AND ($5::text IS NULL OR operacion ILIKE '%' || $5 || '%')`,
      [q, barrio, ambientes, precio_max, operacion]
    )
    return NextResponse.json({
      properties: result.rows,
      total: parseInt(countResult.rows[0].total),
      offset,
      limit,
    })
  } catch (err: any) {
    console.error('[GET /api/properties]', err)
    return NextResponse.json({ error: 'Error al cargar propiedades' }, { status: 500 })
  }
}
