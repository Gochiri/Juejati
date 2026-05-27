'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import type { GHLMessage } from '@/lib/ghl'

interface Props {
  contactId: string | null
  contactName: string
  contactPhone: string
}

const CHANNEL_VARIANT: Record<string, 'green' | 'blue' | 'purple' | 'yellow' | 'default'> = {
  WhatsApp: 'green',
  TYPE_WHATSAPP: 'green',
  SMS: 'blue',
  TYPE_SMS: 'blue',
  Email: 'purple',
  TYPE_EMAIL: 'purple',
  TYPE_PHONE: 'yellow',
}

const CHANNEL_LABEL: Record<string, string> = {
  TYPE_WHATSAPP: 'WhatsApp',
  TYPE_SMS: 'SMS',
  TYPE_EMAIL: 'Email',
  TYPE_PHONE: 'Llamada',
}

export function ChatPanel({ contactId, contactName, contactPhone }: Props) {
  const [messages, setMessages] = useState<GHLMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(true)
  const currentContactRef = useRef<string | null>(null)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const loadMessages = useCallback(async (cid: string) => {
    try {
      const res = await fetch(`/api/leads/${cid}/messages?limit=30`)
      if (!res.ok) throw new Error((await res.json()).error || 'Error')
      const data = await res.json()
      if (!mountedRef.current) return
      if (currentContactRef.current !== cid) return
      const sorted = [...(data.messages || [])].sort(
        (a: GHLMessage, b: GHLMessage) =>
          new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
      )
      setMessages(sorted)
      setError('')
    } catch (err: any) {
      if (mountedRef.current && currentContactRef.current === cid) setError(err.message)
    }
  }, [])

  useEffect(() => {
    currentContactRef.current = contactId
    if (!contactId) {
      setMessages([])
      return
    }
    const cid = contactId

    setLoading(true)
    loadMessages(cid).finally(() => {
      if (mountedRef.current && currentContactRef.current === cid) setLoading(false)
    })

    const interval = setInterval(() => loadMessages(cid), 10000)
    return () => {
      clearInterval(interval)
    }
  }, [contactId, loadMessages])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!contactId || !text.trim() || sending) return
    setSending(true)
    setError('')
    try {
      const res = await fetch(`/api/leads/${contactId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Error al enviar')
      setText('')
      await loadMessages(contactId)
    } catch (err: any) {
      if (mountedRef.current) setError(err.message)
    } finally {
      if (mountedRef.current) setSending(false)
    }
  }

  function formatTime(dateStr: string | null): string {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!contactId) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-50">
        <div className="text-center">
          <p className="text-lg font-semibold">Seleccioná un lead</p>
          <p className="text-sm mt-1">Elegí un contacto de la lista para ver la conversación.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 h-full overflow-hidden">
      <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center justify-between shrink-0">
        <div>
          <p className="font-semibold text-gray-900">{contactName}</p>
          {contactPhone && (
            <a
              href={`https://wa.me/${contactPhone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-600 hover:underline"
            >
              {contactPhone}
            </a>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && messages.length === 0 && (
          <p className="text-center text-sm text-gray-400">Cargando mensajes...</p>
        )}
        {error && <p className="text-center text-sm text-red-500">{error}</p>}
        {!loading && !error && messages.length === 0 && (
          <p className="text-center text-sm text-gray-400">Sin mensajes</p>
        )}
        {messages.map((msg) => {
          const isOut = msg.direction === 'outbound'
          const channelKey = msg.channel
          const variant = CHANNEL_VARIANT[channelKey] || 'default'
          const label = CHANNEL_LABEL[channelKey] || channelKey
          return (
            <div key={msg.id} className={`flex flex-col ${isOut ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[75%] px-3 py-2 rounded-lg text-sm leading-relaxed whitespace-pre-wrap break-words ${
                  isOut ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-900'
                }`}
              >
                {msg.body}
              </div>
              <div className="flex items-center gap-2 mt-1 px-1">
                {label && <Badge variant={variant}>{label}</Badge>}
                <span className="text-xs text-gray-400">{formatTime(msg.createdAt)}</span>
              </div>
            </div>
          )
        })}
      </div>

      <form onSubmit={handleSend} className="border-t border-gray-200 bg-white p-3 shrink-0">
        <div className="flex gap-2 items-end">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribí un mensaje..."
            rows={2}
            className="flex-1 resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend(e as any)
              }
            }}
          />
          <Button type="submit" disabled={!text.trim() || sending}>
            {sending ? '...' : 'Enviar'}
          </Button>
        </div>
        <p className="text-xs text-gray-400 mt-1.5">Enter para enviar · Shift+Enter para salto de línea</p>
      </form>
    </div>
  )
}
