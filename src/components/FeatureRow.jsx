import { AlertTriangle, Check, GripVertical } from 'lucide-react'
import { LEFT_COL_WIDTH, ROW_HEIGHT, TOTAL_WEEKS, WEEK_WIDTH } from '../hooks/useFeatureDrag'
import { statusColors } from '../data'
import { BAR_PADDING } from '../constants'

export default function FeatureRow({
  feature,
  isDragging,
  dragMode,
  onBarPointerDown,
  onRowPointerDown,
}) {
  const barWidth = feature.duration * WEEK_WIDTH - BAR_PADDING * 2
  const barLeft = feature.startWeek * WEEK_WIDTH + BAR_PADDING
  const timelineWidth = TOTAL_WEEKS * WEEK_WIDTH

  return (
    <div
      className={`group flex border-b border-gray-100 transition-opacity ${
        isDragging ? 'opacity-30' : 'hover:bg-gray-50/80'
      }`}
      style={{ height: ROW_HEIGHT, width: LEFT_COL_WIDTH + timelineWidth }}
    >
      <div
        className={`sticky left-0 z-10 flex shrink-0 items-center gap-2 border-r border-gray-200 px-2 ${
          isDragging ? 'bg-white' : 'bg-white group-hover:bg-gray-50'
        }`}
        style={{ width: LEFT_COL_WIDTH }}
      >
        <button
          type="button"
          onPointerDown={onRowPointerDown}
          className="shrink-0 cursor-grab touch-none rounded p-0.5 text-gray-300 opacity-0 transition-opacity hover:text-gray-500 active:cursor-grabbing group-hover:opacity-100"
          aria-label={`Reorder ${feature.name}`}
        >
          <GripVertical size={14} />
        </button>
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${statusColors[feature.status]}`}
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-gray-900">{feature.name}</div>
          <div className="text-[11px] text-gray-400">{feature.id}</div>
        </div>
        {feature.deviation != null && (
          <div className="flex shrink-0 items-center gap-0.5 text-orange-500">
            <AlertTriangle size={12} />
            <span className="text-[11px] font-semibold">{feature.deviation}</span>
          </div>
        )}
      </div>

      <div className="relative shrink-0 touch-none" style={{ width: timelineWidth }}>
        <div className="absolute inset-0 flex">
          {Array.from({ length: TOTAL_WEEKS }).map((_, i) => (
            <div
              key={i}
              className="h-full border-r border-dotted border-gray-200"
              style={{ width: WEEK_WIDTH }}
            />
          ))}
        </div>

        <div
          role="button"
          tabIndex={0}
          onPointerDown={onBarPointerDown}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') e.preventDefault()
          }}
          className={`absolute top-1/2 flex h-7 -translate-y-1/2 touch-none select-none rounded px-2 shadow-sm transition-shadow ${
            isDragging && dragMode === 'bar'
              ? 'cursor-grabbing opacity-0'
              : 'cursor-grab hover:shadow-md active:cursor-grabbing'
          }`}
          style={{ left: barLeft, width: barWidth }}
          aria-label={`Reschedule ${feature.name}`}
        >
          <div className={`absolute inset-0 flex items-center rounded ${feature.color} px-2`}>
            <span className="truncate text-xs font-medium text-white">{feature.name}</span>
            {feature.completed && <Check size={14} className="ml-auto shrink-0 text-white" />}
            {!feature.completed && feature.deviation != null && feature.deviation >= 8 && (
              <AlertTriangle size={14} className="ml-auto shrink-0 text-white" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
