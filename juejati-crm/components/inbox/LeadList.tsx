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
  const searchTimer = useRef<NodeJS.Timeout | null>(null)

  const load = useCallback(async (q?: string) => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ limit: '100' })
      if (q) params.set('q', q)
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

  function onSearch(value: string) {
    setQuery(value)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (value.trim().length === 0) {
      load()
      return
    }
    if (value.trim().length < 2) return
    searchTimer.current = setTimeout(() => load(value.trim()), 400)
  }

  return (
    <aside className="w-72 bg-white border-r border-gray-200 flex flex-col h-full shrink-0">
      <div className="p-3 border-b border-gray-100">
        <Input
          placeholder="Buscar lead..."
          value={query}
          onChange={(e) => onSearch(e.target.value)}
        />
        <p className="text-xs text-gray-400 mt-1.5 px-1">
          {loading ? 'Cargando...' : `${leads.length} de ${total} leads`}
        </p>
      </div>
      <div className="overflow-y-auto flex-1 p-2 space-y-1.5">
        {error && <p className="text-xs text-red-500 p-3">{error}</p>}
        {!loading && !error && leads.length === 0 && (
          <p className="text-xs text-gray-400 p-3 text-center">Sin resultados</p>
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
