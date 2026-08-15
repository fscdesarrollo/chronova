import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Minus,
  Plus,
  Search,
  X,
} from 'lucide-react'

function ZoomControls({
  compact = false,
  zoomLabel,
  canZoomIn,
  canZoomOut,
  onZoomIn,
  onZoomOut,
}) {
  const btnClass = compact
    ? 'flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-white/10 hover:text-white disabled:opacity-30'
    : 'flex h-5 w-5 items-center justify-center rounded text-gray-400 hover:bg-white/10 hover:text-white disabled:opacity-30'

  return (
    <div
      className={`flex items-center ${compact ? 'flex-col gap-0.5' : 'gap-0.5'}`}
      title={`Zoom: ${zoomLabel}`}
    >
      <button
        type="button"
        onClick={onZoomOut}
        disabled={!canZoomOut}
        title="Zoom out"
        className={btnClass}
        aria-label="Zoom out"
      >
        <Minus size={compact ? 12 : 11} />
      </button>
      {!compact && (
        <span className="min-w-[3.25rem] px-0.5 text-center text-[9px] font-medium text-gray-300">
          {zoomLabel}
        </span>
      )}
      <button
        type="button"
        onClick={onZoomIn}
        disabled={!canZoomIn}
        title="Zoom in"
        className={btnClass}
        aria-label="Zoom in"
      >
        <Plus size={compact ? 12 : 11} />
      </button>
    </div>
  )
}

export default function FeaturePanelHeader({
  collapsed,
  onToggle,
  onCollapseAll,
  onExpandAll,
  searchQuery = '',
  onSearchChange,
  searchInputRef,
  onScrollToToday,
  zoomLabel = 'Normal',
  canZoomIn = false,
  canZoomOut = false,
  onZoomIn,
  onZoomOut,
}) {
  return (
    <div className="flex h-full shrink-0 flex-col justify-end gap-1 self-stretch border-b border-r border-white/10 bg-header px-2 pb-1.5 pt-1.5">
      {!collapsed && (
        <>
          <div className="flex min-w-0 items-center gap-0.5">
            <span className="truncate px-1 text-xs font-medium text-white">Features</span>
            <button
              type="button"
              onClick={onCollapseAll}
              title="Collapse all sections"
              className="flex h-5 items-center gap-0.5 rounded px-1 text-[9px] text-gray-400 hover:bg-white/10 hover:text-white"
            >
              <ChevronUp size={11} />
              All
            </button>
            <button
              type="button"
              onClick={onExpandAll}
              title="Expand all sections"
              className="flex h-5 items-center gap-0.5 rounded px-1 text-[9px] text-gray-400 hover:bg-white/10 hover:text-white"
            >
              <ChevronDown size={11} />
              All
            </button>
            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                onClick={onScrollToToday}
                title="Go to today"
                className="rounded px-1.5 py-0.5 text-[9px] font-medium text-gray-300 hover:bg-white/10 hover:text-white"
              >
                Today
              </button>
              <span className="h-3 w-px bg-white/15" aria-hidden />
              <ZoomControls
                zoomLabel={zoomLabel}
                canZoomIn={canZoomIn}
                canZoomOut={canZoomOut}
                onZoomIn={onZoomIn}
                onZoomOut={onZoomOut}
              />
              <button
                type="button"
                onClick={onToggle}
                title="Collapse feature panel"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-gray-400 hover:bg-white/10 hover:text-white"
              >
                <ChevronLeft size={14} />
              </button>
            </div>
          </div>
          <div className="relative">
            <Search
              size={12}
              className="pointer-events-none absolute left-1.5 top-1/2 -translate-y-1/2 text-gray-500"
              aria-hidden
            />
            <input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by name or ID…"
              className="w-full rounded border border-white/10 bg-white/5 py-1 pl-6 pr-6 text-[11px] leading-tight text-white placeholder:text-gray-500 focus:border-violet-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                title="Clear search"
                className="absolute right-1 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center rounded text-gray-400 hover:bg-white/10 hover:text-white"
              >
                <X size={11} />
              </button>
            )}
          </div>
        </>
      )}
      {collapsed && (
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={onToggle}
            title="Expand feature panel"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-gray-400 hover:bg-white/10 hover:text-white"
          >
            <ChevronRight size={14} />
          </button>
          <button
            type="button"
            onClick={onScrollToToday}
            title="Go to today"
            className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-white/10 hover:text-white"
            aria-label="Go to today"
          >
            <CalendarDays size={13} />
          </button>
          <ZoomControls
            compact
            zoomLabel={zoomLabel}
            canZoomIn={canZoomIn}
            canZoomOut={canZoomOut}
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
          />
        </div>
      )}
    </div>
  )
}
