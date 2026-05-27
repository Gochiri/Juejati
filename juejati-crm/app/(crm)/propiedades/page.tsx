'use client'
import { useState, useEffect, useRef } from 'react'
import { PropertyCard } from '@/components/properties/PropertyCard'
import { PropertyFilters, type FilterValues } from '@/components/properties/PropertyFilters'
import type { Property } from '@/lib/ghl'

const PAGE_SIZE = 48

const INITIAL_FILTERS: FilterValues = {
  q: '',
  barrio: '',
  ambientes: '',
  operacion: '',
  precio_max: '',
}

export default function PropiedadesPage() {
  const [filters, setFilters] = useState<FilterValues>(INITIAL_FILTERS)
  const [properties, setProperties] = useState<Property[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  async function load(opts?: { resetOffset?: boolean }) {
    setLoading(true)
    setError('')
    const currentOffset = opts?.resetOffset ? 0 : offset
    if (opts?.resetOffset) setOffset(0)

    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(currentOffset),
    })
    if (filters.q) params.set('q', filters.q)
    if (filters.barrio) params.set('barrio', filters.barrio)
    if (filters.ambientes) params.set('ambientes', filters.ambientes)
    if (filters.operacion) params.set('operacion', filters.operacion)
    if (filters.precio_max) params.set('precio_max', filters.precio_max)

    try {
      const res = await fetch('/api/properties?' + params)
      if (!res.ok) throw new Error((await res.json()).error || 'Error')
      const data = await res.json()
      setProperties(data.properties || [])
      setTotal(data.total || 0)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Debounced reload on filter change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => load({ resetOffset: true }), 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  // Reload on offset change (pagination)
  useEffect(() => {
    if (offset === 0) return // already loaded by filters effect
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset])

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PropertyFilters values={filters} onChange={setFilters} />

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

        {loading && properties.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-12">Cargando propiedades...</p>
        ) : properties.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-12">Sin propiedades con esos filtros</p>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {properties.map((prop) => (
              <PropertyCard key={prop.tokko_id} property={prop} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-6 gap-2 pb-4">
            {currentPage > 1 && (
              <button
                onClick={() => setOffset((currentPage - 2) * PAGE_SIZE)}
                className="px-3 py-1.5 rounded-lg bg-white border text-sm hover:border-blue-400"
              >
                ← Prev
              </button>
            )}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4))
              const page = start + i
              if (page > totalPages) return null
              return (
                <button
                  key={page}
                  onClick={() => setOffset((page - 1) * PAGE_SIZE)}
                  className={`px-3 py-1.5 rounded-lg text-sm ${
                    page === currentPage
                      ? 'bg-blue-600 text-white border border-blue-600'
                      : 'bg-white border hover:border-blue-400'
                  }`}
                >
                  {page}
                </button>
              )
            })}
            {currentPage < totalPages && (
              <button
                onClick={() => setOffset(currentPage * PAGE_SIZE)}
                className="px-3 py-1.5 rounded-lg bg-white border text-sm hover:border-blue-400"
              >
                Sig →
              </button>
            )}
            <span className="text-xs text-gray-400 self-center ml-1">{total} propiedades</span>
          </div>
        )}
      </div>
    </div>
  )
}
