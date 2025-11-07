# Project Context

## Purpose

**TweetYoink** is a Chrome extension that captures tweet data from Twitter/X and sends it to a user-configured backend for LLM processing and analysis.

**Core Goals:**
- Enable users to explicitly capture tweets, threads, and replies with a single click
- Extract structured JSON data from Twitter/X DOM (text, author, metrics, timestamps, media)
- Capture user context including draft reply text when composing responses
- Send captured data to user-configured backend URL for custom processing
- Provide visual feedback for capture success/failure
- Maintain high accuracy and stability despite Twitter/X DOM changes

**Key Design Philosophy:** DOM parsing over screenshot extraction for 10x cost efficiency, structured data ideal for LLM processing, and user control over all captures.

## Tech Stack

**Language & Build Tools:**
- TypeScript 5.x with strict mode enabled (no `any` types)
- Vite 5.x with @crxjs/vite-plugin (Chrome extension bundling)
- Node.js 18+ for build scripts

**Platform:**
- Chrome Extension Manifest V3 (service worker architecture)
- Chrome Storage API (`chrome.storage.sync` for settings, `chrome.storage.local` for state)
- @types/chrome for TypeScript definitions

**Testing (optional, when requested):**
- Vitest (unit testing)
- Playwright (E2E testing)

**Tooling:**
- sharp or jimp (icon generation)
- tsx (TypeScript script execution)

**No External Dependencies:**
- No frameworks (React, Vue, etc.) - vanilla TypeScript
- No state management libraries - Chrome Storage API
- No database - user-configured backend handles persistence

## Project Conventions

### Code Style

**TypeScript Guidelines:**
- **Strict mode REQUIRED**: All code must compile with `strict: true`
- **No `any` types**: Avoid except for justified edge cases (document in comments)
- **Type all Chrome API interactions**: Use @types/chrome definitions
- **Define interfaces for all data structures**: `TweetData`, `UserContext`, `CapturePayload`, etc.

**Naming Conventions:**
- **Files**: kebab-case (e.g., `content-script.ts`, `tweet-extractor.ts`)
- **Types/Interfaces**: PascalCase (e.g., `TweetData`, `ExtractorConfig`)
- **Variables/Functions**: camelCase (e.g., `extractTweetData`, `currentUrl`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_CAPTURES_PER_SESSION`)

**Logging Discipline:**
- **ALWAYS use `logger` from `src/utils/logger.ts`** (never `console.*` directly)
- Development mode: All log levels output to console
- Production mode: Only `logger.warn()` and `logger.error()` output (debug/info stripped)
- Code review MUST reject direct `console.*` usage in application code

**File Organization:**
- OpenSpec changes: `openspec/changes/[change-id]/` for proposed changes
- OpenSpec specs: `openspec/specs/[capability]/` for current capabilities
- Source code: Organize by concern in `src/` with clear separation
- No root clutter: Only README.md, LICENSE, config files, and `api-contract.yaml` in root

### Architecture Patterns

**Separation of Concerns:**
- Extension and server are separate repositories with independent lifecycles
- Backend URL is user-configurable (no hardcoded endpoints)
- API contract defined via `api-contract.yaml` (canonical reference)
- No direct coupling between extension and any specific backend implementation

**Defensive DOM Extraction:**
- Primary selectors: `data-testid` attributes (highest stability)
- Fallback selectors: element structure and attributes
- Extraction functions MUST return null on failure (never throw)
- All selector failures logged via `logger.error()` for telemetry
- Confidence scores reflect which selector tier was used

**LLM-First Data Structure:**
- DOM parsing preferred over screenshot-based extraction (10x cost efficiency)
- All extracted data MUST be structured JSON
- Screenshot fallback MAY be implemented for resilience
- Extraction confidence scores included in payloads

**User Control & Privacy:**
- No automatic/background tweet capture (user triggers all captures)
- Backend URL stored in user-accessible settings
- API keys stored securely via Chrome Storage API
- Rate limiting enforced (default: 100 captures/session)
- Clear visual feedback for all capture actions

**API Contract Synchronization:**
- Root contract: `api-contract.yaml` in repository root (canonical reference for backend implementers)
- When OpenSpec change modifies API: root contract MUST be updated in same commit/PR
- Version increments per semantic versioning (MAJOR for breaking, MINOR for additions, PATCH for docs)
- Root contract is single source of truth; backend developers rely on this file

### Testing Strategy

**Testing is OPTIONAL**: Tests only required when explicitly requested in feature specifications.

**When Tests Are Requested:**

**Test-First Approach:**
1. Write tests BEFORE implementation
2. Verify tests FAIL initially (red)
3. Implement minimal code to pass tests (green)
4. Refactor while keeping tests green

**Test Categories:**
- **Contract Tests**: Backend API compatibility validation
- **Integration Tests**: End-to-end extension workflows
- **Unit Tests**: Extractor functions in isolation

**Quality Gates Before Committing:**
- TypeScript compilation MUST succeed with zero errors
- Linter MUST pass with zero warnings
- Manual smoke test on Twitter/X (capture a tweet successfully)
- No direct `console.*` usage in application code
- API contract synchronization verified (if feature modifies API)

**Quality Gates Before Releasing:**
- All functional requirements validated manually
- Selector health check passes on current Twitter/X version
- Settings persistence verified across browser restarts
- Rate limiting enforced and verified
- Production build only logs errors/warnings (verify console output)
- Root `api-contract.yaml` version matches latest feature contract changes

### Git Workflow

**Branching Strategy:**
- `main` branch: production-ready code
- Feature branches: `###-feature-name` (e.g., `009-async-loading`)
- Use kebab-case for branch names matching feature spec numbers

**Development Commands:**
```bash
npm run build          # Production build (minified, no source maps)
npm run build:dev      # Development build (source maps, readable)
npm run watch          # Auto-rebuild on changes (production mode)
npm run watch:dev      # Auto-rebuild on changes (development mode)
npm run type-check     # TypeScript validation
```

**Development vs Production Builds:**
- **Development** (`npm run build:dev`): Source maps enabled, no minification, readable chunk names
- **Production** (`npm run build`): No source maps, full minification, hashed chunk names

**Extension Loading:**
1. Run `npm run build:dev` (for source maps) or `npm run build` (optimized)
2. Open `chrome://extensions` in Chrome
3. Enable "Developer mode" (top right toggle)
4. Click "Load unpacked" and select `dist/` folder

**Recommended Development Workflow:**
1. Run `npm run watch:dev` (auto-rebuild with source maps)
2. Make code changes in `src/`
3. Reload extension in `chrome://extensions` (↻ button)
4. Refresh Twitter/X page if testing content script
5. Total iteration time should be <30 seconds

## Domain Context

**Chrome Extension Development:**
- **Manifest V3 architecture**: Service worker instead of background page
- **Content script injection**: Runs in Twitter/X page context for DOM access
- **Message passing**: chrome.runtime.sendMessage for content ↔ service worker communication
- **Storage API**: chrome.storage.sync for settings (synced across devices), chrome.storage.local for ephemeral state
- **Debugging**: Service worker (click link in chrome://extensions), Content script (F12 on page), Popup (right-click → Inspect)

**Twitter/X DOM Extraction:**
- Twitter/X DOM changes frequently (2-4 week update cycle observed)
- Critical selectors: `[data-testid="tweet"]`, `[data-testid="tweetText"]`, `[data-testid="User-Names"]`, `[data-testid="tweetTextarea_0"]`
- Selector health check runs on extension load
- Fallback selectors activate immediately on failure
- Target 48-hour turnaround for selector updates after Twitter/X changes

**LLM Processing Context:**
- Structured JSON preferred for LLM consumption (vs unstructured screenshots)
- Extraction includes: tweet text, author data, metrics (likes/retweets/replies), timestamps, media references, thread context
- User context captured: draft reply text, URL, timestamp
- Backend receives JSON payload matching `api-contract.yaml` specification

**All extension logs use prefixes:**
- `[TweetYoink Service Worker]`
- `[TweetYoink Content Script]`
- `[TweetYoink Popup]`

## Important Constraints

### Constitutional Principles

These principles govern all development decisions and MUST be followed:

**1. Separation of Concerns**
- Extension and server MUST be separate repositories with independent lifecycles
- Backend URL MUST be user-configurable (no hardcoded endpoints)
- API contract defined via `api-contract.yaml` (canonical reference)
- Flexibility for users to implement custom backends in any language

**2. LLM-First Data Structure**
- DOM parsing MUST be preferred over screenshot extraction (10x cost efficiency: $0.10 vs $2.00 per 1000 tweets)
- All extracted data MUST be structured JSON ideal for LLM processing
- Extraction confidence scores MUST be included in payloads
- Trade-off accepted: Higher maintenance burden (2-4 week Twitter update cycle) vs screenshot stability

**3. User Control & Privacy**
- User MUST explicitly trigger all captures (no automatic/background capture)
- Backend URL stored in user-accessible settings
- API keys stored securely via Chrome Storage API
- Rate limiting enforced (default: 100 captures/session)
- Clear visual feedback for all capture actions

**4. TypeScript-First Development**
- All code MUST be TypeScript 5.x with strict mode enabled (`strict: true` in tsconfig.json)
- No `any` types except for justified edge cases (document in code comments)
- All Chrome API interactions MUST have proper type definitions
- Interfaces defined for all data structures (TweetData, UserContext, CapturePayload)

**5. Defensive DOM Extraction**
- Primary selectors: `data-testid` attributes (highest stability)
- Fallback selectors: element structure and attributes (graceful degradation)
- Extraction functions MUST return null on failure (never throw exceptions)
- All selector failures MUST be logged via `logger.error()` for monitoring
- Confidence scores MUST reflect which selector tier was used
- Target 48-hour turnaround for selector updates after Twitter/X DOM changes

**6. Logging Discipline**
- ALL code MUST use `logger` from `src/utils/logger.ts` (never `console.*` directly)
- Development mode: All log levels output (`logger.log()`, `logger.debug()`, `logger.info()`, `logger.warn()`, `logger.error()`)
- Production mode: Only `logger.warn()` and `logger.error()` output (debug/info stripped from bundle)
- Exception: Build-time logging (e.g., Vite config) may use console directly
- Code review MUST reject direct `console.*` usage in application code

**7. API Contract Synchronization**
- Root `api-contract.yaml` is the canonical reference for backend developers
- When ANY OpenSpec change modifies API request/response schemas, root contract MUST be updated
- Version number in root contract MUST increment per semantic versioning:
  - MAJOR (X.0.0): Breaking changes (removed fields, changed types)
  - MINOR (x.Y.0): Backward compatible additions (new optional fields)
  - PATCH (x.y.Z): Clarifications, documentation updates
- Update MUST occur in same commit as implementation or immediate follow-up
- Code review MUST verify root contract updated when change modifies API surface

**Technical Constraints:**
- Chrome Extension Manifest V3 required (V2 deprecated)
- Service worker limitations (no DOM access, message passing required)
- Chrome Storage API quotas (sync: 100KB, local: 10MB)
- Content Security Policy restrictions (no inline scripts, no eval)
- Twitter/X rate limiting and anti-scraping measures (user-triggered captures only)

**Privacy & Security Constraints:**
- No automatic/background capture (user consent required)
- API keys stored securely (Chrome Storage API encrypted at rest)
- No telemetry without user consent
- Clear data flow transparency (user controls backend destination)

**Complexity Constraints:**
- Default to <100 lines of new code per feature
- Single-file implementations until proven insufficient
- Avoid frameworks without clear justification
- Choose boring, proven patterns
- Only add complexity with: performance data, concrete scale requirements, or multiple proven use cases

## External Dependencies

**Chrome Extension APIs:**
- `chrome.storage.sync`: User settings (backend URL, API keys)
- `chrome.storage.local`: Ephemeral state (request tracker, rate limit counters)
- `chrome.runtime`: Message passing, extension lifecycle events
- `chrome.tabs`: Tab management and URL tracking
- `chrome.scripting`: Content script injection (Manifest V3)

**User-Configured Backend:**
- **Contract**: Defined in `api-contract.yaml` (root, canonical reference)
- **Purpose**: Receives captured tweet data as JSON payload
- **Protocol**: HTTPS POST with optional API key authentication
- **Response Format**: JSON with `status`, `title`, `content`, `type` fields
- **User Control**: Backend URL fully configurable by user (no hardcoded endpoints)
- **Language Agnostic**: Any backend (Python, Go, Rust, Node.js, etc.) can implement contract

**Twitter/X Platform:**
- **DOM Structure**: Subject to frequent changes (2-4 week update cycle)
- **Selectors**: Primary via `data-testid` attributes, fallbacks via structure
- **No Official API**: Extension relies on client-side DOM parsing only
- **Rate Limiting**: User-triggered captures only (no background scraping)

**Build-Time Dependencies:**
- Vite 5.x with @crxjs/vite-plugin for Chrome extension bundling
- TypeScript compiler for type checking and transpilation
- sharp or jimp for icon generation (16x16, 48x48, 128x128)
- tsx for executing TypeScript scripts (e.g., packaging)

**Development Tools:**
- Chrome DevTools for debugging (service worker, content script, popup)
- Source maps (development builds only) for readable stack traces
- Vitest/Playwright (optional, when tests requested)
