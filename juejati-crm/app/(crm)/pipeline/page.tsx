'use client'
import { useState, useEffect, useRef } from 'react'
import { RefreshCw } from 'lucide-react'
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
import {
  getCachedPipelineData,
  setCachedPipelineData,
  clearCachedPipelineData,
  updateCachedLeadStage,
} from '@/lib/pipeline-cache'

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
  frio: 'bg-info',
  tibio: 'bg-warning',
  caliente: 'bg-danger',
}

const SIN_ETAPA = '__sin_etapa__'
const PAGE_SIZE = 100

export default function PipelinePage() {
  const [pipeline, setPipeline] = useState<Pipeline | null>(null)
  const [leadsByStage, setLeadsByStage] = useState<Record<string, GHLLead[]>>({})
  const [loadingMsg, setLoadingMsg] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [selectedOpp, setSelectedOpp] = useState<GHLLead | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const draggingRef = useRef(false)
  // Monotonic counter — incremented on every load start and on unmount.
  // Each load checks `loadCounter.current` against its own id to abort cleanly
  // when a newer load has started (e.g. user clicked refresh while a fetch was still in flight).
  const loadCounter = useRef(0)

  /**
   * Fetch the pipeline + all paginated opportunities from GHL.
   * When `progressive=true`, push each batch into UI as it arrives (used for empty-state first loads).
   * When `progressive=false`, fetch silently in the background and swap state only at the end
   * (used when we already have cached data on screen).
   */
  async function loadFresh(progressive: boolean) {
    const myLoad = ++loadCounter.current
    try {
      const pRes = await fetch('/api/pipelines')
      if (!pRes.ok) throw new Error('Error al cargar pipeline')
      if (loadCounter.current !== myLoad) return
      const pData = await pRes.json()
      const firstPipeline: Pipeline = pData.pipelines?.[0]
      if (!firstPipeline) throw new Error('No hay pipelines en GHL')

      const validStageIds = new Set<string>(firstPipeline.stages.map((s) => s.id))
      const accumulated: Record<string, GHLLead[]> = {}
      firstPipeline.stages.forEach((s) => (accumulated[s.id] = []))

      if (progressive) {
        setPipeline(firstPipeline)
        setLeadsByStage(accumulated)
      }

      let page = 1
      let total = 0
      let totalSoFar = 0
      while (true) {
        const lRes = await fetch(`/api/leads?limit=${PAGE_SIZE}&page=${page}`)
        if (!lRes.ok) throw new Error('Error al cargar leads')
        if (loadCounter.current !== myLoad) return
        const lData = await lRes.json()
        const pageLeads: GHLLead[] = lData.leads || []
        total = lData.total || total
        totalSoFar += pageLeads.length

        for (const lead of pageLeads) {
          const sid = lead.stageId || ''
          if (sid && validStageIds.has(sid)) {
            accumulated[sid].push(lead)
          } else {
            if (!accumulated[SIN_ETAPA]) accumulated[SIN_ETAPA] = []
            accumulated[SIN_ETAPA].push(lead)
          }
        }

        setLoadingMsg(`${progressive ? 'Cargando' : 'Actualizando'} ${totalSoFar} de ${total}...`)

        if (progressive) {
          // Trigger re-render with a fresh top-level reference
          setLeadsByStage({ ...accumulated })
        }

        if (!lData.hasMore || pageLeads.length === 0) break
        page++
      }

      // Commit final state regardless of mode
      setPipeline(firstPipeline)
      setLeadsByStage({ ...accumulated })
      setLoadingMsg(null)
      setIsRefreshing(false)
      setCachedPipelineData({ pipeline: firstPipeline, leadsByStage: accumulated })
    } catch (err: any) {
      if (loadCounter.current !== myLoad) return
      setError(err.message)
      setLoadingMsg(null)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    const cached = getCachedPipelineData()
    if (cached) {
      setPipeline(cached.pipeline)
      setLeadsByStage(cached.leadsByStage)
      setLoadingMsg('Actualizando en segundo plano...')
      loadFresh(false)
    } else {
      setLoadingMsg('Cargando pipeline...')
      loadFresh(true)
    }
    return () => {
      // Cancel any in-flight load on unmount
      loadCounter.current++
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleRefresh() {
    if (isRefreshing) return
    setIsRefreshing(true)
    clearCachedPipelineData()
    setLoadingMsg('Refrescando...')
    loadFresh(false)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return
    const opportunityId = String(active.id)
    const toStageId = String(over.id)
    const fromStageId = (active.data.current as any)?.fromStageId as string | undefined
    const lead = (active.data.current as any)?.lead as GHLLead | undefined
    if (!fromStageId || !lead || fromStageId === toStageId) return

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
      // Keep the cache consistent with the server change so a reload within TTL is correct
      updateCachedLeadStage(opportunityId, toStageId)
    } catch (err: any) {
      // Per-card rollback (does not stomp concurrent moves)
      setLeadsByStage((prev) => {
        const next: Record<string, GHLLead[]> = {}
        for (const k of Object.keys(prev)) {
          next[k] = prev[k].filter((l) => l.opportunityId !== opportunityId)
        }
        const restored: GHLLead = { ...lead, stageId: fromStageId }
        next[fromStageId] = [restored, ...(next[fromStageId] || [])]
        return next
      })
      alert('No se pudo mover la oportunidad: ' + (err.message || 'Error'))
    }
  }

  if (error) {
    return <div className="h-full flex items-center justify-center text-danger">{error}</div>
  }
  if (!pipeline) {
    return (
      <div className="h-full flex items-center justify-center text-fg-subtle">
        {loadingMsg || 'Cargando...'}
      </div>
    )
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
      <div className="px-4 py-3 bg-surface border-b border-border shrink-0 flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-bold text-lg text-fg">Pipeline — {pipeline.name}</h1>
          <p className="text-xs text-fg-subtle">{totalLeads} leads</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {loadingMsg && <p className="text-xs text-fg-subtle">{loadingMsg}</p>}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-fg-muted hover:text-fg disabled:opacity-50 disabled:cursor-not-allowed p-1"
            aria-label="Refrescar"
            title="Refrescar pipeline (forzar nueva carga desde GHL)"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={() => {
          draggingRef.current = true
        }}
        onDragEnd={(e) => {
          handleDragEnd(e)
          setTimeout(() => {
            draggingRef.current = false
          }, 0)
        }}
      >
        <div className="flex-1 overflow-x-auto overflow-y-hidden bg-bg">
          <div className="flex gap-3 p-4 h-full">
            {columns.map((col) => (
              <KanbanColumn
                key={col.key}
                stageId={col.key}
                stageName={col.name}
                leads={leadsByStage[col.key] || []}
                onCardClick={setSelectedOpp}
                draggingRef={draggingRef}
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
  draggingRef: React.MutableRefObject<boolean>
}

function KanbanColumn({ stageId, stageName, leads, onCardClick, draggingRef }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stageId })
  return (
    <div
      ref={setNodeRef}
      className={`w-72 shrink-0 bg-surface-2 rounded-xl p-2 flex flex-col h-full transition ${
        isOver ? 'ring-2 ring-brand' : ''
      }`}
    >
      <div className="px-2 py-1.5 flex items-center justify-between shrink-0">
        <h3 className="font-semibold text-sm text-fg">{stageName}</h3>
        <span className="text-xs text-fg-muted bg-surface px-1.5 py-0.5 rounded">{leads.length}</span>
      </div>
      <div className="overflow-y-auto flex-1 space-y-2 px-1 py-1">
        {leads.length === 0 ? (
          <p className="text-xs text-fg-subtle text-center py-4">Sin leads</p>
        ) : (
          leads.map((lead) => (
            <DraggableCard
              key={lead.opportunityId || lead.contactId}
              lead={lead}
              fromStageId={stageId}
              onClick={() => onCardClick(lead)}
              draggingRef={draggingRef}
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
  draggingRef: React.MutableRefObject<boolean>
}

function DraggableCard({ lead, fromStageId, onClick, draggingRef }: CardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.opportunityId,
    data: { fromStageId, lead },
    disabled: !lead.opportunityId,
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
        if (draggingRef.current) return
        e.stopPropagation()
        onClick()
      }}
      className="bg-surface rounded-lg p-3 shadow-sm border border-border hover:border-brand hover:shadow transition cursor-pointer"
    >
      <div className="flex items-start gap-2">
        {dotClass && <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${dotClass}`} />}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-fg truncate">{lead.name}</p>
          <p className="text-xs text-fg-muted">{lead.phone || '—'}</p>
          {criteria && <p className="text-xs text-fg-subtle mt-1 truncate">{criteria}</p>}
          {lead.propiedad_tokko_id && (
            <p className="text-xs text-success mt-1 truncate">
              🏠 {lead.titulo_propiedad || 'Propiedad asignada'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
