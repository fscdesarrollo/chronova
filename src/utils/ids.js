let counters = { project: 1, team: 1, product: 1 }

export function resetIdCounters(state) {
  const maxProject = Math.max(0, ...(state.projects || []).map((p) => numFromId(p.id, 'proj')))
  const maxTeam = Math.max(0, ...(state.teams || []).map((t) => numFromId(t.id, 'team')))
  const maxProduct = Math.max(0, ...(state.products || []).map((p) => numFromId(p.id, 'prod')))
  counters = {
    project: maxProject + 1,
    team: maxTeam + 1,
    product: maxProduct + 1,
  }
}

function numFromId(id, prefix) {
  const n = parseInt(String(id).replace(`${prefix}-`, ''), 10)
  return Number.isNaN(n) ? 0 : n
}

export function nextProjectId() {
  return `proj-${counters.project++}`
}

export function nextTeamId() {
  return `team-${counters.team++}`
}

export function nextProductId() {
  return `prod-${counters.product++}`
}

let markerCounter = 1

export function resetMarkerCounter(markers = []) {
  const max = Math.max(0, ...markers.map((m) => numFromId(m.id, 'marker')))
  markerCounter = max + 1
}

export function nextMarkerId() {
  return `marker-${markerCounter++}`
}
