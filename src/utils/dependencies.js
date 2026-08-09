import { parseFeatureId } from './ids'

export function sameFeatureId(a, b) {
  return (parseFeatureId(a) ?? a) === (parseFeatureId(b) ?? b)
}

export function normalizeDependsOn(value) {
  if (!Array.isArray(value)) return []
  const ids = []
  for (const raw of value) {
    const id = parseFeatureId(raw) ?? raw
    if (id != null && !ids.some((existing) => sameFeatureId(existing, id))) {
      ids.push(id)
    }
  }
  return ids
}

export function getDependencyRelatedIds(featureId, features) {
  const feature = features.find((f) => sameFeatureId(f.id, featureId))
  if (!feature) return new Set([featureId])

  const predecessors = normalizeDependsOn(feature.dependsOn)
  const successors = features
    .filter((f) => normalizeDependsOn(f.dependsOn).some((depId) => sameFeatureId(depId, featureId)))
    .map((f) => f.id)

  return new Set([featureId, ...predecessors, ...successors])
}

/** Returns true if adding dependsOnId to featureId would create a cycle. */
export function wouldCreateDependencyCycle(featureId, dependsOnId, features) {
  const normalizedDepId = parseFeatureId(dependsOnId) ?? dependsOnId
  if (sameFeatureId(featureId, normalizedDepId)) return true
  const feature = features.find((f) => sameFeatureId(f.id, featureId))
  const current = normalizeDependsOn(feature?.dependsOn)
  const proposed = [...current, normalizedDepId]
  return hasDependencyCycle(featureId, proposed, features)
}

export function hasDependencyCycle(featureId, proposedDependsOn, features) {
  const graph = new Map()
  for (const f of features) {
    graph.set(f.id, normalizeDependsOn(f.dependsOn))
  }
  const feature = features.find((f) => sameFeatureId(f.id, featureId))
  if (feature) {
    graph.set(feature.id, normalizeDependsOn(proposedDependsOn))
  }

  const visiting = new Set()

  function dfs(id) {
    if (visiting.has(id)) return true
    visiting.add(id)
    for (const dep of graph.get(id) ?? []) {
      const next = features.find((f) => sameFeatureId(f.id, dep))
      if (next && dfs(next.id)) return true
    }
    visiting.delete(id)
    return false
  }

  return dfs(feature?.id ?? featureId)
}

export function getDependencyDateConflicts(feature, features) {
  const conflicts = []
  for (const predId of normalizeDependsOn(feature.dependsOn)) {
    const pred = features.find((f) => sameFeatureId(f.id, predId))
    if (!pred?.targetDate || !feature.startDate) continue
    if (pred.targetDate > feature.startDate) {
      conflicts.push({ predecessorId: pred.id, predecessorName: pred.name })
    }
  }
  return conflicts
}

export function featuresForDependencyPicker(projectId, currentFeatureId, features) {
  return (features ?? []).filter(
    (f) => f.projectId === projectId && !sameFeatureId(f.id, currentFeatureId),
  )
}
