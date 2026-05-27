'use client'
import { useState } from 'react'
import { LeadList } from '@/components/inbox/LeadList'
import { ChatPanel } from '@/components/inbox/ChatPanel'
import { ContactDetail } from '@/components/inbox/ContactDetail'
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
      <ContactDetail contactId={selected?.contactId || null} />
    </div>
  )
}
