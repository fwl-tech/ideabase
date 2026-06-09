# Product spec — ideabase

**Version**: 1.0
**Status**: Draft
**URL**: https://hatchai.fairwaterlabs.com/apps/ideabase
**Repo**: https://github.com/fwl-org/ideabase
**Updated**: 2026-06-09

---

## Problem

FWL venture studio theme owners need a dedicated place to develop and track dual-use defense tech startup ideas from initial curiosity through to validated conviction. Currently, research links get lost in SMS threads, conversation notes go in scattered docs, and there's no structured way to build up a holistic view of an opportunity across problem, solution, commercial model, competitors, and demand signals. Ideabase gives theme owners a single, searchable, well-organised tool to capture everything around an idea as it develops.

## Users

| Persona | Description | Key need |
|---------|-------------|----------|
| Theme Owner | FWL venture studio partner or associate responsible for a domain area | Capture and organise research fast, build conviction over time |

## Core actions

### 1. Manage Areas of Interest
The user creates an area of interest (e.g. "Autonomous Logistics" or "RF Sensing"). Within each area they can add startup ideas. Areas serve as the top-level organising structure.

**Success**: The user can see all their areas at a glance and drill into any one to find all related ideas.

### 2. Build out a Startup Idea
Within an area, the user adds a startup idea and progressively fills out a structured opinion across: problem, proposed solution, commercial models, competitors, and demand signals. Fields can be filled in gradually — nothing is required upfront. Status is a freeform label the user sets themselves (e.g. "Exploring", "Strong signal", "Passed").

**Success**: Each idea has a clear, scannable summary of the current thesis at any stage of maturity.

### 3. Capture Links and Notes
Against any idea, the user can quickly add a link (e.g. pasted from an SMS), attach a note, or log a conversation summary with an industry contact. Links should be capturable in one tap on mobile.

**Success**: No link or note is ever more than 2 taps away from being saved against the right idea.

### 4. Search and Browse
The user can search across all ideas, notes, links, and conversation summaries. Results are clearly grouped by idea and area.

**Success**: The user can find any piece of information within a few seconds.

## Data model

| Entity | Key fields |
|--------|-----------|
| User | id, email, name, google_id |
| Area | id, user_id, name, description, created_at |
| Idea | id, area_id, user_id, title, status (freeform text), problem, solution, commercial_models, competitors, demand_signals, created_at, updated_at |
| Link | id, idea_id, url, title, summary, added_at |
| Note | id, idea_id, body, created_at |
| Conversation | id, idea_id, contact_name, contact_role, summary, date |

## Auth

Google SSO, restricted to `@fairwaterlabs.com` domain.

**Protected routes**: all app routes — no unauthenticated access.
**Public routes**: `/login` only.

## API surface

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/areas | List all areas for current user |
| POST | /api/areas | Create area |
| GET | /api/areas/:id | Get area with ideas |
| GET | /api/ideas/:id | Get idea with links, notes, conversations |
| POST | /api/ideas | Create idea |
| PATCH | /api/ideas/:id | Update idea fields |
| POST | /api/links | Add link to idea |
| POST | /api/notes | Add note to idea |
| POST | /api/conversations | Add conversation summary |
| GET | /api/search?q= | Full-text search across all content |

## UI screens

1. **Home / Areas** — Clean grid of areas of interest with idea count. Minimal, structured layout.
2. **Area detail** — All ideas within an area as scannable cards showing title and freeform status label.
3. **Idea detail** — Full thesis view: structured opinion fields (problem, solution, commercial models, competitors, demand signals), plus a chronological feed of links, notes, and conversations below. Quick-add bar at top for capturing a link or note fast.
4. **Quick capture** — Mobile-optimised bottom sheet: paste a link, pick the idea, add an optional note, save. Reachable in one tap.
5. **Search** — Full-text search with results grouped by idea.
6. **Login** — Google SSO sign-in page.

## Design principles

- Minimal and structured: clean typography, clear hierarchy, no visual clutter.
- Mobile-first: all key actions must be comfortable on a phone screen.
- Speed of capture: reducing friction for saving a link or note is the top UI priority.

## Constraints

- Must be fully mobile-responsive.
- Link capture from SMS (paste + assign to idea) must be frictionless — no more than 2 taps on mobile.
- No public sharing or collaboration features in v1.
- No AI-generated content in v1 — all entries are user-authored.

> **Assumed:** Single-user per account for v1 — no team sharing within the studio.

## Success metric

Ideas and their associated research are easy to find and neatly organised — any piece of captured information is locatable within a few seconds.

## Open questions

1. Should all theme owners see each other's areas, or is each person's knowledge base private to them?
