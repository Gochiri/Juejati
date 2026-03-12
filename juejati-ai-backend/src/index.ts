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

    if (!contactId || !messageBody) {
      return res.status(400).send('Missing contact_id or message body');
    }

    console.log(`Received message from ${contactId}: ${messageBody}`);

    // Acknowledge webhook quickly to avoid GHL retries
    res.status(200).send({ success: true });

    // 1. Fetch History
    const rawHistory = await getConversationHistory(contactId, 10);
    
    // Convert GHL history to Vercel AI SDK format
    const history: CoreMessage[] = rawHistory.reverse().map((msg: any) => ({
      role: msg.direction === 'inbound' ? 'user' : 'assistant',
      content: msg.body || msg.messageText || ''
    }));

    // 2. Run Agent
    const agentResponse = await runAgent(contactId, history, messageBody);

    // 3. Send Response back to GHL
    await sendMessage(contactId, agentResponse);

    console.log(`Successfully replied to ${contactId}`);
  } catch (err) {
    console.error('Error handling webhook:', err);
    // If we hadn't already sent a response, we would do it here.
  }
});

app.get('/health', (req, res) => {
  res.send('Juejati AI Backend is running.');
});

app.listen(PORT, () => {
  console.log(`🚀 AI Backend listening on port ${PORT}`);
});
