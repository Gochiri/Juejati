import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { runAgent, handleStaleOpportunity } from './agent.js';
import { getConversationHistory, sendMessage } from './ghl.js';
import { syncProperties } from './sync.js';
import { logMessage, logError, initAdminTables, saveContactName } from './admin-db.js';
import { getContactName } from './ghl.js';
import adminRouter from './admin-routes.js';
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
      console.log(`🖼️ Images extracted: ${images.length} - ${JSON.stringify(images)}`);

      if (agentResponse.trim()) {
        await sendMessage(contactId, agentResponse, channel, phone);
      } else {
        console.warn(`⚠️ Agent returned empty text for ${contactId}, skipping text message`);
      }

      for (const imageUrl of images) {
        try {
          await sendMessage(contactId, '', channel, phone, [imageUrl]);
          console.log(`🖼️ Sent image: ${imageUrl}`);
        } catch (imgErr: any) {
          console.error(`❌ Failed to send image ${imageUrl}: ${imgErr.message}`, imgErr.stack);
        }
      }

      logMessage(contactId, 'outbound', agentResponse, channel, images).catch(() => {});
      console.log(`✅ Successfully replied to ${contactId} via ${channel}`);
    } catch (err: any) {
      console.error('❌ Error in webhook background processing:', err.message, err.stack);
      logError('webhook', err.message, err.stack).catch(() => {});
    }
  })();
});

// Endpoint to handle Follow-Up for stale opportunities
app.post('/api/followup', async (req, res) => {
  try {
    const payload = req.body;
    const contactId = payload.contact_id;
    const phone = payload.phone || '';
    const channel = payload.channel || 'WhatsApp'; // Default if not provided

    if (!contactId) {
      return res.status(400).send({ error: 'Missing contact_id' });
    }

    console.log(`⏳ Handling stale opportunity for contact ${contactId} via ${channel}`);

    // Acknowledge quickly to GHL Workflow
    res.status(200).send({ success: true, message: 'Follow-up process started' });

    // 1. Fetch History
    const rawHistory = await getConversationHistory(contactId, 10);

    // Convert GHL history to Vercel AI SDK format
    const history: CoreMessage[] = rawHistory.reverse().map((msg: any) => ({
      role: msg.direction === 'inbound' ? 'user' : 'assistant',
      content: msg.body || msg.messageText || ''
    })).filter((m: CoreMessage) => m.content !== '');

    // 2. Generate Follow-up via LLM
    console.log(`🤖 Generating follow-up for ${contactId}...`);
    const { text: followUpMessage } = await handleStaleOpportunity(contactId, history);

    // 3. Send text response to GHL
    await sendMessage(contactId, followUpMessage, channel, phone);
    logMessage(contactId, 'outbound', followUpMessage, channel).catch(() => {});

    console.log(`✅ Successfully sent follow-up to ${contactId}`);
  } catch (err: any) {
    console.error('❌ Error handling follow-up:', err);
    logError('followup', err.message, err.stack).catch(() => {});
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

// Initialize admin tables and start server
initAdminTables()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 AI Backend listening on port ${PORT}`);
      console.log(`🔄 Property sync scheduled every 6 hours`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to initialize admin tables:', err.message);
    process.exit(1);
  });
