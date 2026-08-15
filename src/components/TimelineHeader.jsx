import { WEEK_WIDTH } from '../constants'
import { TodayHeaderMarker, GroupedMarkerHeader } from './TimelineMarkers'

export default function TimelineHeader({
  calendar,
  todayPosition,
  markerGroups = [],
  expandedMarkerDates = new Set(),
  onToggleMarkerGroup,
}) {
  const { timeboxes = [], sprints = [], weeks = [], totalWidth = 0 } = calendar ?? {}
  const width = totalWidth || weeks.reduce((sum, w) => sum + (w.width ?? WEEK_WIDTH), 0)

  if (!weeks.length) {
    return (
      <div className="bg-header px-4 py-3 text-xs text-gray-400">
        No iteration plan assigned. Open Iterations to configure a calendar for this project.
      </div>
    )
  }

  return (
    <div className="bg-header text-white" style={{ width }}>
      <div className="relative min-h-[18px]">
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
        {timeboxes.map((pi) => (
          <div
            key={pi.id}
            className="border-r border-white/15 px-2 py-1"
            style={{ width: pi.width ?? pi.weekCount * WEEK_WIDTH }}
          >
            <div className="text-xs font-semibold leading-tight">{pi.name}</div>
            <div className="text-[9px] leading-tight text-gray-400">{pi.range}</div>
          </div>
        ))}
      </div>

      <div className="flex">
        {sprints.map((sprint) => {
          const sprintWeeks = weeks.filter((w) => w.sprintId === sprint.id)
          const sprintWidth = sprint.width ?? sprintWeeks.reduce((s, w) => s + (w.width ?? WEEK_WIDTH), 0)

          return (
            <div
              key={sprint.id}
              className="border-r border-white/10"
              style={{ width: sprintWidth }}
            >
              <div className={`border-b border-white/10 px-1.5 py-1 text-center ${sprintWeeks[0]?.sprintBg ?? 'bg-sprint-dev'}`}>
                <div className="text-[11px] font-semibold leading-tight">{sprint.name}</div>
                <div className="text-[9px] leading-tight text-gray-300">
                  {sprint.range}
                  {sprint.scale && sprint.scale !== 'week' ? ` · ${sprint.scale}` : ''}
                </div>
              </div>
              <div className="flex">
                {sprintWeeks.map((week) => (
                  <div
                    key={week.index}
                    className={`border-r border-white/10 px-0.5 py-0.5 text-center ${week.sprintBg}`}
                    style={{ width: week.width ?? WEEK_WIDTH }}
                  >
                    <div className="truncate text-[9px] font-medium leading-tight">{week.label}</div>
                    <div className="truncate text-[8px] leading-tight text-gray-400">{week.displayDate}</div>
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
