import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Package,
  Users,
} from 'lucide-react'

const NAV_ITEMS = [
  { id: 'timeline', icon: BarChart3, label: 'Timeline' },
  { id: 'projects', icon: FolderOpen, label: 'Projects' },
  { id: 'teams', icon: Users, label: 'Teams' },
  { id: 'products', icon: Package, label: 'Products' },
]

export default function Sidebar({
  collapsed,
  onToggleCollapsed,
  currentPage,
  onNavigate,
  projects,
  projectId,
  onProjectChange,
  teamsForProject,
  teamViewMode,
  onTeamViewModeChange,
  filterTeamId,
  onFilterTeamChange,
  actor,
  onActorChange,
}) {
  const activeProject = projects.find((p) => p.id === projectId)

  return (
    <aside
      className={`flex shrink-0 flex-col bg-sidebar text-white transition-all duration-200 ${
        collapsed ? 'w-14' : 'w-56'
      }`}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-2 py-3">
        {!collapsed && (
          <span className="truncate px-2 text-sm font-semibold">PI Timeline</span>
        )}
        <button
          type="button"
          onClick={onToggleCollapsed}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-white/10 hover:text-white"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="border-b border-white/10 p-2">
        {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            title={label}
            onClick={() => onNavigate(id)}
            className={`mb-0.5 flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors ${
              currentPage === id
                ? 'bg-violet-600 text-white'
                : 'text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Icon size={18} strokeWidth={1.75} className="shrink-0" />
            {!collapsed && <span>{label}</span>}
          </button>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto p-3">
        {!collapsed && currentPage === 'timeline' && (
          <>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              Active project
            </label>
            <select
              value={projectId}
              onChange={(e) => onProjectChange(e.target.value)}
              className="mb-4 w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white focus:border-violet-400 focus:outline-none"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="text-gray-900">
                  {p.name}
                </option>
              ))}
            </select>

            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              Team view
            </label>
            <select
              value={teamViewMode === 'all' ? 'all' : filterTeamId ?? ''}
              onChange={(e) => {
                const val = e.target.value
                if (val === 'all') {
                  onTeamViewModeChange('all')
                  onFilterTeamChange(null)
                } else {
                  onTeamViewModeChange('single')
                  onFilterTeamChange(val)
                }
              }}
              className="mb-2 w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white focus:border-violet-400 focus:outline-none"
            >
              <option value="all" className="text-gray-900">All teams</option>
              {teamsForProject.map((t) => (
                <option key={t.id} value={t.id} className="text-gray-900">
                  {t.name}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      <div className="border-t border-white/10 p-3">
        {!collapsed ? (
          <>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              Actor
            </label>
            <input
              type="text"
              value={actor}
              onChange={(e) => onActorChange(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white placeholder:text-gray-500 focus:border-violet-400 focus:outline-none"
            />
            <p className="mt-1 truncate text-[10px] text-gray-500">{activeProject?.name}</p>
          </>
        ) : (
          <div
            className="mx-auto h-8 w-8 rounded-full bg-violet-600/30 text-center text-xs leading-8 text-violet-200"
            title={actor || 'Set actor name'}
          >
            {(actor || '?')[0]?.toUpperCase()}
          </div>
        )}
      </div>
    </aside>
  )
}
