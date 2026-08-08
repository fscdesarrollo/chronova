import { toISODate } from './dates'

export const DEFAULT_OVERDUE_RULE_ID = 'rule-overdue'
export const DEFAULT_COMPLETED_OVERDUE_RULE_ID = 'rule-completed-overdue'

export const MATCH_MODES = [
  { id: 'all', label: 'All conditions (AND)' },
  { id: 'any', label: 'Any condition (OR)' },
]

export const CONDITION_FIELDS = [
  { id: 'target_date', label: 'Target date', operators: ['lt_today', 'gt', 'lt', 'eq'] },
  { id: 'start_date', label: 'Start date', operators: ['lt_today', 'gt', 'lt', 'eq'] },
  { id: 'completed', label: 'Completed', operators: ['is_true', 'is_false'] },
  { id: 'cross_pi', label: 'Cross-PI', operators: ['is_true'] },
  { id: 'story_points', label: 'Story points', operators: ['gt', 'lt', 'eq'] },
  { id: 'assignment_status', label: 'Assignment status', operators: ['equals'] },
  { id: 'name', label: 'Name', operators: ['contains', 'not_contains', 'equals', 'starts_with'] },
]

export const OPERATOR_LABELS = {
  lt_today: '< today',
  gt: '>',
  lt: '<',
  eq: '=',
  is_true: 'is true',
  is_false: 'is false',
  equals: 'equals',
  contains: 'contains',
  not_contains: 'not contains',
  starts_with: 'starts with',
}

export const ACTION_TYPES = [
  { id: 'left_border', label: 'Left border', hasValue: true, valueType: 'color' },
  { id: 'row_icon', label: 'Row icon', hasValue: true, valueType: 'icon' },
  { id: 'bar_pattern', label: 'Bar pattern', hasValue: false },
  { id: 'opacity', label: 'Opacity', hasValue: true, valueType: 'number' },
]

export const ROW_ICON_OPTIONS = [
  { id: 'clock', label: 'Clock' },
  { id: 'alert-triangle', label: 'Alert triangle' },
]

export const ROW_ICON_LABELS = {
  clock: 'Clock',
  'alert-triangle': 'Alert triangle',
  alert: 'Alert triangle',
}

/** Normalize legacy icon ids stored in rules. */
export function normalizeRowIconId(iconId) {
  if (iconId === 'alert') return 'alert-triangle'
  return iconId
}

export function createDefaultOverdueRule(projectId) {
  return {
    id: DEFAULT_OVERDUE_RULE_ID,
    projectId,
    name: 'Overdue',
    enabled: true,
    matchMode: 'all',
    conditions: [
      { field: 'target_date', operator: 'lt_today' },
      { field: 'completed', operator: 'is_false' },
    ],
    actions: [
      { type: 'left_border', value: '#EF4444' },
      { type: 'row_icon', value: 'clock' },
    ],
  }
}

export function createDefaultCompletedOverdueRule(projectId) {
  return {
    id: DEFAULT_COMPLETED_OVERDUE_RULE_ID,
    projectId,
    name: 'Completed overdue',
    enabled: true,
    matchMode: 'all',
    conditions: [
      { field: 'target_date', operator: 'lt_today' },
      { field: 'completed', operator: 'is_true' },
    ],
    actions: [{ type: 'left_border', value: '#F59E0B' }],
  }
}

export function defaultFormattingRulesForProject(projectId) {
  return [createDefaultOverdueRule(projectId), createDefaultCompletedOverdueRule(projectId)]
}

export function normalizeFormattingRule(rule) {
  return {
    ...rule,
    matchMode: rule.matchMode === 'any' ? 'any' : 'all',
    actions: (rule.actions || []).map((action) =>
      action.type === 'row_icon'
        ? { ...action, value: normalizeRowIconId(action.value) }
        : action,
    ),
  }
}

export function normalizeFormattingRules(rules) {
  return (rules ?? []).map(normalizeFormattingRule)
}

function todayISO() {
  return toISODate(new Date())
}

function matchesCondition(condition, feature) {
  const { field, operator, value } = condition

  switch (field) {
    case 'target_date':
      if (!feature.targetDate) return false
      if (operator === 'lt_today') return feature.targetDate < todayISO()
      if (operator === 'gt') return feature.targetDate > value
      if (operator === 'lt') return feature.targetDate < value
      if (operator === 'eq') return feature.targetDate === value
      return false
    case 'start_date':
      if (!feature.startDate) return false
      if (operator === 'lt_today') return feature.startDate < todayISO()
      if (operator === 'gt') return feature.startDate > value
      if (operator === 'lt') return feature.startDate < value
      if (operator === 'eq') return feature.startDate === value
      return false
    case 'completed':
      if (operator === 'is_true') return feature.completed === true
      if (operator === 'is_false') return !feature.completed
      return false
    case 'cross_pi':
      if (operator === 'is_true') return feature.crossPi === true
      return false
    case 'story_points':
      if (operator === 'gt') return (feature.storyPoints || 0) > Number(value)
      if (operator === 'lt') return (feature.storyPoints || 0) < Number(value)
      if (operator === 'eq') return (feature.storyPoints || 0) === Number(value)
      return false
    case 'assignment_status':
      return feature.assignmentStatus === value
    case 'name': {
      const name = (feature.name ?? '').toLowerCase()
      const needle = (value ?? '').toLowerCase()
      if (operator === 'contains') return name.includes(needle)
      if (operator === 'not_contains') return !name.includes(needle)
      if (operator === 'equals') return name === needle
      if (operator === 'starts_with') return name.startsWith(needle)
      return false
    }
    default:
      return false
  }
}

function ruleMatches(rule, feature) {
  const conditions = rule.conditions || []
  if (!conditions.length) return false
  if (rule.matchMode === 'any') {
    return conditions.some((c) => matchesCondition(c, feature))
  }
  return conditions.every((c) => matchesCondition(c, feature))
}

function pushRuleName(list, name) {
  if (name && !list.includes(name)) list.push(name)
}

function addRowIcon(result, iconId, ruleName) {
  const icon = normalizeRowIconId(iconId)
  const existing = result.rowIcons.find((item) => item.icon === icon)
  if (existing) {
    pushRuleName(existing.rules, ruleName)
  } else {
    result.rowIcons.push({ icon, rules: ruleName ? [ruleName] : [] })
  }
}

/** All matching enabled rules apply their actions. */
export function evaluateFormattingRules(rules, feature) {
  const result = {
    leftBorder: null,
    leftBorderRules: [],
    rowIcons: [],
    barPattern: false,
    barPatternRules: [],
    opacity: null,
    opacityRules: [],
  }

  for (const rule of rules || []) {
    if (!rule.enabled) continue
    if (!ruleMatches(rule, feature)) continue

    const ruleName = rule.name || 'Unnamed rule'

    for (const action of rule.actions || []) {
      switch (action.type) {
        case 'left_border':
          result.leftBorder = action.value
          pushRuleName(result.leftBorderRules, ruleName)
          break
        case 'row_icon':
          addRowIcon(result, action.value, ruleName)
          break
        case 'bar_pattern':
          result.barPattern = true
          pushRuleName(result.barPatternRules, ruleName)
          break
        case 'opacity':
          result.opacity = Number(action.value)
          pushRuleName(result.opacityRules, ruleName)
          break
        default:
          break
      }
    }
  }

  return result
}

export function operatorNeedsValue(operator) {
  return !['lt_today', 'is_true', 'is_false'].includes(operator)
}

export function fieldMeta(fieldId) {
  return CONDITION_FIELDS.find((f) => f.id === fieldId)
}

export function ruleTooltip(ruleNames, detail) {
  if (!ruleNames?.length) return detail ?? ''
  const prefix = ruleNames.length === 1 ? `Rule: ${ruleNames[0]}` : `Rules: ${ruleNames.join(', ')}`
  return detail ? `${prefix} — ${detail}` : prefix
}
