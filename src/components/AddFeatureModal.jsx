import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

const BACKLOG_VALUE = '__backlog__'

export default function AddFeatureModal({
  open,
  onClose,
  onSave,
  teams,
  products,
  defaultDates,
  canPlanOnGantt = true,
}) {
  const [name, setName] = useState('')
  const [teamId, setTeamId] = useState(BACKLOG_VALUE)
  const [productId, setProductId] = useState(products[0]?.id ?? '')
  const [startDate, setStartDate] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [error, setError] = useState('')

  const isBacklog = teamId === BACKLOG_VALUE

  useEffect(() => {
    if (!open) return
    setName('')
    const defaultTeam = canPlanOnGantt && teams[0]?.id ? teams[0].id : BACKLOG_VALUE
    setTeamId(defaultTeam)
    setProductId(products[0]?.id ?? '')
    if (defaultTeam === BACKLOG_VALUE) {
      setStartDate('')
      setTargetDate('')
    } else {
      setStartDate(defaultDates.startDate)
      setTargetDate(defaultDates.targetDate)
    }
    setError('')
  }, [open, products, teams, canPlanOnGantt, defaultDates.startDate, defaultDates.targetDate])

  const handleTeamChange = (value) => {
    setTeamId(value)
    if (value === BACKLOG_VALUE) {
      setStartDate('')
      setTargetDate('')
    } else {
      setStartDate(defaultDates.startDate)
      setTargetDate(defaultDates.targetDate)
    }
  }

  if (!open) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Name is required.')
      return
    }
    if (!productId) {
      setError('Please select a product.')
      return
    }

    if (!isBacklog) {
      if (!startDate || !targetDate) {
        setError('Start and target dates are required for planned features.')
        return
      }
      if (targetDate < startDate) {
        setError('Target date must be on or after the start date.')
        return
      }
    } else if (startDate && targetDate && targetDate < startDate) {
      setError('Target date must be on or after the start date.')
      return
    }

    onSave({
      name: name.trim(),
      teamId: isBacklog ? null : teamId,
      productId,
      startDate: startDate || null,
      targetDate: targetDate || null,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Add Feature</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              placeholder="Descriptive name"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Team</label>
              <select
                value={teamId}
                onChange={(e) => handleTeamChange(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                <option value={BACKLOG_VALUE}>Unassigned (backlog)</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Product *</label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Start date{isBacklog ? '' : ' *'}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Target date{isBacklog ? '' : ' *'}
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
          </div>

          {!canPlanOnGantt && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Assign a calendar, product, and team to this project to place features on the Gantt.
              You can still add backlog items here.
            </p>
          )}

          {isBacklog && (
            <p className="text-xs text-gray-500">
              Backlog features appear in the feature panel only until a team is assigned.
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
