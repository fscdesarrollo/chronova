import { useEffect, useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { toISODate } from '../utils/dates'
import {
  ACTION_TYPES,
  CONDITION_FIELDS,
  MATCH_MODES,
  OPERATOR_LABELS,
  ROW_ICON_OPTIONS,
  fieldMeta,
  operatorNeedsValue,
} from '../utils/formattingRules'

const MARKER_COLORS = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899']

function emptyMarker() {
  return {
    id: '',
    label: '',
    date: toISODate(new Date()),
    color: MARKER_COLORS[0],
  }
}

function emptyRule() {
  return {
    id: `rule-${Date.now()}`,
    name: 'Custom rule',
    enabled: true,
    matchMode: 'all',
    conditions: [{ field: 'completed', operator: 'is_false' }],
    actions: [{ type: 'left_border', value: '#F97316' }],
  }
}

function ConditionRow({ condition, index, onChange, onRemove }) {
  const meta = fieldMeta(condition.field)
  const operators = meta?.operators ?? []
  const needsValue = operatorNeedsValue(condition.operator)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={condition.field}
        onChange={(e) => {
          const nextMeta = fieldMeta(e.target.value)
          onChange(index, {
            field: e.target.value,
            operator: nextMeta?.operators[0] ?? 'equals',
            value: '',
          })
        }}
        className="rounded border border-gray-300 px-2 py-1 text-sm"
      >
        {CONDITION_FIELDS.map((f) => (
          <option key={f.id} value={f.id}>{f.label}</option>
        ))}
      </select>
      <select
        value={condition.operator}
        onChange={(e) => onChange(index, { ...condition, operator: e.target.value })}
        className="rounded border border-gray-300 px-2 py-1 text-sm"
      >
        {operators.map((op) => (
          <option key={op} value={op}>{OPERATOR_LABELS[op] ?? op}</option>
        ))}
      </select>
      {needsValue && (
        condition.field === 'assignment_status' ? (
          <select
            value={condition.value ?? 'team_unassigned'}
            onChange={(e) => onChange(index, { ...condition, value: e.target.value })}
            className="min-w-[8rem] rounded border border-gray-300 px-2 py-1 text-sm"
          >
            <option value="team_unassigned">Needs reassignment</option>
            <option value="ok">OK</option>
          </select>
        ) : condition.field === 'target_date' || condition.field === 'start_date' ? (
          <input
            type="date"
            value={condition.value ?? ''}
            onChange={(e) => onChange(index, { ...condition, value: e.target.value })}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          />
        ) : (
          <input
            type={condition.field === 'story_points' ? 'number' : 'text'}
            value={condition.value ?? ''}
            onChange={(e) => onChange(index, { ...condition, value: e.target.value })}
            placeholder="Value"
            className="min-w-[8rem] rounded border border-gray-300 px-2 py-1 text-sm"
          />
        )
      )}
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="text-gray-400 hover:text-red-500"
        title="Remove condition"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

function ActionRow({ action, index, onChange, onRemove }) {
  const meta = ACTION_TYPES.find((a) => a.id === action.type)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={action.type}
        onChange={(e) => {
          const nextMeta = ACTION_TYPES.find((a) => a.id === e.target.value)
          onChange(index, {
            type: e.target.value,
            value: nextMeta?.valueType === 'color' ? '#EF4444' : nextMeta?.valueType === 'number' ? '0.5' : 'clock',
          })
        }}
        className="rounded border border-gray-300 px-2 py-1 text-sm"
      >
        {ACTION_TYPES.map((a) => (
          <option key={a.id} value={a.id}>{a.label}</option>
        ))}
      </select>
      {meta?.hasValue && meta.valueType === 'color' && (
        <input
          type="color"
          value={action.value ?? '#EF4444'}
          onChange={(e) => onChange(index, { ...action, value: e.target.value })}
          className="h-8 w-16 cursor-pointer rounded border border-gray-300"
        />
      )}
      {meta?.hasValue && meta.valueType === 'icon' && (
        <select
          value={action.value ?? 'clock'}
          onChange={(e) => onChange(index, { ...action, value: e.target.value })}
          className="rounded border border-gray-300 px-2 py-1 text-sm"
        >
          {ROW_ICON_OPTIONS.map((icon) => (
            <option key={icon.id} value={icon.id}>{icon.label}</option>
          ))}
        </select>
      )}
      {meta?.hasValue && meta.valueType === 'number' && (
        <input
          type="number"
          min="0"
          max="1"
          step="0.1"
          value={action.value ?? '0.5'}
          onChange={(e) => onChange(index, { ...action, value: e.target.value })}
          className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
        />
      )}
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="text-gray-400 hover:text-red-500"
        title="Remove action"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

export default function GanttSettingsModal({
  open,
  markers,
  formattingRules,
  onClose,
  onSaveMarkers,
  onSaveFormattingRules,
}) {
  const [markerDraft, setMarkerDraft] = useState([])
  const [rulesDraft, setRulesDraft] = useState([])
  const [activeTab, setActiveTab] = useState('markers')

  useEffect(() => {
    if (open) {
      setMarkerDraft(markers.length ? markers.map((m) => ({ ...m })) : [emptyMarker()])
      setRulesDraft(formattingRules.length ? formattingRules.map((r) => ({ ...r })) : [])
    }
  }, [open, markers, formattingRules])

  if (!open) return null

  const updateMarkerRow = (index, field, value) => {
    setMarkerDraft((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

  const addMarkerRow = () => {
    setMarkerDraft((prev) => [...prev, emptyMarker()])
  }

  const removeMarkerRow = (index) => {
    setMarkerDraft((prev) => (prev.length === 1 ? [emptyMarker()] : prev.filter((_, i) => i !== index)))
  }

  const updateRule = (index, patch) => {
    setRulesDraft((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  const removeRule = (index) => {
    setRulesDraft((prev) => prev.filter((_, i) => i !== index))
  }

  const updateCondition = (ruleIndex, condIndex, condition) => {
    setRulesDraft((prev) =>
      prev.map((rule, i) => {
        if (i !== ruleIndex) return rule
        const conditions = [...(rule.conditions || [])]
        conditions[condIndex] = condition
        return { ...rule, conditions }
      }),
    )
  }

  const addCondition = (ruleIndex) => {
    setRulesDraft((prev) =>
      prev.map((rule, i) => {
        if (i !== ruleIndex) return rule
        return {
          ...rule,
          conditions: [...(rule.conditions || []), { field: 'completed', operator: 'is_false' }],
        }
      }),
    )
  }

  const removeCondition = (ruleIndex, condIndex) => {
    setRulesDraft((prev) =>
      prev.map((rule, i) => {
        if (i !== ruleIndex) return rule
        const conditions = (rule.conditions || []).filter((_, ci) => ci !== condIndex)
        return { ...rule, conditions: conditions.length ? conditions : [{ field: 'completed', operator: 'is_false' }] }
      }),
    )
  }

  const updateAction = (ruleIndex, actionIndex, action) => {
    setRulesDraft((prev) =>
      prev.map((rule, i) => {
        if (i !== ruleIndex) return rule
        const actions = [...(rule.actions || [])]
        actions[actionIndex] = action
        return { ...rule, actions }
      }),
    )
  }

  const addAction = (ruleIndex) => {
    setRulesDraft((prev) =>
      prev.map((rule, i) => {
        if (i !== ruleIndex) return rule
        return {
          ...rule,
          actions: [...(rule.actions || []), { type: 'left_border', value: '#EF4444' }],
        }
      }),
    )
  }

  const removeAction = (ruleIndex, actionIndex) => {
    setRulesDraft((prev) =>
      prev.map((rule, i) => {
        if (i !== ruleIndex) return rule
        const actions = (rule.actions || []).filter((_, ai) => ai !== actionIndex)
        return { ...rule, actions: actions.length ? actions : [{ type: 'left_border', value: '#EF4444' }] }
      }),
    )
  }

  const handleSave = () => {
    const validMarkers = markerDraft.filter((m) => m.label.trim() && m.date)
    onSaveMarkers(validMarkers)
    onSaveFormattingRules(rulesDraft)
    onClose()
  }

  const matchModeLabel = (mode) =>
    MATCH_MODES.find((m) => m.id === mode)?.label ?? 'All conditions (AND)'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Gantt settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1">
          <aside className="w-44 shrink-0 border-r border-gray-200 bg-gray-50 p-3">
            <button
              type="button"
              onClick={() => setActiveTab('markers')}
              className={`mb-1 w-full rounded-md px-3 py-2 text-left text-sm font-medium ${
                activeTab === 'markers'
                  ? 'bg-white text-violet-700 shadow-sm'
                  : 'text-gray-600 hover:bg-white/70'
              }`}
            >
              Markers
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('rules')}
              className={`w-full rounded-md px-3 py-2 text-left text-sm font-medium ${
                activeTab === 'rules'
                  ? 'bg-white text-violet-700 shadow-sm'
                  : 'text-gray-600 hover:bg-white/70'
              }`}
            >
              Rules
            </button>
          </aside>

          <div className="min-w-0 flex-1 overflow-y-auto p-6">
            {activeTab === 'markers' && (
              <div>
                <h3 className="text-base font-semibold text-gray-900">Plan markers</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Key dates and events to track on the timeline for this project.
                </p>

                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-[1fr_1.2fr_100px_32px] gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                    <span>Date</span>
                    <span>Label</span>
                    <span>Color</span>
                    <span />
                  </div>

                  {markerDraft.map((row, index) => (
                    <div
                      key={row.id || `new-${index}`}
                      className="grid grid-cols-[1fr_1.2fr_100px_32px] items-center gap-2"
                    >
                      <input
                        type="date"
                        value={row.date}
                        onChange={(e) => updateMarkerRow(index, 'date', e.target.value)}
                        className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                      />
                      <input
                        type="text"
                        value={row.label}
                        onChange={(e) => updateMarkerRow(index, 'label', e.target.value)}
                        placeholder="Label marker"
                        className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                      />
                      <div className="flex items-center gap-1">
                        <input
                          type="color"
                          value={row.color}
                          onChange={(e) => updateMarkerRow(index, 'color', e.target.value)}
                          className="h-9 w-full cursor-pointer rounded border border-gray-300"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMarkerRow(index)}
                        className="flex h-8 w-8 items-center justify-center rounded text-gray-400 hover:bg-red-50 hover:text-red-500"
                        title="Remove marker"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addMarkerRow}
                  className="mt-4 flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-700"
                >
                  <Plus size={16} />
                  Add marker
                </button>
              </div>
            )}

            {activeTab === 'rules' && (
              <div>
                <h3 className="text-base font-semibold text-gray-900">Rules</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Visual accents applied on top of product colors. All matching rules apply.
                </p>

                <div className="mt-4 space-y-4">
                  {rulesDraft.map((rule, ruleIndex) => (
                    <div key={rule.id} className="rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={rule.name}
                          onChange={(e) => updateRule(ruleIndex, { name: e.target.value })}
                          className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm font-medium"
                        />
                        <label className="flex items-center gap-1.5 text-xs text-gray-600">
                          <input
                            type="checkbox"
                            checked={rule.enabled}
                            onChange={(e) => updateRule(ruleIndex, { enabled: e.target.checked })}
                            className="rounded border-gray-300 text-violet-600"
                          />
                          Enabled
                        </label>
                        <button
                          type="button"
                          onClick={() => removeRule(ruleIndex)}
                          className="text-gray-400 hover:text-red-500"
                          title="Remove rule"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="mt-4">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Conditions
                          </p>
                          <select
                            value={rule.matchMode ?? 'all'}
                            onChange={(e) => updateRule(ruleIndex, { matchMode: e.target.value })}
                            className="rounded border border-gray-300 px-2 py-0.5 text-xs text-gray-700"
                            title="How conditions are combined"
                          >
                            {MATCH_MODES.map((mode) => (
                              <option key={mode.id} value={mode.id}>{mode.label}</option>
                            ))}
                          </select>
                        </div>
                        <p className="mb-2 text-[10px] text-gray-400">
                          {matchModeLabel(rule.matchMode)}
                        </p>
                        <div className="space-y-2">
                          {(rule.conditions || []).map((condition, condIndex) => (
                            <ConditionRow
                              key={`${rule.id}-c-${condIndex}`}
                              condition={condition}
                              index={condIndex}
                              onChange={(idx, next) => updateCondition(ruleIndex, idx, next)}
                              onRemove={(idx) => removeCondition(ruleIndex, idx)}
                            />
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => addCondition(ruleIndex)}
                          className="mt-2 flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-700"
                        >
                          <Plus size={14} />
                          Add condition
                        </button>
                      </div>

                      <div className="mt-4">
                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Actions</p>
                        <div className="space-y-2">
                          {(rule.actions || []).map((action, actionIndex) => (
                            <ActionRow
                              key={`${rule.id}-a-${actionIndex}`}
                              action={action}
                              index={actionIndex}
                              onChange={(idx, next) => updateAction(ruleIndex, idx, next)}
                              onRemove={(idx) => removeAction(ruleIndex, idx)}
                            />
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => addAction(ruleIndex)}
                          className="mt-2 flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-700"
                        >
                          <Plus size={14} />
                          Add action
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setRulesDraft((prev) => [...prev, emptyRule()])}
                  className="mt-4 flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-700"
                >
                  <Plus size={16} />
                  Add rule
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
