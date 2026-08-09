import { createPortal } from 'react-dom'

export default function UnsavedChangesDialog({ open, onSave, onDiscard, onCancel }) {
  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="unsaved-changes-title"
      >
        <h2 id="unsaved-changes-title" className="text-lg font-semibold text-gray-900">
          Unsaved changes
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          You have unsaved changes to this feature. What would you like to do?
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onDiscard}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
