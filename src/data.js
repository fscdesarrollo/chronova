import { buildWeekCalendar } from './utils/weekCalendar'
import { addWeeks } from './utils/dates'

const DEV = 'bg-sprint-dev'
const DEV2 = 'bg-sprint-dev2'
const IP = 'bg-sprint-innovation'

function sprint(id, range, bg, weeks) {
  return { id, name: id, range, bg, weeks }
}

function week(label, date) {
  return { label, date }
}

export const DEFAULT_PROJECT_ID = 'proj-carb'

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

// Legacy exports for backward compatibility
export const teams = seedTeams
export const products = seedProducts

export const programIncrements = [
  {
    id: '26.2',
    name: 'PI 26.2',
    range: '2026-05-06 – 2026-08-04',
    shortRange: 'May 06 – Aug 04',
    sprints: [
      sprint('26.2.1', 'May 06 – May 26', DEV, [
        week('Week 1', 'May 06'),
        week('Week 2', 'May 13'),
        week('Week 3', 'May 20'),
      ]),
      sprint('26.2.2', 'May 27 – Jun 16', DEV2, [
        week('Week 1', 'May 27'),
        week('Week 2', 'Jun 03'),
        week('Week 3', 'Jun 10'),
      ]),
      sprint('26.2.3', 'Jun 17 – Jul 07', DEV, [
        week('Week 1', 'Jun 17'),
        week('Week 2', 'Jun 24'),
        week('Week 3', 'Jul 01'),
      ]),
      sprint('26.2.4.IP', 'Jul 08 – Aug 04', IP, [
        week('Week 1', 'Jul 08'),
        week('Week 2', 'Jul 15'),
        week('Week 3', 'Jul 22'),
        week('Planning', 'Jul 29'),
      ]),
    ],
  },
  {
    id: '26.3',
    name: 'PI 26.3',
    range: '2026-08-05 – 2026-11-03',
    shortRange: 'Aug 05 – Nov 03',
    sprints: [
      sprint('26.3.1', 'Aug 05 – Aug 25', DEV, [
        week('Week 1', 'Aug 05'),
        week('Week 2', 'Aug 12'),
        week('Week 3', 'Aug 19'),
      ]),
      sprint('26.3.2', 'Aug 26 – Sep 15', DEV2, [
        week('Week 1', 'Aug 26'),
        week('Week 2', 'Sep 02'),
        week('Week 3', 'Sep 09'),
      ]),
      sprint('26.3.3', 'Sep 16 – Oct 06', DEV, [
        week('Week 1', 'Sep 16'),
        week('Week 2', 'Sep 23'),
        week('Week 3', 'Sep 30'),
      ]),
      sprint('26.3.4.IP', 'Oct 07 – Nov 03', IP, [
        week('Week 1', 'Oct 07'),
        week('Week 2', 'Oct 14'),
        week('Week 3', 'Oct 21'),
        week('Planning', 'Oct 28'),
      ]),
    ],
  },
  {
    id: '26.4',
    name: 'PI 26.4',
    range: '2026-11-04 – 2027-02-02',
    shortRange: 'Nov 04 – Feb 02',
    sprints: [
      sprint('26.4.1', 'Nov 04 – Nov 24', DEV, [
        week('Week 1', 'Nov 04'),
        week('Week 2', 'Nov 11'),
        week('Week 3', 'Nov 18'),
      ]),
      sprint('26.4.2', 'Nov 25 – Dec 15', DEV2, [
        week('Week 1', 'Nov 25'),
        week('Week 2', 'Dec 02'),
        week('Week 3', 'Dec 09'),
      ]),
      sprint('26.4.3', 'Dec 16 – Jan 05', DEV, [
        week('Week 1', 'Dec 16'),
        week('Week 2', 'Dec 23'),
        week('Week 3', 'Dec 30'),
      ]),
      sprint('26.4.4.IP', 'Jan 06 – Feb 02', IP, [
        week('Week 1', 'Jan 06'),
        week('Week 2', 'Jan 13'),
        week('Week 3', 'Jan 20'),
        week('Planning', 'Jan 27'),
      ]),
    ],
  },
]

const calendar = buildWeekCalendar(programIncrements)
export const weekCalendar = calendar.weeks
export const PI_START_WEEK_MAP = calendar.piWeekMap
export const TOTAL_WEEKS = calendar.totalWeeks

export const sprints = programIncrements.flatMap((pi) =>
  pi.sprints.map((s) => ({ ...s, piId: pi.id })),
)

export const CURRENT_PI_ID = '26.3'
export const CURRENT_PI_START_WEEK = PI_START_WEEK_MAP[CURRENT_PI_ID]

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
  seedFeature('F-1042', 'Terminal Report - Production Dashboard', 'prod-a', 0, 5, false, [
    { id: 1, title: 'Dashboard layout', storyPoints: 5 },
    { id: 2, title: 'Data connectors', storyPoints: 8 },
  ]),
  seedFeature('F-1087', 'CARB at Berth - Vessel Calculator', 'prod-b', 1, 4, true, [
    { id: 1, title: 'Calculator core', storyPoints: 8 },
  ]),
  seedFeature('F-1103', 'Emissions Data Pipeline v2', 'prod-c', 2, 6, false, [
    { id: 1, title: 'Pipeline refactor', storyPoints: 13 },
    { id: 2, title: 'Validation layer', storyPoints: 8 },
  ]),
  seedFeature('F-1118', 'Port Authority API Integration', 'prod-d', 3, 3, false),
  seedFeature('F-1125', 'Vessel Tracking Real-time Feed', 'prod-a', 4, 4, false),
  seedFeature('F-1131', 'Compliance Report Generator', 'prod-b', 5, 5, false),
  seedFeature('F-1140', 'Carbon Credit Allocation Module', 'prod-c', 6, 4, false),
  seedFeature('F-1148', 'Berth Scheduling Optimizer', 'prod-d', 7, 3, true),
  seedFeature('F-1155', 'Data Quality Monitoring Suite', 'prod-a', 8, 5, false),
  seedFeature('F-1162', 'Fleet Analytics Dashboard', 'prod-b', 9, 4, false),
  seedFeature('F-1170', 'Regulatory Submission Portal', 'prod-c', 10, 3, false),
  seedFeature('F-1178', 'Innovation Hub - AI Forecasting', 'prod-d', 11, 2, false),
  seedFeature('F-1185', 'Innovation Hub - ML Model Training', 'prod-a', 11, 2, false),
  seedFeature('F-1192', 'PI Planning - Capacity Review', 'prod-b', 12, 1, false),
  seedFeature('F-1198', 'PI Planning - Dependency Mapping', 'prod-c', 12, 1, false),
  seedFeature('F-1205', 'Historical Data Migration', 'prod-a', 0, 3, true),
  seedFeature('F-1210', 'Notification Service Upgrade', 'prod-d', 2, 2, false),
  seedFeature('F-1218', 'Audit Trail Enhancement', 'prod-b', 4, 4, false),
  {
    ...seedFeature('F-1225', 'Cross-PI Data Lake Migration', 'prod-a', 11, 3, false),
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

export function getNextFeatureId(features) {
  const nums = features
    .map((f) => parseInt(f.id.replace('F-', ''), 10))
    .filter((n) => !Number.isNaN(n))
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1042
  return `F-${next}`
}

export function getDefaultFeatureDates() {
  const piStart = weekCalendar[CURRENT_PI_START_WEEK].startDate
  return {
    startDate: piStart,
    targetDate: addWeeks(piStart, 1),
  }
}
