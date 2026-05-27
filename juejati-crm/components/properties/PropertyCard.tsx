'use client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink } from 'lucide-react'
import type { Property } from '@/lib/ghl'

interface Props {
  property: Property
  assigned?: boolean
  onAssign?: () => void
  onClear?: () => void
  busy?: boolean
}

export function PropertyCard({ property, assigned, onAssign, onClear, busy }: Props) {
  const precio = property.precio
    ? `${property.moneda || 'USD'} ${Number(property.precio).toLocaleString('es-AR')}`
    : ''
  const details = [
    property.ambientes && `${property.ambientes} amb`,
    property.dormitorios && `${property.dormitorios} dorm`,
    property.superficie && `${property.superficie} m²`,
  ].filter(Boolean).join(' · ')

  const isVenta = property.operacion?.toLowerCase().includes('venta')

  return (
    <div className={`bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border-2 ${
      assigned ? 'border-green-400' : 'border-transparent'
    }`}>
      <div className="relative h-44 bg-gray-100">
        {property.imagen ? (
          // Using <img> instead of next/image to avoid domain config issues with Tokko URLs
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={property.imagen}
            alt={property.titulo || ''}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-3xl">🏢</span>
          </div>
        )}
        {precio && (
          <span className="absolute top-2 right-2 bg-black/65 text-white text-xs font-bold px-2 py-1 rounded-lg">
            {precio}
          </span>
        )}
        {property.operacion && (
          <Badge
            variant={isVenta ? 'blue' : 'green'}
            className="absolute top-2 left-2"
          >
            {isVenta ? 'Venta' : 'Alquiler'}
          </Badge>
        )}
        {assigned && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
            <Badge variant="green">Asignada ✓</Badge>
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="font-semibold text-gray-900 text-sm leading-tight truncate" title={property.titulo || ''}>
          {property.titulo || 'Sin título'}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 truncate">
          {[property.barrio, property.direccion].filter(Boolean).join(' · ')}
        </p>
        {details && <p className="text-xs text-gray-400 mt-0.5">{details}</p>}
        <div className="mt-3 flex gap-2 items-center">
          {onAssign && (
            <Button
              size="sm"
              variant={assigned ? 'outline' : 'default'}
              onClick={assigned ? onClear : onAssign}
              disabled={busy}
              className="flex-1"
            >
              {busy ? '...' : assigned ? 'Quitar' : 'Asignar'}
            </Button>
          )}
          {property.ficha_tokko && (
            <a
              href={property.ficha_tokko}
              target="_blank"
              rel="noreferrer"
              className="text-gray-400 hover:text-blue-500 p-1.5 shrink-0"
              title="Ver ficha"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
