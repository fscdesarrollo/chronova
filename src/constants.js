export const LEFT_COL_WIDTH = 280
export const WEEK_WIDTH = 72
export const ROW_HEIGHT = 48
export const BAR_PADDING = 4

export function clampWeek(startWeek, duration, totalWeeks) {
  return Math.max(0, Math.min(startWeek, totalWeeks - duration))
}

export function weekFromPointerX(clientX, timelineRect, scrollLeft, duration, totalWeeks) {
  const x = clientX - timelineRect.left + scrollLeft - BAR_PADDING
  const week = Math.round(x / WEEK_WIDTH)
  return clampWeek(week, duration, totalWeeks)
}

export function rowFromPointerY(clientY, gridRect, scrollTop, rowCount) {
  const y = clientY - gridRect.top + scrollTop
  const row = Math.floor(y / ROW_HEIGHT)
  return Math.max(0, Math.min(row, rowCount - 1))
}
