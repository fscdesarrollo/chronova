import { Check, GripVertical, Layers, AlertTriangle, CalendarOff, StickyNote, MessageSquare, Clock, Link2 } from 'lucide-react'
import { BAR_PADDING } from '../constants'
import { TOTAL_WEEKS } from '../data'
import { ROW_HEIGHT, WEEK_WIDTH } from '../hooks/useFeatureDrag'
import { formatDay } from '../utils/dates'
import { textColorForBg } from '../utils/colors'
import { evaluateFormattingRules, ROW_ICON_LABELS, ruleTooltip } from '../utils/formattingRules'

const ROW_ICONS = {
  clock: Clock,
  'alert-triangle': AlertTriangle,
  alert: AlertTriangle,
}

/** Native title on children inside <button> is suppressed by browsers — use a span wrapper. */
function IconTip({ label, children, className }) {
  return (
    <span
      className={`inline-flex shrink-0 ${className ?? ''}`}
      title={label}
      aria-label={label}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {children}
    </span>
  )
}

function RowIcon({ icon, rules, size = 14 }) {
  const Icon = ROW_ICONS[icon]
  if (!Icon) return null
  const label = ROW_ICON_LABELS[icon] ?? icon
  const tip = ruleTooltip(rules, label)
  return (
    <IconTip label={tip}>
      <Icon size={size} className="text-red-500" aria-hidden />
    </IconTip>
  )
}

function FeatureStatusIcons({ feature, fmt, needsAlert, collapsed = false }) {
  const size = collapsed ? 10 : 14

  return (
    <>
      {feature.missingDates && (
        <IconTip label="Dates not set — feature will not appear on the Gantt">
          <CalendarOff size={size} className="text-amber-500" aria-hidden />
        </IconTip>
      )}
      {feature.hasNotes && (
        <IconTip label="Has notes">
          <StickyNote size={size} className="text-amber-600" aria-hidden />
        </IconTip>
      )}
      {feature.hasComments && (
        <IconTip label="Has comments">
          <MessageSquare size={size} className="text-sky-500" aria-hidden />
        </IconTip>
      )}
      {needsAlert && (
        <IconTip label="Team no longer assigned to this project">
          <AlertTriangle size={size} className="text-amber-500" aria-hidden />
        </IconTip>
      )}
      {feature.crossPi && (
        <IconTip label="Cross-PI feature — spans more than one Program Increment">
          <Layers size={size} className="text-amber-500" aria-hidden />
        </IconTip>
      )}
      {fmt.rowIcons.map((item) => (
        <RowIcon key={item.icon} icon={item.icon} rules={item.rules} size={size} />
      ))}
    </>
  )
}

function hasStatusIcons(feature, fmt, needsAlert) {
  return (
    feature.missingDates ||
    feature.hasNotes ||
    feature.hasComments ||
    needsAlert ||
    feature.crossPi ||
    fmt.rowIcons.length > 0
  )
}

export function FeatureLabelRow({
  feature,
  collapsed = false,
  showFullName,
  isSelected,
  isDragging,
  isDimmed = false,
  formatting,
  onRowPointerDown,
  onSelect,
}) {
  const needsAlert = feature.assignmentStatus === 'team_unassigned'
  const fmt = formatting ?? evaluateFormattingRules([], feature)
  const borderTooltip = fmt.leftBorderRules?.length
    ? ruleTooltip(fmt.leftBorderRules, 'Left border highlight')
    : undefined

  const handleRowKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect()
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      data-feature-interactive
      onClick={onSelect}
      onKeyDown={handleRowKeyDown}
      title={collapsed ? feature.name : undefined}
      className={`group relative flex w-full shrink-0 cursor-pointer items-center gap-2 border-b border-r border-gray-200 text-left ${
        isDragging ? 'bg-white' : isSelected ? 'bg-violet-50' : 'bg-white hover:bg-gray-50/80'
      } ${isDimmed ? 'opacity-25' : ''} ${collapsed ? 'justify-center px-1' : 'px-2'}`}
      style={{
        height: ROW_HEIGHT,
        borderLeftWidth: fmt.leftBorder ? 4 : undefined,
        borderLeftColor: fmt.leftBorder ?? undefined,
        borderLeftStyle: fmt.leftBorder ? 'solid' : undefined,
      }}
    >
      {borderTooltip && (
        <span
          className="absolute bottom-0 left-0 top-0 z-10"
          style={{ width: 4 }}
          title={borderTooltip}
          aria-label={borderTooltip}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        />
      )}
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
      {collapsed ? (
        <div className="flex items-center justify-center gap-1">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full border border-gray-200"
            style={{ backgroundColor: feature.productColor }}
            title={feature.name}
          />
          {hasStatusIcons(feature, fmt, needsAlert) && (
            <div className="flex max-h-9 flex-col items-center justify-center gap-0.5 overflow-hidden">
              <FeatureStatusIcons feature={feature} fmt={fmt} needsAlert={needsAlert} collapsed />
            </div>
          )}
        </div>
      ) : (
        <>
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full border border-gray-200"
            style={{ backgroundColor: feature.productColor }}
          />
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
              {feature.startDate && feature.targetDate && (
                <>
                  <span>·</span>
                  <span>{formatDay(feature.startDate)}</span>
                  <span>→</span>
                  <span>{formatDay(feature.targetDate)}</span>
                </>
              )}
              {feature.storyPoints > 0 && (
                <>
                  <span>·</span>
                  <span className="font-medium text-gray-500">{feature.storyPoints} SP</span>
                </>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <FeatureStatusIcons feature={feature} fmt={fmt} needsAlert={needsAlert} />
          </div>
        </>
      )}
    </div>
  )
}

export function FeatureBarRow({
  feature,
  isSelected,
  isDragging,
  isDimmed = false,
  dragStyle,
  formatting,
  onBarPointerDown,
  onSelect,
}) {
  if (!feature.onGantt) {
    return (
      <div
        className={`relative shrink-0 border-b border-gray-100 bg-gray-50/30 ${
          isSelected ? 'bg-violet-50/30' : ''
        } ${isDimmed ? 'opacity-25' : ''}`}
        style={{ height: ROW_HEIGHT, width: TOTAL_WEEKS * WEEK_WIDTH }}
      />
    )
  }

  const barW = feature.duration * WEEK_WIDTH - BAR_PADDING * 2
  const barL = feature.startWeek * WEEK_WIDTH + BAR_PADDING
  const timelineWidth = TOTAL_WEEKS * WEEK_WIDTH
  const barTextColor = textColorForBg(feature.color)
  const fmt = formatting ?? evaluateFormattingRules([], feature)
  const showSpOnBar = barW >= 120 && feature.storyPoints > 0

  const barContent = (
    <div
      className={`relative flex h-full items-center overflow-hidden rounded px-2 shadow-sm ${
        feature.completed ? 'opacity-70' : ''
      } ${fmt.barPattern ? 'bg-stripes' : ''}`}
      style={{
        backgroundColor: feature.color,
        opacity: fmt.opacity ?? undefined,
      }}
    >
      {fmt.barPattern && (
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(0,0,0,0.3) 4px, rgba(0,0,0,0.3) 8px)',
          }}
        />
      )}
      <span className="relative truncate text-xs font-medium" style={{ color: barTextColor }}>
        {feature.name}
        {showSpOnBar && (
          <span className="font-normal opacity-80"> · {feature.storyPoints} SP</span>
        )}
      </span>
      {feature.completed && <Check size={14} className="relative ml-auto shrink-0" style={{ color: barTextColor }} />}
    </div>
  )

  return (
    <div
      className={`relative shrink-0 touch-none border-b border-gray-100 ${
        isDragging ? '' : 'hover:bg-gray-50/80'
      } ${isSelected ? 'bg-violet-50/50' : ''} ${isDimmed ? 'opacity-25' : ''}`}
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

export { Link2 }
