'use client'
import { useState } from 'react'
import { CalendarView } from '@/components/calendar/CalendarView'
import { CreateAppointmentModal } from '@/components/calendar/CreateAppointmentModal'
import { AppointmentDetailModal } from '@/components/calendar/AppointmentDetailModal'
import type { GHLAppointment } from '@/lib/ghl'

export default function AgendaPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [detailEvent, setDetailEvent] = useState<GHLAppointment | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <>
      <CalendarView
        onCreateClick={() => setCreateOpen(true)}
        onEventClick={setDetailEvent}
        refreshKey={refreshKey}
      />
      {createOpen && (
        <CreateAppointmentModal
          onClose={() => setCreateOpen(false)}
          onCreated={() => setRefreshKey((k) => k + 1)}
        />
      )}
      {detailEvent && (
        <AppointmentDetailModal
          appointment={detailEvent}
          onClose={() => setDetailEvent(null)}
        />
      )}
    </>
  )
}
