const STORAGE_KEY = 'chronova-data'
const ACTOR_KEY = 'chronova-actor'
const LAYOUT_KEY = 'chronova-layout'
const TIMELINE_VIEW_KEY = 'chronova-view'

const LEGACY_KEY_MAP = [
  ['pi-timeline-data', STORAGE_KEY],
  ['pi-timeline-actor', ACTOR_KEY],
  ['pi-timeline-layout', LAYOUT_KEY],
  ['pi-timeline-view', TIMELINE_VIEW_KEY],
]

function migrateStorageKeys() {
  try {
    for (const [legacyKey, newKey] of LEGACY_KEY_MAP) {
      const legacyValue = localStorage.getItem(legacyKey)
      if (legacyValue !== null && localStorage.getItem(newKey) === null) {
        localStorage.setItem(newKey, legacyValue)
      }
      if (legacyValue !== null) {
        localStorage.removeItem(legacyKey)
      }
    }
  } catch { /* ignore */ }
}

migrateStorageKeys()

const DEFAULT_LAYOUT = {
  sidebarCollapsed: false,
  sidebarCollapsedTimeline: true,
  leftColCollapsed: false,
  leftColWidth: 280,
}

export const LEFT_COL_COLLAPSED_WIDTH = 52
export const LEFT_COL_MIN_WIDTH = 200
export const LEFT_COL_MAX_WIDTH = 720

export function loadActor() {
  try {
    return localStorage.getItem(ACTOR_KEY) || ''
  } catch {
    return ''
  }
}

export function saveActor(name) {
  try {
    localStorage.setItem(ACTOR_KEY, name)
  } catch { /* ignore */ }
}

export function loadLayout() {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY)
    if (!raw) return { ...DEFAULT_LAYOUT }
    return { ...DEFAULT_LAYOUT, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_LAYOUT }
  }
}

export function saveLayout(layout) {
  try {
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout))
  } catch { /* ignore */ }
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch { /* ignore */ }
}

export function clearState() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch { /* ignore */ }
}

export function loadTimelineView(projectId) {
  try {
    const raw = localStorage.getItem(TIMELINE_VIEW_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    const view = data[projectId]
    if (!view || typeof view.scrollLeft !== 'number') return null
    return {
      scrollLeft: view.scrollLeft,
      scrollTop: typeof view.scrollTop === 'number' ? view.scrollTop : 0,
    }
  } catch {
    return null
  }
}

export function saveTimelineView(projectId, { scrollLeft, scrollTop }) {
  try {
    const raw = localStorage.getItem(TIMELINE_VIEW_KEY)
    const data = raw ? JSON.parse(raw) : {}
    data[projectId] = { scrollLeft, scrollTop }
    localStorage.setItem(TIMELINE_VIEW_KEY, JSON.stringify(data))
  } catch { /* ignore */ }
}
