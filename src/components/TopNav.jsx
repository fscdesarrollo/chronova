import { Plus, Settings } from 'lucide-react'

export default function TopNav({
  viewMode,
  onViewModeChange,
  projectName,
  onAddFeature,
  onOpenGanttSettings,
  showAddFeature = true,
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div>
        <p className="text-xs text-gray-500">
          {projectName} / <span className="text-gray-700">PI 26.2 – 26.4</span>
        </p>
        <h1 className="text-lg font-semibold text-gray-900">PI Timeline</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 p-0.5">
          <button
            type="button"
            onClick={() => onViewModeChange('current')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              viewMode === 'current'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            Current
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('baseline')}
            title="Available in MVP 2"
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              viewMode === 'baseline'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Baseline
          </button>
        </div>

        {showAddFeature && (
          <>
            <button
              type="button"
              onClick={onOpenGanttSettings}
              title="Gantt settings"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-900"
            >
              <Settings size={18} />
            </button>
            <button
              type="button"
              onClick={onAddFeature}
              className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-violet-700"
            >
              <Plus size={16} />
              Add Feature
            </button>
          </>
        )}
      </div>
    </header>
  )
}
