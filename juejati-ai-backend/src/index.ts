import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { runAgent } from './agent.js';
import { getConversationHistory, sendMessage } from './ghl.js';
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
    const messageBody = payload.body || payload.message?.body;
    const channel = payload.type || payload.channel || 'WhatsApp';

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
    const agentResponse = await runAgent(contactId, history, messageBody);

    // 3. Send Response back to GHL
    await sendMessage(contactId, agentResponse, channel);

    console.log(`✅ Successfully replied to ${contactId} via ${channel}`);
  } catch (err) {
    console.error('❌ Error handling webhook:', err);
    // If we hadn't already sent a response, we would do it here.
  }
});

app.get('/health', (req, res) => {
  res.send('Juejati AI Backend is running.');
});

app.listen(PORT, () => {
  console.log(`🚀 AI Backend listening on port ${PORT}`);
});
