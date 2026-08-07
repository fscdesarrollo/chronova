import { programIncrements, sprints, TOTAL_WEEKS, weekCalendar } from '../data'
import { WEEK_WIDTH } from '../constants'
import { TodayHeaderMarker, TimelineMarkerHeader } from './TimelineMarkers'

export default function TimelineHeader({ todayPosition, markerItems = [] }) {
  const timelineWidth = TOTAL_WEEKS * WEEK_WIDTH

  return (
    <div className="bg-header text-white" style={{ width: timelineWidth }}>
      <div className="relative min-h-[26px]">
        {todayPosition != null && <TodayHeaderMarker left={todayPosition} />}
        {markerItems.map((item) => (
          <TimelineMarkerHeader
            key={item.marker.id}
            marker={item.marker}
            left={item.left}
            stackIndex={item.stackIndex}
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
                {sprint.weeks.map((week, i) => {
                  const cal = sprintWeeks[i]
                  const isPlanning = cal?.sprintType === 'planning'
                  return (
                    <div
                      key={i}
                      className={`border-r border-white/5 px-1 py-1.5 text-center last:border-r-0 ${
                        isPlanning ? 'bg-sprint-planning' : cal?.sprintBg ?? ''
                      }`}
                      style={{ width: WEEK_WIDTH }}
                    >
                      <div className="text-[10px] font-medium">
                        {isPlanning ? 'Planning' : week.label}
                      </div>
                      <div className="text-[9px] text-gray-400">{week.date}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
