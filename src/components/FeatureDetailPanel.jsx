import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Check, ChevronDown, Clock, Link2, Pencil, Plus, Trash2, X } from 'lucide-react'
import { formatDay } from '../utils/dates'
import {
  featuresForDependencyPicker,
  getDependencyDateConflicts,
  hasDependencyCycle,
  normalizeDependsOn,
  sameFeatureId,
  wouldCreateDependencyCycle,
} from '../utils/dependencies'
import { parseFeatureId } from '../utils/ids'
import UnsavedChangesDialog from './UnsavedChangesDialog'

const BACKLOG_VALUE = '__backlog__'

function CollapsibleSection({ title, icon: Icon, count, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section className="border-b border-gray-100 pb-4 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="mb-3 flex w-full items-center justify-between text-left"
      >
        <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
          {Icon && <Icon size={12} />}
          {title}
          {count != null && <span className="font-normal normal-case text-gray-400">({count})</span>}
        </h3>
        <ChevronDown
          size={14}
          className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && children}
    </section>
  )
}

const EVENT_LABELS = {
  'feature.created': 'Feature created',
  'feature.moved': 'Feature moved',
  'feature.dates_changed': 'Dates updated',
  'feature.completed': 'Delivery status',
  'feature.renamed': 'Name updated',
  'feature.team_changed': 'Team changed',
  'feature.team_assigned': 'Team assigned',
  'feature.product_changed': 'Product changed',
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
      productId: '',
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
    productId: feature.productId ?? '',
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
    a.productId === b.productId &&
    a.teamId === b.teamId &&
    a.startDate === b.startDate &&
    a.targetDate === b.targetDate &&
    a.completed === b.completed &&
    a.notes === b.notes &&
    a.dependsOn.length === b.dependsOn.length &&
    a.dependsOn.every((id, i) => sameFeatureId(id, b.dependsOn[i]))
  )
}

function validateDraft(draft) {
  const errors = []
  if (!draft.name.trim()) {
    errors.push('Name is required.')
  }
  if (!draft.productId) {
    errors.push('Product is required.')
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
    productId: draft.productId,
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
    productsForProject,
    allProducts,
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
      productId: draft.productId,
      teamId: draft.teamId,
      startDate: draft.startDate || null,
      targetDate: draft.targetDate || null,
    })
  }, [draft.productId, draft.teamId, draft.startDate, draft.targetDate, feature?.id, onEditPreviewChange])

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

  const productOptions = (() => {
    const options = [...(productsForProject ?? [])]
    if (draft.productId && !options.some((p) => p.id === draft.productId)) {
      const current = allProducts?.find((p) => p.id === draft.productId)
      if (current) options.push(current)
    }
    return options
  })()

  const draftProductName =
    productOptions.find((p) => p.id === draft.productId)?.name ?? feature.productName

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
    .map((depId) => (allFeatures ?? []).find((f) => sameFeatureId(f.id, depId)))
    .filter(Boolean)
  const successors = (allFeatures ?? []).filter((f) =>
    normalizeDependsOn(f.dependsOn).some((depId) => sameFeatureId(depId, feature.id)),
  )

  const toggleDependency = (depId) => {
    const normalizedId = parseFeatureId(depId) ?? depId
    setDraft((prev) => {
      const current = normalizeDependsOn(prev.dependsOn)
      if (current.some((id) => sameFeatureId(id, normalizedId))) {
        return {
          ...prev,
          dependsOn: current.filter((id) => !sameFeatureId(id, normalizedId)),
        }
      }
      if (wouldCreateDependencyCycle(feature.id, normalizedId, allFeatures ?? [])) {
        setSaveErrors(['This dependency would create a circular reference.'])
        return prev
      }
      return { ...prev, dependsOn: [...current, normalizedId] }
    })
    setSaveErrors([])
  }

  const datesLocked = draft.completed

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

  const commentCount = (feature.comments || []).length
  const usCount = (feature.userStories || []).length

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
              {feature.id} · {draftProductName}
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

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {needsAlert && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>Team no longer assigned to this project. Select a valid team below.</span>
            </div>
          )}

          {isBacklogDraft && (
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
              Assign a team and dates to show this feature on the Gantt.
            </div>
          )}

          <section className="space-y-3 rounded-lg border border-gray-100 bg-gray-50/50 p-3">
            <div>
              <label className="mb-1 block text-xs text-gray-500">Product</label>
              <select
                value={draft.productId}
                onChange={(e) => {
                  setDraft((prev) => ({ ...prev, productId: e.target.value }))
                  setSaveErrors([])
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                {productOptions.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
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
                className={`w-full rounded-lg border bg-white px-3 py-1.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 ${
                  needsAlert ? 'border-amber-400 bg-amber-50' : 'border-gray-300'
                }`}
              >
                <option value={BACKLOG_VALUE}>Unassigned (backlog)</option>
                {teamOptions.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-gray-500">Start</label>
                <input
                  type="date"
                  value={draft.startDate}
                  disabled={datesLocked}
                  onChange={(e) => {
                    setDraft((prev) => ({ ...prev, startDate: e.target.value }))
                    setSaveErrors([])
                  }}
                  className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Target</label>
                <input
                  type="date"
                  value={draft.targetDate}
                  disabled={datesLocked}
                  onChange={(e) => {
                    setDraft((prev) => ({ ...prev, targetDate: e.target.value }))
                    setSaveErrors([])
                  }}
                  className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>
            </div>

            {(draft.startDate || draft.targetDate) && (
              <p className="text-[11px] text-gray-400">
                {draft.startDate ? formatDay(draft.startDate) : '—'}
                {' → '}
                {draft.targetDate ? formatDay(draft.targetDate) : '—'}
              </p>
            )}

            {draftMissingDates && (
              <p className="text-xs text-amber-600">Dates required when a team is assigned.</p>
            )}

            {datesLocked && (
              <p className="text-xs text-gray-500">Dates are locked while the feature is marked as delivered.</p>
            )}

            <label className="flex items-center gap-2 text-sm text-gray-700">
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

          <section>
            <label className="mb-1 block text-xs font-medium text-gray-500">Notes</label>
            <textarea
              value={draft.notes}
              onChange={(e) => {
                setDraft((prev) => ({ ...prev, notes: e.target.value.slice(0, 500) }))
                setSaveErrors([])
              }}
              rows={2}
              placeholder="Quick annotation"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
            <p className="mt-0.5 text-right text-[10px] text-gray-400">{draft.notes.length}/500</p>
          </section>

          <CollapsibleSection title="Dependencies" icon={Link2} defaultOpen>
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
                .filter((f) => !draft.dependsOn.some((depId) => sameFeatureId(depId, f.id)))
                .map((f) => (
                  <option key={f.id} value={f.id}>{f.name} ({f.id})</option>
                ))}
            </select>
          </CollapsibleSection>

          <CollapsibleSection title="User Stories" count={`${feature.storyPoints} SP`} defaultOpen={usCount > 0}>
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
              {usCount === 0 && <p className="text-xs text-gray-400">No user stories</p>}
            </ul>

            <form onSubmit={handleAddUs} className="flex gap-2">
              <input
                type="text"
                value={usTitle}
                onChange={(e) => setUsTitle(e.target.value)}
                placeholder="Story title"
                className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
              <input
                type="number"
                min="0"
                value={usPoints}
                onChange={(e) => setUsPoints(e.target.value)}
                placeholder="SP"
                className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
              <button
                type="submit"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Plus size={14} />
              </button>
            </form>
          </CollapsibleSection>

          <CollapsibleSection title="Comments" count={commentCount} defaultOpen={false}>
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
              {commentCount === 0 && <p className="text-xs text-gray-400">No comments yet</p>}
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
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                <Plus size={14} />
              </button>
            </form>
          </CollapsibleSection>

          <CollapsibleSection title="History" icon={Clock} count={history.length} defaultOpen={false}>
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
              {history.length === 0 && <p className="text-xs text-gray-400">No events recorded</p>}
            </ul>
          </CollapsibleSection>
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
