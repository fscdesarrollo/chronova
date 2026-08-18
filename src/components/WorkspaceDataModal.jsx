import { useRef, useState } from 'react'
import { AlertTriangle, Download, Upload, X } from 'lucide-react'
import {
  buildWorkspacePayload,
  downloadWorkspace,
  parseWorkspaceFile,
  summarizeWorkspace,
} from '../utils/workspaceExport'

function SummaryList({ summary }) {
  if (!summary) return null

  const rows = [
    ['Projects', summary.projectCount],
    ['Teams', summary.teamCount],
    ['Products', summary.productCount],
    ['Features', summary.featureCount],
    ['Iteration plans', summary.iterationPlanCount],
    ['Audit events', summary.auditEventCount],
  ]

  return (
    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-gray-500">{label}</dt>
          <dd className="font-medium text-gray-900">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

export default function WorkspaceDataModal({
  open,
  onClose,
  actor,
  getWorkspaceSnapshot,
  onImportWorkspace,
}) {
  const fileInputRef = useRef(null)
  const [includeActor, setIncludeActor] = useState(true)
  const [pendingImport, setPendingImport] = useState(null)
  const [importError, setImportError] = useState('')
  const [importing, setImporting] = useState(false)

  if (!open) return null

  const currentSummary = summarizeWorkspace(getWorkspaceSnapshot())

  const handleExport = () => {
    const snapshot = getWorkspaceSnapshot()
    const payload = buildWorkspacePayload(snapshot, { actor, includeActor })
    downloadWorkspace(payload)
  }

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setImportError('')
    setPendingImport(null)

    const text = await file.text()
    const result = parseWorkspaceFile(text)
    if (!result.ok) {
      setImportError(result.error)
      return
    }

    setPendingImport({
      fileName: file.name,
      state: result.state,
      summary: result.summary,
      actor: result.actor,
    })
  }

  const handleConfirmImport = async () => {
    if (!pendingImport) return
    setImporting(true)
    try {
      const result = onImportWorkspace(pendingImport.state, {
        actor: pendingImport.actor,
      })
      if (!result.ok) {
        setImportError(result.error ?? 'Import failed.')
        return
      }
      setPendingImport(null)
      onClose()
    } finally {
      setImporting(false)
    }
  }

  const handleClose = () => {
    if (importing) return
    setPendingImport(null)
    setImportError('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Workspace data</h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          <p className="text-sm text-gray-600">
            Save or restore your full planning workspace — projects, teams, products,
            features, calendar, markers, rules, and audit history.
          </p>

          <section className="mt-6 rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900">Export</h3>
            <p className="mt-1 text-sm text-gray-500">
              Download a JSON snapshot of your current workspace.
            </p>
            <SummaryList summary={currentSummary} />
            <label className="mt-4 flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={includeActor}
                onChange={(e) => setIncludeActor(e.target.checked)}
                className="rounded border-gray-300 text-violet-600"
              />
              Include user name
            </label>
            <button
              type="button"
              onClick={handleExport}
              className="mt-4 flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
            >
              <Download size={16} />
              Export workspace
            </button>
          </section>

          <section className="mt-4 rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900">Import</h3>
            <p className="mt-1 text-sm text-gray-500">
              Load a previously exported workspace file. This replaces all current data.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleFileChange}
            />

            {!pendingImport ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Upload size={16} />
                Choose workspace file
              </button>
            ) : (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex gap-2 text-amber-900">
                  <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Replace current workspace?</p>
                    <p className="mt-1 text-sm text-amber-800">
                      File: <span className="font-medium">{pendingImport.fileName}</span>
                    </p>
                    <SummaryList summary={pendingImport.summary} />
                    {pendingImport.actor && (
                      <p className="mt-2 text-sm text-amber-800">
                        User name in file: <span className="font-medium">{pendingImport.actor}</span>
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPendingImport(null)}
                    disabled={importing}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    disabled={importing}
                    className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60"
                  >
                    {importing ? 'Importing…' : 'Import and replace'}
                  </button>
                </div>
              </div>
            )}

            {importError && (
              <p className="mt-3 text-sm text-red-600" role="alert">
                {importError}
              </p>
            )}
          </section>
        </div>

        <div className="flex justify-end border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={importing}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
