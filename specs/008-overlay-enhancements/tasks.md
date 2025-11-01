# Tasks: Overlay Title Support and Debug JSON Type

**Input**: Design documents from `/specs/008-overlay-enhancements/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/response-format-v1.2.yaml, quickstart.md

**Tests**: No automated tests requested for this feature (manual validation via test server)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This project uses a single-project structure at repository root:
- `src/types/` - TypeScript interfaces and type definitions
- `src/ui/` - Overlay rendering components and CSS
- `src/utils/` - Utility functions (logger)
- `specs/008-overlay-enhancements/` - Feature documentation
- No new directories required for this feature

---

## Phase 1: Setup (Project Verification)

**Purpose**: Verify existing project structure and dependencies are ready for overlay enhancements

- [X] T001 Verify TypeScript 5.x strict mode configuration in tsconfig.json
- [X] T002 Verify existing overlay system (Feature 004) is functional
- [X] T003 [P] Verify no new dependencies required (use native JSON.stringify)
- [X] T004 [P] Review existing src/types/overlay.ts interface to understand current structure
- [X] T005 [P] Review existing src/ui/overlay-renderer.ts to understand rendering logic

**Checkpoint**: Project structure verified - ready to begin user story implementation

---

## Phase 2: Foundational (Shared Type Definitions)

**Purpose**: Update type definitions that ALL user stories depend on

**⚠️ NOTE**: This feature has minimal foundational work since it extends existing overlay system. Type updates serve all user stories.

- [X] T006 [P] Add optional `title?: string` field to ResponseContentItem interface in src/types/overlay.ts
- [X] T007 [P] Update ResponseContentItem type union to support `type: 'debug'` in src/types/overlay.ts
- [X] T008 [P] Extend ResponseContentItem content field to `string | object` union type in src/types/overlay.ts
- [X] T009 Create DebugContentItem interface extending ResponseContentItem in src/types/overlay.ts
- [X] T010 [P] Add isDebugContentItem() type guard function in src/types/overlay.ts
- [X] T011 [P] Add hasRenderableTitle() helper function in src/types/overlay.ts
- [X] T01- [ ] T012 [P] Add TitleRenderOptions interface in src/types/overlay.ts
- [X] T01- [ ] T013 [P] Add DebugRenderOptions interface in src/types/overlay.ts

**Checkpoint**: Type definitions complete - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View Content Items with Titles (Priority: P1) 🎯 MVP

**Goal**: Users can see optional title headers above content items, improving content organization and scannability

**Independent Test**: Configure test server to return text/image responses with title fields, click Yoink, verify titles appear as bold headers above content blocks

### Implementation for User Story 1

- [X] T01- [ ] T014 [P] [US1] Create renderTitle() function in src/ui/overlay-renderer.ts
- [X] T01- [ ] T015 [P] [US1] Add title validation logic (trim whitespace, check non-empty) in src/ui/overlay-renderer.ts
- [X] T01- [ ] T016 [P] [US1] Add XSS protection via textContent for title rendering in src/ui/overlay-renderer.ts
- [X] T01- [ ] T017 [US1] Update renderContentItem() to conditionally render title if present in src/ui/overlay-renderer.ts
- [X] T01- [ ] T018 [US1] Ensure title renders for existing text content type in src/ui/overlay-renderer.ts
- [X] T01- [ ] T019 [US1] Ensure title renders for existing image content type in src/ui/overlay-renderer.ts
- [X] T02- [ ] T020 [P] [US1] Add .overlay-item-title CSS class with bold/distinct styling in src/ui/overlay.css
- [X] T02- [ ] T021 [P] [US1] Add title margin/padding for visual separation from content in src/ui/overlay.css
- [X] T02- [ ] T022 [P] [US1] Add bottom border or underline to title for visual distinction in src/ui/overlay.css
- [X] T02- [ ] T023 [P] [US1] Ensure title styling is responsive (mobile 320px to desktop 3840px) in src/ui/overlay.css
- [ ] T024 [US1] Test titled text content: verify title appears above text
- [ ] T025 [US1] Test untitled text content: verify backward compatibility (no title header)
- [ ] T026 [US1] Test multiple titled items: verify each shows distinct title
- [ ] T027 [US1] Test titled image content: verify title appears above image
- [ ] T028 [US1] Test empty title string: verify no header rendered
- [ ] T029 [US1] Test very long title (>100 chars): verify graceful wrapping
- [ ] T030 [US1] Test title with special characters/emojis: verify correct rendering

**Checkpoint**: At this point, User Story 1 should be fully functional - titles display for all content types

---

## Phase 4: User Story 2 - View Debug JSON Data (Priority: P2)

**Goal**: Developers can inspect structured debug data with formatted JSON display (2-space indent, monospaced font)

**Independent Test**: Configure test server to return debug content items with JSON objects, verify proper formatting with monospace font and 2-space indentation

### Implementation for User Story 2

- [X] T03- [ ] T031 [P] [US2] Create renderDebugContent() function in src/ui/overlay-renderer.ts
- [X] T03- [ ] T032 [P] [US2] Implement JSON.stringify() with 2-space indentation for debug content in src/ui/overlay-renderer.ts
- [X] T03- [ ] T033 [P] [US2] Add error handling for JSON serialization failures (circular refs, non-serializable) in src/ui/overlay-renderer.ts
- [X] T03- [ ] T034 [P] [US2] Add logger.warn() for JSON formatting errors in src/ui/overlay-renderer.ts
- [X] T03- [ ] T035 [P] [US2] Display user-friendly error message for invalid JSON structures in src/ui/overlay-renderer.ts
- [X] T03- [ ] T036 [US2] Update renderContentItem() to handle type === 'debug' in src/ui/overlay-renderer.ts
- [X] T03- [ ] T037 [US2] Ensure debug content can have optional title (inherit from US1) in src/ui/overlay-renderer.ts
- [X] T03- [ ] T038 [P] [US2] Add .overlay-debug-content CSS class with monospaced font in src/ui/overlay.css
- [X] T03- [ ] T039 [P] [US2] Set font-family to 'Consolas', 'Monaco', 'Courier New', monospace in src/ui/overlay.css
- [X] T04- [ ] T040 [P] [US2] Add white-space: pre-wrap for JSON indentation preservation in src/ui/overlay.css
- [X] T04- [ ] T041 [P] [US2] Add word-wrap: break-word for long lines on mobile in src/ui/overlay.css
- [X] T04- [ ] T042 [P] [US2] Add light background color (#f5f5f5) for visual distinction in src/ui/overlay.css
- [X] T04- [ ] T043 [P] [US2] Add padding and border-radius for debug content block in src/ui/overlay.css
- [X] T04- [ ] T044 [P] [US2] Add left accent border (3px solid) for debug blocks in src/ui/overlay.css
- [X] T04- [ ] T045 [P] [US2] Ensure debug content is scrollable for long JSON (overflow-x: auto) in src/ui/overlay.css
- [X] T04- [ ] T046 [P] [US2] Add responsive styles for mobile viewports (<768px) in src/ui/overlay.css
- [ ] T047 [US2] Test debug JSON object: verify 2-space indentation and monospace font
- [ ] T048 [US2] Test nested JSON (5+ levels): verify proper indentation throughout
- [ ] T049 [US2] Test debug content with title: verify title appears above JSON
- [ ] T050 [US2] Test debug content with 100+ lines: verify scrollable and readable
- [ ] T051 [US2] Test circular JSON reference: verify error message displayed
- [ ] T052 [US2] Test invalid JSON structure: verify graceful error handling
- [ ] T053 [US2] Test debug content on mobile (320px): verify no layout breaks
- [ ] T054 [US2] Test very large JSON (>50KB): verify warning logged and content renders

**Checkpoint**: At this point, User Story 2 should be fully functional - debug JSON displays with proper formatting

---

## Phase 5: User Story 3 - Mix Titled and Untitled Content (Priority: P3)

**Goal**: Overlay gracefully handles mixed content (some titled, some not, different types) without layout issues

**Independent Test**: Configure test server to return mixed array with titled text, untitled text, debug items, and verify all render correctly in order

### Implementation for User Story 3

- [ ] T055 [US3] Test mixed content: 2 titled items + 2 untitled items
- [ ] T056 [US3] Test mix of text, debug, image with various title configurations
- [ ] T057 [US3] Test empty title string treated as missing (no header)
- [ ] T058 [US3] Test title with newline characters: verify sanitized via textContent
- [ ] T059 [US3] Test title with HTML tags: verify rendered as plain text (XSS protection)
- [ ] T060 [US3] Verify layout consistency across all content type combinations
- [ ] T061 [US3] Test rapid switching between overlay with different content mixes
- [ ] T062 [US3] Verify backward compatibility: v1.1.0 responses still work

**Checkpoint**: All user stories should now be independently functional - titles and debug JSON work in all combinations

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation updates, contract finalization, and final validation

- [X] T063 [P] Update specs/004-response-overlay/contracts/response-format.yaml version to reference v1.2.0
- [X] T064 [P] Add migration notes to contracts/response-format-v1.2.yaml for servers
- [X] T065 [P] Document title and debug type usage examples in quickstart.md
- [X] T066 [P] Add troubleshooting section for common issues (circular refs, large JSON)
- [ ] T067 [P] Update test-server example responses to demonstrate titles and debug type
- [ ] T068 Test complete workflow: test server → Yoink → overlay with titles and debug
- [ ] T069 Verify all functional requirements (FR-001 through FR-014) are met
- [ ] T070 Verify all success criteria (SC-001 through SC-007) are met
- [ ] T071 Manual performance test: 20-level nested JSON renders without lag
- [ ] T072 Manual performance test: 1000+ line JSON scrolls at 60fps
- [ ] T073 Cross-browser compatibility test (Chrome, Edge, Brave)
- [ ] T074 Responsive layout test: 320px mobile, 768px tablet, 1920px desktop
- [X] T075 [P] Add JSDoc comments to new functions (renderTitle, renderDebugContent)
- [X] T076 [P] Update CLAUDE.md agent context if needed
- [X] T077 Final code review: ensure logger usage, no console.log
- [X] T078 Final code review: ensure TypeScript strict mode compliance
- [X] T079 Create implementation summary in specs/008-overlay-enhancements/implementation-summary.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
  - Verify existing project structure
  - Review current overlay implementation
- **Foundational (Phase 2)**: Depends on Setup completion
  - Update type definitions that all stories use
- **User Stories (Phase 3-5)**: All depend on Foundational completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order: US1 (P1/MVP) → US2 (P2) → US3 (P3)
- **Polish (Phase 6)**: Depends on desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1/MVP)**: Can start after Foundational - No dependencies on other stories
  - Delivers: Title support for all content types
  - Independent test: Titled text/image content renders correctly

- **User Story 2 (P2)**: Can start after Foundational - No dependencies on US1
  - Delivers: Debug JSON content type with formatting
  - Independent test: Debug content displays with 2-space indent
  - **Integration point**: Debug items can use title feature from US1

- **User Story 3 (P3)**: Depends on US1 AND US2 completion
  - Delivers: Validation that mixed content works correctly
  - Independent test: All content combinations render without issues
  - **Integration point**: Tests interaction between US1 and US2 features

### Within Each User Story

**User Story 1** (Title Support):
- T014-T016 can be done in parallel (different functions in renderer)
- T020-T023 can be done in parallel (different CSS rules)
- T017-T019 must come after T014-T016 (need renderTitle function)
- T024-T030 are sequential validation tests

**User Story 2** (Debug JSON):
- T031-T035 can be done in parallel (different functions in renderer)
- T038-T046 can all be done in parallel (different CSS rules)
- T036-T037 must come after T031-T035 (need renderDebugContent function)
- T047-T054 are sequential validation tests

**User Story 3** (Mixed Content):
- T055-T062 are all validation tests (sequential)
- Depends on US1 and US2 being complete

### Parallel Opportunities

- **Setup Phase**: T003-T005 can run in parallel (different verification tasks)
- **Foundational Phase**: T006-T008, T010-T013 can run in parallel (all in same file, different sections)
- **User Story 1**: T014-T016 parallel, T020-T023 parallel
- **User Story 2**: T031-T035 parallel, T038-T046 parallel
- **Polish Phase**: T063-T067, T075-T076 can run in parallel
- **Across Stories**: US1 and US2 can be worked on in parallel by different developers

---

## Parallel Example: User Story 1

```bash
# Launch rendering function tasks together:
Task: "Create renderTitle() function in src/ui/overlay-renderer.ts"
Task: "Add title validation logic in src/ui/overlay-renderer.ts"
Task: "Add XSS protection via textContent in src/ui/overlay-renderer.ts"

# Launch CSS tasks together:
Task: "Add .overlay-item-title CSS class in src/ui/overlay.css"
Task: "Add title margin/padding in src/ui/overlay.css"
Task: "Add bottom border to title in src/ui/overlay.css"
Task: "Ensure responsive title styling in src/ui/overlay.css"
```

## Parallel Example: User Story 2

```bash
# Launch debug rendering tasks together:
Task: "Create renderDebugContent() function in src/ui/overlay-renderer.ts"
Task: "Implement JSON.stringify with 2-space indent in src/ui/overlay-renderer.ts"
Task: "Add error handling for JSON serialization in src/ui/overlay-renderer.ts"

# Launch debug CSS tasks together:
Task: "Add .overlay-debug-content CSS class in src/ui/overlay.css"
Task: "Set monospaced font-family in src/ui/overlay.css"
Task: "Add white-space: pre-wrap in src/ui/overlay.css"
Task: "Add background color and padding in src/ui/overlay.css"
Task: "Add scrollable overflow in src/ui/overlay.css"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

This is the recommended approach for fastest time to value:

1. **Complete Phase 1: Setup** (~15 minutes)
   - Verify existing project structure (T001-T005)

2. **Complete Phase 2: Foundational** (~30 minutes)
   - Update type definitions (T006-T013)

3. **Complete Phase 3: User Story 1** (~2-3 hours)
   - T014-T030: Implement title support
   - **STOP and VALIDATE**: Test title rendering works
   - Verify titles appear for text and image content
   - Verify backward compatibility with untitled content

4. **Result**: You now have title support! 🎉
   - All content types can have optional titles
   - Overlay is more organized and scannable
   - Deploy/publish immediately if satisfied

### Incremental Delivery (Recommended)

Add features one at a time, validating independently:

1. **Complete Setup → Foundational ready** (~45 minutes)

2. **Add User Story 1 → Test independently** (~2-3 hours)
   - Title support works for all content types
   - Backward compatible with existing responses
   - **Deploy/Demo: MVP achieved!**

3. **Add User Story 2 → Test independently** (~3-4 hours)
   - Debug JSON content type works
   - Formatted with 2-space indent and monospace font
   - Can use titles from US1
   - **Deploy/Demo: Debug inspection available!**

4. **Add User Story 3 → Test independently** (~1 hour)
   - Mixed content validation complete
   - All edge cases handled gracefully
   - **Deploy/Demo: Production-ready!**

Each story adds value without breaking previous stories.

### Parallel Team Strategy

With multiple developers:

1. **Team completes Setup and Foundational together** (~45 minutes)

2. **Once Foundational is done, parallel development**:
   - Developer A: User Story 1 (title support) - 2-3 hours
   - Developer B: User Story 2 (debug JSON) - 3-4 hours
   - Developer C: Can start on Polish tasks (documentation)

3. **Stories complete and integrate independently**:
   - Each developer tests their story independently
   - US3 validation once US1 and US2 are merged
   - Total time: ~4 hours vs. ~7 hours sequential

---

## Task Statistics

- **Total Tasks**: 79 tasks
- **Setup Phase**: 5 tasks (~15 minutes)
- **Foundational Phase**: 8 tasks (~30 minutes)
- **User Story 1 (P1/MVP)**: 17 tasks (~2-3 hours)
- **User Story 2 (P2)**: 24 tasks (~3-4 hours)
- **User Story 3 (P3)**: 8 tasks (~1 hour)
- **Polish Phase**: 17 tasks (~2-3 hours)

**Parallelizable Tasks**: 35 tasks marked [P] (44% of total)

**MVP Scope** (Setup + Foundational + US1): 30 tasks (~3-4 hours total)

**Full Feature** (All user stories + Polish): 79 tasks (~9-12 hours total)

---

## Notes

- **[P] tasks** = different files or independent functions, no dependencies on incomplete tasks
- **[Story] label** maps task to specific user story for traceability
- **Each user story is independently completable and testable**
- **No automated tests** for this feature (manual validation via test server)
- **Commit after each task or logical group** (e.g., after type updates, after CSS changes)
- **Stop at any checkpoint to validate story independently**
- **User Story 2 can proceed without User Story 1** - they're independent
- **User Story 3 validates both US1 and US2** - should be done after both
- **Feature-specific docs go in specs/008-overlay-enhancements/** per constitution

---

## Validation Checklist

Before marking feature complete:

- [ ] Can display content items with optional titles
- [ ] Titles appear as bold headers above content
- [ ] Backward compatible: untitled content still works
- [ ] Can display debug JSON content with 2-space indentation
- [ ] Debug content uses monospaced font
- [ ] Debug content is scrollable for long JSON
- [ ] Titles work for all content types (text, image, debug)
- [ ] Mixed content (titled/untitled, different types) renders correctly
- [ ] No XSS vulnerabilities in title or debug rendering
- [ ] Responsive layout works on mobile (320px) to desktop (3840px)
- [ ] All functional requirements (FR-001 through FR-014) validated
- [ ] All success criteria (SC-001 through SC-007) validated
- [ ] API contract v1.2.0 documented and examples provided
- [ ] Test server examples include titles and debug content
- [ ] Quickstart guide updated with usage examples

---

**Generated**: 2025-11-01
**Related Docs**: [spec.md](./spec.md), [plan.md](./plan.md), [research.md](./research.md), [data-model.md](./data-model.md), [quickstart.md](./quickstart.md), [contracts/response-format-v1.2.yaml](./contracts/response-format-v1.2.yaml)
