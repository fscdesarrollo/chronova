export function normalizeDependsOn(value) {
  return Array.isArray(value) ? value : []
}

export function getDependencyRelatedIds(featureId, features) {
  const feature = features.find((f) => f.id === featureId)
  if (!feature) return new Set([featureId])

  const predecessors = normalizeDependsOn(feature.dependsOn)
  const successors = features
    .filter((f) => normalizeDependsOn(f.dependsOn).includes(featureId))
    .map((f) => f.id)

  return new Set([featureId, ...predecessors, ...successors])
}

/** Returns true if adding dependsOnId to featureId would create a cycle. */
export function wouldCreateDependencyCycle(featureId, dependsOnId, features) {
  if (featureId === dependsOnId) return true
  const feature = features.find((f) => f.id === featureId)
  const current = normalizeDependsOn(feature?.dependsOn)
  const proposed = [...current, dependsOnId]
  return hasDependencyCycle(featureId, proposed, features)
}

export function hasDependencyCycle(featureId, proposedDependsOn, features) {
  const graph = new Map()
  for (const f of features) {
    graph.set(f.id, normalizeDependsOn(f.dependsOn))
  }
  graph.set(featureId, [...proposedDependsOn])

  const visiting = new Set()

  function dfs(id) {
    if (visiting.has(id)) return true
    visiting.add(id)
    for (const dep of graph.get(id) ?? []) {
      if (dfs(dep)) return true
    }
    visiting.delete(id)
    return false
  }

  return dfs(featureId)
}

export function getDependencyDateConflicts(feature, features) {
  const conflicts = []
  for (const predId of normalizeDependsOn(feature.dependsOn)) {
    const pred = features.find((f) => f.id === predId)
    if (!pred?.targetDate || !feature.startDate) continue
    if (pred.targetDate > feature.startDate) {
      conflicts.push({ predecessorId: predId, predecessorName: pred.name })
    }
  }
  return conflicts
}

export function featuresForDependencyPicker(projectId, currentFeatureId, features) {
  return (features ?? []).filter((f) => f.projectId === projectId && f.id !== currentFeatureId)
}
