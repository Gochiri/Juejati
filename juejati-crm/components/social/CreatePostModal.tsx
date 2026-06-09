'use client'
import { useState, useEffect } from 'react'
import { X, Sparkles, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Property, GHLSocialAccount } from '@/lib/ghl'

interface Props {
  onClose: () => void
  onCreated: () => void
}

export function CreatePostModal({ onClose, onCreated }: Props) {
  const [step, setStep] = useState<'property' | 'compose'>('property')
  const [propSearch, setPropSearch] = useState('')
  const [properties, setProperties] = useState<Property[]>([])
  const [searchingProps, setSearchingProps] = useState(false)
  const [selectedProp, setSelectedProp] = useState<Property | null>(null)

  const [accounts, setAccounts] = useState<GHLSocialAccount[]>([])
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set())
  const [copy, setCopy] = useState('')
  const [generating, setGenerating] = useState(false)
  const [scheduleDate, setScheduleDate] = useState(() => {
    const d = new Date()
    d.setHours(d.getHours() + 1)
    return d.toISOString().slice(0, 16)
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/social/accounts')
      .then((r) => r.json())
      .then((d) => setAccounts(d.accounts || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (step !== 'property') return
    const timer = setTimeout(() => {
      setSearchingProps(true)
      const params = new URLSearchParams({ limit: '12' })
      if (propSearch.trim()) params.set('q', propSearch.trim())
      fetch('/api/properties?' + params)
        .then((r) => r.json())
        .then((d) => setProperties(d.properties || []))
        .catch(() => {})
        .finally(() => setSearchingProps(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [propSearch, step])

  function selectProperty(prop: Property) {
    setSelectedProp(prop)
    setStep('compose')
  }

  async function generateCopy() {
    if (!selectedProp) return
    setGenerating(true)
    setError('')
    try {
      const res = await fetch('/api/social/generate-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: selectedProp.titulo,
          barrio: selectedProp.barrio,
          tipo: selectedProp.tipo,
          operacion: selectedProp.operacion,
          precio: selectedProp.precio,
          moneda: selectedProp.moneda,
          ambientes: selectedProp.ambientes,
          dormitorios: selectedProp.dormitorios,
          superficie: selectedProp.superficie,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const data = await res.json()
      setCopy(data.copy || '')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  function toggleAccount(id: string) {
    const next = new Set(selectedAccounts)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedAccounts(next)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedProp || selectedAccounts.size === 0 || !copy.trim()) {
      setError('Faltan datos: propiedad, cuenta y texto')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/social/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountIds: Array.from(selectedAccounts),
          summary: copy,
          scheduleDate: new Date(scheduleDate).toISOString(),
          mediaUrl: selectedProp.imagen || undefined,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      onCreated()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-surface border border-border rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-medium text-lg text-fg">Nuevo post</h2>
            <p className="text-2xs text-fg-subtle">
              {step === 'property' ? 'Paso 1: Elegí una propiedad' : 'Paso 2: Componé el post'}
            </p>
          </div>
          <button onClick={onClose} className="text-fg-subtle hover:text-fg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'property' ? (
          <>
            <div className="px-5 py-3 border-b border-border shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-subtle" />
                <Input
                  className="pl-9"
                  placeholder="Buscar propiedad por título, dirección o barrio..."
                  value={propSearch}
                  onChange={(e) => setPropSearch(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {searchingProps ? (
                <p className="text-sm text-fg-subtle text-center py-4">Buscando...</p>
              ) : properties.length === 0 ? (
                <p className="text-sm text-fg-subtle text-center py-4">Sin resultados</p>
              ) : (
                <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
                  {properties.map((prop) => (
                    <button
                      key={prop.tokko_id}
                      onClick={() => selectProperty(prop)}
                      className="bg-surface rounded-lg overflow-hidden border border-border hover:border-border-strong transition-colors text-left"
                    >
                      {prop.imagen ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={prop.imagen} alt="" className="w-full h-32 object-cover" />
                      ) : (
                        <div className="w-full h-32 bg-surface-2 flex items-center justify-center">
                          <span className="text-3xl">🏢</span>
                        </div>
                      )}
                      <div className="p-2">
                        <p className="text-sm font-medium text-fg truncate">{prop.titulo}</p>
                        <p className="text-2xs text-fg-muted truncate">{prop.barrio || '—'}</p>
                        {prop.precio && (
                          <p className="text-2xs font-mono tabular-nums text-brand mt-1">
                            {prop.moneda || 'USD'} {Number(prop.precio).toLocaleString('es-AR')}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="flex gap-3 bg-surface-2 rounded-md p-3">
              {selectedProp?.imagen && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selectedProp.imagen} alt="" className="w-20 h-20 rounded object-cover shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-fg truncate">{selectedProp?.titulo}</p>
                <p className="text-2xs text-fg-muted">{selectedProp?.barrio}</p>
                <button
                  type="button"
                  onClick={() => { setStep('property'); setSelectedProp(null) }}
                  className="text-2xs text-brand hover:underline mt-1"
                >
                  Cambiar propiedad
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Texto del post</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={generateCopy}
                  disabled={generating}
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  {generating ? 'Generando...' : 'Generar con IA'}
                </Button>
              </div>
              <Textarea
                value={copy}
                onChange={(e) => setCopy(e.target.value)}
                placeholder="Escribí el texto del post o usá el generador IA..."
                rows={8}
                required
              />
              <p className="text-2xs font-mono tabular-nums text-fg-subtle">{copy.length} caracteres</p>
            </div>

            <div className="space-y-2">
              <Label>Cuentas sociales</Label>
              {accounts.length === 0 ? (
                <p className="text-2xs text-fg-subtle">No hay cuentas conectadas en GHL.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {accounts.map((acc) => {
                    const selected = selectedAccounts.has(acc.id)
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => toggleAccount(acc.id)}
                        className={`px-3 py-1.5 rounded text-2xs border transition-colors ${
                          selected
                            ? 'bg-brand text-brand-fg border-brand'
                            : 'bg-surface text-fg border-border hover:border-border-strong'
                        }`}
                      >
                        {acc.platform} · {acc.name}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Fecha y hora de publicación</Label>
              <Input
                type="datetime-local"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                required
              />
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button
                type="submit"
                disabled={submitting || selectedAccounts.size === 0 || !copy.trim()}
              >
                {submitting ? 'Programando...' : 'Programar post'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
