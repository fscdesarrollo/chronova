import { isOnGantt, productIdsForProject } from './migration'

export const GANTT_SETUP_STEPS = [
  { id: 'project', label: 'Project created' },
  { id: 'calendar', label: 'Calendar ready' },
  { id: 'product', label: 'Product assigned' },
  { id: 'team', label: 'Team assigned' },
  { id: 'feature', label: 'First feature on Gantt' },
]

export function getProjectGanttReadiness({
  projectId,
  projects,
  projectProducts,
  projectTeams,
  features,
}) {
  const project = projects.find((p) => p.id === projectId)
  const productIds = projectId ? productIdsForProject(projectProducts, projectId) : new Set()
  const teamCount = projectTeams.filter((pt) => pt.projectId === projectId).length
  const projectFeatures = features.filter((f) => f.projectId === projectId)
  const ganttFeatureCount = projectFeatures.filter(isOnGantt).length

  const steps = {
    project: Boolean(project),
    // Timeline is always available once a project exists (generic day grid + optional SAFe plan).
    calendar: Boolean(project),
    product: productIds.size > 0,
    team: teamCount > 0,
    feature: ganttFeatureCount > 0,
  }

  const completedCount = Object.values(steps).filter(Boolean).length
  const canAddFeature = steps.project && steps.product
  const canAddPlannedFeature = steps.project && steps.product && steps.team
  const isReady = steps.project && steps.product && steps.team

  return {
    steps,
    completedCount,
    totalSteps: GANTT_SETUP_STEPS.length,
    canAddFeature,
    canAddPlannedFeature,
    isReady,
    hasGanttFeature: steps.feature,
    isComplete: completedCount === GANTT_SETUP_STEPS.length,
    missingStep: GANTT_SETUP_STEPS.find(({ id }) => !steps[id])?.id ?? null,
  }
}
