'use client'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { GHLLead } from '@/lib/ghl'

interface Props {
  lead: GHLLead
  selected: boolean
  onClick: () => void
}

const SCORE_VARIANT: Record<string, 'blue' | 'yellow' | 'red'> = {
  frio: 'blue',
  tibio: 'yellow',
  caliente: 'red',
}

const SCORE_LABEL: Record<string, string> = {
  frio: 'Frío',
  tibio: 'Tibio',
  caliente: 'Caliente',
}

export function LeadCard({ lead, selected, onClick }: Props) {
  const score = lead.score_lead?.toLowerCase()
  const hasProperty = !!lead.propiedad_tokko_id
  const criteria = [
    lead.zona && `📍 ${lead.zona}`,
    lead.ambientes && `${lead.ambientes} amb`,
    lead.presupuesto_ia && `USD ${Number(lead.presupuesto_ia).toLocaleString('es-AR')}`,
  ].filter(Boolean).join(' · ')

  return (
    <div
      onClick={onClick}
      className={cn(
        'cursor-pointer rounded-lg border p-3 hover:border-blue-300 transition-colors',
        selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <span className="font-semibold text-gray-900 text-sm truncate">{lead.name}</span>
        {hasProperty && <span className="text-green-500 text-xs shrink-0">✓</span>}
      </div>
      <div className="text-xs text-gray-500 mt-0.5">{lead.phone || '—'}</div>
      {criteria && <div className="text-xs text-gray-400 mt-1 truncate">{criteria}</div>}
      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
        {lead.stage && <Badge variant="default">{lead.stage}</Badge>}
        {score && SCORE_VARIANT[score] && (
          <Badge variant={SCORE_VARIANT[score]}>{SCORE_LABEL[score]}</Badge>
        )}
      </div>
    </div>
  )
}
