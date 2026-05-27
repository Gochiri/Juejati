'use client'
import { useState, useEffect } from 'react'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { OpportunityDrawer } from '@/components/pipeline/OpportunityDrawer'
import type { GHLLead } from '@/lib/ghl'

interface Stage {
  id: string
  name: string
  position: number
}

interface Pipeline {
  id: string
  name: string
  stages: Stage[]
}

const SCORE_DOT: Record<string, string> = {
  frio: 'bg-blue-400',
  tibio: 'bg-yellow-400',
  caliente: 'bg-red-400',
}

const SIN_ETAPA = '__sin_etapa__'
const PAGE_SIZE = 100

export default function PipelinePage() {
  const [pipeline, setPipeline] = useState<Pipeline | null>(null)
  const [leadsByStage, setLeadsByStage] = useState<Record<string, GHLLead[]>>({})
  const [loadingMsg, setLoadingMsg] = useState<string | null>('Cargando pipeline...')
  const [error, setError] = useState('')
  const [selectedOpp, setSelectedOpp] = useState<GHLLead | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const pRes = await fetch('/api/pipelines')
        if (!pRes.ok) throw new Error('Error al cargar pipeline')
        const pData = await pRes.json()
        const firstPipeline = pData.pipelines?.[0]
        if (!firstPipeline) throw new Error('No hay pipelines en GHL')
        if (cancelled) return
        setPipeline(firstPipeline)

        // Paginated fetch — walk every page until hasMore is false
        const all: GHLLead[] = []
        let page = 1
        let total = 0
        while (!cancelled) {
          const lRes = await fetch(`/api/leads?limit=${PAGE_SIZE}&page=${page}`)
          if (!lRes.ok) throw new Error('Error al cargar leads')
          const lData = await lRes.json()
          const pageLeads: GHLLead[] = lData.leads || []
          all.push(...pageLeads)
          total = lData.total || all.length
          setLoadingMsg(`Cargando ${all.length} de ${total}...`)
          if (!lData.hasMore || pageLeads.length === 0) break
          page++
        }
        if (cancelled) return

        // Group by stageId. Fallback bucket for opportunities without a recognized stage.
        const grouped: Record<string, GHLLead[]> = {}
        const validStageIds = new Set<string>()
        firstPipeline.stages.forEach((s: Stage) => {
          grouped[s.id] = []
          validStageIds.add(s.id)
        })
        for (const lead of all) {
          const sid = lead.stageId || ''
          if (sid && validStageIds.has(sid)) {
            grouped[sid].push(lead)
          } else {
            if (!grouped[SIN_ETAPA]) grouped[SIN_ETAPA] = []
            grouped[SIN_ETAPA].push(lead)
          }
        }
        setLeadsByStage(grouped)
        setLoadingMsg(null)
      } catch (err: any) {
        if (!cancelled) setError(err.message)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return
    const opportunityId = String(active.id)
    const toStageId = String(over.id)
    const fromStageId = (active.data.current as any)?.fromStageId as string | undefined
    const lead = (active.data.current as any)?.lead as GHLLead | undefined
    if (!fromStageId || !lead || fromStageId === toStageId) return

    // Snapshot for rollback
    const snapshot = leadsByStage

    // Optimistic update
    setLeadsByStage((prev) => {
      const next: Record<string, GHLLead[]> = {}
      for (const k of Object.keys(prev)) {
        next[k] = prev[k].filter((l) => l.opportunityId !== opportunityId)
      }
      const moved: GHLLead = { ...lead, stageId: toStageId }
      next[toStageId] = [moved, ...(next[toStageId] || [])]
      return next
    })

    // Persist
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageId: toStageId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || `HTTP ${res.status}`)
      }
    } catch (err: any) {
      setLeadsByStage(snapshot)
      alert('No se pudo mover la oportunidad: ' + (err.message || 'Error'))
    }
  }

  if (error) {
    return <div className="h-full flex items-center justify-center text-red-500">{error}</div>
  }
  if (!pipeline) {
    return <div className="h-full flex items-center justify-center text-gray-400">{loadingMsg || 'Cargando...'}</div>
  }

  const columns: { key: string; name: string }[] = pipeline.stages.map((s) => ({ key: s.id, name: s.name }))
  if ((leadsByStage[SIN_ETAPA]?.length ?? 0) > 0) {
    columns.push({ key: SIN_ETAPA, name: 'Sin etapa' })
  }
  const stageNameById: Record<string, string> = {}
  pipeline.stages.forEach((s) => (stageNameById[s.id] = s.name))
  stageNameById[SIN_ETAPA] = 'Sin etapa'
  const totalLeads = Object.values(leadsByStage).reduce((acc, arr) => acc + arr.length, 0)

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="px-4 py-3 bg-white border-b border-gray-200 shrink-0 flex items-baseline justify-between">
        <div>
          <h1 className="font-bold text-lg">Pipeline — {pipeline.name}</h1>
          <p className="text-xs text-gray-400">{totalLeads} leads</p>
        </div>
        {loadingMsg && <p className="text-xs text-gray-400">{loadingMsg}</p>}
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-x-auto overflow-y-hidden bg-gray-50">
          <div className="flex gap-3 p-4 h-full">
            {columns.map((col) => (
              <KanbanColumn
                key={col.key}
                stageId={col.key}
                stageName={col.name}
                leads={leadsByStage[col.key] || []}
                onCardClick={setSelectedOpp}
              />
            ))}
          </div>
        </div>
      </DndContext>

      <OpportunityDrawer
        opportunity={selectedOpp}
        stageName={selectedOpp ? stageNameById[selectedOpp.stageId || ''] || 'Sin etapa' : ''}
        onClose={() => setSelectedOpp(null)}
      />
    </div>
  )
}

interface ColumnProps {
  stageId: string
  stageName: string
  leads: GHLLead[]
  onCardClick: (lead: GHLLead) => void
}

function KanbanColumn({ stageId, stageName, leads, onCardClick }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stageId })
  return (
    <div
      ref={setNodeRef}
      className={`w-72 shrink-0 bg-gray-100 rounded-xl p-2 flex flex-col h-full transition ${
        isOver ? 'ring-2 ring-blue-400' : ''
      }`}
    >
      <div className="px-2 py-1.5 flex items-center justify-between shrink-0">
        <h3 className="font-semibold text-sm text-gray-700">{stageName}</h3>
        <span className="text-xs text-gray-500 bg-white px-1.5 py-0.5 rounded">{leads.length}</span>
      </div>
      <div className="overflow-y-auto flex-1 space-y-2 px-1 py-1">
        {leads.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">Sin leads</p>
        ) : (
          leads.map((lead) => (
            <DraggableCard
              key={lead.opportunityId || lead.contactId}
              lead={lead}
              fromStageId={stageId}
              onClick={() => onCardClick(lead)}
            />
          ))
        )}
      </div>
    </div>
  )
}

interface CardProps {
  lead: GHLLead
  fromStageId: string
  onClick: () => void
}

function DraggableCard({ lead, fromStageId, onClick }: CardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.opportunityId,
    data: { fromStageId, lead },
  })
  const score = lead.score_lead?.toLowerCase()
  const dotClass = score ? SCORE_DOT[score] : null
  const criteria = [lead.zona && `📍 ${lead.zona}`, lead.ambientes && `${lead.ambientes} amb`]
    .filter(Boolean)
    .join(' · ')

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        // Suppress click that came from a drag (dnd-kit fires click on pointerup of short drags)
        if (isDragging) return
        e.stopPropagation()
        onClick()
      }}
      className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:border-blue-300 hover:shadow transition cursor-pointer"
    >
      <div className="flex items-start gap-2">
        {dotClass && <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${dotClass}`} />}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900 truncate">{lead.name}</p>
          <p className="text-xs text-gray-500">{lead.phone || '—'}</p>
          {criteria && <p className="text-xs text-gray-400 mt-1 truncate">{criteria}</p>}
          {lead.propiedad_tokko_id && (
            <p className="text-xs text-green-600 mt-1 truncate">
              🏠 {lead.titulo_propiedad || 'Propiedad asignada'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
