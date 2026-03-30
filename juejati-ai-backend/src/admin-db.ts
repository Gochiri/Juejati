import { pool } from './db.js';

export async function getConfig(key: string): Promise<string | null> {
  const res = await pool.query('SELECT value FROM system_config WHERE key = $1', [key]);
  return res.rows.length > 0 ? res.rows[0].value : null;
}

export async function setConfig(key: string, value: string): Promise<void> {
  await pool.query(
    `INSERT INTO system_config (key, value, updated_at) VALUES ($1, $2, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [key, value]
  );
}

export async function logMessage(contactId: string, direction: string, body: string, channel: string, images: string[] = []) {
  await pool.query(
    'INSERT INTO message_log (contact_id, direction, body, channel, images) VALUES ($1, $2, $3, $4, $5::jsonb)',
    [contactId, direction, body, channel, JSON.stringify(images)]
  );
}

export async function logError(source: string, message: string, stack?: string, metadata?: Record<string, any>) {
  await pool.query(
    'INSERT INTO error_log (source, message, stack, metadata) VALUES ($1, $2, $3, $4::jsonb)',
    [source, message, stack || null, JSON.stringify(metadata || {})]
  );
}

export async function getRecentMessages(limit = 50) {
  const res = await pool.query(
    'SELECT id, contact_id, direction, body, channel, images, created_at FROM message_log ORDER BY created_at DESC LIMIT $1',
    [limit]
  );
  return res.rows;
}

export async function getRecentErrors(limit = 50) {
  const res = await pool.query(
    'SELECT id, source, message, stack, metadata, created_at FROM error_log ORDER BY created_at DESC LIMIT $1',
    [limit]
  );
  return res.rows;
}
