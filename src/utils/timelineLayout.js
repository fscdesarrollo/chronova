import { ROW_HEIGHT, SECTION_ROW_HEIGHT } from '../constants'

export function rowHeightFor(row) {
  return row.type === 'section' ? SECTION_ROW_HEIGHT : ROW_HEIGHT
}

export function visualRowTop(timelineRows, visualRowIndex) {
  let y = 0
  for (let i = 0; i < visualRowIndex; i++) {
    y += rowHeightFor(timelineRows[i])
  }
  return y
}

export function visualRowIndexFromY(timelineRows, y) {
  let acc = 0
  for (let i = 0; i < timelineRows.length; i++) {
    const h = rowHeightFor(timelineRows[i])
    if (y < acc + h) return i
    acc += h
  }
  return Math.max(0, timelineRows.length - 1)
}

export function findSectionForVisualIndex(timelineRows, visualRowIndex) {
  for (let i = visualRowIndex; i >= 0; i--) {
    if (timelineRows[i].type === 'section') return timelineRows[i]
  }
  return null
}

/**
 * Resolve team target when dropping at a visual row.
 * Single-team view: only allows move to Needs reassignment.
 */
export function resolveDropTeamTarget(section, { viewMode, filterTeamId }) {
  if (!section) return { teamId: undefined, unassign: false }

  if (viewMode === 'team' && filterTeamId) {
    if (section.id === 'needs-reassignment') {
      return { teamId: null, unassign: true }
    }
    return { teamId: filterTeamId, unassign: false }
  }

  if (section.id === 'needs-reassignment') {
    return { teamId: null, unassign: true }
  }

  if (section.id === 'backlog') {
    return { teamId: null, unassign: false, toBacklog: true }
  }

  if (section.id?.startsWith('team-')) {
    return { teamId: section.id.slice('team-'.length), unassign: false }
  }

  return { teamId: undefined, unassign: false }
}

/** Reorder feature ids after a drop at visualRowIndex (excludes dragged id first). */
export function reorderFeatureIdsAfterDrop(timelineRows, draggedId, visualRowIndex) {
  const ids = timelineRows
    .filter((r) => r.type === 'feature')
    .map((r) => r.feature.id)
    .filter((id) => id !== draggedId)

  let insertAt = 0
  for (let i = 0; i < visualRowIndex && i < timelineRows.length; i++) {
    const row = timelineRows[i]
    if (row.type === 'feature' && row.feature.id !== draggedId) {
      insertAt++
    }
  }

  ids.splice(insertAt, 0, draggedId)
  return ids
}

export function applyProjectFeatureOrder(allFeatures, projectId, orderedIds) {
  const orderMap = new Map(orderedIds.map((id, i) => [id, i]))
  const projectFeatures = allFeatures.filter((f) => f.projectId === projectId)
  const otherFeatures = allFeatures.filter((f) => f.projectId !== projectId)

  const minOrder = projectFeatures.length
    ? Math.min(...projectFeatures.map((f) => f.sortOrder))
    : 0

  const reorderedProject = [...projectFeatures].sort((a, b) => {
    const ai = orderMap.has(a.id) ? orderMap.get(a.id) : 9999
    const bi = orderMap.has(b.id) ? orderMap.get(b.id) : 9999
    return ai - bi
  })

  const updatedProject = reorderedProject.map((f, i) => ({
    ...f,
    sortOrder: minOrder + i,
  }))

  return [...otherFeatures, ...updatedProject].sort((a, b) => a.sortOrder - b.sortOrder)
}
