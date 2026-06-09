'use client'
import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PropertyCard } from '@/components/properties/PropertyCard'
import type { Property } from '@/lib/ghl'

interface Props {
  contactId: string
  currentTokkoId?: string | null
  onClose: () => void
  onAssigned: () => void
}

export function AssignPropertyModal({ contactId, currentTokkoId, onClose, onAssigned }: Props) {
  const [q, setQ] = useState('')
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true)
      const params = new URLSearchParams({ limit: '24' })
      if (q.trim()) params.set('q', q.trim())
      fetch('/api/properties?' + params)
        .then((r) => r.json())
        .then((d) => setProperties(d.properties || []))
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [q])

  async function assign(prop: Property) {
    setBusyId(prop.tokko_id)
    setError('')
    try {
      const res = await fetch(`/api/leads/${contactId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokko_id: prop.tokko_id,
          titulo: prop.titulo,
          precio: prop.precio,
          moneda: prop.moneda,
          link: prop.ficha_tokko,
          ubicacion: [prop.barrio, prop.direccion].filter(Boolean).join(', '),
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      onAssigned()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function clearAssignment() {
    setBusyId(-1)
    setError('')
    try {
      const res = await fetch(`/api/leads/${contactId}/assign`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error)
      onAssigned()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-surface border border-border rounded-lg w-full max-w-4xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-medium text-lg text-fg">Asignar propiedad</h2>
            <p className="text-2xs text-fg-subtle">Elegí una propiedad para vincular al lead</p>
          </div>
          <button onClick={onClose} className="text-fg-subtle hover:text-fg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-border shrink-0">
          <div className="flex gap-2">
            <Input
              placeholder="Buscar por título, dirección o barrio..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoFocus
            />
            {currentTokkoId && (
              <Button
                variant="destructive"
                onClick={clearAssignment}
                disabled={busyId !== null}
              >
                {busyId === -1 ? '...' : 'Quitar asignación'}
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {error && <p className="text-sm text-danger mb-3">{error}</p>}
          {loading ? (
            <p className="text-center text-sm text-fg-subtle py-8">Buscando...</p>
          ) : properties.length === 0 ? (
            <p className="text-center text-sm text-fg-subtle py-8">Sin resultados</p>
          ) : (
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
              {properties.map((prop) => (
                <PropertyCard
                  key={prop.tokko_id}
                  property={prop}
                  assigned={String(currentTokkoId) === String(prop.tokko_id)}
                  onAssign={() => assign(prop)}
                  onClear={clearAssignment}
                  busy={busyId === prop.tokko_id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
