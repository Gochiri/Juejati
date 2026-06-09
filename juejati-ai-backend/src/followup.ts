import { CoreMessage } from 'ai';
import {
  searchConversations,
  getConversationHistory,
  getContactById,
  addContactTag,
  updateContactFields,
  addContactToWorkflow,
} from './ghl.js';
import { analyzeLeadConversation } from './agent.js';
import { logMessage, logError, recordFollowup, getFollowupHistory } from './admin-db.js';

// GHL workflow that sends the approved WhatsApp template (1_seguimiento).
const FOLLOWUP_WORKFLOW_ID = process.env.GHL_FOLLOWUP_WORKFLOW_ID || '';
// GHL custom field that holds the AI-generated contextual phrase ({{2}} in the template).
const FOLLOWUP_FRASE_FIELD_ID = process.env.GHL_FOLLOWUP_FRASE_FIELD_ID || '';

const SILENCE_HOURS = Number(process.env.FOLLOWUP_SILENCE_HOURS) || 48;
const MAX_ATTEMPTS = Number(process.env.FOLLOWUP_MAX_ATTEMPTS) || 3;
const MAX_AGE_DAYS = Number(process.env.FOLLOWUP_MAX_AGE_DAYS) || 30;
const MAX_ANALYSES_PER_RUN = Number(process.env.FOLLOWUP_MAX_ANALYSES) || 40;

const BUSINESS_TZ = 'America/Argentina/Buenos_Aires';
const BUSINESS_START = 9;
const BUSINESS_END = 21;

// Tags that exclude a contact from automated follow-up
const EXCLUSION_TAGS = [
  'detener ia',
  'ia desactivada',
  'human handover',
  'quiere visitar',
  'quiere_visitar',
  'seguimiento_agotado',
  'seguimiento_descartado',
];

export interface FollowupSummary {
  scanned: number;
  followedUp: number;
  skipped: number;
  errors: number;
}

// True every day between 09:00 and 21:00 Argentina time.
export function isBusinessHours(now: Date = new Date()): boolean {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: BUSINESS_TZ,
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const hour = Number(parts.find(p => p.type === 'hour')?.value);
  return hour >= BUSINESS_START && hour < BUSINESS_END;
}

function msgEpoch(m: any): number {
  const d = m?.dateAdded ?? m?.createdAt ?? m?.date_added;
  if (!d) return 0;
  return typeof d === 'number' ? d : Date.parse(d) || 0;
}

function msgDirection(m: any): 'inbound' | 'outbound' {
  if (m?.direction) return m.direction === 'inbound' ? 'inbound' : 'outbound';
  return m?.messageType === 'TYPE_INCOMING' ? 'inbound' : 'outbound';
}

// Scans GHL conversations and sends an AI-analyzed follow-up to leads that went silent.
export async function runFollowupCron(): Promise<FollowupSummary> {
  const summary: FollowupSummary = { scanned: 0, followedUp: 0, skipped: 0, errors: 0 };

  if (!isBusinessHours()) {
    console.log('⏰ Follow-up cron: fuera de horario comercial, se omite.');
    return summary;
  }

  if (!FOLLOWUP_WORKFLOW_ID || !FOLLOWUP_FRASE_FIELD_ID) {
    console.error('⏰ Follow-up cron: faltan GHL_FOLLOWUP_WORKFLOW_ID y/o GHL_FOLLOWUP_FRASE_FIELD_ID, se omite.');
    return summary;
  }

  const now = Date.now();
  const silenceMs = SILENCE_HOURS * 3_600_000;
  const maxAgeMs = MAX_AGE_DAYS * 86_400_000;

  const conversations = await searchConversations({ lastMessageDirection: 'outbound', maxConversations: 800 });
  console.log(`⏰ Follow-up cron: ${conversations.length} conversaciones a evaluar.`);

  let analyses = 0;
  for (const conv of conversations) {
    if (analyses >= MAX_ANALYSES_PER_RUN) {
      console.log(`⏰ Follow-up cron: límite de ${MAX_ANALYSES_PER_RUN} análisis alcanzado.`);
      break;
    }
    const contactId: string | undefined = conv.contactId;
    if (!contactId) continue;
    summary.scanned++;

    try {
      const rawHistory: any[] = await getConversationHistory(contactId, 20);
      if (rawHistory.length === 0) { summary.skipped++; continue; }

      // getConversationHistory returns messages newest-first
      const silence = now - msgEpoch(rawHistory[0]);
      if (silence < silenceMs || silence > maxAgeMs) { summary.skipped++; continue; }

      const lastInbound = rawHistory.find(m => msgDirection(m) === 'inbound');
      const lastInboundEpoch = lastInbound ? msgEpoch(lastInbound) : 0;

      // Count follow-ups already sent since the lead's last reply
      const followups = await getFollowupHistory(contactId);
      const sent = followups.filter(f => f.status === 'sent');
      const sentSinceInbound = sent.filter(f => new Date(f.created_at).getTime() > lastInboundEpoch);
      if (sentSinceInbound.length >= MAX_ATTEMPTS) { summary.skipped++; continue; }
      if (sent[0] && now - new Date(sent[0].created_at).getTime() < silenceMs) { summary.skipped++; continue; }

      // Exclusion tags
      const contact = await getContactById(contactId);
      const tags: string[] = (contact.tags || []).map((t: any) => String(t).toLowerCase().trim());
      if (tags.some(t => EXCLUSION_TAGS.includes(t))) { summary.skipped++; continue; }

      // Build chronological history for the LLM
      const history: CoreMessage[] = [...rawHistory]
        .reverse()
        .map(m => ({
          role: msgDirection(m) === 'inbound' ? 'user' : 'assistant',
          content: m.body || m.messageText || m.text || '',
        } as CoreMessage))
        .filter(m => m.content !== '');
      if (history.length === 0) { summary.skipped++; continue; }

      if (!contact.phone) { summary.skipped++; continue; }

      const attempt = sentSinceInbound.length + 1;
      analyses++;
      const analysis = await analyzeLeadConversation(contactId, history, attempt);

      if (!analysis.debe_seguir) {
        await recordFollowup(contactId, conv.id || null, attempt, 'skipped', analysis.motivo, '');
        await addContactTag(contactId, 'seguimiento_descartado').catch(() => {});
        summary.skipped++;
        console.log(`⏭️  ${contactId}: sin seguimiento (${analysis.estado_lead}) — ${analysis.motivo}`);
        continue;
      }

      // Modelo A: write the AI-generated phrase to a GHL custom field, then trigger
      // the GHL workflow that sends the approved template referencing that field.
      await updateContactFields(contactId, [
        { id: FOLLOWUP_FRASE_FIELD_ID, field_value: analysis.template_vars.frase },
      ]);
      await addContactToWorkflow(contactId, FOLLOWUP_WORKFLOW_ID);

      const templateDesc = `[1_seguimiento] nombre=${analysis.template_vars.nombre} | ${analysis.template_vars.frase}`;
      await logMessage(contactId, 'outbound', templateDesc, 'WhatsApp').catch(() => {});
      await recordFollowup(contactId, conv.id || null, attempt, 'sent', analysis.motivo, templateDesc);
      if (attempt >= MAX_ATTEMPTS) await addContactTag(contactId, 'seguimiento_agotado').catch(() => {});

      summary.followedUp++;
      console.log(`✅ Follow-up #${attempt} disparado para ${contactId} — ${templateDesc}`);

      // Light rate-limit between GHL calls
      await new Promise(r => setTimeout(r, 400));
    } catch (err: any) {
      summary.errors++;
      console.error(`❌ Follow-up error for ${contactId}:`, err.message);
      logError('followup-cron', err.message, err.stack, { contactId }).catch(() => {});
    }
  }

  console.log('⏰ Follow-up cron terminado:', summary);
  return summary;
}
