import { useState } from 'react'
import { AlertTriangle, Pencil, Plus, Trash2 } from 'lucide-react'
import ColorPicker from '../ColorPicker'

function ProjectCheckboxList({ projects, selectedIds, onChange }) {
  const toggle = (projectId) => {
    if (selectedIds.includes(projectId)) {
      onChange(selectedIds.filter((id) => id !== projectId))
    } else {
      onChange([...selectedIds, projectId])
    }
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {projects.map((project) => (
        <li key={project.id}>
          <label className="flex cursor-pointer items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs hover:bg-gray-50">
            <input
              type="checkbox"
              checked={selectedIds.includes(project.id)}
              onChange={() => toggle(project.id)}
              className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
            />
            {project.name}
          </label>
        </li>
      ))}
    </ul>
  )
}

export default function ProductsPage({
  products,
  projects,
  projectProducts,
  projectId,
  orphanedProducts,
  features,
  onCreate,
  onUpdate,
  onDelete,
  onSetProductProjects,
}) {
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#3B82F6')
  const [newProjectIds, setNewProjectIds] = useState([projectId])
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('#3B82F6')
  const [editProjectIds, setEditProjectIds] = useState([])
  const [error, setError] = useState('')

  const featureCount = (id) => features.filter((f) => f.productId === id).length

  const projectIdsForProduct = (productId) =>
    projectProducts.filter((pp) => pp.productId === productId).map((pp) => pp.projectId)

  const projectNamesForProduct = (productId) => {
    const ids = projectIdsForProduct(productId)
    return projects.filter((p) => ids.includes(p.id)).map((p) => p.name)
  }

  const handleCreate = (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    onCreate(newName.trim(), newColor, newProjectIds)
    setNewName('')
    setNewColor('#3B82F6')
    setNewProjectIds([projectId])
  }

  const handleDelete = (id) => {
    const result = onDelete(id)
    if (result?.ok === false) setError(result.reason)
    else setError('')
  }

  const renderProduct = (product, orphaned = false) => (
    <li
      key={product.id}
      className={`flex flex-col gap-3 rounded-lg border px-4 py-3 ${
        orphaned ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span
          className="h-4 w-4 shrink-0 rounded-full border border-gray-200"
          style={{ backgroundColor: product.color }}
        />
        {orphaned && (
          <AlertTriangle size={14} className="shrink-0 text-amber-600" title="No project assigned" />
        )}
        {editingId === product.id ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="min-w-0 flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
            autoFocus
          />
        ) : (
          <div className="min-w-0 flex-1">
            <div className="font-medium text-gray-900">{product.name}</div>
            <div className="text-xs text-gray-400">
              {featureCount(product.id)} feature{featureCount(product.id) !== 1 ? 's' : ''}
            </div>
            {projectNamesForProduct(product.id).length > 0 ? (
              <div className="mt-1 flex flex-wrap gap-1">
                {projectNamesForProduct(product.id).map((name) => (
                  <span
                    key={name}
                    className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600"
                  >
                    {name}
                  </span>
                ))}
              </div>
            ) : (
              <span className="mt-1 text-[10px] text-amber-700">No project assigned</span>
            )}
          </div>
        )}
      </div>

      {editingId === product.id && (
        <>
          <ColorPicker value={editColor} onChange={setEditColor} />
          <div>
            <p className="mb-1 text-xs font-medium text-gray-600">Projects</p>
            <ProjectCheckboxList
              projects={projects}
              selectedIds={editProjectIds}
              onChange={setEditProjectIds}
            />
          </div>
        </>
      )}

      <div className="flex shrink-0 items-center gap-1">
        {editingId === product.id ? (
          <button
            type="button"
            onClick={() => {
              onUpdate(product.id, { name: editName, color: editColor })
              onSetProductProjects(product.id, editProjectIds)
              setEditingId(null)
            }}
            className="rounded px-2 py-1 text-xs text-violet-600 hover:bg-violet-100"
          >
            Save
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setEditingId(product.id)
              setEditName(product.name)
              setEditColor(product.color)
              setEditProjectIds(projectIdsForProduct(product.id))
            }}
            className="rounded p-1.5 text-gray-400 hover:bg-gray-100"
          >
            <Pencil size={14} />
          </button>
        )}
        <button
          type="button"
          onClick={() => handleDelete(product.id)}
          className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </li>
  )

  return (
    <div className="flex-1 overflow-y-auto bg-white p-6">
      <h1 className="mb-1 text-xl font-semibold text-gray-900">Products</h1>
      <p className="mb-6 text-sm text-gray-500">
        Global product catalog. Assign products to one or more projects.
      </p>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <form onSubmit={handleCreate} className="mb-6 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New product name"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
        <ColorPicker value={newColor} onChange={setNewColor} />
        <div>
          <p className="mb-1 text-xs font-medium text-gray-600">Assign to projects</p>
          <ProjectCheckboxList
            projects={projects}
            selectedIds={newProjectIds}
            onChange={setNewProjectIds}
          />
        </div>
        <button
          type="submit"
          className="flex items-center gap-1 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
        >
          <Plus size={16} />
          Create product
        </button>
      </form>

      <ul className="space-y-2">
        {products.map((p) => renderProduct(p, orphanedProducts.some((o) => o.id === p.id)))}
        {products.length === 0 && (
          <p className="text-sm text-gray-400">No products yet.</p>
        )}
      </ul>
    </div>
  )
}
