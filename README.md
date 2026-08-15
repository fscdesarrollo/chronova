# Chronova

**Adaptive Planning Timeline** — *See time. Shape what comes next.*

A lightweight web app for tracking team features across Program Increments (PI) using a Gantt-style timeline. Oriented to executives and stakeholders — not a replacement for Jira or Azure DevOps.

See [docs/brand.md](docs/brand.md) for the name meaning and product philosophy.  
Full behavior and data model: [docs/project.md](docs/project.md).  
Sample import file: [docs/feature-import-example.csv](docs/feature-import-example.csv).

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

**First visit:** lands on **Home** (brand landing). **Returning users:** opens the last page visited (e.g. Timeline).

To reset onboarding and test first-run UX, clear `chronova-navigation`, `chronova-onboarding`, and `chronova-data` in browser `localStorage`. Demo CARB seed data is no longer shipped; workspaces saved before this change reset to a calendar-only start (PI 26.2 onward).

## Import a feature list

On **Timeline**, use **Import** (next to Add Feature).

1. Download [docs/feature-import-example.csv](docs/feature-import-example.csv) (or use **Download example CSV** in the wizard — it is the same file).
2. Open it in Excel, Google Sheets, or Numbers. Keep the header row. Replace the sample features with yours.
3. Save as **CSV UTF-8** (Excel: File → Save As → CSV UTF-8). `.xlsx` is not imported directly.
4. In the wizard, upload the file or paste the rows. Match columns, review products and teams, then confirm.

The example includes planned features (team + dates) and backlog rows (empty team/dates). Use the same **team name** you entered in setup (the sample uses `Platform Team`) so those rows land on the Gantt. Products in the file (`Platform`, `Analytics`, `Integrations`, `Portal`) are created and assigned to your project on confirm.

Required columns: **Feature name** and **Product**. Team, dates, and notes are optional.

## Highlights

- **Home** — brand hero (`TimeHorizon`), animated wordmark, product tour entry
- **Timeline (Gantt)** — main planning view; drag bars, team sections, backlog, TODAY marker, infinite day scroll (weekends shaded)
- **Iterations** — reusable SAFe calendars (PIs, sprints, per-sprint day/week/month scale)
- **Projects / Teams / Products** — configuration pages that feed the Gantt
- **Product tour** (`app-intro`) — spotlight walkthrough with real navigation; relaunchable from Home
- **Setup wizard** — project + team, then import a feature list (or skip to an empty Gantt)
- **Import features** — CSV or paste from Excel; preview products, teams, and rows before confirming
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
  utils/            dates, storage, navigation, onboarding, ganttReadiness, dynamicCalendar, migration, featureImport, …
  data.js           Seed data
docs/               Product documentation + [feature-import-example.csv](docs/feature-import-example.csv)
```
