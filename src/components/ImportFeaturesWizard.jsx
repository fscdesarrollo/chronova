import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  FileSpreadsheet,
  Upload,
  X,
} from 'lucide-react'
import {
  DATE_FORMATS,
  IMPORT_FIELDS,
  MAX_IMPORT_ROWS,
  buildImportPreview,
  buildProductResolutions,
  buildTeamResolutions,
  cellAt,
  downloadFeatureImportTemplate,
  guessDateFormat,
  isSpreadsheetFileName,
  parseDelimitedTable,
  parseImportDate,
  productActionLabel,
  suggestColumnMap,
  uniqueColumnValues,
} from '../utils/featureImport'

const STEPS = [
  { id: 'intro', title: 'This project' },
  { id: 'file', title: 'Your list' },
  { id: 'columns', title: 'Columns' },
  { id: 'match', title: 'Match' },
  { id: 'preview', title: 'Review' },
]

const emptyTable = { headers: [], rows: [], delimiter: ',', truncated: false, totalRows: 0 }

function emptyColumnMap() {
  return Object.fromEntries(IMPORT_FIELDS.map((field) => [field.id, -1]))
}

export default function ImportFeaturesWizard({
  open,
  projectName,
  projectId,
  products,
  projectProducts,
  teams,
  projectTeams,
  onClose,
  onImport,
}) {
  const [stepIndex, setStepIndex] = useState(0)
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')
  const [pasteText, setPasteText] = useState('')
  const [table, setTable] = useState(emptyTable)
  const [columnMap, setColumnMap] = useState(emptyColumnMap)
  const [dateFormat, setDateFormat] = useState('ymd')
  const [productResolutions, setProductResolutions] = useState([])
  const [teamResolutions, setTeamResolutions] = useState([])
  const [forceBacklog, setForceBacklog] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    if (!open) return
    setStepIndex(0)
    setError('')
    setFileName('')
    setPasteText('')
    setTable(emptyTable)
    setColumnMap(emptyColumnMap())
    setDateFormat('ymd')
    setProductResolutions([])
    setTeamResolutions([])
    setForceBacklog(false)
    setDragOver(false)
  }, [open])

  const dateSamples = useMemo(() => {
    const values = [
      ...uniqueColumnValues(table.rows, columnMap.startDate),
      ...uniqueColumnValues(table.rows, columnMap.targetDate),
    ]
    return values.slice(0, 8)
  }, [table.rows, columnMap.startDate, columnMap.targetDate])

  const preview = useMemo(
    () =>
      buildImportPreview({
        rows: table.rows,
        columnMap,
        dateFormat,
        productResolutions,
        teamResolutions,
        forceBacklog,
      }),
    [table.rows, columnMap, dateFormat, productResolutions, teamResolutions, forceBacklog],
  )

  if (!open) return null

  const step = STEPS[stepIndex]
  const isLast = stepIndex === STEPS.length - 1
  const catalogProducts = products.filter(
    (product) => !projectProducts.some((pp) => pp.projectId === projectId && pp.productId === product.id),
  )
  const projectProductList = products.filter((product) =>
    projectProducts.some((pp) => pp.projectId === projectId && pp.productId === product.id),
  )

  const applyParsedTable = (text, name = '') => {
    const parsed = parseDelimitedTable(text)
    if (!parsed.headers.length || !parsed.rows.length) {
      setError('We could not find a header row and at least one feature row.')
      return false
    }
    const nextMap = suggestColumnMap(parsed.headers)
    const nextFormat = guessDateFormat([
      ...uniqueColumnValues(parsed.rows, nextMap.startDate),
      ...uniqueColumnValues(parsed.rows, nextMap.targetDate),
    ])
    setTable(parsed)
    setColumnMap(nextMap)
    setDateFormat(nextFormat)
    setFileName(name)
    setError('')
    return true
  }

  const readFile = (file) => {
    if (!file) return
    if (isSpreadsheetFileName(file.name)) {
      setError('Excel workbooks (.xlsx) are not supported yet. In Excel, choose File → Save As → CSV UTF-8, then upload that file.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      applyParsedTable(String(reader.result ?? ''), file.name)
    }
    reader.onerror = () => setError('Could not read that file. Try saving it as CSV UTF-8.')
    reader.readAsText(file)
  }

  const rebuildMatches = () => {
    const productNames = uniqueColumnValues(table.rows, columnMap.product)
    const teamNames = uniqueColumnValues(table.rows, columnMap.team)
    setProductResolutions(buildProductResolutions(productNames, products, projectProducts, projectId))
    setTeamResolutions(buildTeamResolutions(teamNames, teams, projectTeams, projectId))
  }

  const goNext = () => {
    setError('')
    if (step.id === 'intro' && !projectId) {
      setError('Select a project before importing.')
      return
    }
    if (step.id === 'file' && !table.rows.length) {
      setError('Upload a CSV or paste rows from a spreadsheet to continue.')
      return
    }
    if (step.id === 'columns') {
      if (columnMap.name < 0 || columnMap.product < 0) {
        setError('Match Feature name and Product to continue.')
        return
      }
      rebuildMatches()
    }
    if (isLast) {
      if (!preview.applyPlan.features.length) {
        setError('Nothing to import. Fix skipped rows or product matches and try again.')
        return
      }
      onImport(preview.applyPlan)
      onClose()
      return
    }
    setStepIndex((prev) => prev + 1)
  }

  const goBack = () => {
    setError('')
    setStepIndex((prev) => Math.max(0, prev - 1))
  }

  const sampleDate = dateSamples.find(Boolean)
  const sampleParsed = sampleDate ? parseImportDate(sampleDate, dateFormat) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Import features</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Step {stepIndex + 1} of {STEPS.length} · {step.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close import wizard"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-2 px-6 pt-4">
          {STEPS.map((item, index) => (
            <div
              key={item.id}
              className={`h-1 flex-1 rounded-full ${index <= stepIndex ? 'bg-violet-500' : 'bg-gray-200'}`}
            />
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {error && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          {step.id === 'intro' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-700">
                You are importing into{' '}
                <span className="font-semibold text-gray-900">{projectName || 'this project'}</span>.
                Nothing is saved until you confirm on the last step.
              </p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-gray-600">
                <li>Use a CSV file, or copy rows from Excel / Google Sheets and paste them.</li>
                <li>Each row needs a feature name and a product name.</li>
                <li>New products are created and assigned to this project. Unknown teams become backlog.</li>
                <li>Team and dates are optional — skip them if you only have a backlog list.</li>
              </ul>
              <button
                type="button"
                onClick={downloadFeatureImportTemplate}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Download size={16} />
                Download example CSV
              </button>
            </div>
          )}

          {step.id === 'file' && (
            <div className="space-y-4">
              <label
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragOver(false)
                  readFile(e.dataTransfer.files?.[0])
                }}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center ${
                  dragOver ? 'border-violet-400 bg-violet-50' : 'border-gray-300 bg-gray-50'
                }`}
              >
                <Upload size={22} className="mb-2 text-gray-400" />
                <span className="text-sm font-medium text-gray-800">Drop a CSV file here, or click to browse</span>
                <span className="mt-1 text-xs text-gray-500">Excel files: save as CSV UTF-8 first</span>
                <input
                  type="file"
                  accept=".csv,text/csv,text/plain,.txt"
                  className="hidden"
                  onChange={(e) => {
                    readFile(e.target.files?.[0])
                    e.target.value = ''
                  }}
                />
              </label>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Or paste from a spreadsheet
                </label>
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  rows={6}
                  placeholder={'Feature name\tProduct\nPort Call Summary\tPlatform'}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
                <button
                  type="button"
                  onClick={() => applyParsedTable(pasteText, 'pasted list')}
                  className="mt-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Use pasted rows
                </button>
              </div>

              {table.rows.length > 0 && (
                <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  <FileSpreadsheet size={16} />
                  {fileName ? `${fileName} · ` : ''}
                  {table.rows.length} feature row{table.rows.length === 1 ? '' : 's'}
                  {table.truncated ? ` (first ${MAX_IMPORT_ROWS} of ${table.totalRows})` : ''}
                </p>
              )}
            </div>
          )}

          {step.id === 'columns' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Match your spreadsheet columns to Chronova fields. Feature name and Product are required.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {IMPORT_FIELDS.map((field) => (
                  <label key={field.id} className="block text-sm">
                    <span className="mb-1 block font-medium text-gray-700">
                      {field.label}
                      {field.required ? ' *' : ''}
                    </span>
                    <select
                      value={columnMap[field.id]}
                      onChange={(e) =>
                        setColumnMap((prev) => ({ ...prev, [field.id]: Number(e.target.value) }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                    >
                      <option value={-1}>Not in file</option>
                      {table.headers.map((header, index) => (
                        <option key={`${header}-${index}`} value={index}>
                          {header || `Column ${index + 1}`}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>

              {(columnMap.startDate >= 0 || columnMap.targetDate >= 0) && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Date format</label>
                  <select
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 sm:max-w-xs"
                  >
                    {DATE_FORMATS.map((format) => (
                      <option key={format.id} value={format.id}>
                        {format.label} (e.g. {format.example})
                      </option>
                    ))}
                  </select>
                  {sampleDate && (
                    <p className="mt-1 text-xs text-gray-500">
                      Example in your file: {sampleDate}
                      {sampleParsed?.ok
                        ? ` → ${sampleParsed.iso}`
                        : ' — could not read this date with the selected format'}
                    </p>
                  )}
                </div>
              )}

              {table.rows[0] && (
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">First row preview</p>
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full text-left text-xs">
                      <thead className="bg-gray-50 text-gray-500">
                        <tr>
                          {table.headers.map((header, index) => (
                            <th key={`${header}-${index}`} className="px-3 py-2 font-medium">
                              {header || `Column ${index + 1}`}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {table.rows.slice(0, 3).map((row, rowIndex) => (
                          <tr key={rowIndex} className="border-t border-gray-100">
                            {table.headers.map((_, colIndex) => (
                              <td key={colIndex} className="px-3 py-2 text-gray-800">
                                {cellAt(row, colIndex) || '—'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {step.id === 'match' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Products in your file</h3>
                <p className="mb-3 text-xs text-gray-500">
                  Chronova matches by name. You can create new products, reuse existing ones, or skip those rows.
                </p>
                {productResolutions.length === 0 && (
                  <p className="text-sm text-gray-400">No product names found.</p>
                )}
                <ul className="space-y-2">
                  {productResolutions.map((item) => (
                    <li key={item.key} className="rounded-lg border border-gray-200 p-3">
                      <div className="mb-2 text-sm font-medium text-gray-900">{item.name}</div>
                      <select
                        value={`${item.action}:${item.productId ?? ''}`}
                        onChange={(e) => {
                          const [action, productId] = e.target.value.split(':')
                          setProductResolutions((prev) =>
                            prev.map((row) =>
                              row.key === item.key
                                ? {
                                    ...row,
                                    action,
                                    productId: productId || null,
                                  }
                                : row,
                            ),
                          )
                        }}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      >
                        <option value="create:">Create new product</option>
                        {projectProductList.length > 0 && (
                          <optgroup label="Already in this project">
                            {projectProductList.map((product) => (
                              <option key={product.id} value={`use:${product.id}`}>
                                Use {product.name}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        {catalogProducts.length > 0 && (
                          <optgroup label="Catalog — will assign to this project">
                            {catalogProducts.map((product) => (
                              <option key={product.id} value={`assign:${product.id}`}>
                                Assign {product.name}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        <option value="skip:">Skip these rows</option>
                      </select>
                      <p className="mt-1 text-xs text-gray-500">{productActionLabel(item, products)}</p>
                    </li>
                  ))}
                </ul>
              </div>

              {teamResolutions.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Teams in your file</h3>
                  <p className="mb-3 text-xs text-gray-500">
                    Unknown teams import as backlog. Matching teams can be assigned to this project.
                  </p>
                  <ul className="space-y-2">
                    {teamResolutions.map((item) => (
                      <li key={item.key} className="rounded-lg border border-gray-200 p-3">
                        <div className="mb-2 text-sm font-medium text-gray-900">{item.name}</div>
                        <select
                          value={item.action === 'backlog' ? 'backlog' : (item.action === 'assign' ? 'assign' : 'use')}
                          onChange={(e) => {
                            const action = e.target.value
                            setTeamResolutions((prev) =>
                              prev.map((row) => (row.key === item.key ? { ...row, action } : row)),
                            )
                          }}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        >
                          {item.teamId && (
                            <option value={projectTeams.some((pt) => pt.projectId === projectId && pt.teamId === item.teamId) ? 'use' : 'assign'}>
                              {projectTeams.some((pt) => pt.projectId === projectId && pt.teamId === item.teamId)
                                ? `Use ${item.name}`
                                : `Assign ${item.name} to this project`}
                            </option>
                          )}
                          <option value="backlog">Import as backlog</option>
                        </select>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {step.id === 'preview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                <SummaryCard label="Features" value={preview.summary.included} />
                <SummaryCard label="New products" value={preview.summary.productsToCreate} />
                <SummaryCard label="Planned" value={preview.summary.planned} />
                <SummaryCard label="Backlog" value={preview.summary.backlog} />
              </div>
              {(preview.summary.productsToAssign > 0 || preview.summary.teamsToAssign > 0) && (
                <p className="text-xs text-gray-500">
                  {preview.summary.productsToAssign > 0 && (
                    <span>{preview.summary.productsToAssign} existing product(s) will be assigned to this project. </span>
                  )}
                  {preview.summary.teamsToAssign > 0 && (
                    <span>{preview.summary.teamsToAssign} team(s) will be assigned to this project.</span>
                  )}
                </p>
              )}
              {preview.summary.skipped > 0 && (
                <p className="text-xs text-amber-700">
                  {preview.summary.skipped} row(s) will be skipped (missing name/product or skipped product).
                </p>
              )}

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={forceBacklog}
                  onChange={(e) => setForceBacklog(e.target.checked)}
                  className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                />
                Import everything as backlog (ignore teams)
              </label>

              <div className="max-h-64 overflow-auto rounded-lg border border-gray-200">
                <table className="min-w-full text-left text-xs">
                  <thead className="sticky top-0 bg-gray-50 text-gray-500">
                    <tr>
                      <th className="px-3 py-2 font-medium">Row</th>
                      <th className="px-3 py-2 font-medium">Feature</th>
                      <th className="px-3 py-2 font-medium">Product</th>
                      <th className="px-3 py-2 font-medium">Team</th>
                      <th className="px-3 py-2 font-medium">Dates</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row) => (
                      <tr key={row.rowIndex} className="border-t border-gray-100">
                        <td className="px-3 py-2 text-gray-400">{row.rowIndex}</td>
                        <td className="px-3 py-2 text-gray-900">{row.name || '—'}</td>
                        <td className="px-3 py-2 text-gray-700">{row.productName || '—'}</td>
                        <td className="px-3 py-2 text-gray-700">
                          {row.planningStatus === 'backlog' ? 'Backlog' : row.teamName || '—'}
                        </td>
                        <td className="px-3 py-2 text-gray-700">
                          {row.startDate || row.targetDate
                            ? `${row.startDate || '—'} → ${row.targetDate || '—'}`
                            : '—'}
                        </td>
                        <td className="px-3 py-2">
                          <StatusPill status={row.include ? row.status : 'skip'} issues={row.issues} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
          <div className="flex gap-2">
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={goBack}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <ArrowLeft size={14} />
                Back
              </button>
            )}
            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
            >
              {isLast ? (
                <>
                  <Check size={14} />
                  Import {preview.summary.included} feature{preview.summary.included === 1 ? '' : 's'}
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2">
      <div className="text-lg font-semibold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  )
}

function StatusPill({ status, issues }) {
  const styles = {
    ok: 'bg-emerald-50 text-emerald-800',
    warning: 'bg-amber-50 text-amber-800',
    skip: 'bg-gray-100 text-gray-600',
  }
  const label = status === 'ok' ? 'Ready' : status === 'warning' ? 'Warning' : 'Skip'
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 font-medium ${styles[status] ?? styles.skip}`}
      title={issues.join('. ')}
    >
      {label}
    </span>
  )
}
