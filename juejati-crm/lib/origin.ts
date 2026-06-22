import type { GHLLead } from './ghl'

export interface OriginCategory {
  key: string
  label: string
  // Tailwind background + text classes for the badge
  badgeClass: string
  // Patterns matched against tags, custom field "Origen Lead", and source (in that order).
  // First category whose pattern matches wins.
  matchers: RegExp[]
}

// Ordered: more specific tags (e.g. fb ads) come BEFORE the broader "whatsapp"
// so a "[whatsapp] - fb ads" lead is classified as FB Ads, not generic WhatsApp.
// badgeClass uses solid design-system tokens (no opacity modifiers, since the
// CSS variables don't expose an <alpha-value> slot in tailwind.config.ts).
export const ORIGIN_CATEGORIES: OriginCategory[] = [
  {
    key: 'zonaprop',
    label: 'Zonaprop',
    badgeClass: 'bg-surface-2 text-info border-info',
    matchers: [/zonaprop/i],
  },
  {
    key: 'fb_ads',
    label: 'FB Ads',
    badgeClass: 'bg-surface-2 text-brand border-brand',
    matchers: [/fb\s*ads/i, /facebook\s*ads/i, /meta\s*ads/i],
  },
  {
    key: 'formulario',
    label: 'Formulario web',
    badgeClass: 'bg-surface-2 text-warning border-warning',
    matchers: [/formulario/i, /juejati\.com\.ar/i, /lead\s*capture/i, /landing/i],
  },
  {
    key: 'tokko',
    label: 'Tokko',
    badgeClass: 'bg-surface-2 text-danger border-danger',
    matchers: [/tokko/i, /red\s*tokko/i],
  },
  {
    key: 'sofia',
    label: 'Sofía',
    badgeClass: 'bg-surface-2 text-fg-muted border-border',
    matchers: [/sof[ií]a/i, /ingreso\s*sofia/i],
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    badgeClass: 'bg-surface-2 text-success border-success',
    matchers: [/whatsapp/i],
  },
]

export const UNKNOWN_ORIGIN: OriginCategory = {
  key: 'unknown',
  label: 'Sin origen',
  badgeClass: 'bg-surface-2 text-fg-subtle border-border',
  matchers: [],
}

// Classify a lead's origin by scanning, in order: tags → "Origen Lead" custom
// field → native GHL `source`. Returns null if nothing matches (caller decides
// whether to render UNKNOWN_ORIGIN or hide the badge).
export function getLeadOrigin(lead: Pick<GHLLead, 'tags' | 'origen_lead' | 'source'>): OriginCategory | null {
  const signals: string[] = []
  if (lead.tags && lead.tags.length > 0) signals.push(...lead.tags)
  if (lead.origen_lead) signals.push(lead.origen_lead)
  if (lead.source) signals.push(lead.source)
  if (signals.length === 0) return null

  for (const cat of ORIGIN_CATEGORIES) {
    for (const signal of signals) {
      if (cat.matchers.some((re) => re.test(signal))) return cat
    }
  }
  return null
}
