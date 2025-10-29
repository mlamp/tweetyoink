# Implementation Plan: Server Response Overlay Display

**Branch**: `004-response-overlay` | **Date**: 2025-10-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-response-overlay/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Display server responses in an attractive overlay on the Twitter/X page after users click the Yoink button. The overlay will parse JSON arrays containing content items with `{type: "text", content: "..."}` structure and render them vertically stacked. Users can dismiss the overlay via close button, clicking outside, or ESC key. The feature supports both synchronous and asynchronous (polling-based) responses.

## Technical Context

**Language/Version**: TypeScript 5.3 with strict mode
**Primary Dependencies**: Existing Chrome Extension APIs (no new dependencies required)
**Storage**: N/A (ephemeral overlay state, no persistence)
**Testing**: Vitest (existing in project)
**Target Platform**: Chrome Extension Manifest V3 (service worker + content script architecture)
**Project Type**: Single Chrome Extension project
**Performance Goals**: <200ms overlay render time, stable at 1000px/sec scroll speed
**Constraints**: <100KB JavaScript bundle addition, no external CSS frameworks
**Scale/Scope**: Handle up to 50 content items per response, 320px-3840px viewports

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Core Principles Alignment

✅ **I. Separation of Concerns**
- Extension-only implementation (no server changes)
- Server response format documented in contracts
- No coupling to specific backend

✅ **II. LLM-First Data Structure**
- Overlay displays JSON-structured responses from server
- No DOM parsing required for this feature
- Structured content items with type/content fields

✅ **III. User Control & Privacy**
- Overlay only displays after explicit user action (Yoink button)
- User controls dismissal
- No automatic captures or background operations

✅ **IV. TypeScript-First Development**
- All code will be TypeScript with strict mode
- Interfaces defined for content items and overlay state
- Chrome API interactions properly typed

✅ **V. Defensive DOM Extraction**
- Overlay injection uses defensive DOM insertion
- Cleanup on navigation prevents DOM leaks
- Graceful degradation if overlay injection fails

### Architecture Standards Compliance

✅ **Technology Stack**: TypeScript 5.3, Vite, Manifest V3
✅ **Repository Structure**: Follows existing `src/` organization
✅ **Testing Framework**: Vitest available (tests optional per constitution)
✅ **No New Dependencies**: Uses native CSS and vanilla DOM APIs

### Functional Requirements Coverage

✅ **FR-1 Tweet Capture**: No changes (extension already captures tweets)
✅ **FR-2 Reply Box Context**: No changes
✅ **FR-4 Backend Configuration**: No changes
✅ **FR-6 Error Handling**: Enhanced (overlay adds success visualization)
➕ **New: Response Visualization**: Overlay displays server responses

**GATE RESULT**: ✅ **PASS** - No violations, full alignment with constitution

## Project Structure

### Documentation (this feature)

```text
specs/004-response-overlay/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── response-format.yaml  # Server response schema
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── ui/
│   ├── button-injector.ts         # Existing - Yoink button injection
│   ├── overlay-manager.ts          # NEW - Overlay lifecycle management
│   ├── overlay-renderer.ts         # NEW - Content item rendering
│   └── overlay.css                 # NEW - Overlay styling
├── types/
│   ├── config.ts                   # Existing - Extension types
│   └── overlay.ts                  # NEW - Overlay-specific types
├── services/
│   ├── post-service.ts             # Existing - HTTP POST handling
│   └── response-handler.ts         # NEW - Response parsing & overlay trigger
├── content-script.ts               # Modified - Wire up response handler
└── service-worker.ts               # Modified - Pass responses to content script

tests/  # Optional - only if explicitly requested
└── unit/
    ├── overlay-renderer.test.ts
    └── response-handler.test.ts
```

**Structure Decision**: Single Chrome Extension project following existing architecture. New overlay functionality lives in `src/ui/overlay-*` files. Response handling extracted to `src/services/response-handler.ts`. No new external dependencies required - using native DOM APIs and CSS for overlay implementation.

## Complexity Tracking

No constitution violations - this section intentionally left empty as all gates pass.

## Phase 0: Research & Technical Decisions

### Research Topics

1. **Overlay Positioning Strategy**
   - Decision: Fixed positioning with viewport-relative coords vs absolute positioning relative to tweet
   - Investigate: Scroll behavior implications, Twitter's dynamic DOM updates
   - Best Practice: Review how other extensions handle overlays on Twitter/X

2. **CSS Architecture**
   - Decision: Inline styles vs CSS file vs CSS-in-JS
   - Constraint: No external CSS frameworks (constitution requirement)
   - Best Practice: CSS scoping techniques to avoid Twitter/X style conflicts

3. **Content Sanitization**
   - Decision: How to safely render user-provided text content
   - Security: XSS prevention for server-provided content
   - Best Practice: DOMPurify vs native sanitization APIs

4. **Event Handling**
   - Decision: Click outside detection mechanism
   - Constraint: Must not interfere with Twitter/X functionality
   - Best Practice: Event delegation patterns for overlay interactions

5. **State Management**
   - Decision: Single overlay instance vs multiple overlays per tweet
   - Constraint: What happens when user clicks Yoink on second tweet while first overlay open?
   - Best Practice: Overlay lifecycle and cleanup patterns

### Research Deliverable

Document in `research.md`:
- Chosen overlay positioning strategy with rationale
- CSS architecture decision and scoping approach
- Sanitization method for server content
- Event handling pattern for dismissal
- State management approach for multiple overlays
- Performance considerations for large content arrays
- Mobile/responsive design approach

## Phase 1: Design & Contracts

### Data Model (`data-model.md`)

**Core Entities:**

1. **ResponseContentItem** (from server)
   - `type: string` - Content type identifier
   - `content: string` - Display content
   - `metadata?: Record<string, unknown>` - Optional metadata

2. **OverlayState** (client-side)
   - `isVisible: boolean`
   - `contentItems: ResponseContentItem[]`
   - `associatedTweetId: string`
   - `position: { x: number, y: number }`

3. **OverlayConfig**
   - `maxItems: number` - Performance limit
   - `maxContentLength: number` - Truncation threshold
   - `animationDuration: number` - Show/hide animation timing

### API Contracts (`contracts/response-format.yaml`)

**Server Response Format** (existing, documenting for clarity):

```yaml
openapi: 3.0.0
info:
  title: TweetYoink Server Response Format
  version: 1.0.0

components:
  schemas:
    ResponseContentItem:
      type: object
      required:
        - type
        - content
      properties:
        type:
          type: string
          enum: [text, image, link, unknown]
          description: Content type identifier
        content:
          type: string
          description: Content payload (text string, URL, etc.)
        metadata:
          type: object
          additionalProperties: true
          description: Optional metadata

    PostResponse:
      oneOf:
        - $ref: '#/components/schemas/SyncResponse'
        - $ref: '#/components/schemas/AsyncResponse'
        - $ref: '#/components/schemas/ErrorResponse'

    SyncResponse:
      type: object
      required:
        - status
        - result
      properties:
        status:
          type: string
          enum: [completed]
        result:
          oneOf:
            - type: array
              items:
                $ref: '#/components/schemas/ResponseContentItem'
            - type: object
              description: Legacy format (convert to array)

    AsyncResponse:
      type: object
      required:
        - status
        - requestId
      properties:
        status:
          type: string
          enum: [pending, processing]
        requestId:
          type: string
        estimatedDuration:
          type: number
```

### Quickstart (`quickstart.md`)

Developer guide covering:
1. How to modify test server to return content items
2. How to test overlay with sync responses
3. How to test overlay with async responses
4. How to test edge cases (empty, large content)
5. How to debug overlay positioning issues

### Agent Context Update

Run: `.specify/scripts/bash/update-agent-context.sh claude`

Add to CLAUDE.md:
- Overlay management system (`src/ui/overlay-manager.ts`, `src/ui/overlay-renderer.ts`)
- Response content item handling
- CSS scoping strategy (to be determined in research)
- Event handling patterns for overlay dismissal

## Phase 1 Post-Design Constitution Check

*Re-evaluate after design artifacts created*

✅ **Separation of Concerns**: Server format documented, no server changes
✅ **TypeScript-First**: All new interfaces defined in `src/types/overlay.ts`
✅ **Defensive DOM**: Overlay injection includes error handling and cleanup
✅ **User Control**: Overlay only appears after user action, user controls dismissal

**GATE RESULT**: ✅ **PASS** - Design maintains constitution alignment

## Next Steps

After this planning phase:

1. **Phase 0 Execution**: Research tasks will be dispatched to generate `research.md`
2. **Phase 1 Execution**: Design artifacts (`data-model.md`, `contracts/`, `quickstart.md`) will be created
3. **Agent Context Update**: CLAUDE.md will be updated with new architectural components
4. **Phase 2 Ready**: Run `/speckit.tasks` to generate implementation task breakdown

**Implementation readiness**: After `/speckit.plan` completes, feature will be ready for `/speckit.tasks` to break down into concrete implementation steps.
