import { GripVertical, MoveHorizontal } from 'lucide-react'

export default function Footer({ features }) {
  const totalSPs = features.reduce((sum, f) => sum + (f.storyPoints || 0), 0)
  const completedCount = features.filter((f) => f.completed).length
  const crossPiCount = features.filter((f) => f.crossPi).length

  return (
    <footer className="flex shrink-0 items-center justify-between border-t border-gray-200 bg-white px-6 py-3 text-sm text-gray-600">
      <div className="flex items-center gap-4">
        <span>
          <strong className="font-semibold text-gray-900">{features.length}</strong> on Gantt
        </span>
        <span className="text-gray-300">|</span>
        <span>
          <strong className="font-semibold text-gray-900">{totalSPs}</strong> SP total
        </span>
        <span className="text-gray-300">|</span>
        <span>
          <strong className="font-semibold text-gray-900">{completedCount}</strong> delivered
        </span>
        {crossPiCount > 0 && (
          <>
            <span className="text-gray-300">|</span>
            <span>
              <strong className="font-semibold text-amber-600">{crossPiCount}</strong> cross-PI
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-3 text-gray-400">
        <span className="flex items-center gap-1.5">
          <GripVertical size={14} />
          Drag rows
        </span>
        <span>·</span>
        <span className="flex items-center gap-1.5">
          <MoveHorizontal size={14} />
          Drag bars to reschedule · Scroll for other PIs
        </span>
      </div>
    </footer>
  )
}
