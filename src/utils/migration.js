import {
  DEFAULT_PROJECT_ID,
  seedFeatures,
  seedProducts,
  seedProjectProducts,
  seedProjectTeams,
  seedProjects,
  seedTeams,
} from '../data'
import { defaultFormattingRulesForProject, normalizeFormattingRules } from './formattingRules'
import { resetIdCounters, resetMarkerCounter } from './ids'

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
    resetIdCounters({ ...saved, products })
    const projects = saved.projects
    const formattingRules = migrateFormattingRules(saved.formattingRules, projects)
    const { viewMode, filterTeamId } = migrateViewMode(saved)
    return {
      projects,
      teams: saved.teams ?? seedTeams,
      projectTeams: saved.projectTeams ?? seedProjectTeams,
      products,
      projectProducts,
      features: (saved.features ?? []).map(normalizeFeature),
      timelineMarkers: saved.timelineMarkers ?? [],
      formattingRules,
      auditEvents: saved.auditEvents ?? [],
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

function migrateLegacyState(saved) {
  const features = (saved.features?.length ? saved.features : seedFeatures).map((f) => ({
    ...normalizeFeature(f),
    projectId: f.projectId ?? DEFAULT_PROJECT_ID,
    assignmentStatus: f.assignmentStatus ?? 'ok',
  }))

  const state = {
    projects: seedProjects,
    teams: seedTeams,
    projectTeams: seedProjectTeams,
    products: seedProducts.map(normalizeProduct),
    projectProducts: seedProjectProducts,
    features,
    timelineMarkers: saved.timelineMarkers ?? [],
    formattingRules: seedProjects.flatMap((p) => defaultFormattingRulesForProject(p.id)),
    auditEvents: saved.auditEvents ?? [],
    projectId: DEFAULT_PROJECT_ID,
    viewMode: 'all',
    filterTeamId: null,
    collapsedSections: {},
  }

  resetIdCounters(state)
  return state
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
