# Slatestack

## What This Is

A lightweight, self-hosted headless CMS that drops behind any React site with minimal setup. An admin panel at /admin for defining collections and managing content, REST APIs at /api for frontends to consume, local media uploads, privacy-friendly pageview metrics, and a demo frontend at / to preview published content. Built for small teams who want content management without adopting a platform.

## Core Value

Zero-friction backend module: define your content schema in the UI, get stable APIs instantly, deploy with one command.

## Current State

**Version:** v1.0 MVP (shipped 2026-01-23)
**Codebase:** 9,019 lines TypeScript across 125 files
**Stack:** Node + Fastify + Drizzle + PostgreSQL + React + Vite

**What's Working:**
- Authentication with better-auth (email/password, sessions, admin/editor roles)
- Content modeling with 10 field types (string, text, number, boolean, date, rich text, media, select, multi-select, slug)
- Entry management with dynamic forms and validation
- Media library with upload, crop, and picker
- Privacy-friendly metrics (no cookies, hashed visitor IDs)
- Docker deployment with one command
- Demo frontend showing published content

## Requirements

### Validated (v1.0)

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

### Active

(Define for next milestone)

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

---
*Last updated: 2026-01-23 after v1.0 milestone*
