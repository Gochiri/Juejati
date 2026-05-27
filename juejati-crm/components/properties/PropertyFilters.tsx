'use client'
import { Input } from '@/components/ui/input'

export interface FilterValues {
  q: string
  barrio: string
  ambientes: string
  operacion: string
  precio_max: string
}

interface Props {
  values: FilterValues
  onChange: (values: FilterValues) => void
}

export function PropertyFilters({ values, onChange }: Props) {
  function update<K extends keyof FilterValues>(key: K, value: FilterValues[K]) {
    onChange({ ...values, [key]: value })
  }

  return (
    <div className="flex flex-wrap items-center gap-2 bg-white border-b border-gray-200 px-4 py-3 shrink-0">
      <Input
        placeholder="Buscar propiedad..."
        value={values.q}
        onChange={(e) => update('q', e.target.value)}
        className="w-48"
      />
      <Input
        placeholder="Barrio"
        value={values.barrio}
        onChange={(e) => update('barrio', e.target.value)}
        className="w-32"
      />
      <select
        value={values.ambientes}
        onChange={(e) => update('ambientes', e.target.value)}
        className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
      >
        <option value="">Ambientes</option>
        <option value="1">1 amb</option>
        <option value="2">2 amb</option>
        <option value="3">3 amb</option>
        <option value="4">4 amb</option>
        <option value="5">5+ amb</option>
      </select>
      <select
        value={values.operacion}
        onChange={(e) => update('operacion', e.target.value)}
        className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
      >
        <option value="">Operación</option>
        <option value="venta">Venta</option>
        <option value="alquiler">Alquiler</option>
      </select>
      <Input
        type="number"
        placeholder="Precio máx (USD)"
        value={values.precio_max}
        onChange={(e) => update('precio_max', e.target.value)}
        className="w-40"
      />
    </div>
  )
}
