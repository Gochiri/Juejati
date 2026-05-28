'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { GHLLead } from '@/lib/ghl'

const SCORE_DOT: Record<string, string> = {
  frio: 'bg-info',
  tibio: 'bg-warning',
  caliente: 'bg-danger',
}

/**
 * Fields fetched lazily from /api/leads/{contactId} when the drawer opens.
 * These come from the contact endpoint (full custom fields), which the
 * /opportunities/search endpoint does NOT include.
 */
export interface EnrichedFields {
  email?: string
  zona?: string | null
  operacion?: string | null
  presupuesto_ia?: string | null
  ambientes?: string | null
  score_lead?: string | null
  propiedad_tokko_id?: string | null
  titulo_propiedad?: string | null
  precio_propiedad?: string | null
  ubicacion_propiedad?: string | null
  link_propiedad?: string | null
}

interface Props {
  opportunity: GHLLead | null
  stageName: string
  onClose: () => void
  /**
   * Called once when the lazy contact fetch resolves. The pipeline page uses
   * this to backfill the kanban card and the localStorage cache with the
   * full custom fields, so the card shows score dot/criteria on next render.
   */
  onEnriched?: (contactId: string, enriched: EnrichedFields) => void
}

export function OpportunityDrawer({ opportunity, stageName, onClose, onEnriched }: Props) {
  const router = useRouter()
  const [enriched, setEnriched] = useState<EnrichedFields | null>(null)
  const [loading, setLoading] = useState(false)
  // Hold the latest onEnriched in a ref so the fetch effect doesn't re-run
  // when the parent re-renders with a fresh callback identity.
  const onEnrichedRef = useRef(onEnriched)
  useEffect(() => {
    onEnrichedRef.current = onEnriched
  }, [onEnriched])

  const contactId = opportunity?.contactId
  useEffect(() => {
    if (!contactId) {
      setEnriched(null)
      setLoading(false)
      return
    }
    let cancelled = false
    setEnriched(null)
    setLoading(true)
    fetch('/api/leads/' + contactId)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return
        const e: EnrichedFields = {
          email: data.email ?? undefined,
          zona: data.zona ?? null,
          operacion: data.operacion ?? null,
          presupuesto_ia: data.presupuesto_ia ?? null,
          ambientes: data.ambientes ?? null,
          score_lead: data.score_lead ?? null,
          propiedad_tokko_id: data.propiedad_tokko_id ?? null,
          titulo_propiedad: data.titulo_propiedad ?? null,
          precio_propiedad: data.precio_propiedad ?? null,
          ubicacion_propiedad: data.ubicacion_propiedad ?? null,
          link_propiedad: data.link_propiedad ?? null,
        }
        setEnriched(e)
        onEnrichedRef.current?.(contactId, e)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [contactId])

  if (!opportunity) return null

  // Prefer enriched values once the contact fetch resolves; fall back to props before then.
  function pick<K extends keyof EnrichedFields>(k: K): EnrichedFields[K] | undefined {
    return enriched ? enriched[k] : (opportunity as any)?.[k]
  }

  // Display helper: "…" while the lazy fetch is in flight, "—" if truly empty.
  function display(v: any): string {
    if (v == null || v === '') return loading && !enriched ? '…' : '—'
    return String(v)
  }

  const score = (pick('score_lead') as string | null | undefined)?.toLowerCase()
  const dotClass = score ? SCORE_DOT[score] : null
  const propiedadId = pick('propiedad_tokko_id')

  function openConversation() {
    if (!opportunity) return
    router.push('/?contactId=' + opportunity.contactId)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-fg/20 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Drawer panel */}
      <aside
        className="fixed top-0 right-0 h-full w-[400px] bg-surface shadow-xl z-50 flex flex-col"
        role="dialog"
        aria-label="Detalle de oportunidad"
      >
        <header className="px-4 py-3 border-b border-border flex items-start gap-2">
          {dotClass && <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${dotClass}`} />}
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-fg truncate">{opportunity.name}</h2>
            <p className="text-xs text-fg-muted truncate">Etapa: {stageName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-fg-subtle hover:text-fg shrink-0"
            aria-label="Cerrar"
          >
            ×
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-sm">
          <section>
            <h3 className="font-semibold text-xs uppercase text-fg-muted mb-2">Contacto</h3>
            <dl className="space-y-1">
              <div className="flex justify-between gap-2">
                <dt className="text-fg-muted">Teléfono</dt>
                <dd className="text-fg truncate">{opportunity.phone || '—'}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-fg-muted">Email</dt>
                <dd className="text-fg truncate">{display(pick('email'))}</dd>
              </div>
            </dl>
          </section>

          <section>
            <h3 className="font-semibold text-xs uppercase text-fg-muted mb-2">Lead</h3>
            <dl className="space-y-1">
              <div className="flex justify-between gap-2">
                <dt className="text-fg-muted">Zona</dt>
                <dd className="text-fg truncate">{display(pick('zona'))}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-fg-muted">Operación</dt>
                <dd className="text-fg truncate">{display(pick('operacion'))}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-fg-muted">Presupuesto</dt>
                <dd className="text-fg truncate">{display(pick('presupuesto_ia'))}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-fg-muted">Ambientes</dt>
                <dd className="text-fg truncate">{display(pick('ambientes'))}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-fg-muted">Score</dt>
                <dd className="text-fg truncate capitalize">{display(pick('score_lead'))}</dd>
              </div>
            </dl>
          </section>

          {propiedadId && (
            <section>
              <h3 className="font-semibold text-xs uppercase text-fg-muted mb-2">Propiedad asignada</h3>
              <dl className="space-y-1">
                <div className="flex justify-between gap-2">
                  <dt className="text-fg-muted">Título</dt>
                  <dd className="text-fg truncate">{display(pick('titulo_propiedad'))}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-fg-muted">Precio</dt>
                  <dd className="text-fg truncate">{display(pick('precio_propiedad'))}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-fg-muted">Ubicación</dt>
                  <dd className="text-fg truncate">{display(pick('ubicacion_propiedad'))}</dd>
                </div>
                {pick('link_propiedad') && (
                  <div>
                    <a
                      href={pick('link_propiedad') as string}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand hover:underline text-xs"
                    >
                      Ver ficha →
                    </a>
                  </div>
                )}
              </dl>
            </section>
          )}
        </div>

        <footer className="px-4 py-3 border-t border-border flex gap-2 shrink-0">
          <button
            onClick={openConversation}
            className="flex-1 bg-brand hover:bg-brand-hover text-brand-fg text-sm font-medium py-2 px-3 rounded-md"
          >
            Abrir conversación
          </button>
          <button
            onClick={onClose}
            className="bg-surface-2 hover:bg-border text-fg text-sm font-medium py-2 px-3 rounded-md"
          >
            Cerrar
          </button>
        </footer>
      </aside>
    </>
  )
}
