import { useMemo, useState } from 'react'
import { CalendarRange, ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react'
import { formatDateRange, planIdForProject } from '../../utils/iterationPlans'

const SCALE_OPTIONS = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
]

export default function IterationsPage({
  iterationPlans,
  timeboxes,
  sprints,
  projects,
  projectIterationPlans,
  onCreatePlan,
  onRenamePlan,
  onDeletePlan,
  onCreateTimebox,
  onDeleteTimebox,
  onUpdateSprint,
}) {
  const [newPlanName, setNewPlanName] = useState('')
  const [editingPlanId, setEditingPlanId] = useState(null)
  const [editPlanName, setEditPlanName] = useState('')
  const [expandedPlanId, setExpandedPlanId] = useState(null)
  const [newTimeboxName, setNewTimeboxName] = useState('')
  const [newTimeboxStart, setNewTimeboxStart] = useState('')
  const [error, setError] = useState('')
  const [editingSprintId, setEditingSprintId] = useState(null)
  const [sprintDraft, setSprintDraft] = useState({
    name: '',
    type: 'DEVELOPMENT',
    scale: 'week',
    startDate: '',
    weekCount: 3,
  })

  const timeboxesByPlan = useMemo(() => {
    const map = new Map()
    for (const plan of iterationPlans) {
      map.set(
        plan.id,
        timeboxes.filter((t) => t.planId === plan.id).sort((a, b) => a.sortOrder - b.sortOrder),
      )
    }
    return map
  }, [iterationPlans, timeboxes])

  const projectsForPlan = (planId) =>
    projects.filter((p) => planIdForProject(projectIterationPlans, p.id) === planId)

  const handleCreatePlan = (e) => {
    e.preventDefault()
    if (!newPlanName.trim()) return
    const plan = onCreatePlan(newPlanName.trim())
    setNewPlanName('')
    setExpandedPlanId(plan.id)
    setError('')
  }

  const handleDeletePlan = (id) => {
    const result = onDeletePlan(id)
    if (result?.ok === false) setError(result.reason)
    else {
      setError('')
      if (expandedPlanId === id) setExpandedPlanId(null)
    }
  }

  const handleCreateTimebox = (e, planId) => {
    e.preventDefault()
    if (!newTimeboxName.trim() || !newTimeboxStart) {
      setError('Name and start date are required.')
      return
    }
    onCreateTimebox(planId, newTimeboxName.trim(), newTimeboxStart)
    setNewTimeboxName('')
    setNewTimeboxStart('')
    setError('')
  }

  const startEditSprint = (sprint) => {
    setEditingSprintId(sprint.id)
    setSprintDraft({
      name: sprint.name,
      type: sprint.type || 'DEVELOPMENT',
      scale: sprint.scale || 'week',
      startDate: sprint.startDate,
      weekCount: sprint.weekCount,
    })
  }

  const saveSprint = (id) => {
    const weekCount = Number(sprintDraft.weekCount)
    if (!sprintDraft.name.trim()) {
      setError('Sprint name is required.')
      return
    }
    if (!sprintDraft.startDate || !Number.isInteger(weekCount) || weekCount < 1) {
      setError('Sprint needs a start date and week count ≥ 1.')
      return
    }
    onUpdateSprint(id, {
      name: sprintDraft.name.trim(),
      type: sprintDraft.type.trim() || 'DEVELOPMENT',
      scale: sprintDraft.scale,
      startDate: sprintDraft.startDate,
      weekCount,
    })
    setEditingSprintId(null)
    setError('')
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white p-6">
      <p className="mb-6 text-sm text-gray-500">
        Reusable iteration plans (SAFe template). Project assignment is configured in Projects.
      </p>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <form onSubmit={handleCreatePlan} className="mb-6 flex gap-2">
        <input
          type="text"
          value={newPlanName}
          onChange={(e) => setNewPlanName(e.target.value)}
          placeholder="New plan name (e.g. CARB ART 2026)"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
        <button
          type="submit"
          className="flex items-center gap-1 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
        >
          <Plus size={16} />
          Create plan
        </button>
      </form>

      <ul className="space-y-3">
        {iterationPlans.map((plan) => {
          const expanded = expandedPlanId === plan.id
          const planTimeboxes = timeboxesByPlan.get(plan.id) ?? []
          const assignedProjects = projectsForPlan(plan.id)

          return (
            <li key={plan.id} className="rounded-lg border border-gray-200 bg-white">
              <div className="flex items-center gap-2 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setExpandedPlanId(expanded ? null : plan.id)}
                  className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                >
                  {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                <CalendarRange size={18} className="shrink-0 text-violet-500" />
                {editingPlanId === plan.id ? (
                  <input
                    type="text"
                    value={editPlanName}
                    onChange={(e) => setEditPlanName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onRenamePlan(plan.id, editPlanName)
                        setEditingPlanId(null)
                      }
                    }}
                    className="min-w-0 flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
                    autoFocus
                  />
                ) : (
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900">{plan.name}</div>
                    <div className="text-xs text-gray-400">
                      {plan.methodology?.toUpperCase()} · {planTimeboxes.length} iteration
                      {planTimeboxes.length !== 1 ? 's' : ''}
                      {assignedProjects.length > 0 &&
                        ` · Used by: ${assignedProjects.map((p) => p.name).join(', ')}`}
                      {!assignedProjects.length && ' · Not assigned to any project'}
                    </div>
                  </div>
                )}
                <div className="flex shrink-0 items-center gap-1">
                  {editingPlanId === plan.id ? (
                    <button
                      type="button"
                      onClick={() => {
                        onRenamePlan(plan.id, editPlanName)
                        setEditingPlanId(null)
                      }}
                      className="rounded px-2 py-1 text-xs text-violet-600 hover:bg-violet-100"
                    >
                      Save
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPlanId(plan.id)
                        setEditPlanName(plan.name)
                      }}
                      className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeletePlan(plan.id)}
                    className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {expanded && (
                <div className="border-t border-gray-100 px-4 py-4">
                  <form
                    onSubmit={(e) => handleCreateTimebox(e, plan.id)}
                    className="mb-4 flex flex-wrap items-end gap-2 rounded-lg border border-gray-100 bg-gray-50 p-3"
                  >
                    <div className="min-w-[140px] flex-1">
                      <label className="mb-1 block text-[10px] font-medium uppercase text-gray-500">
                        Name
                      </label>
                      <input
                        type="text"
                        value={newTimeboxName}
                        onChange={(e) => setNewTimeboxName(e.target.value)}
                        placeholder="PI 26.5"
                        className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-violet-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-medium uppercase text-gray-500">
                        Start date
                      </label>
                      <input
                        type="date"
                        value={newTimeboxStart}
                        onChange={(e) => setNewTimeboxStart(e.target.value)}
                        className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-violet-500 focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700"
                    >
                      Create iteration
                    </button>
                  </form>

                  <ul className="space-y-3">
                    {planTimeboxes.map((tb) => {
                      const tbSprints = sprints
                        .filter((s) => s.timeboxId === tb.id)
                        .sort((a, b) => a.number - b.number)
                      return (
                        <li key={tb.id} className="rounded-lg border border-gray-200 p-3">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{tb.name}</div>
                              <div className="text-xs text-gray-400">
                                {formatDateRange(tb.startDate, tb.endDate)}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => onDeleteTimebox(tb.id)}
                              className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                              title="Delete iteration"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <ul className="space-y-1">
                            {tbSprints.map((sprint) => (
                              <li
                                key={sprint.id}
                                className="rounded bg-gray-50 px-2 py-1.5 text-xs"
                              >
                                {editingSprintId === sprint.id ? (
                                  <div className="flex flex-wrap items-center gap-2">
                                    <input
                                      type="text"
                                      value={sprintDraft.name}
                                      onChange={(e) =>
                                        setSprintDraft((d) => ({ ...d, name: e.target.value }))
                                      }
                                      className="w-28 rounded border border-gray-300 px-1.5 py-0.5"
                                      placeholder="Name"
                                    />
                                    <input
                                      type="text"
                                      value={sprintDraft.type}
                                      onChange={(e) =>
                                        setSprintDraft((d) => ({ ...d, type: e.target.value }))
                                      }
                                      className="w-28 rounded border border-gray-300 px-1.5 py-0.5"
                                      placeholder="Type"
                                      list={`sprint-type-${sprint.id}`}
                                    />
                                    <datalist id={`sprint-type-${sprint.id}`}>
                                      <option value="DEVELOPMENT" />
                                      <option value="INNOVATION" />
                                    </datalist>
                                    <select
                                      value={sprintDraft.scale}
                                      onChange={(e) =>
                                        setSprintDraft((d) => ({ ...d, scale: e.target.value }))
                                      }
                                      className="rounded border border-gray-300 px-1.5 py-0.5"
                                      title="Timeline leaf scale"
                                    >
                                      {SCALE_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                          {opt.label}
                                        </option>
                                      ))}
                                    </select>
                                    <input
                                      type="date"
                                      value={sprintDraft.startDate}
                                      onChange={(e) =>
                                        setSprintDraft((d) => ({ ...d, startDate: e.target.value }))
                                      }
                                      className="rounded border border-gray-300 px-1.5 py-0.5"
                                    />
                                    <input
                                      type="number"
                                      min={1}
                                      max={8}
                                      value={sprintDraft.weekCount}
                                      onChange={(e) =>
                                        setSprintDraft((d) => ({
                                          ...d,
                                          weekCount: Number(e.target.value),
                                        }))
                                      }
                                      className="w-14 rounded border border-gray-300 px-1.5 py-0.5"
                                    />
                                    <span className="text-gray-400">weeks</span>
                                    <button
                                      type="button"
                                      onClick={() => saveSprint(sprint.id)}
                                      className="text-violet-600 hover:underline"
                                    >
                                      Save
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingSprintId(null)}
                                      className="text-gray-400 hover:underline"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="w-20 font-medium text-gray-700">{sprint.name}</span>
                                    <span className="rounded bg-white px-1.5 py-0.5 text-[10px] uppercase text-gray-500">
                                      {sprint.type}
                                    </span>
                                    <span className="rounded bg-white px-1.5 py-0.5 text-[10px] text-gray-500">
                                      {sprint.scale || 'week'}
                                    </span>
                                    <span className="text-gray-500">
                                      {formatDateRange(sprint.startDate, sprint.endDate)} ·{' '}
                                      {sprint.weekCount}w
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => startEditSprint(sprint)}
                                      className="ml-auto text-gray-400 hover:text-gray-700"
                                    >
                                      <Pencil size={12} />
                                    </button>
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>
                        </li>
                      )
                    })}
                    {!planTimeboxes.length && (
                      <p className="text-xs text-gray-400">
                        No iterations yet. Create one with a start date to generate the SAFe sprint
                        template.
                      </p>
                    )}
                  </ul>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
