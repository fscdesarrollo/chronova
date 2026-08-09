import {
  buildCalendarFromPlan,
  getDefaultFeatureDatesFromPlan,
} from './utils/iterationPlans'

export const DEFAULT_PROJECT_ID = 'proj-carb'
export const DEFAULT_PLAN_ID = 'plan-carb-2026'

export const seedProjects = [
  { id: DEFAULT_PROJECT_ID, name: 'CARB Platform', createdAt: new Date().toISOString() },
]

export const seedTeams = [
  { id: 'carb-dp', name: 'CARB Data Platform', createdAt: new Date().toISOString() },
  { id: 'carb-api', name: 'API Integration Team', createdAt: new Date().toISOString() },
]

export const seedProjectTeams = [
  { projectId: DEFAULT_PROJECT_ID, teamId: 'carb-dp' },
  { projectId: DEFAULT_PROJECT_ID, teamId: 'carb-api' },
]

export const seedProducts = [
  { id: 'prod-a', name: 'Product A', color: '#3B82F6', createdAt: new Date().toISOString() },
  { id: 'prod-b', name: 'Product B', color: '#10B981', createdAt: new Date().toISOString() },
  { id: 'prod-c', name: 'Product C', color: '#FB923C', createdAt: new Date().toISOString() },
  { id: 'prod-d', name: 'Product D', color: '#8B5CF6', createdAt: new Date().toISOString() },
]

export const seedProjectProducts = seedProducts.map((p) => ({
  projectId: DEFAULT_PROJECT_ID,
  productId: p.id,
}))

export const teams = seedTeams
export const products = seedProducts

export const seedIterationPlans = [
  {
    id: DEFAULT_PLAN_ID,
    name: 'CARB ART 2026',
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

export const seedProjectIterationPlans = [
  { projectId: DEFAULT_PROJECT_ID, planId: DEFAULT_PLAN_ID },
]

const seedCalendar = buildCalendarFromPlan(seedTimeboxes, seedSprints)
export const weekCalendar = seedCalendar.weeks
export const PI_START_WEEK_MAP = seedCalendar.piWeekMap
export const TOTAL_WEEKS = seedCalendar.totalWeeks
export const programIncrements = seedCalendar.timeboxes
export const sprints = seedCalendar.sprints

export const CURRENT_PI_ID = '26.3'
export const CURRENT_PI_START_WEEK = PI_START_WEEK_MAP[CURRENT_PI_ID] ?? 0

function seedFeature(id, name, productId, startWeekOffset, duration, completed, userStories = []) {
  const startWeek = CURRENT_PI_START_WEEK + startWeekOffset
  const endWeek = startWeek + duration - 1
  const startDate = weekCalendar[startWeek].startDate
  const targetDate = weekCalendar[endWeek].endDate
  const storyPoints = userStories.reduce((sum, us) => sum + (us.storyPoints || 0), 0)

  return {
    id,
    projectId: DEFAULT_PROJECT_ID,
    teamId: 'carb-dp',
    productId,
    name,
    startDate,
    targetDate,
    completed,
    crossPi: false,
    assignmentStatus: 'ok',
    storyPoints,
    userStories,
    sortOrder: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export const seedFeatures = [
  seedFeature(1, 'Terminal Report - Production Dashboard', 'prod-a', 0, 5, false, [
    { id: 1, title: 'Dashboard layout', storyPoints: 5 },
    { id: 2, title: 'Data connectors', storyPoints: 8 },
  ]),
  seedFeature(2, 'CARB at Berth - Vessel Calculator', 'prod-b', 1, 4, true, [
    { id: 1, title: 'Calculator core', storyPoints: 8 },
  ]),
  seedFeature(3, 'Emissions Data Pipeline v2', 'prod-c', 2, 6, false, [
    { id: 1, title: 'Pipeline refactor', storyPoints: 13 },
    { id: 2, title: 'Validation layer', storyPoints: 8 },
  ]),
  seedFeature(4, 'Port Authority API Integration', 'prod-d', 3, 3, false),
  seedFeature(5, 'Vessel Tracking Real-time Feed', 'prod-a', 4, 4, false),
  seedFeature(6, 'Compliance Report Generator', 'prod-b', 5, 5, false),
  seedFeature(7, 'Carbon Credit Allocation Module', 'prod-c', 6, 4, false),
  seedFeature(8, 'Berth Scheduling Optimizer', 'prod-d', 7, 3, true),
  seedFeature(9, 'Data Quality Monitoring Suite', 'prod-a', 8, 5, false),
  seedFeature(10, 'Fleet Analytics Dashboard', 'prod-b', 9, 4, false),
  seedFeature(11, 'Regulatory Submission Portal', 'prod-c', 10, 3, false),
  seedFeature(12, 'Innovation Hub - AI Forecasting', 'prod-d', 11, 2, false),
  seedFeature(13, 'Innovation Hub - ML Model Training', 'prod-a', 11, 2, false),
  seedFeature(14, 'PI Planning - Capacity Review', 'prod-b', 12, 1, false),
  seedFeature(15, 'PI Planning - Dependency Mapping', 'prod-c', 12, 1, false),
  seedFeature(16, 'Historical Data Migration', 'prod-a', 0, 3, true),
  seedFeature(17, 'Notification Service Upgrade', 'prod-d', 2, 2, false),
  seedFeature(18, 'Audit Trail Enhancement', 'prod-b', 4, 4, false),
  {
    ...seedFeature(19, 'Cross-PI Data Lake Migration', 'prod-a', 11, 3, false),
    targetDate: weekCalendar[CURRENT_PI_START_WEEK + 14].endDate,
    crossPi: true,
  },
].map((f, i) => ({ ...f, sortOrder: i }))

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
