import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function FeaturePanelHeader({ collapsed, onToggle }) {
  return (
    <div className="flex h-full shrink-0 items-end justify-between gap-1 self-stretch border-b border-r border-white/10 bg-header px-2 pb-2.5">
      {!collapsed && (
        <span className="truncate px-1 text-sm font-medium text-white">Features</span>
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
