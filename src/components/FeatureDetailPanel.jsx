import { useEffect, useState } from 'react'
import { AlertTriangle, Check, Clock, Plus, Trash2, X } from 'lucide-react'
import { formatDay } from '../utils/dates'

const EVENT_LABELS = {
  'feature.created': 'Feature created',
  'feature.moved': 'Feature moved',
  'feature.dates_changed': 'Dates updated',
  'feature.completed': 'Delivery status',
  'feature.renamed': 'Name updated',
  'feature.team_changed': 'Team changed',
}

export default function FeatureDetailPanel({
  feature,
  history,
  teamsForProject,
  allTeams,
  onClose,
  onUpdate,
  onDelete,
  onAddUserStory,
  onRemoveUserStory,
}) {
  const [usTitle, setUsTitle] = useState('')
  const [usPoints, setUsPoints] = useState('')
  const [name, setName] = useState(feature?.name ?? '')

  useEffect(() => {
    setName(feature?.name ?? '')
  }, [feature?.id, feature?.name])

  if (!feature) return null

  const needsAlert = feature.assignmentStatus === 'team_unassigned'
  const teamOptions = (() => {
    const options = [...teamsForProject]
    if (feature.teamId && !options.some((t) => t.id === feature.teamId)) {
      const current = allTeams?.find((t) => t.id === feature.teamId)
      if (current) options.push(current)
    }
    return options
  })()

  const handleNameBlur = () => {
    const trimmed = name.trim()
    if (trimmed && trimmed !== feature.name) {
      onUpdate(feature.id, { name: trimmed })
    } else {
      setName(feature.name)
    }
  }

  const handleAddUs = (e) => {
    e.preventDefault()
    const points = parseInt(usPoints, 10)
    if (!usTitle.trim() || Number.isNaN(points) || points < 0) return
    onAddUserStory(feature.id, usTitle.trim(), points)
    setUsTitle('')
    setUsPoints('')
  }

  return (
    <div className="flex w-96 shrink-0 flex-col border-l border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="min-w-0 flex-1 pr-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleNameBlur}
            className="w-full rounded border border-transparent bg-transparent text-sm font-semibold text-gray-900 focus:border-violet-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
          <p className="text-xs text-gray-400">{feature.id} · {feature.productName}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg p-1 text-gray-400 hover:bg-gray-100"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {needsAlert && (
          <div className="mb-4 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <span>Team no longer assigned to this project. Select a valid team below.</span>
          </div>
        )}

        <section className="mb-6">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Assignment</h3>
          <label className="mb-1 block text-xs text-gray-500">Team</label>
          <select
            value={feature.teamId}
            onChange={(e) => onUpdate(feature.id, { teamId: e.target.value })}
            className={`w-full rounded-lg border px-3 py-1.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 ${
              needsAlert ? 'border-amber-400 bg-amber-50' : 'border-gray-300'
            }`}
          >
            {teamOptions.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </section>

        <section className="mb-6">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Dates</h3>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-gray-500">Start</label>
              <input
                type="date"
                value={feature.startDate}
                onChange={(e) => onUpdate(feature.id, { startDate: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
              <p className="mt-0.5 text-[11px] text-gray-400">{formatDay(feature.startDate)}</p>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Target</label>
              <input
                type="date"
                value={feature.targetDate}
                onChange={(e) => onUpdate(feature.id, { targetDate: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
              <p className="mt-0.5 text-[11px] text-gray-400">{formatDay(feature.targetDate)}</p>
            </div>
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={feature.completed}
              onChange={(e) => onUpdate(feature.id, { completed: e.target.checked })}
              className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
            />
            <Check size={14} className="text-emerald-500" />
            Delivered
          </label>

          {feature.crossPi && (
            <p className="mt-2 rounded bg-amber-50 px-2 py-1 text-xs text-amber-700">
              Cross-PI feature — spans more than one Program Increment
            </p>
          )}
        </section>

        <section className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              User Stories ({feature.storyPoints} SP)
            </h3>
          </div>

          <ul className="mb-3 space-y-2">
            {(feature.userStories || []).map((us) => (
              <li
                key={us.id}
                className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm"
              >
                <span className="min-w-0 truncate text-gray-800">{us.title}</span>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs font-medium text-gray-500">{us.storyPoints} SP</span>
                  <button
                    type="button"
                    onClick={() => onRemoveUserStory(feature.id, us.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
            {(feature.userStories || []).length === 0 && (
              <p className="text-xs text-gray-400">No user stories</p>
            )}
          </ul>

          <form onSubmit={handleAddUs} className="space-y-2">
            <input
              type="text"
              value={usTitle}
              onChange={(e) => setUsTitle(e.target.value)}
              placeholder="User story title"
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                value={usPoints}
                onChange={(e) => setUsPoints(e.target.value)}
                placeholder="SP"
                className="w-20 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
              <button
                type="submit"
                className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Plus size={14} />
                Add US
              </button>
            </div>
          </form>
        </section>

        <section>
          <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <Clock size={12} />
            History
          </h3>
          <ul className="space-y-2">
            {history.map((event) => (
              <li key={event.id} className="rounded-lg border border-gray-100 px-3 py-2 text-xs">
                <div className="font-medium text-gray-800">
                  {EVENT_LABELS[event.eventType] ?? event.eventType}
                </div>
                <div className="text-gray-400">
                  {event.actor} · {new Date(event.createdAt).toLocaleString('en')}
                </div>
              </li>
            ))}
            {history.length === 0 && (
              <p className="text-xs text-gray-400">No events recorded</p>
            )}
          </ul>
        </section>
      </div>

      <div className="border-t border-gray-200 p-4">
        <button
          type="button"
          onClick={() => onDelete(feature.id)}
          className="w-full rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
        >
          Delete feature
        </button>
      </div>
    </div>
  )
}
