# PI Timeline — Project Definition

**Codename:** pi-timeline

A lightweight internal web app for tracking team features across Program Increments (PI) using a simple Gantt-style timeline. Oriented to executives and stakeholders — not a replacement for Jira or Azure DevOps.

This document is the single source of truth for product behavior and technical conventions. Hosting details will live in a separate proposal when defined.

**Status:** in refinement — all current MVPs are frontend-only (no backend). Do not implement backend/API/DB until MVP 3 is explicitly scoped.

**Current focus:** MVP 1.5 — project hierarchy, navigation, and UX (`localStorage` persistence).

---

## Background

Today PI tracking is maintained in **Excel**. Updating dates, moving bars, and comparing the original plan against the current state is slow, error-prone, and hard to share with executives.

The goal is **not** a full project-management tool. It is the simplest possible Gantt view to answer, in under 30 seconds:

- What features are being worked on in this project?
- Which team owns each feature?
- In which sprint/week do they fall?
- Did anything move from the original plan — and why?

A functional prototype already exists in this repository (React + Vite + Tailwind) validating layout, timeline header, feature rows, Gantt bars, and drag-and-drop interactions.

---

## Design principles

1. **Executive clarity first** — if an executive cannot understand PI status in 30 seconds, there is too much detail.
2. **Simplicity over completeness** — high-level feature tracking, not user-story or developer-level detail.
3. **Visual at a glance** — Gantt bars, product colors, deviation warnings, and baseline ghosts communicate state without reading spreadsheets.
4. **Traceability** — when a feature moves, the Gantt should leave a footprint: who moved it, when, and why.
5. **Low maintenance** — replace Excel friction with drag-and-drop and automatic calculations (SPs, deviations).
6. **Project-centric view** — project is the primary unit of organization; multiple teams can work within one project; products provide visual grouping, not separate screens.

---

## Language and conventions

| Layer | Language |
|-------|----------|
| UI (labels, messages, modals) | **English** |
| Code (identifiers, comments, commit messages) | **English** |
| Documentation (`docs/`, README) | **English** |

---

## Users and access

- **Audience:** executives, Product Owners, RTEs, and technical leads within the company.
- **Authentication:** none in v1.
- **Actor identification:** a simple display name stored in `localStorage` — no user accounts, no roles.
- **Permissions:** everyone can view and edit. All changes are recorded with actor + timestamp in the audit log.
- **User management:** explicitly out of scope for v1.

---

## Scope

### In scope

#### Timeline and calendar (SAFe)

The organization operates under **SAFe**. Each Program Increment (PI) spans ~3 months and contains 4 sprints:

| Sprint | Duration | Purpose |
|--------|----------|---------|
| Sprint 1 | 3 weeks | Development |
| Sprint 2 | 3 weeks | Development |
| Sprint 3 | 3 weeks | Development |
| Sprint 4 (Innovation / IP) | 4 weeks | Innovation + next-PI planning |

**Total per PI:** 13 weeks (3 + 3 + 3 + 4).

**Naming convention:**

| Entity | Format | Example |
|--------|--------|---------|
| PI | `{year 2 digits}.{quarter}` | `26.1`, `26.2`, `26.3`, `26.4` |
| Sprint | `{PI}.{sprint number}` | `26.2.1`, `26.2.2`, `26.2.3`, `26.2.4` |

Sprint 4 is the Innovation Sprint (IP). UI may display it as `26.2.4` or `26.2.4.IP`.

**Visual rules for the timeline header:**

```
Sprint 1 ── Sprint 2 ── Sprint 3 ── IP (3 wks innovation) ── Planning (1 wk)
  ↑ same style          ↑ same style    ↑ IP style         ↑ Planning style
```

- Sprints 1–3 share the same visual style.
- Sprint 4 (IP) is visually distinct.
- The last week of the IP (Planning / breakout sessions) is visually distinct again — labeled "Planning".

**Holidays and weekends:**

- Not modeled in the Gantt grid. Weeks represent working weeks, not strict calendar weeks.
- Desirable (non-blocking): show a count of holidays in the visible PI range (badge or note in the header).

**PI and week display:**

| Scenario | Behavior |
|----------|----------|
| PIs configured | Timeline header shows PI → Sprint → Week along the horizontal Gantt scroll |
| No PI/Sprint configured | Dynamic week grid — scrolling horizontally forward or backward reveals additional weeks |
| Horizontal navigation | Continuous scroll across the timeline; not limited to a fixed number of PIs |

#### Organization: project, team, and product

| Level | Role | Rationale |
|-------|------|-----------|
| **Project** | Primary unit — all work belongs to a project first | Matches how initiatives are organized for executives and RTEs |
| **Team** | Global registry; 1..N teams assigned per project | Multiple teams can work simultaneously within the same project |
| **Product** | Global registry; assigned to 1..N projects via `project_products` | Identification label (name + color) — **not** a full epic/backlog hierarchy |
| **Feature** | Smallest planned unit on the Gantt | Always linked to project + team + product |

```
Project: CARB Platform
├── Product A (#3B82F6)   → identification label, shared across teams
├── Product B (#10B981)
├── Team: CARB Data Platform
│   └── F-1042, F-1087...
└── Team: API Integration
    └── F-1201, F-1205...
```

**Product semantics:** a Product is a lightweight global identification label (name + color) for visual grouping on the Gantt. Products are assigned to projects via `project_products` — the same product may appear in multiple projects. It is **not** an epic or parent work item in a backlog tree.

**Hierarchy:** Project → Team → Feature, with Product as a cross-cutting visual identifier assigned to projects.

Rejected alternatives: timeline per product (fragments the view), timeline per full ART (too noisy for executives), team as the top-level unit (does not reflect multi-team projects).

#### Assignment status

Entities can enter an invalid or pending state when relationships are broken. The UI shows a warning icon and tooltip; planning dates are **never** auto-moved.

| Entity | Status | When | UI |
|--------|--------|------|-----|
| Feature | `team_unassigned` | Team was unassigned from the project | Alert icon on row; tooltip: *"Team no longer assigned to this project"* |
| Feature | `ok` | Team is in `project_teams` for the feature's project | No alert icon |
| Product | `project_unassigned` | Product has no entries in `project_products` | Alert icon; tooltip: *"No project assigned"* |
| Product | `ok` | Product is assigned to at least one project | No alert icon |

**Reassignment rules:**

- Unassigning a team from a project is **always allowed**, even when features reference that team. Affected features become `team_unassigned`; start/target dates and bar positions are unchanged.
- In **Single team** view, `team_unassigned` features appear in a **"Needs reassignment"** section at the bottom of the feature list. Bar positions on the timeline grid are preserved.
- Reassign team via the feature detail panel (dropdown limited to teams assigned to the project).

#### Delete rules

| Action | Rule |
|--------|------|
| Delete **project** | Blocked if the project has features; allowed if empty → removes `project_teams` and `project_products` entries only (teams and products remain) |
| Unassign **team** from project | Always allowed → affected features become `team_unassigned` |
| Delete **team** (global) | Blocked if the team has features in any project |
| Delete **product** | Blocked if the product has associated features |

#### Project, team, and product management (MVP 1.5)

All CRUD is performed in the app. No backend.

| Entity | Create | Rename | Delete / unassign |
|--------|--------|--------|-------------------|
| **Project** | Name + optional team multi-select | Inline or modal; edit teams via checkboxes | Delete if no features |
| **Team** | Global team registry | Editable | Delete if no features anywhere; unassign from project anytime |
| **Product** | Name + color + project multi-select | Name, color, and project assignments editable | Delete blocked if features exist |

**Product color:** free color picker — native `type="color"` input plus editable hex field.

**Team assignment:** teams are created globally and assigned to projects via `project_teams`. A team may belong to multiple projects. Assign teams when creating or editing a project.

**Product assignment:** products are created globally and assigned to projects via `project_products`. A product may belong to multiple projects. Assign projects when creating or editing a product.

#### Features

A **feature** is the smallest unit planned and displayed on the Gantt.

| Field | Required | Notes |
|-------|----------|-------|
| ID | Yes | Unique identifier (e.g. `F-1042`) |
| Name | Yes | Descriptive title; editable after creation |
| Project | Yes | Parent project |
| Team | Yes | Team working on the feature; editable after creation |
| Product | Yes | Product from project catalog (`project_products`); determines bar color |
| Assignment status | Yes | `ok` or `team_unassigned` (derived from team ↔ project relationship) |
| Start date | Yes | When work begins; maps to the corresponding week on the Gantt |
| Target date | Yes | Expected delivery date; defines where the bar ends on the Gantt |
| User Stories | No | Manually entered in v1; each US has title + story points |
| Story points | No | Sum of US points; auto-calculated; informational |
| Completed | Yes | Whether the feature has been delivered |
| Cross-PI | No | Visual indicator when the feature spans multiple PIs |
| Baseline | No | Frozen dates after refinements (see Baseline model) |
| Deviation | No | Auto-calculated delta vs baseline |

#### Date positioning model

Features are positioned on the Gantt using **dates**, not week numbers or duration:

| Concept | Behavior |
|---------|----------|
| **Start date** | Editable. The Gantt places the bar start in the **week that contains** this date. |
| **Target date** | Editable. The Gantt places the bar end in the **week that contains** this date. |
| **Bar span** | Derived automatically: from the week of start date to the week of target date (inclusive). No separate duration field. |
| **Day display** | The specific day (e.g. `May 06`) is **shown** on the feature row or bar label for context, but is **not editable** on its own. Users change dates via the form or drag; the day updates as a consequence. |
| **Drag on Gantt** | Moving or resizing the bar updates `start_date` and/or `target_date` to match the new week boundaries. |

```
Start date: 2026-05-08  →  snaps to week of May 06–12  →  bar begins there
Target date: 2026-06-20 →  snaps to week of Jun 17–23  →  bar ends there
Day (08, 20)            →  display only, not a separate editable field
```

**Story points:**

- User Stories are entered manually in v1.
- Story points are **informational** (footer totals, feature detail). They do **not** drive bar length — the bar span comes from start date → target date.

**Cross-PI features:**

- A feature may extend across more than one PI.
- Marked with a visual indicator (badge, dashed border, or icon).
- Treated the same as other features for editing, baseline, and history.

#### Add Feature modal

Features are created via a **simple modal** opened from the **"Add Feature"** button in the top bar.

| Field | Required | Default | Notes |
|-------|----------|---------|-------|
| Name | Yes | — | Descriptive title |
| Team | Yes | — | Dropdown from teams assigned to the active project |
| Product | Yes | — | Dropdown from the active project's products; determines bar color |
| ID | No | Auto-generated | Format `F-{number}` (e.g. `F-1042`); user can override |
| Start date | Yes | First day of current PI | Maps to the corresponding week on the Gantt |
| Target date | Yes | Start date + 1 week | Defines bar end; must be ≥ start date |

**Flow:**

1. User clicks **"Add Feature"** in the top bar.
2. Modal opens with the fields above.
3. User fills name, team, product, start date, and target date (minimum).
4. On save: feature appears as a new row; bar spans from the week of start date to the week of target date.
5. The specific day is displayed on the bar/row but is not editable independently.
6. Audit event `feature.created` is recorded (actor + timestamp).
7. User can reposition or resize the bar via drag-and-drop (updates dates to match new weeks).

**Editing:** clicking an existing feature opens the **detail panel** (history + US + dates + team + name). Start date, target date, team, and name are editable there. A dedicated edit modal is not required.

#### Baseline and audit trail

The baseline is **per feature**, not a single PI-wide snapshot. The Gantt has memory: each feature records where it was originally planned and what happened afterward.

**When baseline is frozen:** after refinements are complete (end of the IP Planning week, or when RTE/PO confirms the plan is closed). Explicit action: **"Freeze baseline"**.

**On move:** user drags the bar → prompt "Why is it moving?" → reason (text) + actor (auto-captured) → event saved + position updated.

**Visual layers:**

| Element | What it shows |
|---------|---------------|
| Current bar | Today's position and size (solid, product color) |
| Ghost bar | Baseline position (dashed outline, semi-transparent, behind current bar) |
| Deviation icon | Alert when current dates differ from baseline (with week delta) |
| History panel | On feature click: chronological event list with who, when, and why |

**Current vs Baseline views:**

| View | What it shows |
|------|---------------|
| Current | Current bars + ghost baseline behind when deviated |
| Baseline | Only bars at their frozen original positions |

#### Screens and interactions (MVP 1.5)

**Collapsible sidebar navigation**

The left sidebar is the app navigation hub. It can be collapsed (icons only + tooltips) or expanded (icons + labels). Collapsed/expanded state persists in `localStorage`.

| Section | Content |
|---------|---------|
| **Timeline** | Main Gantt view (default page) |
| **Projects** | Project list + CRUD (create, rename, delete) |
| **Teams** | Global team registry + CRUD + assign/unassign to projects |
| **Products** | Global product catalog + CRUD + color picker + project assignment |

The **active project** selector and **team view** toggle live in the sidebar on the **Timeline** page only.

**Team view toggle** (Timeline page):

| Mode | Behavior |
|------|----------|
| **All teams** | All features for the active project; rows grouped under collapsible team section headers |
| **Single team** | Features filtered to the selected team; `team_unassigned` features in **"Needs reassignment"** section at the bottom (bar positions unchanged) |

| Screen / area | Content |
|---------------|---------|
| Sidebar | Collapsible navigation + active project selector + team view toggle |
| Top bar | Project name, PI range label, Current/Baseline toggle, **Gantt settings** icon, **Add Feature** button |
| Gantt settings | Gear icon in top bar (before Add Feature); modal with Markers tab (extensible for future Gantt config) |
| Add Feature modal | Name, team, product, ID (optional), start date, target date |
| Timeline header | PIs → sprints → weeks; **TODAY** pill in shared header row; **plan markers** with label + date visible |
| Today marker | Auto-calculated vertical line at current day; **TODAY** label in fixed shared header row; horizontal scroll synced with Gantt body |
| Plan markers | Per-project vertical markers (label, exact date, color); stacked labels when same day; visible in Current and Baseline views |
| Feature rows | ID, name (expands as panel widens), product color dot, assignment alert icon, dates, Gantt bar |
| Feature name panel | Split-pane left column — shared header row with timeline; bodies scroll in sync below |
| Footer | Feature count, total SPs, moved count; drag hints |
| Feature detail (on click) | Editable name and team, dates, history, associated User Stories; closes on click outside |

| Interaction | Behavior |
|-------------|----------|
| Add Feature | Opens create modal; on save, adds row + bar spanning start date → target date |
| Edit feature name | Editable in detail panel; immediate update in list and Gantt bar |
| Change feature team | Editable in detail panel; or drag row/bar into another team section (audit `feature.team_changed`) |
| Drag to Needs reassignment | Drop on **Needs reassignment** section → `teamId` cleared, `team_unassigned` status |
| Drag in Single team view | Only move to **Needs reassignment** (cannot assign to other teams from filtered view) |
| Resize feature panel | Drag split handle; collapse below min width; persisted in `localStorage` |
| Drag bar | Updates start/target dates; vertical drop may change team based on section |
| Drag row | Reorder within/between team sections; team changes when dropped under a different team header |
| Timeline scroll memory | Per project; saved when **leaving Timeline page** (not on F5 refresh); restored on return; defaults to centered on Today |
| Gantt markers | Create/edit/delete via Settings modal; scroll to new marker date after save |
| Horizontal scroll | Navigate across PIs or dynamic weeks |
| Toggle Current/Baseline | Compare current plan vs original (functional in MVP 2); markers visible in both views |
| Click feature | Open detail panel |
| Click outside feature | Close detail panel |
| Add US | Manual entry; SPs are informational only (do not resize bar) |

### Deliberately out of scope (MVP 1.5 — frontend only)

- **Backend, API, and database** — deferred to MVP 3; see [Future MVPs](#future-mvps)
- Baseline freeze, ghost bars, move-reason prompt — deferred to MVP 2
- Per-user accounts, roles, or login
- User-story detail on the main Gantt view
- Developer assignment
- Team burndown charts
- Real-time integration with Jira / Azure DevOps
- Excel import
- Export to PDF / image / PowerPoint
- Bank-holiday modeling in the grid (only a count indicator is desirable)
- Hosting and deployment (not a priority until product is validated)
- Full ART-wide consolidated view

---

## SAFe calendar model

### PI structure

```
PI 26.2 (13 working weeks)
├── 26.2.1  (3 weeks)  — Development
├── 26.2.2  (3 weeks)  — Development
├── 26.2.3  (3 weeks)  — Development
└── 26.2.4  (4 weeks)  — Innovation Sprint (IP)
    ├── Weeks 1–3       — Innovation (POCs, tech debt, exploration)
    └── Week 4          — Planning (breakout sessions, backlog refinement)
```

### Innovation Sprint (IP) phases

| Phase | Weeks | Content | Visual treatment |
|-------|-------|---------|-----------------|
| Innovation | IP weeks 1–3 | POCs, exploration, strategic tech debt | IP style (distinct from sprints 1–3) |
| Planning | IP week 4 | Breakout sessions, refinement, next-PI prep | Planning style (distinct from IP innovation weeks) |

### Deviation formula

```
deviation_weeks = week(current_start_date) − week(baseline_start_date)
```

Displayed when dates differ from baseline and a baseline exists for the feature. Comparison is at **week granularity** (the day within the week is not part of the deviation calculation).

---

## Baseline and event model

### Per-feature baseline

```json
{
  "featureId": "F-1042",
  "baseline": {
    "startDate": "2026-05-08",
    "targetDate": "2026-06-20",
    "frozenAt": "2026-08-05T14:00:00Z",
    "frozenBy": "franklin@empresa.com"
  }
}
```

### Audit events

Each relevant change appends an event (never overwrites previous state):

| Event | Trigger | Data captured |
|-------|---------|---------------|
| `feature.created` | Feature added to Gantt | dates, product, team, project |
| `feature.renamed` | Feature name edited in detail panel | previous name, new name |
| `feature.team_changed` | Feature team changed in detail panel | previous team, new team |
| `project.created` / `project.renamed` / `project.deleted` | Project CRUD | project id, name |
| `team.created` / `team.renamed` / `team.deleted` | Team CRUD | team id, name |
| `team.assigned` / `team.unassigned` | Team assigned/unassigned from project | project id, team id |
| `product.created` / `product.renamed` / `product.color_changed` | Product CRUD | product id, name, color |
| `product.project_unassigned` | Project deleted; product orphaned | product id |
| `baseline.frozen` | Baseline freeze action (MVP 2) | snapshot of all feature dates |
| `feature.moved` | Bar dragged to new weeks | previous dates, new dates, **reason** |
| `feature.dates_changed` | Start or target date edited in detail panel | previous dates, new dates |
| `feature.completed` | Marked as delivered | timestamp |
| `feature.cross_pi_marked` | Identified as cross-PI | PIs involved |

Project/team/product events may use `feature_id: null` (global audit entries).

Every event includes: `timestamp`, `actor` (simple name string), and `reason` (free text when applicable).

### Alternatives considered

| Approach | Verdict |
|----------|---------|
| Full PI snapshot only | Complement to per-feature baseline, not a replacement |
| Full Gantt versioning (v1, v2, v3) | Too heavy for executives — rejected for v1 |
| Numeric deviation only (no reason) | Insufficient — does not meet traceability goal |

---

## Integrations

| Integration | Priority | Notes |
|-------------|----------|-------|
| Azure DevOps | Future, desirable | Import features into the Gantt — not v1 priority |
| Jira | Not planned | — |
| Excel import | Not planned | Goal is to stop using Excel |

---

## Technical stack

### MVP 1.5 (current focus) — frontend only

| Layer | Choice |
|-------|--------|
| Frontend | Vite + React 18, client-side rendering only |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| State & persistence | React state + `localStorage` (no backend) |
| Backend | **Not in scope for MVP 1.5** |
| Database | **Not in scope for MVP 1.5** |
| Hosting | Local dev / static build — deployment deferred |

The app is a static SPA. All CRUD and state management run in the browser. No server, no API calls.

### Client-side persistence (MVP 1.5)

All data lives in the browser until MVP 3 adds a backend:

| Concern | MVP 1.5 approach |
|---------|------------------|
| Projects, teams, project_teams, products, project_products | Serialized to `localStorage` |
| Features, US, baselines | Serialized to `localStorage` |
| Audit events | Appended in `localStorage` (same structure as future DB model) |
| Actor name | `localStorage` key `pi-timeline-actor` |
| Layout preferences | Sidebar collapsed state, left column width, feature panel collapsed |
| Timeline scroll position | Per-project view (`pi-timeline-view`); saved on leaving Timeline page; defaults to Today on first visit |
| Timeline markers | Per-project markers (`timelineMarkers` in main state) |
| PI/sprint calendar | Static seed data in code; dynamic weeks when unconfigured |
| Multi-user sharing | Not supported — each browser has its own copy |

**Migration:** `loadState()` migrates legacy data (team-only model) by creating a default project and assigning `projectId` to existing features and products.

This keeps data shapes aligned with the [future data model](#data-model-future-mvp) so migration to a backend later is straightforward.

### Repository layout (current)

```
src/
  components/     React UI (Sidebar, TopNav, TimelineGrid, GanttSettingsModal, management pages, etc.)
  hooks/          useTimelineState, useFeatureDrag, useLeftColResize
  utils/          dates, storage, weekCalendar, timelineLayout, featureGroups, migration
  data.js         Static PI/sprint seed data
  constants.js    Layout dimensions and drag helpers
docs/             Project documentation
```

### Client-side data shape (MVP 1.5)

```json
{
  "projects": [{ "id": "proj-carb", "name": "CARB Platform", "createdAt": "..." }],
  "teams": [{ "id": "carb-dp", "name": "CARB Data Platform", "createdAt": "..." }],
  "projectTeams": [{ "projectId": "proj-carb", "teamId": "carb-dp" }],
  "products": [{ "id": "prod-a", "name": "Product A", "color": "#3B82F6" }],
  "projectProducts": [{ "projectId": "proj-carb", "productId": "prod-a" }],
  "features": [{
    "id": "F-1042",
    "projectId": "proj-carb",
    "teamId": "carb-dp",
    "productId": "prod-a",
    "name": "Terminal Report",
    "assignmentStatus": "ok",
    "startDate": "2026-05-06",
    "targetDate": "2026-06-20",
    "sortOrder": 0
  }],
  "timelineMarkers": [{
    "id": "marker-1",
    "projectId": "proj-carb",
    "label": "Board Review",
    "date": "2026-09-15",
    "color": "#EF4444",
    "createdAt": "...",
    "updatedAt": "..."
  }],
  "auditEvents": []
}
```

### Repository layout (future — when backend is added)

```
client/          Vite + React SPA (English UI)
server/          API (future MVP)
docs/            Project and hosting documentation
```

---

## Data model (future MVP)

> **Not in scope for MVP 1.5.** Documented here so frontend shapes stay compatible when a backend is added in MVP 3.

### `projects`

| Column | Type | Notes |
|--------|------|-------|
| id | text | Primary key |
| name | text | Display name |
| created_at | text | ISO timestamp |

### `teams`

| Column | Type | Notes |
|--------|------|-------|
| id | text | Primary key |
| name | text | Display name (e.g. "CARB Data Platform") |
| created_at | text | ISO timestamp |

### `project_teams`

| Column | Type | Notes |
|--------|------|-------|
| project_id | text | FK → projects |
| team_id | text | FK → teams |

Composite primary key: `(project_id, team_id)`.

### `products`

| Column | Type | Notes |
|--------|------|-------|
| id | text | Primary key |
| name | text | Display name |
| color | text | Hex color (e.g. `#3B82F6`) |
| created_at | text | ISO timestamp |

### `project_products`

| Column | Type | Notes |
|--------|------|-------|
| project_id | text | FK → projects |
| product_id | text | FK → products |

Composite primary key: `(project_id, product_id)`. A product may be assigned to multiple projects.

### `program_increments`

| Column | Type | Notes |
|--------|------|-------|
| id | text | Primary key (e.g. `26.2`) |
| name | text | Display name (e.g. `PI 26.2`) |
| start_date | text | ISO date |
| end_date | text | ISO date |
| holiday_count | integer | Optional; informational only |

### `sprints`

| Column | Type | Notes |
|--------|------|-------|
| id | text | Primary key (e.g. `26.2.1`) |
| pi_id | text | FK → program_increments |
| number | integer | 1–4 |
| type | text | `development`, `innovation`, `planning` (week 4 of IP) |
| start_date | text | ISO date |
| end_date | text | ISO date |
| week_count | integer | 3 or 1 (planning week stored separately if needed) |

### `features`

| Column | Type | Notes |
|--------|------|-------|
| id | text | Primary key (e.g. `F-1042`) |
| project_id | text | FK → projects |
| team_id | text | FK → teams |
| product_id | text | FK → products |
| name | text | Display name |
| assignment_status | text | `ok` or `team_unassigned` |
| start_date | text | ISO date (YYYY-MM-DD) |
| target_date | text | ISO date (YYYY-MM-DD) |
| story_points | integer | Sum of US points; auto-calculated; informational |
| completed | boolean | Default false |
| cross_pi | boolean | Default false |
| sort_order | integer | Row order in the Gantt |
| ado_work_item_id | integer | Nullable; for future ADO link |
| created_at | text | ISO timestamp |
| updated_at | text | ISO timestamp |

### `feature_baselines`

| Column | Type | Notes |
|--------|------|-------|
| id | integer | Primary key |
| feature_id | text | FK → features |
| start_date | text | Frozen start date |
| target_date | text | Frozen target date |
| frozen_at | text | ISO timestamp |
| frozen_by | text | Actor name |

### `user_stories`

| Column | Type | Notes |
|--------|------|-------|
| id | integer | Primary key |
| feature_id | text | FK → features |
| title | text | US title |
| story_points | integer | Points for this US |
| sort_order | integer | Display order |
| created_at | text | ISO timestamp |

### `audit_events`

| Column | Type | Notes |
|--------|------|-------|
| id | integer | Primary key |
| feature_id | text | FK → features (nullable for PI-wide events) |
| event_type | text | e.g. `feature.moved`, `baseline.frozen` |
| actor | text | Display name |
| reason | text | Nullable; required on move (TBD) |
| payload | text | JSON: before/after state |
| created_at | text | ISO timestamp |

---

## API surface (future MVP)

> **Not in scope for MVP 1.5.** The frontend handles all operations locally. These endpoints are a reference for when persistence and multi-user sharing are needed (MVP 3).

| Endpoint | Purpose |
|----------|---------|
| `GET/POST/PATCH/DELETE /api/projects` | CRUD projects |
| `GET/POST/PATCH/DELETE /api/teams` | CRUD teams |
| `POST/DELETE /api/projects/:id/teams` | Assign/unassign teams to a project |
| `GET /api/projects/:id/timeline` | Full timeline data (PIs, sprints, features, baselines) |
| `GET/POST/PATCH/DELETE /api/features` | CRUD features |
| `PATCH /api/features/:id/move` | Move feature (requires reason if baseline exists) |
| `POST /api/features/:id/baseline` | Freeze baseline for a single feature |
| `POST /api/pi/:id/baseline` | Freeze baseline for all features in a PI |
| `GET /api/features/:id/history` | Audit events for a feature |
| `GET/POST/PATCH/DELETE /api/features/:id/user-stories` | CRUD user stories |
| `GET/POST/PATCH/DELETE /api/products` | Manage products per project |

Auth: TBD when backend is introduced. Actor name sent as a request header or body field.

---

## Implementation defaults

These were not explicitly discussed but are assumed unless changed:

| Topic | Default |
|-------|---------|
| Architecture (MVP 1.5) | Frontend-only SPA, no backend |
| Data persistence | `localStorage` — projects, teams, products, features, baselines, audit events, layout |
| Actor storage | `localStorage` key `pi-timeline-actor` |
| Left column width | Default 280px; min 200px, max 720px; collapsed 52px; persisted in `localStorage` |
| Sidebar | Collapsible; state persisted |
| Move reason | **TBD (MVP 2)** — required or optional |
| Date granularity on Gantt | Week-level positioning; day is display-only |
| PI display | Continuous horizontal scroll; dynamic weeks when no PI configured |
| Re-freeze individual baseline | **TBD (MVP 2)** |
| Recent history in panel | Last 20 events per feature |
| Mobile layout | Desktop-first (executive presentations); responsive is desirable but not primary |
| Repo visibility | Private |

---

## Prototype status

What the codebase already validates:

| Area | Status |
|------|--------|
| Layout (sidebar, top bar, footer) | Done |
| Timeline header (PIs, sprints, weeks) | Done — Planning week distinction pending |
| Feature rows with status dot and deviation | Done |
| Gantt bars with color and completion | Done |
| Drag & drop (bars and rows) | Done — includes team change on section drop |
| Current/Baseline toggle | UI only — comparison logic in MVP 2; markers visible in both |
| Footer summary | Done |
| Seed data (3 PIs: 26.2–26.4) | Done |
| Add Feature modal | Done |
| Feature detail panel (dates, US) | Done — closes on outside click |
| Client-side persistence (`localStorage`) | Done |
| Actor name setup | Done |
| Project hierarchy + navigation | Done |
| Collapsible sidebar with management pages | Done |
| Team view toggle (All / Single) | Done |
| Assignment status icons | Done |
| Product CRUD + color picker | Done |
| Resizable / collapsible feature panel (split-pane) | Done |
| Edit feature name + team | Done |
| Today marker | Done — TODAY label in shared header row + body line |
| Timeline scroll position memory | Done — per project, on timeline exit |
| Plan markers (Gantt settings) | Done |
| Drag → team reassignment | Done |
| Dynamic week calendar | **Not started** |
| Baseline / ghost bars / functional history | MVP 2 |

---

## Implementation phases

### MVP 1 — Frontend interactive (complete)

Replace Excel with a usable **frontend-only** web tool. All data persists in the browser.

- Timeline with product color grouping
- **Add Feature modal** (name, product, start date, target date)
- Feature CRUD with drag & drop (dates update on move/resize)
- Manual US entry (SPs informational; bar span = start date → target date)
- Cross-PI indicator
- Simple actor name (no login)
- `localStorage` persistence (features, audit events)
- Footer summary

> **MVP 1 scope is frozen and implemented.**

### MVP 1.5 — Project hierarchy, navigation, and UX (current focus)

**Frontend-only. No backend, API, database, or integrations.**

Application structure, navigation, and organizational model. Builds on MVP 1.

| # | Feature | Acceptance criteria |
|---|---------|---------------------|
| 1 | **Project-based hierarchy** | Project is the primary navigation unit; all work belongs to a project |
| 2 | **Project CRUD** | Create, rename, delete from app; delete blocked if features exist |
| 3 | **Team CRUD + assignment** | Global team registry; assign/unassign teams to projects |
| 4 | **Multiple teams per project** | 1..N teams per project |
| 5 | **Team view toggle** | `All teams` (grouped sections) / `Single team` (filter) |
| 6 | **Project → Team → Feature** | Every feature has project + team + product; traceable in UI and audit |
| 7 | **Assignment status + icons** | `team_unassigned` / `project_unassigned` with alert icon and tooltip |
| 8 | **Needs reassignment section** | At bottom in Single team view; bar positions unchanged |
| 9 | **Products per project** | Global product catalog; assigned to projects via `project_products`; shared across teams |
| 10 | **Product CRUD + color picker** | Create, rename, recolor (hex + native picker); delete blocked if features exist |
| 11 | **Orphaned products** | On empty project delete, products become `project_unassigned` |
| 12 | **Collapsible sidebar navigation** | Pages: Timeline, Projects, Teams, Products |
| 13 | **Resizable feature panel** | Left Gantt column draggable; width persisted in `localStorage` |
| 14 | **Full feature name visibility** | Names expand as panel widens; no truncate-only when space allows |
| 15 | **Edit feature name** | Editable in detail panel; immediate update in list and bar |
| 16 | **Dynamic week calendar** | PIs/Sprints in header; dynamic weeks when no PI configured |
| 17 | **Today marker** | **TODAY** pill in shared header row + vertical line at current day; not editable |
| 18 | **Timeline scroll memory** | Per-project scroll saved on leaving Timeline (not F5); Today-centered default |
| 19 | **Plan markers** | Gantt Settings modal; per-project markers (date, label, color); scroll on create |
| 20 | **Drag → team change** | Drop feature under team section header to reassign; Needs reassignment clears team |
| 21 | **Detail panel dismiss** | Click outside timeline feature area closes detail panel |
| 22 | **Split-pane Gantt layout** | Shared header row (Features + timeline); bodies scroll in sync; horizontal header scroll synced with Gantt; resize at any scroll position |

**Remaining in MVP 1.5:**

- Dynamic calendar — infinite week scroll when no PI configured

**Implementation order (updated):**

1. Data foundation — entities, `localStorage`, migration, assignment status ✅
2. Sidebar + navigation — collapsible, management pages ✅
3. Timeline behavior — project context, team toggle, grouped sections, reassignment ✅
4. Product/team CRUD — color picker, orphan handling ✅
5. UX polish — split-pane panel, name visibility, edit feature name ✅
6. Timeline enhancements — Today marker, scroll memory, plan markers, drag team change ✅
7. Dynamic calendar — infinite week scroll when no PI configured

### Post-MVP1 backlog

Features identified from the Excel workflow. Ordered by priority. Not part of MVP 1.5 unless explicitly pulled in.

| Priority | Feature | Description | Rationale |
|----------|---------|-------------|-----------|
| 1 | **Feature notes** | Free-text field per feature (`notes`, ~500 chars). Note icon on row when non-empty; editable in detail panel. | Direct replacement for Excel cell comments; low effort, high value. |
| 2 | **Delivery commitment (star)** | Optional flag: "Product delivery date". Star icon at target date on the bar. Toggle in create modal and detail panel. | Core Excel convention; communicates executive delivery commitment. |
| 3 | ~~**Today marker**~~ | **Moved to MVP 1.5** — implemented | — |
| 4 | ~~**Timeline milestones**~~ | **Moved to MVP 1.5** as **Plan markers** — implemented via Gantt Settings | — |
| 5 | **Bar labels and hover** | Feature name truncated inside bar; hover shows start date, target date, and notes preview. | Visual polish; complements notes and dates already on features. |
| 6 | **Filter: delivery commitments** | Toggle or filter to show only features with delivery star. | Useful once delivery commitment exists; depends on priority 2. |
| 7 | **Milestone types / icons** | Optional icon or type per marker (planning, release, regulatory, etc.). | Clarifies marker meaning; build after basic markers work. |
| 8 | **Gantt settings expansion** | Additional tabs in Settings modal (styles, filters, etc.) | Extensible shell already in place |

**Explicitly not planned (post-MVP1):**

- Free-form text boxes on the Gantt canvas (Excel-style arbitrary annotations) — structured milestones cover the main use case with less maintenance.

### MVP 2 — Baseline, history, and deviations (frontend-only)

> **To be refined** in a future session. Identified scope below; details (move-reason rules, re-freeze) pending.

Build on MVP 1.5 without adding a backend:

- Freeze baseline post-refinement (per feature)
- Ghost baseline bars
- Move-reason prompt on drag
- Functional feature history panel
- Functional Current vs Baseline view
- Holiday count in PI header

### Future MVPs — backend, sharing, and integrations

> Deferred until the frontend product is validated. Data model and API surface above are designed to support this migration.

| Future MVP | Scope |
|------------|-------|
| **MVP 3 — Backend & persistence** | API, database (D1), multi-browser sharing, hosting — see [free-hosting-proposal.md](./free-hosting-proposal.md) |
| **MVP 4 — Integrations** | Azure DevOps feature import |
| **MVP 5 — Scale & export** | Product filter on Gantt, export for presentations |

---

## Open questions

| # | Question | Status |
|---|----------|--------|
| 1 | PI and sprint naming | Resolved |
| 2 | IP week 4 visual treatment | Resolved |
| 3 | Baseline model | Proposal defined — refine move-reason and re-freeze in MVP 2 |
| 4 | Who edits the timeline | Resolved (everyone, with audit) |
| 5 | Story points | Resolved (manual US, informational; bar span from dates) |
| 6 | Organization model | Resolved (project → team → feature; global products via `project_products`) |
| 7 | Holidays in calendar | Resolved (not modeled; show count in MVP 2) |
| 8 | Color/status meaning | Resolved (product = identification label + color) |
| 9 | Export for meetings | Resolved (not in v1) |
| 10 | Tool integrations | Resolved (ADO in MVP 4, not priority) |
| 11 | Cross-PI features | Resolved |
| 12 | How to create features? | Resolved (modal: team, product, start date, target date) |
| 13 | Feature positioning model | Resolved (dates → weeks; day display-only) |
| 14 | PI display on Gantt | Resolved (continuous scroll; dynamic weeks when unconfigured) |
| 15 | Move reason: required or optional? | Open — refine in MVP 2 |
| 16 | Re-freeze baseline for individual feature? | Open — refine in MVP 2 |
| 17 | Backend, database, and hosting stack? | Deferred — MVP 3; see [free-hosting-proposal.md](./free-hosting-proposal.md) |

---

## Glossary

| Term | Definition |
|------|------------|
| **Project** | Primary organizational unit — all features belong to a project; multiple teams can be assigned |
| **Team** | Global registry of teams; assigned to one or more projects; each feature belongs to one team |
| **Product** | Global identification label (name + color); assigned to projects via `project_products` — not an epic or backlog parent |
| **Assignment status** | `ok` or `team_unassigned` / `project_unassigned` — indicates broken entity relationships |
| **Needs reassignment** | UI section for features whose team is no longer assigned to the project |
| **PI** | Program Increment — ~3-month planning and execution cycle (4 sprints) |
| **SAFe** | Scaled Agile Framework |
| **IP** | Innovation Sprint — 4th sprint of the PI (3 weeks innovation + 1 week planning) |
| **Planning Week** | Last week of the IP — breakout sessions and next-PI refinement |
| **ART** | Agile Release Train — long-lived agile team in SAFe |
| **Feature** | Smallest plannable unit on the Gantt (executive level) |
| **US** | User Story — detailed work item within a feature |
| **Start date** | When work on a feature begins; maps to a week column on the Gantt |
| **Target date** | Expected delivery date; defines where the bar ends on the Gantt |
| **Baseline** | A feature's frozen start/target dates after refinements |
| **Ghost bar** | Semi-transparent bar showing baseline date range behind the current bar |
| **Deviation** | Difference between current and baseline dates (at week granularity) |
| **Cross-PI** | Feature spanning more than one Program Increment |
| **SP** | Story Points — effort estimation unit |
| **Actor** | Person who made a change (simple name, no login) |

---

## Document index

| Document | Purpose |
|----------|---------|
| [project.md](./project.md) | Product definition, behavior, data shapes (this file) |
| [project-def-example.md](./project-def-example.md) | Reference template for this document's structure |
| Data model & API sections | Future MVP 3 reference — not current implementation scope |
| [MVP 1.5](#mvp-15--project-hierarchy-navigation-and-ux-current-focus) | Current implementation focus |
| [Post-MVP1 backlog](#post-mvp1-backlog) | Prioritized features after MVP 1.5 (notes, delivery star, milestones, etc.) |
| [free-hosting-proposal.md](./free-hosting-proposal.md) | $0 hosting stack for MVP 3 (backend + persistence) |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-08-05 | Initial document: business context, SAFe methodology, prototype status |
| 2026-08-06 | Refinement: naming, IP/Planning visuals, per-feature baseline, team/product model, permissions, SPs, cross-PI, holidays, integrations |
| 2026-08-06 | Restructured to match `project-def-example.md` format; added planned data model and API surface |
| 2026-08-06 | MVP scoped to frontend-only; backend/API/DB deferred to future MVPs; `localStorage` as MVP persistence |
| 2026-08-06 | Add Feature: simple modal (name, product, start date, target date) |
| 2026-08-06 | Feature positioning: start date + target date (replaces start week/duration); day display-only; bar span derived from dates |
| 2026-08-06 | MVP 1 scope frozen; post-MVP1 backlog added (notes, delivery star, today marker, milestones, bar labels) |
| 2026-08-06 | Language conventions: all layers (UI, code, documentation) set to English |
| 2026-08-07 | MVP 1.5 defined: project-centric hierarchy, collapsible sidebar navigation, team toggle, assignment status, product CRUD, resizable panel, dynamic calendar; data model and API updated for projects |
| 2026-08-07 | Refinement: `project_products` many-to-many; feature panel collapse; active project sidebar on Timeline only; project create with teams; product multi-project assignment |
| 2026-08-07 | Split-pane Gantt layout; Today marker; timeline scroll memory; plan markers via Gantt Settings; drag-to-reassign team; detail panel dismiss on outside click |
| 2026-08-07 | UI polish: TODAY uppercase; settings icon in TopNav; shared header row (Features + timeline) for row alignment |
| 2026-08-07 | Documentation pass: align product model, panel widths, scroll memory, and shared-header layout with implementation |
