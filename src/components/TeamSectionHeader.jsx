import { AlertTriangle } from 'lucide-react'
import { SECTION_ROW_HEIGHT } from '../constants'

export default function TeamSectionHeader({ label, count, alert }) {
  return (
    <div
      className={`flex items-center gap-2 border-b border-gray-200 px-3 text-xs font-semibold uppercase tracking-wide ${
        alert ? 'bg-amber-50 text-amber-800' : 'bg-gray-100 text-gray-600'
      }`}
      style={{ height: SECTION_ROW_HEIGHT }}
    >
      {alert && <AlertTriangle size={14} className="shrink-0" />}
      <span className="truncate">{label}</span>
      <span className="ml-auto shrink-0 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-medium">
        {count}
      </span>
    </div>
  )
}
