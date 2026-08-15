import { addDays, formatDay, parseISO, toISODate } from './dates'
import { monthKey, monthLabel } from './iterationPlans'
import { DEFAULT_ZOOM_LEVEL, scaledDayWidth } from './timelineZoom'

export const DYNAMIC_CALENDAR = {
  INITIAL_DAYS_BACK: 90,
  INITIAL_DAYS_FORWARD: 90,
  SCROLL_CHUNK_DAYS: 30,
  EDGE_THRESHOLD_PX: 200,
  FEATURE_BUFFER_DAYS: 7,
}

export function defaultDynamicRange(todayIso = toISODate(new Date())) {
  return {
    startDate: addDays(todayIso, -DYNAMIC_CALENDAR.INITIAL_DAYS_BACK),
    endDate: addDays(todayIso, DYNAMIC_CALENDAR.INITIAL_DAYS_FORWARD),
  }
}

export function daysBetween(startIso, endIso) {
  const start = parseISO(startIso)
  const end = parseISO(endIso)
  return Math.round((end - start) / (24 * 60 * 60 * 1000))
}

export function expandRangeForFeatures(range, features = [], bufferDays = DYNAMIC_CALENDAR.FEATURE_BUFFER_DAYS) {
  let { startDate, endDate } = range
  for (const feature of features) {
    if (feature.startDate) {
      const buffered = addDays(feature.startDate, -bufferDays)
      if (buffered < startDate) startDate = buffered
    }
    if (feature.targetDate) {
      const buffered = addDays(feature.targetDate, bufferDays)
      if (buffered > endDate) endDate = buffered
    }
  }
  return { startDate, endDate }
}

function isWeekend(isoDate) {
  const day = parseISO(isoDate).getDay()
  return day === 0 || day === 6
}

function buildGenericDayUnit(isoDate, index, left, dayWidth) {
  const weekend = isWeekend(isoDate)
  return {
    index,
    label: String(parseISO(isoDate).getDate()),
    displayDate: formatDay(isoDate),
    startDate: isoDate,
    endDate: isoDate,
    scale: 'day',
    width: dayWidth,
    left,
    sprintBg: weekend ? 'bg-timeline-weekend' : 'bg-timeline-day',
    isWeekend: weekend,
    isGeneric: true,
  }
}

function buildMonthBands(units) {
  const bands = []
  for (const unit of units) {
    const key = monthKey(unit.startDate)
    const label = monthLabel(unit.startDate)
    const last = bands[bands.length - 1]
    if (last && last.key === key) {
      last.width += unit.width
    } else {
      bands.push({
        key,
        label,
        width: unit.width,
        left: unit.left ?? 0,
      })
    }
  }
  return bands
}

function derivePlanHeaderBands(units, planTimeboxes = [], planSprints = []) {
  const headerTimeboxes = planTimeboxes
    .map((tb) => {
      const tbUnits = units.filter((unit) => unit.piId === tb.id)
      if (!tbUnits.length) return null
      return {
        ...tb,
        left: tbUnits[0].left,
        width: tbUnits.reduce((sum, unit) => sum + unit.width, 0),
      }
    })
    .filter(Boolean)

  const headerSprints = planSprints
    .map((sprint) => {
      const sprintUnits = units.filter((unit) => unit.sprintId === sprint.id)
      if (!sprintUnits.length) return null
      return {
        ...sprint,
        left: sprintUnits[0].left,
        width: sprintUnits.reduce((sum, unit) => sum + unit.width, 0),
        sprintBg: sprintUnits[0]?.sprintBg ?? 'bg-sprint-dev',
      }
    })
    .filter(Boolean)

  return { headerTimeboxes, headerSprints }
}

export function findUnitIndexForDate(units, isoDate) {
  if (!units?.length || !isoDate) return 0
  const idx = units.findIndex((unit) => isoDate >= unit.startDate && isoDate <= unit.endDate)
  if (idx >= 0) return idx
  if (isoDate < units[0].startDate) return 0
  return units.length - 1
}

/**
 * Merge a SAFe plan calendar with generic day columns before/after the plan range.
 * Outside the plan (or when no plan exists), each column is one calendar day.
 */
export function buildDynamicCalendar({
  startDate,
  endDate,
  planCalendar,
  zoomLevel = DEFAULT_ZOOM_LEVEL,
}) {
  const dayWidth = scaledDayWidth(zoomLevel)
  const planUnits = planCalendar?.weeks ?? []
  const planTimeboxes = planCalendar?.timeboxes ?? []
  const planSprints = planCalendar?.sprints ?? []
  const planStart = planUnits[0]?.startDate ?? null
  const planEnd = planUnits[planUnits.length - 1]?.endDate ?? null

  const units = []
  let left = 0
  let index = 0
  let cursor = startDate

  while (cursor <= endDate) {
    const coveringUnit = planUnits.find((unit) => cursor >= unit.startDate && cursor <= unit.endDate)
    const inPlanWindow = planStart && planEnd && cursor >= planStart && cursor <= planEnd

    if (inPlanWindow && coveringUnit) {
      const last = units[units.length - 1]
      if (!last || last.startDate !== coveringUnit.startDate || last.sprintId !== coveringUnit.sprintId) {
        units.push({
          ...coveringUnit,
          index,
          left,
          isGeneric: false,
        })
        left += coveringUnit.width
        index += 1
      }
      cursor = addDays(coveringUnit.endDate, 1)
      continue
    }

    units.push(buildGenericDayUnit(cursor, index, left, dayWidth))
    left += dayWidth
    index += 1
    cursor = addDays(cursor, 1)
  }

  const { headerTimeboxes, headerSprints } = derivePlanHeaderBands(units, planTimeboxes, planSprints)

  return {
    weeks: units,
    units,
    piWeekMap: planCalendar?.piWeekMap ?? {},
    piUnitMap: planCalendar?.piUnitMap ?? {},
    totalWeeks: units.length,
    totalUnits: units.length,
    totalWidth: left,
    timeboxes: headerTimeboxes,
    sprints: headerSprints,
    months: buildMonthBands(units),
    isDynamic: true,
    rangeStart: startDate,
    rangeEnd: endDate,
    planStart,
    planEnd,
    hasPlanBands: headerTimeboxes.length > 0,
  }
}
