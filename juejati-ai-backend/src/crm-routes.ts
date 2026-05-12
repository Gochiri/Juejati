import { Router, Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db.js';
import { updateContactFields, getContactById, getConversationHistory } from './ghl.js';

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

const GHL_HEADERS = {
  'Authorization': `Bearer ${ghlApiKey}`,
  'Version': '2021-07-28',
  'Content-Type': 'application/json',
};

function mapOpportunity(opp: any) {
  const contact = opp.contact || {};
  const customFields: any[] = [
    ...(Array.isArray(opp.customFields) ? opp.customFields : []),
    ...(Array.isArray(contact.customFields) ? contact.customFields : []),
  ];
  return {
    opportunityId: opp.id,
    contactId: contact.id || opp.contactId,
    name: contact.name || [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'Sin nombre',
    phone: contact.phone || '',
    stage: opp.stage?.name || opp.pipelineStage || '',
    source: opp.source || contact.source || null,
    createdAt: opp.createdAt || opp.dateAdded || null,
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
}

// GET /crm/api/leads/property-assignments — Supabase first, GHL contact fallback
router.get('/crm/api/leads/property-assignments', async (req, res) => {
  const ids = String(req.query.contactIds || '').split(',').filter(Boolean).slice(0, 200);
  if (ids.length === 0) return res.json({});

  const assignments: Record<string, any[]> = {};

  // 1. Try Supabase (table may not exist yet)
  try {
    const result = await pool.query(
      `SELECT contact_id, tokko_id, titulo, precio, ubicacion, link
       FROM lead_property_assignments
       WHERE contact_id = ANY($1)
       ORDER BY assigned_at ASC`,
      [ids]
    );
    for (const row of result.rows) {
      if (!assignments[row.contact_id]) assignments[row.contact_id] = [];
      assignments[row.contact_id].push({
        tokko_id: row.tokko_id,
        titulo: row.titulo,
        precio: row.precio,
        ubicacion: row.ubicacion,
        link: row.link,
      });
    }
  } catch {
    // Table doesn't exist yet — will fall through to GHL for all contacts
  }

  // 2. For contacts not in Supabase, fall back to individual GHL contact fetch
  const missing = ids.filter(id => !assignments[id]);
  if (missing.length > 0) {
    await Promise.all(missing.map(async (contactId) => {
      try {
        const contact = await getContactById(contactId);
        const cf: any[] = contact.customFields || [];
        const tokkoId = extractFieldValue(cf, GHL_FIELD_IDS.propiedad_tokko_id);
        if (tokkoId) {
          assignments[contactId] = [{
            tokko_id: tokkoId,
            titulo:   extractFieldValue(cf, GHL_FIELD_IDS.titulo_propiedad)   || '',
            precio:   extractFieldValue(cf, GHL_FIELD_IDS.precio_propiedad)   || '',
            ubicacion: extractFieldValue(cf, GHL_FIELD_IDS.ubicacion_propiedad) || '',
            link:     extractFieldValue(cf, GHL_FIELD_IDS.link_propiedad)     || '',
          }];
        }
      } catch {}
    }));
  }

  res.json(assignments);
});

// GET /crm/api/leads/activity — batch last-message per contact from message_log
router.get('/crm/api/leads/activity', async (req, res) => {
  try {
    const ids = String(req.query.contactIds || '').split(',').filter(Boolean).slice(0, 200);
    if (ids.length === 0) return res.json({});
    const result = await pool.query(
      `SELECT contact_id,
              MAX(created_at) AS last_message_at,
              (array_agg(direction ORDER BY created_at DESC))[1] AS last_direction
       FROM message_log
       WHERE contact_id = ANY($1)
       GROUP BY contact_id`,
      [ids]
    );
    const activity: Record<string, any> = {};
    for (const row of result.rows) {
      activity[row.contact_id] = {
        lastMessageAt: row.last_message_at,
        lastDirection: row.last_direction,
      };
    }
    res.json(activity);
  } catch (err: any) {
    console.error('CRM activity error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /crm/api/leads — fetch GHL opportunities with pagination + server-side search
router.get('/crm/api/leads', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 100);
    const page = parseInt(req.query.page as string) || 1;
    const query = (req.query.q as string || '').trim();

    let url: string;
    if (query) {
      // Server-side search via GHL contacts search, then filter opportunities
      url = `${GHL_API_BASE}/contacts/?locationId=${ghlLocationId}&query=${encodeURIComponent(query)}&limit=${limit}`;
      const searchRes = await fetch(url, { method: 'GET', headers: GHL_HEADERS });
      if (!searchRes.ok) {
        const body = await searchRes.text();
        throw new Error(`GHL Search Error: ${searchRes.status} - ${body}`);
      }
      const searchData = await searchRes.json();
      const contacts = searchData.contacts || [];
      // For each contact found, fetch their opportunity
      const leads = contacts.map((c: any) => ({
        opportunityId: '',
        contactId: c.id,
        name: [c.firstName, c.lastName].filter(Boolean).join(' ') || c.name || 'Sin nombre',
        phone: c.phone || '',
        stage: '',
        score_lead: extractFieldValue(c.customFields || [], GHL_FIELD_IDS.score_lead),
        zona: extractFieldValue(c.customFields || [], GHL_FIELD_IDS.zona),
        operacion: extractFieldValue(c.customFields || [], GHL_FIELD_IDS.operacion),
        presupuesto_ia: extractFieldValue(c.customFields || [], GHL_FIELD_IDS.presupuesto_ia),
        ambientes: extractFieldValue(c.customFields || [], GHL_FIELD_IDS.ambientes),
        propiedad_tokko_id: extractFieldValue(c.customFields || [], GHL_FIELD_IDS.propiedad_tokko_id),
        titulo_propiedad: extractFieldValue(c.customFields || [], GHL_FIELD_IDS.titulo_propiedad),
        precio_propiedad: extractFieldValue(c.customFields || [], GHL_FIELD_IDS.precio_propiedad),
        ubicacion_propiedad: extractFieldValue(c.customFields || [], GHL_FIELD_IDS.ubicacion_propiedad),
        link_propiedad: extractFieldValue(c.customFields || [], GHL_FIELD_IDS.link_propiedad),
      }));
      return res.json({ leads, total: searchData.meta?.total || leads.length, page, hasMore: false });
    }

    url = `${GHL_API_BASE}/opportunities/search?location_id=${ghlLocationId}&limit=${limit}&page=${page}`;
    const ghlRes = await fetch(url, { method: 'GET', headers: GHL_HEADERS });
    if (!ghlRes.ok) {
      const body = await ghlRes.text();
      throw new Error(`GHL Error: ${ghlRes.status} ${body}`);
    }
    const data = await ghlRes.json();
    const opportunities = data.opportunities || [];
    const total = data.meta?.total || opportunities.length;
    const hasMore = page * limit < total;

    const leads = opportunities.map(mapOpportunity);

    res.json({ leads, total, page, hasMore });
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

// GET /crm/api/leads/:contactId/messages — fetch conversation history from GHL
router.get('/crm/api/leads/:contactId/messages', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const msgs = await getConversationHistory(req.params.contactId, limit);
    // Normalize to consistent shape
    const messages = msgs.map((m: any) => ({
      id: m.id,
      direction: m.direction || (m.messageType === 'TYPE_INCOMING' ? 'inbound' : 'outbound'),
      body: m.body || m.messageText || m.text || '',
      channel: m.channel || m.type || '',
      createdAt: m.dateAdded || m.createdAt || m.date_added || null,
    })).filter((m: any) => m.body);
    res.json(messages);
  } catch (err: any) {
    console.error('CRM messages error:', err.message);
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

// POST /crm/api/leads/:contactId/assign — add property to lead (multi-property)
router.post('/crm/api/leads/:contactId/assign', async (req, res) => {
  try {
    const { contactId } = req.params;
    const { tokko_id, titulo, precio, moneda, link, ubicacion } = req.body;
    if (!tokko_id) return res.status(400).json({ error: 'tokko_id required' });

    const precioStr = precio ? `${moneda || 'USD'} ${Number(precio).toLocaleString('es-AR')}` : '';

    await pool.query(
      `INSERT INTO lead_property_assignments (contact_id, tokko_id, titulo, precio, ubicacion, link)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (contact_id, tokko_id) DO NOTHING`,
      [contactId, String(tokko_id), titulo || '', precioStr, ubicacion || '', link || '']
    );

    // Sync GHL: propiedad_de_interes = all titles, propiedad_tokko_id = most recent
    const all = await pool.query(
      `SELECT titulo, tokko_id FROM lead_property_assignments WHERE contact_id = $1 ORDER BY assigned_at ASC`,
      [contactId]
    );
    const titulos = all.rows.map((r: any) => r.titulo).filter(Boolean).join('\n');
    await updateContactFields(contactId, [
      { id: GHL_FIELD_IDS.propiedad_de_interes, field_value: titulos },
      { id: GHL_FIELD_IDS.propiedad_tokko_id, field_value: String(tokko_id) },
    ]);

    res.json({ success: true, contactId, tokko_id });
  } catch (err: any) {
    console.error('CRM assign error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /crm/api/leads/:contactId/assign/:tokkoId — remove specific property from lead
router.delete('/crm/api/leads/:contactId/assign/:tokkoId', async (req, res) => {
  try {
    const { contactId, tokkoId } = req.params;

    await pool.query(
      `DELETE FROM lead_property_assignments WHERE contact_id = $1 AND tokko_id = $2`,
      [contactId, tokkoId]
    );

    const remaining = await pool.query(
      `SELECT titulo, tokko_id FROM lead_property_assignments WHERE contact_id = $1 ORDER BY assigned_at ASC`,
      [contactId]
    );
    const titulos = remaining.rows.map((r: any) => r.titulo).filter(Boolean).join('\n');
    const lastId = remaining.rows.at(-1)?.tokko_id || '';

    await updateContactFields(contactId, [
      { id: GHL_FIELD_IDS.propiedad_de_interes, field_value: titulos },
      { id: GHL_FIELD_IDS.propiedad_tokko_id, field_value: lastId },
    ]);

    res.json({ success: true });
  } catch (err: any) {
    console.error('CRM remove assignment error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /crm/api/leads/:contactId/assign — clear ALL properties from lead (legacy/fallback)
router.delete('/crm/api/leads/:contactId/assign', async (req, res) => {
  try {
    const { contactId } = req.params;
    await pool.query(`DELETE FROM lead_property_assignments WHERE contact_id = $1`, [contactId]);
    await updateContactFields(contactId, [
      { id: GHL_FIELD_IDS.propiedad_tokko_id, field_value: '' },
      { id: GHL_FIELD_IDS.propiedad_de_interes, field_value: '' },
    ]);
    res.json({ success: true });
  } catch (err: any) {
    console.error('CRM clear all assign error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
