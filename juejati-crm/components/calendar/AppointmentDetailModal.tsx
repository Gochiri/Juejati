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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-lg truncate pr-2">{appointment.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <Row icon={<Calendar className="w-4 h-4" />} label="Fecha">
            <span className="capitalize">{dateStr}</span>
            <span className="text-gray-500 ml-2">{formatTime(appointment.startTime)} – {formatTime(appointment.endTime)}</span>
          </Row>

          {appointment.contactId && (
            <Row icon={<User className="w-4 h-4" />} label="Contacto">
              <a
                href={`https://app.gohighlevel.com/v2/location/${process.env.NEXT_PUBLIC_GHL_LOCATION_ID || ''}/contacts/detail/${appointment.contactId}`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline"
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
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              appointment.status === 'confirmed' ? 'bg-green-100 text-green-700' :
              appointment.status === 'cancelled' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-700'
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
      <div className="text-gray-400 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
        <div className="text-sm text-gray-900 mt-0.5">{children}</div>
      </div>
    </div>
  )
}
