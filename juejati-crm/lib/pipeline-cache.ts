import type { GHLLead, GHLPipeline } from './ghl'

const CACHE_KEY = 'juejati:pipeline:v1'
const TTL_MS = 5 * 60 * 1000

export interface CachedPipelineData {
  ts: number
  pipeline: GHLPipeline
  leadsByStage: Record<string, GHLLead[]>
}

/**
 * Read cached pipeline data from localStorage. Returns null if missing,
 * expired (older than TTL_MS), or unparseable. SSR-safe.
 */
export function getCachedPipelineData(): CachedPipelineData | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as CachedPipelineData
    if (!data?.ts || Date.now() - data.ts > TTL_MS) {
      window.localStorage.removeItem(CACHE_KEY)
      return null
    }
    return data
  } catch {
    return null
  }
}

/**
 * Persist pipeline data to localStorage with a fresh timestamp.
 * Silent on quota or serialization errors (worst case: no cache, just slow load next time).
 */
export function setCachedPipelineData(input: Omit<CachedPipelineData, 'ts'>): void {
  if (typeof window === 'undefined') return
  try {
    const value: CachedPipelineData = { ...input, ts: Date.now() }
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(value))
  } catch (err) {
    // QuotaExceededError or serialization issue — non-fatal
    console.warn('[pipeline-cache] could not write cache:', err)
  }
}

/**
 * Drop the cache. Used by the "refresh" button and on logout (future).
 */
export function clearCachedPipelineData(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(CACHE_KEY)
  } catch {}
}

/**
 * Update the cached representation after a successful drag-and-drop, so the
 * change survives a reload within the TTL window. No-op if no cache exists.
 */
export function updateCachedLeadStage(
  opportunityId: string,
  toStageId: string,
): void {
  const data = getCachedPipelineData()
  if (!data) return
  let moved: GHLLead | null = null
  for (const k of Object.keys(data.leadsByStage)) {
    const idx = data.leadsByStage[k].findIndex((l) => l.opportunityId === opportunityId)
    if (idx >= 0) {
      moved = { ...data.leadsByStage[k][idx], stageId: toStageId }
      data.leadsByStage[k] = data.leadsByStage[k].filter((l) => l.opportunityId !== opportunityId)
      break
    }
  }
  if (!moved) return
  data.leadsByStage[toStageId] = [moved, ...(data.leadsByStage[toStageId] || [])]
  setCachedPipelineData({ pipeline: data.pipeline, leadsByStage: data.leadsByStage })
}
