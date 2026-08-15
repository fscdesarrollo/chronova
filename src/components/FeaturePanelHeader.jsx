import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function FeaturePanelHeader({ collapsed, onToggle }) {
  return (
    <div className="flex min-h-[4.5rem] shrink-0 flex-col justify-end self-stretch border-b border-r border-white/10 bg-header px-2 pb-2 pt-1.5">
      <div className="flex min-w-0 items-center gap-1">
        {!collapsed && (
          <span className="truncate px-1 text-xs font-medium text-white">Features</span>
        )}
        <button
          type="button"
          onClick={onToggle}
          title={collapsed ? 'Expand feature panel' : 'Collapse feature panel'}
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-gray-400 hover:bg-white/10 hover:text-white ${
            collapsed ? 'mx-auto' : 'ml-auto'
          }`}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
    </div>
  )
}
