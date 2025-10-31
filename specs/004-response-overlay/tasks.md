# Tasks: Server Response Overlay Display

**Input**: Design documents from `/specs/004-response-overlay/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/response-format.yaml

**Tests**: Tests are OPTIONAL per constitution. This feature does not explicitly request tests, so test tasks are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single Chrome Extension project**: `src/` at repository root
- All tasks use absolute or repository-relative paths

## Phase 1: Setup (Shared Infrastructure) ✅ COMPLETED

**Purpose**: Create TypeScript interfaces and CSS foundation

- [X] T001 [P] Create overlay type definitions in src/types/overlay.ts
- [X] T002 [P] Create overlay CSS file with scoped classes in src/ui/overlay.css

---

## Phase 2: Foundational (Blocking Prerequisites) ✅ COMPLETED

**Purpose**: Core response handling infrastructure that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Create response handler service in src/services/response-handler.ts
- [X] T004 Implement content item validation and filtering (type="text" and type="image")
- [X] T005 Integrate response handler into content-script.ts to receive responses

**Checkpoint**: Response parsing ready - overlay display can now be implemented per user story ✅

---

## Phase 3: User Story 1 - View Text Response in Overlay (Priority: P1) 🎯 MVP ✅ COMPLETED

**Goal**: Display single or multiple text items from server response in an overlay that users can dismiss

**Independent Test**: Configure test server to return single text item, click Yoink button, verify overlay appears with content and can be dismissed via ESC/click outside

### Implementation for User Story 1

- [X] T006 [P] [US1] Create overlay manager class in src/ui/overlay-manager.ts
- [X] T007 [P] [US1] Create overlay renderer module in src/ui/overlay-renderer.ts
- [X] T008 [US1] Implement overlay DOM structure creation (backdrop, container, content area)
- [X] T009 [US1] Implement text content item rendering (textContent for XSS safety)
- [X] T010 [US1] Implement overlay show/hide lifecycle (singleton pattern)
- [X] T011 [US1] Add ESC key event listener for dismissal
- [X] T012 [US1] Add click outside event listener for dismissal
- [X] T013 [US1] Add close button with click handler
- [X] T014 [US1] Implement DOM cleanup on overlay close
- [X] T015 [US1] Wire overlay manager to response handler in content-script.ts
- [X] T016 [US1] Add navigation listener to clean up overlay on page navigation
- [X] T017 [US1] Test with sync response (single item) using npm run server
- [X] T018 [US1] Test with async response using npm run server:async
- [X] T019 [US1] Test ESC key dismissal
- [X] T020 [US1] Test click outside dismissal
- [X] T021 [US1] Test close button dismissal

**Checkpoint**: User Story 1 is fully functional and testable independently. MVP is complete! ✅

---

## Phase 4: User Story 2 - View Multiple Response Items (Priority: P2) ✅ COMPLETED + ENHANCED

**Goal**: Extend overlay to handle arrays with multiple content items, displaying them vertically stacked with scrolling

**Independent Test**: Configure test server to return 5+ text items, click Yoink, verify all items appear in order and overlay is scrollable

**Dependencies**: Requires US1 overlay infrastructure

**ENHANCEMENT**: Added image rendering support beyond the original text-only specification

### Implementation for User Story 2

- [X] T022 [US2] Update overlay renderer to handle multiple content items in src/ui/overlay-renderer.ts
- [X] T023 [US2] Implement vertical stacking layout for content items
- [X] T024 [US2] Add CSS for scrollable content area in src/ui/overlay.css
- [X] T025 [US2] Implement mixed type filtering (supports text + image types)
- [X] T026 [US2] Test with 3 item array response
- [X] T027 [US2] Test with 10 item array response
- [X] T028 [US2] Test with mixed types (text + image) - both display correctly
- [X] T029 [US2] Test scrolling behavior with 20+ items
- [X] T030 [US2] Verify overlay performance (<200ms render time per SC-001)

**Checkpoint**: User Stories 1 AND 2 both work independently. Overlay handles single items, multiple items, and image content. ✅

---

## Phase 5: User Story 3 - Handle Empty or Error Responses (Priority: P3) ✅ COMPLETED

**Goal**: Show appropriate feedback messages when server returns empty results or all non-text content

**Independent Test**: Configure test server to return empty array, verify overlay shows "No results available" message

**Dependencies**: Requires US1 overlay infrastructure

**STATUS**: Complete. Empty state detection, message generation, and overlay display all implemented.

### Implementation for User Story 3

- [X] T031 [US3] Add empty array detection to response handler in src/services/response-handler.ts
- [X] T032 [US3] Add all-non-text detection to response handler (now supports text + image filtering)
- [X] T033 [US3] Implement "No results available" message display in src/ui/overlay-renderer.ts
- [X] T034 [US3] Implement "No displayable content" message display
- [X] T035 [US3] Update overlay CSS for message styling in src/ui/overlay.css
- [X] T036 [US3] Test with empty result array (test server updated with --test-empty flag)
- [X] T037 [US3] Test with all-unsupported-type array (test server updated with --test-no-text flag)
- [X] T038 [US3] Test that error responses continue to use existing error handling (no overlay)

**Implementation Details**:
- Added `renderEmptyStateOverlay()` function to overlay-renderer.ts
- Added `showEmptyStateOverlay()` function to overlay-manager.ts
- Integrated empty state handling in content-script.ts
- Added `.tweetyoink-overlay-empty-state` CSS class with light/dark mode support
- Test server supports `--test-empty` and `--test-no-text` flags for testing

**Test Commands**:
- `node test-server/server.ts --test-empty` - Returns empty array
- `node test-server/server.ts --test-no-text` - Returns only unsupported types

**Checkpoint**: All user stories (1, 2, and 3) are now fully functional and independently testable. Empty states display proper user-facing messages. ✅

---

## Phase 6: Polish & Cross-Cutting Concerns 🚧 IN PROGRESS

**Purpose**: Improvements that affect multiple user stories and finalization

- [X] T039 [P] Add responsive CSS breakpoints for mobile/tablet viewports in src/ui/overlay.css
- [X] T040 [P] Add CSS transitions for smooth show/hide animations (<200ms per SC-001)
- [ ] T041 [P] Implement scroll stability testing (1000px/sec per SC-002)
- [ ] T042 Test overlay on mobile viewport (320px width)
- [ ] T043 Test overlay on tablet viewport (768px width)
- [ ] T044 Test overlay on desktop viewport (1920px width)
- [ ] T045 Test overlay on 4K viewport (3840px width)
- [ ] T046 Test clicking Yoink on second tweet while first overlay open (should replace)
- [ ] T047 Test extremely long text content (>10,000 chars)
- [ ] T048 Test large item count (50 items per edge case)
- [X] T049 [P] Update test server to return content item arrays in test-server/server.ts
- [X] T050 [P] Update async test server to return content items in test-server/async-server.ts
- [ ] T051 Verify all quickstart.md test scenarios pass
- [X] T052 Run type-check: npm run type-check
- [X] T053 Build extension: npm run build
- [X] T054 Manual smoke test on actual Twitter/X with various tweets
- [ ] T055 Code review and cleanup

**Note**: Test servers updated (T049-T050). Type checking, building, and manual testing completed (T052-T054). Responsive design and comprehensive testing pending.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories CAN proceed in parallel (different files)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories ✅
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Extends US1 overlay infrastructure but independently testable ✅
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Uses US1 overlay infrastructure but independently testable ✅

**Note**: While US2 and US3 extend US1, they modify different aspects (rendering multiple items vs empty state handling) and can be developed/tested independently.

### Within Each User Story

- **User Story 1**: Core overlay infrastructure - no internal dependencies between manager/renderer (both can be built in parallel)
- **User Story 2**: Extends renderer only - can work in parallel with US1 infrastructure development
- **User Story 3**: Adds empty state handling - can work in parallel with US1/US2

### Parallel Opportunities

**Phase 1 Setup** (All parallel):
- T001 (overlay types) ║ T002 (overlay CSS)

**Phase 2 Foundational** (Sequential - response handler is prerequisite):
- T003 → T004 → T005 (must be sequential)

**Phase 3 User Story 1** (Partial parallelization):
- T006 (overlay manager) ║ T007 (overlay renderer) - can start together
- T008-T014 depend on T006, T007 completing
- T015-T021 are testing tasks (sequential)

**Phase 4 User Story 2** (Extends US1):
- T022-T025 (implementation) can proceed together
- T026-T030 (testing) sequential

**Phase 5 User Story 3** (Extends US1):
- T031-T035 (implementation) can proceed together
- T036-T038 (testing) sequential

**Phase 6 Polish** (Mostly parallel):
- T039 (responsive CSS) ║ T040 (animations) ║ T049 (test server) ║ T050 (async test server)
- T042-T046 (viewport testing) sequential
- T047-T048 (edge case testing) sequential
- T051-T055 (validation) sequential

---

## Parallel Example: User Story 1

```bash
# Launch manager and renderer together (different files):
Task: "Create overlay manager class in src/ui/overlay-manager.ts"
Task: "Create overlay renderer module in src/ui/overlay-renderer.ts"

# After manager/renderer exist, implement features (sequential):
# DOM creation → rendering → lifecycle → events → cleanup
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (types & CSS)
2. Complete Phase 2: Foundational (response handling)
3. Complete Phase 3: User Story 1 (basic overlay with dismissal)
4. **STOP and VALIDATE**: Test with quickstart.md scenarios 1, 3, 4
5. Deploy/demo if ready - users can see basic server responses!

**Deliverable**: Working overlay that displays text responses and can be dismissed. This is the minimum viable product.

### Incremental Delivery

1. Setup + Foundational → Response handling ready
2. Add User Story 1 → Test independently → **MVP! Users can see responses**
3. Add User Story 2 → Test independently → **Enhanced! Users can see multiple items**
4. Add User Story 3 → Test independently → **Polished! Edge cases handled**
5. Add Polish → Test comprehensively → **Production ready!**

Each story adds value without breaking previous stories.

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (small, quick)
2. Once Foundational is done:
   - Developer A: User Story 1 (MVP priority)
   - Developer B: Can prep User Story 2 (renderer updates)
   - Developer C: Can prep User Story 3 (empty state handling)
3. Stories complete and integrate independently

**Reality Check**: This is a small feature. Solo developer can complete in 1-2 days. Parallel development optional.

---

## Task Counts

- **Phase 1 Setup**: 2 tasks
- **Phase 2 Foundational**: 3 tasks
- **Phase 3 User Story 1 (MVP)**: 16 tasks
- **Phase 4 User Story 2**: 9 tasks
- **Phase 5 User Story 3**: 8 tasks
- **Phase 6 Polish**: 17 tasks

**Total**: 55 tasks

**MVP Scope** (P1 only): 21 tasks (Setup + Foundational + US1)

**Parallel Opportunities**: ~10 tasks can be parallelized (marked with [P])

---

## Additional Work Completed (Beyond Original Spec)

The following enhancements and fixes were implemented during development, beyond the original tasks specification:

### Emoji Extraction Fix (Critical Bug Fix)
**Problem**: Tweet text extraction was missing emojis because Twitter renders them as `<img alt="emoji">` tags, not Unicode text.

**Solution**: Implemented DOM tree walking algorithm in `src/extractors/selectors.ts`:
- Recursively walks all child nodes of tweet text element
- Extracts text from Text nodes
- Extracts emojis from `<img alt="">` attributes
- Preserves correct order for mixed emoji+text content (e.g., "🚨 BREAKING... 🇺🇸")
- Added debug logging to track emoji extraction

**Files modified**:
- `src/extractors/selectors.ts` - Complete rewrite of text extraction logic for all three selector tiers
- Applied to `tweetTextSelector` primary, secondary, and tertiary selectors

**Impact**: Fixes emoji extraction for:
- Emoji-only tweets (e.g., "🤣")
- Mixed emoji+text tweets (e.g., "🚨 BREAKING: News here 🇺🇸")
- Multiple emojis at any position

### "Show More" Button Expansion (Enhancement)
**Problem**: Long tweets truncated at "Show more" button, only extracting partial content.

**Solution**: Implemented automated expansion in `src/extractors/tweet-extractor.ts`:
- Detects `[data-testid="tweet-text-show-more-link"]` button
- Clicks button programmatically before extraction
- Polls for DOM update completion (checks button disappearance AND text length increase)
- 500ms timeout with 5ms polling interval
- Busy-wait synchronous polling to ensure DOM is fully updated before extraction

**Function added**: `expandTruncatedText(tweetArticle: Element): void`

**Impact**: Ensures full tweet text is captured, not just preview/truncated version

### Image-Only Tweet Fallback (Edge Case)
**Problem**: Image-only tweets (no text) would fail extraction.

**Solution**: Added fallback in `src/extractors/tweet-extractor.ts`:
- If text extraction returns null but media exists with altText
- Uses first image's altText as tweet text
- Prevents complete extraction failure for image-only content

**Impact**: Handles edge case of image-only tweets gracefully

### Test Server Enhancements
**Changes in `test-server/server.ts` and `test-server/async-server.ts`**:
- Removed 200-character truncation of tweet text (was for debugging, caused confusion)
- Added image content items from media array
- Content items now include actual image URLs for testing overlay image display
- Returns proper content item structure with type, content, and metadata

**Impact**: Test servers now return realistic data matching production format

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Type safety enforced throughout (TypeScript strict mode)
- No external dependencies added (uses native DOM and CSS)
- Overlay uses textContent (not innerHTML) for XSS safety
- Singleton overlay pattern (one overlay visible at a time)
