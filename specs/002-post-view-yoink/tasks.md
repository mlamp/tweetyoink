# Tasks: Post View Yoink

**Input**: Design documents from `/specs/002-post-view-yoink/`
**Prerequisites**: plan.md (complete), spec.md (complete), research.md (complete), data-model.md (complete)

**Tests**: Not explicitly requested in spec - smoke tests will be added for extraction validation only

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Chrome Extension (single project)**: `src/`, `tests/` at repository root
- Paths follow structure defined in plan.md (src/types/, src/extractors/, src/ui/, tests/smoke/)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: TypeScript type definitions and constants used across all features

- [ ] T001 [P] Define TypeScript interfaces in src/types/tweet-data.ts (TweetData, AuthorData, MetricsData, MediaData, LinkCardData, TweetTypeFlags, ExtractionMetadata)
- [ ] T002 [P] Define extraction types in src/types/tweet-data.ts (ExtractionResult, ExtractionError, SelectorConfig, SelectorStrategy, ButtonState, ButtonStatus enum)
- [ ] T003 [P] Create SVG icon definitions in src/ui/icons.ts (yoinkIcon with "capture frame" design per research.md)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core selector infrastructure and utilities that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Implement SelectorFallbackChain class in src/extractors/selectors.ts (generic fallback handler with primary/secondary/tertiary tiers)
- [ ] T005 [P] Define tweet selector configurations in src/extractors/selectors.ts (data-testid, aria-label, structural patterns per research.md)
- [ ] T006 [P] Implement confidence score calculation in src/extractors/selectors.ts (weighted algorithm from data-model.md)
- [ ] T007 [P] Create extraction utilities in src/extractors/selectors.ts (null coercion, error handling, logging helpers)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 2 - Button Injection & Positioning (Priority: P1) 🎯 MVP INFRASTRUCTURE

**Goal**: Inject Yoink button as first item in tweet action bars, detect "More" button location, handle dynamic tweet loading

**Independent Test**: Navigate to x.com timeline, verify buttons appear within 500ms on all tweets in leftmost position, scroll to test stability

### Implementation for User Story 2

- [ ] T008 [US2] Implement MutationObserver setup in src/ui/button-injector.ts (observe main container with childList + subtree, 200ms throttle per research.md)
- [ ] T009 [US2] Implement anchor button detection in src/ui/button-injector.ts (find "More" button with aria-label="More", fallback to Grok button)
- [ ] T010 [US2] Implement action bar traversal in src/ui/button-injector.ts (use closest('[role="group"]') from anchor button)
- [ ] T011 [US2] Implement button injection logic in src/ui/button-injector.ts (insertBefore as first child, use WeakSet for tracking processed tweets)
- [ ] T012 [P] [US2] Create Yoink button component in src/ui/yoink-button.ts (icon-only with tooltip, disabled states, click handler stub)
- [ ] T013 [P] [US2] Add button styling in src/ui/yoink-button.ts (X/Twitter color scheme #1D9BF0, circular hover background, accessibility attributes per research.md)
- [ ] T014 [US2] Integrate button injector into content-script.ts (initialize MutationObserver on x.com/twitter.com pages)
- [ ] T015 [US2] Add error handling and logging for injection failures in src/ui/button-injector.ts

**Checkpoint**: Buttons should appear on all tweets within 500ms, positioned leftmost, stable during scrolling

---

## Phase 4: User Story 1 - Manual Tweet Capture (Priority: P1) 🎯 MVP CORE

**Goal**: Extract tweet data on Yoink button click and log structured JSON to console

**Independent Test**: Click Yoink button on any tweet, verify console shows nested JSON with text, author, metrics, timestamp

**Dependencies**: US2 must be complete (button injection infrastructure required)

### Tests for User Story 1

- [ ] T016 [P] [US1] Create smoke test for text extraction in tests/smoke/extraction.test.ts (validate against tests/fixtures/x-tweet-sample.html)
- [ ] T017 [P] [US1] Create smoke test for author extraction in tests/smoke/extraction.test.ts (validate handle, displayName, isVerified)
- [ ] T018 [P] [US1] Create smoke test for metrics extraction in tests/smoke/extraction.test.ts (validate reply/retweet/like/bookmark/view counts)

### Implementation for User Story 1

- [ ] T019 [P] [US1] Implement text extractor in src/extractors/text-extractor.ts (use data-testid="tweetText", fallback to aria patterns, preserve Unicode)
- [ ] T020 [P] [US1] Implement author extractor in src/extractors/author-extractor.ts (extract handle, displayName, isVerified, profileImageUrl)
- [ ] T021 [P] [US1] Implement timestamp extractor in src/extractors/text-extractor.ts (find time[datetime] element, convert to ISO 8601)
- [ ] T022 [P] [US1] Implement metrics extractor in src/extractors/metrics-extractor.ts (extract counts from data-testid="reply/retweet/like/bookmark" buttons and view count)
- [ ] T023 [US1] Implement main tweet extractor orchestrator in src/extractors/tweet-extractor.ts (call all field extractors, assemble TweetData object, calculate confidence score)
- [ ] T024 [US1] Implement console logging in src/extractors/tweet-extractor.ts (format nested JSON with indentation, include metadata)
- [ ] T025 [US1] Connect click handler in src/ui/yoink-button.ts (disable button, call tweet extractor, re-enable on completion, handle errors)
- [ ] T026 [US1] Add event.stopPropagation() to click handler in src/ui/yoink-button.ts (prevent tweet navigation)

**Checkpoint**: Clicking Yoink should extract and log basic tweet data (text, author, timestamp, metrics) to console

---

## Phase 5: User Story 3 - Data Extraction Coverage (Priority: P2)

**Goal**: Extend extraction to media, link cards, retweets, quotes - handle edge cases gracefully

**Independent Test**: Capture tweets with images/videos/link cards/retweets/quotes, verify console output includes all fields with null handling

**Dependencies**: US1 must be complete (basic extraction infrastructure required)

### Tests for User Story 3

- [ ] T027 [P] [US3] Create smoke test for media extraction in tests/smoke/extraction.test.ts (validate image/video/GIF URL extraction)
- [ ] T028 [P] [US3] Create smoke test for link card extraction in tests/smoke/extraction.test.ts (validate URL, title, description, domain)
- [ ] T029 [P] [US3] Create smoke test for tweet type detection in tests/smoke/extraction.test.ts (validate isRetweet, isQuote, isReply flags)

### Implementation for User Story 3

- [ ] T030 [P] [US3] Implement media extractor in src/extractors/media-extractor.ts (detect images via data-testid="tweetPhoto", videos via data-testid="tweetVideo", GIFs via data-testid="tweetGif", extract URLs + alt text)
- [ ] T031 [P] [US3] Implement link card extractor in src/extractors/linkcard-extractor.ts (find data-testid="card.wrapper", extract URL/title/description/imageUrl/domain)
- [ ] T032 [P] [US3] Implement tweet type detection in src/extractors/tweet-extractor.ts (set isRetweet, isQuote, isReply flags based on DOM structure)
- [ ] T033 [US3] Implement parent tweet extraction in src/extractors/tweet-extractor.ts (recursively extract quoted/replied-to tweets)
- [ ] T034 [US3] Integrate media extractor into tweet-extractor.ts (populate media array in TweetData)
- [ ] T035 [US3] Integrate link card extractor into tweet-extractor.ts (populate linkCard object in TweetData or set null)
- [ ] T036 [US3] Add null handling and warnings for missing fields in tweet-extractor.ts (log partial data with warnings array in metadata)

**Checkpoint**: Console output should include media[], linkCard{}, tweetType{}, parent{} with proper null handling

---

## Phase 6: User Story 4 - Selector Resilience (Priority: P3)

**Goal**: Implement fallback selectors for defensive extraction, calculate confidence scores, log selector failures

**Independent Test**: Manually break primary selectors in fixture HTML, verify extraction falls back and logs warnings with degraded confidence

**Dependencies**: US1 and US3 must be complete (all extractors must exist before adding fallbacks)

### Tests for User Story 4

- [ ] T037 [P] [US4] Create smoke test for fallback selector chain in tests/smoke/extraction.test.ts (remove data-testid, verify secondary selectors work)
- [ ] T038 [P] [US4] Create smoke test for confidence score degradation in tests/smoke/extraction.test.ts (verify score drops from 1.0 to 0.75 with secondary, 0.50 with tertiary)
- [ ] T039 [P] [US4] Create smoke test for partial extraction in tests/smoke/extraction.test.ts (verify null fields don't block other extractions)

### Implementation for User Story 4

- [ ] T040 [P] [US4] Add secondary selectors to text-extractor.ts (aria-label patterns, structural fallbacks)
- [ ] T041 [P] [US4] Add secondary selectors to author-extractor.ts (role="link" + href patterns for handle)
- [ ] T042 [P] [US4] Add secondary selectors to metrics-extractor.ts (aria-label parsing for counts)
- [ ] T043 [P] [US4] Add secondary selectors to media-extractor.ts (img/video element detection without data-testid)
- [ ] T044 [P] [US4] Add secondary selectors to linkcard-extractor.ts (a[href] with preview detection)
- [ ] T045 [US4] Implement tier tracking in SelectorFallbackChain in src/extractors/selectors.ts (record which tier succeeded per field)
- [ ] T046 [US4] Update confidence calculation in tweet-extractor.ts (weight by tier: primary=1.0, secondary=0.75, tertiary=0.50)
- [ ] T047 [US4] Add selector failure logging in src/extractors/selectors.ts (log failed selector paths with context)
- [ ] T048 [US4] Populate warnings array in ExtractionMetadata in tweet-extractor.ts (list all selector failures)

**Checkpoint**: Extraction should gracefully degrade when selectors fail, log warnings, adjust confidence scores

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Performance optimization, documentation, final validation

- [ ] T049 [P] Add WeakMap cleanup for button tracking in src/ui/button-injector.ts (prevent memory leaks)
- [ ] T050 [P] Add requestAnimationFrame for DOM modifications in src/ui/button-injector.ts (reduce layout thrashing per research.md)
- [ ] T051 [P] Add extraction duration tracking in src/extractors/tweet-extractor.ts (record metadata.duration for performance monitoring)
- [ ] T052 Verify all TypeScript strict mode compliance (run npm run type-check, fix any errors)
- [ ] T053 Run smoke tests and verify 100% pass rate (npm run test)
- [ ] T054 Manual validation per quickstart.md (load extension, test on live x.com, verify all user stories)
- [ ] T055 Update CLAUDE.md if new patterns emerged (document any Chrome Extension best practices discovered)
- [ ] T056 [P] Create implementation summary in specs/002-post-view-yoink/implementation-summary.md (document deviations from plan, performance metrics, lessons learned)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-6)**: All depend on Foundational phase completion
  - **US2 (Phase 3)**: Can start after Foundational - No dependencies on other stories
  - **US1 (Phase 4)**: Depends on US2 completion (needs button injection infrastructure)
  - **US3 (Phase 5)**: Depends on US1 completion (extends basic extraction)
  - **US4 (Phase 6)**: Depends on US1 + US3 completion (adds fallbacks to all extractors)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 2 (P1) - Button Injection**: Can start after Foundational (Phase 2) - BLOCKS User Story 1
- **User Story 1 (P1) - Manual Capture**: Depends on US2 (needs button to click) - BLOCKS User Story 3
- **User Story 3 (P2) - Data Coverage**: Depends on US1 (extends extraction) - BLOCKS User Story 4
- **User Story 4 (P3) - Selector Resilience**: Depends on US1 + US3 (adds fallbacks to all extractors)

**Note**: User stories are NOT fully independent due to technical dependencies (button infrastructure → extraction → comprehensive extraction → fallback selectors)

### Within Each User Story

- Tests (where included) can run in parallel within a story
- Extractors marked [P] can run in parallel (different files)
- Integration tasks depend on their extractors being complete
- Story complete before moving to next phase

### Parallel Opportunities

- **Phase 1 (Setup)**: All 3 tasks marked [P] can run in parallel
- **Phase 2 (Foundational)**: T005, T006, T007 marked [P] can run in parallel (after T004 completes)
- **Phase 3 (US2)**: T012, T013 can run in parallel
- **Phase 4 (US1)**:
  - Tests T016, T017, T018 can run in parallel
  - Extractors T019, T020, T021, T022 can run in parallel (after tests pass)
- **Phase 5 (US3)**:
  - Tests T027, T028, T029 can run in parallel
  - Extractors T030, T031, T032 can run in parallel
- **Phase 6 (US4)**:
  - Tests T037, T038, T039 can run in parallel
  - Secondary selector additions T040-T044 can run in parallel
- **Phase 7 (Polish)**: T049, T050, T051, T056 can run in parallel

---

## Parallel Example: User Story 1 (Manual Capture)

```bash
# Launch all tests for User Story 1 together:
Task T016: "Create smoke test for text extraction in tests/smoke/extraction.test.ts"
Task T017: "Create smoke test for author extraction in tests/smoke/extraction.test.ts"
Task T018: "Create smoke test for metrics extraction in tests/smoke/extraction.test.ts"

# Once tests pass, launch all extractors for User Story 1 together:
Task T019: "Implement text extractor in src/extractors/text-extractor.ts"
Task T020: "Implement author extractor in src/extractors/author-extractor.ts"
Task T021: "Implement timestamp extractor in src/extractors/text-extractor.ts"
Task T022: "Implement metrics extractor in src/extractors/metrics-extractor.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 2 + 1 Only)

**Recommended for fastest time to value:**

1. Complete Phase 1: Setup (T001-T003) - ~1 hour
2. Complete Phase 2: Foundational (T004-T007) - ~2 hours
3. Complete Phase 3: User Story 2 - Button Injection (T008-T015) - ~4 hours
4. Complete Phase 4: User Story 1 - Manual Capture (T016-T026) - ~6 hours
5. **STOP and VALIDATE**: Test on live x.com (capture text-only tweets, verify console output)
6. Deploy/demo basic functionality

**Total MVP time**: ~13 hours (button injection + basic extraction to console)

**MVP delivers**: Ability to click Yoink button and see tweet text/author/metrics in console

### Full Feature Delivery (All User Stories)

1. Complete Setup + Foundational → Foundation ready (~3 hours)
2. Add US2 (Button Injection) → Test independently → Buttons appear (~4 hours)
3. Add US1 (Manual Capture) → Test independently → Basic extraction works (~6 hours)
4. Add US3 (Data Coverage) → Test independently → Media/links/quotes work (~5 hours)
5. Add US4 (Selector Resilience) → Test independently → Fallbacks functional (~4 hours)
6. Polish & Validation → Final testing (~2 hours)

**Total feature time**: ~24 hours (complete implementation)

### Incremental Validation Points

**After US2**: Verify button injection
- Navigate to x.com timeline
- Confirm Yoink buttons appear leftmost on all tweets within 500ms
- Scroll and verify no duplicate buttons
- Test on single tweet view, replies, quotes

**After US1**: Verify basic extraction
- Click Yoink on text-only tweet
- Inspect console output: text, author{}, timestamp, metrics{}
- Verify confidence score ~0.95+ for fixture data
- Click multiple tweets (50+) and check for memory leaks (DevTools Memory profiler)

**After US3**: Verify comprehensive extraction
- Click Yoink on tweet with image → verify media[] populated
- Click Yoink on tweet with link card → verify linkCard{} populated
- Click Yoink on retweet → verify tweetType.isRetweet = true, author distinction
- Click Yoink on quote tweet → verify parent{} contains quoted tweet

**After US4**: Verify fallback resilience
- Modify tests/fixtures/x-tweet-sample.html to remove data-testid attributes
- Run tests/smoke/extraction.test.ts → verify fallback selectors work
- Check warnings array in metadata, confidence score drops to ~0.75
- Restore fixture and verify confidence returns to ~0.95

---

## Notes

- [P] tasks = different files, no dependencies on other incomplete tasks
- [Story] label maps task to specific user story (US1, US2, US3, US4)
- User stories have sequential dependencies (not fully independent): US2 → US1 → US3 → US4
- Verify tests pass before implementing (TDD for smoke tests)
- Run `npm run type-check` after each phase
- Run `npm run test` after each phase with tests
- Commit after each completed user story phase
- Stop at any checkpoint to validate story functionality
- MVP scope = US2 + US1 (button injection + basic extraction)
- Full feature = US2 + US1 + US3 + US4 (all priorities)

---

## Task Count Summary

- **Total Tasks**: 56
- **Phase 1 (Setup)**: 3 tasks
- **Phase 2 (Foundational)**: 4 tasks
- **Phase 3 (US2 - Button Injection)**: 8 tasks
- **Phase 4 (US1 - Manual Capture)**: 11 tasks (3 tests + 8 implementation)
- **Phase 5 (US3 - Data Coverage)**: 10 tasks (3 tests + 7 implementation)
- **Phase 6 (US4 - Selector Resilience)**: 12 tasks (3 tests + 9 implementation)
- **Phase 7 (Polish)**: 8 tasks

**Parallel Opportunities**: 29 tasks marked [P] can run concurrently with others in same phase

**MVP Task Count**: 26 tasks (Phase 1 + Phase 2 + Phase 3 + Phase 4)

**Estimated Effort**:
- MVP (US2 + US1): ~13 hours
- Full Feature (All US): ~24 hours
