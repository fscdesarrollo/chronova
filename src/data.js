const DEV = 'bg-sprint-dev'
const DEV2 = 'bg-sprint-dev2'
const IP = 'bg-sprint-innovation'

function sprint(id, range, bg, weeks) {
  return { id, name: id, range, bg, weeks }
}

function week(label, date) {
  return { label, date }
}

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
        week('Week 4', 'Jul 29'),
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
        week('Week 4', 'Oct 28'),
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
        week('Week 4', 'Jan 27'),
      ]),
    ],
  },
]

export const sprints = programIncrements.flatMap((pi) =>
  pi.sprints.map((s) => ({ ...s, piId: pi.id })),
)

export const TOTAL_WEEKS = sprints.reduce((sum, s) => sum + s.weeks.length, 0)

let _weekCursor = 0
export const PI_START_WEEK_MAP = {}
for (const pi of programIncrements) {
  PI_START_WEEK_MAP[pi.id] = _weekCursor
  const weeks = pi.sprints.reduce((n, s) => n + s.weeks.length, 0)
  pi.weekCount = weeks
  pi.startWeek = _weekCursor
  _weekCursor += weeks
}

export const CURRENT_PI_ID = '26.3'
export const CURRENT_PI_START_WEEK = PI_START_WEEK_MAP[CURRENT_PI_ID]

// Features are placed on PI 26.3 (offset by prior PI weeks)
const W = CURRENT_PI_START_WEEK

export const features = [
  {
    id: 'F-1042',
    name: 'Terminal Report - Production Dashboard',
    status: 'blue',
    deviation: 13,
    startWeek: W + 0,
    duration: 5,
    color: 'bg-blue-500',
    completed: false,
    storyPoints: 13,
  },
  {
    id: 'F-1087',
    name: 'CARB at Berth - Vessel Calculator',
    status: 'green',
    deviation: 8,
    startWeek: W + 1,
    duration: 4,
    color: 'bg-emerald-500',
    completed: true,
    storyPoints: 8,
  },
  {
    id: 'F-1103',
    name: 'Emissions Data Pipeline v2',
    status: 'orange',
    deviation: 5,
    startWeek: W + 2,
    duration: 6,
    color: 'bg-orange-400',
    completed: false,
    storyPoints: 21,
  },
  {
    id: 'F-1118',
    name: 'Port Authority API Integration',
    status: 'purple',
    deviation: null,
    startWeek: W + 3,
    duration: 3,
    color: 'bg-violet-500',
    completed: false,
    storyPoints: 5,
  },
  {
    id: 'F-1125',
    name: 'Vessel Tracking Real-time Feed',
    status: 'blue',
    deviation: null,
    startWeek: W + 4,
    duration: 4,
    color: 'bg-sky-500',
    completed: false,
    storyPoints: 13,
  },
  {
    id: 'F-1131',
    name: 'Compliance Report Generator',
    status: 'green',
    deviation: 3,
    startWeek: W + 5,
    duration: 5,
    color: 'bg-teal-500',
    completed: false,
    storyPoints: 8,
  },
  {
    id: 'F-1140',
    name: 'Carbon Credit Allocation Module',
    status: 'orange',
    deviation: 13,
    startWeek: W + 6,
    duration: 4,
    color: 'bg-amber-500',
    completed: false,
    storyPoints: 13,
  },
  {
    id: 'F-1148',
    name: 'Berth Scheduling Optimizer',
    status: 'purple',
    deviation: null,
    startWeek: W + 7,
    duration: 3,
    color: 'bg-fuchsia-500',
    completed: true,
    storyPoints: 5,
  },
  {
    id: 'F-1155',
    name: 'Data Quality Monitoring Suite',
    status: 'blue',
    deviation: 6,
    startWeek: W + 8,
    duration: 5,
    color: 'bg-indigo-500',
    completed: false,
    storyPoints: 21,
  },
  {
    id: 'F-1162',
    name: 'Fleet Analytics Dashboard',
    status: 'green',
    deviation: null,
    startWeek: W + 9,
    duration: 4,
    color: 'bg-lime-500',
    completed: false,
    storyPoints: 8,
  },
  {
    id: 'F-1170',
    name: 'Regulatory Submission Portal',
    status: 'orange',
    deviation: 2,
    startWeek: W + 10,
    duration: 3,
    color: 'bg-rose-400',
    completed: false,
    storyPoints: 5,
  },
  {
    id: 'F-1178',
    name: 'Innovation Hub - AI Forecasting',
    status: 'purple',
    deviation: null,
    startWeek: W + 11,
    duration: 2,
    color: 'bg-purple-500',
    completed: false,
    storyPoints: 13,
  },
  {
    id: 'F-1185',
    name: 'Innovation Hub - ML Model Training',
    status: 'blue',
    deviation: null,
    startWeek: W + 11,
    duration: 2,
    color: 'bg-cyan-500',
    completed: false,
    storyPoints: 8,
  },
  {
    id: 'F-1192',
    name: 'PI Planning - Capacity Review',
    status: 'green',
    deviation: null,
    startWeek: W + 12,
    duration: 1,
    color: 'bg-green-600',
    completed: false,
    storyPoints: 3,
  },
  {
    id: 'F-1198',
    name: 'PI Planning - Dependency Mapping',
    status: 'orange',
    deviation: null,
    startWeek: W + 12,
    duration: 1,
    color: 'bg-yellow-500',
    completed: false,
    storyPoints: 2,
  },
  {
    id: 'F-1205',
    name: 'Historical Data Migration',
    status: 'blue',
    deviation: 4,
    startWeek: W + 0,
    duration: 3,
    color: 'bg-blue-400',
    completed: true,
    storyPoints: 8,
  },
  {
    id: 'F-1210',
    name: 'Notification Service Upgrade',
    status: 'purple',
    deviation: null,
    startWeek: W + 2,
    duration: 2,
    color: 'bg-pink-500',
    completed: false,
    storyPoints: 5,
  },
  {
    id: 'F-1218',
    name: 'Audit Trail Enhancement',
    status: 'green',
    deviation: 7,
    startWeek: W + 4,
    duration: 4,
    color: 'bg-emerald-600',
    completed: false,
    storyPoints: 8,
  },
]

export const statusColors = {
  blue: 'bg-blue-500',
  green: 'bg-emerald-500',
  orange: 'bg-orange-400',
  purple: 'bg-violet-500',
}
