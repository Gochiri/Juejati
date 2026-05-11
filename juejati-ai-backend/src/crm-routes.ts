import { Router, Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db.js';
import { updateContactFields, getContactById } from './ghl.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

const GHL_API_BASE = 'https://services.leadconnectorhq.com';
const ghlApiKey = (process.env.GHL_API_KEY || '').replace(/^Bearer\s+/i, '');
const ghlLocationId = process.env.GHL_LOCATION_ID;

const GHL_FIELD_IDS = {
  zona: 'eG9pUwxa14BaJPcniff4',
  operacion: 'eyaHssuX5zAXIAJWHLD7',
  presupuesto_ia: 'ihIevvOORQdZzHG1gAhB',
  ambientes: 'KZrsvB6kjmH89d50RssM',
  dormitorios: 'tia21zMjZpg6vssIeiAg',
  tipo_propiedad: '6MaFF03NbN1maNs2t6wp',
  propiedad_de_interes: 'JIVPrnwNHaa2xpwVF72s',
  propiedad_tokko_id: '2kErmqUh8mG4DSiPLl4c',
  caracteristicas_deseadas: 'lgdH2EYqz6j7o1ZAUlCg',
  ultima_propiedad_vista: 'SIxdiv7ssbhAzMAyIziu',
  titulo_propiedad: 'M3VU50mqHUKb9alOKPvt',
  precio_propiedad: 'oMgcrl5b9LY1WOCVLiFI',
  ubicacion_propiedad: 'XJvbVGNyvhnghesdLIYd',
  score_lead: 'zLRaEQ5pm9fWvKJsnoIo',
  link_propiedad: 'XXEy7AlJmE9PJu1bOQKs',
} as const;

function basicAuth(req: Request, res: Response, next: NextFunction) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return res.status(503).json({ error: 'Admin not configured' });
  }
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Juejati Admin"');
    return res.status(401).json({ error: 'Authentication required' });
  }
  const decoded = Buffer.from(auth.slice(6), 'base64').toString();
  const [, password] = decoded.split(':');
  if (password !== adminPassword) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Juejati Admin"');
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  next();
}

router.use('/crm', basicAuth);

// Serve crm.html
router.get('/crm', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'crm.html'));
});
router.get('/crm/', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'crm.html'));
});

function extractFieldValue(customFields: any[], fieldId: string): string | null {
  if (!Array.isArray(customFields)) return null;
  const f = customFields.find((cf: any) => cf.id === fieldId);
  return f?.value ?? f?.field_value ?? null;
}

// GET /crm/api/leads — fetch GHL opportunities
router.get('/crm/api/leads', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 100);
    const page = parseInt(req.query.page as string) || 1;
    const url = `${GHL_API_BASE}/opportunities/search?location_id=${ghlLocationId}&limit=${limit}&page=${page}`;
    const ghlRes = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ghlApiKey}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json',
      },
    });
    if (!ghlRes.ok) {
      const body = await ghlRes.text();
      throw new Error(`GHL Error: ${ghlRes.status} ${body}`);
    }
    const data = await ghlRes.json();
    const opportunities = data.opportunities || [];

    const leads = opportunities.map((opp: any) => {
      const contact = opp.contact || {};
      const customFields: any[] = opp.customFields || contact.customFields || [];
      return {
        opportunityId: opp.id,
        contactId: contact.id || opp.contactId,
        name: contact.name || [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'Sin nombre',
        phone: contact.phone || '',
        stage: opp.stage?.name || opp.pipelineStage || '',
        score_lead: extractFieldValue(customFields, GHL_FIELD_IDS.score_lead),
        zona: extractFieldValue(customFields, GHL_FIELD_IDS.zona),
        operacion: extractFieldValue(customFields, GHL_FIELD_IDS.operacion),
        presupuesto_ia: extractFieldValue(customFields, GHL_FIELD_IDS.presupuesto_ia),
        ambientes: extractFieldValue(customFields, GHL_FIELD_IDS.ambientes),
        propiedad_tokko_id: extractFieldValue(customFields, GHL_FIELD_IDS.propiedad_tokko_id),
        titulo_propiedad: extractFieldValue(customFields, GHL_FIELD_IDS.titulo_propiedad),
        precio_propiedad: extractFieldValue(customFields, GHL_FIELD_IDS.precio_propiedad),
        ubicacion_propiedad: extractFieldValue(customFields, GHL_FIELD_IDS.ubicacion_propiedad),
        link_propiedad: extractFieldValue(customFields, GHL_FIELD_IDS.link_propiedad),
      };
    });

    res.json({ leads, total: data.meta?.total || leads.length });
  } catch (err: any) {
    console.error('CRM leads error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /crm/api/properties — query Supabase propiedades_v2
router.get('/crm/api/properties', async (req, res) => {
  try {
    const q = (req.query.q as string) || null;
    const barrio = (req.query.barrio as string) || null;
    const ambientes = req.query.ambientes ? parseInt(req.query.ambientes as string) : null;
    const precio_max = req.query.precio_max ? parseFloat(req.query.precio_max as string) : null;
    const operacion = (req.query.operacion as string) || null;
    const limit = Math.min(parseInt(req.query.limit as string) || 48, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const params: any[] = [q, barrio, ambientes, precio_max, operacion, limit, offset];

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
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) as total
       FROM propiedades_v2
       WHERE activa = true
         AND ($1::text IS NULL OR titulo ILIKE '%' || $1 || '%' OR direccion ILIKE '%' || $1 || '%')
         AND ($2::text IS NULL OR barrio ILIKE '%' || $2 || '%')
         AND ($3::int IS NULL OR ambientes = $3)
         AND ($4::numeric IS NULL OR precio <= $4)
         AND ($5::text IS NULL OR operacion ILIKE '%' || $5 || '%')`,
      [q, barrio, ambientes, precio_max, operacion]
    );

    res.json({
      properties: result.rows,
      total: parseInt(countResult.rows[0].total),
      offset,
      limit,
    });
  } catch (err: any) {
    console.error('CRM properties error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /crm/api/leads/:contactId — fetch full contact details
router.get('/crm/api/leads/:contactId', async (req, res) => {
  try {
    const contact = await getContactById(req.params.contactId);
    const customFields: any[] = contact.customFields || [];
    res.json({
      contactId: contact.id,
      name: [contact.firstName, contact.lastName].filter(Boolean).join(' ') || contact.name || '',
      phone: contact.phone || '',
      email: contact.email || '',
      score_lead: extractFieldValue(customFields, GHL_FIELD_IDS.score_lead),
      zona: extractFieldValue(customFields, GHL_FIELD_IDS.zona),
      operacion: extractFieldValue(customFields, GHL_FIELD_IDS.operacion),
      presupuesto_ia: extractFieldValue(customFields, GHL_FIELD_IDS.presupuesto_ia),
      ambientes: extractFieldValue(customFields, GHL_FIELD_IDS.ambientes),
      propiedad_tokko_id: extractFieldValue(customFields, GHL_FIELD_IDS.propiedad_tokko_id),
      titulo_propiedad: extractFieldValue(customFields, GHL_FIELD_IDS.titulo_propiedad),
      precio_propiedad: extractFieldValue(customFields, GHL_FIELD_IDS.precio_propiedad),
      ubicacion_propiedad: extractFieldValue(customFields, GHL_FIELD_IDS.ubicacion_propiedad),
      link_propiedad: extractFieldValue(customFields, GHL_FIELD_IDS.link_propiedad),
    });
  } catch (err: any) {
    console.error('CRM lead detail error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /crm/api/leads/:contactId/assign — assign property to lead
router.post('/crm/api/leads/:contactId/assign', async (req, res) => {
  try {
    const { contactId } = req.params;
    const { tokko_id, titulo, precio, moneda, link, ubicacion } = req.body;
    if (!tokko_id) return res.status(400).json({ error: 'tokko_id required' });

    const precioStr = precio ? `${moneda || 'USD'} ${Number(precio).toLocaleString('es-AR')}` : '';

    await updateContactFields(contactId, [
      { id: GHL_FIELD_IDS.propiedad_tokko_id, field_value: String(tokko_id) },
      { id: GHL_FIELD_IDS.titulo_propiedad, field_value: titulo || '' },
      { id: GHL_FIELD_IDS.propiedad_de_interes, field_value: titulo || '' },
      { id: GHL_FIELD_IDS.precio_propiedad, field_value: precioStr },
      { id: GHL_FIELD_IDS.ubicacion_propiedad, field_value: ubicacion || '' },
      { id: GHL_FIELD_IDS.link_propiedad, field_value: link || '' },
    ]);

    res.json({ success: true, contactId, tokko_id });
  } catch (err: any) {
    console.error('CRM assign error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /crm/api/leads/:contactId/assign — clear property from lead
router.delete('/crm/api/leads/:contactId/assign', async (req, res) => {
  try {
    const { contactId } = req.params;
    await updateContactFields(contactId, [
      { id: GHL_FIELD_IDS.propiedad_tokko_id, field_value: '' },
      { id: GHL_FIELD_IDS.titulo_propiedad, field_value: '' },
      { id: GHL_FIELD_IDS.propiedad_de_interes, field_value: '' },
      { id: GHL_FIELD_IDS.precio_propiedad, field_value: '' },
      { id: GHL_FIELD_IDS.ubicacion_propiedad, field_value: '' },
      { id: GHL_FIELD_IDS.link_propiedad, field_value: '' },
    ]);
    res.json({ success: true });
  } catch (err: any) {
    console.error('CRM clear assign error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
