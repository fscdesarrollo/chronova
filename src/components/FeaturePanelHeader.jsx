import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Search, X } from 'lucide-react'

export default function FeaturePanelHeader({
  collapsed,
  onToggle,
  onCollapseAll,
  onExpandAll,
  searchQuery = '',
  onSearchChange,
  searchInputRef,
}) {
  return (
    <div className="flex h-full shrink-0 flex-col justify-end gap-2 self-stretch border-b border-r border-white/10 bg-header px-2 pb-2.5 pt-2">
      {!collapsed && (
        <>
          <div className="flex min-w-0 items-center gap-1">
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
            <button
              type="button"
              onClick={onToggle}
              title="Collapse feature panel"
              className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded text-gray-400 hover:bg-white/10 hover:text-white"
            >
              <ChevronLeft size={16} />
            </button>
          </div>
          <div className="relative">
            <Search
              size={14}
              className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-gray-500"
              aria-hidden
            />
            <input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by name or ID…"
              className="w-full rounded-md border border-white/10 bg-white/5 py-1.5 pl-7 pr-7 text-xs text-white placeholder:text-gray-500 focus:border-violet-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                title="Clear search"
                className="absolute right-1.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded text-gray-400 hover:bg-white/10 hover:text-white"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </>
      )}
      {collapsed && (
        <button
          type="button"
          onClick={onToggle}
          title="Expand feature panel"
          className="mx-auto flex h-7 w-7 shrink-0 items-center justify-center rounded text-gray-400 hover:bg-white/10 hover:text-white"
        >
          <ChevronRight size={16} />
        </button>
      )}
    </div>
  )
}
