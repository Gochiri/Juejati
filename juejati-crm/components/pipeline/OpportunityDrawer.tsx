'use client'
import { useRouter } from 'next/navigation'
import type { GHLLead } from '@/lib/ghl'

const SCORE_DOT: Record<string, string> = {
  frio: 'bg-info',
  tibio: 'bg-warning',
  caliente: 'bg-danger',
}

interface Props {
  opportunity: GHLLead | null
  stageName: string
  onClose: () => void
}

export function OpportunityDrawer({ opportunity, stageName, onClose }: Props) {
  const router = useRouter()
  if (!opportunity) return null

  const score = opportunity.score_lead?.toLowerCase()
  const dotClass = score ? SCORE_DOT[score] : null

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
                <dd className="text-fg truncate">{opportunity.email || '—'}</dd>
              </div>
            </dl>
          </section>

          <section>
            <h3 className="font-semibold text-xs uppercase text-fg-muted mb-2">Lead</h3>
            <dl className="space-y-1">
              <div className="flex justify-between gap-2">
                <dt className="text-fg-muted">Zona</dt>
                <dd className="text-fg truncate">{opportunity.zona || '—'}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-fg-muted">Operación</dt>
                <dd className="text-fg truncate">{opportunity.operacion || '—'}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-fg-muted">Presupuesto</dt>
                <dd className="text-fg truncate">{opportunity.presupuesto_ia || '—'}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-fg-muted">Ambientes</dt>
                <dd className="text-fg truncate">{opportunity.ambientes || '—'}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-fg-muted">Score</dt>
                <dd className="text-fg truncate capitalize">{opportunity.score_lead || '—'}</dd>
              </div>
            </dl>
          </section>

          {opportunity.propiedad_tokko_id && (
            <section>
              <h3 className="font-semibold text-xs uppercase text-fg-muted mb-2">Propiedad asignada</h3>
              <dl className="space-y-1">
                <div className="flex justify-between gap-2">
                  <dt className="text-fg-muted">Título</dt>
                  <dd className="text-fg truncate">{opportunity.titulo_propiedad || '—'}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-fg-muted">Precio</dt>
                  <dd className="text-fg truncate">{opportunity.precio_propiedad || '—'}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-fg-muted">Ubicación</dt>
                  <dd className="text-fg truncate">{opportunity.ubicacion_propiedad || '—'}</dd>
                </div>
                {opportunity.link_propiedad && (
                  <div>
                    <a
                      href={opportunity.link_propiedad}
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
