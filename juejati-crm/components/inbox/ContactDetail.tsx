'use client'
import { useState, useEffect, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { X, ExternalLink, Bot, BotOff } from 'lucide-react'
import type { GHLContactDetail } from '@/lib/ghl'
import { AssignPropertyModal } from './AssignPropertyModal'

interface Props {
  contactId: string | null
}

const SOFIA_TAG = 'sofia_activa'

const SCORE_CONFIG: Record<string, { label: string; variant: 'blue' | 'yellow' | 'red' }> = {
  frio: { label: 'Frío', variant: 'blue' },
  tibio: { label: 'Tibio', variant: 'yellow' },
  caliente: { label: 'Caliente', variant: 'red' },
}

export function ContactDetail({ contactId }: Props) {
  const [data, setData] = useState<GHLContactDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [newTag, setNewTag] = useState('')
  const [tagBusy, setTagBusy] = useState(false)
  const [sofiaBusy, setSofiaBusy] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const mountedRef = useRef(true)
  const currentRef = useRef<string | null>(null)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    currentRef.current = contactId
    if (!contactId) { setData(null); return }
    const id = contactId
    setLoading(true)
    setError('')
    fetch(`/api/leads/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error || 'Error')
        return res.json()
      })
      .then((d) => {
        if (mountedRef.current && currentRef.current === id) setData(d)
      })
      .catch((err) => {
        if (mountedRef.current && currentRef.current === id) setError(err.message)
      })
      .finally(() => {
        if (mountedRef.current && currentRef.current === id) setLoading(false)
      })
  }, [contactId])

  async function refresh() {
    if (!contactId) return
    const res = await fetch(`/api/leads/${contactId}`)
    if (res.ok && mountedRef.current && currentRef.current === contactId) {
      setData(await res.json())
    }
  }

  async function handleAddTag(e: React.FormEvent) {
    e.preventDefault()
    if (!contactId || !newTag.trim() || tagBusy) return
    setTagBusy(true)
    try {
      const res = await fetch(`/api/leads/${contactId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag: newTag.trim() }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setNewTag('')
      await refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setTagBusy(false)
    }
  }

  async function handleRemoveTag(tag: string) {
    if (!contactId || tagBusy) return
    setTagBusy(true)
    try {
      const res = await fetch(`/api/leads/${contactId}/tags?tag=${encodeURIComponent(tag)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error)
      await refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setTagBusy(false)
    }
  }

  async function handleSofiaToggle() {
    if (!contactId || sofiaBusy) return
    setSofiaBusy(true)
    try {
      const res = await fetch(`/api/leads/${contactId}/ai-toggle`, { method: 'POST' })
      if (!res.ok) throw new Error((await res.json()).error)
      await refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSofiaBusy(false)
    }
  }

  if (!contactId) {
    return (
      <aside className="w-80 bg-surface border-l border-border hidden lg:flex flex-col items-center justify-center text-fg-subtle text-sm shrink-0">
        <p>Ficha del contacto</p>
      </aside>
    )
  }

  if (loading && !data) {
    return (
      <aside className="w-80 bg-surface border-l border-border hidden lg:flex flex-col items-center justify-center text-fg-subtle text-sm shrink-0">
        <p>Cargando...</p>
      </aside>
    )
  }

  if (!data) {
    return (
      <aside className="w-80 bg-surface border-l border-border hidden lg:flex flex-col items-center justify-center text-danger text-sm shrink-0">
        <p>{error || 'Sin datos'}</p>
      </aside>
    )
  }

  const sofiaActive = data.tags.includes(SOFIA_TAG)
  const scoreKey = data.score_lead?.toLowerCase() || ''
  const scoreConf = SCORE_CONFIG[scoreKey]
  const visibleTags = data.tags.filter((t) => t !== SOFIA_TAG)

  const utm = data.attribution || {}
  const utmSource = utm.utmSource || utm.source || data.source
  const utmMedium = utm.utmMedium || utm.medium
  const utmCampaign = utm.utmCampaign || utm.campaign

  return (
    <aside className="w-80 bg-surface border-l border-border hidden lg:flex flex-col h-full shrink-0 overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="font-medium text-fg truncate">{data.name}</h2>
        <p className="text-2xs font-mono tabular-nums text-fg-muted mt-0.5">{data.phone || '—'}</p>
        {data.email && <p className="text-2xs text-fg-subtle truncate">{data.email}</p>}
      </div>

      {error && <p className="mx-4 mt-3 text-xs text-danger">{error}</p>}

      {/* Sofía toggle */}
      <section className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {sofiaActive ? (
              <Bot className="w-4 h-4 text-brand" />
            ) : (
              <BotOff className="w-4 h-4 text-fg-subtle" />
            )}
            <div>
              <p className="text-sm font-medium text-fg">Sofía IA</p>
              <p className="text-2xs text-fg-subtle">
                {sofiaActive ? 'Responde automáticamente' : 'Pausada — respondés vos'}
              </p>
            </div>
          </div>
          <button
            onClick={handleSofiaToggle}
            disabled={sofiaBusy}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${
              sofiaActive ? 'bg-brand' : 'bg-border-strong'
            }`}
            aria-label="Toggle Sofía"
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-bg transition-transform ${
                sofiaActive ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </section>

      {/* Score & stage badges */}
      {(scoreConf || data.source) && (
        <section className="px-4 py-3 border-b border-border flex flex-wrap gap-1.5">
          {scoreConf && <Badge variant={scoreConf.variant}>Lead {scoreConf.label}</Badge>}
          {data.source && <Badge variant="default">{data.source}</Badge>}
        </section>
      )}

      {/* Criterios */}
      <section className="px-4 py-3 border-b border-border">
        <h3 className="text-2xs font-medium text-fg-subtle uppercase tracking-wider mb-2">Criterios</h3>
        <div className="space-y-1.5 text-sm">
          <DetailRow label="Zona" value={data.zona} />
          <DetailRow label="Operación" value={data.operacion} />
          <DetailRow label="Tipo" value={data.tipo_propiedad} />
          <DetailRow label="Ambientes" value={data.ambientes} />
          <DetailRow label="Dormitorios" value={data.dormitorios} />
          <DetailRow
            label="Presupuesto"
            value={data.presupuesto_ia ? `USD ${Number(data.presupuesto_ia).toLocaleString('es-AR')}` : null}
            mono
          />
        </div>
      </section>

      {/* Tags */}
      <section className="px-4 py-3 border-b border-border">
        <h3 className="text-2xs font-medium text-fg-subtle uppercase tracking-wider mb-2">Tags</h3>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {visibleTags.length === 0 && <p className="text-2xs text-fg-subtle">Sin tags</p>}
          {visibleTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 bg-surface-2 text-fg px-2 py-0.5 rounded text-2xs"
            >
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                disabled={tagBusy}
                className="hover:text-danger disabled:opacity-50"
                aria-label={`Quitar ${tag}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <form onSubmit={handleAddTag} className="flex gap-1.5">
          <Input
            placeholder="Nuevo tag"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            className="h-8 text-xs"
          />
          <Button type="submit" size="sm" disabled={!newTag.trim() || tagBusy}>
            +
          </Button>
        </form>
      </section>

      {/* UTMs */}
      {(utmSource || utmMedium || utmCampaign) && (
        <section className="px-4 py-3 border-b border-border">
          <h3 className="text-2xs font-medium text-fg-subtle uppercase tracking-wider mb-2">Atribución</h3>
          <div className="space-y-1 text-xs">
            {utmSource && <DetailRow label="Source" value={utmSource} small />}
            {utmMedium && <DetailRow label="Medium" value={utmMedium} small />}
            {utmCampaign && <DetailRow label="Campaign" value={utmCampaign} small />}
          </div>
        </section>
      )}

      {/* Propiedad asignada */}
      <section className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-2xs font-medium text-fg-subtle uppercase tracking-wider">
            Propiedad asignada
          </h3>
          <button
            onClick={() => setAssignOpen(true)}
            className="text-2xs text-brand hover:text-brand-hover"
          >
            {data.propiedad_tokko_id ? 'Cambiar' : 'Asignar'}
          </button>
        </div>
        {data.propiedad_tokko_id ? (
          <div className="bg-surface-2 rounded-lg p-3">
            <p className="font-medium text-sm text-fg leading-tight">
              {data.titulo_propiedad || 'Sin título'}
            </p>
            {data.ubicacion_propiedad && (
              <p className="text-2xs text-fg-muted mt-0.5">{data.ubicacion_propiedad}</p>
            )}
            {data.precio_propiedad && (
              <p className="text-2xs font-mono tabular-nums font-medium text-brand mt-1">{data.precio_propiedad}</p>
            )}
            {data.link_propiedad && (
              <a
                href={data.link_propiedad}
                target="_blank"
                rel="noreferrer"
                className="text-2xs text-brand hover:underline mt-1 inline-flex items-center gap-1"
              >
                Ver ficha <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        ) : (
          <p className="text-2xs text-fg-subtle">Sin propiedad asignada</p>
        )}
      </section>

      {/* Action buttons */}
      <section className="px-4 py-3 mt-auto space-y-2">
        <a
          href={`https://app.gohighlevel.com/v2/location/${process.env.NEXT_PUBLIC_GHL_LOCATION_ID || ''}/contacts/detail/${contactId}`}
          target="_blank"
          rel="noreferrer"
          className="block w-full text-center text-2xs py-2 rounded-md border border-border hover:bg-surface-2 text-fg-muted hover:text-fg transition-colors"
        >
          Abrir en GHL ↗
        </a>
      </section>

      {assignOpen && contactId && (
        <AssignPropertyModal
          contactId={contactId}
          currentTokkoId={data.propiedad_tokko_id}
          onClose={() => setAssignOpen(false)}
          onAssigned={refresh}
        />
      )}
    </aside>
  )
}

function DetailRow({ label, value, small, mono }: { label: string; value: string | null | undefined; small?: boolean; mono?: boolean }) {
  if (!value) return null
  return (
    <div className={`flex justify-between gap-2 ${small ? 'text-2xs' : 'text-sm'}`}>
      <span className="text-fg-subtle shrink-0">{label}</span>
      <span className={`text-fg text-right truncate ${mono ? 'font-mono tabular-nums' : ''}`}>{value}</span>
    </div>
  )
}
