import { programIncrements, sprints, TOTAL_WEEKS, weekCalendar } from '../data'
import { WEEK_WIDTH } from '../constants'
import { TodayHeaderMarker, GroupedMarkerHeader } from './TimelineMarkers'

export default function TimelineHeader({
  todayPosition,
  markerGroups = [],
  expandedMarkerDates = new Set(),
  onToggleMarkerGroup,
}) {
  const timelineWidth = TOTAL_WEEKS * WEEK_WIDTH

  return (
    <div className="bg-header text-white" style={{ width: timelineWidth }}>
      <div className="relative min-h-[26px]">
        {todayPosition != null && <TodayHeaderMarker left={todayPosition} />}
        {markerGroups.map((group) => (
          <GroupedMarkerHeader
            key={group.date}
            group={group}
            expanded={expandedMarkerDates.has(group.date)}
            onToggle={() => onToggleMarkerGroup?.(group.date)}
          />
        ))}
      </div>

      <div className="flex border-b border-white/10">
        {programIncrements.map((pi) => (
          <div
            key={pi.id}
            className="border-r border-white/15 px-3 py-2"
            style={{ width: pi.weekCount * WEEK_WIDTH }}
          >
            <div className="text-sm font-semibold">{pi.name}</div>
            <div className="text-[10px] text-gray-400">{pi.range}</div>
          </div>
        ))}
      </div>

      <div className="flex">
        {sprints.map((sprint) => {
          const sprintWeeks = weekCalendar.filter((w) => w.sprintId === sprint.id)
          const sprintWidth = sprint.weeks.length * WEEK_WIDTH

          return (
            <div
              key={sprint.id}
              className="border-r border-white/10"
              style={{ width: sprintWidth }}
            >
              <div className={`border-b border-white/10 px-2 py-1.5 text-center ${sprintWeeks[0]?.sprintBg ?? 'bg-sprint-dev'}`}>
                <div className="text-xs font-semibold">{sprint.name}</div>
                <div className="text-[10px] text-gray-300">{sprint.range}</div>
              </div>
              <div className="flex">
                {sprintWeeks.map((week) => (
                  <div
                    key={week.index}
                    className={`border-r border-white/10 px-1 py-1 text-center ${week.sprintBg}`}
                    style={{ width: WEEK_WIDTH }}
                  >
                    <div className="text-[10px] font-medium">{week.label}</div>
                    <div className="text-[9px] text-gray-400">{week.displayDate}</div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
