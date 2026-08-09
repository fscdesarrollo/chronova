import { useState } from 'react'
import { FolderOpen, Pencil, Plus, Trash2 } from 'lucide-react'

function TeamCheckboxList({ teams, selectedIds, onChange }) {
  const toggle = (teamId) => {
    if (selectedIds.includes(teamId)) {
      onChange(selectedIds.filter((id) => id !== teamId))
    } else {
      onChange([...selectedIds, teamId])
    }
  }

  if (!teams.length) {
    return <p className="text-xs text-gray-400">No teams available. Create teams first.</p>
  }

  return (
    <ul className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-gray-200 bg-white p-2">
      {teams.map((team) => (
        <li key={team.id}>
          <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-gray-50">
            <input
              type="checkbox"
              checked={selectedIds.includes(team.id)}
              onChange={() => toggle(team.id)}
              className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
            />
            {team.name}
          </label>
        </li>
      ))}
    </ul>
  )
}

export default function ProjectsPage({
  projects,
  teams,
  projectTeams,
  iterationPlans = [],
  projectIterationPlans = [],
  features,
  projectId,
  onSelectProject,
  onCreate,
  onRename,
  onDelete,
  onSetProjectTeams,
  onSetProjectIterationPlan,
}) {
  const [newName, setNewName] = useState('')
  const [newTeamIds, setNewTeamIds] = useState([])
  const [newPlanId, setNewPlanId] = useState(iterationPlans[0]?.id ?? '')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editTeamIds, setEditTeamIds] = useState([])
  const [editPlanId, setEditPlanId] = useState('')
  const [error, setError] = useState('')

  const featureCount = (id) => features.filter((f) => f.projectId === id).length

  const teamIdsForProject = (id) =>
    projectTeams.filter((pt) => pt.projectId === id).map((pt) => pt.teamId)

  const teamNamesForProject = (id) => {
    const ids = teamIdsForProject(id)
    return teams.filter((t) => ids.includes(t.id)).map((t) => t.name)
  }

  const planIdFor = (id) =>
    projectIterationPlans.find((pip) => pip.projectId === id)?.planId ?? ''

  const planNameFor = (id) => {
    const planId = planIdFor(id)
    return iterationPlans.find((p) => p.id === planId)?.name ?? 'No plan'
  }

  const handleCreate = (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    onCreate(newName.trim(), newTeamIds, newPlanId || null)
    setNewName('')
    setNewTeamIds([])
    setNewPlanId(iterationPlans[0]?.id ?? '')
    setError('')
  }

  const handleRename = (id) => {
    if (!editName.trim()) return
    onRename(id, editName.trim())
    onSetProjectTeams(id, editTeamIds)
    onSetProjectIterationPlan?.(id, editPlanId || null)
    setEditingId(null)
  }

  const handleDelete = (id) => {
    const result = onDelete(id)
    if (result?.ok === false) {
      setError(result.reason)
    } else {
      setError('')
    }
  }

  const startEdit = (project) => {
    setEditingId(project.id)
    setEditName(project.name)
    setEditTeamIds(teamIdsForProject(project.id))
    setEditPlanId(planIdFor(project.id))
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white p-6">
      <p className="mb-6 text-sm text-gray-500">
        Create projects and assign teams and an iteration plan.
      </p>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <form onSubmit={handleCreate} className="mb-6 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New project name"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
        <div>
          <p className="mb-1 text-xs font-medium text-gray-600">Assign teams (optional)</p>
          <TeamCheckboxList teams={teams} selectedIds={newTeamIds} onChange={setNewTeamIds} />
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-gray-600">Iteration plan</p>
          <select
            value={newPlanId}
            onChange={(e) => setNewPlanId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          >
            <option value="">No plan</option>
            {iterationPlans.map((plan) => (
              <option key={plan.id} value={plan.id}>{plan.name}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="flex items-center gap-1 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
        >
          <Plus size={16} />
          Create project
        </button>
      </form>

      <ul className="space-y-2">
        {projects.map((project) => (
          <li
            key={project.id}
            className={`rounded-lg border px-4 py-3 ${
              project.id === projectId ? 'border-violet-300 bg-violet-50' : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <FolderOpen size={18} className="shrink-0 text-violet-500" />
              {editingId === project.id ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRename(project.id)}
                  className="min-w-0 flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
                  autoFocus
                />
              ) : (
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-gray-900">{project.name}</div>
                  <div className="text-xs text-gray-400">
                    {featureCount(project.id)} feature{featureCount(project.id) !== 1 ? 's' : ''}
                    {' · '}
                    {planNameFor(project.id)}
                    {project.id === projectId && ' · Active'}
                  </div>
                  {teamNamesForProject(project.id).length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {teamNamesForProject(project.id).map((name) => (
                        <span
                          key={name}
                          className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="flex shrink-0 items-center gap-1">
                {project.id !== projectId && editingId !== project.id && (
                  <button
                    type="button"
                    onClick={() => onSelectProject(project.id)}
                    className="rounded px-2 py-1 text-xs text-violet-600 hover:bg-violet-100"
                  >
                    Select
                  </button>
                )}
                {editingId === project.id ? (
                  <button
                    type="button"
                    onClick={() => handleRename(project.id)}
                    className="rounded px-2 py-1 text-xs text-violet-600 hover:bg-violet-100"
                  >
                    Save
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => startEdit(project)}
                    className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <Pencil size={14} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(project.id)}
                  className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            {editingId === project.id && (
              <div className="mt-3 space-y-3 border-t border-gray-200 pt-3">
                <div>
                  <p className="mb-1 text-xs font-medium text-gray-600">Teams in this project</p>
                  <TeamCheckboxList teams={teams} selectedIds={editTeamIds} onChange={setEditTeamIds} />
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-gray-600">Iteration plan</p>
                  <select
                    value={editPlanId}
                    onChange={(e) => setEditPlanId(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  >
                    <option value="">No plan</option>
                    {iterationPlans.map((plan) => (
                      <option key={plan.id} value={plan.id}>{plan.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
