'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { LeadList } from '@/components/inbox/LeadList'
import { ChatPanel } from '@/components/inbox/ChatPanel'
import { ContactDetail } from '@/components/inbox/ContactDetail'
import type { GHLLead } from '@/lib/ghl'

export default function InboxPage() {
  const [selected, setSelected] = useState<GHLLead | null>(null)
  const searchParams = useSearchParams()
  const contactIdParam = searchParams.get('contactId')

  useEffect(() => {
    if (!contactIdParam || selected?.contactId === contactIdParam) return
    let cancelled = false
    fetch('/api/leads/' + contactIdParam)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return
        // Build a minimal GHLLead shape from the contact endpoint response
        setSelected({
          opportunityId: '',
          contactId: data.contactId,
          name: data.name,
          phone: data.phone || '',
          email: data.email || '',
          stage: '',
          source: data.source ?? undefined,
          createdAt: data.dateAdded ?? undefined,
          score_lead: data.score_lead ?? null,
          zona: data.zona ?? null,
          operacion: data.operacion ?? null,
          presupuesto_ia: data.presupuesto_ia ?? null,
          ambientes: data.ambientes ?? null,
          propiedad_tokko_id: data.propiedad_tokko_id ?? null,
          titulo_propiedad: data.titulo_propiedad ?? null,
          precio_propiedad: data.precio_propiedad ?? null,
          ubicacion_propiedad: data.ubicacion_propiedad ?? null,
          link_propiedad: data.link_propiedad ?? null,
        })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [contactIdParam, selected?.contactId])

  return (
    <div className="h-full flex overflow-hidden">
      <LeadList
        selectedId={selected?.contactId || null}
        onSelect={setSelected}
      />
      <ChatPanel
        contactId={selected?.contactId || null}
        contactName={selected?.name || ''}
        contactPhone={selected?.phone || ''}
      />
      <ContactDetail contactId={selected?.contactId || null} />
    </div>
  )
}
