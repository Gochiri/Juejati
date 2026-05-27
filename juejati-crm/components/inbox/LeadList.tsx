'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { LeadCard } from './LeadCard'
import type { GHLLead } from '@/lib/ghl'

interface Props {
  selectedId: string | null
  onSelect: (lead: GHLLead) => void
}

export function LeadList({ selectedId, onSelect }: Props) {
  const [leads, setLeads] = useState<GHLLead[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [stages, setStages] = useState<{ id: string; name: string }[]>([])
  const [selectedStage, setSelectedStage] = useState('')
  const searchTimer = useRef<NodeJS.Timeout | null>(null)

  const load = useCallback(async (q?: string, stageId?: string) => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ limit: '100' })
      if (q) params.set('q', q)
      if (stageId) params.set('stage', stageId)
      const res = await fetch('/api/leads?' + params)
      if (!res.ok) throw new Error((await res.json()).error || 'Error')
      const data = await res.json()
      setLeads(data.leads || [])
      setTotal(data.total || 0)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    fetch('/api/pipelines')
      .then((r) => r.json())
      .then((d) => {
        const firstPipeline = d.pipelines?.[0]
        if (firstPipeline) setStages(firstPipeline.stages)
      })
      .catch(() => {})
  }, [])

  function onSearch(value: string) {
    setQuery(value)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (value.trim().length === 0) {
      load(undefined, selectedStage || undefined)
      return
    }
    if (value.trim().length < 2) return
    searchTimer.current = setTimeout(() => load(value.trim(), selectedStage || undefined), 400)
  }

  function onStageChange(stageId: string) {
    setSelectedStage(stageId)
    load(query.trim() || undefined, stageId || undefined)
  }

  return (
    <aside className="w-72 bg-surface border-r border-border flex flex-col h-full shrink-0">
      <div className="p-3 border-b border-border">
        <Input
          placeholder="Buscar lead..."
          value={query}
          onChange={(e) => onSearch(e.target.value)}
        />
        <select
          value={selectedStage}
          onChange={(e) => onStageChange(e.target.value)}
          className="w-full mt-2 h-9 rounded-md border border-border bg-surface px-3 text-sm text-fg focus:outline-none focus:ring-1 focus:ring-brand"
        >
          <option value="">Todas las etapas</option>
          {stages.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <p className="text-2xs font-mono tabular-nums text-fg-subtle mt-1.5 px-1">
          {loading ? 'Cargando...' : `${leads.length} de ${total} leads`}
        </p>
      </div>
      <div className="overflow-y-auto flex-1 p-2 space-y-1.5">
        {error && <p className="text-xs text-danger p-3">{error}</p>}
        {!loading && !error && leads.length === 0 && (
          <p className="text-xs text-fg-subtle p-3 text-center">Sin resultados</p>
        )}
        {leads.map((lead) => (
          <LeadCard
            key={lead.contactId}
            lead={lead}
            selected={lead.contactId === selectedId}
            onClick={() => onSelect(lead)}
          />
        ))}
      </div>
    </aside>
  )
}
