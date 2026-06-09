import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { runAgent } from './agent.js';
import { getConversationHistory, sendMessage } from './ghl.js';
import { syncProperties } from './sync.js';
import { runFollowupCron, generateFollowupPhrase } from './followup.js';
import { logMessage, logError, initAdminTables, saveContactName } from './admin-db.js';
import { getContactName } from './ghl.js';
import adminRouter from './admin-routes.js';
import crmRouter from './crm-routes.js';
import { CoreMessage } from 'ai';

dotenv.config();

// Validate required environment variables
const REQUIRED_ENV = ['GHL_API_KEY', 'GHL_LOCATION_ID', 'GHL_FROM_NUMBER', 'OPENAI_API_KEY', 'DATABASE_URL'] as const;
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length > 0) {
  console.error(`❌ Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json());

// Admin dashboard routes (API + static files)
app.use(adminRouter);
app.use('/admin', express.static(path.join(__dirname, '..', 'public')));

// CRM frontend routes
app.use(crmRouter);

const PORT = process.env.PORT || 4000;

// Webhook endpoint for GoHighLevel
app.post('/webhook/ghl', (req, res) => {
  const payload = req.body;
  const contactId = payload.contact_id;
  const phone = payload.phone || '';
  const messageBody = payload.body || payload.message?.body;
  const msgNumType = payload.message?.type;
  const channel = String(msgNumType ?? payload.type ?? payload.channel ?? 'WhatsApp');

  if (!contactId || !messageBody) {
    return res.status(400).send('Missing contact_id or message body');
  }

  console.log(`📩 [${channel}] Message from ${contactId}: ${messageBody}`);

  // Acknowledge immediately before any async work
  res.status(200).send({ success: true });

  (async () => {
    try {
      logMessage(contactId, 'inbound', messageBody, channel).catch(() => {});
      getContactName(contactId).then(name => {
        if (name) saveContactName(contactId, name).catch(() => {});
      }).catch(() => {});

      const rawHistory = await getConversationHistory(contactId, 10);
      const history: CoreMessage[] = rawHistory.reverse().map((msg: any) => ({
        role: msg.direction === 'inbound' ? 'user' : 'assistant',
        content: msg.body || msg.messageText || ''
      })).filter((m: CoreMessage) => m.content !== '');

      console.log(`🤖 Running agent for ${contactId}...`);
      const { text: agentResponse, images } = await runAgent(contactId, history, messageBody);
      console.log(`🃏 Cards to send: ${images.length}`);

      // Send property cards first (image + caption), then the follow-up question
      for (const card of images) {
        try {
          await sendMessage(contactId, card.caption, channel, phone, card.url ? [card.url] : []);
          console.log(`🃏 Sent card: ${card.url || '(no image)'}`);
        } catch (cardErr: any) {
          console.error(`❌ Failed to send card: ${cardErr.message}`, cardErr.stack);
        }
      }

      if (agentResponse.trim()) {
        await sendMessage(contactId, agentResponse, channel, phone);
      } else {
        console.warn(`⚠️ Agent returned empty text for ${contactId}, skipping text message`);
      }

      logMessage(contactId, 'outbound', agentResponse, channel, images.map(c => c.url).filter(Boolean) as string[]).catch(() => {});
      console.log(`✅ Successfully replied to ${contactId} via ${channel}`);
    } catch (err: any) {
      console.error('❌ Error in webhook background processing:', err.message, err.stack);
      logError('webhook', err.message, err.stack).catch(() => {});
    }
  })();
});

// Endpoint to handle Follow-Up for stale opportunities
// Endpoint legacy — NEUTRALIZADO. Antes generaba y ENVIABA texto libre vía
// sendMessage() (fallaba fuera de la ventana de 24h de WhatsApp). Ahora se comporta
// como /api/followup-phrase: solo genera y escribe la frase en el custom field, sin
// enviar. Así, si algún workflow viejo sigue apuntando acá, no manda mensajes rotos.
app.post('/api/followup', async (req, res) => {
  const body = req.body || {};
  const contactId = body.contact_id || body.contactId || body.contactID;
  if (!contactId) {
    return res.status(400).json({ error: 'Missing contact_id' });
  }
  try {
    const result = await generateFollowupPhrase(contactId);
    res.json({ success: true, ...result });
  } catch (err: any) {
    console.error('❌ Follow-up (legacy) error:', err);
    logError('followup', err.message, err.stack, { contactId }).catch(() => {});
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (req, res) => {
  res.send('Juejati AI Backend is running.');
});

// Sync manual: POST /sync
let syncRunning = false;
app.post('/sync', async (_req, res) => {
  const token = _req.headers.authorization?.replace('Bearer ', '');
  if (!process.env.SYNC_SECRET || token !== process.env.SYNC_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (syncRunning) {
    return res.status(409).json({ error: 'Sync already running' });
  }
  syncRunning = true;
  try {
    const result = await syncProperties();
    res.json({ success: true, ...result });
  } catch (err: any) {
    console.error('❌ Sync error:', err);
    logError('sync', err.message, err.stack).catch(() => {});
    res.status(500).json({ error: err.message });
  } finally {
    syncRunning = false;
  }
});

// Sync automático cada 6 horas
const SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000;
setInterval(async () => {
  if (syncRunning) return;
  syncRunning = true;
  try {
    console.log('⏰ Scheduled sync starting...');
    await syncProperties();
  } catch (err: any) {
    console.error('❌ Scheduled sync error:', err);
    logError('sync', err.message, err.stack).catch(() => {});
  } finally {
    syncRunning = false;
  }
}, SYNC_INTERVAL_MS);

// Cron de seguimiento de leads: POST /api/followup-cron (disparo manual)
let followupRunning = false;
app.post('/api/followup-cron', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!process.env.SYNC_SECRET || token !== process.env.SYNC_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (followupRunning) {
    return res.status(409).json({ error: 'Follow-up cron already running' });
  }
  followupRunning = true;
  try {
    const summary = await runFollowupCron();
    res.json({ success: true, ...summary });
  } catch (err: any) {
    console.error('❌ Follow-up cron error:', err);
    logError('followup-cron', err.message, err.stack).catch(() => {});
    res.status(500).json({ error: err.message });
  } finally {
    followupRunning = false;
  }
});

// Webhook llamado desde un workflow de GHL antes del paso "Send WhatsApp".
// Analiza la conversación, escribe la frase ({{2}}) en el custom field y devuelve
// los valores para que el workflow los mapee/condicione. Responde sincrónicamente
// para que el custom field ya esté escrito cuando el workflow envíe la plantilla.
app.post('/api/followup-phrase', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!process.env.SYNC_SECRET || token !== process.env.SYNC_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const body = req.body || {};
  const contactId = body.contact_id || body.contactId || body.contactID;
  if (!contactId) {
    return res.status(400).json({ error: 'Missing contact_id' });
  }
  try {
    const result = await generateFollowupPhrase(contactId);
    res.json({ success: true, ...result });
  } catch (err: any) {
    console.error('❌ Follow-up phrase error:', err);
    logError('followup-phrase', err.message, err.stack, { contactId }).catch(() => {});
    res.status(500).json({ error: err.message });
  }
});

// Cron de seguimiento automático
const FOLLOWUP_ENABLED = process.env.FOLLOWUP_ENABLED === 'true';
const FOLLOWUP_INTERVAL_MS = (Number(process.env.FOLLOWUP_INTERVAL_HOURS) || 3) * 60 * 60 * 1000;
if (FOLLOWUP_ENABLED) {
  setInterval(async () => {
    if (followupRunning) return;
    followupRunning = true;
    try {
      console.log('⏰ Scheduled follow-up cron starting...');
      await runFollowupCron();
    } catch (err: any) {
      console.error('❌ Scheduled follow-up error:', err);
      logError('followup-cron', err.message, err.stack).catch(() => {});
    } finally {
      followupRunning = false;
    }
  }, FOLLOWUP_INTERVAL_MS);
}

// Initialize admin tables and start server
initAdminTables()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 AI Backend listening on port ${PORT}`);
      console.log(`🔄 Property sync scheduled every 6 hours`);
      console.log(
        FOLLOWUP_ENABLED
          ? `📨 Follow-up cron scheduled every ${FOLLOWUP_INTERVAL_MS / 3_600_000}h`
          : `📨 Follow-up cron disabled (set FOLLOWUP_ENABLED=true to enable)`
      );
    });
  })
  .catch((err) => {
    console.error('❌ Failed to initialize admin tables:', err.message);
    process.exit(1);
  });
