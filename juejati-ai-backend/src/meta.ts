import dotenv from 'dotenv';
dotenv.config();

const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || '';
const META_PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID || '';
const META_API_VERSION = process.env.META_API_VERSION || 'v22.0';

export interface FollowupTemplateVars {
  nombre: string;
  cantidad: string;
  tipo: string;
  zona: string;
}

export async function sendFollowupTemplate(
  toPhone: string,
  vars: FollowupTemplateVars
): Promise<any> {
  if (!META_ACCESS_TOKEN || !META_PHONE_NUMBER_ID) {
    throw new Error('META_ACCESS_TOKEN and META_PHONE_NUMBER_ID are required');
  }

  const phone = toPhone.replace(/^\+/, '');

  const res = await fetch(
    `https://graph.facebook.com/${META_API_VERSION}/${META_PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${META_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'template',
        template: {
          name: '1_seguimiento',
          language: { code: 'es_AR' },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: vars.nombre },
                { type: 'text', text: vars.cantidad },
                { type: 'text', text: vars.tipo },
                { type: 'text', text: vars.zona },
              ],
            },
          ],
        },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Meta API error ${res.status}: ${body}`);
  }
  return res.json();
}
