/** @typedef {'navigate' | 'action'} TourStepType */

/**
 * @typedef {Object} TourStep
 * @property {string} id
 * @property {TourStepType} [type]
 * @property {string} [page]
 * @property {string} [target]
 * @property {string} title
 * @property {string} body
 * @property {string} [action]
 */

/** @type {Record<string, { id: string, label: string, steps: TourStep[] }>} */
export const TOURS = {
  'app-intro': {
    id: 'app-intro',
    label: 'Welcome tour',
    steps: [
      {
        id: 'welcome',
        page: 'home',
        target: '[data-tour="home-hero"]',
        title: 'Welcome to Chronova',
        body: 'An adaptive planning timeline — see time, preserve the baseline, and adapt what comes next.',
      },
      {
        id: 'home-actions',
        page: 'home',
        target: '[data-tour="home-ctas"]',
        title: 'Your starting points',
        body: 'Take a tour, set up a project, or jump straight to the Timeline when you are ready.',
      },
      {
        id: 'sidebar',
        page: 'timeline',
        target: '[data-tour="sidebar-nav"]',
        title: 'Navigation',
        body: 'Home and Timeline are your main views. Configuration pages live in the group below.',
      },
      {
        id: 'timeline',
        page: 'timeline',
        target: '[data-tour="timeline-main"]',
        title: 'The Gantt',
        body: 'This is the center of Chronova. Plan features across sprints, drag bars, and track deviations.',
      },
      {
        id: 'import',
        page: 'timeline',
        target: '[data-tour="import-features"]',
        title: 'Import a feature list',
        body: 'Bring work from Excel or Google Sheets. Download the example CSV, map columns, match products and teams, then preview before anything is saved. New products are created and assigned to this project.',
      },
      {
        id: 'projects',
        page: 'projects',
        target: '[data-tour="page-main"]',
        title: 'Projects',
        body: 'Projects are the primary unit of work. Each project gets a calendar, teams, and products.',
      },
      {
        id: 'iterations',
        page: 'iterations',
        target: '[data-tour="page-main"]',
        title: 'Iterations',
        body: 'Iteration plans define your PI calendar — timeboxes and sprints that power the timeline axis.',
      },
      {
        id: 'teams',
        page: 'teams',
        target: '[data-tour="page-main"]',
        title: 'Teams',
        body: 'Teams own features on the Gantt. Assign them to projects to organize the timeline by squad.',
      },
      {
        id: 'products',
        page: 'products',
        target: '[data-tour="page-main"]',
        title: 'Products',
        body: 'Products are visual labels (name + color) to group features — not a full backlog hierarchy.',
      },
      {
        id: 'user',
        page: 'timeline',
        target: '[data-tour="sidebar-user"]',
        title: 'Your display name',
        body: 'Set who is making changes. This is for audit history only — no accounts or permissions yet.',
      },
      {
        id: 'setup-prompt',
        type: 'action',
        action: 'setup-prompt',
        title: 'Ready to plan?',
        body: 'Run the setup wizard to create a project and team, then import a feature list onto the Gantt.',
      },
    ],
  },
}

export function getTour(tourId) {
  return TOURS[tourId] ?? null
}
