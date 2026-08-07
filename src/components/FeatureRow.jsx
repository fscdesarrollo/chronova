import { Check, GripVertical, Layers, AlertTriangle } from 'lucide-react'
import { BAR_PADDING } from '../constants'
import { TOTAL_WEEKS } from '../data'
import { ROW_HEIGHT, WEEK_WIDTH } from '../hooks/useFeatureDrag'
import { formatDay } from '../utils/dates'
import { textColorForBg } from '../utils/colors'

export function FeatureLabelRow({
  feature,
  collapsed = false,
  showFullName,
  isSelected,
  isDragging,
  onRowPointerDown,
  onSelect,
}) {
  const needsAlert = feature.assignmentStatus === 'team_unassigned'

  return (
    <button
      type="button"
      data-feature-interactive
      onClick={onSelect}
      title={collapsed ? feature.name : undefined}
      className={`group relative flex w-full shrink-0 items-center gap-2 border-b border-r border-gray-200 text-left ${
        isDragging ? 'bg-white' : isSelected ? 'bg-violet-50' : 'bg-white hover:bg-gray-50/80'
      } ${collapsed ? 'justify-center px-1' : 'px-2'}`}
      style={{ height: ROW_HEIGHT }}
    >
      {!collapsed && (
        <span
          role="button"
          tabIndex={-1}
          onPointerDown={onRowPointerDown}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 cursor-grab touch-none rounded p-0.5 text-gray-300 opacity-0 transition-opacity hover:text-gray-500 active:cursor-grabbing group-hover:opacity-100"
          aria-label={`Reorder ${feature.name}`}
        >
          <GripVertical size={14} />
        </span>
      )}
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full border border-gray-200"
        style={{ backgroundColor: feature.productColor }}
      />
      {!collapsed && (
        <div className="min-w-0 flex-1">
          <div
            className={`text-sm font-medium text-gray-900 ${showFullName ? 'line-clamp-2 whitespace-normal' : 'truncate'}`}
            title={feature.name}
          >
            {feature.name}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <span>{feature.id}</span>
            {feature.teamName && (
              <>
                <span>·</span>
                <span className="truncate">{feature.teamName}</span>
              </>
            )}
            <span>·</span>
            <span>{formatDay(feature.startDate)}</span>
            <span>→</span>
            <span>{formatDay(feature.targetDate)}</span>
          </div>
        </div>
      )}
      {!collapsed && needsAlert && (
        <AlertTriangle
          size={14}
          className="shrink-0 text-amber-500"
          title="Team no longer assigned to this project"
        />
      )}
      {collapsed && needsAlert && (
        <AlertTriangle size={12} className="absolute right-0.5 top-1 text-amber-500" />
      )}
      {!collapsed && feature.crossPi && (
        <Layers size={14} className="shrink-0 text-amber-500" title="Cross-PI" />
      )}
    </button>
  )
}

export function FeatureBarRow({
  feature,
  isSelected,
  isDragging,
  dragStyle,
  onBarPointerDown,
  onSelect,
}) {
  const barW = feature.duration * WEEK_WIDTH - BAR_PADDING * 2
  const barL = feature.startWeek * WEEK_WIDTH + BAR_PADDING
  const timelineWidth = TOTAL_WEEKS * WEEK_WIDTH
  const barTextColor = textColorForBg(feature.color)

  const barContent = (
    <div
      className={`flex h-full items-center rounded px-2 shadow-sm ${feature.completed ? 'opacity-70' : ''}`}
      style={{ backgroundColor: feature.color }}
    >
      <span className="truncate text-xs font-medium" style={{ color: barTextColor }}>
        {feature.name}
      </span>
      {feature.completed && <Check size={14} className="ml-auto shrink-0" style={{ color: barTextColor }} />}
    </div>
  )

  return (
    <div
      className={`relative shrink-0 touch-none border-b border-gray-100 ${
        isDragging ? '' : 'hover:bg-gray-50/80'
      } ${isSelected ? 'bg-violet-50/50' : ''}`}
      style={{ height: ROW_HEIGHT, width: timelineWidth }}
    >
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
        className="absolute top-1/2 h-7 -translate-y-1/2"
        style={{ left: barL, width: barW, visibility: isDragging ? 'hidden' : 'visible' }}
      >
        <div
          role="button"
          tabIndex={0}
          data-feature-interactive
          onPointerDown={onBarPointerDown}
          onClick={(e) => {
            e.stopPropagation()
            onSelect()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') e.preventDefault()
          }}
          className="absolute inset-0 cursor-grab touch-none select-none rounded hover:shadow-md active:cursor-grabbing"
          aria-label={`Reschedule ${feature.name}`}
        >
          {barContent}
        </div>
      </div>

      {isDragging && dragStyle && (
        <div
          className="pointer-events-none cursor-grabbing touch-none select-none rounded"
          style={dragStyle}
        >
          {barContent}
        </div>
      )}
    </div>
  )
}
