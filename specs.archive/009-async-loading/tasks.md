# Tasks: Async Loading Indicators

**Input**: Design documents from `/specs/009-async-loading/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: No automated tests requested for this feature (manual testing only)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

**Single project structure** (Chrome extension):
- Source code: `src/` at repository root
- UI components: `src/ui/`
- Services: `src/services/`
- Types: `src/types/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Type definitions and constants needed for all user stories

- [X] T001 [P] Add LoadingState interface to src/types/config.ts
- [X] T002 [P] Add ProgressData interface to src/types/config.ts
- [X] T003 [P] Add VisualState interface to src/types/config.ts
- [X] T004 [P] Add loading constants (PULSE_SPEED, FILL_COLOR, etc.) to src/ui/constants.ts

**Checkpoint**: Type definitions complete - foundation ready for implementation

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core SVG and CSS infrastructure that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 [P] Create progress circle SVG element function in src/ui/icons.ts
- [X] T006 [P] Create checkmark icon SVG element function in src/ui/icons.ts
- [X] T007 [P] Add CSS pulse animation keyframes to src/ui/overlay.css
- [X] T008 [P] Add CSS loading indicator styles to src/ui/overlay.css
- [X] T009 Create loading-indicator.ts module with WeakMap state storage in src/ui/loading-indicator.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Immediate Visual Feedback on Yoink (Priority: P1) 🎯 MVP

**Goal**: Users see loading indicator within 100ms of clicking Yoink button, with visual feedback throughout extraction and POST request

**Independent Test**:
1. Click Yoink button on any tweet
2. Verify pulse animation appears within 100ms
3. Verify button stays disabled during processing
4. Verify loading clears on completion/error

### Implementation for User Story 1

- [X] T010 [US1] Implement showButtonLoading() function in src/ui/loading-indicator.ts
- [X] T011 [US1] Implement hideButtonLoading() function in src/ui/loading-indicator.ts
- [X] T012 [US1] Implement calculateVisualState() for indeterminate mode in src/ui/loading-indicator.ts
- [X] T013 [US1] Implement renderLoadingIndicator() to apply visual state to button in src/ui/loading-indicator.ts
- [X] T014 [US1] Update handleYoinkClick() to call showButtonLoading() in src/content-script.ts
- [X] T015 [US1] Update handleYoinkClick() error handling to call hideButtonLoading() in src/content-script.ts
- [X] T016 [US1] Update handleYoinkClick() sync response handling to show checkmark + hideButtonLoading() in src/content-script.ts

**Checkpoint**: At this point, User Story 1 should be fully functional - clicking Yoink shows immediate pulse loading, clears on completion

**Manual Testing Checklist**:
- [ ] Pulse animation appears <100ms after click
- [ ] Button is disabled during loading (cursor: not-allowed)
- [ ] Loading clears on sync response (checkmark flash → re-enable)
- [ ] Loading clears on error (error state → re-enable)
- [ ] No console errors
- [ ] Animation is smooth (60fps in DevTools Performance tab)

---

## Phase 4: User Story 2 - Loading State During Async Processing (Priority: P2)

**Goal**: Users see persistent loading indicator during async polling, with adaptive progress display based on server data (real progress, estimated, or indeterminate)

**Independent Test**:
1. Use async test server
2. Click Yoink button
3. Verify loading persists during polling
4. Verify progress updates (radial fill or pulse based on server data)
5. Verify completion shows checkmark + overlay

### Implementation for User Story 2

- [X] T017 [P] [US2] Implement extractProgressData() to parse server response in src/ui/loading-indicator.ts
- [X] T018 [P] [US2] Implement determineMode() to select real/estimated/indeterminate in src/ui/loading-indicator.ts
- [X] T019 [US2] Implement calculateEstimatedProgress() for estimated mode in src/ui/loading-indicator.ts
- [X] T020 [US2] Implement updateButtonProgress() to update visual state from progress data in src/ui/loading-indicator.ts
- [X] T021 [US2] Update calculateVisualState() to handle real progress mode (radial fill) in src/ui/loading-indicator.ts
- [X] T022 [US2] Update calculateVisualState() to handle estimated progress mode (radial fill + pulse speed) in src/ui/loading-indicator.ts
- [X] T023 [US2] Update handleYoinkClick() async response handling to call updateButtonProgress() in src/content-script.ts
- [X] T024 [US2] Add ASYNC_PROGRESS_UPDATE message broadcaster in pollRequest() in src/services/polling-service.ts
- [X] T025 [US2] Add ASYNC_PROGRESS_UPDATE message listener in content-script.ts
- [X] T026 [US2] Implement findButtonForRequest() helper to locate button by requestId in src/content-script.ts

**Checkpoint**: At this point, User Story 2 should be fully functional - async requests show adaptive progress indicators

**Manual Testing Checklist**:
- [ ] **Scenario 1 - Real Progress**: Server returns `progress` field
  - [ ] Radial fill appears and maps to progress percentage (e.g., 0.65 = 65% fill)
  - [ ] Fill updates smoothly on each poll response
  - [ ] Gentle pulse overlays radial fill
  - [ ] Completion shows checkmark + overlay

- [ ] **Scenario 2 - Estimated Progress**: Server returns `estimatedDuration` only
  - [ ] Radial fill grows gradually based on elapsed time
  - [ ] Fill caps at 95% if duration exceeded
  - [ ] Pulse speed increases as completion approaches (1s → 0.5s)
  - [ ] Lower opacity (0.8) indicates estimation

- [ ] **Scenario 3 - Indeterminate**: No progress data
  - [ ] Steady pulse animation (no radial fill)
  - [ ] Pulse interval: 1s steady
  - [ ] Icon opacity: 0.6
  - [ ] Loading persists until completion

- [ ] No console errors during polling
- [ ] State updates don't cause jank (check Performance tab)
- [ ] Loading clears properly on async completion

---

## Phase 5: User Story 3 - Loading Completion and Error States (Priority: P3)

**Goal**: Users see clear visual feedback when processing completes (success checkmark flash) or fails (error state), with smooth transitions back to ready state

**Independent Test**:
1. Trigger both successful and failed Yoink operations
2. Verify checkmark flash (200ms) on success
3. Verify error state flash on failure
4. Verify button returns to ready state after transitions
5. Verify button is re-enabled and ready for next click

### Implementation for User Story 3

- [X] T027 [P] [US3] Implement showCheckmark() to display success animation in src/ui/loading-indicator.ts
- [X] T028 [P] [US3] Implement showError() to display error animation in src/ui/loading-indicator.ts
- [X] T029 [US3] Update hideButtonLoading() to handle smooth state transitions in src/ui/loading-indicator.ts
- [X] T030 [US3] Add completion state handling (success → checkmark → clear) in handleYoinkClick() in src/content-script.ts
- [X] T031 [US3] Add error state handling (error → error flash → clear) in handleYoinkClick() in src/content-script.ts
- [X] T032 [US3] Update ASYNC_COMPLETED message listener to show checkmark before clearing in src/content-script.ts

**Checkpoint**: At this point, User Story 3 should be fully functional - all state transitions are smooth and clear

**Manual Testing Checklist**:
- [ ] **Success State**:
  - [ ] Checkmark appears on sync completion
  - [ ] Checkmark lasts 200ms
  - [ ] Smooth fade transition to ready state
  - [ ] Button re-enables after checkmark

- [ ] **Error State**:
  - [ ] Error color flash appears on failure
  - [ ] Error state lasts ERROR_DISPLAY_DURATION_MS
  - [ ] Smooth transition back to ready state
  - [ ] Button re-enables after error display

- [ ] **Async Completion**:
  - [ ] Loading → checkmark → overlay appears
  - [ ] Button re-enables after overlay shown

- [ ] No visual glitches during transitions
- [ ] State transitions use proper easing (200ms ease-out)

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility, edge case handling, and validation

- [X] T033 [P] Add ARIA live region element creation in src/ui/loading-indicator.ts
- [X] T034 [P] Implement announceProgress() for screen reader updates in src/ui/loading-indicator.ts
- [X] T035 [P] Add aria-busy attribute updates to button during loading in src/ui/loading-indicator.ts
- [X] T036 [P] Add aria-label updates ("Yoink this tweet, loading X%") in src/ui/loading-indicator.ts
- [X] T037 [P] Implement clampProgress() validation function in src/ui/loading-indicator.ts
- [X] T038 [P] Implement validateEstimatedDuration() validation function in src/ui/loading-indicator.ts
- [X] T039 [P] Add error logging for invalid progress data in src/ui/loading-indicator.ts
- [X] T040 [P] Add will-change CSS properties for performance optimization in src/ui/overlay.css
- [X] T041 Add edge case handling for rapid button clicks in src/content-script.ts
- [X] T042 Add edge case handling for navigation during loading in src/content-script.ts

**Checkpoint**: Feature complete - all polish and edge cases handled

**Final Manual Testing Checklist**:
- [ ] **Accessibility**:
  - [ ] Test with NVDA or VoiceOver screen reader
  - [ ] Loading state announced on click
  - [ ] Progress percentage announced at 25% intervals
  - [ ] Completion announced
  - [ ] Announcements use polite mode (non-intrusive)

- [ ] **Edge Cases**:
  - [ ] Rapid double-click: Second click ignored
  - [ ] Navigation during loading: State clears, button resets
  - [ ] Polling timeout (5min): Shows error, re-enables
  - [ ] Invalid progress data (>1.0): Clamped to 1.0, warning logged
  - [ ] Estimated progress exceeded: Caps at 95%, switches to pulse-only

- [ ] **Performance**:
  - [ ] Animations run at 60fps (Chrome DevTools Performance tab)
  - [ ] No layout thrashing (check Performance timeline)
  - [ ] Memory usage <3KB per operation (Chrome Task Manager)
  - [ ] CPU usage <2% during animation

- [ ] **Browser Compatibility**:
  - [ ] Works in Chrome 120+
  - [ ] Works in Edge 120+

---

## Dependencies

### User Story Completion Order

```
Phase 1 (Setup) → Phase 2 (Foundational)
                         ↓
    ┌────────────────────┼────────────────────┐
    ↓                    ↓                    ↓
US1 (P1) MVP        US2 (P2)            US3 (P3)
                         ↓                    ↓
                    [Can be done after US1]  ↓
                                        [Can be done after US2]
```

**Critical Path**: Phase 1 → Phase 2 → US1 → US2 → US3 → Polish

**Recommended Implementation Order**:
1. Complete Phase 1 + Phase 2 (foundation)
2. Implement US1 fully (MVP - basic loading indicator)
3. Test US1 thoroughly before moving on
4. Implement US2 (adaptive progress - builds on US1)
5. Test US2 thoroughly
6. Implement US3 (completion states - builds on US2)
7. Add Polish (accessibility + edge cases)

### Parallel Execution Opportunities

**Phase 1** (all tasks can run in parallel):
- T001, T002, T003, T004 can all be done simultaneously

**Phase 2** (independent tasks can run in parallel):
- T005 + T006 (SVG icons) in parallel
- T007 + T008 (CSS animations) in parallel
- T009 must wait until types from Phase 1 are complete

**Within Each User Story**:
- Tasks marked with [P] can run in parallel within the same story
- Non-parallel tasks must run sequentially (they depend on earlier tasks)

### MVP Scope (Minimum Viable Product)

**MVP = User Story 1 Only**

Delivers: Immediate visual feedback on Yoink button click
- Pulse animation appears within 100ms
- Button disabled during processing
- Loading clears on completion/error
- Covers 80% of use value with minimal scope

**Post-MVP Increments**:
- **Increment 2**: Add US2 (adaptive progress for async)
- **Increment 3**: Add US3 (smooth completion states)
- **Increment 4**: Add Polish (accessibility, edge cases)

---

## Implementation Strategy

### Incremental Delivery Approach

**Week 1: MVP (US1)**
- Implement Phase 1 + Phase 2 (foundation)
- Implement User Story 1 (basic loading indicator)
- Manual testing of US1
- Deploy to development extension for validation

**Week 2: Enhanced Async (US2)**
- Implement User Story 2 (adaptive progress)
- Manual testing of US2 with async test server
- Validate all 3 progress modes (real/estimated/indeterminate)

**Week 3: Polish (US3 + Polish)**
- Implement User Story 3 (completion states)
- Implement Polish tasks (accessibility, edge cases)
- Final comprehensive testing
- Deploy to production

### Success Metrics

**User Story 1 (MVP)**:
- ✅ Loading indicator appears <100ms (100% of clicks)
- ✅ Zero JavaScript errors
- ✅ Button properly disabled during loading

**User Story 2**:
- ✅ All 3 progress modes work correctly
- ✅ Progress updates smoothly (60fps)
- ✅ Polling updates visual state in real-time

**User Story 3**:
- ✅ Checkmark flash on success
- ✅ Error flash on failure
- ✅ Smooth transitions (200ms ease-out)

**Polish**:
- ✅ Screen reader announcements work
- ✅ All edge cases handled
- ✅ Performance benchmarks met

---

## Task Summary

**Total Tasks**: 42 tasks
- Phase 1 (Setup): 4 tasks
- Phase 2 (Foundational): 5 tasks
- User Story 1 (P1): 7 tasks
- User Story 2 (P2): 10 tasks
- User Story 3 (P3): 6 tasks
- Polish: 10 tasks

**Parallelizable Tasks**: 20 tasks (marked with [P])
**Sequential Tasks**: 22 tasks

**Estimated Time**:
- Phase 1: 30 minutes
- Phase 2: 1 hour
- User Story 1: 1.5 hours
- User Story 2: 2 hours
- User Story 3: 1 hour
- Polish: 1 hour

**Total Estimated Time**: 6-7 hours (spread over 1-3 weeks for incremental delivery)

**Files Modified**: 5 files
**Files Created**: 1 file (src/ui/loading-indicator.ts)

---

**Status**: ✅ Ready for implementation
**Next Step**: Begin with Phase 1 (Setup) tasks T001-T004
