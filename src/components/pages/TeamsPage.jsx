import { useState } from 'react'
import { Pencil, Plus, Trash2, Users } from 'lucide-react'

export default function TeamsPage({
  teams,
  projects,
  projectId,
  projectTeams,
  features,
  onCreate,
  onRename,
  onDelete,
  onAssign,
  onUnassign,
}) {
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [error, setError] = useState('')

  const assignedIds = new Set(
    projectTeams.filter((pt) => pt.projectId === projectId).map((pt) => pt.teamId),
  )

  const featureCount = (teamId) => features.filter((f) => f.teamId === teamId).length

  const handleCreate = (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    onCreate(newName.trim())
    setNewName('')
  }

  const handleDelete = (id) => {
    const result = onDelete(id)
    if (result?.ok === false) setError(result.reason)
    else setError('')
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white p-6">
      <p className="mb-6 text-sm text-gray-500">
        Global team registry. Assign teams to the active project.
      </p>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <form onSubmit={handleCreate} className="mb-6 flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New team name"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
        <button
          type="submit"
          className="flex items-center gap-1 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
        >
          <Plus size={16} />
          Create
        </button>
      </form>

      <ul className="space-y-2">
        {teams.map((team) => {
          const assigned = assignedIds.has(team.id)
          return (
            <li
              key={team.id}
              className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3"
            >
              <Users size={18} className="shrink-0 text-gray-400" />
              {editingId === team.id ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onRename(team.id, editName)
                      setEditingId(null)
                    }
                  }}
                  className="min-w-0 flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
                  autoFocus
                />
              ) : (
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-gray-900">{team.name}</div>
                  <div className="text-xs text-gray-400">
                    {featureCount(team.id)} feature{featureCount(team.id) !== 1 ? 's' : ''} total
                  </div>
                </div>
              )}
              <div className="flex shrink-0 items-center gap-2">
                {assigned ? (
                  <button
                    type="button"
                    onClick={() => onUnassign(team.id)}
                    className="rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                  >
                    Unassign
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onAssign(team.id)}
                    className="rounded-lg bg-violet-100 px-2 py-1 text-xs font-medium text-violet-700 hover:bg-violet-200"
                  >
                    Assign to project
                  </button>
                )}
                {editingId === team.id ? (
                  <button
                    type="button"
                    onClick={() => {
                      onRename(team.id, editName)
                      setEditingId(null)
                    }}
                    className="text-xs text-violet-600"
                  >
                    Save
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(team.id)
                      setEditName(team.name)
                    }}
                    className="rounded p-1.5 text-gray-400 hover:bg-gray-100"
                  >
                    <Pencil size={14} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(team.id)}
                  className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      {projects.length > 1 && (
        <p className="mt-4 text-xs text-gray-400">
          Assignments apply to the active project selected in the sidebar.
        </p>
      )}
    </div>
  )
}
