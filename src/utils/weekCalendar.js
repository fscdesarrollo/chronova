import { parseDisplayDate, toISODate } from './dates'

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
        })
        weekIndex++
        piWeekCount++
      })
    }

    pi.weekCount = piWeekCount
    pi.startWeek = piWeekMap[pi.id]
  }

  return { weeks, piWeekMap, totalWeeks: weeks.length }
}

export function dateToWeekIndex(weeks, isoDate) {
  const date = new Date(isoDate + 'T00:00:00')
  const idx = weeks.findIndex((w) => {
    const start = new Date(w.startDate + 'T00:00:00')
    const end = new Date(w.endDate + 'T00:00:00')
    return date >= start && date <= end
  })
  return idx >= 0 ? idx : 0
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
export function getDateTimelinePosition(weeks, weekWidth, isoDate) {
  const firstWeek = weeks[0]
  const lastWeek = weeks[weeks.length - 1]
  if (!firstWeek || !lastWeek || !isoDate) return null
  if (isoDate < firstWeek.startDate || isoDate > lastWeek.endDate) return null

  const weekIdx = dateToWeekIndex(weeks, isoDate)
  const week = weeks[weekIdx]
  const start = new Date(week.startDate + 'T00:00:00')
  const target = new Date(isoDate + 'T00:00:00')
  const dayOffset = Math.round((target - start) / (24 * 60 * 60 * 1000))
  const fraction = (Math.min(6, Math.max(0, dayOffset)) + 0.5) / 7
  return weekIdx * weekWidth + fraction * weekWidth
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
