import { pool } from './db.js';

export async function initAdminTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS system_config (
      id SERIAL PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS message_log (
      id BIGSERIAL PRIMARY KEY,
      contact_id TEXT NOT NULL,
      direction TEXT NOT NULL,
      body TEXT,
      channel TEXT,
      images JSONB DEFAULT '[]',
      created_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS usage_log (
      id BIGSERIAL PRIMARY KEY,
      contact_id TEXT,
      model TEXT NOT NULL,
      prompt_tokens INT DEFAULT 0,
      completion_tokens INT DEFAULT 0,
      total_tokens INT DEFAULT 0,
      estimated_cost_usd NUMERIC(10,6) DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_usage_log_created_at ON usage_log (created_at);
    CREATE TABLE IF NOT EXISTS contact_names (
      contact_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS error_log (
      id BIGSERIAL PRIMARY KEY,
      source TEXT NOT NULL,
      message TEXT NOT NULL,
      stack TEXT,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS lead_followups (
      id BIGSERIAL PRIMARY KEY,
      contact_id TEXT NOT NULL,
      conversation_id TEXT,
      attempt INT NOT NULL,
      status TEXT NOT NULL,
      reason TEXT,
      message TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_message_log_created_at ON message_log (created_at);
    CREATE INDEX IF NOT EXISTS idx_message_log_contact_id ON message_log (contact_id);
    CREATE INDEX IF NOT EXISTS idx_error_log_created_at ON error_log (created_at);
    CREATE INDEX IF NOT EXISTS idx_lead_followups_contact ON lead_followups (contact_id);
    CREATE INDEX IF NOT EXISTS idx_lead_followups_created ON lead_followups (created_at);
  `);
  console.log('✅ Admin tables ready');
}

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

export async function getConversationContacts(limit = 30) {
  const res = await pool.query(
    `SELECT contact_id, MAX(created_at) as last_message, COUNT(*) as msg_count
     FROM message_log GROUP BY contact_id ORDER BY last_message DESC LIMIT $1`,
    [limit]
  );
  return res.rows;
}

export async function getConversation(contactId: string) {
  const res = await pool.query(
    'SELECT id, direction, body, channel, images, created_at FROM message_log WHERE contact_id = $1 ORDER BY created_at ASC',
    [contactId]
  );
  return res.rows;
}

export async function logUsage(contactId: string | null, model: string, promptTokens: number, completionTokens: number, costUsd: number) {
  await pool.query(
    'INSERT INTO usage_log (contact_id, model, prompt_tokens, completion_tokens, total_tokens, estimated_cost_usd) VALUES ($1, $2, $3, $4, $5, $6)',
    [contactId, model, promptTokens, completionTokens, promptTokens + completionTokens, costUsd]
  );
}

export async function saveContactName(contactId: string, name: string) {
  await pool.query(
    `INSERT INTO contact_names (contact_id, name, updated_at) VALUES ($1, $2, now())
     ON CONFLICT (contact_id) DO UPDATE SET name = EXCLUDED.name, updated_at = now()`,
    [contactId, name]
  );
}

export async function getContactNames(contactIds: string[]): Promise<Record<string, string>> {
  if (contactIds.length === 0) return {};
  const res = await pool.query(
    'SELECT contact_id, name FROM contact_names WHERE contact_id = ANY($1)',
    [contactIds]
  );
  const map: Record<string, string> = {};
  for (const row of res.rows) {
    map[row.contact_id] = row.name;
  }
  return map;
}

export interface FollowupRow {
  id: number;
  contact_id: string;
  conversation_id: string | null;
  attempt: number;
  status: string;
  reason: string | null;
  message: string | null;
  created_at: string;
}

export async function recordFollowup(
  contactId: string,
  conversationId: string | null,
  attempt: number,
  status: 'sent' | 'skipped',
  reason: string | null,
  message: string | null
) {
  await pool.query(
    `INSERT INTO lead_followups (contact_id, conversation_id, attempt, status, reason, message)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [contactId, conversationId, attempt, status, reason, message]
  );
}

export async function getFollowupHistory(contactId: string): Promise<FollowupRow[]> {
  const res = await pool.query(
    `SELECT id, contact_id, conversation_id, attempt, status, reason, message, created_at
     FROM lead_followups WHERE contact_id = $1 ORDER BY created_at DESC`,
    [contactId]
  );
  return res.rows;
}

export async function getUsageStats() {
  const res = await pool.query(`
    SELECT
      COALESCE(SUM(total_tokens), 0) as total_tokens,
      COALESCE(SUM(estimated_cost_usd), 0) as total_cost_usd,
      COUNT(*) as total_calls,
      COALESCE(SUM(CASE WHEN created_at > now() - interval '24 hours' THEN total_tokens ELSE 0 END), 0) as tokens_24h,
      COALESCE(SUM(CASE WHEN created_at > now() - interval '24 hours' THEN estimated_cost_usd ELSE 0 END), 0) as cost_24h,
      COALESCE(SUM(CASE WHEN created_at > now() - interval '30 days' THEN estimated_cost_usd ELSE 0 END), 0) as cost_30d
    FROM usage_log
  `);
  return res.rows[0];
}
