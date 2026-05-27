'use client'
import { X, MapPin, Calendar, User, FileText } from 'lucide-react'
import { formatTime } from '@/lib/calendar'
import type { GHLAppointment } from '@/lib/ghl'

interface Props {
  appointment: GHLAppointment
  onClose: () => void
}

export function AppointmentDetailModal({ appointment, onClose }: Props) {
  const start = new Date(appointment.startTime)
  const dateStr = start.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-surface border border-border rounded-lg w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-medium text-lg text-fg truncate pr-2">{appointment.title}</h2>
          <button onClick={onClose} className="text-fg-subtle hover:text-fg shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <Row icon={<Calendar className="w-4 h-4" />} label="Fecha">
            <span className="capitalize">{dateStr}</span>
            <span className="text-fg-muted ml-2 font-mono tabular-nums">{formatTime(appointment.startTime)} – {formatTime(appointment.endTime)}</span>
          </Row>

          {appointment.contactId && (
            <Row icon={<User className="w-4 h-4" />} label="Contacto">
              <a
                href={`https://app.gohighlevel.com/v2/location/${process.env.NEXT_PUBLIC_GHL_LOCATION_ID || ''}/contacts/detail/${appointment.contactId}`}
                target="_blank"
                rel="noreferrer"
                className="text-brand hover:underline"
              >
                Ver en GHL ↗
              </a>
            </Row>
          )}

          {appointment.address && (
            <Row icon={<MapPin className="w-4 h-4" />} label="Dirección">
              {appointment.address}
            </Row>
          )}

          {appointment.notes && (
            <Row icon={<FileText className="w-4 h-4" />} label="Notas">
              <span className="whitespace-pre-wrap">{appointment.notes}</span>
            </Row>
          )}

          <div className="flex items-center gap-2 pt-2">
            <span className={`text-2xs px-2 py-0.5 rounded font-medium ${
              appointment.status === 'confirmed' ? 'bg-success/15 text-success' :
              appointment.status === 'cancelled' ? 'bg-danger/12 text-danger' :
              'bg-surface-2 text-fg-muted'
            }`}>
              {appointment.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-fg-subtle mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-2xs text-fg-subtle uppercase tracking-wide">{label}</p>
        <div className="text-sm text-fg mt-0.5">{children}</div>
      </div>
    </div>
  )
}
