# Tasks: Add Tweet and Author URLs to Data Schema

**Input**: Design documents from `/specs/006-add-tweet-urls/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not requested in specification - using manual testing and type checking only

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `specs/` at repository root
- Extension follows existing Chrome extension structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create utility modules needed by all user stories

- [ ] T001 [P] Create URL builder utilities module in src/utils/url-builder.ts
- [ ] T002 [P] Create author profile URL extractor module in src/extractors/author-url-extractor.ts
- [ ] T003 [P] Add author profile URL selector configuration to src/extractors/selectors.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 2: User Story 1 - Link to Original Tweet for Verification (Priority: P1) 🎯 MVP

**Goal**: Ensure tweet URL field is non-nullable and always populated via fallback construction

**Independent Test**: Capture a regular tweet and verify the `url` field contains a valid tweet permalink

### Implementation for User Story 1

- [ ] T004 [US1] Update TweetData interface url field from `string | null` to `string` in src/types/tweet-data.ts
- [ ] T005 [US1] Update tweet URL extractor to return non-nullable string with empty string fallback in src/extractors/url-extractor.ts
- [ ] T006 [US1] Add tertiary fallback to tweet URL extractor using buildTweetUrl() from url-builder in src/extractors/url-extractor.ts
- [ ] T007 [US1] Update tweet-extractor.ts to import extractTweetUrl with correct return type in src/extractors/tweet-extractor.ts
- [ ] T008 [US1] Run type checking with `npm run type-check` to verify no errors
- [ ] T009 [US1] Build extension in development mode with `npm run build:dev`
- [ ] T010 [US1] Manual test: Reload extension, capture tweet, verify url field present and valid
- [ ] T011 [US1] Manual test: Click extracted URL in console, verify it navigates to original tweet

**Checkpoint**: User Story 1 complete - tweet URL guaranteed non-null

---

## Phase 3: User Story 2 - Access Author Profiles for Context Analysis (Priority: P2)

**Goal**: Add profileUrl field to all Author objects with fallback construction

**Independent Test**: Capture tweets from various authors and verify each author object includes a valid profileUrl

### Implementation for User Story 2

- [ ] T012 [US2] Add profileUrl field to AuthorData interface as required string in src/types/tweet-data.ts
- [ ] T013 [US2] Update author-extractor.ts to call extractAuthorProfileUrl() in src/extractors/author-extractor.ts
- [ ] T014 [US2] Add fallback construction using buildProfileUrl() when extraction fails in src/extractors/author-extractor.ts
- [ ] T015 [US2] Add final fallback to empty string if handle unavailable in src/extractors/author-extractor.ts
- [ ] T016 [US2] Import extractAuthorProfileUrl and buildProfileUrl at top of author-extractor.ts in src/extractors/author-extractor.ts
- [ ] T017 [US2] Run type checking with `npm run type-check` to verify no errors
- [ ] T018 [US2] Build extension in development mode with `npm run build:dev`
- [ ] T019 [US2] Manual test: Capture regular tweet, verify author.profileUrl present and valid
- [ ] T020 [US2] Manual test: Capture quote tweet, verify both main and parent author.profileUrl present
- [ ] T021 [US2] Manual test: Click profileUrl values in console, verify navigation to author profiles

**Checkpoint**: User Story 2 complete - author profile URLs guaranteed for all authors

---

## Phase 4: User Story 3 - Enable Automated Link Generation in Reports (Priority: P3)

**Goal**: Update API contracts to document new required URL fields for backend consumers

**Independent Test**: Verify contract version incremented and all examples include new URL fields

### Implementation for User Story 3

- [ ] T022 [US3] Verify url field is marked as required in TweetData schema in specs/003-config-endpoint/contracts/async-response-api.yaml
- [ ] T023 [US3] Verify profileUrl field is marked as required in Author schema in specs/003-config-endpoint/contracts/async-response-api.yaml
- [ ] T024 [US3] Verify contract version is 1.1.0 (MINOR bump) in specs/003-config-endpoint/contracts/async-response-api.yaml
- [ ] T025 [US3] Verify version history includes Feature 006 changes with date and description in specs/003-config-endpoint/contracts/async-response-api.yaml
- [ ] T026 [US3] Verify simpleTweet example includes url and profileUrl fields in specs/003-config-endpoint/contracts/async-response-api.yaml
- [ ] T027 [US3] Verify quoteTweetWithVideo example includes url and profileUrl in main and parent in specs/003-config-endpoint/contracts/async-response-api.yaml

**Note**: API contracts were already updated during planning phase - these tasks verify correctness

**Checkpoint**: All user stories complete - extension emits complete URL data, contracts synchronized

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

- [ ] T028 [P] Run full type check to verify all interfaces synchronized with `npm run type-check`
- [ ] T029 [P] Build production version to verify no build errors with `npm run build`
- [ ] T030 Manual test: Test tweet URL fallback by modifying DOM to remove URL elements
- [ ] T031 Manual test: Test profile URL fallback by modifying DOM to remove User-Name links
- [ ] T032 Manual test: Verify both fields work for retweets (parent tweet data)
- [ ] T033 Manual test: Verify empty string fallback for missing handles (edge case)
- [ ] T034 Validate all requirements from quickstart.md testing section
- [ ] T035 [P] Update CLAUDE.md recent changes section if not already updated (check line 163)
- [ ] T036 Commit all changes with message following contract synchronization principle

**Note**: All feature documentation already exists in specs/006-add-tweet-urls/ - no additional docs needed

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **User Story 1 (Phase 2)**: Depends on T001 (url-builder.ts) completion
- **User Story 2 (Phase 3)**: Depends on T001, T002, T003 (all Setup tasks) completion
- **User Story 3 (Phase 4)**: Independent - contract verification only
- **Polish (Phase 5)**: Depends on all user stories completion

### User Story Dependencies

- **User Story 1 (P1)**: Can start after T001 (url-builder.ts created)
- **User Story 2 (P2)**: Can start after Setup (Phase 1) complete
- **User Story 3 (P3)**: Independent - can run anytime (just verification)

### Within Each User Story

**User Story 1 sequence**:
1. T004: Interface update (required first)
2. T005-T007: Extractor updates (sequential - same file)
3. T008-T011: Testing (sequential validation)

**User Story 2 sequence**:
1. T012: Interface update (required first)
2. T013-T016: Extractor updates (sequential - same file)
3. T017-T021: Testing (sequential validation)

**User Story 3 sequence**:
1. T022-T027: All verification tasks can run in parallel [P]

### Parallel Opportunities

- **Phase 1 (Setup)**: All tasks T001, T002, T003 can run in parallel [P]
- **Phase 4 (US3)**: All verification tasks T022-T027 can run in parallel [P]
- **Phase 5 (Polish)**: T028, T029, T035 can run in parallel [P]
- **User Stories**: US1 and US2 can be worked in parallel by different developers once Setup complete
- **Testing within stories**: Sequential (need previous task complete to test)

---

## Parallel Example: Setup Phase

```bash
# Launch all setup tasks together:
Task: "Create URL builder utilities module in src/utils/url-builder.ts"
Task: "Create author profile URL extractor module in src/extractors/author-url-extractor.ts"
Task: "Add author profile URL selector configuration to src/extractors/selectors.ts"
```

## Parallel Example: User Story 3 Verification

```bash
# Launch all contract verification tasks together:
Task: "Verify url field is marked as required in TweetData schema"
Task: "Verify profileUrl field is marked as required in Author schema"
Task: "Verify contract version is 1.1.0"
Task: "Verify version history includes Feature 006 changes"
Task: "Verify simpleTweet example includes url and profileUrl"
Task: "Verify quoteTweetWithVideo example includes url and profileUrl"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: User Story 1 (T004-T011)
3. **STOP and VALIDATE**: Test tweet URL field independently
4. Can deploy/demo at this point - tweet URLs working

### Incremental Delivery

1. Complete Setup (T001-T003) → Foundation ready
2. Add User Story 1 (T004-T011) → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 (T012-T021) → Test independently → Deploy/Demo
4. Add User Story 3 (T022-T027) → Verify contracts → Deploy/Demo
5. Polish (T028-T036) → Final validation

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup (T001-T003) together (or in parallel)
2. Once Setup is done:
   - Developer A: User Story 1 (T004-T011)
   - Developer B: User Story 2 (T012-T021) - can start in parallel with US1
   - Developer C: User Story 3 (T022-T027) - independent verification
3. Stories complete and integrate independently

---

## Task Details

### Phase 1: Setup Tasks

**T001 - Create URL builder utilities module**
- **File**: `src/utils/url-builder.ts`
- **Action**: Create new file with functions:
  - `buildTweetUrl(handle: string | null, tweetId: string | null): string`
  - `buildProfileUrl(handle: string | null): string`
  - `validateTwitterUrl(url: string): boolean`
  - `extractHandleFromTweetUrl(tweetUrl: string): string | null`
  - `extractTweetIdFromUrl(tweetUrl: string): string | null`
- **Reference**: See `data-model.md` section "New Utilities" for full implementation
- **Validation**: Functions validate input formats and return empty string on invalid input

**T002 - Create author profile URL extractor module**
- **File**: `src/extractors/author-url-extractor.ts`
- **Action**: Create new file with `extractAuthorProfileUrl(tweetArticle: Element): string | null`
- **Pattern**: Use existing `SelectorFallbackChain.extract()` pattern
- **Reference**: See `data-model.md` section "Author Profile URL Extractor"

**T003 - Add author profile URL selector configuration**
- **File**: `src/extractors/selectors.ts`
- **Action**: Add `export const authorProfileUrlSelector: SelectorConfig`
- **Selectors**: Primary (`[data-testid="User-Name"] a[role="link"]`), Secondary (article link with User-Name parent)
- **Reference**: See `data-model.md` section "Selector Configuration"

### Phase 2: User Story 1 Tasks

**T004 - Update TweetData interface url field type**
- **File**: `src/types/tweet-data.ts` (line ~84)
- **Change**: `url: string | null;` → `url: string;`
- **Rationale**: Make field required per FR-007

**T005 - Update tweet URL extractor return type**
- **File**: `src/extractors/url-extractor.ts`
- **Change**: Return type from `string | null` to `string`
- **Change**: Return `''` instead of `null` when extraction fails
- **Note**: Existing extraction logic works, just need type signature change

**T006 - Add tertiary fallback to tweet URL extractor**
- **File**: `src/extractors/url-extractor.ts`
- **Action**: Add fallback construction using `buildTweetUrl(handle, tweetId)` before final return
- **Dependencies**: Import `buildTweetUrl` from `../utils/url-builder`

### Phase 3: User Story 2 Tasks

**T012 - Add profileUrl field to AuthorData interface**
- **File**: `src/types/tweet-data.ts` (line ~14)
- **Change**: Add `profileUrl: string;` after `profileImageUrl`
- **Type**: Required, non-nullable string

**T013 - Call extractAuthorProfileUrl in author-extractor**
- **File**: `src/extractors/author-extractor.ts`
- **Action**: Add `let profileUrl = extractAuthorProfileUrl(tweetArticle);` before return statement
- **Dependencies**: Import `extractAuthorProfileUrl` from `./author-url-extractor`

**T014 - Add fallback construction for profileUrl**
- **File**: `src/extractors/author-extractor.ts`
- **Action**: Add `if (!profileUrl && handle) { profileUrl = buildProfileUrl(handle); }`
- **Dependencies**: Import `buildProfileUrl` from `../utils/url-builder`

**T015 - Add final empty string fallback**
- **File**: `src/extractors/author-extractor.ts`
- **Action**: Add `if (!profileUrl) { profileUrl = ''; logger.warn(...); }`
- **Rationale**: Guarantee non-null return even if handle missing (rare edge case)

**T016 - Add imports to author-extractor**
- **File**: `src/extractors/author-extractor.ts`
- **Action**: Add imports at top of file:
  ```typescript
  import { extractAuthorProfileUrl } from './author-url-extractor';
  import { buildProfileUrl } from '../utils/url-builder';
  ```

### Phase 4: User Story 3 Tasks

**T022-T027 - Contract Verification**
- **File**: `specs/003-config-endpoint/contracts/async-response-api.yaml`
- **Action**: Verify (not modify) - contracts already updated during planning
- **Check**: Fields marked required, version 1.1.0, examples updated, version history present

### Phase 5: Polish Tasks

**T028 - Full type check**
- **Command**: `npm run type-check`
- **Expected**: Zero errors
- **Fix**: If errors, review interface changes and extractor signatures

**T029 - Production build**
- **Command**: `npm run build`
- **Expected**: Build succeeds without errors
- **Validates**: Production build configuration handles new code

**T030-T033 - Fallback testing**
- **Method**: Manual DOM manipulation in DevTools
- **Purpose**: Verify fallback construction works when primary extraction fails

**T034 - Quickstart validation**
- **Reference**: Follow test procedures in `quickstart.md`
- **Covers**: Regular tweets, quote tweets, retweets, URL validation

**T036 - Final commit**
- **Message**: Follow git commit guidelines
- **Include**: Both TypeScript changes AND contract updates (Principle VII)
- **Format**: Multi-line message with Co-Authored-By: Claude

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Stop at any checkpoint to validate story independently
- Tweet URL extraction already exists - just needs type safety update
- Author profile URL is new extraction logic
- No automated tests requested - using manual testing and type checking
- All commits must synchronize TypeScript interfaces with API contracts (Principle VII)
