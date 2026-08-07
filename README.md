# Chronova

**Adaptive Planning Timeline** — *See time. Shape what comes next.*

A lightweight internal web app for tracking team features across Program Increments (PI) using a simple Gantt-style timeline. Oriented to executives and stakeholders — not a replacement for Jira or Azure DevOps.

See [docs/brand.md](docs/brand.md) for the name meaning and product philosophy.

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Features

- Dark sidebar navigation with Timeline active state
- Top bar with Current/Baseline toggle and deviation count
- Sprint/week timeline header (S1–S5)
- Feature rows with status dots, IDs, and deviation warnings
- Colored Gantt bars with completion indicators
- Footer summary (features, story points, moved count)

## Stack

- React 18 + Vite
- Tailwind CSS
- Lucide React icons
