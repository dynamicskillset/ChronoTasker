# Project: ChronoTasker

A visual time-planning tool with integrated Pomodoro timer, inspired by Nautilus Omnibus's time-blocking approach

## Concept

**Inspiration:**
- [Nautilus Omnibus](https://nautilus-omnibus.web.app/) — spiral/clock visualisation of the day, plain-text task input, auto-advance "red hand of time"
- [How I learned to plan better](https://lifehacky.net/how-i-learned-to-plan-better-and-what-to-do-when-your-head-doesnt-get-lists-21b79de56464) — why visual time-blocking works better than lists for many people
- [Pomodoro Technique](https://en.wikipedia.org/wiki/Pomodoro_Technique) — 25min work / 5min break / 15min long break after 4 cycles

**Key ideas:**
- Visual time-blocking: see your day as time, not a list
- Pomodoro integration: structured work/break cycles within time blocks
- Syncs across devices via API backend
- Simple input: type tasks, tool does the visualisation

## Architecture

- `chronotasker-app/` — Vite + React + TypeScript PWA frontend
  - `src/components/` — ClockFace (SVG), PomodoroTimer, TaskList, TaskForm
  - `src/hooks/` — usePomodoro, useSync
  - `src/services/` — API client with snake_case/camelCase conversion, localStorage
  - `src/utils/` — task scheduling, time formatting
  - `src/types/` — shared TypeScript interfaces
- `server/` — Express + better-sqlite3 API backend
  - `src/routes/` — tasks, pomodoro, settings, sync
  - `src/middleware/` — bearer token auth
  - `src/db.ts` — SQLite with WAL mode
- `deploy/` — deployment scripts and nginx config (unused; using Caddy)

## Deployment

- VPS: `root@80.78.23.57` (Debian, Caddy reverse proxy in Docker)
- Backend: pm2 process "chronotasker" on port 3001
- Frontend: served by Caddy from `/opt/ghost/sites/chronotasker/` and also by Express as fallback
- Domain: `chronotasker.dougbelshaw.com` (needs DNS A record pointing to 80.78.23.57)
- Direct access: `http://80.78.23.57:3001` (works without DNS)
- API token in `/opt/chronotasker/server/.env`

## Commands

- `cd chronotasker-app && npm run dev` — start frontend dev server
- `cd chronotasker-app && npm run build` — production build
- `cd server && npm run dev` — start backend dev server
- `cd server && npm run build` — compile TypeScript

## Standards

- TypeScript strict mode
- React functional components with hooks
- BEM naming for CSS
- Snake_case in API/DB, camelCase in frontend (converted at API boundary)
- Offline-first: localStorage fallback, sync when online

## Verification

- Run `cd chronotasker-app && npm run build` after frontend changes
- Run `cd server && npm run build` after backend changes
- Test API: `curl -H "Authorization: Bearer TOKEN" http://localhost:3001/api/tasks?date=YYYY-MM-DD`

## Working Rules

- Always check for existing patterns before creating new ones
- Prefer small, incremental changes over big rewrites
- If a task will take more than ~50 lines of changes, use plan mode first
- Don't add dependencies without asking
- Don't refactor code that wasn't part of the task

## State & Progress

> Updated: 2026-03-02
> Current focus: MVP deployed, needs DNS and testing
> Status: v0.1 deployed to VPS

See PLAN.md for task tracking, STATE.md for system state, HANDOFF.md for session notes.

## Known Issues

- DNS not configured for chronotasker.dougbelshaw.com (accessible via http://80.78.23.57:3001)
- No HTTPS when accessing via IP directly (only via Caddy with domain)
- PWA install requires HTTPS (works via Caddy domain only)

## Lessons Learned

- Server uses Caddy in Docker as reverse proxy, not nginx directly
- Docker gateway IP (172.19.0.1) needed to reach host services from Caddy container
- API uses snake_case (SQLite columns), frontend uses camelCase — conversion at API boundary
