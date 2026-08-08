import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react'

export default function FeaturePanelHeader({
  collapsed,
  onToggle,
  onCollapseAll,
  onExpandAll,
}) {
  return (
    <div className="flex h-full shrink-0 items-end justify-between gap-1 self-stretch border-b border-r border-white/10 bg-header px-2 pb-2.5">
      {!collapsed && (
        <div className="flex min-w-0 flex-1 items-center gap-1">
          <span className="truncate px-1 text-sm font-medium text-white">Features</span>
          <button
            type="button"
            onClick={onCollapseAll}
            title="Collapse all sections"
            className="flex h-6 items-center gap-0.5 rounded px-1.5 text-[10px] text-gray-400 hover:bg-white/10 hover:text-white"
          >
            <ChevronUp size={12} />
            All
          </button>
          <button
            type="button"
            onClick={onExpandAll}
            title="Expand all sections"
            className="flex h-6 items-center gap-0.5 rounded px-1.5 text-[10px] text-gray-400 hover:bg-white/10 hover:text-white"
          >
            <ChevronDown size={12} />
            All
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={onToggle}
        title={collapsed ? 'Expand feature panel' : 'Collapse feature panel'}
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded text-gray-400 hover:bg-white/10 hover:text-white ${
          collapsed ? 'mx-auto' : 'ml-auto'
        }`}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </div>
  )
}
