import { DAY_WIDTH, WEEK_WIDTH } from '../constants'
import { dayColumnTooltip } from '../utils/timelineDayFeatures'
import { TodayHeaderMarker, GroupedMarkerHeader } from './TimelineMarkers'

export default function TimelineHeader({
  calendar,
  todayPosition,
  markerGroups = [],
  expandedMarkerDates = new Set(),
  onToggleMarkerGroup,
  projectId,
  features = [],
}) {
  const {
    timeboxes = [],
    sprints = [],
    weeks = [],
    months = [],
    totalWidth = 0,
    hasPlanBands = false,
    isDynamic = false,
  } = calendar ?? {}
  const width = totalWidth || weeks.reduce((sum, w) => sum + (w.width ?? WEEK_WIDTH), 0)

  if (!weeks.length) {
    return (
      <div className="bg-header px-4 py-3 text-xs text-gray-400">
        Loading timeline…
      </div>
    )
  }

  const showPlanRows = hasPlanBands && timeboxes.length > 0

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

      {isDynamic && months.length > 0 && (
        <div className="relative border-b border-white/10" style={{ height: 22 }}>
          {months.map((month) => (
            <div
              key={`${month.key}-${month.left}`}
              className="absolute top-0 flex h-full items-center border-r border-white/10 px-2 text-[10px] font-semibold text-gray-300"
              style={{ left: month.left, width: month.width }}
            >
              <span className="truncate">{month.label}</span>
            </div>
          ))}
        </div>
      )}

      {showPlanRows && (
        <>
          <div className="relative border-b border-white/10" style={{ minHeight: 36 }}>
            {timeboxes.map((pi) => (
              <div
                key={pi.id}
                className="absolute top-0 border-r border-white/15 px-2 py-1"
                style={{ left: pi.left ?? 0, width: pi.width ?? pi.weekCount * WEEK_WIDTH }}
              >
                <div className="text-xs font-semibold leading-tight">{pi.name}</div>
                <div className="text-[9px] leading-tight text-gray-400">{pi.range}</div>
              </div>
            ))}
          </div>

          <div className="relative border-b border-white/10" style={{ minHeight: 34 }}>
            {sprints.map((sprint) => (
              <div
                key={sprint.id}
                className={`absolute top-0 border-r border-white/10 px-1.5 py-1 text-center ${sprint.sprintBg ?? 'bg-sprint-dev'}`}
                style={{ left: sprint.left ?? 0, width: sprint.width ?? WEEK_WIDTH }}
              >
                <div className="text-[11px] font-semibold leading-tight">{sprint.name}</div>
                <div className="text-[9px] leading-tight text-gray-300">
                  {sprint.range}
                  {sprint.scale && sprint.scale !== 'week' ? ` · ${sprint.scale}` : ''}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="flex">
        {weeks.map((unit) => {
          const tooltip =
            unit.isGeneric && projectId
              ? dayColumnTooltip(features, projectId, unit.startDate)
              : ''
          return (
          <div
            key={`${unit.index}-${unit.startDate}`}
            className={`border-r border-white/10 px-0.5 py-0.5 text-center ${
              unit.isGeneric && unit.isWeekend ? 'bg-timeline-weekend-header' : unit.sprintBg ?? ''
            }`}
            style={{ width: unit.width ?? (unit.isGeneric ? DAY_WIDTH : WEEK_WIDTH) }}
            title={tooltip || undefined}
          >
            <div className="truncate text-[9px] font-medium leading-tight">{unit.label}</div>
            <div className="truncate text-[8px] leading-tight text-gray-400">{unit.displayDate}</div>
          </div>
          )
        })}
      </div>
    </div>
  )
}
