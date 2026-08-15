function isSectionCollapsed(collapsedSections, sectionId) {
  return (collapsedSections ?? []).includes(sectionId)
}

function sectionRow(section, collapsedSections) {
  return {
    type: 'section',
    id: section.id,
    label: section.label,
    count: section.count,
    alert: section.alert,
    collapsed: isSectionCollapsed(collapsedSections, section.id),
  }
}

function featureRows(features) {
  return features.map((f) => ({ type: 'feature', feature: f }))
}

function sectionWithFeatures(section, features, collapsedSections) {
  const collapsed = isSectionCollapsed(collapsedSections, section.id)
  const rows = [sectionRow(section, collapsedSections)]
  if (!collapsed) {
    rows.push(...featureRows(features))
    if (section.id?.startsWith('team-') && features.length === 0) {
      rows.push({
        type: 'team-drop',
        id: `${section.id}-drop`,
        sectionId: section.id,
        teamId: section.id.slice('team-'.length),
        label: section.label,
      })
    }
  }
  return rows
}

function needsReassignmentSection(items) {
  return {
    id: 'needs-reassignment',
    label: 'Needs reassignment',
    count: items.length,
    alert: true,
  }
}

function buildTeamGroupedRows({
  backlog,
  assignedPlanned,
  needsReassignment,
  assignedTeamIds,
  teamMap,
  collapsedSections,
}) {
  const backlogSection = {
    id: 'backlog',
    label: 'Backlog',
    count: backlog.length,
  }

  const rows = []
  if (backlog.length) {
    rows.push(...sectionWithFeatures(backlogSection, backlog, collapsedSections))
  }

  for (const teamId of assignedTeamIds) {
    const teamFeatures = assignedPlanned.filter((f) => f.teamId === teamId)
    rows.push(
      ...sectionWithFeatures(
        {
          id: `team-${teamId}`,
          label: teamMap[teamId]?.name ?? 'Team',
          count: teamFeatures.length,
        },
        teamFeatures,
        collapsedSections,
      ),
    )
  }

  const orphanAssigned = assignedPlanned.filter(
    (f) => f.assignmentStatus === 'ok' && !assignedTeamIds.includes(f.teamId),
  )
  const reassignmentItems = [
    ...needsReassignment,
    ...orphanAssigned.filter((f) => !needsReassignment.some((n) => n.id === f.id)),
  ]
  if (reassignmentItems.length) {
    rows.push(
      ...sectionWithFeatures(
        needsReassignmentSection(reassignmentItems),
        reassignmentItems,
        collapsedSections,
      ),
    )
  }

  return rows
}

export function buildTimelineRows(
  features,
  {
    viewMode,
    filterTeamId,
    teams,
    projectTeams,
    projectId,
    collapsedSections = [],
  },
) {
  const projectFeatures = features.filter((f) => f.projectId === projectId)
  const assignedTeamIds = projectTeams
    .filter((pt) => pt.projectId === projectId)
    .map((pt) => pt.teamId)

  const teamMap = Object.fromEntries(teams.map((t) => [t.id, t]))

  const backlog = projectFeatures.filter((f) => f.planningStatus === 'backlog')
  const planned = projectFeatures.filter((f) => f.planningStatus === 'planned')
  const needsReassignment = planned.filter((f) => f.assignmentStatus === 'team_unassigned')
  const assignedPlanned = planned.filter((f) => f.assignmentStatus === 'ok')

  const backlogSection = {
    id: 'backlog',
    label: 'Backlog',
    count: backlog.length,
  }

  if (viewMode === 'backlog') {
    if (!backlog.length) return []
    return sectionWithFeatures(backlogSection, backlog, collapsedSections)
  }

  if (filterTeamId && viewMode !== 'backlog') {
    const matched = assignedPlanned.filter((f) => f.teamId === filterTeamId)
    const rows = [
      ...sectionWithFeatures(
        {
          id: `team-${filterTeamId}`,
          label: teamMap[filterTeamId]?.name ?? 'Team',
          count: matched.length,
        },
        matched,
        collapsedSections,
      ),
    ]
    if (backlog.length) {
      rows.push(...sectionWithFeatures(backlogSection, backlog, collapsedSections))
    }
    if (needsReassignment.length) {
      rows.push(
        ...sectionWithFeatures(needsReassignmentSection(needsReassignment), needsReassignment, collapsedSections),
      )
    }
    return rows
  }

  const rows = buildTeamGroupedRows({
    backlog,
    assignedPlanned,
    needsReassignment,
    assignedTeamIds,
    teamMap,
    collapsedSections,
  })

  if (!rows.length && projectFeatures.length) {
    return featureRows(projectFeatures)
  }

  return rows
}

export function rowsToFeatures(rows) {
  return rows.filter((r) => r.type === 'feature').map((r) => r.feature)
}

export function allSectionIdsInRows(rows) {
  return rows.filter((r) => r.type === 'section').map((r) => r.id)
}
