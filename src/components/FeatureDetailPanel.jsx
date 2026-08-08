import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Check, Clock, Link2, Pencil, Plus, Trash2, X } from 'lucide-react'
import { formatDay } from '../utils/dates'
import {
  featuresForDependencyPicker,
  getDependencyDateConflicts,
  hasDependencyCycle,
  normalizeDependsOn,
  wouldCreateDependencyCycle,
} from '../utils/dependencies'
import UnsavedChangesDialog from './UnsavedChangesDialog'

const BACKLOG_VALUE = '__backlog__'

const EVENT_LABELS = {
  'feature.created': 'Feature created',
  'feature.moved': 'Feature moved',
  'feature.dates_changed': 'Dates updated',
  'feature.completed': 'Delivery status',
  'feature.renamed': 'Name updated',
  'feature.team_changed': 'Team changed',
  'feature.team_assigned': 'Team assigned',
  'feature.comment_added': 'Comment added',
  'feature.comment_edited': 'Comment edited',
  'feature.comment_deleted': 'Comment deleted',
  'feature.dependency_added': 'Dependency added',
  'feature.dependency_removed': 'Dependency removed',
}

function draftFromFeature(feature) {
  if (!feature) {
    return {
      name: '',
      teamId: null,
      startDate: '',
      targetDate: '',
      completed: false,
      notes: '',
      dependsOn: [],
    }
  }
  return {
    name: feature.name ?? '',
    teamId: feature.planningStatus === 'backlog' ? null : feature.teamId,
    startDate: feature.startDate ?? '',
    targetDate: feature.targetDate ?? '',
    completed: !!feature.completed,
    notes: feature.notes ?? '',
    dependsOn: normalizeDependsOn(feature.dependsOn),
  }
}

function draftsEqual(a, b) {
  return (
    a.name === b.name &&
    a.teamId === b.teamId &&
    a.startDate === b.startDate &&
    a.targetDate === b.targetDate &&
    a.completed === b.completed &&
    a.notes === b.notes &&
    a.dependsOn.length === b.dependsOn.length &&
    a.dependsOn.every((id, i) => id === b.dependsOn[i])
  )
}

function validateDraft(draft) {
  const errors = []
  if (!draft.name.trim()) {
    errors.push('Name is required.')
  }
  if (draft.teamId) {
    if (!draft.startDate) errors.push('Start date is required when a team is assigned.')
    if (!draft.targetDate) errors.push('Target date is required when a team is assigned.')
  }
  if (draft.startDate && draft.targetDate && draft.targetDate < draft.startDate) {
    errors.push('Target date must be on or after the start date.')
  }
  return errors
}

function buildUpdatePayload(draft) {
  const isBacklog = !draft.teamId
  return {
    name: draft.name.trim(),
    teamId: isBacklog ? null : draft.teamId,
    ...(isBacklog ? { planningStatus: 'backlog', assignmentStatus: 'ok' } : {}),
    startDate: draft.startDate || null,
    targetDate: draft.targetDate || null,
    completed: draft.completed,
    notes: draft.notes.slice(0, 500),
    dependsOn: draft.dependsOn,
  }
}

const FeatureDetailPanel = forwardRef(function FeatureDetailPanel(
  {
    feature,
    history,
    teamsForProject,
    allTeams,
    allFeatures,
    actor,
    onClose,
    onUpdate,
    onDelete,
    onAddUserStory,
    onRemoveUserStory,
    onAddComment,
    onUpdateComment,
    onDeleteComment,
    onEditPreviewChange,
  },
  ref,
) {
  const [draft, setDraft] = useState(() => draftFromFeature(feature))
  const [savedSnapshot, setSavedSnapshot] = useState(() => draftFromFeature(feature))
  const [saveErrors, setSaveErrors] = useState([])
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const pendingActionRef = useRef(null)

  const [usTitle, setUsTitle] = useState('')
  const [usPoints, setUsPoints] = useState('')
  const [commentText, setCommentText] = useState('')
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editingCommentText, setEditingCommentText] = useState('')

  const isDirty = useMemo(() => !draftsEqual(draft, savedSnapshot), [draft, savedSnapshot])

  useEffect(() => {
    const next = draftFromFeature(feature)
    setDraft(next)
    setSavedSnapshot(next)
    setSaveErrors([])
    setEditingCommentId(null)
    setCommentText('')
  }, [feature?.id])

  useEffect(() => {
    if (!isDirty && feature) {
      const next = draftFromFeature(feature)
      setDraft(next)
      setSavedSnapshot(next)
    }
  }, [feature, isDirty])

  useEffect(() => {
    if (!feature?.id) {
      onEditPreviewChange?.(null)
      return
    }
    onEditPreviewChange?.({
      featureId: feature.id,
      teamId: draft.teamId,
      startDate: draft.startDate || null,
      targetDate: draft.targetDate || null,
    })
  }, [draft.teamId, draft.startDate, draft.targetDate, feature?.id, onEditPreviewChange])

  useEffect(() => {
    return () => onEditPreviewChange?.(null)
  }, [onEditPreviewChange])

  const saveDraft = useCallback(() => {
    const errors = validateDraft(draft)
    if (errors.length) {
      setSaveErrors(errors)
      return false
    }
    if (hasDependencyCycle(feature.id, draft.dependsOn, allFeatures ?? [])) {
      setSaveErrors(['Dependency cycle detected. Remove circular dependencies before saving.'])
      return false
    }
    onUpdate(feature.id, buildUpdatePayload(draft))
    setSavedSnapshot({ ...draft })
    setSaveErrors([])
    return true
  }, [draft, feature, allFeatures, onUpdate])

  const requestLeave = useCallback(
    (action) => {
      if (!isDirty) {
        action()
        return
      }
      pendingActionRef.current = action
      setShowUnsavedDialog(true)
    },
    [isDirty],
  )

  useImperativeHandle(
    ref,
    () => ({
      requestLeave,
      isDirty: () => isDirty,
    }),
    [requestLeave, isDirty],
  )

  const handleDialogSave = () => {
    if (!saveDraft()) return
    setShowUnsavedDialog(false)
    const action = pendingActionRef.current
    pendingActionRef.current = null
    action?.()
  }

  const handleDialogDiscard = () => {
    setDraft({ ...savedSnapshot })
    setSaveErrors([])
    setShowUnsavedDialog(false)
    const action = pendingActionRef.current
    pendingActionRef.current = null
    action?.()
  }

  const handleDialogCancel = () => {
    setShowUnsavedDialog(false)
    pendingActionRef.current = null
  }

  if (!feature) return null

  const isBacklogDraft = !draft.teamId
  const needsAlert = feature.assignmentStatus === 'team_unassigned'
  const teamSelectValue = draft.teamId ?? BACKLOG_VALUE
  const draftMissingDates = Boolean(draft.teamId && (!draft.startDate || !draft.targetDate))

  const teamOptions = (() => {
    const options = [...teamsForProject]
    if (draft.teamId && !options.some((t) => t.id === draft.teamId)) {
      const current = allTeams?.find((t) => t.id === draft.teamId)
      if (current) options.push(current)
    }
    return options
  })()

  const draftFeature = {
    ...feature,
    startDate: draft.startDate || null,
    targetDate: draft.targetDate || null,
    dependsOn: draft.dependsOn,
  }

  const depPickerFeatures = featuresForDependencyPicker(feature.projectId, feature.id, allFeatures ?? [])
  const depConflicts = getDependencyDateConflicts(draftFeature, allFeatures ?? [])
  const predecessors = draft.dependsOn
    .map((depId) => (allFeatures ?? []).find((f) => f.id === depId))
    .filter(Boolean)
  const successors = (allFeatures ?? []).filter((f) => normalizeDependsOn(f.dependsOn).includes(feature.id))

  const handleAddUs = (e) => {
    e.preventDefault()
    const points = parseInt(usPoints, 10)
    if (!usTitle.trim() || Number.isNaN(points) || points < 0) return
    onAddUserStory(feature.id, usTitle.trim(), points)
    setUsTitle('')
    setUsPoints('')
  }

  const handleAddComment = (e) => {
    e.preventDefault()
    if (!commentText.trim()) return
    onAddComment(feature.id, commentText)
    setCommentText('')
  }

  const toggleDependency = (depId) => {
    setDraft((prev) => {
      const current = [...prev.dependsOn]
      if (current.includes(depId)) {
        return { ...prev, dependsOn: current.filter((id) => id !== depId) }
      }
      if (wouldCreateDependencyCycle(feature.id, [...current, depId], allFeatures ?? [])) {
        return prev
      }
      return { ...prev, dependsOn: [...current, depId] }
    })
    setSaveErrors([])
  }

  return (
    <>
      <div className="flex w-96 shrink-0 flex-col border-l border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <div className="min-w-0 flex-1 pr-2">
            <input
              type="text"
              value={draft.name}
              onChange={(e) => {
                setDraft((prev) => ({ ...prev, name: e.target.value }))
                setSaveErrors([])
              }}
              className="w-full rounded border border-transparent bg-transparent text-sm font-semibold text-gray-900 focus:border-violet-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
            <p className="text-xs text-gray-400">
              {feature.id} · {feature.productName}
              {isDirty && <span className="ml-2 text-amber-600">· Unsaved changes</span>}
            </p>
          </div>
          <button
            type="button"
            onClick={() => requestLeave(onClose)}
            className="shrink-0 rounded-lg p-1 text-gray-400 hover:bg-gray-100"
            aria-label="Close detail panel"
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

          {isBacklogDraft && (
            <div className="mb-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
              This feature is in the backlog. Assign a team and set dates to show it on the Gantt.
            </div>
          )}

          <section className="mb-6">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Assignment</h3>
            <label className="mb-1 block text-xs text-gray-500">Team</label>
            <select
              value={teamSelectValue}
              onChange={(e) => {
                const value = e.target.value
                setDraft((prev) => ({
                  ...prev,
                  teamId: value === BACKLOG_VALUE ? null : value,
                }))
                setSaveErrors([])
              }}
              className={`w-full rounded-lg border px-3 py-1.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 ${
                needsAlert ? 'border-amber-400 bg-amber-50' : 'border-gray-300'
              }`}
            >
              <option value={BACKLOG_VALUE}>Unassigned (backlog)</option>
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
                  value={draft.startDate}
                  onChange={(e) => {
                    setDraft((prev) => ({ ...prev, startDate: e.target.value }))
                    setSaveErrors([])
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
                {draft.startDate && (
                  <p className="mt-0.5 text-[11px] text-gray-400">{formatDay(draft.startDate)}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Target</label>
                <input
                  type="date"
                  value={draft.targetDate}
                  onChange={(e) => {
                    setDraft((prev) => ({ ...prev, targetDate: e.target.value }))
                    setSaveErrors([])
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
                {draft.targetDate && (
                  <p className="mt-0.5 text-[11px] text-gray-400">{formatDay(draft.targetDate)}</p>
                )}
              </div>
            </div>

            {draftMissingDates && (
              <p className="mt-2 text-xs text-amber-600">
                Dates required when a team is assigned — set them before saving.
              </p>
            )}

            <label className="mt-4 flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={draft.completed}
                onChange={(e) => {
                  setDraft((prev) => ({ ...prev, completed: e.target.checked }))
                  setSaveErrors([])
                }}
                className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
              />
              <Check size={14} className="text-emerald-500" />
              Delivered
            </label>
          </section>

          <section className="mb-6">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Notes</h3>
            <textarea
              value={draft.notes}
              onChange={(e) => {
                setDraft((prev) => ({ ...prev, notes: e.target.value.slice(0, 500) }))
                setSaveErrors([])
              }}
              rows={3}
              placeholder="Quick annotation (like an Excel cell note)"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
            <p className="mt-1 text-right text-[10px] text-gray-400">{draft.notes.length}/500</p>
          </section>

          <section className="mb-6">
            <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <Link2 size={12} />
              Dependencies
            </h3>

            {depConflicts.length > 0 && (
              <div className="mb-3 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>
                  Date conflict: {depConflicts.map((c) => c.predecessorName).join(', ')} end(s) after this feature starts.
                </span>
              </div>
            )}

            {predecessors.length > 0 && (
              <div className="mb-2">
                <p className="mb-1 text-[10px] font-medium uppercase text-gray-400">Depends on</p>
                <ul className="space-y-1">
                  {predecessors.map((f) => (
                    <li key={f.id} className="flex items-center justify-between rounded bg-gray-50 px-2 py-1 text-xs">
                      <span className="truncate">{f.name}</span>
                      <button type="button" onClick={() => toggleDependency(f.id)} className="text-gray-400 hover:text-red-500">
                        <X size={12} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {successors.length > 0 && (
              <div className="mb-2">
                <p className="mb-1 text-[10px] font-medium uppercase text-gray-400">Blocks</p>
                <ul className="space-y-1">
                  {successors.map((f) => (
                    <li key={f.id} className="rounded bg-gray-50 px-2 py-1 text-xs text-gray-600">{f.name}</li>
                  ))}
                </ul>
              </div>
            )}

            <select
              value=""
              onChange={(e) => {
                if (e.target.value) toggleDependency(e.target.value)
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            >
              <option value="">Add dependency…</option>
              {depPickerFeatures
                .filter((f) => !draft.dependsOn.includes(f.id))
                .map((f) => (
                  <option key={f.id} value={f.id}>{f.name} ({f.id})</option>
                ))}
            </select>
          </section>

          <section className="mb-6">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Comments</h3>
            <ul className="mb-3 space-y-2">
              {(feature.comments || []).map((c) => (
                <li key={c.id} className="rounded-lg border border-gray-100 px-3 py-2 text-xs">
                  {editingCommentId === c.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editingCommentText}
                        onChange={(e) => setEditingCommentText(e.target.value.slice(0, 500))}
                        rows={2}
                        className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateComment(feature.id, c.id, editingCommentText)
                            setEditingCommentId(null)
                          }}
                          className="text-violet-600 hover:text-violet-700"
                        >
                          Save
                        </button>
                        <button type="button" onClick={() => setEditingCommentId(null)} className="text-gray-400">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-gray-800">{c.text}</p>
                      <div className="mt-1 flex items-center justify-between text-gray-400">
                        <span>{c.author} · {new Date(c.createdAt).toLocaleString('en')}</span>
                        {c.author === actor && (
                          <span className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCommentId(c.id)
                                setEditingCommentText(c.text)
                              }}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteComment(feature.id, c.id)}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <Trash2 size={12} />
                            </button>
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </li>
              ))}
              {(feature.comments || []).length === 0 && (
                <p className="text-xs text-gray-400">No comments yet</p>
              )}
            </ul>
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value.slice(0, 500))}
                placeholder="Add a comment…"
                className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
              <button
                type="submit"
                className="shrink-0 rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
              >
                <Plus size={14} />
              </button>
            </form>
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

        <div className="space-y-3 border-t border-gray-200 p-4">
          {saveErrors.length > 0 && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
              <p className="font-medium">Fix the following before saving:</p>
              <ul className="mt-1 list-inside list-disc">
                {saveErrors.map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            </div>
          )}
          <button
            type="button"
            onClick={saveDraft}
            disabled={!isDirty}
            className="w-full rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save changes
          </button>
          <button
            type="button"
            onClick={() => requestLeave(() => onDelete(feature.id))}
            className="w-full rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            Delete feature
          </button>
        </div>
      </div>

      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onSave={handleDialogSave}
        onDiscard={handleDialogDiscard}
        onCancel={handleDialogCancel}
      />
    </>
  )
})

export default FeatureDetailPanel
