# Tasks: Automated Chrome Web Store Publishing

**Input**: Design documents from `/specs/007-chrome-store-publish/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: No automated tests requested for this feature (manual validation via Chrome Web Store upload)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This project uses a single-project structure at repository root:
- `scripts/` - Build automation scripts (TypeScript executed via tsx)
- `releases/` - Generated ZIP packages (gitignored)
- `package.json` - npm configuration and version source
- `public/manifest.json` - Chrome extension manifest with version
- `dist/` - Vite build output (existing)

---

## Phase 1: Setup (Project Configuration)

**Purpose**: Install dependencies and configure git to support packaging workflow

- [X] T001 Install archiver and @types/archiver as devDependencies in package.json
- [X] T002 Add releases/ directory to .gitignore to exclude ZIP packages from version control
- [X] T003 Verify current version synchronization between package.json and public/manifest.json (manual check)

---

## Phase 2: Foundational (Shared Build Infrastructure)

**Purpose**: No blocking foundational infrastructure needed - this feature extends existing build system

**⚠️ NOTE**: This feature has no foundational blocking tasks. Each user story can be implemented independently after Setup phase.

**Checkpoint**: Setup complete - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - One-Command ZIP Package Creation (Priority: P1) 🎯 MVP

**Goal**: Developer can create a production-ready ZIP package with a single command, containing only necessary files for Chrome Web Store submission

**Independent Test**: Run `npm run package`, verify ZIP file created in releases/ directory, manually upload to Chrome Web Store to confirm package is accepted without errors

### Implementation for User Story 1

- [X] T004 [US1] Create scripts/package.ts script with tsx shebang and basic structure
- [X] T005 [US1] Implement validateBuildExists() function to check dist/ directory exists with manifest.json
- [X] T006 [US1] Implement getVersion() function to read version from package.json
- [X] T007 [US1] Implement createReleasesDirectory() function to create releases/ directory if missing
- [X] T008 [US1] Implement createZipArchive() function using archiver to create ZIP with proper file inclusions
- [X] T009 [US1] Add file inclusion logic: dist/ (entire directory) to scripts/package.ts
- [X] T010 [US1] Add file inclusion logic: LICENSE and README.md from root to scripts/package.ts
- [X] T011 [US1] Add exclusion patterns for .vite/ and development artifacts to scripts/package.ts
- [X] T012 [US1] Implement ZIP filename generation: tweetyoink-v{version}.zip in scripts/package.ts
- [X] T013 [US1] Add success reporting with file size and location in scripts/package.ts
- [X] T014 [US1] Add error handling and validation with process.exit(1) on failures in scripts/package.ts
- [X] T015 [US1] Add package script to package.json: "package": "npm run build && tsx scripts/package.ts"
- [X] T016 [US1] Test packaging workflow: run npm run package and verify ZIP contents match FR-003 and FR-004
- [ ] T017 [US1] Manual validation: upload generated ZIP to Chrome Web Store Developer Dashboard

**Checkpoint**: At this point, User Story 1 should be fully functional - one-command packaging works and Chrome Web Store accepts the package

---

## Phase 4: User Story 2 - Automated Version Bumping (Priority: P2)

**Goal**: Developer can bump version numbers with automatic synchronization between package.json and manifest.json, with git commit and tag creation

**Independent Test**: Run `npm run version:patch`, verify both package.json and public/manifest.json show new version, confirm git commit and tag were created

### Implementation for User Story 2

- [ ] T018 [P] [US2] Create scripts/sync-version.ts script with tsx shebang and basic structure
- [ ] T019 [P] [US2] Implement readPackageVersion() function to read version from package.json in scripts/sync-version.ts
- [ ] T020 [P] [US2] Implement readManifestVersion() function to read version from public/manifest.json in scripts/sync-version.ts
- [ ] T021 [US2] Implement syncVersionToManifest() function to copy version from package.json to manifest.json in scripts/sync-version.ts
- [ ] T022 [US2] Add JSON formatting preservation (2-space indent + trailing newline) in scripts/sync-version.ts
- [ ] T023 [US2] Add success/error reporting with process.exit(1) on failures in scripts/sync-version.ts
- [ ] T024 [US2] Add "version" lifecycle hook to package.json: "version": "tsx scripts/sync-version.ts && git add public/manifest.json"
- [ ] T025 [US2] Add convenience scripts to package.json: "version:patch", "version:minor", "version:major"
- [ ] T026 [US2] Test patch version bump: run npm run version:patch and verify both files updated to 0.1.1
- [ ] T027 [US2] Test minor version bump: run npm run version:minor and verify both files updated to 0.2.0
- [ ] T028 [US2] Test major version bump: run npm run version:major and verify both files updated to 1.0.0
- [ ] T029 [US2] Verify git commit and tag creation after version bump (check git log and git tag)
- [ ] T030 [US2] Document version bump workflow in README.md or quickstart.md

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - packaging works AND version management is automated

---

## Phase 5: User Story 3 - Release Notes and Changelog Management (Priority: P3)

**Goal**: Maintain a changelog that can be used for Chrome Web Store release notes, following Keep a Changelog format

**Independent Test**: Update CHANGELOG.md with new entries, run packaging command, verify changelog is formatted appropriately for Chrome Web Store submission

### Implementation for User Story 3

- [ ] T031 [P] [US3] Create CHANGELOG.md file in repository root with Keep a Changelog format structure
- [ ] T032 [P] [US3] Add initial changelog entries for versions 0.1.0 through current version in CHANGELOG.md
- [ ] T033 [P] [US3] Add [Unreleased] section template at top of CHANGELOG.md
- [ ] T034 [US3] Document changelog workflow in quickstart.md: when to update, how to format entries
- [ ] T035 [US3] Add changelog update reminder to version bump workflow documentation
- [ ] T036 [US3] Optional: Create extractChangelogSection() helper in scripts/package.ts to extract current version notes
- [ ] T037 [US3] Test complete workflow: update changelog, bump version, create package, verify changelog in release context

**Checkpoint**: All user stories should now be independently functional - packaging, version management, and changelog are all automated

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, validation, and final improvements

- [ ] T038 [P] Update README.md with Publishing section linking to quickstart.md
- [ ] T039 [P] Add troubleshooting section to quickstart.md for common packaging errors
- [ ] T040 [P] Add file size validation (128MB limit check) to scripts/package.ts
- [ ] T041 [P] Add manifest.json validation to scripts/package.ts before packaging
- [ ] T042 Run complete release workflow end-to-end following quickstart.md
- [ ] T043 Create implementation summary in specs/007-chrome-store-publish/implementation-summary.md
- [ ] T044 Validate success criteria from spec.md are met (SC-001 through SC-007)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
  - Install archiver dependencies
  - Configure gitignore
  - Verify version sync
- **Foundational (Phase 2)**: Not applicable - no blocking foundation needed
- **User Stories (Phase 3-5)**: All depend on Setup completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order: US1 (P1/MVP) → US2 (P2) → US3 (P3)
- **Polish (Phase 6)**: Depends on desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1/MVP)**: Can start after Setup - No dependencies on other stories
  - Delivers: One-command ZIP packaging
  - Independent test: Create package and upload to Chrome Web Store

- **User Story 2 (P2)**: Can start after Setup - No dependencies on US1
  - Delivers: Automated version synchronization
  - Independent test: Version bump updates both files and creates git tags
  - **Integration point**: Version in package.json determines ZIP filename in US1

- **User Story 3 (P3)**: Can start after Setup - No dependencies on US1 or US2
  - Delivers: Changelog management
  - Independent test: Changelog format suitable for release notes
  - **Integration point**: Changelog content can be used when uploading to Chrome Web Store

### Within Each User Story

**User Story 1** (ZIP Packaging):
- T004-T007 can be done in parallel (different functions)
- T008-T012 are sequential (build on createZipArchive)
- T013-T014 can be done in parallel (different aspects)
- T015 must come after T004-T014 (needs working script)
- T016-T017 are final validation (sequential)

**User Story 2** (Version Management):
- T018-T023 are all parallelizable [P] (different functions in sync-version.ts)
- T024-T025 can be done together (both edit package.json scripts)
- T026-T029 are sequential test tasks
- T030 is final documentation

**User Story 3** (Changelog):
- T031-T033 can all be done in parallel [P] (different sections of CHANGELOG.md)
- T034-T035 can be done in parallel [P] (documentation)
- T036 is optional enhancement
- T037 is final validation

### Parallel Opportunities

- **Setup Phase**: T001, T002, T003 can run in parallel
- **User Story 1**: T004-T007 can run in parallel (different functions)
- **User Story 2**: T018-T023 can run in parallel (all marked [P])
- **User Story 3**: T031-T033 can run in parallel, T034-T035 can run in parallel
- **Polish Phase**: T038-T041 can run in parallel (all marked [P])
- **Across Stories**: US1, US2, and US3 can all be worked on in parallel by different developers

---

## Parallel Example: User Story 1

```bash
# Launch foundational script tasks together:
Task: "Create scripts/package.ts script with tsx shebang and basic structure"
Task: "Implement validateBuildExists() function to check dist/ directory exists"
Task: "Implement getVersion() function to read version from package.json"
Task: "Implement createReleasesDirectory() function to create releases/ directory"

# These can be written in parallel as separate functions
```

## Parallel Example: User Story 2

```bash
# Launch all sync-version.ts functions together:
Task: "Implement readPackageVersion() function in scripts/sync-version.ts"
Task: "Implement readManifestVersion() function in scripts/sync-version.ts"
Task: "Implement syncVersionToManifest() function in scripts/sync-version.ts"
Task: "Add JSON formatting preservation in scripts/sync-version.ts"
Task: "Add success/error reporting in scripts/sync-version.ts"

# All marked [P] - different functions in same file
```

## Parallel Example: User Story 3

```bash
# Launch changelog setup tasks together:
Task: "Create CHANGELOG.md file with Keep a Changelog format"
Task: "Add initial changelog entries for versions 0.1.0 through current"
Task: "Add [Unreleased] section template at top"

# All marked [P] - different sections of same file
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

This is the recommended approach for fastest time to value:

1. **Complete Phase 1: Setup** (~15 minutes)
   - Install archiver dependencies (T001)
   - Update .gitignore (T002)
   - Verify version sync (T003)

2. **Complete Phase 3: User Story 1** (~4-6 hours)
   - T004-T017: Implement ZIP packaging
   - **STOP and VALIDATE**: Test package creation
   - Upload to Chrome Web Store to verify acceptance

3. **Result**: You now have one-command packaging! 🎉
   - `npm run package` creates Chrome Web Store-ready ZIP
   - Manual version management, manual changelog (acceptable)
   - Deploy/publish immediately if satisfied

### Incremental Delivery (Recommended)

Add features one at a time, validating independently:

1. **Complete Setup → Foundation ready** (~15 minutes)

2. **Add User Story 1 → Test independently** (~4-6 hours)
   - `npm run package` works
   - Chrome Web Store accepts package
   - **Deploy/Demo: MVP achieved!**

3. **Add User Story 2 → Test independently** (~2-3 hours)
   - `npm run version:patch` updates both files
   - Git tags created automatically
   - **Deploy/Demo: Version management automated!**

4. **Add User Story 3 → Test independently** (~1-2 hours)
   - CHANGELOG.md maintained
   - Release notes ready for Chrome Web Store
   - **Deploy/Demo: Complete professional release workflow!**

Each story adds value without breaking previous stories.

### Parallel Team Strategy

With multiple developers:

1. **Team completes Setup together** (~15 minutes)

2. **Once Setup is done, parallel development**:
   - Developer A: User Story 1 (ZIP packaging) - 4-6 hours
   - Developer B: User Story 2 (version management) - 2-3 hours
   - Developer C: User Story 3 (changelog) - 1-2 hours

3. **Stories complete and integrate independently**:
   - Each developer tests their story independently
   - Integration is minimal (version → filename, changelog → release notes)
   - Total time: ~6 hours vs. ~9 hours sequential

---

## Task Statistics

- **Total Tasks**: 44 tasks
- **Setup Phase**: 3 tasks
- **User Story 1 (P1/MVP)**: 14 tasks (~4-6 hours)
- **User Story 2 (P2)**: 13 tasks (~2-3 hours)
- **User Story 3 (P3)**: 7 tasks (~1-2 hours)
- **Polish Phase**: 7 tasks (~1-2 hours)

**Parallelizable Tasks**: 20 tasks marked [P] (45% of total)

**MVP Scope** (Setup + US1): 17 tasks (~5-7 hours total)

---

## Notes

- **[P] tasks** = different files or independent functions, no dependencies
- **[Story] label** maps task to specific user story for traceability
- **Each user story is independently completable and testable**
- **No automated tests** for this feature (manual Chrome Web Store validation)
- **Commit after each task or logical group** (e.g., after each function, after script completion)
- **Stop at any checkpoint to validate story independently**
- **Version management (US2) can proceed without packaging (US1)** - they're independent
- **Changelog (US3) can proceed independently** - it's just documentation
- **Feature-specific docs go in specs/007-chrome-store-publish/** per constitution

---

## Validation Checklist

Before marking feature complete:

- [ ] Can create ZIP package with single command (`npm run package`)
- [ ] ZIP package accepted by Chrome Web Store without errors
- [ ] ZIP includes all required files (dist/, LICENSE, README.md)
- [ ] ZIP excludes all development files (node_modules/, src/, .git/, etc.)
- [ ] ZIP filename includes version number (tweetyoink-v{version}.zip)
- [ ] Version bump updates both package.json and manifest.json
- [ ] Git commit and tag created after version bump
- [ ] CHANGELOG.md follows Keep a Changelog format
- [ ] Complete workflow documented in quickstart.md
- [ ] All success criteria from spec.md validated

---

**Generated**: 2025-11-01
**Related Docs**: [spec.md](./spec.md), [plan.md](./plan.md), [research.md](./research.md), [data-model.md](./data-model.md), [quickstart.md](./quickstart.md)
