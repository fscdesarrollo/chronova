import { Plus, Settings } from 'lucide-react'

export default function TopNav({
  pageTitle,
  planLabel,
  onAddFeature,
  onOpenGanttSettings,
  showAddFeature = true,
  showPlanLabel = false,
  variant = 'light',
  addFeatureDisabled = false,
  addFeatureHint,
}) {
  const isDark = variant === 'dark'

  return (
    <header
      className={`flex h-14 shrink-0 items-center justify-between border-b px-6 ${
        isDark
          ? 'border-white/10 bg-[#12182a]/95 text-white backdrop-blur-sm'
          : 'border-gray-200 bg-white'
      }`}
    >
      <div>
        <h1 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {pageTitle}
        </h1>
        {showPlanLabel && planLabel && (
          <p className="text-xs text-gray-500">
            Plan: <span className="text-gray-700">{planLabel}</span>
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
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
              title={addFeatureHint}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors ${
                addFeatureDisabled
                  ? 'cursor-not-allowed bg-violet-400 opacity-80'
                  : 'bg-violet-600 hover:bg-violet-700'
              }`}
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
