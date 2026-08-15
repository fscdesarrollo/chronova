import { Plus, Settings, Upload } from 'lucide-react'

export default function TopNav({
  pageTitle,
  planLabel,
  focusProduct,
  onAddFeature,
  onImportFeatures,
  onOpenGanttSettings,
  showAddFeature = true,
  showPlanLabel = false,
  showFocusLabel = false,
  variant = 'light',
  addFeatureDisabled = false,
  addFeatureHint,
  importDisabled = false,
  importHint,
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
        {showFocusLabel && focusProduct && (
          <p className="text-xs text-gray-500">
            Vista:{' '}
            <span className="inline-flex items-center gap-1.5 text-gray-700">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: focusProduct.color }}
                aria-hidden="true"
              />
              {focusProduct.name}
            </span>
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
            {onImportFeatures && (
              <button
                type="button"
                data-tour="import-features"
                onClick={onImportFeatures}
                title={importHint ?? 'Import features from CSV'}
                disabled={importDisabled}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium shadow-sm transition-colors ${
                  importDisabled
                    ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Upload size={16} />
                Import
              </button>
            )}
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
