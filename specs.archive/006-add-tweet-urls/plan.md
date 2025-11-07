# Implementation Plan: Add Tweet and Author URLs to Data Schema

**Branch**: `006-add-tweet-urls` | **Date**: 2025-11-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-add-tweet-urls/spec.md`

## Summary

This feature extends the TweetData and Author schemas with URL fields to provide direct links to tweets and author profiles. The primary requirement is adding `url` (tweet permalink) to TweetData and `profileUrl` (author profile link) to Author entities. The technical approach uses defensive DOM extraction with fallback URL construction from existing metadata (handle, tweet ID) to ensure 100% field population even when direct extraction fails.

## Technical Context

**Language/Version**: TypeScript 5.x with strict mode enabled
**Primary Dependencies**: Existing project dependencies (Vite, @crxjs/vite-plugin, @types/chrome)
**Storage**: N/A (no new storage requirements - URL fields are computed during extraction)
**Testing**: Manual testing with type checking (no automated tests requested)
**Target Platform**: Chrome Extension Manifest V3
**Project Type**: Single project (Chrome extension)
**Performance Goals**: URL extraction/construction adds <5ms to total tweet extraction time
**Constraints**: URL construction must handle edge cases (special characters in handles, missing tweet IDs)
**Scale/Scope**: Applies to all tweets captured (100% coverage requirement)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

### Principle I: Separation of Concerns ✅ PASS
- **Status**: Compliant
- **Rationale**: Feature adds fields to extension's data extraction without coupling to specific backend. URL fields are generic and work with any backend implementation.

### Principle II: LLM-First Data Structure ✅ PASS
- **Status**: Compliant
- **Rationale**: Extends DOM-based extraction with URL fields. Maintains structured JSON output. URLs enhance data structure for LLM analysis (enables link verification).

### Principle III: User Control & Privacy ✅ PASS
- **Status**: Compliant
- **Rationale**: No change to user control model. URLs are extracted only when user triggers capture. No new privacy concerns (URLs are publicly visible data on Twitter/X).

### Principle IV: TypeScript-First Development ✅ PASS
- **Status**: Compliant
- **Rationale**: All changes will be type-safe. TweetData and Author interfaces will be updated with required string fields. No `any` types needed.

### Principle V: Defensive DOM Extraction ✅ PASS
- **Status**: Compliant
- **Rationale**: Primary extraction from DOM with fallback URL construction strategy. Aligns perfectly with defensive extraction principle. Never throws on failure.

### Principle VI: Logging Discipline ✅ PASS
- **Status**: Compliant
- **Rationale**: URL extraction failures will use `logger.warn()` or `logger.debug()` via existing logger wrapper. No direct console usage.

### Principle VII: API Contract Synchronization ⚠️ CRITICAL
- **Status**: **REQUIRES ATTENTION**
- **Rationale**: This feature directly modifies TweetData and Author schemas, requiring contract updates. Must synchronize:
  - TypeScript interfaces (`src/types/tweet-data.ts`)
  - API contract YAML (`specs/003-config-endpoint/contracts/async-response-api.yaml`)
  - Contract version increment (MINOR bump - new fields added)
  - Version history documentation

**Post-Design Re-Check**: Will verify after Phase 1 that contracts and types are synchronized.

## Project Structure

### Documentation (this feature)

```text
specs/006-add-tweet-urls/
├── spec.md              # Feature specification (complete)
├── plan.md              # This file
├── research.md          # Phase 0: DOM selectors, URL patterns, edge cases
├── data-model.md        # Phase 1: TweetData and Author interface changes
├── quickstart.md        # Phase 1: Developer guide for URL extraction
├── contracts/           # Phase 1: Updated API contract (symlink/reference to 003)
└── tasks.md             # Phase 2: Task breakdown (via /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── types/
│   └── tweet-data.ts          # UPDATE: Add url and profileUrl fields
├── extractors/
│   ├── tweet-extractor.ts     # UPDATE: Extract/construct tweet URL
│   └── author-extractor.ts    # UPDATE: Extract/construct author profile URL
├── utils/
│   ├── logger.ts              # EXISTING: Use for URL extraction logging
│   └── url-builder.ts         # NEW: URL construction utilities
├── content-script.ts          # NO CHANGE: Uses updated extractors
└── service-worker.ts          # NO CHANGE: No changes needed

specs/003-config-endpoint/contracts/
└── async-response-api.yaml    # UPDATE: Add url and profileUrl to schema
```

**Structure Decision**: Single project structure (existing Chrome extension). Changes are minimal - adding two fields to existing interfaces and updating extraction logic. No new modules or major architectural changes required.

## Complexity Tracking

**No constitutional violations** - all gates passed. No complexity justification needed.

---

## Phase 0: Research & Decision Points

**Objective**: Resolve all technical unknowns before design.

### Research Tasks

1. **DOM Selector Discovery**
   - Task: Identify DOM elements containing tweet permalink and author profile URLs
   - Questions to answer:
     - What `data-testid` attributes expose tweet URLs?
     - What `data-testid` attributes expose author profile URLs?
     - What fallback selectors exist (href attributes, URL structures in DOM)?
     - How are URLs represented in retweets and quote tweets?

2. **URL Construction Patterns**
   - Task: Document Twitter/X URL structure and construction rules
   - Questions to answer:
     - What is the exact format for tweet permalinks? (`https://x.com/{handle}/status/{id}`)
     - What is the exact format for author profiles? (`https://x.com/{handle}`)
     - Where can tweet IDs be extracted if not in URL elements?
     - How to handle special characters in handles (underscores, numbers)?
     - What about legacy twitter.com vs current x.com domains?

3. **Edge Case Handling**
   - Task: Identify and document edge cases for URL extraction/construction
   - Questions to answer:
     - What happens when tweet ID is unavailable?
     - How to handle deleted/private tweets?
     - What about very old tweets with different ID formats?
     - How to validate constructed URLs before returning them?

4. **Migration Impact Analysis**
   - Task: Assess impact of adding required fields to existing schema
   - Questions to answer:
     - Are there existing captured tweets that need backfilling?
     - How will backend servers handle the new required fields?
     - What is the rollout strategy to avoid breaking changes?
     - Should there be a transition period with optional fields?

**Output**: `research.md` with DOM selector strategy, URL construction patterns, edge case handling approach, and migration recommendations.

---

## Phase 1: Design & Contracts

**Prerequisites**: Phase 0 research complete

### 1.1 Data Model Design (`data-model.md`)

**Entities to Update**:

1. **TweetData Interface**
   - Add field: `url: string` (required)
   - Type: Full tweet permalink (e.g., `https://x.com/username/status/1234567890`)
   - Extraction: Primary from DOM, fallback from handle + tweet ID
   - Validation: URL format regex check before returning

2. **Author Interface**
   - Add field: `profileUrl: string` (required)
   - Type: Full profile URL (e.g., `https://x.com/username`)
   - Extraction: Primary from DOM, fallback from handle
   - Validation: URL format regex check before returning
   - Scope: ALL Author objects (main tweet + parent tweets)

3. **URL Builder Utility**
   - Utility functions for constructing URLs:
     - `buildTweetUrl(handle: string, tweetId: string): string`
     - `buildProfileUrl(handle: string): string`
     - `validateTwitterUrl(url: string): boolean`
   - Defensive: Returns empty string if inputs invalid
   - Location: `src/utils/url-builder.ts` (new file)

**Validation Rules**:
- Tweet URLs must match pattern: `https://x.com/{handle}/status/{id}`
- Profile URLs must match pattern: `https://x.com/{handle}`
- Handle must not contain invalid URL characters (validation before construction)
- Tweet ID must be numeric string (validation before construction)

### 1.2 API Contract Updates (`contracts/`)

**Contract Location**: `specs/003-config-endpoint/contracts/async-response-api.yaml`

**Changes Required**:

1. **TweetData Schema**
   ```yaml
   TweetData:
     properties:
       url:
         type: string
         description: Tweet permalink URL
         example: "https://x.com/username/status/1234567890"
     required:
       - url  # ADD to required array
   ```

2. **Author Schema**
   ```yaml
   Author:
     properties:
       profileUrl:
         type: string
         description: Author profile URL
         example: "https://x.com/username"
     required:
       - profileUrl  # ADD to required array
   ```

3. **Version Update**
   - Increment version: `1.0.0` → `1.1.0` (MINOR bump - new fields)
   - Update `version_history` section with date, changes, migration notes

4. **Example Updates**
   - Update all examples to include `url` and `profileUrl` fields
   - Ensure consistency across simple tweet and quote tweet examples

**Contract Synchronization Checklist** (Principle VII):
- [ ] TypeScript interfaces updated in `src/types/tweet-data.ts`
- [ ] Contract YAML updated in `specs/003-config-endpoint/contracts/async-response-api.yaml`
- [ ] Contract version incremented (1.0.0 → 1.1.0)
- [ ] Version history section updated with date and change description
- [ ] All examples updated to include new fields
- [ ] Both changes committed together in same commit

### 1.3 Quickstart Guide (`quickstart.md`)

**Content**:

1. **Feature Overview**
   - What: URL fields added to TweetData and Author
   - Why: Enable one-click verification and author research
   - How: Defensive extraction with fallback construction

2. **Developer Setup**
   - No additional setup required (uses existing extraction infrastructure)
   - Review `src/utils/url-builder.ts` for URL construction utilities
   - Review updated TypeScript interfaces in `src/types/tweet-data.ts`

3. **Testing URL Extraction**
   - Capture regular tweet → verify `url` field present and valid
   - Capture quote tweet → verify both main and parent have URLs
   - Test fallback: Modify DOM to remove URL elements, verify construction works
   - Validate URL format using browser navigation (click URL, verify it works)

4. **Common Patterns**
   - Accessing tweet URL: `tweetData.url`
   - Accessing author profile: `tweetData.author.profileUrl`
   - Accessing parent author: `tweetData.parent?.author.profileUrl`

5. **Troubleshooting**
   - URL field empty → Check console for extraction warnings
   - Invalid URL format → Check handle/ID extraction, verify no special characters
   - Parent tweet missing URL → Check if parent data was extracted successfully

### 1.4 Agent Context Update

Run `.specify/scripts/bash/update-agent-context.sh claude` to update the Claude-specific context file with new technologies/patterns (if any).

**Expected Changes**: None (no new technologies introduced, only schema field additions)

---

## Phase 2: Task Generation

**Prerequisites**: Phase 1 design complete, constitution re-checked

**Command**: `/speckit.tasks` (separate command, not part of this plan)

**Output**: `tasks.md` with dependency-ordered task list

**Expected Task Categories**:
1. **Schema Updates**: TypeScript interface changes
2. **Extraction Logic**: DOM selectors and URL extraction
3. **URL Construction**: Fallback utility implementation
4. **Contract Updates**: API contract synchronization
5. **Validation**: Type checking and manual testing
6. **Polish**: Documentation updates, logging improvements

---

## Post-Design Constitution Re-Check

### Principle VII: API Contract Synchronization ✅ PASS (Post-Design)
- **Status**: Planned correctly
- **Evidence**:
  - Contract update tasks identified in Phase 1.2
  - TypeScript interface changes documented in Phase 1.1
  - Version increment strategy defined (MINOR bump)
  - Synchronization checklist created for implementation phase
  - Both changes planned for same commit

**Final Gate Status**: ✅ ALL GATES PASSED - Ready for task generation

---

## Next Steps

1. **Immediate**: Execute Phase 0 research (see Research Tasks above)
2. **After Research**: Execute Phase 1 design (data-model.md, contracts, quickstart.md)
3. **After Design**: Run `/speckit.tasks` to generate implementation task list
4. **After Tasks**: Begin implementation following task order

**Readiness**: This plan is ready for Phase 0 execution.
