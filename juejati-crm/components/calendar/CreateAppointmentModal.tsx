'use client'
import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { GHLCalendar, GHLLead } from '@/lib/ghl'

interface Props {
  onClose: () => void
  onCreated: () => void
  preselectedLead?: { contactId: string; name: string } | null
}

export function CreateAppointmentModal({ onClose, onCreated, preselectedLead }: Props) {
  const [calendars, setCalendars] = useState<GHLCalendar[]>([])
  const [calendarId, setCalendarId] = useState('')
  const [contactId, setContactId] = useState(preselectedLead?.contactId || '')
  const [contactName, setContactName] = useState(preselectedLead?.name || '')
  const [leadResults, setLeadResults] = useState<GHLLead[]>([])
  const [searchingLead, setSearchingLead] = useState(false)
  const [title, setTitle] = useState('Visita a propiedad')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [startTime, setStartTime] = useState('10:00')
  const [duration, setDuration] = useState('60')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/calendars')
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error || 'Error')
        return res.json()
      })
      .then((data) => {
        const cals = data.calendars || []
        setCalendars(cals)
        if (cals.length > 0) setCalendarId(cals[0].id)
      })
      .catch((err) => setError(err.message))
  }, [])

  useEffect(() => {
    if (preselectedLead || contactName.length < 2) {
      setLeadResults([])
      return
    }
    const timer = setTimeout(() => {
      setSearchingLead(true)
      fetch(`/api/leads?q=${encodeURIComponent(contactName)}&limit=10`)
        .then((r) => r.json())
        .then((d) => setLeadResults(d.leads || []))
        .catch(() => {})
        .finally(() => setSearchingLead(false))
    }, 400)
    return () => clearTimeout(timer)
  }, [contactName, preselectedLead])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!calendarId || !contactId || !title) {
      setError('Completá todos los campos requeridos')
      return
    }
    setBusy(true)
    setError('')

    const start = new Date(`${date}T${startTime}:00`)
    const end = new Date(start.getTime() + parseInt(duration) * 60000)

    try {
      const res = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calendarId,
          contactId,
          title,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          notes: notes || undefined,
          address: address || undefined,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Error')
      onCreated()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-lg">Nueva visita</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-2">
            <Label>Calendario</Label>
            <select
              value={calendarId}
              onChange={(e) => setCalendarId(e.target.value)}
              required
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
            >
              <option value="">Seleccioná un calendario</option>
              {calendars.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Lead / Contacto</Label>
            {preselectedLead ? (
              <div className="px-3 py-2 bg-blue-50 rounded-md text-sm">
                <span className="font-semibold">{preselectedLead.name}</span>
              </div>
            ) : (
              <div className="relative">
                <Input
                  placeholder="Buscar lead por nombre..."
                  value={contactName}
                  onChange={(e) => { setContactName(e.target.value); setContactId('') }}
                  required
                />
                {leadResults.length > 0 && !contactId && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {leadResults.map((lead) => (
                      <button
                        key={lead.contactId}
                        type="button"
                        onClick={() => {
                          setContactId(lead.contactId)
                          setContactName(lead.name)
                          setLeadResults([])
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                      >
                        <p className="font-medium">{lead.name}</p>
                        <p className="text-xs text-gray-500">{lead.phone}</p>
                      </button>
                    ))}
                  </div>
                )}
                {searchingLead && <p className="text-xs text-gray-400 mt-1">Buscando...</p>}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Hora</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Duración</Label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
              >
                <option value="30">30 min</option>
                <option value="60">1 hora</option>
                <option value="90">1.5 hs</option>
                <option value="120">2 hs</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Dirección (opcional)</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Ej: Av. Corrientes 1234" />
          </div>

          <div className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={busy || !calendarId || !contactId}>
              {busy ? 'Creando...' : 'Crear visita'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
