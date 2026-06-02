## Release Checklist: 1.4.0 -- All Platforms
Generated: 2026-06-02

### Codebase Health
- TODO count: 2 (backend/app/services/notification_service.py)
- FIXME count: 0
- HACK count: 0

### Build Verification
- [ ] Clean build succeeds on all target platforms
- [ ] No compiler warnings (zero-warning policy)
- [ ] All assets included and loading correctly
- [ ] Build size within budget
- [ ] Build version number correctly set (1.0.0)
- [ ] Build is reproducible from tagged commit

### Quality Gates
- [ ] Zero S1 (Critical) bugs
- [ ] Zero S2 (Major) bugs -- or documented exceptions with producer approval
- [ ] All critical path features tested and signed off by QA
- [ ] Performance within budgets
- [ ] No regression from previous build

### Content Complete
- [ ] All placeholder assets replaced with final versions
- [ ] All TODO/FIXME in content files resolved or documented
- [ ] All player-facing text proofread
- [ ] Audio mix finalized and approved

### Platform Requirements: PC (Tauri)
- [ ] Windows installer builds correctly
- [ ] Application icon displays correctly (1024x1024 source)
- [ ] System tray functionality works
- [ ] Window management (minimize, maximize, close) functional
- [ ] File associations configured (if applicable)
- [ ] Auto-updater configured (if applicable)

### Platform Requirements: Mobile (Android)
- [ ] Android APK builds successfully
- [ ] App store guidelines compliance verified
- [ ] All required device permissions justified and documented
- [ ] Touch controls tested on multiple screen sizes
- [ ] Battery usage within acceptable range
- [ ] Background behavior correct (pause, resume, terminate)
- [ ] Push notification permissions handled correctly
- [ ] App size within store limits

### Store / Distribution
- [ ] Store page metadata complete and proofread
  - [ ] Short description
  - [ ] Long description
  - [ ] Feature list
  - [ ] System requirements (PC)
- [ ] Screenshots up to date and per-platform resolution requirements met
- [ ] Key art and capsule images current
- [ ] Legal notices, EULA, and privacy policy in place
- [ ] Third-party license attributions complete

### Launch Readiness
- [ ] Analytics / telemetry verified and receiving data
- [ ] Crash reporting configured and dashboard accessible
- [ ] Day-one patch prepared and tested (if needed)
- [ ] On-call team schedule set for first 72 hours
- [ ] Community launch announcements drafted
- [ ] Support team briefed on known issues and FAQ
- [ ] Rollback plan documented (if critical issues found post-launch)

### Version Update Checklist
- [x] Update Cargo.toml version to 1.4.0
- [x] Update package.json version to 1.4.0
- [x] Update tauri.conf.json version to 1.4.0
- [x] Update any other version references
- [x] Commit version bump changes
- [x] Create git tag v1.4.0
- [x] Push tag to GitHub

### Go / No-Go: [READY / NOT READY]

**Rationale:**
Codebase is clean with minimal TODOs (2 in notification service). All major features implemented including immersive Pomodoro scenes, audio engine, and cloud music integration. Build verification needed before final release.

**Sign-offs Required:**
- [ ] QA Lead
- [ ] Technical Director
- [ ] Producer
- [ ] Creative Director
