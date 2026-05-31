# Changelog

## v1.3.0 (Unreleased)

### Added
- IndexedDB local-first data layer with 5 stores (tasks, courses, notes, pomodoro, syncQueue)
- Offline sync queue for write operations when disconnected
- Sync manager with lifecycle-aware online/offline syncing
- useSyncExternalStore architecture: task-store, schedule-store, note-store, pomodoro-store, toast-store
- ErrorBoundary crash recovery component
- AppProviders with Capacitor lifecycle management (pause/resume sync)
- Monorepo version management with npm workspaces + changesets

### Changed
- Migrated all 5 pages (tasks, schedule, notes, pomodoro, ai-chat) to new store architecture
- API layer now queues writes when offline and syncs on reconnect
- Capacitor splash screen background color updated to match dark theme

### Removed
- Redundant CI workflow (frontend/.github/workflows/build-apps.yml)

## v1.2.0

### Added
- Comprehensive UI iteration (Adrien Lamy style)
- Mobile UI optimization for all pages

### Fixed
- PC layout optimization
- particle-bg NaN bug, ripple a11y, CSS cleanup
- Simplified workflow to Android-only, removed broken Electron builds
