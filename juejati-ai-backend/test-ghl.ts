import dotenv from 'dotenv';
dotenv.config();

import { getConversationHistory } from './src/ghl';
import { handleStaleOpportunity } from './src/agent';

async function test() {
  try {
    const history = await getConversationHistory('wqyVx7hsvD9WBNXKuHjE', 10);
    console.log('History fetched successfully:', history.length, 'messages');
    
    // Also test agent
    console.log('Testing handleStaleOpportunity...');
    const histFormatted = history.reverse().map((msg: any) => ({
      role: msg.direction === 'inbound' ? 'user' : 'assistant',
      content: msg.body || msg.messageText || ''
    })).filter((m: any) => m.content !== '');
    
    const result = await handleStaleOpportunity('wqyVx7hsvD9WBNXKuHjE', histFormatted);
    console.log('Agent response:', result.text);
    
  } catch (err: any) {
    console.error('ERROR OCCURRED:');
    console.error(err.message);
    if (err.response) {
      console.error(err.response.data);
    }
  }
}

test();
