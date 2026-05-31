# AI Student Hub - Handoff

## Project Overview

Full-stack student productivity app: tasks + schedule + notes + pomodoro + AI assistant.

- **Repo**: https://github.com/sevennnnnn-rong/ai-student-hub
- **Version**: v1.2.0 (latest commit: 1120af8)
- **Tech stack**: Next.js 16.2.6 + React 19 + Tailwind CSS v4 + Capacitor 6 + Python FastAPI
- **Architecture**: Local-first with IndexedDB, offline sync queue, `useSyncExternalStore` stores

## Architecture Summary

### Local-First Data Layer

All data persists in IndexedDB before attempting server sync. The app works fully offline.

```
User Action → useSyncExternalStore hook → IndexedDB write → SyncQueue (if offline)
                                                    ↓
                                          SyncManager drains queue on reconnect
```

**5 IndexedDB stores** (`frontend/src/lib/db.ts`):
- `tasks` -- task items with status/updated_at/synced indexes
- `courses` -- schedule entries with day_of_week index
- `notes` -- freeform notes
- `pomodoroSessions` -- completed pomodoro records
- `syncQueue` -- pending write operations (POST/PUT/DELETE) queued while offline

**SyncQueue** (`frontend/src/lib/sync-queue.ts`): Enqueues API writes when offline, marks synced/failed on replay, auto-clears synced entries.

**SyncManager** (`frontend/src/lib/sync-manager.ts`): Listens for online/offline events, drains the sync queue on reconnect (every 30s while online), provides `getDataWithFallback` for IndexedDB-first reads with background refresh.

### State Management

All stores use `useSyncExternalStore` (no Redux, no Zustand). Module-level state + subscribe/getSnapshot pattern.

**5 stores** (`frontend/src/lib/stores/`):
- `task-store.ts` -- CRUD + filter by status, reads/writes IndexedDB directly
- `schedule-store.ts` -- CRUD + filter by day_of_week
- `note-store.ts` -- CRUD + search by title/content
- `pomodoro-store.ts` -- sessions, stats computation, streak tracking
- `toast-store.ts` -- global toast notifications

Barrel export: `stores/index.ts`

### Stability

- **ErrorBoundary** (`frontend/src/components/error-boundary.tsx`): Catches render crashes, shows retry UI (dev mode shows stack trace)
- **AppProviders** (`frontend/src/app/app-providers.tsx`): Wraps app in ErrorBoundary, initializes Capacitor lifecycle + Preferences on mount

### Capacitor Integration

`frontend/src/lib/capacitor.ts`:
- `initAppLifecycle()` -- listens for native app pause/resume, dispatches `app:pause`/`app:resume` custom events
- `initCapacitorConfig()` -- reads/writes API base URL via Capacitor Preferences
- `isNative()` / `getPlatform()` helpers

## File Structure

```
ai-student-hub/
├── .changeset/              # Version management (changesets)
├── .github/workflows/       # CI/CD
├── backend/                 # Python FastAPI (not yet connected to frontend)
│   ├── app/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (dashboard)/     # 5 pages
│   │   │   │   ├── tasks/
│   │   │   │   ├── schedule/
│   │   │   │   ├── notes/
│   │   │   │   ├── pomodoro/
│   │   │   │   └── ai-chat/
│   │   │   ├── app-providers.tsx # ErrorBoundary + Capacitor init
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── error-boundary.tsx
│   │   │   ├── particle-bg.tsx
│   │   │   └── ui/...
│   │   └── lib/
│   │       ├── db.ts              # IndexedDB schema + CRUD helpers
│   │       ├── sync-queue.ts      # Offline write queue
│   │       ├── sync-manager.ts    # Lifecycle-aware sync coordinator
│   │       ├── capacitor.ts       # Capacitor lifecycle + config
│   │       ├── api.ts             # API layer (currently mock)
│   │       ├── stores/
│   │       │   ├── index.ts
│   │       │   ├── task-store.ts
│   │       │   ├── schedule-store.ts
│   │       │   ├── note-store.ts
│   │       │   ├── pomodoro-store.ts
│   │       │   └── toast-store.ts
│   │       └── theme.tsx
│   └── package.json
├── package.json              # Monorepo root (npm workspaces)
└── HANDOFF.md
```

## How to Run

### Development

```bash
# From monorepo root
npm install
npm run dev          # Next.js dev server (port 3000)

# Or from frontend/ directly
cd frontend
npm run dev
```

### Build

```bash
npm run build        # Production Next.js build
```

### Android

```bash
npm run build:android          # next build + cap sync android
npm run cap:android            # Open Android Studio
```

### Other targets (frontend/ only)

```bash
cd frontend
npm run cap:ios                # Open Xcode (iOS build not yet configured)
```

## CI/CD

- `.github/workflows/build-apps.yml` — web build + Android build + release jobs
- Tag push triggers GitHub Actions build for APK generation

## Key Conventions

1. **Dark mode**: Default dark, `.dark` class on `<html>`, managed by `theme.tsx`
2. **Glass effects**: `.glass` / `.glass-strong` classes in `globals.css`
3. **Gradients**: `.gradient-bg` / `.gradient-text` classes
4. **Buttons**: Use `RippleButton` component, not native `<button>`
5. **Selectors**: Use `Select` component, not native `<select>`
6. **Container**: Page root div uses `max-w-6xl mx-auto`
7. **Stores**: Always use `useSyncExternalStore` pattern, never local useState for shared data

## Version Management

Uses **changesets** for versioning across the monorepo.

```bash
# Add a changeset before committing
npx changeset

# Version bump (updates package.json in all workspaces)
npm run version:patch   # 1.2.0 → 1.2.1
npm run version:minor   # 1.2.0 → 1.3.0
npm run version:major   # 1.2.0 → 2.0.0
```

The `ai-student-hub` (root) and `frontend` packages are version-linked via `.changeset/config.json` -- they always share the same version number.

## Pending Work

- [ ] Connect frontend to backend API (replace mock data in `api.ts`)
- [ ] User authentication system
- [ ] iOS build configuration
- [ ] Electron desktop build
- [ ] Full CI/CD pipeline (previous `build-apps.yml` was removed)
- [ ] Backend: add sync endpoints to match the sync-queue format
- [ ] Test sync-queue conflict resolution (last-write-wins vs merge)

## Known Issues

- Backend exists (`backend/`) but is not connected; frontend uses mock API
- IndexedDB unavailable in some test environments (stores handle gracefully with empty arrays)
- Next.js 16.2.6 has breaking changes -- read `node_modules/next/dist/docs/` before modifying Next.js config or APIs
- Capacitor Preferences currently hardcodes `https://api.example.com` as default API URL
