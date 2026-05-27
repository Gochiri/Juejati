'use client'
import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  generateMonthGrid,
  startOfMonthGrid,
  endOfMonthGrid,
  isSameDay,
  formatMonth,
  formatTime,
} from '@/lib/calendar'
import type { GHLAppointment } from '@/lib/ghl'

interface Props {
  onCreateClick: () => void
  onEventClick: (event: GHLAppointment) => void
  refreshKey?: number
}

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export function CalendarView({ onCreateClick, onEventClick, refreshKey }: Props) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d
  })
  const [events, setEvents] = useState<GHLAppointment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const days = useMemo(() => generateMonthGrid(currentMonth), [currentMonth])

  useEffect(() => {
    const startTime = startOfMonthGrid(currentMonth).toISOString()
    const endTime = endOfMonthGrid(currentMonth).toISOString()
    setLoading(true)
    setError('')
    fetch(`/api/calendar/events?startTime=${startTime}&endTime=${endTime}`)
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error || 'Error')
        return res.json()
      })
      .then((data) => setEvents(data.events || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [currentMonth, refreshKey])

  function prevMonth() {
    const d = new Date(currentMonth)
    d.setMonth(d.getMonth() - 1)
    setCurrentMonth(d)
  }

  function nextMonth() {
    const d = new Date(currentMonth)
    d.setMonth(d.getMonth() + 1)
    setCurrentMonth(d)
  }

  function eventsForDay(day: Date): GHLAppointment[] {
    return events.filter((e) => isSameDay(new Date(e.startTime), day))
  }

  const today = new Date()

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shrink-0">
        <Button variant="outline" size="icon" onClick={prevMonth}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h2 className="font-bold text-lg capitalize flex-1">{formatMonth(currentMonth)}</h2>
        <Button variant="outline" size="icon" onClick={nextMonth}>
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const d = new Date()
            d.setDate(1)
            setCurrentMonth(d)
          }}
        >
          Hoy
        </Button>
        <Button onClick={onCreateClick}>
          <Plus className="w-4 h-4 mr-1" /> Nueva visita
        </Button>
      </div>

      {error && <p className="text-sm text-red-500 px-4 py-2">{error}</p>}
      {loading && <p className="text-sm text-gray-400 px-4 py-1">Cargando...</p>}

      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="grid grid-cols-7 sticky top-0 bg-white border-b border-gray-200">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-xs font-semibold text-gray-500 text-center py-2 uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px bg-gray-200 p-px">
          {days.map((day, i) => {
            const inMonth = day.getMonth() === currentMonth.getMonth()
            const isToday = isSameDay(day, today)
            const dayEvents = eventsForDay(day)
            return (
              <div
                key={i}
                className={`min-h-[100px] bg-white p-1.5 ${!inMonth ? 'opacity-40' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-medium ${
                      isToday
                        ? 'bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center'
                        : 'text-gray-700'
                    }`}
                  >
                    {day.getDate()}
                  </span>
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <button
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className="block w-full text-left px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-xs truncate hover:bg-blue-200 transition-colors"
                    >
                      {formatTime(event.startTime)} {event.title}
                    </button>
                  ))}
                  {dayEvents.length > 3 && (
                    <p className="text-xs text-gray-400 px-1.5">+{dayEvents.length - 3} más</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
