import {
  buildCalendarFromPlan,
  getDefaultFeatureDatesFromPlan,
} from './utils/iterationPlans'

/** Bump to drop demo localStorage and start from a calendar-only workspace. */
export const DATA_REVISION = 2

export const DEFAULT_PROJECT_ID = ''
export const DEFAULT_PLAN_ID = 'plan-safe-2026'

export const seedProjects = []
export const seedTeams = []
export const seedProjectTeams = []
export const seedProducts = []
export const seedProjectProducts = []
export const seedFeatures = []

export const teams = seedTeams
export const products = seedProducts

export const seedIterationPlans = [
  {
    id: DEFAULT_PLAN_ID,
    name: 'SAFe 2026',
    methodology: 'safe',
    createdAt: new Date().toISOString(),
  },
]

export const seedTimeboxes = [
  {
    id: '26.2',
    planId: DEFAULT_PLAN_ID,
    name: 'PI 26.2',
    startDate: '2026-05-06',
    endDate: '2026-08-04',
    sortOrder: 0,
  },
  {
    id: '26.3',
    planId: DEFAULT_PLAN_ID,
    name: 'PI 26.3',
    startDate: '2026-08-05',
    endDate: '2026-11-03',
    sortOrder: 1,
  },
  {
    id: '26.4',
    planId: DEFAULT_PLAN_ID,
    name: 'PI 26.4',
    startDate: '2026-11-04',
    endDate: '2027-02-02',
    sortOrder: 2,
  },
]

function seedSprint(id, timeboxId, number, startDate, endDate, weekCount, type = 'DEVELOPMENT') {
  return {
    id,
    timeboxId,
    number,
    name: id,
    type,
    scale: 'week',
    startDate,
    endDate,
    weekCount,
  }
}

export const seedSprints = [
  seedSprint('26.2.1', '26.2', 1, '2026-05-06', '2026-05-26', 3),
  seedSprint('26.2.2', '26.2', 2, '2026-05-27', '2026-06-16', 3),
  seedSprint('26.2.3', '26.2', 3, '2026-06-17', '2026-07-07', 3),
  seedSprint('26.2.4', '26.2', 4, '2026-07-08', '2026-08-04', 4, 'INNOVATION'),

  seedSprint('26.3.1', '26.3', 1, '2026-08-05', '2026-08-25', 3),
  seedSprint('26.3.2', '26.3', 2, '2026-08-26', '2026-09-15', 3),
  seedSprint('26.3.3', '26.3', 3, '2026-09-16', '2026-10-06', 3),
  seedSprint('26.3.4', '26.3', 4, '2026-10-07', '2026-11-03', 4, 'INNOVATION'),

  seedSprint('26.4.1', '26.4', 1, '2026-11-04', '2026-11-24', 3),
  seedSprint('26.4.2', '26.4', 2, '2026-11-25', '2026-12-15', 3),
  seedSprint('26.4.3', '26.4', 3, '2026-12-16', '2027-01-05', 3),
  seedSprint('26.4.4', '26.4', 4, '2027-01-06', '2027-02-02', 4, 'INNOVATION'),
]

export const seedProjectIterationPlans = []

const seedCalendar = buildCalendarFromPlan(seedTimeboxes, seedSprints)
export const weekCalendar = seedCalendar.weeks
export const PI_START_WEEK_MAP = seedCalendar.piWeekMap
export const TOTAL_WEEKS = seedCalendar.totalWeeks
export const programIncrements = seedCalendar.timeboxes
export const sprints = seedCalendar.sprints

export const CURRENT_PI_ID = '26.3'
export const CURRENT_PI_START_WEEK = PI_START_WEEK_MAP[CURRENT_PI_ID] ?? 0

export function getProductById(productId, productList = seedProducts) {
  return productList.find((p) => p.id === productId)
}

export function getProductsForProject(projectId, productList = seedProducts, projectProducts = seedProjectProducts) {
  const ids = new Set(
    projectProducts.filter((pp) => pp.projectId === projectId).map((pp) => pp.productId),
  )
  return productList.filter((p) => ids.has(p.id))
}

/** @deprecated use getProductsForProject */
export function getProductsForTeam(_teamId, productList = seedProducts) {
  return productList
}

export function getDefaultFeatureDates() {
  return getDefaultFeatureDatesFromPlan(seedTimeboxes.filter((t) => t.planId === DEFAULT_PLAN_ID))
}
