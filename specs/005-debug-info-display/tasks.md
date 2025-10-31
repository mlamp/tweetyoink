# Tasks: Debug Metadata Display in Overlay UI

**Input**: Design documents from `/specs/005-debug-info-display/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/debug-block-format.yaml

**Tests**: No test tasks included (not requested in feature specification)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Type Definitions)

**Purpose**: Define TypeScript interfaces for debug data structures

- [X] T001 [P] Add DebugContentItem interface extending ResponseContentItem in src/types/overlay.ts
- [X] T002 [P] Add DebugData interface with optional fields (orchestrator_decisions, agent_analyses, execution_metrics, request_metadata) in src/types/overlay.ts
- [X] T003 [P] Add supporting interfaces (OrchestratorDecisions, AgentAnalysis, ExecutionMetric, RequestMetadata) in src/types/overlay.ts

---

## Phase 2: User Story 1 - View Debug Information During Development (Priority: P1) 🎯 MVP

**Goal**: Developers can see debug metadata in overlay during development mode

**Independent Test**: Run extension in dev mode, click Yoink on tweet with debug response, verify debug info renders at end of overlay with formatted JSON

### Implementation for User Story 1

- [X] T004 [US1] Modify ParsedResponse interface to add optional debugItems array in src/services/response-handler.ts
- [X] T005 [US1] Add environment detection using import.meta.env.DEV in src/services/response-handler.ts
- [X] T006 [US1] Add debug block filtering logic in parseServerResponse function (separate debug blocks from regular content using metadata.is_debug check) in src/services/response-handler.ts
- [X] T007 [US1] Implement parseDebugContent helper function with JSON.parse and try-catch error handling in src/ui/overlay-renderer.ts
- [X] T008 [US1] Implement renderDebugError function for malformed JSON fallback in src/ui/overlay-renderer.ts
- [X] T009 [US1] Implement renderDebugBlock function that parses JSON content and creates debug container in src/ui/overlay-renderer.ts
- [X] T010 [US1] Add debug block rendering to renderOverlay function after regular content items in src/ui/overlay-renderer.ts
- [X] T011 [P] [US1] Add base debug block styles (.debug-block, .debug-title) in src/ui/overlay.css
- [X] T012 [P] [US1] Add debug content formatting styles (.debug-content with monospace font) in src/ui/overlay.css
- [X] T013 [P] [US1] Add debug error state styles (.debug-error, .error-message, .debug-raw-content) in src/ui/overlay.css

**Checkpoint**: User Story 1 complete - Debug info visible in dev mode with formatted JSON at end of overlay

---

## Phase 3: User Story 2 - Expand/Collapse Debug Sections (Priority: P2)

**Goal**: Developers can expand/collapse debug sections to focus on specific metadata

**Independent Test**: Open overlay with debug info, click section headers to verify expand/collapse behavior, confirm all sections start collapsed

### Implementation for User Story 2

- [ ] T014 [US2] Implement renderDebugSection helper function using &lt;details&gt;/&lt;summary&gt; elements in src/ui/overlay-renderer.ts
- [ ] T015 [US2] Update renderDebugBlock to use renderDebugSection for orchestrator_decisions with conditional rendering (skip if undefined) in src/ui/overlay-renderer.ts
- [ ] T016 [US2] Update renderDebugBlock to use renderDebugSection for agent_analyses with conditional rendering (skip if undefined) in src/ui/overlay-renderer.ts
- [ ] T017 [US2] Update renderDebugBlock to use renderDebugSection for execution_metrics with conditional rendering (skip if undefined) in src/ui/overlay-renderer.ts
- [ ] T018 [US2] Update renderDebugBlock to use renderDebugSection for request_metadata with conditional rendering (skip if undefined) in src/ui/overlay-renderer.ts
- [ ] T019 [US2] Add empty state rendering when no sections present in debug data in src/ui/overlay-renderer.ts
- [ ] T020 [P] [US2] Add collapsible section styles (.debug-section, details, summary) in src/ui/overlay.css
- [ ] T021 [P] [US2] Add summary hover and open state styles (details[open] summary) in src/ui/overlay.css

**Checkpoint**: User Story 2 complete - Debug sections are collapsible, start collapsed, expand/collapse on click

---

## Phase 4: User Story 3 - No Debug Display in Production (Priority: P3)

**Goal**: Production builds show no debug info, keeping UI clean for end users

**Independent Test**: Build extension for production (npm run build), load in browser, analyze tweet, verify no debug sections appear

### Implementation for User Story 3

- [ ] T022 [US3] Verify environment detection in response-handler (import.meta.env.DEV check) filters debug blocks in production mode in src/services/response-handler.ts
- [ ] T023 [US3] Add logger.debug statement when debug blocks are filtered in production mode in src/services/response-handler.ts
- [ ] T024 [US3] Verify Vite build configuration tree-shakes debug code in production bundle

**Checkpoint**: User Story 3 complete - Production builds have zero debug display, dev builds show debug info

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and quality checks

- [ ] T025 [P] Add type guards (isDebugContentItem, hasOrchestratorDecisions, hasAgentAnalyses, etc.) in src/types/overlay.ts
- [ ] T026 [P] Add JSDoc comments to renderDebugBlock and helper functions in src/ui/overlay-renderer.ts
- [ ] T027 Validate all logger calls use logger.debug or logger.warn (no direct console usage)
- [ ] T028 Run TypeScript type-check (npm run type-check or tsc --noEmit) and fix any errors
- [ ] T029 Test with large debug block (80-100KB JSON) to verify performance under 100ms render time
- [ ] T030 Test with malformed JSON to verify error state renders correctly
- [ ] T031 Test with partial debug data (missing sections) to verify graceful degradation
- [ ] T032 Test with multiple debug blocks in single response to verify all render sequentially
- [ ] T033 Run production build (npm run build) and verify bundle size increase is minimal
- [ ] T034 Verify all success criteria SC-001 through SC-007 from spec.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately (T001-T003 run in parallel)
- **User Story 1 (Phase 2)**: Depends on Setup completion (T001-T003)
- **User Story 2 (Phase 3)**: Depends on User Story 1 completion (T004-T013)
- **User Story 3 (Phase 4)**: Depends on User Story 1 completion (T004-T013)
- **Polish (Phase 5)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Setup (Phase 1) - Core MVP functionality
- **User Story 2 (P2)**: Can start after User Story 1 - Extends rendering with collapsible sections
- **User Story 3 (P3)**: Can start after User Story 1 - Adds production filtering (minimal change)

### Within Each User Story

**User Story 1**:
- T004-T006: Response handler changes (sequential dependency)
- T007-T010: Renderer changes (sequential dependency on T004-T006)
- T011-T013: CSS changes (parallel with T007-T010)

**User Story 2**:
- T014-T019: Renderer changes (sequential dependency on US1)
- T020-T021: CSS changes (parallel with T014-T019)

**User Story 3**:
- T022-T024: Verification tasks (sequential after US1)

### Parallel Opportunities

- **Phase 1**: All tasks T001-T003 can run in parallel (different interfaces)
- **User Story 1**: T011-T013 (CSS) can run in parallel with T007-T010 (renderer logic)
- **User Story 2**: T020-T021 (CSS) can run in parallel with T014-T019 (renderer logic)
- **Polish Phase**: T025-T026 (documentation) can run in parallel with each other

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: User Story 1 (T004-T013)
3. **STOP and VALIDATE**: Test with dev server, verify debug info renders
4. Demo/validate before continuing

### Incremental Delivery

1. Complete Setup → Type definitions ready
2. Add User Story 1 → Test independently → MVP delivered (debug info visible in dev)
3. Add User Story 2 → Test independently → Enhanced UX (collapsible sections)
4. Add User Story 3 → Test independently → Production-ready (clean production UI)
5. Polish → Final validation

### Critical Path

Setup (Phase 1) → User Story 1 (Phase 2) → User Story 2 (Phase 3) → User Story 3 (Phase 4) → Polish (Phase 5)

User Stories 2 and 3 could technically run in parallel after US1, but sequential order respects priority (P2 before P3).

---

## Notes

- [P] tasks = different files or independent interfaces, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently testable
- No tests requested in spec (manual validation sufficient)
- Commit after each logical task group (e.g., after renderer changes, after CSS changes)
- Use logger.debug/logger.warn for all logging (never direct console)
- All JSON content rendered via textContent (never innerHTML) for XSS safety
- Environment detection via import.meta.env.DEV (Vite build-time constant)
- Native HTML &lt;details&gt;/&lt;summary&gt; for collapsibility (zero JavaScript state)
- Graceful degradation: missing sections skipped, malformed JSON shows error state

---

## Files Modified (Summary)

- `src/types/overlay.ts` - Add debug interfaces (T001-T003, T025)
- `src/services/response-handler.ts` - Add debug filtering (T004-T006, T022-T023)
- `src/ui/overlay-renderer.ts` - Add debug rendering (T007-T010, T014-T019, T026)
- `src/ui/overlay.css` - Add debug styling (T011-T013, T020-T021)

**Total Tasks**: 34 tasks
- Setup: 3 tasks
- User Story 1 (P1): 10 tasks
- User Story 2 (P2): 8 tasks
- User Story 3 (P3): 3 tasks
- Polish: 10 tasks
