import { DATA_REVISION } from '../data'
import { migrateState } from './migration'

export const WORKSPACE_EXPORT_VERSION = 1

const WORKSPACE_KEYS = [
  'dataRevision',
  'projects',
  'teams',
  'projectTeams',
  'products',
  'projectProducts',
  'iterationPlans',
  'timeboxes',
  'sprints',
  'projectIterationPlans',
  'features',
  'timelineMarkers',
  'formattingRules',
  'auditEvents',
  'projectId',
  'viewMode',
  'filterTeamId',
  'filterProductId',
  'collapsedSections',
]

export function buildWorkspacePayload(state, { actor = null, includeActor = false } = {}) {
  const payload = {
    exportVersion: WORKSPACE_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
  }

  for (const key of WORKSPACE_KEYS) {
    if (state[key] !== undefined) {
      payload[key] = state[key]
    }
  }

  if (payload.dataRevision === undefined) {
    payload.dataRevision = DATA_REVISION
  }

  if (includeActor && actor?.trim()) {
    payload.actor = actor.trim()
  }

  return payload
}

export function summarizeWorkspace(state) {
  return {
    projectCount: state.projects?.length ?? 0,
    teamCount: state.teams?.length ?? 0,
    productCount: state.products?.length ?? 0,
    featureCount: state.features?.length ?? 0,
    iterationPlanCount: state.iterationPlans?.length ?? 0,
    auditEventCount: state.auditEvents?.length ?? 0,
    exportedAt: state.exportedAt ?? null,
    exportVersion: state.exportVersion ?? null,
    dataRevision: state.dataRevision ?? null,
    actor: state.actor ?? null,
  }
}

export function parseWorkspaceFile(text) {
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, error: 'Invalid JSON file.' }
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, error: 'Workspace file must be a JSON object.' }
  }

  const hasDomainData =
    Array.isArray(parsed.projects) ||
    Array.isArray(parsed.features) ||
    Array.isArray(parsed.teams) ||
    Array.isArray(parsed.products)

  if (!hasDomainData) {
    return { ok: false, error: 'Unrecognized Chronova workspace file.' }
  }

  const migrated = migrateState(parsed)
  const summary = summarizeWorkspace({ ...parsed, ...migrated })

  return {
    ok: true,
    state: migrated,
    summary,
    actor: typeof parsed.actor === 'string' ? parsed.actor.trim() : null,
  }
}

export function downloadWorkspace(payload) {
  const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], {
    type: 'application/json;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  const date = new Date().toISOString().slice(0, 10)
  link.download = `chronova-workspace-${date}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
