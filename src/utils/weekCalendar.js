import { parseDisplayDate, toISODate } from './dates'
import { WEEK_WIDTH } from '../constants'

function isInnovationSprint(sprintId) {
  return sprintId.endsWith('.IP')
}

function weekSprintType(sprintId, weekIndex, totalWeeks) {
  if (!isInnovationSprint(sprintId)) return 'development'
  return weekIndex === totalWeeks - 1 ? 'planning' : 'innovation'
}

function weekSprintBg(sprint, weekIndex, totalWeeks) {
  if (isInnovationSprint(sprint.id)) {
    return weekIndex === totalWeeks - 1 ? 'bg-sprint-planning' : (sprint.bg ?? 'bg-sprint-innovation')
  }
  return sprint.bg ?? 'bg-sprint-dev'
}

export function buildWeekCalendar(programIncrements) {
  const weeks = []
  const piWeekMap = {}
  let weekIndex = 0
  let left = 0
  const yearRef = { year: 2026, lastMonth: -1 }

  for (const pi of programIncrements) {
    piWeekMap[pi.id] = weekIndex
    let piWeekCount = 0

    for (const sprint of pi.sprints) {
      sprint.weeks.forEach((week, i) => {
        const startDate = parseDisplayDate(week.date, yearRef)
        const endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + 6)
        const type = weekSprintType(sprint.id, i, sprint.weeks.length)

        weeks.push({
          index: weekIndex,
          label: week.label,
          displayDate: week.date,
          startDate: toISODate(startDate),
          endDate: toISODate(endDate),
          piId: pi.id,
          piName: pi.name,
          sprintId: sprint.id,
          sprintName: sprint.name,
          sprintType: type,
          sprintBg: weekSprintBg(sprint, i, sprint.weeks.length),
          weekInSprint: i + 1,
          width: WEEK_WIDTH,
          left,
          scale: 'week',
        })
        left += WEEK_WIDTH
        weekIndex++
        piWeekCount++
      })
    }

    pi.weekCount = piWeekCount
    pi.startWeek = piWeekMap[pi.id]
  }

  return { weeks, piWeekMap, totalWeeks: weeks.length, totalWidth: left }
}

export function dateToWeekIndex(weeks, isoDate) {
  if (!weeks?.length || !isoDate) return 0
  const date = new Date(isoDate + 'T00:00:00')
  const idx = weeks.findIndex((w) => {
    const start = new Date(w.startDate + 'T00:00:00')
    const end = new Date(w.endDate + 'T00:00:00')
    return date >= start && date <= end
  })
  if (idx >= 0) return idx
  if (isoDate < weeks[0].startDate) return 0
  return weeks.length - 1
}

export function weekIndexToDates(weeks, startIdx, endIdx) {
  const clampedStart = Math.max(0, Math.min(startIdx, weeks.length - 1))
  const clampedEnd = Math.max(clampedStart, Math.min(endIdx, weeks.length - 1))
  return {
    startDate: weeks[clampedStart].startDate,
    targetDate: weeks[clampedEnd].endDate,
  }
}

export function featureWeekSpan(weeks, startDate, targetDate) {
  const startWeek = dateToWeekIndex(weeks, startDate)
  const endWeek = dateToWeekIndex(weeks, targetDate)
  return { startWeek, endWeek, duration: endWeek - startWeek + 1 }
}

export function featureBarPixels(weeks, startDate, targetDate) {
  const { startWeek, endWeek, duration } = featureWeekSpan(weeks, startDate, targetDate)
  if (!weeks.length) return { startWeek, endWeek, duration, left: 0, width: 0 }
  const left = weeks[startWeek]?.left ?? startWeek * (weeks[0]?.width ?? WEEK_WIDTH)
  let width = 0
  for (let i = startWeek; i <= endWeek; i += 1) {
    width += weeks[i]?.width ?? WEEK_WIDTH
  }
  return { startWeek, endWeek, duration, left, width }
}

export function unitIndexFromPixel(weeks, px) {
  if (!weeks?.length) return 0
  for (let i = 0; i < weeks.length; i += 1) {
    const left = weeks[i].left ?? 0
    const width = weeks[i].width ?? WEEK_WIDTH
    if (px < left + width) return i
  }
  return weeks.length - 1
}

export function isCrossPi(weeks, startDate, targetDate) {
  const startWeek = dateToWeekIndex(weeks, startDate)
  const endWeek = dateToWeekIndex(weeks, targetDate)
  return weeks[startWeek]?.piId !== weeks[endWeek]?.piId
}

export function getPiStartDate(weeks, piId) {
  const week = weeks.find((w) => w.piId === piId)
  return week?.startDate ?? weeks[0]?.startDate
}

/** Pixel offset of a date within the timeline, or null if outside range. */
export function getDateTimelinePosition(weeks, _weekWidth, isoDate) {
  const firstWeek = weeks[0]
  const lastWeek = weeks[weeks.length - 1]
  if (!firstWeek || !lastWeek || !isoDate) return null
  if (isoDate < firstWeek.startDate || isoDate > lastWeek.endDate) return null

  const weekIdx = dateToWeekIndex(weeks, isoDate)
  const week = weeks[weekIdx]
  const unitLeft = week.left ?? weekIdx * (week.width ?? WEEK_WIDTH)
  const unitWidth = week.width ?? WEEK_WIDTH
  const start = new Date(week.startDate + 'T00:00:00')
  const end = new Date(week.endDate + 'T00:00:00')
  const target = new Date(isoDate + 'T00:00:00')
  const spanDays = Math.max(1, Math.round((end - start) / (24 * 60 * 60 * 1000)) + 1)
  const dayOffset = Math.round((target - start) / (24 * 60 * 60 * 1000))
  const fraction = (Math.min(spanDays - 1, Math.max(0, dayOffset)) + 0.5) / spanDays
  return unitLeft + fraction * unitWidth
}

/** Pixel offset of today within the timeline, or null if outside the calendar range. */
export function getTodayTimelinePosition(weeks, weekWidth) {
  return getDateTimelinePosition(weeks, weekWidth, toISODate(new Date()))
}

export function scrollLeftForToday(weeks, weekWidth, viewportWidth, fallbackScrollLeft = 0) {
  const todayPos = getTodayTimelinePosition(weeks, weekWidth)
  if (todayPos == null) return fallbackScrollLeft
  return Math.max(0, todayPos - viewportWidth / 2)
}
