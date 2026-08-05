import { programIncrements, sprints, TOTAL_WEEKS } from '../data'
import { LEFT_COL_WIDTH, WEEK_WIDTH } from '../constants'

export default function TimelineHeader() {
  const timelineWidth = TOTAL_WEEKS * WEEK_WIDTH

  return (
    <div className="sticky top-0 z-20 flex bg-header text-white">
      <div
        className="sticky left-0 z-30 flex shrink-0 flex-col justify-end border-r border-white/10 bg-header px-4 py-2.5"
        style={{ width: LEFT_COL_WIDTH }}
      >
        <span className="text-sm font-medium">Features</span>
      </div>

      <div className="shrink-0" style={{ width: timelineWidth }}>
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
          {sprints.map((sprint) => (
            <div
              key={sprint.id}
              className={`${sprint.bg} border-r border-white/10`}
              style={{ width: sprint.weeks.length * WEEK_WIDTH }}
            >
              <div className="border-b border-white/10 px-2 py-1.5 text-center">
                <div className="text-xs font-semibold">{sprint.name}</div>
                <div className="text-[10px] text-gray-300">{sprint.range}</div>
              </div>
              <div className="flex">
                {sprint.weeks.map((week, i) => (
                  <div
                    key={i}
                    className="border-r border-white/5 px-1 py-1.5 text-center last:border-r-0"
                    style={{ width: WEEK_WIDTH }}
                  >
                    <div className="text-[10px] font-medium">{week.label}</div>
                    <div className="text-[9px] text-gray-400">{week.date}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
