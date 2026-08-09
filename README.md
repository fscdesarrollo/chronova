# Chronova

**Adaptive Planning Timeline** — *See time. Shape what comes next.*

A lightweight web app for tracking team features across Program Increments (PI) using a Gantt-style timeline. Oriented to executives and stakeholders — not a replacement for Jira or Azure DevOps.

See [docs/brand.md](docs/brand.md) for the name meaning and product philosophy.  
Full behavior and data model: [docs/project.md](docs/project.md).

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

**First visit:** lands on **Home** (brand landing). **Returning users:** opens the last page visited (e.g. Timeline).

To reset onboarding and test first-run UX, clear `chronova-navigation` and `chronova-onboarding` in browser `localStorage`.

## Highlights

- **Home** — brand hero (`TimeHorizon`), animated wordmark, product tour entry
- **Timeline (Gantt)** — main planning view; drag bars, team sections, backlog, TODAY marker
- **Iterations** — reusable SAFe calendars (PIs, sprints, per-sprint day/week/month scale)
- **Projects / Teams / Products** — configuration pages that feed the Gantt
- **Product tour** (`app-intro`) — spotlight walkthrough with real navigation; relaunchable from Home
- **Setup wizard** — project + calendar + team + first feature on the Gantt (on demand)
- **User display name** — sidebar field for audit attribution (no login)

## Stack

- React 18 + Vite 6
- Tailwind CSS
- Lucide React icons
- Client-side persistence (`localStorage`)

## Project structure

```
src/
  components/       UI (Sidebar, TopNav, TimelineGrid, pages, onboarding/)
  components/onboarding/  SetupWizard, TourRunner, GanttSetupChecklist, TourCtaHighlight
  tours/            Tour definitions (registry pattern for per-page tours)
  hooks/            useTimelineState, useFeatureDrag, useLeftColResize
  utils/            dates, storage, navigation, onboarding, ganttReadiness, migration, …
  data.js           Seed data
docs/               Product documentation
```
