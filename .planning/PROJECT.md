# Slatestack

## What This Is

A lightweight, self-hosted headless CMS that drops behind any React site with minimal setup. An admin panel at /admin for defining collections and managing content, REST APIs at /api for frontends to consume, local media uploads, and privacy-friendly pageview metrics. Built for small teams who want content management without adopting a platform.

## Core Value

Zero-friction backend module: define your content schema in the UI, get stable APIs instantly, deploy with one command.

## Requirements

### Validated

(None yet — ship to validate)

### Active

**Authentication & Users**
- [ ] First admin created via env vars on startup (ADMIN_EMAIL, ADMIN_PASSWORD)
- [ ] Admin can create/invite editors in UI
- [ ] Two roles only: admin (full access) and editor (content only)
- [ ] Session-based auth for admin panel

**Collections (Content Modeling)**
- [ ] Create collections via UI with name and API slug
- [ ] Field types: string, rich text, date, media, multi-select, auto-slug
- [ ] Schema stored as JSON in database
- [ ] Schema changes immediately reflected in APIs

**Entries (Content Management)**
- [ ] CRUD entries via generated forms based on collection schema
- [ ] Draft and publish workflow
- [ ] Entries validate against collection schema

**Media**
- [ ] Upload images and files via admin UI
- [ ] Local file storage (no external services)
- [ ] Media picker field type for collections

**Metrics**
- [ ] POST /api/metrics/pageview accepts { path, referrer }
- [ ] Aggregate counts by time bucket (hour) and path
- [ ] Optional referrer domain tracking
- [ ] Dashboard card with totals and 7-day trend
- [ ] Dedicated metrics page with top pages and filtering
- [ ] No cookies, no fingerprinting, no IP storage, no user profiles

**Admin Panel**
- [ ] Served at /admin
- [ ] Collections management UI
- [ ] Entries management with generated forms
- [ ] Media library
- [ ] Metrics dashboard
- [ ] User management (admin only)

**Public API**
- [ ] GET /api/content/{collection} — published entries
- [ ] GET /api/content/{collection}/{slug} — single entry
- [ ] Stable, predictable endpoints

**Admin API**
- [ ] Full CRUD for collections, entries, media
- [ ] Metrics endpoints (summary, top-pages)
- [ ] Authenticated via session

**Deployment**
- [ ] Single repo, single Docker Compose file
- [ ] Postgres as default database
- [ ] Minimal env vars (DB connection, admin credentials, secret key)
- [ ] Admin served as static files by API or reverse proxy

### Out of Scope

- OAuth/social login — email/password sufficient for small teams
- Real-time/websockets — REST is enough for this use case
- Multi-tenancy — single instance per project
- Unique visitor tracking — aggregate pageviews only, no PII
- SQLite support — Postgres only for MVP, SQLite can come later
- Setup wizard — env vars are simpler and scriptable
- GraphQL — REST with stable endpoints is the goal

## Context

Existing headless CMS options (Strapi, Payload, WordPress) are either too heavy, too opinionated, or push you into their stack and workflows. Slatestack is designed to be a backend module you drop in, not a platform you adopt.

Target users: developers building React sites who want content management without complexity. Small teams of 1-3 people.

The content schema should be simple enough that an AI can generate a frontend from it.

## Constraints

- **Stack**: Node + TypeScript + Fastify + Postgres
- **Architecture**: Modular — auth, collections, entries, media, metrics as isolated modules with clear boundaries
- **Code style**: Boring defaults, minimal dependencies, predictable folder structure, strong typing, validation everywhere
- **Extensibility**: Adding a new endpoint or admin page should be obvious and isolated
- **Deployment**: One repo, `docker compose up`, no external services required

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Postgres over SQLite for MVP | Reliable, scales without surprises, Docker Compose makes it trivial | — Pending |
| Env vars for first admin | Simpler than wizard, scriptable, no UI needed before auth exists | — Pending |
| Two roles only (admin/editor) | Small teams don't need complex permissions | — Pending |
| Aggregate metrics only | GDPR-friendly by architecture, no PII to manage | — Pending |
| UI-first schema modeling | Config files are power-user feature, UI is the default | — Pending |
| Local file storage | No external services, self-contained deployment | — Pending |

---
*Last updated: 2026-01-23 after initialization*
