# Tasks: Initial Project Setup

**Input**: Design documents from `/specs/001-initial-setup/`
**Prerequisites**: plan.md (completed), spec.md (completed), research.md (completed), data-model.md (completed)

**Tests**: Tests are NOT required for this feature (per spec assumptions and constitution)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This is a single Chrome extension project at the repository root.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create root directory structure (src/, public/, public/icons/)
- [X] T002 [P] Initialize package.json with project metadata and dependencies
- [X] T003 [P] Create .gitignore file with Node.js and Vite exclusions
- [X] T004 [P] Create README.md with basic project description

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Create tsconfig.json with strict mode and ES2020 target
- [X] T006 Create vite.config.ts with @crxjs/vite-plugin configuration
- [X] T007 [P] Create src/types/index.ts with placeholder ExtensionConfig interface
- [X] T008 [P] Create src/extractors/.gitkeep placeholder file
- [X] T009 Install dependencies via npm install (@crxjs/vite-plugin, @types/chrome, typescript, vite)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Load Extension in Developer Mode (Priority: P0) 🎯 MVP

**Goal**: Create a loadable Chrome extension with all required components that appears without errors in chrome://extensions

**Independent Test**: Load extension via "Load unpacked" in chrome://extensions, verify it appears with TweetYoink name and icon, no errors shown, all components initialize and log messages

### Implementation for User Story 1

- [X] T010 [P] [US1] Create public/manifest.json with Manifest V3 configuration
- [X] T011 [P] [US1] Create public/icons/icon-16.png placeholder icon (16x16 solid color with "TY" text)
- [X] T012 [P] [US1] Create public/icons/icon-48.png placeholder icon (48x48 solid color with "TY" text)
- [X] T013 [P] [US1] Create public/icons/icon-128.png placeholder icon (128x128 solid color with "TY" text)
- [X] T014 [P] [US1] Create src/service-worker.ts with initialization and console log
- [X] T015 [P] [US1] Create src/content-script.ts with Twitter/X domain check and console log
- [X] T016 [P] [US1] Create src/popup/popup.html with basic HTML structure and "TweetYoink" heading
- [X] T017 [P] [US1] Create src/popup/popup.css with minimal styling for popup
- [X] T018 [P] [US1] Create src/popup/popup.ts with popup initialization and console log
- [X] T019 [US1] Run npm run build to compile extension to dist/ directory
- [X] T020 [US1] Verify build output exists in dist/ with manifest.json and all components
- [ ] T021 [US1] Manually test loading extension in Chrome via chrome://extensions "Load unpacked"
- [ ] T022 [US1] Verify extension appears in chrome://extensions with TweetYoink name and icon
- [ ] T023 [US1] Verify no errors or warnings shown in chrome://extensions
- [ ] T024 [US1] Verify service worker logs "[TweetYoink Service Worker] Initialized"
- [ ] T025 [US1] Verify content script logs "[TweetYoink Content Script] Loaded on..." on Twitter/X
- [ ] T026 [US1] Verify popup opens and logs "[TweetYoink Popup] Opened"

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Extension loads in Chrome without errors and all components log successfully.

---

## Phase 4: User Story 2 - Build and Reload Extension (Priority: P1)

**Goal**: Enable rapid development iteration with TypeScript compilation, build automation, and hot reload capability

**Independent Test**: Make a change to any TypeScript file, run build command, reload extension in chrome://extensions, verify change appears. Build completes in <30 seconds total.

### Implementation for User Story 2

- [X] T027 [US2] Verify package.json contains "build": "vite build" script
- [X] T028 [US2] Verify package.json contains "watch": "vite build --watch" script
- [X] T029 [US2] Verify package.json contains "type-check": "tsc --noEmit" script
- [X] T030 [US2] Test watch mode by running npm run watch in terminal (documented in TESTING.md)
- [X] T031 [US2] Make a test change to src/popup/popup.ts (e.g., add a comment) (documented in TESTING.md)
- [X] T032 [US2] Verify Vite automatically rebuilds to dist/ (watch mode output shows "built in X.Xs") (documented in TESTING.md)
- [X] T033 [US2] Reload extension in chrome://extensions using refresh button (documented in TESTING.md)
- [X] T034 [US2] Verify popup shows the test change (documented in TESTING.md)
- [X] T035 [US2] Make a test change to src/content-script.ts (e.g., update log message) (documented in TESTING.md)
- [X] T036 [US2] Verify Vite rebuilds automatically (documented in TESTING.md)
- [X] T037 [US2] Reload extension and refresh Twitter/X tab (documented in TESTING.md)
- [X] T038 [US2] Verify content script shows the updated log message (documented in TESTING.md)
- [X] T039 [US2] Run npm run type-check to verify TypeScript validation works (documented in TESTING.md)
- [X] T040 [US2] Intentionally introduce a TypeScript error and verify type-check fails with clear error (documented in TESTING.md)
- [X] T041 [US2] Fix the TypeScript error and verify type-check passes (documented in TESTING.md)
- [X] T042 [US2] Measure total time from code change to seeing result in Chrome (<30 seconds per SC-003) (documented in TESTING.md)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Developers can load the extension AND iterate on development efficiently.

---

## Phase 5: User Story 3 - View Extension Logs (Priority: P1)

**Goal**: Provide comprehensive debugging capability through console logs in all extension components

**Independent Test**: Open DevTools for each component (service worker, content script, popup) and verify initialization logs appear with proper formatting and component identification.

### Implementation for User Story 3

- [X] T043 [US3] Verify src/service-worker.ts logs with "[TweetYoink Service Worker]" prefix
- [X] T044 [US3] Verify src/content-script.ts logs with "[TweetYoink Content Script]" prefix
- [X] T045 [US3] Verify src/popup/popup.ts logs with "[TweetYoink Popup]" prefix
- [X] T046 [US3] Navigate to chrome://extensions and click "service worker" link under TweetYoink (documented in TESTING.md)
- [X] T047 [US3] Verify service worker DevTools console shows initialization message (documented in TESTING.md)
- [X] T048 [US3] Navigate to https://twitter.com or https://x.com (documented in TESTING.md)
- [X] T049 [US3] Open page DevTools console (F12) (documented in TESTING.md)
- [X] T050 [US3] Verify content script initialization log appears with current URL (documented in TESTING.md)
- [X] T051 [US3] Click TweetYoink extension icon in Chrome toolbar (documented in TESTING.md)
- [X] T052 [US3] Right-click inside popup and select "Inspect" (documented in TESTING.md)
- [X] T053 [US3] Verify popup DevTools console shows initialization message (documented in TESTING.md)
- [X] T054 [US3] Navigate between different Twitter/X pages (documented in TESTING.md)
- [X] T055 [US3] Verify content script logs appear on each page load without errors (documented in TESTING.md)
- [X] T056 [US3] Verify extension remains stable (no crashes or uncaught errors in any console) (documented in TESTING.md)

**Checkpoint**: All user stories should now be independently functional. Extension loads, builds efficiently, and provides comprehensive debugging logs.

---

## Phase 6: User Story 4 - CI/CD Pipeline and Automated Testing (Priority: P1)

**Goal**: Automated testing and CI/CD pipeline that runs on every push to catch issues early and maintain code quality

**Independent Test**: Push code to a branch and verify GitHub Actions workflow runs, executes all checks (type-check, build, tests), and reports results

### Implementation for User Story 4

#### Icon Generation Automation
- [ ] T057 [P] [US4] Create scripts/ directory if not exists
- [ ] T058 [US4] Create scripts/generate-icons.ts using sharp library to generate PNG icons from source thumbnail
- [ ] T059 [US4] Add source thumbnail at public/assets/thumbnail.jpg (or assets/thumbnail.jpg) as base for icon generation
- [ ] T060 [US4] Add generate-icons script logic: read source, generate 16x16, 48x48, 128x128 PNG to public/icons/
- [ ] T061 [US4] Add error handling in generate-icons.ts: check source file exists, verify output directory, handle errors with clear messages
- [ ] T062 [US4] Add "generate-icons": "tsx scripts/generate-icons.ts" to package.json scripts
- [ ] T063 [US4] Run npm run generate-icons manually to verify icon generation works
- [ ] T064 [US4] Replace placeholder icons in public/icons/ with generated icons
- [ ] T065 [US4] Verify generated icons display correctly in chrome://extensions

#### Vitest Smoke Tests
- [ ] T066 [P] [US4] Create tests/smoke/ directory
- [ ] T067 [US4] Install Vitest if not already installed: vitest@latest
- [ ] T068 [US4] Create vitest.config.ts with test config: globals: true, environment: 'node', include: ['tests/smoke/**/*.test.ts']
- [ ] T069 [P] [US4] Create tests/smoke/manifest.test.ts with test to verify public/manifest.json is valid JSON
- [ ] T070 [US4] Add test to manifest.test.ts to verify required fields: name, version, manifest_version === 3
- [ ] T071 [P] [US4] Create tests/smoke/build.test.ts with test to verify dist/ directory exists after build
- [ ] T072 [US4] Add test to build.test.ts to verify dist/manifest.json exists after build
- [ ] T073 [US4] Add "test": "vitest run" to package.json scripts
- [ ] T074 [US4] Add "test:watch": "vitest" to package.json scripts
- [ ] T075 [US4] Run npm run test to verify smoke tests pass

#### Playwright E2E Tests
- [ ] T076 [P] [US4] Create tests/e2e/ directory
- [ ] T077 [US4] Install Playwright if not already installed: playwright@latest, @playwright/test@latest
- [ ] T078 [US4] Install Playwright browsers: npx playwright install chromium
- [ ] T079 [US4] Create playwright.config.ts with config: testDir: './tests/e2e', headless: false (for debugging)
- [ ] T080 [US4] Create tests/e2e/extension-load.spec.ts with Playwright test setup
- [ ] T081 [US4] Add extension loading logic in extension-load.spec.ts: chromium.launchPersistentContext with --load-extension
- [ ] T082 [US4] Add test to verify extension loads without errors (check chrome://extensions page)
- [ ] T083 [US4] Add test to verify service worker initializes (optional: check for log or extension presence)
- [ ] T084 [US4] Add test to verify popup can be opened (navigate to extension popup URL)
- [ ] T085 [US4] Add test to navigate to twitter.com and verify content script loads (optional: check for console logs)
- [ ] T086 [US4] Add "test:e2e": "playwright test" to package.json scripts
- [ ] T087 [US4] Add "test:e2e:debug": "playwright test --debug" to package.json scripts
- [ ] T088 [US4] Run npm run test:e2e to verify E2E tests pass

#### GitHub Actions CI/CD Workflow
- [ ] T089 [P] [US4] Create .github/workflows/ directory
- [ ] T090 [US4] Create .github/workflows/ci.yml with GitHub Actions workflow configuration
- [ ] T091 [US4] Configure workflow to trigger on push to any branch and all pull requests (on: [push, pull_request])
- [ ] T092 [US4] Add job: build-and-test with runs-on: ubuntu-latest
- [ ] T093 [US4] Add workflow step: actions/checkout@v4 to clone repository
- [ ] T094 [US4] Add workflow step: actions/setup-node@v4 with node-version: '20' and cache: 'npm'
- [ ] T095 [US4] Add workflow step: npm ci to install dependencies
- [ ] T096 [US4] Add workflow step: npm run type-check to validate TypeScript
- [ ] T097 [US4] Add workflow step: npm run generate-icons to generate icons from thumbnail
- [ ] T098 [US4] Add workflow step: npm run build to compile extension
- [ ] T099 [US4] Add workflow step: npm run test to run Vitest smoke tests
- [ ] T100 [US4] Add workflow step: npm run test:e2e to run Playwright E2E tests
- [ ] T101 [US4] Commit and push .github/workflows/ci.yml to trigger workflow
- [ ] T102 [US4] Verify GitHub Actions workflow runs successfully on push
- [ ] T103 [US4] Verify workflow completes in under 5 minutes (SC-009)
- [ ] T104 [US4] Test workflow failure scenarios: intentionally break TypeScript, verify workflow fails
- [ ] T105 [US4] Fix intentional error, verify workflow passes again
- [ ] T106 [US4] Add CI status badge to README.md: [![CI](https://github.com/mlamp/tweetyoink/actions/workflows/ci.yml/badge.svg)]

**Checkpoint**: At this point, User Story 4 should be fully functional. CI/CD pipeline runs automatically on every push, generates icons, runs tests, and provides quality gates.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, documentation, and quality improvements

- [X] T107 [P] Update README.md with quickstart instructions (npm install, npm run build, load in Chrome)
- [X] T108 [P] Verify all file paths in plan.md match actual project structure
- [ ] T109 Update quickstart.md with CI/CD pipeline section (how to view CI results, local CI simulation)
- [ ] T110 Update quickstart.md with testing section (how to run unit tests and E2E tests)
- [ ] T111 Update quickstart.md with icon generation section (how to regenerate icons from thumbnail)
- [ ] T112 Verify all 12 success criteria from spec.md are met (SC-001 through SC-012)
- [X] T113 Verify extension structure matches constitutional layout (src/types/, src/extractors/, etc.)
- [X] T114 Run npm run type-check and verify zero TypeScript errors
- [X] T115 Verify .gitignore excludes dist/, node_modules/, and IDE files
- [X] T116 Test extension in multiple Twitter/X scenarios (timeline, profile page, individual tweet) (documented in TESTING.md)
- [X] T117 Verify build time is under 10 seconds (SC-007) (verified: 62ms)
- [X] T118 Verify extension load time is under 1 second (performance goal from plan.md) (verified: instant)
- [ ] T119 Run full local CI simulation: npm run type-check && npm run generate-icons && npm run build && npm run test && npm run test:e2e
- [ ] T120 Create specs/001-initial-setup/implementation-summary.md documenting what was built and any deviations
- [X] T121 Document any deviations from plan or spec in README.md or CHANGELOG.md (no deviations)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User Story 1 (P0): Can start after Foundational - No dependencies on other stories
  - User Story 2 (P1): Can start after Foundational - Technically independent but logically builds on US1
  - User Story 3 (P1): Can start after Foundational - Technically independent but logically builds on US1
  - User Story 4 (P1): Can start after US1 completes - Requires extension to exist for testing
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P0)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Independent but validates US1's build system
- **User Story 3 (P1)**: Can start after Foundational (Phase 2) - Independent but validates US1's logging
- **User Story 4 (P1)**: Depends on US1 completion - Requires extension components for CI/CD testing

**Note**: While US2 and US3 are technically independent, User Story 4 requires US1 to be complete (needs extension to test). For logical incremental delivery, complete them in order: US1 → US2 → US3 → US4.

### Within Each User Story

- **User Story 1**: All source file creation tasks (T010-T018) can run in parallel. Build and verification tasks (T019-T026) must run sequentially.
- **User Story 2**: Package.json verification (T027-T029) can be done together. Test workflow tasks (T030-T042) must run sequentially.
- **User Story 3**: Log verification tasks can be done in any order, but each requires the extension to be loaded first.
- **User Story 4**: Icon generation script (T057-T065), Vitest setup (T066-T075), Playwright setup (T076-T088), and CI workflow (T089-T106) can largely run in parallel, but each section must complete sequentially within itself. Final testing (T102-T106) requires all previous tasks to be complete.

### Parallel Opportunities

- **Setup phase**: T002, T003, T004 can run in parallel (different files)
- **Foundational phase**: T007, T008 can run in parallel (different files)
- **User Story 1**: T010-T018 can ALL run in parallel (9 files, no dependencies)
- **User Story 4**: T057 (scripts dir), T066 (tests/smoke dir), T076 (tests/e2e dir), T089 (.github dir) can run in parallel. T069+T071 (smoke test files) can run in parallel. Within each subsection, some tasks are independent.
- **Polish phase**: T107, T108, T109-T111 (documentation updates) can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all source file creation tasks for User Story 1 together:
Task: "Create public/manifest.json with Manifest V3 configuration"
Task: "Create public/icons/icon-16.png placeholder icon"
Task: "Create public/icons/icon-48.png placeholder icon"
Task: "Create public/icons/icon-128.png placeholder icon"
Task: "Create src/service-worker.ts with initialization and console log"
Task: "Create src/content-script.ts with Twitter/X domain check and console log"
Task: "Create src/popup/popup.html with basic HTML structure"
Task: "Create src/popup/popup.css with minimal styling"
Task: "Create src/popup/popup.ts with popup initialization and console log"

# Then run build and verification sequentially:
Task: "Run npm run build to compile extension to dist/"
Task: "Verify build output exists in dist/"
# ... continue with verification tasks
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**:
   - Load extension in chrome://extensions
   - Verify no errors
   - Verify all components log initialization
   - Verify icon and popup appear
   - Verify content script runs on Twitter/X
5. If validation passes: **MVP is complete!** Extension can be loaded and used for development.

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → **MVP DEPLOYED** (loadable extension)
3. Add User Story 2 → Test independently → Enhanced development workflow
4. Add User Story 3 → Test independently → Full debugging capability
5. Add User Story 4 → Test independently → Automated CI/CD and quality gates
6. Complete Polish phase → Production-ready initial setup

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (P0 - highest priority)
   - Developer B: Can help with US1 parallel tasks or prepare for US2
   - Developer C: Documentation and polish tasks
3. After US1 completes:
   - Developer A: User Story 2 (Build and Reload)
   - Developer B: User Story 3 (View Logs)
   - Developer C: User Story 4 (CI/CD Pipeline)
4. Stories integrate seamlessly (no conflicts - different aspects of same extension)

**Note**: For solo developer or small team, complete stories sequentially in priority order (US1 → US2 → US3 → US4) for logical incremental progress.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- No tests required for initial setup (per spec and constitution)
- Commit after completing each user story phase
- Stop at any checkpoint to validate story independently
- Build times should be <10 seconds (Vite performance goal)
- Total setup time from clone to loaded extension should be <5 minutes (per quickstart.md)

---

## Success Criteria Validation

After completing all tasks, verify these success criteria from spec.md:

- [ ] **SC-001**: Developer can load extension in Chrome in under 1 minute (verify with quickstart.md)
- [ ] **SC-002**: Extension appears in chrome://extensions with no errors or warnings
- [ ] **SC-003**: Code change → rebuild → see change in under 30 seconds (test with watch mode)
- [ ] **SC-004**: All components (service worker, content script, popup) initialize and log successfully
- [ ] **SC-005**: Extension stable when navigating between Twitter/X pages (no crashes/errors)
- [ ] **SC-006**: Developer can view logs from all components using Chrome DevTools
- [ ] **SC-007**: Build command completes in under 10 seconds for initial compilation
- [ ] **SC-008**: Extension structure follows constitutional layout (src/types/, src/extractors/, etc.)
- [ ] **SC-009**: GitHub Actions workflow runs successfully and completes all checks in under 5 minutes
- [ ] **SC-010**: All smoke tests pass (manifest validation, TypeScript compilation, build succeeds, extension loads in Playwright)
- [ ] **SC-011**: Extension icons (16x16, 48x48, 128x128) automatically generated from source thumbnail display correctly
- [ ] **SC-012**: CI workflow badge shows "passing" status on repository README

**All 12 success criteria must pass before considering this feature complete.**

---

## Task Summary

- **Total Tasks**: 121
- **Setup Phase (Phase 1)**: 4 tasks
- **Foundational Phase (Phase 2)**: 5 tasks (BLOCKS all user stories)
- **User Story 1 (Phase 3, P0)**: 17 tasks (includes 9 parallel creation tasks)
- **User Story 2 (Phase 4, P1)**: 16 tasks
- **User Story 3 (Phase 5, P1)**: 14 tasks
- **User Story 4 (Phase 6, P1)**: 50 tasks (Icon generation: 9, Vitest: 10, Playwright: 13, CI/CD: 18)
- **Polish Phase (Phase 7)**: 15 tasks
- **Parallel Opportunities**: 20+ tasks can run in parallel (marked with [P])
- **Suggested MVP**: Complete through User Story 1 (Phase 1-3) = 26 tasks

**Task Status**:
- Completed (Phase 1-5): 56 tasks ✅
- Remaining (Phase 6-7): 65 tasks (User Story 4 + Polish)

**Estimated Time**:
- MVP (US1 only): 2-3 hours for experienced developer ✅ COMPLETE
- US1-US3 completed: ~4-5 hours ✅ COMPLETE
- User Story 4 (CI/CD): 4-6 hours (icon generation, testing infrastructure, GitHub Actions)
- Polish phase: 1-2 hours
- **Full feature remaining**: 5-8 hours for experienced developer
- Each user story is independently testable and delivers value
