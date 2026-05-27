'use client'
import { useRouter } from 'next/navigation'
import type { GHLLead } from '@/lib/ghl'

const SCORE_DOT: Record<string, string> = {
  frio: 'bg-blue-400',
  tibio: 'bg-yellow-400',
  caliente: 'bg-red-400',
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
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Drawer panel */}
      <aside
        className="fixed top-0 right-0 h-full w-[400px] bg-white shadow-xl z-50 flex flex-col"
        role="dialog"
        aria-label="Detalle de oportunidad"
      >
        <header className="px-4 py-3 border-b border-gray-200 flex items-start gap-2">
          {dotClass && <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${dotClass}`} />}
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900 truncate">{opportunity.name}</h2>
            <p className="text-xs text-gray-500 truncate">Etapa: {stageName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 shrink-0"
            aria-label="Cerrar"
          >
            ×
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-sm">
          <section>
            <h3 className="font-semibold text-xs uppercase text-gray-500 mb-2">Contacto</h3>
            <dl className="space-y-1">
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">Teléfono</dt>
                <dd className="text-gray-900 truncate">{opportunity.phone || '—'}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">Email</dt>
                <dd className="text-gray-900 truncate">{opportunity.email || '—'}</dd>
              </div>
            </dl>
          </section>

          <section>
            <h3 className="font-semibold text-xs uppercase text-gray-500 mb-2">Lead</h3>
            <dl className="space-y-1">
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">Zona</dt>
                <dd className="text-gray-900 truncate">{opportunity.zona || '—'}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">Operación</dt>
                <dd className="text-gray-900 truncate">{opportunity.operacion || '—'}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">Presupuesto</dt>
                <dd className="text-gray-900 truncate">{opportunity.presupuesto_ia || '—'}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">Ambientes</dt>
                <dd className="text-gray-900 truncate">{opportunity.ambientes || '—'}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">Score</dt>
                <dd className="text-gray-900 truncate capitalize">{opportunity.score_lead || '—'}</dd>
              </div>
            </dl>
          </section>

          {opportunity.propiedad_tokko_id && (
            <section>
              <h3 className="font-semibold text-xs uppercase text-gray-500 mb-2">Propiedad asignada</h3>
              <dl className="space-y-1">
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">Título</dt>
                  <dd className="text-gray-900 truncate">{opportunity.titulo_propiedad || '—'}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">Precio</dt>
                  <dd className="text-gray-900 truncate">{opportunity.precio_propiedad || '—'}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">Ubicación</dt>
                  <dd className="text-gray-900 truncate">{opportunity.ubicacion_propiedad || '—'}</dd>
                </div>
                {opportunity.link_propiedad && (
                  <div>
                    <a
                      href={opportunity.link_propiedad}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline text-xs"
                    >
                      Ver ficha →
                    </a>
                  </div>
                )}
              </dl>
            </section>
          )}
        </div>

        <footer className="px-4 py-3 border-t border-gray-200 flex gap-2 shrink-0">
          <button
            onClick={openConversation}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-md"
          >
            Abrir conversación
          </button>
          <button
            onClick={onClose}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 px-3 rounded-md"
          >
            Cerrar
          </button>
        </footer>
      </aside>
    </>
  )
}
