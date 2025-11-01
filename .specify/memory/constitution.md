<!--
  SYNC IMPACT REPORT
  ==================
  Version Change: 1.1.0 → 1.2.0

  Modified Principles:
  - New: VII. API Contract Synchronization (Root contract must stay synchronized with feature contracts)

  Added Sections:
  - Principle VII: API Contract Synchronization with implementation rules and rationale

  Removed Sections: None

  Templates Requiring Updates:
  ✅ plan-template.md - Validated: Constitution Check section can reference new contract sync principle
  ✅ spec-template.md - Validated: No changes needed (contract sync is implementation detail)
  ✅ tasks-template.md - Validated: Should include contract update tasks when API changes
  ✅ All templates verified for consistency

  Follow-up TODOs:
  - Future features that modify API contracts MUST include task to update root api-contract.yaml
  - Consider adding automated validation script to check contract synchronization
-->

# TweetYoink Constitution

## Core Principles

### I. Separation of Concerns

**Extension and server MUST be separate repositories with independent lifecycles.**

**Rationale:**
- Different development lifecycles (Chrome Store vs backend deployment)
- Different audiences (frontend vs backend developers)
- Flexibility for users to implement custom backends
- Language-agnostic server implementations (Python, Go, Rust, Node.js, etc.)

**Implementation Rules:**
- Extension repository contains ONLY Chrome extension source code
- Backend URL MUST be user-configurable
- API contract defined via separate specification document
- No direct coupling between extension and any specific backend implementation

### II. LLM-First Data Structure

**DOM parsing MUST be preferred over screenshot-based extraction.**

**Rationale:**
- 10x cost efficiency ($0.10 vs $2.00 per 1000 tweets)
- 95-99% accuracy vs 85-95% with OCR
- Structured JSON ideal for LLM processing
- Perfect metadata preservation

**Trade-offs Accepted:**
- Higher maintenance burden (2-4 week Twitter update cycle) vs screenshot stability
- Mitigation: Defensive coding with fallback selectors, modular extractor architecture

**Implementation Rules:**
- Primary extraction method MUST use DOM selectors
- All extracted data MUST be structured JSON
- Screenshot fallback MAY be implemented for resilience
- Extraction confidence scores MUST be included in payloads

### III. User Control & Privacy

**User MUST explicitly trigger all captures; backend destination MUST be configurable.**

**Rationale:**
- Respects user privacy and intent
- Avoids bulk scraping detection
- Users control where data goes
- Transparent data flow

**Implementation Rules:**
- No automatic/background tweet capture
- Backend URL stored in user-accessible settings
- API keys stored securely (Chrome storage API)
- Rate limiting enforced (default: 100 captures/session)
- Clear visual feedback for all capture actions

### IV. TypeScript-First Development

**All extension code MUST be written in TypeScript with strict type checking.**

**Rationale:**
- Type safety for Chrome APIs
- Catch errors at compile time
- Better refactoring and maintainability
- Superior developer experience

**Implementation Rules:**
- `strict: true` in tsconfig.json
- No `any` types except for justified edge cases (document in code comments)
- All Chrome API interactions MUST have proper type definitions
- Interfaces defined for all data structures (TweetData, UserContext, CapturePayload)

### V. Defensive DOM Extraction

**All DOM extraction MUST include fallback selectors and graceful degradation.**

**Rationale:**
- Twitter/X DOM changes frequently (2-4 week update cycle observed)
- Extension stability critical for user trust
- Graceful degradation better than hard failures

**Implementation Rules:**
- Primary selectors: `data-testid` attributes (highest stability)
- Fallback selectors: element structure and attributes
- Extraction functions MUST return null on failure (never throw)
- All selector failures MUST be logged with telemetry
- Confidence scores MUST reflect which selector tier was used

### VI. Logging Discipline

**All logging MUST use the logger wrapper; production MUST only log errors and warnings.**

**Rationale:**
- Development needs verbose logging for debugging and troubleshooting
- Production builds must minimize console noise and performance overhead
- Critical errors and warnings must be visible in production for user support
- Consistent logging interface prevents direct console usage proliferation

**Implementation Rules:**
- ALL code MUST use `logger` from `src/utils/logger.ts` (never `console.*` directly)
- Development mode (`import.meta.env.DEV === true`):
  - `logger.log()`, `logger.debug()`, `logger.info()` → outputs to console
  - `logger.warn()`, `logger.error()` → outputs to console
- Production mode (`import.meta.env.DEV === false`):
  - `logger.log()`, `logger.debug()`, `logger.info()` → no-op (stripped)
  - `logger.warn()` → outputs to console.warn (visible to users/support)
  - `logger.error()` → outputs to console.error (visible to users/support)
- Exception: Build-time logging (e.g., Vite config) may use console directly
- Code review MUST reject direct `console.*` usage in application code

**Benefits:**
- Clean console in production builds (no debug spam)
- Production errors remain visible for troubleshooting
- Single point of control for future enhancements (e.g., remote error tracking)
- Performance: debug/info logs completely removed from production bundle

### VII. API Contract Synchronization

**Root API contract MUST be updated whenever feature-specific contracts are modified.**

**Rationale:**
- Single source of truth prevents server implementers from seeing inconsistent contract versions
- Root `api-contract.yaml` is the canonical reference for backend developers
- Feature-specific contracts (in `specs/###-feature/contracts/`) are planning artifacts
- Contract drift leads to production errors and support burden
- Synchronization enforces contract versioning discipline

**Implementation Rules:**
- Root contract location: `api-contract.yaml` in repository root
- Feature contracts location: `specs/###-feature/contracts/*.yaml`
- When ANY feature modifies API request/response schemas:
  - Feature contract MUST be created/updated in feature directory
  - Root `api-contract.yaml` MUST be updated to match feature contract changes
  - Version number in root contract MUST increment per semantic versioning rules
  - Update MUST occur in same commit as feature implementation or as immediate follow-up
- Contract versioning (follows semantic versioning):
  - **MAJOR (X.0.0):** Breaking changes (removed fields, changed types, incompatible behavior)
  - **MINOR (x.Y.0):** Backward compatible additions (new optional fields, new types)
  - **PATCH (x.y.Z):** Clarifications, documentation updates, example fixes
- Code review MUST verify root contract updated when feature modifies API surface
- Root contract MUST reference feature number in version changelog/notes

**Contract Synchronization Checklist:**
1. Feature contract created in `specs/###-feature/contracts/`
2. Root `api-contract.yaml` updated with same changes
3. Version number incremented in root contract
4. Changelog/notes added to root contract documenting what changed
5. Both contracts validated for consistency (schema, examples, descriptions)

**Example (Feature 008 - Overlay Enhancements):**
- Feature contract: `specs/008-overlay-enhancements/contracts/response-format-v1.2.yaml`
- Root contract: `api-contract.yaml` updated from v1.1.0 → v1.2.0
- Changes: Added `title` field, added "debug" type, extended `content` to support objects
- Both contracts synchronized, version incremented, changelog updated

## Architecture Standards

### Technology Stack Requirements

**Mandatory:**
- **Language:** TypeScript 5.x with strict mode
- **Build Tool:** Vite with vite-plugin-web-extension
- **Chrome Extension:** Manifest V3 (service worker architecture)
- **Testing Framework:** Choice of Vitest, Jest, or Playwright (if tests requested)
- **Logging:** Custom logger wrapper (`src/utils/logger.ts`)

**Repository Structure:**
```
src/
├── types/          # TypeScript interfaces and types
├── extractors/     # DOM extraction logic with fallbacks
├── utils/
│   └── logger.ts   # Logging wrapper (principle VI)
├── content-script.ts
├── service-worker.ts
└── popup/          # Settings UI

tests/              # Only if tests are requested
├── contract/       # API contract tests
├── integration/    # End-to-end extension tests
└── unit/           # Extractor unit tests

docs/
└── Constitution.md # Original project specification

specs/[###-feature]/   # Feature planning and implementation tracking
├── spec.md            # Feature specification
├── plan.md            # Implementation plan
├── tasks.md           # Task breakdown
├── research.md        # Technical research
├── data-model.md      # Data structures
├── quickstart.md      # Developer onboarding
├── checklists/        # Quality validation checklists
├── contracts/         # Feature-specific API contracts (sync to root)
└── implementation-summary.md  # Post-implementation summary (optional)

api-contract.yaml      # Root API contract (canonical, principle VII)
```

**Implementation Artifact Guidelines:**
- Feature-specific documentation MUST go in `specs/[###-feature]/` directory
- Implementation summaries, success criteria validations, and testing guides belong with their feature specs
- Root directory should only contain project-wide documentation (README.md, LICENSE, etc.)
- **API contracts:** Feature contracts in `specs/###-feature/contracts/`, synchronized to root `api-contract.yaml`

### Functional Requirements

**FR-1: Tweet Capture (P0 - Must Have)**
- User clicks capture button on any tweet
- Extension extracts: text, author, metrics, timestamp, media references
- Data sent to configured backend URL
- Visual confirmation of success/failure

**FR-2: Reply Box Context Capture (P0 - Must Have)**
- Detect reply composition box with content
- Extract draft reply text
- Include in payload as `user_context.draft_reply`
- Verify reply box corresponds to captured tweet

**FR-3: Thread & Reply Selection (P1 - Should Have)**
- User can optionally include parent tweets
- User can select specific replies
- Maximum 20 tweets per capture (safety limit)

**FR-4: Backend Configuration (P0 - Must Have)**
- Settings UI for backend URL and API key
- Connection test functionality
- Secure credential storage
- URL format validation

**FR-5: Visual Feedback (P1 - Should Have)**
- Loading indicators during capture
- Success: green border flash
- Error: red border flash with message
- Rate limit warnings

**FR-6: Error Handling (P0 - Must Have)**
- Retry logic with exponential backoff
- Offline queueing capability
- Clear error messages with actionable guidance
- Graceful degradation on partial extraction failures

## Development Workflow

### Testing Discipline

**Test-First Approach (when tests are requested):**
1. Write tests BEFORE implementation
2. Verify tests FAIL initially (red)
3. Implement minimal code to pass tests (green)
4. Refactor while keeping tests green

**Test Categories:**
- **Contract Tests:** Backend API compatibility (when tests requested)
- **Integration Tests:** End-to-end extension workflows (when tests requested)
- **Unit Tests:** Extractor functions in isolation (when tests requested)

**Testing is OPTIONAL:** Tests are only required when explicitly requested in feature specifications.

### Quality Gates

**Before Committing:**
- TypeScript compilation MUST succeed with zero errors
- Linter MUST pass with zero warnings (configure in .eslintrc)
- Manual smoke test on Twitter/X (capture a tweet successfully)
- No direct `console.*` usage in application code (use `logger` wrapper)
- **API contract synchronization:** If feature modifies API, root `api-contract.yaml` MUST be updated

**Before Releasing:**
- All functional requirements MUST be validated manually
- Selector health check MUST pass on current Twitter/X version
- Settings persistence MUST be verified across browser restarts
- Rate limiting MUST be verified to enforce limits
- Production build MUST only log errors/warnings (verify console output)
- **API contract versioning:** Root contract version MUST match latest feature contract changes

### Selector Maintenance

**Monitoring:**
- Critical selectors tracked: `[data-testid="tweet"]`, `[data-testid="tweetText"]`, `[data-testid="User-Names"]`, `[data-testid="tweetTextarea_0"]`
- Health check runs on extension load
- Selector failures logged to telemetry via `logger.error()`

**Update Cycle:**
1. Extension detects selector failure (via monitoring or user reports)
2. Fallback selectors activated immediately
3. GitHub issue created for primary selector update
4. Development sprint to update selectors (target: 48 hours)
5. New version released via Chrome Web Store

## Governance

### Amendment Process

This constitution MAY be amended when:
1. New core principles emerge from implementation experience
2. Technology constraints change (e.g., Manifest V4 released)
3. Privacy/security requirements evolve

**Amendment Requirements:**
- Document rationale for change
- Update version number per semantic versioning rules
- Update Last Amended date
- Validate all dependent templates remain consistent
- Create migration guide if breaking changes

### Version Semantics

- **MAJOR (X.0.0):** Backward incompatible principle removals/redefinitions
- **MINOR (x.Y.0):** New principle added or materially expanded guidance
- **PATCH (x.y.Z):** Clarifications, wording fixes, non-semantic refinements

### Compliance Verification

**All PRs/reviews MUST:**
- Verify alignment with Core Principles (I-VII)
- Check TypeScript strict mode compliance
- Validate defensive extraction patterns used
- Confirm user control/privacy requirements met
- Verify logger wrapper usage (no direct console usage)
- **Verify API contract synchronization** (if feature modifies API surface)

**Complexity MUST be justified:**
- New dependencies require documented rationale
- Architecture deviations require constitution amendment or explicit exception
- Performance trade-offs documented in code and tracked in constitution

### Runtime Guidance

For implementation-specific guidance beyond this constitution, refer to:
- `docs/Constitution.md` - Original comprehensive project specification
- `api-contract.yaml` - **Canonical API contract** (single source of truth, principle VII)
- `specs/###-feature/contracts/` - Feature-specific contract planning artifacts
- `.specify/templates/` - Feature planning templates

**Version**: 1.2.0 | **Ratified**: 2025-10-23 | **Last Amended**: 2025-11-01
