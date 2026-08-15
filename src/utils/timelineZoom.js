import { DAY_WIDTH, MONTH_WIDTH, WEEK_WIDTH } from '../constants'

export const TIMELINE_ZOOM_LEVELS = [
  { id: 0, label: 'Compact', dayWidth: 20 },
  { id: 1, label: 'Normal', dayWidth: 28 },
  { id: 2, label: 'Large', dayWidth: 44 },
  { id: 3, label: 'X-Large', dayWidth: 64 },
]

export const DEFAULT_ZOOM_LEVEL = 1

export function clampZoomLevel(level) {
  const numeric = Number(level)
  if (Number.isNaN(numeric)) return DEFAULT_ZOOM_LEVEL
  return Math.max(0, Math.min(TIMELINE_ZOOM_LEVELS.length - 1, Math.round(numeric)))
}

export function zoomLevelLabel(level = DEFAULT_ZOOM_LEVEL) {
  return TIMELINE_ZOOM_LEVELS[clampZoomLevel(level)].label
}

/** Multiplier relative to the Normal (28px) day column. */
export function zoomScale(level = DEFAULT_ZOOM_LEVEL) {
  return TIMELINE_ZOOM_LEVELS[clampZoomLevel(level)].dayWidth / DAY_WIDTH
}

export function scaledDayWidth(level = DEFAULT_ZOOM_LEVEL) {
  return TIMELINE_ZOOM_LEVELS[clampZoomLevel(level)].dayWidth
}

export function scaledWeekWidth(level = DEFAULT_ZOOM_LEVEL) {
  return Math.round(WEEK_WIDTH * zoomScale(level))
}

export function scaledMonthWidth(level = DEFAULT_ZOOM_LEVEL) {
  return Math.round(MONTH_WIDTH * zoomScale(level))
}

export function canZoomIn(level = DEFAULT_ZOOM_LEVEL) {
  return clampZoomLevel(level) < TIMELINE_ZOOM_LEVELS.length - 1
}

export function canZoomOut(level = DEFAULT_ZOOM_LEVEL) {
  return clampZoomLevel(level) > 0
}
