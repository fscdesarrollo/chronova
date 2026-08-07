export function buildTimelineRows(features, { teamViewMode, filterTeamId, teams, projectTeams, projectId }) {
  const projectFeatures = features.filter((f) => f.projectId === projectId)
  const assignedTeamIds = projectTeams
    .filter((pt) => pt.projectId === projectId)
    .map((pt) => pt.teamId)

  const teamMap = Object.fromEntries(teams.map((t) => [t.id, t]))

  if (teamViewMode === 'single' && filterTeamId) {
    const matched = projectFeatures.filter(
      (f) => f.teamId === filterTeamId && f.assignmentStatus === 'ok',
    )
    const needsReassignment = projectFeatures.filter((f) => f.assignmentStatus === 'team_unassigned')

    const rows = []
    if (matched.length) {
      rows.push({ type: 'section', id: `team-${filterTeamId}`, label: teamMap[filterTeamId]?.name ?? 'Team', count: matched.length })
      matched.forEach((f) => rows.push({ type: 'feature', feature: f }))
    }
    if (needsReassignment.length) {
      rows.push({ type: 'section', id: 'needs-reassignment', label: 'Needs reassignment', count: needsReassignment.length, alert: true })
      needsReassignment.forEach((f) => rows.push({ type: 'feature', feature: f }))
    }
    return rows
  }

  const rows = []
  const unassigned = projectFeatures.filter((f) => f.assignmentStatus === 'team_unassigned')
  const assignedFeatures = projectFeatures.filter((f) => f.assignmentStatus === 'ok')

  for (const teamId of assignedTeamIds) {
    const teamFeatures = assignedFeatures.filter((f) => f.teamId === teamId)
    if (!teamFeatures.length) continue
    rows.push({
      type: 'section',
      id: `team-${teamId}`,
      label: teamMap[teamId]?.name ?? 'Team',
      count: teamFeatures.length,
    })
    teamFeatures.forEach((f) => rows.push({ type: 'feature', feature: f }))
  }

  const orphanAssigned = assignedFeatures.filter((f) => !assignedTeamIds.includes(f.teamId))
  if (orphanAssigned.length) {
    rows.push({ type: 'section', id: 'needs-reassignment', label: 'Needs reassignment', count: orphanAssigned.length, alert: true })
    orphanAssigned.forEach((f) => rows.push({ type: 'feature', feature: f }))
  }

  if (unassigned.length) {
    const alreadyShown = new Set(rows.filter((r) => r.type === 'feature').map((r) => r.feature.id))
    const extra = unassigned.filter((f) => !alreadyShown.has(f.id))
    if (extra.length) {
      if (!rows.some((r) => r.id === 'needs-reassignment')) {
        rows.push({ type: 'section', id: 'needs-reassignment', label: 'Needs reassignment', count: extra.length, alert: true })
      }
      extra.forEach((f) => rows.push({ type: 'feature', feature: f }))
    }
  }

  if (!rows.length && projectFeatures.length) {
    projectFeatures.forEach((f) => rows.push({ type: 'feature', feature: f }))
  }

  return rows
}

export function rowsToFeatures(rows) {
  return rows.filter((r) => r.type === 'feature').map((r) => r.feature)
}
