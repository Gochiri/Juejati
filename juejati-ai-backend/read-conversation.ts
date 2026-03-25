import dotenv from 'dotenv';
dotenv.config();
import { getConversationHistory } from './src/ghl';
import fs from 'fs';

async function read() {
    try {
        const history = await getConversationHistory('0b4mKTkvQR2ZfHS9LnjS', 20);
        const log = history.reverse().map((msg: any) => {
            const role = msg.direction === 'inbound' ? 'User' : 'Assistant';
            const text = msg.body || msg.messageText || '';
            return `[${role}] ${text}`;
        });
        fs.writeFileSync('conversations.json', JSON.stringify(log, null, 2));
        console.log('Wrote to conversations.json');
    } catch (e: any) {
        console.error('ERROR:', e.message);
    }
}
read();
