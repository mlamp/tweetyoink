# Implementation Plan: Post View Yoink

**Branch**: `002-post-view-yoink` | **Date**: 2025-10-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-post-view-yoink/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement tweet capture functionality by injecting a "Yoink" button as the first (leftmost) item in the tweet action bar. When clicked, the button extracts tweet data (text, author, metrics, media, links) using defensive DOM selectors and logs structured JSON to the console. The button uses the "More" menu button (three dots) as primary anchor point with Grok button fallback, displays as icon-only with tooltip, and handles extraction failures gracefully by logging partial data with warnings.

## Technical Context

**Language/Version**: TypeScript 5.x with strict mode enabled
**Primary Dependencies**: Vite 5.x, @crxjs/vite-plugin for Chrome extension bundling
**Storage**: Chrome Extension Storage API (for future settings), currently N/A for console-only MVP
**Testing**: Vitest 4.x for smoke tests (existing setup from 001-initial-setup)
**Target Platform**: Chrome Extension Manifest V3 (x.com and twitter.com domains)
**Project Type**: Chrome Extension (single codebase with content scripts, service worker, popup)
**Performance Goals**:
- Button injection within 500ms of tweet visibility
- Tweet capture and console output within 1 second
- Support 50+ captures per session without memory leaks
**Constraints**:
- Extension-only (no backend integration in this phase)
- Console logging for data output (no UI beyond button)
- DOM-based extraction (no screenshots)
- Defensive selector patterns with fallback tiers
**Scale/Scope**:
- 4 user stories (2 P1, 1 P2, 1 P3)
- 20 functional requirements
- Target 95%+ button injection success rate across tweet types

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Separation of Concerns
✅ **PASS** - Extension-only implementation, no backend code in this feature. Console logging maintains separation.

### Principle II: LLM-First Data Structure
✅ **PASS** - DOM parsing with defensive selectors as primary extraction method. Structured JSON output with nested objects (author, metrics, media, linkCard, metadata).

### Principle III: User Control & Privacy
✅ **PASS** - User explicitly clicks Yoink button to trigger capture. No automatic/background extraction. Console output gives user full visibility.

### Principle IV: TypeScript-First Development
✅ **PASS** - All code in TypeScript strict mode. Types required for TweetData, ExtractionMethod, YoinkButton entities.

### Principle V: Defensive DOM Extraction
✅ **PASS** - Multiple extraction tiers (primary data-testid, secondary aria-label, tertiary structure). Fallback methods return null instead of throwing. Confidence scores track extraction quality.

### Architecture Standards Compliance
✅ **Technology Stack**: TypeScript 5.x + Vite + @crxjs/vite-plugin (matches constitution requirements)
✅ **Repository Structure**: Follows constitutional layout (src/extractors/, src/types/, tests/fixtures/)
✅ **Manifest V3**: Service worker architecture (already established in 001-initial-setup)
✅ **Testing**: Vitest smoke tests (existing framework can be extended)

### No Violations - No Complexity Justification Required

## Project Structure

### Documentation (this feature)

```text
specs/002-post-view-yoink/
├── spec.md              # Feature specification (completed)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (to be generated)
├── data-model.md        # Phase 1 output (to be generated)
├── quickstart.md        # Phase 1 output (to be generated)
├── checklists/
│   └── requirements.md  # Spec validation (completed)
└── contracts/           # Phase 1 output (N/A - no API contracts for console-only MVP)
```

### Source Code (repository root)

```text
src/
├── types/
│   └── tweet-data.ts         # TweetData, ExtractionMethod, YoinkButton interfaces
├── extractors/
│   ├── tweet-extractor.ts    # Main extraction orchestrator
│   ├── text-extractor.ts     # Tweet text extraction with fallbacks
│   ├── author-extractor.ts   # Author metadata extraction
│   ├── metrics-extractor.ts  # Engagement metrics extraction
│   ├── media-extractor.ts    # Image/video/GIF URL extraction
│   ├── linkcard-extractor.ts # Link preview extraction
│   └── selectors.ts          # Centralized selector definitions (primary, secondary, tertiary)
├── ui/
│   ├── button-injector.ts    # Button injection logic with MutationObserver
│   ├── yoink-button.ts       # Button component creation and event handling
│   └── icons.ts              # SVG icon definitions
├── content-script.ts         # Entry point for tweet page injection
├── service-worker.ts         # Background script (minimal for this feature)
└── popup/
    ├── popup.html
    ├── popup.css
    └── popup.ts

tests/
├── fixtures/
│   ├── x-tweet-sample.html   # Anonymized tweet HTML (existing)
│   └── README.md             # Fixture documentation (existing)
└── smoke/
    ├── manifest.test.ts      # Existing smoke test
    ├── build.test.ts         # Existing smoke test
    └── extraction.test.ts    # New: Test extractors against fixture HTML
```

**Structure Decision**: Chrome Extension (single project) structure selected. Matches existing 001-initial-setup foundation with src/types, src/extractors placeholders already present. New extractors/ module will house all DOM extraction logic with defensive selector patterns. UI components in src/ui/ for button injection and rendering.

## Phase 0: Research & Unknowns

### Research Tasks

The following unknowns need research before design phase:

1. **Button Injection Strategy**
   - **Unknown**: Best practice for injecting buttons into dynamically rendered React components without triggering re-renders
   - **Research Question**: How to reliably detect and inject into X/Twitter's action bar using MutationObserver patterns?
   - **Output**: Recommended MutationObserver configuration, DOM traversal strategy, and debouncing approach

2. **Selector Resilience Patterns**
   - **Unknown**: Industry-standard fallback selector tier architecture for defensive DOM extraction
   - **Research Question**: What selector patterns are most stable for X/Twitter's data-testid, aria-label, and structural selectors?
   - **Output**: Selector tier definitions (primary/secondary/tertiary) with confidence score mappings

3. **Icon Design Integration**
   - **Unknown**: SVG icon format compatible with X/Twitter's design system and accessible as inline embed
   - **Research Question**: What are best practices for icon-only buttons with tooltips in Chrome extensions?
   - **Output**: SVG icon specification, tooltip implementation approach, accessibility attributes

4. **Performance Optimization**
   - **Unknown**: Memory leak prevention patterns for long-running content scripts with event listeners
   - **Research Question**: How to achieve 50+ captures without performance degradation or memory leaks?
   - **Output**: Event listener cleanup strategy, WeakMap usage for button tracking, extraction result disposal

5. **Confidence Score Algorithm**
   - **Unknown**: Algorithm for calculating extraction confidence based on selector tier success
   - **Research Question**: How to map extraction tier results to 0.0-1.0 confidence scores?
   - **Output**: Confidence scoring formula, critical field weighting, threshold definitions

### Dependencies & Best Practices

1. **@crxjs/vite-plugin** - Already in use, verify button injection compatibility
2. **TypeScript Strict Mode** - Verify type safety for DOM manipulation and nullability handling
3. **Vitest** - Extend existing smoke test setup for extractor validation against fixtures
4. **Chrome Extension APIs** - No new APIs needed (content scripts sufficient)

## Phase 1: Design Artifacts

### Phase 1.1: Data Model (data-model.md)

**Entities to Define**:
- `TweetData` - Nested JSON structure with text, author{}, metrics{}, media[], linkCard{}, tweetType{}, parent{}, metadata{}
- `ExtractionResult` - Wrapper containing TweetData + confidence score + warnings
- `SelectorConfig` - Tier definitions (primary, secondary, tertiary) per field
- `ButtonState` - Tracking injection status, enabled/disabled state

**Validation Rules**:
- Text: Not null for confidence > 0.5
- Author handle: Required for confidence > 0.7
- Timestamp: Must be valid ISO 8601 or null
- Metrics: Individual counts can be null, but object must exist
- Confidence: 0.0 to 1.0 range

**State Transitions**:
- Button: `not-injected` → `injecting` → `ready` → `capturing` → `ready` (or `error` → `ready`)

### Phase 1.2: Contracts (contracts/)

**N/A for Console-Only MVP** - No API contracts needed. Future backend integration will add REST/GraphQL contracts here.

### Phase 1.3: Quickstart (quickstart.md)

**Developer Onboarding Content**:
1. Prerequisites (Node.js 20, Chrome Developer Mode)
2. Installation (`npm install`, `npm run build`)
3. Loading extension in Chrome
4. Testing button injection (navigate to x.com timeline)
5. Triggering capture (click Yoink button, inspect console output)
6. Running tests (`npm run test` for smoke tests)
7. Development workflow (`npm run watch` for auto-rebuild)

### Phase 1.4: Agent Context Update

Run `.specify/scripts/bash/update-agent-context.sh` to add:
- TypeScript strict mode patterns for DOM manipulation
- @crxjs/vite-plugin button injection best practices
- Vitest fixture-based testing for extractors
- Chrome Extension content script event handling

## Phase 2: Implementation Planning (to be completed by /speckit.tasks)

Phase 2 task breakdown will be generated by the `/speckit.tasks` command, which will:
- Decompose 20 functional requirements into actionable tasks
- Sequence tasks by dependency (button injection → extraction → logging)
- Map tasks to 4 user stories (P1, P1, P2, P3)
- Define acceptance tests per task
- Estimate complexity and implementation order

**Not included in this plan** - See tasks.md after running `/speckit.tasks`

## Next Steps

1. **Phase 0**: Generate `research.md` by running research agents for unknowns above
2. **Phase 1**: Generate `data-model.md` with entity definitions and validation rules
3. **Phase 1**: Generate `quickstart.md` with developer onboarding guide
4. **Phase 1**: Update agent context with TypeScript/Chrome Extension patterns
5. **Phase 2**: Run `/speckit.tasks` to generate implementation task breakdown
