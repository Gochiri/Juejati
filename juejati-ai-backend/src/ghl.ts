import dotenv from 'dotenv';
dotenv.config();

const GHL_API_BASE = 'https://services.leadconnectorhq.com';
const ghlApiKey = (process.env.GHL_API_KEY || '').replace(/^Bearer\s+/i, '');
const ghlLocationId = process.env.GHL_LOCATION_ID;
const ghlFromNumber = process.env.GHL_FROM_NUMBER;
const headers = {
  'Authorization': `Bearer ${ghlApiKey}`,
  'Version': '2021-07-28',
  'Content-Type': 'application/json',
};

export async function getContactName(contactId: string): Promise<string | null> {
  try {
    const res = await fetch(`${GHL_API_BASE}/contacts/${contactId}`, { method: 'GET', headers });
    if (!res.ok) return null;
    const data = await res.json();
    const contact = data.contact || data;
    const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ');
    return name || contact.name || contact.email || contact.phone || null;
  } catch {
    return null;
  }
}

export async function getConversationHistory(contactId: string, limit = 20) {
  // Step 1: find the conversation for this contact
  const searchRes = await fetch(`${GHL_API_BASE}/conversations/search?contactId=${contactId}&limit=1`, { method: 'GET', headers });
  if (!searchRes.ok) {
    const body = await searchRes.text();
    throw new Error(`GHL Error searching conversation: ${searchRes.status} ${searchRes.statusText} - ${body}`);
  }
  const searchData = await searchRes.json();
  const conversations = searchData.conversations || [];
  if (conversations.length === 0) return [];

  // Step 2: get messages from that conversation
  const conversationId = conversations[0].id;
  const msgRes = await fetch(`${GHL_API_BASE}/conversations/${conversationId}/messages?limit=${limit}`, { method: 'GET', headers });
  if (!msgRes.ok) {
    const body = await msgRes.text();
    throw new Error(`GHL Error fetching messages: ${msgRes.status} ${msgRes.statusText} - ${body}`);
  }
  const msgData = await msgRes.json();
  // GHL returns { messages: { messages: [...] } } or { messages: [...] }
  const msgs = msgData.messages;
  return Array.isArray(msgs) ? msgs : (msgs?.messages || []);
}

// Searches conversations for the location, paginating via the startAfterDate cursor.
// Returns raw conversation objects sorted by last message date (newest first).
export async function searchConversations(opts: {
  lastMessageDirection?: 'inbound' | 'outbound';
  maxConversations?: number;
} = {}): Promise<any[]> {
  const pageLimit = 100;
  const maxConversations = opts.maxConversations ?? 800;
  const all: any[] = [];
  let startAfterDate: number | undefined;

  while (all.length < maxConversations) {
    const params = new URLSearchParams({
      locationId: ghlLocationId || '',
      sortBy: 'last_message_date',
      sort: 'desc',
      status: 'all',
      limit: String(pageLimit),
    });
    if (opts.lastMessageDirection) params.set('lastMessageDirection', opts.lastMessageDirection);
    if (startAfterDate) params.set('startAfterDate', String(startAfterDate));

    const res = await fetch(`${GHL_API_BASE}/conversations/search?${params}`, { method: 'GET', headers });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`GHL Error searching conversations: ${res.status} ${res.statusText} - ${body}`);
    }
    const data = await res.json();
    const conversations: any[] = data.conversations || [];
    if (conversations.length === 0) break;
    all.push(...conversations);
    if (conversations.length < pageLimit) break;

    // Advance the cursor using the last conversation's last-activity date
    const last = conversations[conversations.length - 1];
    const cursor = last.lastMessageDate ?? last.dateUpdated ?? last.dateAdded;
    const cursorMs = typeof cursor === 'number' ? cursor : Date.parse(cursor || '');
    if (!cursorMs || cursorMs === startAfterDate) break;
    startAfterDate = cursorMs;
  }

  return all.slice(0, maxConversations);
}

// Maps GHL conversation channel to send API message type
const GHL_CHANNEL_MAP: Record<string, string> = {
  // Numeric types from message payload
  '1': 'SMS',
  '3': 'Email',
  '19': 'WhatsApp', // WhatsApp API (official integration)
  '20': 'WhatsApp', // WhatsApp QR / Meta
  // Conversation channel strings
  'TYPE_PHONE': 'SMS',
  'TYPE_WHATSAPP': 'WhatsApp',
  'TYPE_EMAIL': 'Email',
  'SMS': 'SMS',
  'WhatsApp': 'WhatsApp',
  'Email': 'Email',
};

async function getOrCreateConversation(contactId: string): Promise<{ id: string; channel: string }> {
  const searchUrl = `${GHL_API_BASE}/conversations/search?contactId=${contactId}&limit=1`;
  const res = await fetch(searchUrl, { method: 'GET', headers });
  if (!res.ok) throw new Error(`GHL Error searching conversations: ${res.statusText}`);
  const data = await res.json();

  if (data.conversations && data.conversations.length > 0) {
    const conv = data.conversations[0];
    return { id: conv.id, channel: conv.channel || conv.type || 'SMS' };
  }

  const createRes = await fetch(`${GHL_API_BASE}/conversations`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ contactId }),
  });
  if (!createRes.ok) throw new Error(`GHL Error creating conversation: ${createRes.statusText}`);
  const created = await createRes.json();
  return { id: created.conversation.id, channel: created.conversation.channel || 'SMS' };
}

export async function sendMessage(contactId: string, message: string, incomingType: string = 'WhatsApp', toNumber: string = '', attachments: string[] = []) {
  const { id: conversationId, channel } = await getOrCreateConversation(contactId);
  const type = GHL_CHANNEL_MAP[incomingType] || GHL_CHANNEL_MAP[channel] || 'WhatsApp';
  console.log(`📤 Sending via conversationId=${conversationId} channel=${channel} incomingType=${incomingType} type=${type}`);

  const payload: Record<string, any> = {
    type,
    conversationId,
    contactId,
    locationId: ghlLocationId,
    fromNumber: ghlFromNumber,
  };
  if (message) payload.message = message;
  if (toNumber) payload.toNumber = toNumber;
  if (attachments.length > 0) payload.attachments = attachments;

  const url = `${GHL_API_BASE}/conversations/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GHL Error sending message: ${res.status} ${res.statusText} - ${body}`);
  }
  return res.json();
}

export async function addContactTag(contactId: string, tag: string) {
  const url = `${GHL_API_BASE}/contacts/${contactId}/tags`;
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ tags: [tag] }),
  });
  if (!res.ok) throw new Error(`GHL Error adding tag: ${res.statusText}`);
  return res.json();
}

export async function updateContactFields(contactId: string, customFields: { id: string, key?: string, field_value: any }[]) {
  const url = `${GHL_API_BASE}/contacts/${contactId}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ customFields }),
  });
  if (!res.ok) throw new Error(`GHL Error updating fields: ${res.statusText}`);
  return res.json();
}

export async function getContactById(contactId: string) {
  const res = await fetch(`${GHL_API_BASE}/contacts/${contactId}`, { method: 'GET', headers });
  if (!res.ok) throw new Error(`GHL Error fetching contact: ${res.statusText}`);
  const data = await res.json();
  return data.contact || data;
}
