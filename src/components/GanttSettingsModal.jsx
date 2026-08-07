import { useEffect, useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { toISODate } from '../utils/dates'

const MARKER_COLORS = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899']

function emptyMarker() {
  return {
    id: '',
    label: '',
    date: toISODate(new Date()),
    color: MARKER_COLORS[0],
  }
}

export default function GanttSettingsModal({ open, markers, onClose, onSave }) {
  const [draft, setDraft] = useState([])
  const [activeTab, setActiveTab] = useState('markers')

  useEffect(() => {
    if (open) {
      setDraft(markers.length ? markers.map((m) => ({ ...m })) : [emptyMarker()])
    }
  }, [open, markers])

  if (!open) return null

  const updateRow = (index, field, value) => {
    setDraft((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

  const addRow = () => {
    setDraft((prev) => [...prev, emptyMarker()])
  }

  const removeRow = (index) => {
    setDraft((prev) => (prev.length === 1 ? [emptyMarker()] : prev.filter((_, i) => i !== index)))
  }

  const handleSave = () => {
    const valid = draft.filter((m) => m.label.trim() && m.date)
    onSave(valid)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Gantt settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1">
          <aside className="w-44 shrink-0 border-r border-gray-200 bg-gray-50 p-3">
            <button
              type="button"
              className={`w-full rounded-md px-3 py-2 text-left text-sm font-medium ${
                activeTab === 'markers'
                  ? 'bg-white text-violet-700 shadow-sm'
                  : 'text-gray-600 hover:bg-white/70'
              }`}
            >
              Markers
            </button>
          </aside>

          <div className="min-w-0 flex-1 overflow-y-auto p-6">
            {activeTab === 'markers' && (
              <div>
                <h3 className="text-base font-semibold text-gray-900">Plan markers</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Key dates and events to track on the timeline for this project.
                </p>

                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-[1fr_1.2fr_100px_32px] gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                    <span>Date</span>
                    <span>Label</span>
                    <span>Color</span>
                    <span />
                  </div>

                  {draft.map((row, index) => (
                    <div
                      key={row.id || `new-${index}`}
                      className="grid grid-cols-[1fr_1.2fr_100px_32px] items-center gap-2"
                    >
                      <input
                        type="date"
                        value={row.date}
                        onChange={(e) => updateRow(index, 'date', e.target.value)}
                        className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                      />
                      <input
                        type="text"
                        value={row.label}
                        onChange={(e) => updateRow(index, 'label', e.target.value)}
                        placeholder="Label marker"
                        className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                      />
                      <div className="flex items-center gap-1">
                        <input
                          type="color"
                          value={row.color}
                          onChange={(e) => updateRow(index, 'color', e.target.value)}
                          className="h-9 w-full cursor-pointer rounded border border-gray-300"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeRow(index)}
                        className="flex h-8 w-8 items-center justify-center rounded text-gray-400 hover:bg-red-50 hover:text-red-500"
                        title="Remove marker"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addRow}
                  className="mt-4 flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-700"
                >
                  <Plus size={16} />
                  Add marker
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
