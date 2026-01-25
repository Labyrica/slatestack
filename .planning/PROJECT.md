# Slatestack

## What This Is

A lightweight, self-hosted headless CMS that drops behind any React site with minimal setup. An admin panel at /admin for defining collections and managing content, REST APIs at /api for frontends to consume, local media uploads, privacy-friendly pageview metrics, and a demo frontend at / to preview published content. Built for small teams who want content management without adopting a platform.

## Core Value

Zero-friction backend module: define your content schema in the UI, get stable APIs instantly, deploy with one command.

## Current State

**Version:** v1.3 Polish & Public API (in progress)
**Codebase:** ~13,500 lines TypeScript across 200+ files
**Stack:** Node + Fastify + Drizzle + PostgreSQL + React + Vite + Recharts + Zustand

**What's Working:**
- Authentication with better-auth (email/password, sessions, admin/editor roles)
- Content modeling with 10 field types (string, text, number, boolean, date, rich text, media, select, multi-select, slug)
- Entry management with dynamic forms and validation
- Media library with upload, crop, and picker
- Privacy-friendly metrics (no cookies, hashed visitor IDs)
- Docker deployment with one command
- Demo frontend showing published content
- Arsenal design system with Space Grotesk typography
- Light/dark/system theme with three-way toggle
- Enhanced Metrics page with charts and trend indicators
- Settings page with system info
- Full mobile responsiveness with 44px touch targets
- Responsive dialogs (drawer on mobile, dialog on desktop)
- Mobile navigation drawer
- Mobile card views for data tables

## Requirements

### Validated (v1.0 + v1.1 + v1.2)

- Admin created from env vars on startup — v1.0
- Email/password login with session persistence — v1.0
- Two roles (admin/editor) with RBAC — v1.0
- Collections with 10 field types — v1.0
- Entry CRUD with dynamic forms — v1.0
- Media upload with image processing — v1.0
- Public content API — v1.0
- Privacy-friendly metrics — v1.0
- Admin panel at /admin — v1.0
- Docker deployment — v1.0
- Arsenal design system with dark mode — v1.1
- Space Grotesk typography and color tokens — v1.1
- Staggered animations and reduced-motion support — v1.1
- Settings page with system info — v1.1
- Metrics page with charts and trends — v1.1
- Light theme with three-way toggle (light/dark/system) — v1.2
- Semantic CSS tokens for theming — v1.2
- 44px minimum touch targets for mobile — v1.2
- ResponsiveDialog (drawer on mobile) — v1.2
- Mobile navigation drawer — v1.2
- Mobile card views for data tables — v1.2

### Active

**v1.3 Polish & Public API:**
- [ ] Color preset themes (multiple color schemes beyond light/dark)
- [ ] Theme settings integration (remove misleading "Dark mode always on")
- [ ] Public metrics API (aggregate visitor stats: today, week, month, all-time)
- [ ] Media library storage indicator (total upload size counter/bar)
- [ ] Login page visual polish (match Arsenal design)
- [ ] Login page features (remember me, forgot password link)
- [ ] Status indicator in header (database connection status)
- [ ] Status indicator on login page

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
| Postgres over SQLite for MVP | Reliable, scales without surprises, Docker Compose makes it trivial | ✓ Good |
| Env vars for first admin | Simpler than wizard, scriptable, no UI needed before auth exists | ✓ Good |
| Two roles only (admin/editor) | Small teams don't need complex permissions | ✓ Good |
| Aggregate metrics only | GDPR-friendly by architecture, no PII to manage | ✓ Good |
| UI-first schema modeling | Config files are power-user feature, UI is the default | ✓ Good |
| Local file storage | No external services, self-contained deployment | ✓ Good |
| better-auth for authentication | Simplifies session management, good Fastify integration | ✓ Good |
| JSONB for schema storage | Flexible, no migrations for schema changes | ✓ Good |
| TypeBox for runtime validation | Type-safe validation from dynamic schemas | ✓ Good |
| Magic number validation | Prevents MIME type spoofing attacks | ✓ Good |
| Multi-stage Docker builds | Minimal production image, secure | ✓ Good |
| Arsenal design system | Consistent, modern UI with dark mode foundation | ✓ Good |
| Space Grotesk font | Modern geometric sans-serif, excellent readability | ✓ Good |
| Recharts for metrics | Lightweight, React-native charting | ✓ Good |
| Hash-based color assignment | Consistent colors for dynamic content | ✓ Good |
| Three-way theme toggle | Respect system preference, allow user override | ✓ Good |
| 44px touch targets | Apple HIG / Android guidelines for accessibility | ✓ Good |
| Dialog-to-drawer pattern | Native-feeling mobile experience | ✓ Good |
| Card views for mobile tables | Better mobile data presentation than scrolling | ✓ Good |
| Zustand for drawer state | Simple global state, already in use | ✓ Good |

## Current Milestone: v1.3 Polish & Public API

**Goal:** Expand theming with color presets, expose public metrics API for frontend widgets, add polish to login and media library, add system status indicators.

**Target features:**
- Color preset themes (beyond light/dark/system)
- Public metrics API for frontend visitor widgets
- Media library storage indicator
- Enhanced login page with features
- System status indicators (database, etc.)

---
*Last updated: 2026-01-25 after v1.3 milestone start*
