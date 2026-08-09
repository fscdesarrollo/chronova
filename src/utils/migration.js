import {
  DEFAULT_PROJECT_ID,
  seedFeatures,
  seedIterationPlans,
  seedProducts,
  seedProjectIterationPlans,
  seedProjectProducts,
  seedProjectTeams,
  seedProjects,
  seedSprints,
  seedTeams,
  seedTimeboxes,
} from '../data'
import { defaultFormattingRulesForProject, normalizeFormattingRules } from './formattingRules'
import { parseFeatureId, resetIdCounters, resetMarkerCounter } from './ids'

export function isPlannedFeature(feature) {
  return feature.planningStatus === 'planned'
}

export function isOnGantt(feature) {
  return (
    isPlannedFeature(feature) &&
    Boolean(feature.startDate) &&
    Boolean(feature.targetDate)
  )
}

export function derivePlanningStatus(feature) {
  if (feature.planningStatus) return feature.planningStatus
  return feature.teamId ? 'planned' : 'backlog'
}

export function migrateViewMode(saved) {
  if (saved.viewMode) {
    return { viewMode: saved.viewMode, filterTeamId: saved.filterTeamId ?? null }
  }
  if (saved.teamViewMode === 'single' && saved.filterTeamId) {
    return { viewMode: 'team', filterTeamId: saved.filterTeamId }
  }
  return { viewMode: 'all', filterTeamId: null }
}

export function migrateState(saved) {
  if (!saved) {
    return buildFreshState()
  }

  if (saved.projects?.length) {
    const { products, projectProducts } = migrateProductsToJunction(saved)
    resetIdCounters({
      ...saved,
      products,
      iterationPlans: saved.iterationPlans ?? seedIterationPlans,
      timeboxes: saved.timeboxes ?? seedTimeboxes,
      sprints: saved.sprints ?? seedSprints,
    })
    const projects = saved.projects
    const formattingRules = migrateFormattingRules(saved.formattingRules, projects)
    const { viewMode, filterTeamId } = migrateViewMode(saved)
    const normalizedFeatures = (saved.features ?? []).map(normalizeFeature)
    const { features, auditEvents } = migrateNumericFeatureIds(
      normalizedFeatures,
      saved.auditEvents ?? [],
    )
    const iterationState = migrateIterationPlans(saved, projects)
    return {
      projects,
      teams: saved.teams ?? seedTeams,
      projectTeams: saved.projectTeams ?? seedProjectTeams,
      products,
      projectProducts,
      ...iterationState,
      features,
      timelineMarkers: saved.timelineMarkers ?? [],
      formattingRules,
      auditEvents,
      projectId: saved.projectId ?? saved.projects[0]?.id ?? DEFAULT_PROJECT_ID,
      viewMode,
      filterTeamId,
      collapsedSections: saved.collapsedSections ?? {},
    }
  }

  return migrateLegacyState(saved)
}

function migrateFormattingRules(savedRules, projects) {
  if (!savedRules?.length) {
    return projects.flatMap((p) => defaultFormattingRulesForProject(p.id))
  }
  return normalizeFormattingRules(savedRules)
}

function migrateProductsToJunction(saved) {
  if (saved.projectProducts?.length) {
    return {
      products: (saved.products ?? []).map(normalizeProduct),
      projectProducts: saved.projectProducts,
    }
  }

  const products = (saved.products ?? seedProducts).map((p) => {
    const { projectId: _removed, ...rest } = normalizeProduct(p)
    return rest
  })

  const projectProducts = (saved.products ?? seedProducts)
    .filter((p) => p.projectId)
    .map((p) => ({ projectId: p.projectId, productId: p.id }))

  if (!projectProducts.length && products.length) {
    return {
      products,
      projectProducts: seedProjectProducts,
    }
  }

  return { products, projectProducts }
}

function buildFreshState() {
  const features = seedFeatures.map(normalizeFeature)
  return {
    projects: seedProjects,
    teams: seedTeams,
    projectTeams: seedProjectTeams,
    products: seedProducts.map(normalizeProduct),
    projectProducts: seedProjectProducts,
    iterationPlans: seedIterationPlans,
    timeboxes: seedTimeboxes,
    sprints: seedSprints,
    projectIterationPlans: seedProjectIterationPlans,
    features,
    timelineMarkers: [],
    formattingRules: seedProjects.flatMap((p) => defaultFormattingRulesForProject(p.id)),
    auditEvents: [],
    projectId: DEFAULT_PROJECT_ID,
    viewMode: 'all',
    filterTeamId: null,
    collapsedSections: {},
  }
}

function migrateIterationPlans(saved, projects) {
  if (saved.iterationPlans?.length) {
    const plans = saved.iterationPlans
    const timeboxes = saved.timeboxes ?? []
    const sprints = saved.sprints ?? []
    let projectIterationPlans = saved.projectIterationPlans ?? []

    // Ensure every project has at most one plan; backfill missing with first plan
    const assigned = new Set(projectIterationPlans.map((p) => p.projectId))
    const defaultPlanId = plans[0]?.id
    if (defaultPlanId) {
      for (const project of projects) {
        if (!assigned.has(project.id)) {
          projectIterationPlans = [
            ...projectIterationPlans,
            { projectId: project.id, planId: defaultPlanId },
          ]
        }
      }
    }

    // Deduplicate by projectId (keep first)
    const seen = new Set()
    projectIterationPlans = projectIterationPlans.filter((pip) => {
      if (seen.has(pip.projectId)) return false
      seen.add(pip.projectId)
      return true
    })

    return {
      iterationPlans: plans,
      timeboxes,
      sprints: sprints.map(normalizeSprint),
      projectIterationPlans,
    }
  }

  return {
    iterationPlans: seedIterationPlans,
    timeboxes: seedTimeboxes,
    sprints: seedSprints,
    projectIterationPlans: projects.map((p) => ({
      projectId: p.id,
      planId: seedIterationPlans[0].id,
    })),
  }
}

function normalizeSprint(s) {
  let type = s.type || 'DEVELOPMENT'
  if (/^innovation$/i.test(type)) type = 'INNOVATION'
  else if (/^development$/i.test(type)) type = 'DEVELOPMENT'

  return {
    ...s,
    type,
    scale: s.scale === 'day' || s.scale === 'month' || s.scale === 'week' ? s.scale : 'week',
    name: s.name || s.id,
  }
}

function migrateLegacyState(saved) {
  const normalized = (saved.features?.length ? saved.features : seedFeatures).map((f) => ({
    ...normalizeFeature(f),
    projectId: f.projectId ?? DEFAULT_PROJECT_ID,
    assignmentStatus: f.assignmentStatus ?? 'ok',
  }))
  const { features, auditEvents } = migrateNumericFeatureIds(
    normalized,
    saved.auditEvents ?? [],
  )

  const state = {
    projects: seedProjects,
    teams: seedTeams,
    projectTeams: seedProjectTeams,
    products: seedProducts.map(normalizeProduct),
    projectProducts: seedProjectProducts,
    iterationPlans: seedIterationPlans,
    timeboxes: seedTimeboxes,
    sprints: seedSprints,
    projectIterationPlans: seedProjectIterationPlans,
    features,
    timelineMarkers: saved.timelineMarkers ?? [],
    formattingRules: seedProjects.flatMap((p) => defaultFormattingRulesForProject(p.id)),
    auditEvents,
    projectId: DEFAULT_PROJECT_ID,
    viewMode: 'all',
    filterTeamId: null,
    collapsedSections: {},
  }

  resetIdCounters(state)
  return state
}

/** Convert legacy `F-*` (or string) feature ids to integer identity values. */
export function migrateNumericFeatureIds(features, auditEvents = []) {
  const idMap = new Map()
  const used = new Set()

  for (const f of features) {
    const parsed = parseFeatureId(f.id)
    if (parsed != null && !used.has(parsed)) {
      idMap.set(f.id, parsed)
      used.add(parsed)
    }
  }

  let next = used.size > 0 ? Math.max(...used) + 1 : 1
  for (const f of features) {
    if (idMap.has(f.id)) continue
    while (used.has(next)) next += 1
    idMap.set(f.id, next)
    used.add(next)
    next += 1
  }

  const lookup = new Map()
  for (const [from, to] of idMap) {
    lookup.set(from, to)
    lookup.set(String(from), to)
    lookup.set(to, to)
    const parsed = parseFeatureId(from)
    if (parsed != null) {
      lookup.set(parsed, to)
      lookup.set(`F-${parsed}`, to)
      lookup.set(`f-${parsed}`, to)
    }
  }

  const resolveId = (raw) => {
    if (raw == null) return null
    if (lookup.has(raw)) return lookup.get(raw)
    const parsed = parseFeatureId(raw)
    if (parsed != null && lookup.has(parsed)) return lookup.get(parsed)
    return null
  }

  const migratedFeatures = features.map((f) => ({
    ...f,
    id: idMap.get(f.id),
    dependsOn: (Array.isArray(f.dependsOn) ? f.dependsOn : [])
      .map((depId) => resolveId(depId))
      .filter((depId) => depId != null && used.has(depId)),
  }))

  const migratedAudit = auditEvents.map((event) => {
    const payload = event.payload ? { ...event.payload } : event.payload
    if (payload?.dependsOnId != null) {
      const mapped = resolveId(payload.dependsOnId)
      if (mapped != null) payload.dependsOnId = mapped
    }
    return {
      ...event,
      featureId: event.featureId == null ? null : (resolveId(event.featureId) ?? event.featureId),
      payload,
    }
  })

  return { features: migratedFeatures, auditEvents: migratedAudit }
}

function normalizeProduct(p) {
  const { projectId, ...rest } = p
  return {
    ...rest,
    color: p.color?.startsWith('#') ? p.color : legacyColorToHex(p.color),
    createdAt: p.createdAt ?? new Date().toISOString(),
  }
}

function normalizeFeature(f) {
  const planningStatus = derivePlanningStatus(f)
  const teamId = planningStatus === 'backlog' ? null : (f.teamId ?? null)
  return {
    ...f,
    projectId: f.projectId ?? DEFAULT_PROJECT_ID,
    planningStatus,
    teamId,
    assignmentStatus: f.assignmentStatus ?? 'ok',
    userStories: f.userStories ?? [],
    notes: f.notes ?? '',
    comments: f.comments ?? [],
    dependsOn: Array.isArray(f.dependsOn) ? f.dependsOn : [],
    startDate: f.startDate ?? null,
    targetDate: f.targetDate ?? null,
  }
}

function legacyColorToHex(tailwindClass) {
  const map = {
    'bg-blue-500': '#3B82F6',
    'bg-emerald-500': '#10B981',
    'bg-orange-400': '#FB923C',
    'bg-violet-500': '#8B5CF6',
  }
  return map[tailwindClass] ?? '#6B7280'
}

export function computeFeatureAssignmentStatus(feature, projectTeams) {
  if (!feature.teamId) return 'ok'
  if (!feature.projectId) return 'team_unassigned'
  const assigned = projectTeams.some(
    (pt) => pt.projectId === feature.projectId && pt.teamId === feature.teamId,
  )
  return assigned ? 'ok' : 'team_unassigned'
}

export function refreshFeatureAssignmentStatuses(features, projectTeams) {
  return features.map((f) => ({
    ...f,
    assignmentStatus: computeFeatureAssignmentStatus(f, projectTeams),
  }))
}

export function productIdsForProject(projectProducts, projectId) {
  return new Set(
    projectProducts.filter((pp) => pp.projectId === projectId).map((pp) => pp.productId),
  )
}

export function orphanedProductIds(products, projectProducts) {
  const assigned = new Set(projectProducts.map((pp) => pp.productId))
  return products.filter((p) => !assigned.has(p.id)).map((p) => p.id)
}
