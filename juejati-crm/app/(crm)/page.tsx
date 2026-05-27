'use client'
import { useState } from 'react'
import { LeadList } from '@/components/inbox/LeadList'
import { ChatPanel } from '@/components/inbox/ChatPanel'
import type { GHLLead } from '@/lib/ghl'

export default function InboxPage() {
  const [selected, setSelected] = useState<GHLLead | null>(null)

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
      <aside className="w-80 bg-white border-l border-gray-200 hidden lg:flex flex-col items-center justify-center text-gray-400 text-sm shrink-0">
        {selected ? (
          <div className="p-4 text-center">
            <p className="font-semibold text-gray-700">{selected.name}</p>
            <p className="text-xs mt-1">Ficha completa — Fase 3</p>
          </div>
        ) : (
          <p>Ficha del contacto</p>
        )}
      </aside>
    </div>
  )
}
