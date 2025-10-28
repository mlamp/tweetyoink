# Implementation Plan: Configuration Settings & POST Endpoint

**Branch**: `003-config-endpoint` | **Date**: 2025-10-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-config-endpoint/spec.md`

## Summary

Add extension configuration UI where users can specify a POST endpoint URL for captured tweet data. Extension will send JSON payloads to the configured endpoint and log responses to the console. Supports both synchronous and asynchronous (polling-based) responses for long-running operations like LLM processing. Uses Chrome permissions API for secure domain access.

## Technical Context

**Language/Version**: TypeScript 5.x (existing project standard)
**Primary Dependencies**:
- Chrome Extension APIs: `chrome.storage.sync`, `chrome.permissions`, `chrome.runtime`
- Existing extractors from 002-post-view-yoink feature

**Storage**: `chrome.storage.sync` for user configuration, `chrome.storage.local` for request tracker state
**Testing**: Vitest (existing project standard)
**Target Platform**: Chrome Extension Manifest V3
**Project Type**: Chrome Extension (single project structure)
**Performance Goals**:
- Settings save < 1 second
- POST request timeout: 30 seconds
- Polling interval: 2-5 seconds
- Max concurrent async requests: 10+

**Constraints**:
- Chrome extension permission model (must request host permissions per domain)
- Service worker lifecycle (must persist polling state for browser restart)
- Chrome storage API limits (sync: 100KB total, 8KB per item)

**Scale/Scope**:
- Single settings page (options.html)
- 2-3 new modules (config service, POST service, polling service)
- Integration with existing Yoink button handler

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Core Principles Alignment

**✅ I. Separation of Concerns**
- Backend URL is user-configurable ✓
- No direct coupling to specific backend implementation ✓
- API contract defined by async response format (requestId pattern) ✓

**✅ II. LLM-First Data Structure**
- Uses existing structured JSON from DOM extraction ✓
- No changes to extraction logic ✓
- Async polling supports LLM processing workflows ✓

**✅ III. User Control & Privacy**
- User explicitly configures endpoint ✓
- Permission prompts for domain access ✓
- Settings stored securely in Chrome storage ✓
- Clear visual feedback for all operations ✓

**✅ IV. TypeScript-First Development**
- All new code in TypeScript with strict mode ✓
- Interfaces for Config, AsyncRequest, PollingState ✓
- Type-safe Chrome API usage ✓

**✅ V. Defensive DOM Extraction**
- No changes to existing extraction logic ✓
- Maintains existing defensive patterns ✓

### Architecture Standards Compliance

**✅ Technology Stack Requirements**
- TypeScript 5.x with strict mode ✓
- Vite build tool (existing) ✓
- Manifest V3 service worker architecture ✓
- Vitest for testing (if tests requested) ✓

**✅ Repository Structure**
- New code in `src/services/` and `src/options/` ✓
- Follows existing patterns from 002 feature ✓
- Feature docs in `specs/003-config-endpoint/` ✓

**✅ Functional Requirements**
- FR-4 (Backend Configuration) directly addressed ✓
- Enhances FR-1 (Tweet Capture) with configurable destination ✓
- No conflicts with existing features ✓

### Quality Gates

**Before Implementation:**
- ✅ TypeScript types defined for all entities
- ✅ Chrome permissions strategy documented
- ✅ Polling state persistence strategy documented

**Before Release:**
- Settings persistence across browser restarts ✓ (must verify)
- Permission prompts work correctly ✓ (must verify)
- Async polling resumes after restart ✓ (must verify)
- No data loss in Chrome storage ✓ (must verify)

### Constitution Compliance Result

**Status**: ✅ PASS - No violations, no complexity justification needed

All core principles and architecture standards are satisfied. This feature enhances existing functionality without introducing architectural deviations.

## Project Structure

### Documentation (this feature)

```text
specs/003-config-endpoint/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── async-response-api.yaml  # OpenAPI spec for async response format
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── types/
│   ├── tweet-data.ts        # Existing
│   └── config.ts            # NEW: Configuration and request tracker types
├── extractors/              # Existing - no changes
├── services/                # NEW directory
│   ├── config-service.ts    # NEW: Settings read/write with chrome.storage
│   ├── post-service.ts      # NEW: HTTP POST with timeout handling
│   └── polling-service.ts   # NEW: Async request polling management
├── options/                 # NEW directory
│   ├── options.html         # NEW: Settings page UI
│   ├── options.ts           # NEW: Settings page logic
│   └── options.css          # NEW: Settings page styles
├── content-script.ts        # MODIFIED: Integrate POST service with Yoink button
└── ui/
    ├── button-injector.ts   # Existing - no changes
    └── yoink-button.ts      # MODIFIED: Loading state during POST/polling

public/
└── manifest.json            # MODIFIED: Add options_page, optional_host_permissions

tests/                       # Tests only if explicitly requested
├── contract/
│   └── async-response.test.ts   # Validate async response format handling
├── integration/
│   └── config-flow.test.ts      # End-to-end settings + POST flow
└── unit/
    ├── config-service.test.ts   # Storage operations
    ├── post-service.test.ts     # HTTP requests with mocks
    └── polling-service.test.ts  # Polling logic with mocks
```

**Structure Decision**: Single project structure (Chrome Extension). New functionality integrated into existing `src/` directory following patterns from 002-post-view-yoink feature. Settings UI in new `src/options/` directory, backend services in new `src/services/` directory.

## Complexity Tracking

No violations - this section intentionally left empty per constitution compliance.
---

## Phase Completion Status

### ✅ Phase 0: Research (Complete)
- **Output**: `research.md`
- **Key Findings**:
  - Chrome permissions API strategy (optional_host_permissions + runtime request)
  - Storage architecture (sync for config, local for operational data, session for sensitive)
  - Service worker lifecycle patterns with chrome.alarms
  - HTTP request handling with AbortSignal.timeout
  - Options page integration patterns

### ✅ Phase 1: Design & Contracts (Complete)
- **Outputs**:
  - `data-model.md` - 6 entities with TypeScript interfaces
  - `contracts/async-response-api.yaml` - OpenAPI 3.0 spec
  - `quickstart.md` - Developer implementation guide
  - `CLAUDE.md` - Updated agent context

- **Key Entities**:
  1. ExtensionConfig - User preferences (chrome.storage.sync)
  2. CustomHeaders - Auth headers (chrome.storage.local)
  3. PollableRequest - Async request tracking
  4. PostResponse - Discriminated union for sync/async
  5. PollingStatusResponse - Status endpoint format
  6. PermissionState - Host permission tracking

- **API Contract**:
  - POST /tweets - Receive tweet data (sync or async response)
  - GET /status/{requestId} - Poll async request status

### 🔄 Phase 2: Task Breakdown (Not Yet Started)
Run `/speckit.tasks` to generate implementation task breakdown.

---

## Implementation Readiness

**Status**: ✅ Ready for `/speckit.tasks`

All planning artifacts complete:
- Technical unknowns researched and resolved
- Data model with TypeScript types defined
- API contract specified (OpenAPI 3.0)
- Developer quickstart guide with code examples
- Constitution compliance verified (no violations)

**Estimated Effort**: 6-8 hours for P1-P2 (core), +4 hours for P3 (headers + async polling)

**Next Command**: `/speckit.tasks` to generate task breakdown from this plan.
