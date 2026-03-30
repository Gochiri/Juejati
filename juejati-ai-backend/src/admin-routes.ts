import { Router, Request, Response, NextFunction } from 'express';
import { getConfig, setConfig, getRecentMessages, getRecentErrors, getConversationContacts, getConversation, getUsageStats } from './admin-db.js';
import { pool } from './db.js';

const router = Router();
const serverStartTime = Date.now();

// Basic auth middleware
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

router.use('/admin', basicAuth);

// Health / status
router.get('/admin/api/health', async (_req, res) => {
  let dbOk = false;
  try {
    await pool.query('SELECT 1');
    dbOk = true;
  } catch {}

  const mem = process.memoryUsage();
  res.json({
    status: 'running',
    uptime_seconds: Math.floor((Date.now() - serverStartTime) / 1000),
    memory_mb: Math.round(mem.rss / 1024 / 1024),
    db_connected: dbOk,
  });
});

// Recent messages
router.get('/admin/api/messages', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
  const messages = await getRecentMessages(limit);
  res.json(messages);
});

// Recent errors
router.get('/admin/api/errors', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
  const errors = await getRecentErrors(limit);
  res.json(errors);
});

// Conversations list
router.get('/admin/api/conversations', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 30, 100);
  const contacts = await getConversationContacts(limit);
  res.json(contacts);
});

// Single conversation
router.get('/admin/api/conversations/:contactId', async (req, res) => {
  const messages = await getConversation(req.params.contactId);
  res.json(messages);
});

// Get system prompt
router.get('/admin/api/prompt', async (_req, res) => {
  const prompt = await getConfig('system_prompt');
  res.json({ value: prompt || '' });
});

// Update system prompt
router.put('/admin/api/prompt', async (req, res) => {
  const { value } = req.body;
  if (!value || typeof value !== 'string') {
    return res.status(400).json({ error: 'Missing prompt value' });
  }
  await setConfig('system_prompt', value);
  res.json({ success: true });
});

// Get model
router.get('/admin/api/model', async (_req, res) => {
  const model = await getConfig('openai_model');
  res.json({ value: model || 'gpt-5.2-mini' });
});

// Update model
router.put('/admin/api/model', async (req, res) => {
  const { value } = req.body;
  if (!value || typeof value !== 'string') {
    return res.status(400).json({ error: 'Missing model value' });
  }
  await setConfig('openai_model', value);
  res.json({ success: true });
});

// Usage / cost stats
router.get('/admin/api/usage', async (_req, res) => {
  const usage = await getUsageStats();
  res.json(usage);
});

// Stats
router.get('/admin/api/stats', async (_req, res) => {
  const [propCount, activeCount, msgCount, errCount] = await Promise.all([
    pool.query('SELECT COUNT(*) as total FROM propiedades_v2'),
    pool.query('SELECT COUNT(*) as total FROM propiedades_v2 WHERE activa = true'),
    pool.query('SELECT COUNT(*) as total FROM message_log'),
    pool.query('SELECT COUNT(*) as total FROM error_log WHERE created_at > now() - interval \'24 hours\''),
  ]);

  res.json({
    properties_total: parseInt(propCount.rows[0].total),
    properties_active: parseInt(activeCount.rows[0].total),
    messages_total: parseInt(msgCount.rows[0].total),
    errors_last_24h: parseInt(errCount.rows[0].total),
  });
});

export default router;
