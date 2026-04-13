import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

// Load .env from the backend project (sibling folder)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../juejati-ai-backend/.env') });

const GHL_API_BASE = 'https://services.leadconnectorhq.com';
const apiKey = (process.env.GHL_API_KEY || '').replace(/^Bearer\s+/i, '');
const locationId = process.env.GHL_LOCATION_ID || '';

if (!apiKey) {
  process.stderr.write('ERROR: GHL_API_KEY not found in .env\n');
  process.exit(1);
}

const headers = {
  'Authorization': `Bearer ${apiKey}`,
  'Version': '2021-07-28',
  'Content-Type': 'application/json',
};

async function ghlGet(path: string) {
  const res = await fetch(`${GHL_API_BASE}${path}`, { headers });
  if (!res.ok) throw new Error(`GHL ${res.status}: ${await res.text()}`);
  return res.json();
}

async function ghlPost(path: string, body: unknown) {
  const res = await fetch(`${GHL_API_BASE}${path}`, {
    method: 'POST', headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`GHL ${res.status}: ${await res.text()}`);
  return res.json();
}

async function ghlPut(path: string, body: unknown) {
  const res = await fetch(`${GHL_API_BASE}${path}`, {
    method: 'PUT', headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`GHL ${res.status}: ${await res.text()}`);
  return res.json();
}

// ─── MCP Server ───────────────────────────────────────────────────────────────

const server = new McpServer({
  name: 'ghl-mcp',
  version: '1.0.0',
});

// ── ghl_search_contacts ────────────────────────────────────────────────────────
server.tool(
  'ghl_search_contacts',
  'Search GHL contacts by name, email, or phone number',
  {
    query: z.string().describe('Name, email, or phone to search for'),
    limit: z.number().optional().default(10).describe('Max results (default 10)'),
  },
  async ({ query, limit }) => {
    const params = new URLSearchParams({ query, locationId, limit: String(limit) });
    const data = await ghlGet(`/contacts/search/duplicate?${params}`);
    const contacts = (data.contacts || []).map((c: any) => ({
      id: c.id,
      name: [c.firstName, c.lastName].filter(Boolean).join(' ') || c.name,
      email: c.email,
      phone: c.phone,
      tags: c.tags,
    }));
    return { content: [{ type: 'text', text: JSON.stringify(contacts, null, 2) }] };
  }
);

// ── ghl_get_contact ────────────────────────────────────────────────────────────
server.tool(
  'ghl_get_contact',
  'Get full contact details: name, email, phone, tags, and all custom fields',
  {
    contact_id: z.string().describe('GHL contact ID'),
  },
  async ({ contact_id }) => {
    const data = await ghlGet(`/contacts/${contact_id}`);
    const c = data.contact || data;
    const result = {
      id: c.id,
      name: [c.firstName, c.lastName].filter(Boolean).join(' ') || c.name,
      email: c.email,
      phone: c.phone,
      tags: c.tags,
      customFields: c.customFields,
      pipeline: c.opportunities,
      source: c.source,
      createdAt: c.dateAdded,
    };
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

// ── ghl_get_conversations ──────────────────────────────────────────────────────
server.tool(
  'ghl_get_conversations',
  'Get conversation message history for a contact',
  {
    contact_id: z.string().describe('GHL contact ID'),
    limit: z.number().optional().default(20).describe('Number of messages to retrieve'),
  },
  async ({ contact_id, limit }) => {
    // Find conversation
    const searchData = await ghlGet(`/conversations/search?contactId=${contact_id}&limit=1`);
    const conversations = searchData.conversations || [];
    if (conversations.length === 0) {
      return { content: [{ type: 'text', text: 'No conversations found for this contact.' }] };
    }
    const convId = conversations[0].id;
    const msgData = await ghlGet(`/conversations/${convId}/messages?limit=${limit}`);
    const msgs = msgData.messages;
    const messages = (Array.isArray(msgs) ? msgs : (msgs?.messages || [])).map((m: any) => ({
      direction: m.direction,
      body: m.body || m.messageText,
      type: m.type,
      date: m.dateAdded,
    }));
    return { content: [{ type: 'text', text: JSON.stringify(messages, null, 2) }] };
  }
);

// ── ghl_get_pipelines ──────────────────────────────────────────────────────────
server.tool(
  'ghl_get_pipelines',
  'List all GHL pipelines and their stages (useful to get valid stage IDs)',
  {},
  async () => {
    const data = await ghlGet(`/opportunities/pipelines?locationId=${locationId}`);
    const pipelines = (data.pipelines || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      stages: (p.stages || []).map((s: any) => ({ id: s.id, name: s.name })),
    }));
    return { content: [{ type: 'text', text: JSON.stringify(pipelines, null, 2) }] };
  }
);

// ── ghl_get_opportunities ──────────────────────────────────────────────────────
server.tool(
  'ghl_get_opportunities',
  'Get pipeline opportunities for a contact or search across all opportunities',
  {
    contact_id: z.string().optional().describe('Filter by contact ID (optional)'),
    pipeline_id: z.string().optional().describe('Filter by pipeline ID (optional)'),
    stage_id: z.string().optional().describe('Filter by stage ID (optional)'),
    limit: z.number().optional().default(20).describe('Max results'),
  },
  async ({ contact_id, pipeline_id, stage_id, limit }) => {
    const params = new URLSearchParams({ location_id: locationId, limit: String(limit) });
    if (contact_id) params.set('contact_id', contact_id);
    if (pipeline_id) params.set('pipeline_id', pipeline_id);
    if (stage_id) params.set('stage_id', stage_id);
    const data = await ghlGet(`/opportunities/search?${params}`);
    const opps = (data.opportunities || []).map((o: any) => ({
      id: o.id,
      name: o.name,
      status: o.status,
      stage: o.pipelineStageId,
      pipeline: o.pipelineId,
      contact: o.contact?.name || o.contactId,
      value: o.monetaryValue,
      updatedAt: o.updatedAt,
    }));
    return { content: [{ type: 'text', text: JSON.stringify(opps, null, 2) }] };
  }
);

// ── ghl_update_opportunity ─────────────────────────────────────────────────────
server.tool(
  'ghl_update_opportunity',
  'Move an opportunity to a different pipeline stage or update its status',
  {
    opportunity_id: z.string().describe('GHL opportunity ID'),
    stage_id: z.string().optional().describe('New pipeline stage ID'),
    status: z.enum(['open', 'won', 'lost', 'abandoned']).optional().describe('New status'),
    monetary_value: z.number().optional().describe('Deal value in USD'),
  },
  async ({ opportunity_id, stage_id, status, monetary_value }) => {
    const body: Record<string, any> = {};
    if (stage_id) body.pipelineStageId = stage_id;
    if (status) body.status = status;
    if (monetary_value !== undefined) body.monetaryValue = monetary_value;
    const data = await ghlPut(`/opportunities/${opportunity_id}`, body);
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

// ── ghl_add_tag ────────────────────────────────────────────────────────────────
server.tool(
  'ghl_add_tag',
  'Add one or more tags to a GHL contact',
  {
    contact_id: z.string().describe('GHL contact ID'),
    tags: z.array(z.string()).describe('Tags to add'),
  },
  async ({ contact_id, tags }) => {
    const data = await ghlPost(`/contacts/${contact_id}/tags`, { tags });
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

// ── ghl_update_contact ─────────────────────────────────────────────────────────
server.tool(
  'ghl_update_contact',
  'Update standard or custom fields on a GHL contact',
  {
    contact_id: z.string().describe('GHL contact ID'),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    custom_fields: z.array(z.object({
      id: z.string().describe('Custom field ID'),
      field_value: z.any().describe('Value to set'),
    })).optional().describe('Custom field updates'),
  },
  async ({ contact_id, first_name, last_name, email, phone, custom_fields }) => {
    const body: Record<string, any> = {};
    if (first_name) body.firstName = first_name;
    if (last_name) body.lastName = last_name;
    if (email) body.email = email;
    if (phone) body.phone = phone;
    if (custom_fields) body.customFields = custom_fields;
    const data = await ghlPut(`/contacts/${contact_id}`, body);
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

// ── ghl_get_workflows ──────────────────────────────────────────────────────────
server.tool(
  'ghl_get_workflows',
  'List all GHL workflows for the location',
  {
    status: z.enum(['active', 'inactive', 'draft']).optional().describe('Filter by status (optional)'),
  },
  async ({ status }) => {
    const params = new URLSearchParams({ locationId });
    if (status) params.set('status', status);
    const data = await ghlGet(`/workflows/?${params}`);
    const workflows = (data.workflows || []).map((w: any) => ({
      id: w.id,
      name: w.name,
      status: w.status,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
    }));
    return { content: [{ type: 'text', text: JSON.stringify(workflows, null, 2) }] };
  }
);

// ── ghl_trigger_workflow ───────────────────────────────────────────────────────
server.tool(
  'ghl_trigger_workflow',
  'Enroll a contact into a GHL workflow',
  {
    contact_id: z.string().describe('GHL contact ID'),
    workflow_id: z.string().describe('GHL workflow ID'),
  },
  async ({ contact_id, workflow_id }) => {
    const data = await ghlPost(`/contacts/${contact_id}/workflow/${workflow_id}`, {});
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

// ── Start ──────────────────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
