# Chronova — Project Definition

**Product name:** Chronova  
**Tagline:** Adaptive Planning Timeline  
**Package name:** `chronova` (repo folder may still be `pi-timeline` until renamed on GitHub)

Brand guidelines, slogan, and philosophy: [brand.md](brand.md).

A lightweight internal web app for tracking team features across Program Increments (PI) using a simple Gantt-style timeline. Oriented to executives and stakeholders — not a replacement for Jira or Azure DevOps.

This document is the single source of truth for product behavior and technical conventions. Hosting details will live in a separate proposal when defined.

**Status:** in refinement — all current MVPs are frontend-only (no backend). Do not implement backend/API/DB until MVP 3 is explicitly scoped.

**Current focus:** MVP 2 — baseline, ghost bars, and functional history (blocked until refinement session). Persistence: `localStorage`.

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
6. **Project-centric view** — project is the primary unit of organization; multiple teams can work within one project; products provide visual grouping and an optional **product focus** highlight — not a separate screen.

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
- **User display name:** a simple name stored in `localStorage` (sidebar label **User**) — no user accounts, no roles. Audit events still use an `actor` field internally.
- **Permissions:** everyone can view and edit. All changes are recorded with user name + timestamp in the audit log.
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
| **Feature** | Smallest plannable unit | Always linked to project + product; team and dates optional until planned |
| **Backlog** | Unplanned features (no team) | Listed in the feature panel only — no Gantt bar |

```
Project: CARB Platform
├── Product A (#3B82F6)   → identification label, shared across teams
├── Product B (#10B981)
├── Backlog (no team)
│   └── 9, 10...   → no Gantt bar
├── Team: CARB Data Platform
│   └── 1, 2...
└── Team: API Integration
    └── 16, 17...
```

**Product semantics:** a Product is a lightweight global identification label (name + color) for visual grouping on the Gantt. Products are assigned to projects via `project_products` — the same product may appear in multiple projects. A product is **not** exclusive to a single project. Within a project, a product may be **worked on by multiple teams** simultaneously (features with the same `productId` and different `teamId`). It is **not** an epic or parent work item in a backlog tree.

**Hierarchy:** Project → (Backlog | Team) → Feature, with Product as a cross-cutting visual identifier assigned to projects.

Rejected alternatives: separate Timeline screen per product (fragments navigation), timeline per full ART (too noisy for executives), team as the top-level unit (does not reflect multi-team projects), product exclusive to one project (unnecessary constraint for a global catalog).

#### Iterations (calendar plans) — Phase A

Reusable **iteration plans** define the timeline calendar. Methodology-neutral naming in the UI (**Iterations**); SAFe vocabulary appears inside a plan when `methodology = safe`.

| Entity | Role |
|--------|------|
| **Iteration plan** | Named calendar configuration (`methodology: safe` for now); shared across projects |
| **Timebox / iteration** | Program Increment within a plan (name + date range); created via **Create iteration** |
| **Sprint** | Child of a timebox (editable name, free-text type, dates, week count, **timeline scale**) |
| **project_iteration_plans** | Each project has **exactly one** plan; assignment is configured only on the **Projects** page |

**SAFe template (v1):** creating an iteration from a start date generates 4 sprints (3+3+3+4 weeks). Sprint fields are editable afterward; timebox start/end are derived from its sprints.

**Sprint timeline scale:** each sprint chooses the Gantt leaf unit — `day`, `week` (default), or `month`. Example: Sprint `26.2.1` with scale `week` shows `Week 1…` columns; with scale `day` shows one column per day. Mixed scales across sprints in the same plan are supported.

**Current timebox:** automatic — the timebox that contains **today**; if none, the first future timebox. Used for Add Feature default dates.

**Pages:** sidebar **Iterations** (CRUD plans / iterations / sprints; read-only list of projects using the plan). **Projects** assigns the plan. Timeline top bar shows `Plan: {name}` only on the Timeline page.

**UI chrome:** management pages use a single title in the top bar (no duplicate in-page H1). Current/Baseline toggle is removed; the app always shows the current plan view.

#### Planning status and assignment status

Features have two independent status dimensions:

| Dimension | Values | Meaning |
|-----------|--------|---------|
| **Planning status** | `backlog` \| `planned` | Whether the feature is on the execution timeline |
| **Assignment status** | `ok` \| `team_unassigned` | Whether the feature's team is still valid for the project |

**Planning status:**

| Status | When | Gantt bar | Feature panel |
|--------|------|-----------|---------------|
| `backlog` | Created without a team (intentional) | **No bar** — not on the timeline grid | **Backlog** section |
| `planned` | Team assigned; feature is being tracked on the timeline | Bar rendered (requires valid dates) | Under assigned team section |

**Assignment status** (planned features only):

| Status | When | UI |
|--------|------|-----|
| `team_unassigned` | Team was unassigned from the project | Alert icon on row; tooltip: *"Team no longer assigned to this project"*; bar positions preserved |
| `ok` | Team is in `project_teams` for the feature's project | No alert icon |

**Backlog vs Needs reassignment:**

| Concept | Cause | Has Gantt bar? | Section |
|---------|-------|----------------|---------|
| **Backlog** | Feature created without a team | No | **Backlog** |
| **Needs reassignment** | Team removed from project after planning | Yes (dates preserved) | **Needs reassignment** |

**Reassignment rules:**

- Unassigning a team from a project is **always allowed**, even when planned features reference that team. Affected features become `team_unassigned`; start/target dates and bar positions are unchanged.
- In **Single team** view, `team_unassigned` features appear in a **"Needs reassignment"** section at the bottom of the feature list. Bar positions on the timeline grid are preserved.
- Reassign team via the feature detail panel (dropdown limited to teams assigned to the project).
- Assigning a team to a backlog feature transitions it to `planned`. If dates are missing, prompt for start and target dates before showing the Gantt bar.

**Missing dates indicator:**

- Features without `start_date` and/or `target_date` (backlog or planned) show a **calendar attention icon** on the feature row (e.g. `CalendarOff`) with tooltip: *"Dates not set"*.
- Planning dates are **never** auto-moved when relationships change.

Entities other than features can also enter an invalid state:

| Entity | Status | When | UI |
|--------|--------|------|-----|
| Product | `project_unassigned` | Product has no entries in `project_products` | Alert icon; tooltip: *"No project assigned"* |
| Product | `ok` | Product is assigned to at least one project | No alert icon |

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

A **feature** is the smallest plannable unit. Planned features appear on the Gantt; backlog features appear in the feature panel only.

| Field | Required | Notes |
|-------|----------|-------|
| ID | Yes | Auto-generated integer identity (1, 2, 3…); assigned on save. Frontend generates locally until backend returns DB identity. |
| Name | Yes | Descriptive title; editable after creation |
| Project | Yes | Parent project |
| Product | Yes | Product from project catalog (`project_products`); determines bar color |
| Planning status | Yes | `backlog` or `planned` (derived from team assignment) |
| Team | No (backlog) / Yes (planned) | Team working on the feature; editable after creation |
| Assignment status | Yes | `ok` or `team_unassigned` (derived from team ↔ project relationship; planned features only) |
| Start date | No | When work begins; required when assigning a team; may be cleared on edit |
| Target date | No | Expected delivery date; required when assigning a team; may be cleared on edit |
| User Stories | No | Manually entered in v1; each US has title + story points |
| Story points | No | Sum of US points; auto-calculated; informational |
| Notes | No | Free-text field (~500 chars); separate from comments |
| Comments | No | Flat thread of discussion entries (see [Comments](#comments)) |
| Depends on | No | Array of feature IDs this feature depends on (same project) |
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
- Story points are **informational**. They do **not** drive bar length — the bar span comes from start date → target date.
- When `storyPoints > 0`, display on the feature row (secondary line badge, e.g. `13 SP`) and on the Gantt bar when width allows (discrete suffix, e.g. `· 13 SP`). Do not show `0 SP`.
- Footer totals include features with a **valid Gantt bar** only (team + start + target dates).

**Cross-PI features:**

- A feature may extend across more than one PI.
- Marked with a visual indicator (badge, dashed border, or icon).
- Treated the same as other features for editing, baseline, and history.

#### Add Feature modal

Features are created via a **simple modal** opened from the **"Add Feature"** button in the top bar.

| Field | Required | Default | Notes |
|-------|----------|---------|-------|
| Name | Yes | — | Descriptive title |
| Team | No | — | Dropdown from teams assigned to the active project; **"Unassigned (backlog)"** option creates a backlog feature |
| Product | Yes | — | Dropdown from the active project's products; determines bar color |
| Start date | No (backlog) / Yes (planned) | Empty (backlog) or first day of current PI (planned) | Optional for backlog; required when saving with a team; may be cleared on edit — feature stays on Gantt without bar |
| Target date | No (backlog) / Yes (planned) | Empty (backlog) or start + 1 week (planned) | Must be ≥ start date when both are set |

**ID:** not user-editable. Assigned automatically when the feature is saved (`max(existing ids) + 1` in the frontend). When a backend is integrated, the API will return the database identity instead.

**Date rules (MVP 1.7):**

| Scenario | Dates required? | Gantt bar? |
|----------|-----------------|------------|
| Create in **Backlog** | No — fields default **empty** | No |
| Create with **team** | Yes — pre-filled with current PI | Yes (when valid) |
| Edit — clear dates on planned feature | Allowed | No — missing-dates icon on row |
| **Assign team** from backlog | Yes — validated on **Save** in detail panel | Yes after dates set |
| Feature has team but no dates | Allowed | No — missing-dates icon; **not** moved to Backlog |

**Footer counts:** only features with a **valid Gantt bar** (planned + team + start date + target date).

**Flow:**

1. User clicks **"Add Feature"** in the top bar.
2. Modal opens with the fields above.
3. User fills name and product (minimum). For backlog, team and dates stay empty by default. For planned, team and pre-filled dates are required on save.
4. On save:
   - **Backlog** (no team): feature appears in the **Backlog** section; no Gantt bar (dates optional).
   - **Planned** (team selected): feature appears under the team section; bar spans start → target (dates required).
5. The specific day is displayed on the bar/row when dates exist but is not editable independently.
6. Audit event `feature.created` is recorded (actor + timestamp).
7. Planned features with valid dates can be repositioned or resized via drag-and-drop.

**Assigning team from backlog:** team can be selected freely while editing. On **Save**, if a team is assigned, start and target dates are required; validation errors are shown in the panel.

**Detail panel editing:** name, team, dates, delivered flag, notes, and dependencies are edited in a **draft** state. **Start and target dates preview live** on the Gantt bar while editing (before Save). Click **Save changes** to persist. Comments and user stories save immediately. If the user closes the panel, selects another feature, or clicks outside with unsaved changes, a dialog offers **Save**, **Discard**, or **Cancel** (keep editing).

**Editing:** clicking an existing feature opens the **detail panel** (history, notes, comments, US, dependencies, dates, team, name). A dedicated edit modal is not required.

#### Notes

A single free-text **notes** field per feature (~500 characters). Distinct from the comment thread.

| Aspect | Behavior |
|--------|----------|
| Purpose | Quick annotation — Excel-style cell note replacement |
| UI | Editable in detail panel; **note icon** on feature row when non-empty |
| Storage | `notes` string on feature |

#### Comments

A flat **comment thread** per feature for lightweight discussion. Distinct from notes.

| Aspect | Behavior |
|--------|----------|
| Model | `{ id, author, text, createdAt, updatedAt? }` — chronological, no nesting |
| Max length | 500 characters per comment |
| Edit/delete | Author may edit or delete their own comments (matched by actor name) |
| Row indicator | `MessageSquare` icon when ≥1 comment exists — **presence only**, no count badge |
| UI | Thread + input in detail panel; no inline bubbles on the Gantt canvas |

#### Feature dependencies

Features can declare **depends on** relationships to other features in the same project. This is for traceability, not automatic scheduling.

| Aspect | Behavior |
|--------|----------|
| Model | `dependsOn: number[]` — feature IDs this feature depends on (unidirectional) |
| Scope | Same project; may cross teams |
| Configuration | Multi-select in detail panel |
| Validation | No self-reference; no cycles |
| Backlog targets | Dependency links allowed in the panel; backlog features have no Gantt highlight |
| Date conflict | Warning icon + tooltip when a predecessor's `target_date` is after the dependent's `start_date` |
| Selection focus | On feature select: direct predecessors and successors highlighted; other rows/bars at ~25% opacity |
| Connectors | **Not in MVP 1.6** — no SVG lines between bars (highlight + list only) |

#### Gantt rules

Per-project visual rules configured in **Gantt Settings → Rules** tab. Rules evaluate feature fields and apply visual accents **on top of** the product bar color — they do not replace the product fill.

**Available condition fields:**

| Field | Operators | Example |
|-------|-----------|---------|
| `target_date` | `< today`, `> today`, `<`, `>`, `=` | Overdue |
| `start_date` | `< today`, `>`, `<`, `=` | Not started |
| `completed` | `is true` / `is false` | In progress |
| `deviation` (MVP 2) | `> N weeks` | Slipped |
| `cross_pi` | `is true` | Cross-PI |
| `story_points` | `>`, `<`, `=` | Large feature |
| `assignment_status` | `equals` | Needs reassignment |
| `name` | `contains`, `not contains`, `equals`, `starts with` | Name contains "Terminal" |

**Rule builder:** each rule has editable **conditions** and **actions**. Conditions combine with **AND** (`matchMode: all`) or **OR** (`matchMode: any`). The Gantt Settings modal provides add/edit/remove for rules, condition rows (field + operator + value), and action rows — same delete pattern as markers. Feature-match preview ("Matches N features") is deferred.

**Pre-installed rules (editable, disableable, deletable):**

| Rule | Condition | Purpose |
|------|-----------|---------|
| **Overdue** | `target_date < today` AND `completed = false` | Not delivered and past target |
| **Completed overdue** | `target_date < today` AND `completed = true` | Delivered after the target date |

**Available actions (combinable per rule):**

| Action | Example use |
|--------|-------------|
| Left border (3–4px) | Overdue → red |
| Row icon | `Clock` or `Alert triangle` on the feature row |
| Bar pattern | Diagonal stripes over product color |
| Opacity | Reduced opacity for completed |

**Tooltips:** rule-driven row icons and left-border highlights show a tooltip naming the matching rule(s) (e.g. `Rule: Overdue — Clock`).

**Rule evaluation:**

- Rules are **per project**, persisted in `localStorage` (`formattingRules` key — internal name unchanged).
- **Each rule is independent** — if a rule's conditions match, its actions apply.
- **All matching rules apply** their actions (multiple rules may match the same feature).
- Rules apply in **Current and Baseline** views.
- Overdue uses **day-level** comparison (`target_date < today`).
- Users can add, edit, enable/disable, and **delete any rule** (including pre-installed defaults). Deleted defaults are not re-seeded on reload.

#### Plan marker grouping

When multiple plan markers share the same date, they are **grouped** in the timeline header:

| State | Behavior |
|-------|----------|
| Collapsed (default) | Single pill with generic label (e.g. `3 markers`); single vertical body line in dominant marker color |
| Expanded (click) | Popover lists all markers (label, date, color) — **read-only**; no duplicate stacked pills in the header |
| Hover | Tooltip on grouped pill lists all marker labels |

Markers remain visible in Current and Baseline views.

#### Collapsible timeline sections (MVP 1.7)

Team, **Backlog**, and **Needs reassignment** section headers are collapsible. Collapsing a section hides all feature rows in that section in **both** the feature panel and the Gantt body (rows stay vertically aligned).

| Aspect | Behavior |
|--------|----------|
| Toggle | Chevron on section header |
| Scope | All section types (teams, Backlog, Needs reassignment) |
| Sync | Left panel and Gantt collapse together |
| Global actions | **Collapse all** / **Expand all** controls on the feature panel |
| Persistence | Per-project `collapsedSections` in `localStorage` |

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

#### Screens and interactions (MVP 1.5 / 1.6 / 1.7)

**Collapsible sidebar navigation**

The left sidebar is the app navigation hub. It can be collapsed (icons only + tooltips) or expanded (icons + labels). Collapsed/expanded state persists in `localStorage`.

Navigation is grouped visually (separators between groups):

| Group | Pages |
|-------|-------|
| **Landing** | **Home** |
| **Work** | **Timeline** |
| **Configuration** | Projects, Iterations, Teams, Products |

| Page | Content |
|------|---------|
| **Home** | Brand landing: hero, pillars, **Take a tour** (highlighted on first visit), continue to last page, setup wizard |
| **Timeline** | Main Gantt view |
| **Projects** | Project list + CRUD; assign iteration plan and teams |
| **Iterations** | Reusable iteration plans, timeboxes (PIs), sprints |
| **Teams** | Global team registry + CRUD + assign/unassign to projects |
| **Products** | Global product catalog + CRUD + color picker + project assignment |

The **active project** selector, **View** filter, and **User** name field live in the sidebar (project/view filters on **Timeline** only).

#### Onboarding and first-run UX

Chronova is **Gantt-centric**: configuration pages are prerequisites; the goal is a project ready to plan on the Timeline.

| Flow | Behavior |
|------|----------|
| **First open** | No `chronova-navigation` → land on **Home** |
| **Return visit** | `chronova-navigation.lastPage` → restore last page (e.g. Timeline) |
| **Product tour** (`app-intro`) | Spotlight walkthrough with **real page navigation**; relaunchable from Home (**Take a tour**). Registry: `src/tours/registry.js`; runner: `TourRunner`. Elements use `data-tour` attributes. Final step: offer setup or **Skip setup for now**. |
| **Tour CTA highlight** | On first Home visit (no navigation history, tour not completed), **Take a tour** shows an animated futuristic highlight (“Start here”). |
| **Setup wizard** | On demand only (Home, tour end, checklist). Steps: User name → Project + calendar start → Team → First feature. Calls `setupProjectForGantt` (auto-creates plan/timebox/product if needed). Does **not** open automatically on app load. |
| **Gantt checklist** | On Timeline when project is not Gantt-ready: project → calendar → product → team → first feature on Gantt. Dismissible. |
| **Gantt-ready** | Computed by `ganttReadiness` (`src/utils/ganttReadiness.js`): plan with timebox, product assigned, team assigned; first bar optional for “complete” checklist. |

Per-page tours (e.g. Timeline-only) are planned via the same tour registry pattern (v2).

**View filter** (Timeline page — replaces "Team view"):

Three independent sidebar controls on the Timeline:

| Control | Behavior |
|---------|----------|
| **View** | `All` — full timeline; `Backlog` — backlog section only |
| **Team** | `All` — every team section; `{Team}` — filter rows to that team (+ backlog + needs reassignment) |
| **Product** | `All` — no product focus; `{Product}` — **highlight** that product's features and dim the rest (same visual treatment as dependency focus) |

Team filter and product focus are **complementary** — both can be active at the same time.

State model: `viewMode: 'all' | 'backlog'` + optional `filterTeamId` + optional `filterProductId`.

#### Product focus semantics

Product focus is a **highlight lens** on the project Timeline — not a separate page and not a row filter. All rows remain visible (subject to View/Team filters); features whose `productId` does not match are dimmed (`opacity-25`), matching dependency-focus behavior. Selecting a feature with dependencies takes priority over product focus.

When `filterProductId` is set:

1. Matching features stay at full opacity across all visible sections (planned, backlog, needs reassignment).
2. Non-matching features are dimmed but remain interactive.
3. Top bar shows **Vista: {product name}** with the product color dot.
4. Footer stats (count, SPs, delivered, cross-PI) reflect only on-Gantt features of the focused product.

When **both** `filterTeamId` and `filterProductId` are set and the product has on-Gantt features assigned to other teams, the footer shows **N in other teams** with an info icon; tooltip lists the other team names.

**Interactions:** Add Feature pre-fills the focused product (still editable). Drag & drop follows View/Team filter rules; product focus does not restrict drops.

**Edge cases:**

| Event | Behavior |
|-------|----------|
| Switch project | Clear team filter if team not in new project; clear product focus if product not assigned |
| Delete focused product | Clear product focus (delete blocked if product has features) |
| Unassign product from project | Clear product focus if it was active |
| Project has no products | Product dropdown shows only All |

**Rejected for product focus:** hiding non-product rows; separate Timeline screen per product.

#### Feature search (Timeline)

A search field in the feature panel header filters visible rows by feature name or ID.

| Rule | Behavior |
|------|----------|
| Scope | Applies to current `timelineRows` (after View/Team sidebar filters), using fully expanded sections as the search base |
| Match | Case-insensitive substring on `feature.name` or `String(feature.id)` |
| Effect | Hides non-matching feature rows in **both** the feature panel and Gantt body (row alignment preserved) |
| Sections | Sections with no matches are hidden; sections with matches are shown **expanded** while search is active |
| Persistence | Not persisted — cleared on project change or page reload |
| Empty | `No features match "{query}".` when the filter has no results |

Product focus dimming still applies on visible rows after search filtering.

| Screen / area | Content |
|---------------|---------|
| Sidebar | Grouped nav: **Home** · Timeline · Projects, Iterations, Teams, Products; **User** name; active project + **View** / **Team** / **Product** controls (Timeline only) |
| Top bar | Page title; on Timeline only: `Plan: {name}`; when product focus is active: **Vista: {product}** with color dot; **Gantt settings** + **Add Feature** (Timeline only). Dark variant on Home. |
| Home | `TimeHorizon` background, `BrandWordmark`, pillars, CTAs: **Take a tour**, continue to last page, setup wizard, advanced configuration |
| Onboarding | See [Onboarding and first-run UX](#onboarding-and-first-run-ux) above |
| Gantt settings | Gear icon in top bar; modal with **Markers** and **Rules** (editable condition/action builder) tabs |
| Add Feature modal | Backlog or planned; blocked until project has a product; planned path needs team + calendar for Gantt bar |
| Feature panel | Compact layout: team + dates + Delivered (locks dates when checked), notes, dependencies, user stories; **Comments** and **History** collapsible at bottom |
| Timeline header | PIs → sprints → weeks; **TODAY** pill; **plan markers** (grouped when same date) |
| Today marker | Auto-calculated vertical line at current day; **TODAY** label in fixed shared header row; horizontal scroll synced with Gantt body |
| Plan markers | Per-project vertical markers; grouped pill when same date; expand to list; single body line per date |
| Feature rows | ID, name, product color dot, SP badge, notes/comments icons, missing-dates icon, assignment alert, dates, Gantt bar (planned only) |
| Backlog section | Features without team — panel row only, no Gantt bar |
| Feature name panel | Split-pane left column — shared header row with timeline; search by name or ID; bodies scroll in sync below |
| Footer | Feature count with **valid Gantt bar** only, total SPs (same scope), moved count; when product focus is active, stats are scoped to the focused product; cross-team hint when team + product focus hide features in other teams; drag hints |
| Feature detail (on click) | Name, team, dates (locked when Delivered), notes, dependencies, US; Comments and History at end; **Save changes**; closes on click outside (with unsaved prompt) |

| Interaction | Behavior |
|-------------|----------|
| Add Feature | Opens create modal; backlog (no team) or planned (team + dates) |
| Assign team to backlog | Select team in detail panel; dates validated on **Save** |
| Collapse section | Hide section rows in feature panel and Gantt; persisted per project |
| Collapse all / Expand all | Toggle all section headers at once |
| Edit feature name | Editable in detail panel; saved with **Save changes** |
| Detail panel save | Draft edits; **Save changes** button; unsaved dialog on close or switch feature |
| Change feature team | Editable in detail panel; or drag row/bar into another team section (audit `feature.team_changed`) |
| Drag to Needs reassignment | Drop on **Needs reassignment** section → `teamId` cleared, `team_unassigned` status |
| Drag in Single team view | Only move to **Needs reassignment** (cannot assign to other teams from filtered view) |
| Resize feature panel | Drag split handle; collapse below min width; persisted in `localStorage` |
| Drag bar | Updates start/target dates; vertical drop may change team based on section |
| Drag row | Reorder within/between team sections; team changes when dropped under a different team header |
| Timeline scroll memory | Per project; saved when **leaving Timeline page** (not on F5 refresh); restored on return; defaults to centered on Today |
| Gantt markers | Create/edit/delete via Settings modal; grouped display when same date; scroll to new marker date after save |
| Rules | Configure in Gantt Settings → Rules; evaluated in the current plan view |
| Feature dependencies | Configure in detail panel; focus highlight on select |
| Comments | Add/edit/delete (own) in detail panel; presence icon on row |
| Notes | Edit in detail panel; note icon on row when non-empty |
| Horizontal scroll | Navigate across PIs or dynamic weeks |
| Toggle Current/Baseline | Compare current plan vs original (functional in MVP 2); markers and formatting rules visible in both views |
| Click feature | Open detail panel; dependency focus mode (highlight chain, dim others) |
| Click outside feature | Close detail panel |
| Add US | Manual entry; SPs are informational only (do not resize bar); SP badge updates on row/bar |

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
  "featureId": 1,
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
| `feature.created` | Feature added | dates, product, team, project, planning status |
| `feature.team_assigned` | Backlog feature assigned to a team | previous status, team |
| `feature.renamed` | Feature name edited in detail panel | previous name, new name |
| `feature.team_changed` | Feature team changed in detail panel | previous team, new team |
| `feature.comment_added` | Comment added to feature | comment id |
| `feature.comment_edited` | Comment edited | comment id |
| `feature.comment_deleted` | Comment deleted | comment id |
| `feature.dependency_added` | Dependency link created | depends-on feature id |
| `feature.dependency_removed` | Dependency link removed | depends-on feature id |
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

### MVP 1.5 / 1.6 / 1.7 — frontend only

| Layer | Choice |
|-------|--------|
| Frontend | Vite + React 18, client-side rendering only |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| State & persistence | React state + `localStorage` (no backend) |
| Backend | **Not in scope until MVP 3** |
| Database | **Not in scope until MVP 3** |
| Hosting | Local dev / static build — deployment deferred |

The app is a static SPA. All CRUD and state management run in the browser. No server, no API calls.

### Client-side persistence (MVP 1.5 / 1.6 / 1.7)

All data lives in the browser until MVP 3 adds a backend:

| Concern | Approach |
|---------|----------|
| Projects, teams, project_teams, products, project_products | Serialized to `localStorage` |
| Iteration plans, timeboxes, sprints, project_iteration_plans | Serialized to `localStorage` |
| Features, US, baselines | Serialized to `localStorage` |
| Audit events | Appended in `localStorage` (same structure as future DB model) |
| User display name | `localStorage` key `chronova-actor` (UI label **User**; audit field `actor`) |
| Navigation memory | `chronova-navigation`: `{ hasVisited, lastPage }` — new users → Home; returning → last page |
| Onboarding state | `chronova-onboarding`: `{ wizardCompleted, tourCompleted, checklistDismissed }` |
| Layout preferences | Sidebar collapsed state, left column width, feature panel collapsed (`chronova-layout`) |
| Timeline scroll position | Per-project view (`chronova-view`); saved on leaving Timeline page; defaults to Today on first visit |
| Timeline markers | Per-project markers (`timelineMarkers` in main state) |
| Rules | Per-project rules (`formattingRules` in main state; UI label **Rules**) |
| View filter | `viewMode` (`all` \| `backlog`) + optional `filterTeamId` + optional `filterProductId` (highlight) |
| Collapsed sections | Per-project section collapse state (`collapsedSections` in main state) |
| PI/sprint calendar | Derived from the project's assigned iteration plan |
| Multi-user sharing | Not supported — each browser has its own copy |

**Migration:** `loadState()` migrates legacy data (team-only model) by creating a default project and assigning `projectId` to existing features and products. MVP 1.7 adds migration from `teamViewMode` → `viewMode` and initializes `collapsedSections` per project when absent. Feature ids migrate from legacy `F-{n}` strings to integer identity values; `dependsOn` and audit `featureId` references are remapped. Missing iteration plans are seeded from the default SAFe calendar and assigned to all projects.

This keeps data shapes aligned with the [future data model](#data-model-future-mvp) so migration to a backend later is straightforward.

### Repository layout (current)

```
src/
  components/     React UI (Sidebar, TopNav, TimelineGrid, GanttSettingsModal, pages, BrandWordmark, …)
  components/onboarding/  SetupWizard, TourRunner, GanttSetupChecklist, TourCtaHighlight
  components/pages/       Home, Projects, Iterations, Teams, Products
  tours/          Tour registry (`app-intro`; extensible per page)
  hooks/          useTimelineState, useFeatureDrag, useLeftColResize
  utils/          dates, storage, navigation, onboarding, ganttReadiness, weekCalendar, migration, …
  data.js         Static seed data
  constants.js    Layout dimensions and drag helpers
docs/             Project documentation (project.md, brand.md)
```

### Client-side data shape (MVP 1.5 / 1.6 / 1.7)

```json
{
  "viewMode": "all",
  "filterTeamId": null,
  "filterProductId": null,
  "collapsedSections": { "proj-carb": ["backlog"] },
  "projects": [{ "id": "proj-carb", "name": "CARB Platform", "createdAt": "..." }],
  "teams": [{ "id": "carb-dp", "name": "CARB Data Platform", "createdAt": "..." }],
  "projectTeams": [{ "projectId": "proj-carb", "teamId": "carb-dp" }],
  "products": [{ "id": "prod-a", "name": "Product A", "color": "#3B82F6" }],
  "projectProducts": [{ "projectId": "proj-carb", "productId": "prod-a" }],
  "iterationPlans": [{ "id": "plan-carb-2026", "name": "CARB ART 2026", "methodology": "safe" }],
  "timeboxes": [{ "id": "26.3", "planId": "plan-carb-2026", "name": "PI 26.3", "startDate": "2026-08-05", "endDate": "2026-11-03", "sortOrder": 1 }],
  "sprints": [{ "id": "26.3.1", "timeboxId": "26.3", "number": 1, "name": "26.3.1", "type": "development", "startDate": "2026-08-05", "endDate": "2026-08-25", "weekCount": 3 }],
  "projectIterationPlans": [{ "projectId": "proj-carb", "planId": "plan-carb-2026" }],
  "features": [{
    "id": 1,
    "projectId": "proj-carb",
    "teamId": "carb-dp",
    "productId": "prod-a",
    "name": "Terminal Report",
    "planningStatus": "planned",
    "assignmentStatus": "ok",
    "startDate": "2026-05-06",
    "targetDate": "2026-06-20",
    "storyPoints": 13,
    "notes": "",
    "dependsOn": [3],
    "comments": [{
      "id": "c-1",
      "author": "Franklin",
      "text": "Waiting on API contract.",
      "createdAt": "2026-08-07T12:00:00Z"
    }],
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
  "formattingRules": [{
    "id": "rule-overdue",
    "projectId": "proj-carb",
    "name": "Overdue",
    "enabled": true,
    "matchMode": "all",
    "conditions": [{ "field": "target_date", "operator": "lt_today" }, { "field": "completed", "operator": "is_false" }],
    "actions": [{ "type": "left_border", "value": "#EF4444" }, { "type": "row_icon", "value": "clock" }]
  }, {
    "id": "rule-completed-overdue",
    "projectId": "proj-carb",
    "name": "Completed overdue",
    "enabled": true,
    "matchMode": "all",
    "conditions": [{ "field": "target_date", "operator": "lt_today" }, { "field": "completed", "operator": "is_true" }],
    "actions": [{ "type": "left_border", "value": "#F59E0B" }]
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

### `iteration_plans`

| Column | Type | Notes |
|--------|------|-------|
| id | text | Primary key (e.g. `plan-1`) |
| name | text | Display name (e.g. `CARB ART 2026`) |
| methodology | text | `safe` (v1); future methodologies allowed |
| created_at | text | ISO timestamp |

### `project_iteration_plans`

| Column | Type | Notes |
|--------|------|-------|
| project_id | text | FK → projects (unique — one plan per project) |
| plan_id | text | FK → iteration_plans |

### `program_increments` (timeboxes)

| Column | Type | Notes |
|--------|------|-------|
| id | text | Primary key |
| plan_id | text | FK → iteration_plans |
| name | text | Display name (e.g. `PI 26.2`) |
| start_date | text | ISO date |
| end_date | text | ISO date |
| sort_order | integer | Display order within plan |
| holiday_count | integer | Optional; informational only |

### `sprints`

| Column | Type | Notes |
|--------|------|-------|
| id | text | Primary key |
| timebox_id | text | FK → program_increments |
| number | integer | 1–4 for SAFe |
| name | text | Display name (e.g. `26.2.1`) |
| type | text | Free text (defaults `DEVELOPMENT` / `INNOVATION` from SAFe template) |
| scale | text | `day` \| `week` \| `month` — Gantt leaf granularity for this sprint |
| start_date | text | ISO date |
| end_date | text | ISO date |
| week_count | integer | Weeks in the sprint (used for SAFe date span) |

### `features`

| Column | Type | Notes |
|--------|------|-------|
| id | integer | Primary key; auto-increment identity (1, 2, 3…) |
| project_id | text | FK → projects |
| team_id | text | FK → teams; nullable when `planning_status = backlog` |
| product_id | text | FK → products |
| name | text | Display name |
| planning_status | text | `backlog` or `planned` |
| assignment_status | text | `ok` or `team_unassigned` |
| start_date | text | ISO date (YYYY-MM-DD); nullable in backlog |
| target_date | text | ISO date (YYYY-MM-DD); nullable in backlog |
| story_points | integer | Sum of US points; auto-calculated; informational |
| notes | text | Free-text annotation (~500 chars); nullable |
| completed | boolean | Default false |
| cross_pi | boolean | Default false |
| sort_order | integer | Row order in the feature panel |
| ado_work_item_id | integer | Nullable; for future ADO link |
| created_at | text | ISO timestamp |
| updated_at | text | ISO timestamp |

### `feature_dependencies`

| Column | Type | Notes |
|--------|------|-------|
| id | integer | Primary key |
| feature_id | integer | FK → features (dependent) |
| depends_on_id | integer | FK → features (predecessor) |
| created_at | text | ISO timestamp |

Unique constraint: `(feature_id, depends_on_id)`.

### `feature_comments`

| Column | Type | Notes |
|--------|------|-------|
| id | text | Primary key |
| feature_id | integer | FK → features |
| author | text | Actor display name |
| text | text | Comment body (max 500 chars) |
| created_at | text | ISO timestamp |
| updated_at | text | ISO timestamp; nullable |

### `formatting_rules`

| Column | Type | Notes |
|--------|------|-------|
| id | text | Primary key |
| project_id | text | FK → projects |
| name | text | Display name |
| enabled | boolean | Default true |
| conditions | text | JSON array of condition objects |
| actions | text | JSON array of action objects |
| sort_order | integer | Evaluation order (all matching rules apply) |
| created_at | text | ISO timestamp |
| updated_at | text | ISO timestamp |

### `feature_baselines`

| Column | Type | Notes |
|--------|------|-------|
| id | integer | Primary key |
| feature_id | integer | FK → features |
| start_date | text | Frozen start date |
| target_date | text | Frozen target date |
| frozen_at | text | ISO timestamp |
| frozen_by | text | Actor name |

### `user_stories`

| Column | Type | Notes |
|--------|------|-------|
| id | integer | Primary key |
| feature_id | integer | FK → features |
| title | text | US title |
| story_points | integer | Points for this US |
| sort_order | integer | Display order |
| created_at | text | ISO timestamp |

### `audit_events`

| Column | Type | Notes |
|--------|------|-------|
| id | integer | Primary key |
| feature_id | integer | FK → features (nullable for PI-wide events) |
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
| `GET/POST/PATCH/DELETE /api/features/:id/comments` | CRUD feature comments |
| `GET/POST/DELETE /api/features/:id/dependencies` | Manage feature dependencies |
| `GET/POST/PATCH/DELETE /api/projects/:id/formatting-rules` | CRUD formatting rules |
| `GET/POST/PATCH/DELETE /api/products` | Manage products per project |

Auth: TBD when backend is introduced. Actor name sent as a request header or body field.

---

## Implementation defaults

These were not explicitly discussed but are assumed unless changed:

| Topic | Default |
|-------|---------|
| Architecture | Frontend-only SPA, no backend (through MVP 2) |
| Data persistence | `localStorage` — projects, teams, products, features, baselines, audit events, layout |
| User display name | `localStorage` key `chronova-actor` (UI label **User**; audit field `actor`) |
| Left column width | Default 280px; min 200px, max 720px; collapsed 52px; persisted in `localStorage` |
| Sidebar | Collapsible; state persisted |
| Move reason | **TBD (MVP 2)** — required or optional |
| Date granularity on Gantt | Per-sprint leaf scale (`day` \| `week` \| `month`); feature dates remain ISO source of truth |
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
| Drag & drop (bars and rows) | Done — includes team change on section drop; blocked when feature is Delivered |
| Footer summary | Done |
| Seed data (3 PIs: 26.2–26.4) | Done |
| Add Feature modal | Done |
| Feature detail panel | Done — compact layout; Delivered locks dates; Comments/History at end |
| Client-side persistence (`localStorage`) | Done |
| User display name (sidebar) | Done — no blocking modal on app load |
| Home landing + brand chrome | Done — TimeHorizon, BrandWordmark, pillars |
| Onboarding: product tour | Done — `app-intro`, spotlight, real navigation |
| Onboarding: setup wizard + Gantt checklist | Done — `setupProjectForGantt`, `ganttReadiness` |
| Navigation memory (Home vs last page) | Done — `chronova-navigation` |
| Project hierarchy + navigation | Done |
| Collapsible sidebar with grouped nav | Done — Home · Timeline · Configuration |
| Team view toggle (All / Single) | Done |
| Assignment status icons | Done |
| Product CRUD + color picker | Done |
| Resizable / collapsible feature panel (split-pane) | Done |
| Edit feature name + team | Done |
| Today marker | Done — TODAY label in shared header row + body line |
| Timeline scroll position memory | Done — per project, on timeline exit |
| Plan markers (Gantt settings) | Done |
| Drag → team reassignment | Done |
| Dynamic week calendar | Phase A done (from iteration plan); infinite empty scroll deferred |
| MVP 1.6 (backlog, comments, rules, dependencies) | Done |
| MVP 1.7 (dates UX, View, collapsible sections, rule builder) | Done |
| Baseline / ghost bars / functional history | MVP 2 (blocked on MVP 1.7) |

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

### MVP 1.5 — Project hierarchy, navigation, and UX (complete)

**Frontend-only. No backend, API, database, or integrations.**

Application structure, navigation, and organizational model. Builds on MVP 1.

| # | Feature | Acceptance criteria |
|---|---------|---------------------|
| 1 | **Project-based hierarchy** | Project is the primary navigation unit; all work belongs to a project |
| 2 | **Project CRUD** | Create, rename, delete from app; delete blocked if features exist |
| 3 | **Team CRUD + assignment** | Global team registry; assign/unassign teams to projects |
| 4 | **Multiple teams per project** | 1..N teams per project |
| 5 | **Team view toggle** | `All teams` (grouped sections) / `Single team` (filter) |
| 6 | **Project → Team → Feature** | Every planned feature has project + team + product; traceable in UI and audit |
| 7 | **Assignment status + icons** | `team_unassigned` / `project_unassigned` with alert icon and tooltip |
| 8 | **Needs reassignment section** | At bottom in Single team view; bar positions unchanged |
| 9 | **Products per project** | Global product catalog; assigned to projects via `project_products`; shared across teams |
| 10 | **Product CRUD + color picker** | Create, rename, recolor (hex + native picker); delete blocked if features exist |
| 11 | **Orphaned products** | On empty project delete, products become `project_unassigned` |
| 12 | **Collapsible sidebar navigation** | Pages: **Home**, Timeline, Projects, Iterations, Teams, Products (grouped); User field in sidebar |
| 13 | **Resizable feature panel** | Left Gantt column draggable; width persisted in `localStorage` |
| 14 | **Full feature name visibility** | Names expand as panel widens; no truncate-only when space allows |
| 15 | **Edit feature name** | Editable in detail panel; immediate update in list and bar |
| 16 | **Dynamic week calendar** | **Phase A done** — calendar from assigned iteration plan; infinite empty scroll still deferred |
| 17 | **Today marker** | **TODAY** pill in shared header row + vertical line at current day; not editable |
| 18 | **Timeline scroll memory** | Per-project scroll saved on leaving Timeline (not F5); Today-centered default |
| 19 | **Plan markers** | Gantt Settings modal; per-project markers (date, label, color); scroll on create |
| 20 | **Drag → team change** | Drop feature under team section header to reassign; Needs reassignment clears team |
| 21 | **Detail panel dismiss** | Click outside timeline feature area closes detail panel |
| 22 | **Split-pane Gantt layout** | Shared header row (Features + timeline); bodies scroll in sync; horizontal header scroll synced with Gantt; resize at any scroll position |

> **MVP 1.5 scope is complete** except dynamic calendar (item 16), which may ship alongside MVP 1.6.

### MVP 1.6 — Planning enhancements (complete)

**Frontend-only.** Implements feedback from the Excel workflow refinement (August 2026).

| Phase | Features | Status |
|-------|----------|--------|
| **A** | Story points on row/bar; marker grouping; comments + notes | Done |
| **B** | Backlog (no team, optional dates) | Done |
| **C** | Formatting rules (overdue default); feature dependencies | Done |
| **D** | Dependency SVG connectors | Out of scope |

| # | Feature | Status |
|---|---------|--------|
| 1 | Story points on feature row | Done |
| 2 | Backlog features | Done |
| 3 | Missing dates indicator | Done |
| 4 | Assign team from backlog | Done (refined in MVP 1.7) |
| 5 | Feature notes | Done |
| 6 | Feature comments | Done |
| 7 | Marker grouping | Done |
| 8 | Formatting rules (basic) | Done (builder in MVP 1.7) |
| 9 | Feature dependencies | Done |

### MVP 1.7 — Timeline UX and rules builder (complete)

**Frontend-only. Single batch — must complete before MVP 2.** Implement in phases; validate acceptance criteria per phase before moving on.

Refinement: August 2026 (post-MVP 1.6 feedback).

**Implementation order:**

| Phase | Feature | Acceptance criteria |
|-------|---------|---------------------|
| **1** | **Dates UX** | Backlog create with empty dates; planned create with PI-pre-filled required dates; clear dates on edit → no bar + icon; assign team blocked inline without dates; footer counts valid Gantt bars only |
| **2** | **View filter** | Sidebar label **View**; options **All → Backlog → teams**; Backlog view filters only; team view + Needs reassignment; full CRUD in all views; `viewMode` replaces `teamViewMode` |
| **3** | **Collapsible sections** | Chevron on all sections; sync panel + Gantt; Collapse all / Expand all; `collapsedSections` per project in `localStorage` |
| **4** | **Rule builder** | Editable conditions (field + operator + value) and actions per rule; `name` conditions; pre-installed **Overdue** and **Completed overdue** rules |
| **5** | **Feature name** | Editable in detail panel only (verify existing behavior; no inline row edit) |

**Exit criteria (MVP 1.7 complete):**

- [x] All 5 phases passing acceptance criteria
- [x] `localStorage` migration: `viewMode`, `collapsedSections`; deprecate `teamViewMode`
- [x] `docs/project.md` reflects shipped behavior

### Post-MVP1.7 backlog

Features identified but **not** in MVP 1.6. Ordered by priority.

| Priority | Feature | Description | Rationale |
|----------|---------|-------------|-----------|
| 1 | **Gantt zoom UX polish** | Global scale control / denser day layout; per-sprint scale already supported | Optional enhancement on top of per-sprint `scale` |
| 2 | **Delivery commitment (star)** | Optional flag: "Product delivery date". Star icon at target date on the bar. Toggle in create modal and detail panel. | Core Excel convention; communicates executive delivery commitment. |
| 3 | **Bar labels and hover** | Feature name truncated inside bar; hover shows start date, target date, and notes preview. | Visual polish; complements notes and dates already on features. |
| 4 | **Filter: delivery commitments** | Toggle or filter to show only features with delivery star. | Useful once delivery commitment exists; depends on priority 2. |
| 5 | **Milestone types / icons** | Optional icon or type per marker (planning, release, regulatory, etc.). | Clarifies marker meaning; build after basic markers work. |
| 6 | **Dependency SVG connectors** | Curved lines between related bars on feature select | Deferred from MVP 1.6; highlight + list is sufficient for v1 |
| 7 | **Gantt settings expansion** | Additional tabs (filters, export prefs, etc.) | Extensible shell already in place |
| 8 | **Formatting rule preview** | "Matches N features" preview in rule builder | Deferred from MVP 1.7 |

**Explicitly not planned:**

- Free-form text boxes on the Gantt canvas (Excel-style arbitrary annotations) — structured milestones and notes cover the main use case.
- Nested comment replies — flat thread only in v1.

### MVP 2 — Baseline, history, and deviations (frontend-only)

> **Blocked until MVP 1.7 is complete.** To be refined in a future session. Identified scope below; details (move-reason rules, re-freeze) pending.

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
| 12 | How to create features? | Resolved (modal: team optional for backlog, product required, dates optional in backlog) |
| 13 | Feature positioning model | Resolved (dates → weeks; day display-only) |
| 14 | PI display on Gantt | Resolved (continuous scroll; dynamic weeks when unconfigured) |
| 15 | Backlog vs team_unassigned | Resolved (backlog = no team, no bar; team_unassigned = broken assignment, bar preserved) |
| 16 | Story points visibility | Resolved (row badge + bar suffix when space; planned features only in footer) |
| 17 | Comments vs notes | Resolved (separate fields; flat comment thread; notes = single annotation) |
| 18 | Formatting rules scope | Resolved (per project; all rules apply; overdue default disableable; day-level) |
| 19 | Feature dependencies | Resolved (depends on only; highlight + list; no SVG in MVP 1.6) |
| 20 | Marker grouping | Resolved (generic pill; expand to header labels + popover; single body line) |
| 21 | Optional dates + team assign gate | Resolved — team selectable while editing; dates required on Save when team assigned |
| 22 | View filter (All / Backlog / Team / Product focus) | Resolved (MVP 1.7 team view; product focus added post-1.7) |
| 23 | Collapsible sections | Resolved (MVP 1.7 — all sections + collapse/expand all) |
| 24 | Rule criteria builder | Resolved (MVP 1.7 — editable conditions; Completed overdue rule) |
| 25 | Feature name edit | Resolved (detail panel only; no inline row edit) |
| 26 | Move reason: required or optional? | Open — refine in MVP 2 |
| 27 | Re-freeze baseline for individual feature? | Open — refine in MVP 2 |
| 28 | Backend, database, and hosting stack? | Deferred — MVP 3; see [free-hosting-proposal.md](./free-hosting-proposal.md) |

---

## Glossary

| Term | Definition |
|------|------------|
| **Project** | Primary organizational unit — all features belong to a project; multiple teams can be assigned |
| **Team** | Global registry of teams; assigned to one or more projects; planned features belong to one team |
| **Product** | Global identification label (name + color); assigned to projects via `project_products` — not an epic or backlog parent |
| **Planning status** | `backlog` or `planned` — whether the feature appears on the Gantt timeline |
| **Backlog** | Features without a team; listed in the feature panel only; no Gantt bar |
| **Assignment status** | `ok` or `team_unassigned` / `project_unassigned` — indicates broken entity relationships |
| **Needs reassignment** | UI section for planned features whose team is no longer assigned to the project |
| **Notes** | Single free-text annotation per feature (~500 chars); distinct from comments |
| **Comments** | Flat discussion thread per feature with author and timestamp |
| **Formatting rule** / **Rule** | Per-project condition → visual action rule evaluated against feature fields; UI tab labeled **Rules** |
| **Depends on** | Unidirectional dependency link between features in the same project |
| **Overdue** | Formatting rule: `target_date < today` and `completed = false` |
| **Completed overdue** | Feature delivered (`completed = true`) after `target_date` |
| **View** | Timeline sidebar filter: All, Backlog, or a single team |
| **Collapsed section** | Team, Backlog, or Needs reassignment block hidden in panel and Gantt |
| **Valid Gantt bar** | Feature with team + start date + target date — used for footer counts |
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
| **User** | Display name of the person making changes (UI); stored as `chronova-actor`; audit field `actor` |
| **Product tour** | Guided spotlight walkthrough (`app-intro`); extensible via `src/tours/registry.js` |
| **Setup wizard** | Multi-step flow to create project, calendar, team, and first Gantt feature |
| **Gantt-ready** | Project has plan/timebox, product, and team — can add planned features to the Timeline |

---

## Document index

| Document | Purpose |
|----------|---------|
| [project.md](./project.md) | Product definition, behavior, data shapes (this file) |
| [project-def-example.md](./project-def-example.md) | Reference template for this document's structure |
| Data model & API sections | Future MVP 3 reference — not current implementation scope |
| [MVP 1.5](#mvp-15--project-hierarchy-navigation-and-ux-complete) | Project hierarchy and navigation (complete) |
| [MVP 1.6](#mvp-16--planning-enhancements-complete) | Planning enhancements (complete) |
| [MVP 1.7](#mvp-17--timeline-ux-and-rules-builder-complete) | Timeline UX and rules builder (complete) |
| [MVP 2](#mvp-2--baseline-history-and-deviations-frontend-only) | Next implementation focus |
| [Post-MVP1.7 backlog](#post-mvp17-backlog) | Prioritized features after MVP 1.7 |
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
| 2026-08-07 | MVP 1.6 defined: backlog features, SP visibility, notes, comments, formatting rules, dependencies, marker grouping; refinement decisions from Excel workflow feedback |
| 2026-08-08 | Detail panel: explicit Save with draft state; unsaved-changes dialog; team/dates validated on save |
| 2026-08-08 | Rules UX polish: tab renamed to Rules; AND/OR matchMode; all rules deletable; row-icon tooltips; alert-triangle fix; marker group expand shows popover only |
| 2026-08-08 | MVP 1.7 implemented: dates UX, View filter, collapsible sections, rule builder, Completed overdue rule; MVP 1.7 marked complete |
| 2026-08-08 | Feature ID: auto-generated integer identity on save; custom ID input removed; legacy `F-*` migrated |
| 2026-08-08 | **Iterations Phase A:** reusable iteration plans (SAFe PIs/sprints); one plan per project; timeline calendar derived from plan; current timebox = contains today |
| 2026-08-08 | Iterations UX: project assign only on Projects; Create iteration; sprint name/type/scale (day/week/month); remove Current/Baseline + breadcrumb; Plan label on Timeline; single page titles |
| 2026-08-09 | **Home** landing: TimeHorizon, BrandWordmark, sidebar groups (Home · Timeline · Configuration) |
| 2026-08-09 | **Onboarding:** product tour (`app-intro`), setup wizard, Gantt checklist, `ganttReadiness`, `setupProjectForGantt`; navigation memory (`chronova-navigation`) |
| 2026-08-09 | UI: User label in sidebar (replaces Actor modal); feature panel UX polish; Delivered locks dates; dependency ID normalization |
| 2026-08-09 | First-visit **Take a tour** CTA highlight on Home |
| 2026-08-14 | **Feature search:** filter feature panel + Gantt rows by name or ID; auto-expand matching sections; not persisted |
| 2026-08-14 | **Product focus:** highlight/dim (not hide); independent Team + Product sidebar controls; footer cross-team hint with tooltip; `filterProductId` in state |
