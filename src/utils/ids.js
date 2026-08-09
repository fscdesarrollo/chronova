let counters = { project: 1, team: 1, product: 1, plan: 1, timebox: 1, sprint: 1 }

export function resetIdCounters(state) {
  const maxProject = Math.max(0, ...(state.projects || []).map((p) => numFromId(p.id, 'proj')))
  const maxTeam = Math.max(0, ...(state.teams || []).map((t) => numFromId(t.id, 'team')))
  const maxProduct = Math.max(0, ...(state.products || []).map((p) => numFromId(p.id, 'prod')))
  const maxPlan = Math.max(0, ...(state.iterationPlans || []).map((p) => numFromId(p.id, 'plan')))
  const maxTimebox = Math.max(0, ...(state.timeboxes || []).map((t) => numFromId(t.id, 'tb')))
  const maxSprint = Math.max(0, ...(state.sprints || []).map((s) => numFromId(s.id, 'spr')))
  counters = {
    project: maxProject + 1,
    team: maxTeam + 1,
    product: maxProduct + 1,
    plan: maxPlan + 1,
    timebox: maxTimebox + 1,
    sprint: maxSprint + 1,
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

export function nextPlanId() {
  return `plan-${counters.plan++}`
}

export function nextTimeboxId() {
  return `tb-${counters.timebox++}`
}

export function nextSprintId() {
  return `spr-${counters.sprint++}`
}

let markerCounter = 1

export function resetMarkerCounter(markers = []) {
  const max = Math.max(0, ...markers.map((m) => numFromId(m.id, 'marker')))
  markerCounter = max + 1
}

export function nextMarkerId() {
  return `marker-${markerCounter++}`
}

/** Parse legacy `F-1042` or numeric ids into a positive integer identity. */
export function parseFeatureId(id) {
  if (typeof id === 'number' && Number.isInteger(id) && id > 0) return id
  const s = String(id ?? '').trim()
  const fromPrefixed = s.match(/^F-(\d+)$/i)
  if (fromPrefixed) return parseInt(fromPrefixed[1], 10)
  if (/^\d+$/.test(s)) {
    const n = parseInt(s, 10)
    return n > 0 ? n : null
  }
  return null
}

/** Next auto-increment feature id (frontend stand-in for DB identity). */
export function getNextFeatureId(features = []) {
  const nums = features.map((f) => parseFeatureId(f.id)).filter((n) => n != null)
  return nums.length > 0 ? Math.max(...nums) + 1 : 1
}
