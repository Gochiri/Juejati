'use client'
import { useState, useEffect } from 'react'
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
  frio: 'bg-info',
  tibio: 'bg-warning',
  caliente: 'bg-danger',
}

export default function PipelinePage() {
  const [pipeline, setPipeline] = useState<Pipeline | null>(null)
  const [leadsByStage, setLeadsByStage] = useState<Record<string, GHLLead[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const pRes = await fetch('/api/pipelines')
        if (!pRes.ok) throw new Error('Error al cargar pipeline')
        const pData = await pRes.json()
        const firstPipeline = pData.pipelines?.[0]
        if (!firstPipeline) throw new Error('No hay pipelines en GHL')
        setPipeline(firstPipeline)

        const lRes = await fetch('/api/leads?limit=100')
        if (!lRes.ok) throw new Error('Error al cargar leads')
        const lData = await lRes.json()
        const allLeads: GHLLead[] = lData.leads || []

        const grouped: Record<string, GHLLead[]> = {}
        const validStageIds = new Set<string>()
        firstPipeline.stages.forEach((s: Stage) => {
          grouped[s.id] = []
          validStageIds.add(s.id)
        })
        for (const lead of allLeads) {
          const sid = lead.stageId || ''
          if (sid && validStageIds.has(sid)) {
            grouped[sid].push(lead)
          } else {
            if (!grouped['__sin_etapa__']) grouped['__sin_etapa__'] = []
            grouped['__sin_etapa__'].push(lead)
          }
        }
        setLeadsByStage(grouped)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return <div className="h-full flex items-center justify-center text-fg-subtle">Cargando pipeline...</div>
  }

  if (error) {
    return <div className="h-full flex items-center justify-center text-danger">{error}</div>
  }

  if (!pipeline) return null

  const columns: { key: string; name: string }[] = pipeline.stages.map((s) => ({ key: s.id, name: s.name }))
  if (leadsByStage['__sin_etapa__']?.length > 0) {
    columns.push({ key: '__sin_etapa__', name: 'Sin etapa' })
  }

  const totalLeads = Object.values(leadsByStage).reduce((acc, arr) => acc + arr.length, 0)

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="px-4 py-3 bg-surface border-b border-border shrink-0">
        <h1 className="font-medium text-fg text-lg">Pipeline — {pipeline.name}</h1>
        <p className="text-2xs font-mono tabular-nums text-fg-muted">
          {totalLeads} leads
        </p>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden bg-bg">
        <div className="flex gap-3 p-4 h-full">
          {columns.map((col) => {
            const leads = leadsByStage[col.key] || []
            const stageName = col.name
            return (
              <div
                key={col.key}
                className="w-72 shrink-0 bg-surface border border-border rounded-lg flex flex-col h-full"
              >
                <div className="px-2.5 py-2 flex items-center justify-between shrink-0 border-b border-border">
                  <h3 className="font-medium text-sm text-fg">{stageName}</h3>
                  <span className="text-2xs text-fg-muted font-mono tabular-nums bg-surface-2 px-1.5 py-0.5 rounded">
                    {leads.length}
                  </span>
                </div>
                <div className="overflow-y-auto flex-1 space-y-2 px-2 py-2">
                  {leads.length === 0 ? (
                    <p className="text-2xs text-fg-subtle text-center py-4">Sin leads</p>
                  ) : (
                    leads.map((lead) => {
                      const score = lead.score_lead?.toLowerCase()
                      const dotClass = score ? SCORE_DOT[score] : null
                      const criteria = [
                        lead.zona && `📍 ${lead.zona}`,
                        lead.ambientes && `${lead.ambientes} amb`,
                      ].filter(Boolean).join(' · ')
                      return (
                        <div
                          key={lead.contactId}
                          className="bg-bg rounded-md p-2.5 border border-border hover:border-border-strong transition-colors cursor-pointer"
                        >
                          <div className="flex items-start gap-2">
                            {dotClass && (
                              <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${dotClass}`} />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-fg truncate">{lead.name}</p>
                              <p className="text-2xs font-mono tabular-nums text-fg-muted">{lead.phone || '—'}</p>
                              {criteria && <p className="text-2xs text-fg-subtle mt-1 truncate">{criteria}</p>}
                              {lead.propiedad_tokko_id && (
                                <p className="text-2xs text-success mt-1 truncate">
                                  🏠 {lead.titulo_propiedad || 'Propiedad asignada'}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
