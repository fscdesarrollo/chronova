# Free Hosting Proposal — Chronova

How to host this app at **$0/month** for a small internal team (executives, POs, RTEs, leads), with no custom domain and light usage.

**When this applies:** MVP 1 and MVP 1.5 are frontend-only (`localStorage`). This proposal targets **MVP 3 — Backend & persistence**, when the team needs shared data across browsers. Until then, run locally or deploy a static build without a backend.

## Project requirements

| Requirement | Detail |
|-------------|--------|
| Frontend | React (CSR), static build via Vite |
| Backend | Small API (teams, features, baselines, audit events) |
| Database | Reliable, free persistence |
| Auth | Single shared password, ~7-day session (team gate); actor name per request (no user accounts) |
| Traffic | Very low (one team, handful of users, few edits per day) |
| Domain | Free provider subdomain (no custom domain) |

**Constraint:** Everything must stay on free tiers. No paid services.

---

## Recommended stack: Cloudflare (all-in-one)

**Stack:** Vite + React → **Cloudflare Pages** · API via **Cloudflare Workers** · **D1** (managed SQLite)

Single vendor, always-on on the free tier, no database pause after inactivity.

### Why it fits

- **Cost:** $0 on free tiers for this usage level.
- **Single platform:** Frontend, API, and database under one Cloudflare account.
- **Always responsive:** Unlike some free Postgres hosts, D1 does not pause when unused — important for a tool opened sporadically before PI reviews.
- **Performance:** Global CDN; fast loads on desktop (primary) and mobile.
- **URL included:** Something like `chronova.pages.dev` (rename the project in Cloudflare settings).

### Free tier limits (more than enough for one team)

| Service | Free limit | Estimated usage |
|---------|------------|-----------------|
| Cloudflare Pages | Unlimited builds, generous bandwidth | 1 deploy per change, minimal traffic |
| Workers | 100,000 requests/day | Tens to hundreds per day |
| D1 | 5 GB storage, millions of read rows/month | Dozens of features, hundreds of audit events per PI |

### Architecture

```
[Browser — executives / PO / RTE]
       │
       ▼
[Cloudflare Pages]      ←  static files (Vite React build)
       │
       ▼  /api/*
[Cloudflare Worker]     ←  timeline CRUD, baseline freeze, audit log (e.g. Hono)
       │
       ▼
[D1 SQLite]             ←  teams, products, PIs, sprints, features, baselines, audit_events
```

### Authentication

- Password **never** lives in the frontend bundle.
- The Worker validates a team shared password (bcrypt hash) and sets an `HttpOnly` cookie with a **7-day** expiry.
- All API routes require a valid session.
- **Actor name** (who moved a feature, who froze baseline) is sent in the request body or `X-Actor` header — same model as MVP 1 `localStorage`, not a login system.

### Secrets

- `APP_PASSWORD_HASH`, `SESSION_SECRET` → Cloudflare Worker environment variables (free).
- Never commit secrets to the repository.

### Deployment

1. Private GitHub repo (recommended).
2. Connect repo to Cloudflare Pages: build command `npm run build`, output directory `dist`.
3. Worker lives in the same repo (`worker/`) and is bound to the Pages project or deployed as a separate Worker with routes.
4. Create a D1 database; apply SQL migrations once via `wrangler d1 execute` or the Cloudflare dashboard.
5. Share the `*.pages.dev` URL with the team (e.g. internal chat or bookmark).

### Trade-offs (acceptable for this use case)

- **SQLite (D1) not Postgres** — fine at this scale; SQL is standard and portable. Matches the data model in `project.md`.
- **Slightly more initial setup** than Netlify + Supabase (Wrangler CLI, D1 bindings) — one-time cost.
- Worker cold starts are negligible (~0–50 ms) for this traffic.

---

## Fallback: Netlify + Supabase (also $0)

If you prefer Netlify's deploy UX or want a Postgres dashboard, this stack still works at zero cost.

| Service | Role |
|---------|------|
| Netlify | Static React hosting |
| Netlify Functions | API |
| Supabase | Postgres database |

**Downside:** Supabase free tier pauses after ~1 week of inactivity; first load after pause can take several seconds.

Only consider this if Cloudflare setup becomes a blocker — not the primary choice for this project.

---

## Not recommended

| Option | Reason |
|--------|--------|
| **Render / Fly.io free tier** | Services sleep on inactivity; poor UX before executive reviews. |
| **GitHub Pages only** | No backend or database — cannot share timeline state across browsers. |
| **Custom domain** | Unnecessary annual cost for this scope. |
| **Firebase** | Awkward fit for single shared-password + simple actor-name model. |
| **Paid tiers** | Out of scope — team wants zero cost. |

---

## Monthly cost estimate

| Item | Cost |
|------|------|
| Cloudflare Pages | $0 |
| Cloudflare Workers | $0 |
| D1 database | $0 |
| Custom domain | $0 (use `*.pages.dev`) |
| **Total** | **$0/month** |

---

## Technical next steps (when building MVP 3)

1. Monorepo layout: keep current Vite app at repo root (or move to `client/`) and add `worker/` (API with Hono or similar).
2. D1 schema aligned with `project.md`: `projects`, `teams`, `project_teams`, `products`, `project_products`, `program_increments`, `sprints`, `features`, `feature_baselines`, `user_stories`, `audit_events`.
3. `wrangler.toml`: Worker config, D1 binding, Pages integration.
4. Pages `_redirects` or `public/_routes.json` for SPA client-side routing and `/api/*` proxy to Worker.
5. Auto-deploy on push to `main` via Cloudflare Pages + GitHub integration.
6. Optional manual backup: export endpoint or `wrangler d1 export` (on demand, no extra cost).
7. Migrate frontend from `localStorage` to API calls — data shapes already match the future model in `project.md`.

---

## Data and privacy notes

- Use a **private** GitHub repository.
- Do not advertise the URL; add `robots.txt` to discourage crawlers.
- Rotate the shared password if someone leaves the team.
- Monthly data export as an informal backup is a good habit (especially before PI baseline freeze).
