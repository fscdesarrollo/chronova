import { Check, Circle, X } from 'lucide-react'
import { GANTT_SETUP_STEPS } from '../../utils/ganttReadiness'

export default function GanttSetupChecklist({
  readiness,
  onDismiss,
  onStartWizard,
  onNavigate,
  onImportFeatures,
}) {
  if (!readiness || readiness.isComplete) return null

  const actionForStep = (stepId) => {
    switch (stepId) {
      case 'project':
        return { label: 'Create project', page: 'projects', wizard: true }
      case 'calendar':
        return { label: 'Set up calendar', page: 'iterations' }
      case 'product':
        return { label: 'Add product', page: 'products' }
      case 'team':
        return { label: 'Add team', page: 'teams' }
      case 'feature':
        return { label: 'Add feature', page: 'timeline', addFeature: true }
      default:
        return null
    }
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex items-start justify-center p-6">
      <div className="pointer-events-auto w-full max-w-md rounded-xl border border-violet-200/40 bg-white/95 p-5 shadow-xl backdrop-blur-sm">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
              Getting started
            </p>
            <h3 className="text-base font-semibold text-gray-900">Prepare your Gantt</h3>
            <p className="mt-1 text-sm text-gray-500">
              Complete these steps to start planning features on the timeline.
            </p>
          </div>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Dismiss checklist"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <ul className="mb-4 space-y-2">
          {GANTT_SETUP_STEPS.map(({ id, label }) => {
            const done = readiness.steps[id]
            const action = !done ? actionForStep(id) : null
            return (
              <li
                key={id}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                  done ? 'bg-emerald-50 text-emerald-800' : 'bg-gray-50 text-gray-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  {done ? (
                    <Check size={14} className="shrink-0 text-emerald-600" />
                  ) : (
                    <Circle size={14} className="shrink-0 text-gray-400" />
                  )}
                  {label}
                </span>
                {action && (
                  <button
                    type="button"
                    onClick={() => {
                      if (action.wizard) onStartWizard?.()
                      else if (action.addFeature) onNavigate?.('timeline', { addFeature: true })
                      else onNavigate?.(action.page)
                    }}
                    className="text-xs font-medium text-violet-600 hover:text-violet-700"
                  >
                    {action.label}
                  </button>
                )}
              </li>
            )
          })}
        </ul>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {readiness.completedCount} of {readiness.totalSteps} complete
          </span>
          {!readiness.steps.project ? (
            <button
              type="button"
              onClick={() => onStartWizard?.()}
              className="font-medium text-violet-600 hover:text-violet-700"
            >
              Run setup wizard
            </button>
          ) : (
            onImportFeatures && (
              <button
                type="button"
                onClick={onImportFeatures}
                className="font-medium text-violet-600 hover:text-violet-700"
              >
                Import a feature list
              </button>
            )
          )}
        </div>
      </div>
    </div>
  )
}
