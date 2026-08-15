import { addDays, addWeeks, formatDay, parseISO, toISODate } from './dates'
import { DAY_WIDTH, MONTH_WIDTH, WEEK_WIDTH } from '../constants'

export const SAFE_SPRINT_WEEK_COUNTS = [3, 3, 3, 4]
export const TIMELINE_SCALES = ['day', 'week', 'month']

export function formatDateRange(startDate, endDate) {
  if (!startDate || !endDate) return ''
  return `${formatDay(startDate)} – ${formatDay(endDate)}`
}

export function timeboxShortCode(name) {
  return String(name || '')
    .replace(/^PI\s+/i, '')
    .trim() || 'PI'
}

export function normalizeTimelineScale(scale) {
  const s = String(scale || 'week').toLowerCase()
  return TIMELINE_SCALES.includes(s) ? s : 'week'
}

function widthForScale(scale) {
  if (scale === 'day') return DAY_WIDTH
  if (scale === 'month') return MONTH_WIDTH
  return WEEK_WIDTH
}

/** Build SAFe sprints (3+3+3+4 weeks) from a timebox start date. */
export function buildSafeSprints(timeboxId, timeboxName, startDate, idFactory) {
  const base = timeboxShortCode(timeboxName)
  let cursor = startDate
  return SAFE_SPRINT_WEEK_COUNTS.map((weekCount, index) => {
    const number = index + 1
    const sprintStart = cursor
    const sprintEnd = addDays(sprintStart, weekCount * 7 - 1)
    cursor = addDays(sprintEnd, 1)
    const type = number === 4 ? 'INNOVATION' : 'DEVELOPMENT'
    const id = idFactory ? idFactory(number) : `${timeboxId}.${number}`
    return {
      id,
      timeboxId,
      number,
      name: `${base}.${number}`,
      type,
      scale: 'week',
      startDate: sprintStart,
      endDate: sprintEnd,
      weekCount,
    }
  })
}

export function deriveTimeboxDates(sprints) {
  if (!sprints?.length) return { startDate: null, endDate: null }
  const sorted = [...sprints].sort((a, b) => a.number - b.number)
  return {
    startDate: sorted[0].startDate,
    endDate: sorted[sorted.length - 1].endDate,
  }
}

function isInnovationType(type) {
  return /innovation/i.test(String(type || ''))
}

function sprintBg(sprint, unitIndex, unitCount) {
  if (isInnovationType(sprint.type)) {
    return unitIndex === unitCount - 1 ? 'bg-sprint-planning' : 'bg-sprint-innovation'
  }
  return sprint.number % 2 === 0 ? 'bg-sprint-dev2' : 'bg-sprint-dev'
}

function weekUnitType(sprint, weekIndex, weekCount) {
  if (!isInnovationType(sprint.type)) return sprint.type || 'DEVELOPMENT'
  return weekIndex === weekCount - 1 ? 'Planning' : sprint.type || 'INNOVATION'
}

function daysInclusive(startDate, endDate) {
  const start = parseISO(startDate)
  const end = parseISO(endDate)
  return Math.max(1, Math.round((end - start) / (24 * 60 * 60 * 1000)) + 1)
}

export function monthKey(iso) {
  const d = parseISO(iso)
  return `${d.getFullYear()}-${d.getMonth()}`
}

export function monthLabel(iso) {
  const d = parseISO(iso)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[d.getMonth()]} ${d.getFullYear()}`
}

function buildUnitsForSprint(tb, sprint) {
  const scale = normalizeTimelineScale(sprint.scale)
  const width = widthForScale(scale)
  const units = []

  if (scale === 'day') {
    const count = daysInclusive(sprint.startDate, sprint.endDate)
    let cursor = sprint.startDate
    for (let i = 0; i < count; i += 1) {
      const planningTail = isInnovationType(sprint.type) && i >= count - 7
      units.push({
        label: String(parseISO(cursor).getDate()),
        displayDate: formatDay(cursor),
        startDate: cursor,
        endDate: cursor,
        scale,
        width,
        piId: tb.id,
        piName: tb.name,
        sprintId: sprint.id,
        sprintName: sprint.name,
        sprintType: planningTail ? 'Planning' : (sprint.type || 'DEVELOPMENT'),
        sprintBg: planningTail
          ? 'bg-sprint-planning'
          : isInnovationType(sprint.type)
            ? 'bg-sprint-innovation'
            : sprintBg(sprint, 0, 1),
        weekInSprint: i + 1,
      })
      cursor = addDays(cursor, 1)
    }
    return units
  }

  if (scale === 'month') {
    let cursor = sprint.startDate
    let idx = 0
    while (cursor <= sprint.endDate) {
      const d = parseISO(cursor)
      const monthEnd = toISODate(new Date(d.getFullYear(), d.getMonth() + 1, 0))
      const unitEnd = monthEnd < sprint.endDate ? monthEnd : sprint.endDate
      units.push({
        label: monthLabel(cursor),
        displayDate: formatDay(cursor),
        startDate: cursor,
        endDate: unitEnd,
        scale,
        width,
        piId: tb.id,
        piName: tb.name,
        sprintId: sprint.id,
        sprintName: sprint.name,
        sprintType: sprint.type || 'DEVELOPMENT',
        sprintBg: sprintBg(sprint, idx, 1),
        weekInSprint: idx + 1,
      })
      cursor = addDays(unitEnd, 1)
      idx += 1
      if (monthKey(cursor) === monthKey(unitEnd) && cursor > sprint.endDate) break
    }
    return units
  }

  // week (default)
  let weekStart = sprint.startDate
  const weekCount = sprint.weekCount || Math.ceil(daysInclusive(sprint.startDate, sprint.endDate) / 7)
  for (let i = 0; i < weekCount; i += 1) {
    const weekEnd = addDays(weekStart, 6)
    const clampedEnd = weekEnd > sprint.endDate ? sprint.endDate : weekEnd
    const type = weekUnitType(sprint, i, weekCount)
    units.push({
      label: /planning/i.test(type) ? 'Planning' : `Week ${i + 1}`,
      displayDate: formatDay(weekStart),
      startDate: weekStart,
      endDate: clampedEnd,
      scale: 'week',
      width,
      piId: tb.id,
      piName: tb.name,
      sprintId: sprint.id,
      sprintName: sprint.name,
      sprintType: type,
      sprintBg: sprintBg(sprint, i, weekCount),
      weekInSprint: i + 1,
    })
    weekStart = addDays(weekEnd, 1)
  }
  return units
}

/**
 * Build Gantt leaf columns + header bands from flat timeboxes + sprints.
 * Each sprint may use scale: day | week | month.
 */
export function buildCalendarFromPlan(timeboxes = [], sprints = []) {
  const sortedTimeboxes = [...timeboxes].sort((a, b) => {
    const byDate = String(a.startDate).localeCompare(String(b.startDate))
    if (byDate !== 0) return byDate
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  })

  const units = []
  const piUnitMap = {}
  const headerTimeboxes = []
  const headerSprints = []
  let unitIndex = 0
  let left = 0

  for (const tb of sortedTimeboxes) {
    piUnitMap[tb.id] = unitIndex
    let tbWidth = 0
    let tbUnitCount = 0
    const tbSprints = sprints
      .filter((s) => s.timeboxId === tb.id)
      .sort((a, b) => a.number - b.number)

    for (const sprint of tbSprints) {
      const sprintUnits = buildUnitsForSprint(tb, sprint)
      let sprintWidth = 0
      for (const raw of sprintUnits) {
        const unit = {
          ...raw,
          index: unitIndex,
          left,
        }
        units.push(unit)
        left += unit.width
        sprintWidth += unit.width
        unitIndex += 1
        tbUnitCount += 1
        tbWidth += unit.width
      }

      headerSprints.push({
        id: sprint.id,
        name: sprint.name,
        range: formatDateRange(sprint.startDate, sprint.endDate),
        weekCount: sprint.weekCount,
        unitCount: sprintUnits.length,
        width: sprintWidth,
        timeboxId: tb.id,
        type: sprint.type,
        scale: normalizeTimelineScale(sprint.scale),
        bg: sprintUnits[0]?.sprintBg ?? 'bg-sprint-dev',
      })
    }

    headerTimeboxes.push({
      id: tb.id,
      name: tb.name,
      range: formatDateRange(tb.startDate, tb.endDate),
      weekCount: tbUnitCount,
      unitCount: tbUnitCount,
      width: tbWidth,
      startWeek: piUnitMap[tb.id],
      startUnit: piUnitMap[tb.id],
      startDate: tb.startDate,
      endDate: tb.endDate,
    })
  }

  return {
    weeks: units,
    units,
    piWeekMap: piUnitMap,
    piUnitMap,
    totalWeeks: units.length,
    totalUnits: units.length,
    totalWidth: left,
    timeboxes: headerTimeboxes,
    sprints: headerSprints,
  }
}

/** Timebox containing today, else first future timebox, else null. */
export function findCurrentTimebox(timeboxes = [], todayIso = toISODate(new Date())) {
  const containing = timeboxes.find(
    (t) => t.startDate && t.endDate && t.startDate <= todayIso && t.endDate >= todayIso,
  )
  if (containing) return containing
  const future = timeboxes
    .filter((t) => t.startDate && t.startDate > todayIso)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
  return future[0] ?? null
}

export function getDefaultFeatureDatesFromPlan(timeboxes = [], todayIso = toISODate(new Date())) {
  const current = findCurrentTimebox(timeboxes, todayIso)
  if (!current?.startDate) {
    return {
      startDate: todayIso,
      targetDate: addWeeks(todayIso, 1),
    }
  }
  return {
    startDate: current.startDate,
    targetDate: addWeeks(current.startDate, 1),
  }
}

export function planIdForProject(projectIterationPlans, projectId) {
  return projectIterationPlans.find((pip) => pip.projectId === projectId)?.planId ?? null
}

export function emptyCalendar() {
  return {
    weeks: [],
    units: [],
    piWeekMap: {},
    piUnitMap: {},
    totalWeeks: 0,
    totalUnits: 0,
    totalWidth: 0,
    timeboxes: [],
    sprints: [],
    currentTimeboxId: null,
    currentTimeboxStartWeek: 0,
  }
}
