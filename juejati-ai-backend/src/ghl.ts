import dotenv from 'dotenv';
dotenv.config();

const GHL_API_BASE = 'https://services.leadconnectorhq.com';
const headers = {
  'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
  'Version': '2021-07-28',
  'Content-Type': 'application/json',
};

export async function getConversationHistory(contactId: string, limit = 20) {
  const url = `${GHL_API_BASE}/conversations/messages?contactId=${contactId}&limit=${limit}&sortOrder=desc`;
  const res = await fetch(url, { method: 'GET', headers });
  if (!res.ok) throw new Error(`GHL Error fetching history: ${res.statusText}`);
  const data = await res.json();
  return data.messages || [];
}

export async function sendMessage(contactId: string, message: string) {
  const url = `${GHL_API_BASE}/conversations/messages`;
  // We need the conversationId, but GHL v2 lets you send via channel/contact sometimes 
  // For safety, assume custom mapping or fetch conversationId first. 
  // Let's assume we find it or have it from the webhook.
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
