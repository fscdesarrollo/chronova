import { useCallback, useEffect, useRef, useState } from 'react'
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Filter,
  Plus,
  Search,
  Settings,
  Upload,
  X,
} from 'lucide-react'

function FilterChip({
  label,
  value,
  active,
  accentColor,
  onClear,
  children,
  open,
  onToggle,
}) {
  return (
    <div className="relative">
      <div
        className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium transition-colors ${
          active
            ? 'border-violet-300 bg-violet-50 text-violet-800'
            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
        }`}
      >
        <button type="button" onClick={onToggle} className="flex min-w-0 items-center gap-1">
          <span className="text-gray-500">{label}:</span>
          {accentColor && (
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: accentColor }}
              aria-hidden
            />
          )}
          <span className="max-w-[7rem] truncate">{value}</span>
          <ChevronDown size={12} className="shrink-0 opacity-60" />
        </button>
        {active && (
          <button
            type="button"
            onClick={onClear}
            className="ml-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded hover:bg-violet-200/60"
            title={`Clear ${label.toLowerCase()} filter`}
            aria-label={`Clear ${label.toLowerCase()} filter`}
          >
            <X size={10} />
          </button>
        )}
      </div>
      {open && children}
    </div>
  )
}

function FilterMenu({ options, value, onChange, onClose }) {
  const ref = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute left-0 top-full z-50 mt-1 min-w-[10rem] rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
    >
      {options.map((opt) => (
        <button
          key={opt.id ?? 'all'}
          type="button"
          onClick={() => {
            onChange(opt.id)
            onClose()
          }}
          className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-gray-50 ${
            (value ?? null) === (opt.id ?? null) ? 'font-medium text-violet-700' : 'text-gray-700'
          }`}
        >
          {opt.color && (
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: opt.color }}
              aria-hidden
            />
          )}
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export default function TimelineToolbar({
  projects = [],
  projectId,
  onProjectChange,
  planLabel,
  viewMode,
  onViewScopeChange,
  teamsForProject = [],
  filterTeamId,
  onTeamFilterChange,
  productsForProject = [],
  filterProductId,
  onProductFocusChange,
  searchQuery = '',
  onSearchChange,
  onCollapseAll,
  onExpandAll,
  onScrollToToday,
  onAddFeature,
  onImportFeatures,
  onOpenGanttSettings,
  addFeatureDisabled = false,
  addFeatureHint,
  importDisabled = false,
  importHint,
}) {
  const [teamMenuOpen, setTeamMenuOpen] = useState(false)
  const [productMenuOpen, setProductMenuOpen] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const mobileFiltersRef = useRef(null)
  const searchInputRef = useRef(null)

  const selectedTeam = teamsForProject.find((t) => t.id === filterTeamId)
  const selectedProduct = productsForProject.find((p) => p.id === filterProductId)
  const activeFilterCount = (filterTeamId ? 1 : 0) + (filterProductId ? 1 : 0)

  const teamOptions = [
    { id: null, label: 'All' },
    ...teamsForProject.map((t) => ({ id: t.id, label: t.name })),
  ]
  const productOptions = [
    { id: null, label: 'All' },
    ...productsForProject.map((p) => ({ id: p.id, label: p.name, color: p.color })),
  ]

  const closeAllMenus = useCallback(() => {
    setTeamMenuOpen(false)
    setProductMenuOpen(false)
    setMobileFiltersOpen(false)
  }, [])

  useEffect(() => {
    if (!mobileFiltersOpen) return
    const handleClick = (e) => {
      if (mobileFiltersRef.current && !mobileFiltersRef.current.contains(e.target)) {
        setMobileFiltersOpen(false)
      }
    }
    const handleKey = (e) => {
      if (e.key === 'Escape') setMobileFiltersOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [mobileFiltersOpen])

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') closeAllMenus()
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = document.activeElement?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [closeAllMenus])

  const viewIsBacklog = viewMode === 'backlog'

  return (
    <div
      data-tour="timeline-toolbar"
      className="shrink-0 border-b border-gray-200 bg-white"
    >
      {/* Row 1 — context + actions */}
      <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-4 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <div className="min-w-0">
            <label
              htmlFor="timeline-active-project"
              className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-gray-400"
            >
              Project
            </label>
            <select
              id="timeline-active-project"
              value={projectId ?? ''}
              onChange={(e) => onProjectChange(e.target.value)}
              disabled={projects.length === 0}
              className="max-w-[14rem] truncate rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm font-semibold text-gray-900 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400 disabled:opacity-50 sm:max-w-xs"
            >
              {projects.length === 0 && <option value="">No project yet</option>}
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {planLabel && (
              <p className="mt-0.5 truncate text-[10px] text-gray-500">
                Plan: <span className="font-medium text-gray-600">{planLabel}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onOpenGanttSettings}
            title="Gantt settings"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            <Settings size={16} />
          </button>
          <div className="flex" data-tour="import-features">
            <button
              type="button"
              onClick={onImportFeatures}
              title={importHint ?? 'Import features from CSV'}
              disabled={importDisabled}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border sm:hidden ${
                importDisabled
                  ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Upload size={16} />
            </button>
            <button
              type="button"
              onClick={onImportFeatures}
              title={importHint ?? 'Import features from CSV'}
              disabled={importDisabled}
              className={`hidden items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm font-medium sm:flex ${
                importDisabled
                  ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Upload size={14} />
              Import
            </button>
          </div>
          <button
            type="button"
            onClick={onAddFeature}
            title={addFeatureHint}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white shadow-sm ${
              addFeatureDisabled
                ? 'cursor-not-allowed bg-violet-400 opacity-80'
                : 'bg-violet-600 hover:bg-violet-700'
            }`}
          >
            <Plus size={14} />
            <span className="hidden sm:inline">Add Feature</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Row 2 — filters + search + view controls */}
      <div
        data-tour="timeline-filters"
        className="flex h-9 items-center gap-2 bg-gray-50/80 px-4"
      >
        <div
          className="flex shrink-0 rounded-lg border border-gray-200 bg-white p-0.5"
          role="group"
          aria-label="View scope"
        >
          <button
            type="button"
            onClick={() => onViewScopeChange('all')}
            className={`rounded-md px-2 py-0.5 text-xs font-medium transition-colors ${
              !viewIsBacklog
                ? 'bg-violet-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => onViewScopeChange('backlog')}
            className={`rounded-md px-2 py-0.5 text-xs font-medium transition-colors ${
              viewIsBacklog
                ? 'bg-violet-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Backlog
          </button>
        </div>

        <div className="hidden items-center gap-1.5 lg:flex">
          <FilterChip
            label="Team"
            value={selectedTeam?.name ?? 'All'}
            active={Boolean(filterTeamId)}
            onClear={() => onTeamFilterChange(null)}
            open={teamMenuOpen}
            onToggle={() => {
              setProductMenuOpen(false)
              setTeamMenuOpen((o) => !o)
            }}
          >
            <FilterMenu
              options={teamOptions}
              value={filterTeamId}
              onChange={onTeamFilterChange}
              onClose={() => setTeamMenuOpen(false)}
            />
          </FilterChip>

          <FilterChip
            label="Product"
            value={selectedProduct?.name ?? 'All'}
            active={Boolean(filterProductId)}
            accentColor={filterProductId ? selectedProduct?.color : undefined}
            onClear={() => onProductFocusChange(null)}
            open={productMenuOpen}
            onToggle={() => {
              setTeamMenuOpen(false)
              setProductMenuOpen((o) => !o)
            }}
          >
            <FilterMenu
              options={productOptions}
              value={filterProductId}
              onChange={onProductFocusChange}
              onClose={() => setProductMenuOpen(false)}
            />
          </FilterChip>
        </div>

        <div className="relative lg:hidden" ref={mobileFiltersRef}>
          <button
            type="button"
            onClick={() => setMobileFiltersOpen((o) => !o)}
            className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium ${
              activeFilterCount > 0
                ? 'border-violet-300 bg-violet-50 text-violet-800'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Filter size={12} />
            Filters
            {activeFilterCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-violet-600 px-1 text-[10px] text-white">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown size={12} className="opacity-60" />
          </button>
          {mobileFiltersOpen && (
            <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                Team
              </label>
              <select
                value={filterTeamId ?? ''}
                onChange={(e) => onTeamFilterChange(e.target.value || null)}
                className="mb-3 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-gray-900"
              >
                <option value="">All</option>
                {teamsForProject.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                Product
              </label>
              <select
                value={filterProductId ?? ''}
                onChange={(e) => onProductFocusChange(e.target.value || null)}
                className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-gray-900"
              >
                <option value="">All</option>
                {productsForProject.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="relative min-w-0 flex-1">
          <Search
            size={13}
            className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
            aria-hidden
          />
          <input
            ref={searchInputRef}
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name or ID…"
            title="Press / to focus search"
            className="w-full rounded-lg border border-gray-200 bg-white py-1 pl-7 pr-7 text-xs text-gray-900 placeholder:text-gray-400 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              title="Clear search"
              className="absolute right-1.5 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <X size={11} />
            </button>
          )}
        </div>

        <div className="hidden w-8 shrink-0 sm:block" aria-hidden />

        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={onExpandAll}
            title="Expand all sections"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 hover:bg-white hover:text-gray-800"
          >
            <ChevronDown size={15} />
          </button>
          <button
            type="button"
            onClick={onCollapseAll}
            title="Collapse all sections"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 hover:bg-white hover:text-gray-800"
          >
            <ChevronUp size={15} />
          </button>
          <button
            type="button"
            onClick={onScrollToToday}
            title="Go to today"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 hover:bg-white hover:text-gray-800"
          >
            <CalendarDays size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
