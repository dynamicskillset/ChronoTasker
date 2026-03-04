# Plan

> Last updated: 2026-03-02
> Status: In progress — MVP deployed

## Objective

Build ChronoTasker: a visual time-planning tool that combines time-blocking (inspired by Nautilus Omnibus) with integrated Pomodoro timers. Users should be able to plan their day visually, see time passing, and work in structured focus/break cycles. Syncs across Android, Mac, and Linux.

## Approach

- PWA frontend (Vite + React + TypeScript) for cross-device access
- Express + SQLite backend on VPS for sync
- Bearer token auth (single user)
- Offline-first with localStorage fallback

## Tasks

- [x] Set up project template
- [x] Define tech stack and architecture
- [x] Build backend API (Express + SQLite + auth + sync)
- [x] Build circular clock visualisation (SVG)
- [x] Build Pomodoro timer (25/5/15 cycles with notifications)
- [x] Build task input and management
- [x] Build sync service (offline-first)
- [x] Deploy to VPS (pm2 + Caddy)
- [ ] Set up DNS for chronotasker.dougbelshaw.com ← **NEEDS USER ACTION**
- [ ] Test on all three devices (Android/Mac/Linux)
- [ ] Install as PWA on each device
- [x] Add iCal calendar feed integration with meeting buffer
- [x] Add reschedule tasks to another day
- [x] Add help modal
- [x] Add HTTP basic auth via Caddy
- [x] Accessibility and theming audit fixes (critical/high items done, medium/low remain)
- [x] Colour-matched task list borders to clock face arcs
- [x] Widened Custom duration pill to fit placeholder text
- [ ] Polish UI and fix any bugs found in testing

## Decisions Made

| Decision | Rationale | Date |
|----------|-----------|------|
| Use claude-code-template | Consistent project structure with session continuity | 2026-03-02 |
| Vite + React + TypeScript | Simple, fast, good DX, no SSR needed | 2026-03-02 |
| PWA for cross-device | One codebase works on Android, Mac, Linux browsers | 2026-03-02 |
| Express + SQLite backend | Simple, single-file DB, no extra services needed | 2026-03-02 |
| Bearer token auth | Single-user tool, simple security | 2026-03-02 |
| Caddy reverse proxy | Already running on VPS, auto HTTPS | 2026-03-02 |
| SVG for clock visualisation | Scalable, interactive, accessible | 2026-03-02 |
| iCal feed for calendar events | Show meetings on clock, schedule tasks around them | 2026-03-03 |
| HTTP basic auth via Caddy | Protect deployed instance without app-level auth changes | 2026-03-03 |

## Open Questions

- [ ] Domain DNS — needs A record for chronotasker.dougbelshaw.com -> 80.78.23.57
- [ ] Open source?

## Out of Scope

Things we've explicitly decided NOT to do (yet):

- Multiple user accounts
- Mobile native app
