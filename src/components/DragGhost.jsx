import { AlertTriangle, Check } from 'lucide-react'
import { createPortal } from 'react-dom'

export default function DragGhost({ drag }) {
  if (!drag?.snapViewport) return null

  const { feature, snapViewport } = drag
  const { left, top, width, height } = snapViewport

  return createPortal(
    <div
      className="pointer-events-none fixed z-[9999]"
      style={{ left, top, width, height }}
    >
      <div
        className={`flex h-full items-center rounded px-2 shadow-xl ring-2 ring-violet-400 ${feature.color}`}
      >
        <span className="truncate text-xs font-medium text-white">{feature.name}</span>
        {feature.completed && <Check size={14} className="ml-auto shrink-0 text-white" />}
        {!feature.completed && feature.deviation != null && feature.deviation >= 8 && (
          <AlertTriangle size={14} className="ml-auto shrink-0 text-white" />
        )}
      </div>
    </div>,
    document.body,
  )
}

export function WeekHighlight({ drag, barWidth, barLeft, leftColWidth, rowHeight, barHeight }) {
  if (!drag || drag.snapStartWeek == null || drag.snapRowIndex == null) return null

  const { feature, snapStartWeek, snapRowIndex } = drag

  return (
    <div
      className="pointer-events-none absolute z-10 rounded border-2 border-dashed border-violet-400 bg-violet-100/40"
      style={{
        left: leftColWidth + barLeft(snapStartWeek),
        top: snapRowIndex * rowHeight + (rowHeight - barHeight) / 2,
        width: barWidth(feature.duration),
        height: barHeight,
      }}
    />
  )
}
