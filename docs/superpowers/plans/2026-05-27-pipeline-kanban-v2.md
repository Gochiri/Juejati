# Pipeline Kanban v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the `/pipeline` kanban so it (1) loads every opportunity from GHL, (2) opens an opportunity-detail drawer when a card is clicked, and (3) supports drag-and-drop between stages with persistence in GHL.

**Architecture:** Client-side paginated fetch on mount; React state holds `leadsByStage` keyed by stageId. A new `OpportunityDrawer` renders opportunity details and links to the inbox. `@dnd-kit/core` wraps the columns; on drag end an optimistic state update fires, then `PATCH /api/opportunities/:id/stage` (a new route) calls a new `updateOpportunityStage` helper that hits `PUT /opportunities/{id}` on GHL. On failure the state rolls back.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript, Tailwind, `@dnd-kit/core` 6.x, GHL REST API v2021-07-28.

**Spec:** [docs/superpowers/specs/2026-05-27-pipeline-kanban-v2-design.md](../specs/2026-05-27-pipeline-kanban-v2-design.md)

**Note on testing:** This codebase has no test runner installed (no Jest/Vitest in `juejati-crm/package.json`). Tasks verify with manual smoke checks (curl for endpoints, browser checks for UI) — this matches the project's existing discipline. Adding a test framework is out of scope.

**Note on branching:** Recent project history shows direct commits to `main`. This plan follows that pattern. If the executor prefers a feature branch, branch off `main` before Task 1 and PR at the end.

---

## File Structure

| Path | Responsibility | Status |
|---|---|---|
| `juejati-crm/lib/ghl.ts` | GHL API helpers — add `updateOpportunityStage` | Modify |
| `juejati-crm/app/api/opportunities/[id]/stage/route.ts` | `PATCH` endpoint that moves an opportunity to a new stage | Create |
| `juejati-crm/app/(crm)/page.tsx` | Inbox page — read `?contactId=` and pre-select | Modify |
| `juejati-crm/components/pipeline/OpportunityDrawer.tsx` | Right-side drawer with opportunity detail + "Abrir conversación" link | Create |
| `juejati-crm/app/(crm)/pipeline/page.tsx` | Kanban page — paginated fetch, DnD wiring, drawer integration | Rewrite |
| `juejati-crm/package.json` + `package-lock.json` | Add `@dnd-kit/core` dependency | Modify |

---

## Task 1: Install `@dnd-kit/core` dependency

**Files:**
- Modify: `juejati-crm/package.json`
- Modify: `juejati-crm/package-lock.json`

- [ ] **Step 1: Install the library**

Run from the repo root:

```bash
cd juejati-crm && npm install @dnd-kit/core@^6.1.0
```

Expected: a new entry `"@dnd-kit/core": "^6.1.0"` appears under `dependencies` in `package.json`, and `package-lock.json` is updated. No peer-dependency warnings beyond React (React 18 is already installed).

- [ ] **Step 2: Verify it installed**

Run:

```bash
cd juejati-crm && node -e "console.log(require('@dnd-kit/core/package.json').version)"
```

Expected: prints a version like `6.1.0` or higher.

- [ ] **Step 3: Verify build still passes**

Run:

```bash
cd juejati-crm && npm run build
```

Expected: build succeeds with no errors. (We haven't used `@dnd-kit` yet, just installed it.)

- [ ] **Step 4: Commit**

```bash
git add juejati-crm/package.json juejati-crm/package-lock.json
git commit -m "chore: add @dnd-kit/core for pipeline drag-and-drop"
```

---

## Task 2: Add `updateOpportunityStage` helper in `lib/ghl.ts`

**Files:**
- Modify: `juejati-crm/lib/ghl.ts` (append a new exported function near the existing opportunity-related code)

- [ ] **Step 1: Add the function**

Open `juejati-crm/lib/ghl.ts` and append this function at the end of the file (after `createSocialPost`):

```ts
export async function updateOpportunityStage(
  opportunityId: string,
  stageId: string,
): Promise<void> {
  const res = await fetch(`${GHL_API_BASE}/opportunities/${opportunityId}`, {
    method: 'PUT',
    headers: ghlHeaders(),
    body: JSON.stringify({ pipelineStageId: stageId }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Update opportunity stage error: ${res.status} ${err}`)
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:

```bash
cd juejati-crm && npx tsc --noEmit
```

Expected: no errors. (`GHL_API_BASE` and `ghlHeaders` are already imported at the top of the file.)

- [ ] **Step 3: Commit**

```bash
git add juejati-crm/lib/ghl.ts
git commit -m "feat(ghl): add updateOpportunityStage helper"
```

---

## Task 3: Create `PATCH /api/opportunities/[id]/stage` route

**Files:**
- Create: `juejati-crm/app/api/opportunities/[id]/stage/route.ts`

- [ ] **Step 1: Create the route file**

Create `juejati-crm/app/api/opportunities/[id]/stage/route.ts` with this exact content:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { updateOpportunityStage } from '@/lib/ghl'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }
  const stageId = body?.stageId

  if (!stageId || typeof stageId !== 'string') {
    return NextResponse.json({ error: 'stageId requerido' }, { status: 400 })
  }

  try {
    await updateOpportunityStage(id, stageId)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[PATCH /api/opportunities/:id/stage]', err)
    return NextResponse.json({ error: err.message || 'Error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Verify the build picks up the new route**

Run:

```bash
cd juejati-crm && npm run build
```

Expected: build succeeds. In the route summary at the end, `/api/opportunities/[id]/stage` should appear as a dynamic route.

- [ ] **Step 3: Smoke-test the endpoint with curl (unauthenticated)**

In one terminal start the dev server:

```bash
cd juejati-crm && npm run dev
```

In another terminal:

```bash
curl -i -X PATCH http://localhost:3000/api/opportunities/test-id/stage \
  -H "Content-Type: application/json" \
  -d '{"stageId":"abc"}'
```

Expected: `HTTP/1.1 401 Unauthorized` with body `{"error":"Unauthorized"}` (we don't have a session cookie). This proves auth is wired and the route resolved.

Stop the dev server (Ctrl+C).

- [ ] **Step 4: Commit**

```bash
git add juejati-crm/app/api/opportunities/[id]/stage/route.ts
git commit -m "feat: PATCH /api/opportunities/:id/stage endpoint"
```

---

## Task 4: Inbox reads `?contactId=` from URL and pre-selects the lead

**Files:**
- Modify: `juejati-crm/app/(crm)/page.tsx`

This makes the drawer's "Abrir conversación" deep-link work.

- [ ] **Step 1: Replace the inbox page**

Replace the entire contents of `juejati-crm/app/(crm)/page.tsx` with:

```tsx
'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { LeadList } from '@/components/inbox/LeadList'
import { ChatPanel } from '@/components/inbox/ChatPanel'
import { ContactDetail } from '@/components/inbox/ContactDetail'
import type { GHLLead } from '@/lib/ghl'

export default function InboxPage() {
  const [selected, setSelected] = useState<GHLLead | null>(null)
  const searchParams = useSearchParams()
  const contactIdParam = searchParams.get('contactId')

  useEffect(() => {
    if (!contactIdParam || selected?.contactId === contactIdParam) return
    let cancelled = false
    fetch('/api/leads/' + contactIdParam)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return
        // Build a minimal GHLLead shape from the contact endpoint response
        setSelected({
          opportunityId: '',
          contactId: data.contactId,
          name: data.name,
          phone: data.phone || '',
          email: data.email || '',
          stage: '',
          source: data.source ?? undefined,
          createdAt: data.dateAdded ?? undefined,
          score_lead: data.score_lead ?? null,
          zona: data.zona ?? null,
          operacion: data.operacion ?? null,
          presupuesto_ia: data.presupuesto_ia ?? null,
          ambientes: data.ambientes ?? null,
          propiedad_tokko_id: data.propiedad_tokko_id ?? null,
          titulo_propiedad: data.titulo_propiedad ?? null,
          precio_propiedad: data.precio_propiedad ?? null,
          ubicacion_propiedad: data.ubicacion_propiedad ?? null,
          link_propiedad: data.link_propiedad ?? null,
        })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [contactIdParam, selected?.contactId])

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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:

```bash
cd juejati-crm && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Smoke-test in the browser**

Start dev server: `cd juejati-crm && npm run dev`

In your browser, log in, then navigate to:

```
http://localhost:3000/?contactId=<any-valid-contact-id-from-your-GHL>
```

(You can grab one by opening the inbox and inspecting a `LeadCard`'s data, or from a previous `/api/leads` response.)

Expected: the inbox loads with that lead pre-selected in the middle panel (chat) and right panel (contact detail). If `contactId` is invalid, the page still renders and nothing is selected (no crash).

Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add juejati-crm/app/\(crm\)/page.tsx
git commit -m "feat(inbox): pre-select lead from ?contactId= URL param"
```

---

## Task 5: Create the `OpportunityDrawer` component

**Files:**
- Create: `juejati-crm/components/pipeline/OpportunityDrawer.tsx`

- [ ] **Step 1: Create the component**

Create `juejati-crm/components/pipeline/OpportunityDrawer.tsx` with:

```tsx
'use client'
import { useRouter } from 'next/navigation'
import type { GHLLead } from '@/lib/ghl'

const SCORE_DOT: Record<string, string> = {
  frio: 'bg-blue-400',
  tibio: 'bg-yellow-400',
  caliente: 'bg-red-400',
}

interface Props {
  opportunity: GHLLead | null
  stageName: string
  onClose: () => void
}

export function OpportunityDrawer({ opportunity, stageName, onClose }: Props) {
  const router = useRouter()
  if (!opportunity) return null

  const score = opportunity.score_lead?.toLowerCase()
  const dotClass = score ? SCORE_DOT[score] : null

  function openConversation() {
    if (!opportunity) return
    router.push('/?contactId=' + opportunity.contactId)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Drawer panel */}
      <aside
        className="fixed top-0 right-0 h-full w-[400px] bg-white shadow-xl z-50 flex flex-col"
        role="dialog"
        aria-label="Detalle de oportunidad"
      >
        <header className="px-4 py-3 border-b border-gray-200 flex items-start gap-2">
          {dotClass && <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${dotClass}`} />}
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900 truncate">{opportunity.name}</h2>
            <p className="text-xs text-gray-500 truncate">Etapa: {stageName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 shrink-0"
            aria-label="Cerrar"
          >
            ×
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-sm">
          <section>
            <h3 className="font-semibold text-xs uppercase text-gray-500 mb-2">Contacto</h3>
            <dl className="space-y-1">
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">Teléfono</dt>
                <dd className="text-gray-900 truncate">{opportunity.phone || '—'}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">Email</dt>
                <dd className="text-gray-900 truncate">{opportunity.email || '—'}</dd>
              </div>
            </dl>
          </section>

          <section>
            <h3 className="font-semibold text-xs uppercase text-gray-500 mb-2">Lead</h3>
            <dl className="space-y-1">
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">Zona</dt>
                <dd className="text-gray-900 truncate">{opportunity.zona || '—'}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">Operación</dt>
                <dd className="text-gray-900 truncate">{opportunity.operacion || '—'}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">Presupuesto</dt>
                <dd className="text-gray-900 truncate">{opportunity.presupuesto_ia || '—'}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">Ambientes</dt>
                <dd className="text-gray-900 truncate">{opportunity.ambientes || '—'}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">Score</dt>
                <dd className="text-gray-900 truncate capitalize">{opportunity.score_lead || '—'}</dd>
              </div>
            </dl>
          </section>

          {opportunity.propiedad_tokko_id && (
            <section>
              <h3 className="font-semibold text-xs uppercase text-gray-500 mb-2">Propiedad asignada</h3>
              <dl className="space-y-1">
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">Título</dt>
                  <dd className="text-gray-900 truncate">{opportunity.titulo_propiedad || '—'}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">Precio</dt>
                  <dd className="text-gray-900 truncate">{opportunity.precio_propiedad || '—'}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">Ubicación</dt>
                  <dd className="text-gray-900 truncate">{opportunity.ubicacion_propiedad || '—'}</dd>
                </div>
                {opportunity.link_propiedad && (
                  <div>
                    <a
                      href={opportunity.link_propiedad}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline text-xs"
                    >
                      Ver ficha →
                    </a>
                  </div>
                )}
              </dl>
            </section>
          )}
        </div>

        <footer className="px-4 py-3 border-t border-gray-200 flex gap-2 shrink-0">
          <button
            onClick={openConversation}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-md"
          >
            Abrir conversación
          </button>
          <button
            onClick={onClose}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 px-3 rounded-md"
          >
            Cerrar
          </button>
        </footer>
      </aside>
    </>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:

```bash
cd juejati-crm && npx tsc --noEmit
```

Expected: no errors. (The component isn't used anywhere yet — that's fine, Next/TS won't complain about an unimported file.)

- [ ] **Step 3: Commit**

```bash
git add juejati-crm/components/pipeline/OpportunityDrawer.tsx
git commit -m "feat(pipeline): OpportunityDrawer component"
```

---

## Task 6: Rewrite the pipeline page (paginated fetch + DnD + drawer)

**Files:**
- Modify: `juejati-crm/app/(crm)/pipeline/page.tsx` (full rewrite)

This is the big one. We replace the whole file.

- [ ] **Step 1: Replace the pipeline page**

Replace the entire contents of `juejati-crm/app/(crm)/pipeline/page.tsx` with:

```tsx
'use client'
import { useState, useEffect } from 'react'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { OpportunityDrawer } from '@/components/pipeline/OpportunityDrawer'
import type { GHLLead } from '@/lib/ghl'

interface Stage {
  id: string
  name: string
  position: number
}

interface Pipeline {
  id: string
  name: string
  stages: Stage[]
}

const SCORE_DOT: Record<string, string> = {
  frio: 'bg-blue-400',
  tibio: 'bg-yellow-400',
  caliente: 'bg-red-400',
}

const SIN_ETAPA = '__sin_etapa__'
const PAGE_SIZE = 100

export default function PipelinePage() {
  const [pipeline, setPipeline] = useState<Pipeline | null>(null)
  const [leadsByStage, setLeadsByStage] = useState<Record<string, GHLLead[]>>({})
  const [loadingMsg, setLoadingMsg] = useState<string | null>('Cargando pipeline...')
  const [error, setError] = useState('')
  const [selectedOpp, setSelectedOpp] = useState<GHLLead | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const pRes = await fetch('/api/pipelines')
        if (!pRes.ok) throw new Error('Error al cargar pipeline')
        const pData = await pRes.json()
        const firstPipeline = pData.pipelines?.[0]
        if (!firstPipeline) throw new Error('No hay pipelines en GHL')
        if (cancelled) return
        setPipeline(firstPipeline)

        // Paginated fetch — walk every page until hasMore is false
        const all: GHLLead[] = []
        let page = 1
        let total = 0
        while (!cancelled) {
          const lRes = await fetch(`/api/leads?limit=${PAGE_SIZE}&page=${page}`)
          if (!lRes.ok) throw new Error('Error al cargar leads')
          const lData = await lRes.json()
          const pageLeads: GHLLead[] = lData.leads || []
          all.push(...pageLeads)
          total = lData.total || all.length
          setLoadingMsg(`Cargando ${all.length} de ${total}...`)
          if (!lData.hasMore || pageLeads.length === 0) break
          page++
        }
        if (cancelled) return

        // Group by stageId. Fallback bucket for opportunities without a recognized stage.
        const grouped: Record<string, GHLLead[]> = {}
        const validStageIds = new Set<string>()
        firstPipeline.stages.forEach((s: Stage) => {
          grouped[s.id] = []
          validStageIds.add(s.id)
        })
        for (const lead of all) {
          const sid = lead.stageId || ''
          if (sid && validStageIds.has(sid)) {
            grouped[sid].push(lead)
          } else {
            if (!grouped[SIN_ETAPA]) grouped[SIN_ETAPA] = []
            grouped[SIN_ETAPA].push(lead)
          }
        }
        setLeadsByStage(grouped)
        setLoadingMsg(null)
      } catch (err: any) {
        if (!cancelled) setError(err.message)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return
    const opportunityId = String(active.id)
    const toStageId = String(over.id)
    const fromStageId = (active.data.current as any)?.fromStageId as string | undefined
    const lead = (active.data.current as any)?.lead as GHLLead | undefined
    if (!fromStageId || !lead || fromStageId === toStageId) return

    // Snapshot for rollback
    const snapshot = leadsByStage

    // Optimistic update
    setLeadsByStage((prev) => {
      const next: Record<string, GHLLead[]> = {}
      for (const k of Object.keys(prev)) {
        next[k] = prev[k].filter((l) => l.opportunityId !== opportunityId)
      }
      const moved: GHLLead = { ...lead, stageId: toStageId }
      next[toStageId] = [moved, ...(next[toStageId] || [])]
      return next
    })

    // Persist
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageId: toStageId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || `HTTP ${res.status}`)
      }
    } catch (err: any) {
      setLeadsByStage(snapshot)
      alert('No se pudo mover la oportunidad: ' + (err.message || 'Error'))
    }
  }

  if (error) {
    return <div className="h-full flex items-center justify-center text-red-500">{error}</div>
  }
  if (!pipeline) {
    return <div className="h-full flex items-center justify-center text-gray-400">{loadingMsg || 'Cargando...'}</div>
  }

  const columns: { key: string; name: string }[] = pipeline.stages.map((s) => ({ key: s.id, name: s.name }))
  if ((leadsByStage[SIN_ETAPA]?.length ?? 0) > 0) {
    columns.push({ key: SIN_ETAPA, name: 'Sin etapa' })
  }
  const stageNameById: Record<string, string> = {}
  pipeline.stages.forEach((s) => (stageNameById[s.id] = s.name))
  stageNameById[SIN_ETAPA] = 'Sin etapa'
  const totalLeads = Object.values(leadsByStage).reduce((acc, arr) => acc + arr.length, 0)

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="px-4 py-3 bg-white border-b border-gray-200 shrink-0 flex items-baseline justify-between">
        <div>
          <h1 className="font-bold text-lg">Pipeline — {pipeline.name}</h1>
          <p className="text-xs text-gray-400">{totalLeads} leads</p>
        </div>
        {loadingMsg && <p className="text-xs text-gray-400">{loadingMsg}</p>}
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-x-auto overflow-y-hidden bg-gray-50">
          <div className="flex gap-3 p-4 h-full">
            {columns.map((col) => (
              <KanbanColumn
                key={col.key}
                stageId={col.key}
                stageName={col.name}
                leads={leadsByStage[col.key] || []}
                onCardClick={setSelectedOpp}
              />
            ))}
          </div>
        </div>
      </DndContext>

      <OpportunityDrawer
        opportunity={selectedOpp}
        stageName={selectedOpp ? stageNameById[selectedOpp.stageId || ''] || 'Sin etapa' : ''}
        onClose={() => setSelectedOpp(null)}
      />
    </div>
  )
}

interface ColumnProps {
  stageId: string
  stageName: string
  leads: GHLLead[]
  onCardClick: (lead: GHLLead) => void
}

function KanbanColumn({ stageId, stageName, leads, onCardClick }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stageId })
  return (
    <div
      ref={setNodeRef}
      className={`w-72 shrink-0 bg-gray-100 rounded-xl p-2 flex flex-col h-full transition ${
        isOver ? 'ring-2 ring-blue-400' : ''
      }`}
    >
      <div className="px-2 py-1.5 flex items-center justify-between shrink-0">
        <h3 className="font-semibold text-sm text-gray-700">{stageName}</h3>
        <span className="text-xs text-gray-500 bg-white px-1.5 py-0.5 rounded">{leads.length}</span>
      </div>
      <div className="overflow-y-auto flex-1 space-y-2 px-1 py-1">
        {leads.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">Sin leads</p>
        ) : (
          leads.map((lead) => (
            <DraggableCard
              key={lead.opportunityId || lead.contactId}
              lead={lead}
              fromStageId={stageId}
              onClick={() => onCardClick(lead)}
            />
          ))
        )}
      </div>
    </div>
  )
}

interface CardProps {
  lead: GHLLead
  fromStageId: string
  onClick: () => void
}

function DraggableCard({ lead, fromStageId, onClick }: CardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.opportunityId,
    data: { fromStageId, lead },
  })
  const score = lead.score_lead?.toLowerCase()
  const dotClass = score ? SCORE_DOT[score] : null
  const criteria = [lead.zona && `📍 ${lead.zona}`, lead.ambientes && `${lead.ambientes} amb`]
    .filter(Boolean)
    .join(' · ')

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        // Suppress click that came from a drag (dnd-kit fires click on pointerup of short drags)
        if (isDragging) return
        e.stopPropagation()
        onClick()
      }}
      className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:border-blue-300 hover:shadow transition cursor-pointer"
    >
      <div className="flex items-start gap-2">
        {dotClass && <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${dotClass}`} />}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900 truncate">{lead.name}</p>
          <p className="text-xs text-gray-500">{lead.phone || '—'}</p>
          {criteria && <p className="text-xs text-gray-400 mt-1 truncate">{criteria}</p>}
          {lead.propiedad_tokko_id && (
            <p className="text-xs text-green-600 mt-1 truncate">
              🏠 {lead.titulo_propiedad || 'Propiedad asignada'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:

```bash
cd juejati-crm && npx tsc --noEmit
```

Expected: no errors. Note: we use `@dnd-kit/utilities` for `CSS.Translate.toString`. It's a peer of `@dnd-kit/core` and ships with it transitively — if `tsc` complains it can't find `@dnd-kit/utilities`, install it explicitly:

```bash
cd juejati-crm && npm install @dnd-kit/utilities@^3.2.2
```

Then re-run `tsc --noEmit`.

- [ ] **Step 3: Verify production build**

Run:

```bash
cd juejati-crm && npm run build
```

Expected: build succeeds, `/pipeline` and `/api/opportunities/[id]/stage` both appear in the route summary.

- [ ] **Step 4: Smoke-test #1 — paginated fetch**

Start dev server: `cd juejati-crm && npm run dev`

In the browser, log in and go to `http://localhost:3000/pipeline`.

Expected:
- Header shows "Cargando N de M..." briefly as pages load, then disappears.
- The "N leads" subtitle equals (or is close to) the total opportunities in your GHL pipeline — NOT capped at 100.
- Open the browser devtools Network tab and confirm there are multiple `GET /api/leads?limit=100&page=1`, `page=2`, ... requests until one returns `hasMore: false`.

- [ ] **Step 5: Smoke-test #2 — click opens drawer**

Click any card.

Expected: a right-side drawer slides in with the opportunity's name, contact data, lead data, and (if applicable) property section. Click the × or "Cerrar" → drawer closes. Click the dark backdrop → drawer closes.

- [ ] **Step 6: Smoke-test #3 — "Abrir conversación" deep-links**

Open the drawer for any card, then click "Abrir conversación".

Expected: the URL changes to `/?contactId=<contactId>`, the inbox loads with that lead's chat and contact detail pre-selected on the right.

- [ ] **Step 7: Smoke-test #4 — drag-and-drop**

Go back to `/pipeline`. Drag any card to a different column.

Expected:
- While dragging, the card is semi-transparent.
- When the pointer is over a different column, that column shows a blue ring.
- On drop, the card appears immediately in the new column (optimistic).
- In devtools Network tab, a `PATCH /api/opportunities/<id>/stage` request fires with body `{"stageId":"..."}` and returns `200 {"ok":true}`.
- Reload the page → the card persists in the new column. (This confirms GHL persisted the change.)

- [ ] **Step 8: Smoke-test #5 — drag failure rolls back**

To test the rollback path, temporarily break the endpoint: with the dev server running, edit `juejati-crm/app/api/opportunities/[id]/stage/route.ts` and add `throw new Error('test')` as the first line inside the `try` block. Save (hot-reload).

Drag a card. Expected: card appears moved briefly, then snaps back to its original column, and an alert pops up: `"No se pudo mover la oportunidad: test"`.

Revert the temporary `throw` and save.

Stop the dev server.

- [ ] **Step 9: Commit**

```bash
git add juejati-crm/app/\(crm\)/pipeline/page.tsx
git commit -m "feat(pipeline): paginated fetch, opportunity drawer, drag-and-drop

- Walks every page of GHL opportunities (no more 100-lead cap).
- Cards open a right-side drawer with full opportunity detail.
- @dnd-kit drag between stages with optimistic update + rollback on failure.
- Card key is opportunityId (not contactId) since a contact may have N deals."
```

If `@dnd-kit/utilities` was installed in Step 2, also stage and amend:

```bash
git add juejati-crm/package.json juejati-crm/package-lock.json
git commit --amend --no-edit
```

---

## Task 7: Push and deploy

- [ ] **Step 1: Push to GitHub**

```bash
git push origin main
```

(Or, if working on a feature branch, push the branch and open a PR.)

- [ ] **Step 2: Deploy via Portainer**

Per the project's deploy memory ([deploy_portainer.md](../../../memory/project_deploy_portainer.md)): the Portainer stack auto-redeploys when GitHub `main` is updated, OR trigger a manual redeploy from the Portainer UI.

- [ ] **Step 3: Verify in production**

Once redeploy finishes, go to the production CRM URL and confirm:
- `/pipeline` shows all opportunities (header subtitle matches your real GHL total).
- Clicking a card opens the drawer.
- Drag-and-drop persists across reload.

---

## Final acceptance checklist

After all tasks complete, verify against the spec's success criteria:

- [ ] `/pipeline` shows every opportunity (no 100-lead cap). Header subtitle = `meta.total`.
- [ ] Clicking any card opens a right-side drawer with full opportunity detail.
- [ ] "Abrir conversación" navigates to `/?contactId=...` and the correct lead is pre-selected.
- [ ] Drag-and-drop visually moves cards immediately (optimistic).
- [ ] After drag, `PATCH /api/opportunities/:id/stage` fires and GHL persists the change (verified by page reload).
- [ ] If the PATCH fails, the card snaps back and an alert is shown.
