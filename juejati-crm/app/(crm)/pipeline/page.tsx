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
  frio: 'bg-blue-400',
  tibio: 'bg-yellow-400',
  caliente: 'bg-red-400',
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
        firstPipeline.stages.forEach((s: Stage) => {
          grouped[s.name] = []
        })
        for (const lead of allLeads) {
          const stageName = lead.stage || ''
          if (grouped[stageName]) {
            grouped[stageName].push(lead)
          } else {
            if (!grouped['Sin etapa']) grouped['Sin etapa'] = []
            grouped['Sin etapa'].push(lead)
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
    return <div className="h-full flex items-center justify-center text-gray-400">Cargando pipeline...</div>
  }

  if (error) {
    return <div className="h-full flex items-center justify-center text-red-500">{error}</div>
  }

  if (!pipeline) return null

  const allStages = [...pipeline.stages.map((s) => s.name)]
  if (leadsByStage['Sin etapa']?.length > 0) allStages.push('Sin etapa')

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="px-4 py-3 bg-white border-b border-gray-200 shrink-0">
        <h1 className="font-bold text-lg">Pipeline — {pipeline.name}</h1>
        <p className="text-xs text-gray-400">
          {Object.values(leadsByStage).reduce((acc, arr) => acc + arr.length, 0)} leads
        </p>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden bg-gray-50">
        <div className="flex gap-3 p-4 h-full">
          {allStages.map((stageName) => {
            const leads = leadsByStage[stageName] || []
            return (
              <div
                key={stageName}
                className="w-72 shrink-0 bg-gray-100 rounded-xl p-2 flex flex-col h-full"
              >
                <div className="px-2 py-1.5 flex items-center justify-between shrink-0">
                  <h3 className="font-semibold text-sm text-gray-700">{stageName}</h3>
                  <span className="text-xs text-gray-500 bg-white px-1.5 py-0.5 rounded">
                    {leads.length}
                  </span>
                </div>
                <div className="overflow-y-auto flex-1 space-y-2 px-1 py-1">
                  {leads.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">Sin leads</p>
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
                          className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:border-blue-300 hover:shadow transition cursor-pointer"
                        >
                          <div className="flex items-start gap-2">
                            {dotClass && (
                              <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${dotClass}`} />
                            )}
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
