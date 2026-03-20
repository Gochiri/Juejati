import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { runAgent } from './agent.js';
import { getConversationHistory, sendMessage } from './ghl.js';
import { syncProperties } from './sync.js';
import { CoreMessage } from 'ai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

// Webhook endpoint for GoHighLevel
app.post('/webhook/ghl', async (req, res) => {
  try {
    const payload = req.body;
    
    // GHL sends type, contact_id, message, etc.
    const contactId = payload.contact_id;
    const phone = payload.phone || '';
    const messageBody = payload.body || payload.message?.body;
    // Use numeric type from message object (20=WhatsApp, 1=SMS)
    const msgNumType = payload.message?.type;
    const channel = String(msgNumType ?? payload.type ?? payload.channel ?? 'WhatsApp');

    if (!contactId || !messageBody) {
      return res.status(400).send('Missing contact_id or message body');
    }

    console.log(`📩 [${channel}] Message from ${contactId}: ${messageBody}`);

    // Acknowledge webhook quickly to avoid GHL retries
    res.status(200).send({ success: true });

    // 1. Fetch History
    const rawHistory = await getConversationHistory(contactId, 10);
    
    // Convert GHL history to Vercel AI SDK format
    const history: CoreMessage[] = rawHistory.reverse().map((msg: any) => ({
      role: msg.direction === 'inbound' ? 'user' : 'assistant',
      content: msg.body || msg.messageText || ''
    })).filter((m: CoreMessage) => m.content !== '');

    // 2. Run Agent
    console.log(`🤖 Running agent for ${contactId}...`);
    const { text: agentResponse, images } = await runAgent(contactId, history, messageBody);
    console.log(`🖼️ Images extracted: ${images.length} - ${JSON.stringify(images)}`);

    // 3. Send text response to GHL
    await sendMessage(contactId, agentResponse, channel, phone);

    // 4. Send images as separate attachment-only messages (more reliable for WhatsApp)
    for (const imageUrl of images) {
      try {
        await sendMessage(contactId, '', channel, phone, [imageUrl]);
        console.log(`🖼️ Sent image: ${imageUrl}`);
      } catch (imgErr) {
        console.error(`❌ Failed to send image ${imageUrl}:`, imgErr);
      }
    }

    console.log(`✅ Successfully replied to ${contactId} via ${channel}`);
  } catch (err) {
    console.error('❌ Error handling webhook:', err);
    // If we hadn't already sent a response, we would do it here.
  }
});

app.get('/health', (req, res) => {
  res.send('Juejati AI Backend is running.');
});

// Sync manual: POST /sync (proteger con un secret en producción)
let syncRunning = false;
app.post('/sync', async (_req, res) => {
  if (syncRunning) {
    return res.status(409).json({ error: 'Sync already running' });
  }
  syncRunning = true;
  try {
    const result = await syncProperties();
    res.json({ success: true, ...result });
  } catch (err: any) {
    console.error('❌ Sync error:', err);
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
  } catch (err) {
    console.error('❌ Scheduled sync error:', err);
  } finally {
    syncRunning = false;
  }
}, SYNC_INTERVAL_MS);

app.listen(PORT, () => {
  console.log(`🚀 AI Backend listening on port ${PORT}`);
  console.log(`🔄 Property sync scheduled every 6 hours`);
});
