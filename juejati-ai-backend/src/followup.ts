import { CoreMessage } from 'ai';
import {
  searchConversations,
  getConversationHistory,
  sendMessage,
  getContactById,
  addContactTag,
} from './ghl.js';
import { analyzeLeadConversation } from './agent.js';
import { logMessage, logError, recordFollowup, getFollowupHistory } from './admin-db.js';

const SILENCE_HOURS = Number(process.env.FOLLOWUP_SILENCE_HOURS) || 48;
const MAX_ATTEMPTS = Number(process.env.FOLLOWUP_MAX_ATTEMPTS) || 3;
const MAX_AGE_DAYS = Number(process.env.FOLLOWUP_MAX_AGE_DAYS) || 30;
const MAX_ANALYSES_PER_RUN = Number(process.env.FOLLOWUP_MAX_ANALYSES) || 40;

const BUSINESS_TZ = 'America/Argentina/Buenos_Aires';
const BUSINESS_START = 9;
const BUSINESS_END = 20;

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

// True on weekdays between 09:00 and 20:00 Argentina time.
export function isBusinessHours(now: Date = new Date()): boolean {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: BUSINESS_TZ,
    weekday: 'short',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const weekday = parts.find(p => p.type === 'weekday')?.value;
  const hour = Number(parts.find(p => p.type === 'hour')?.value);
  const isWeekday = weekday !== 'Sat' && weekday !== 'Sun';
  return isWeekday && hour >= BUSINESS_START && hour < BUSINESS_END;
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

      const attempt = sentSinceInbound.length + 1;
      analyses++;
      const analysis = await analyzeLeadConversation(contactId, history, attempt);

      if (!analysis.debe_seguir || !analysis.mensaje.trim()) {
        await recordFollowup(contactId, conv.id || null, attempt, 'skipped', analysis.motivo, analysis.mensaje);
        await addContactTag(contactId, 'seguimiento_descartado').catch(() => {});
        summary.skipped++;
        console.log(`⏭️  ${contactId}: sin seguimiento (${analysis.estado_lead}) — ${analysis.motivo}`);
        continue;
      }

      const channel = String(conv.lastMessageType || rawHistory[0].messageType || rawHistory[0].type || 'WhatsApp');
      await sendMessage(contactId, analysis.mensaje, channel, contact.phone || '');
      await logMessage(contactId, 'outbound', analysis.mensaje, channel).catch(() => {});
      await recordFollowup(contactId, conv.id || null, attempt, 'sent', analysis.motivo, analysis.mensaje);
      if (attempt >= MAX_ATTEMPTS) await addContactTag(contactId, 'seguimiento_agotado').catch(() => {});

      summary.followedUp++;
      console.log(`✅ Follow-up #${attempt} enviado a ${contactId}`);

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
