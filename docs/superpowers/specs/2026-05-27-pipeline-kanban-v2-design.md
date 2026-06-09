# Pipeline Kanban v2 — Design Spec

**Date:** 2026-05-27
**Project:** Juejati CRM (juejati-crm)
**Affected route:** `/pipeline`

---

## Context

The current pipeline view (shipped in commits `4d8845c` and `75b0d38`) renders a kanban grouped by `pipelineStageId` but has three blocking issues reported by the product owner:

1. Only 100 opportunities are fetched (hardcoded `?limit=100`, single page).
2. Cards are not clickable — they render with `cursor-pointer` and hover styles but no `onClick` handler.
3. No drag-and-drop — cards cannot be moved between stages.

This spec defines how the kanban is rebuilt to fix all three.

---

## Domain model

In GHL, an **opportunity** and a **contact** are different entities:

- A **contact** is the person (one record per phone/email).
- An **opportunity** is a deal in a pipeline (with `opportunityId`, `pipelineId`, `pipelineStageId`, monetary value, etc.).
- A single contact can have N opportunities (e.g. Juan in pipeline "Compra" AND pipeline "Alquiler").
- Conversations live at the **contact** level, not opportunity.

The kanban operates on **opportunities**. The inbox (`/`) operates on **contacts**. Click-through respects this split: the drawer shows opportunity data, but a button labelled "Abrir conversación" navigates to the inbox by `contactId`.

This means the card key MUST be `lead.opportunityId`, not `lead.contactId` (contacts can repeat across cards).

---

## Changes

### Fix 1 — Fetch all opportunities (paginate)

**File:** [juejati-crm/app/(crm)/pipeline/page.tsx](juejati-crm/app/(crm)/pipeline/page.tsx)

Replace the single fetch at line 39 with a loop that walks every page until the API reports `hasMore: false`.

- Request `limit=100&page=N` per call (GHL's `opportunities/search` caps at 100).
- Concatenate `leads` arrays across pages.
- No server-side change required — `/api/leads` and `fetchLeads()` already accept `page` and return `hasMore` and `total`.
- Render a small "Cargando X de Y..." indicator during the loop so the user sees progress on large datasets.

### Fix 2 — Clickable cards → opportunity drawer

**New component:** `juejati-crm/components/pipeline/OpportunityDrawer.tsx`

A right-side drawer (width ~400px, full height, slides in from right) shown when an opportunity is selected.

**Props:**
```ts
{
  opportunity: GHLLead | null   // null = closed
  onClose: () => void
  stageName: string             // current stage display name
}
```

**Content layout:**

1. **Header** — opportunity name (`lead.name`) + colored score dot + stage badge + close (×) button.
2. **Sección "Contacto"** — `lead.name`, `lead.phone`, `lead.email`.
3. **Sección "Lead"** — `zona`, `operacion`, `presupuesto_ia`, `ambientes`, `score_lead`.
4. **Sección "Propiedad asignada"** (only if `propiedad_tokko_id` exists) — `titulo_propiedad`, `precio_propiedad`, `ubicacion_propiedad`, `link_propiedad`.
5. **Footer buttons:**
   - Primary: **"Abrir conversación"** → `router.push('/?contactId=' + opportunity.contactId)` (uses `next/navigation`).
   - Secondary: **"Cerrar"** → `onClose()`.

**Pipeline page integration:**
- Local state: `const [selectedOpp, setSelectedOpp] = useState<GHLLead | null>(null)`.
- Each card gets `onClick={() => setSelectedOpp(lead)}`.
- `<OpportunityDrawer opportunity={selectedOpp} onClose={() => setSelectedOpp(null)} />` at the end of the page tree.

**Inbox URL param support:**
- [juejati-crm/app/(crm)/page.tsx](juejati-crm/app/(crm)/page.tsx) reads `?contactId=` from `useSearchParams()` on mount and, if present, fetches the lead and calls `setSelected(lead)` so it appears pre-selected in the inbox.
- This makes the "Abrir conversación" button deep-link correctly.

### Fix 3 — Drag-and-drop with `@dnd-kit`

**Library:** `@dnd-kit/core` (v6.x, the modern accessible standard for React 18). No sortable extension needed — we only need cross-column drag, not intra-column reorder.

**Install:**
```
npm install @dnd-kit/core
```
inside `juejati-crm/`.

**Wrapping:**
- `<DndContext sensors={[useSensor(PointerSensor)]} onDragEnd={handleDragEnd}>` wraps the columns container.
- Each column: `useDroppable({ id: stage.id })`. Apply `setNodeRef` to the column root. Highlight border when `isOver`.
- Each card: `useDraggable({ id: lead.opportunityId, data: { fromStageId, lead } })`. Apply `setNodeRef`, `listeners`, `attributes`, and `transform` style.

**`handleDragEnd(event)` logic:**
1. Read `event.active.id` (opportunityId) and `event.over?.id` (target stageId). Read `fromStageId` from `event.active.data.current`.
2. If `over` is null OR `fromStageId === toStageId` → do nothing.
3. **Optimistic update**: build new `leadsByStage` with the card moved from `fromStageId` to `toStageId`; setState.
4. Call `fetch('/api/opportunities/' + opportunityId + '/stage', { method: 'PATCH', body: JSON.stringify({ stageId: toStageId }) })`.
5. On HTTP failure: revert `leadsByStage` to the snapshot taken before step 3, then `alert('No se pudo mover la oportunidad: ' + errorMessage)`. (We use `alert` because no toast library is installed; a real toast UI is a separate followup, not in scope.)

**Drag visual states:**
- Card while dragging: `opacity-50`.
- Column when hovered with a valid drag: `ring-2 ring-blue-400`.

### Backend additions

**`juejati-crm/lib/ghl.ts`** — new function:

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

Uses the existing `ghlHeaders()` (which sets `Version: 2021-07-28` and the Bearer token).

**`juejati-crm/app/api/opportunities/[id]/stage/route.ts`** — new endpoint:

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
  const body = await req.json()
  const stageId = body.stageId

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

---

## Out of scope (YAGNI)

These are intentionally NOT included:

- Creating or deleting opportunities from the kanban.
- Switching between pipelines (we still default to `pipelines[0]`, same as today).
- Custom field editing from the drawer.
- A toast UI library — `alert()` for now; toast can be a separate followup if needed.
- Reordering cards within a column (only cross-column moves).
- Optimistic creation of new stages.
- Mobile drag (PointerSensor handles touch + mouse, but we don't add an explicit mobile-optimized layout; the existing horizontal scroll stays).

---

## Success criteria

When this is shipped:

1. Loading `/pipeline` shows every opportunity in every stage, not just the first 100. The header reads `"N leads"` where N matches `meta.total` from GHL.
2. Clicking any card opens a right-side drawer with the opportunity's full data and contact info.
3. Inside the drawer, "Abrir conversación" navigates to `/?contactId=...` and the correct lead is pre-selected in the inbox.
4. Dragging a card from one column to another:
   - Visually moves the card immediately (optimistic).
   - Updates the opportunity's `pipelineStageId` in GHL.
   - If GHL rejects the update, the card snaps back and an error message is shown.
5. Reloading the page after a drag shows the card in its new column (i.e. the change actually persisted in GHL).

---

## Files touched (summary)

| File | Change |
|---|---|
| [juejati-crm/app/(crm)/pipeline/page.tsx](juejati-crm/app/(crm)/pipeline/page.tsx) | Paginated fetch, DnD wiring, drawer state, card key change |
| [juejati-crm/app/(crm)/page.tsx](juejati-crm/app/(crm)/page.tsx) | Read `?contactId=` from URL and pre-select |
| [juejati-crm/lib/ghl.ts](juejati-crm/lib/ghl.ts) | Add `updateOpportunityStage` |
| `juejati-crm/components/pipeline/OpportunityDrawer.tsx` | New file |
| `juejati-crm/app/api/opportunities/[id]/stage/route.ts` | New file |
| `juejati-crm/package.json` | Add `@dnd-kit/core` |
