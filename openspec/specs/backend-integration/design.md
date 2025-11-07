# Backend Integration - Technical Design

## Context

Backend integration enables users to send captured tweet data to their own processing systems via configurable HTTP endpoints. The implementation must support both synchronous responses (immediate processing) and asynchronous responses (long-running operations like LLM analysis) while maintaining security through Chrome's permission model.

## Goals / Non-Goals

**Goals:**
- User-configurable POST endpoint with secure storage
- Support synchronous (immediate) and asynchronous (polling-based) responses
- Persist polling state across browser restarts
- Handle multiple concurrent async requests (10+)
- Graceful error handling with console logging

**Non-Goals:**
- Built-in backend implementation (user provides their own)
- Response visualization beyond console logging (handled by response-display capability)
- Data transformation or preprocessing
- Webhook or push notification support

## Decisions

### Decision: Storage Strategy

**Approach:**
- `chrome.storage.sync` for user configuration (endpoint URL, headers, polling settings)
- `chrome.storage.local` for request tracker state (active async requests)

**Alternatives Considered:**
1. **Single storage mechanism** - Rejected: Sync storage has 100KB limit, request state can exceed this
2. **IndexedDB for request tracking** - Rejected: Unnecessary complexity, local storage sufficient
3. **In-memory only** - Rejected: Cannot survive browser restarts

**Rationale:** Sync storage keeps settings synchronized across devices. Local storage handles larger request state without affecting sync quota.

### Decision: Async Response Pattern

**Approach:** Detect async pattern via response structure:
```json
{
  "requestId": "uuid-here",
  "status": "pending",
  "statusUrl": "/status/{requestId}" // optional
}
```

**Polling Logic:**
1. Initial POST receives requestId + status "pending"
2. Extension begins polling GET requests to status endpoint
3. Poll every 2-5 seconds (exponential backoff optional)
4. Stop when status is "completed", "failed", or timeout (5 minutes)

**Alternatives Considered:**
1. **WebSocket for real-time updates** - Rejected: Adds complexity, requires server support
2. **Server-sent events (SSE)** - Rejected: Chrome extension service worker limitations
3. **Webhook callbacks** - Rejected: Extension cannot receive external HTTP requests

**Rationale:** Polling is simple, reliable, and works with any HTTP backend. 5-minute timeout prevents infinite polling.

### Decision: Permission Management

**Approach:** Use `chrome.permissions.request()` API with host permissions:
- When user configures new endpoint domain, prompt for host permission
- Store granted permissions persistently
- Only request permission once per domain
- If permission denied, display clear error message

**Manifest Configuration:**
```json
{
  "optional_host_permissions": ["*://*/*"]
}
```

**Alternatives Considered:**
1. **Hardcoded host permissions** - Rejected: Cannot predict user endpoints
2. **No permission checks** - Rejected: Chrome will block requests without permissions
3. **Wildcard permission upfront** - Rejected: Poor security practice, scary for users

**Rationale:** Optional host permissions let users grant access only to their specific domains. Better security and user trust.

### Decision: Request Tracker Architecture

**Approach:** Service worker maintains RequestTracker class:
```typescript
interface AsyncRequest {
  requestId: string;
  tweetData: TweetData;
  startTime: number;
  statusUrl: string;
  pollCount: number;
  lastStatus: string;
}

class RequestTracker {
  private requests: Map<string, AsyncRequest>;

  async addRequest(request: AsyncRequest): Promise<void>;
  async getActiveRequests(): Promise<AsyncRequest[]>;
  async updateRequest(requestId: string, status: string): Promise<void>;
  async removeRequest(requestId: string): Promise<void>;
  async persist(): Promise<void>; // Save to chrome.storage.local
  async restore(): Promise<void>; // Load from chrome.storage.local
}
```

**Persistence:** Save to local storage after each update, restore on service worker startup.

**Alternatives Considered:**
1. **Global state only** - Rejected: Lost on service worker restarts
2. **Immediate persistence per operation** - Rejected: Too many storage writes, performance impact
3. **Periodic batch saves** - Rejected: Risk of data loss between saves

**Rationale:** Map provides fast lookups by requestId. Persist after updates ensures minimal data loss while avoiding excessive storage operations.

### Decision: Settings UI Implementation

**Approach:** Dedicated options page (options.html) with form-based configuration:
- Endpoint URL input with validation
- Custom headers (key-value pairs, add/remove)
- Status polling endpoint override (optional)
- Test connection button

**File Structure:**
```
src/options/
├── options.html      # Settings page
├── options.ts        # Settings logic
└── options.css       # Minimal styling
```

**Alternatives Considered:**
1. **Popup-based settings** - Rejected: Too cramped for header configuration
2. **Inline editing on Twitter** - Rejected: Poor UX, distracting from content
3. **JSON file configuration** - Rejected: Not user-friendly for non-developers

**Rationale:** Dedicated options page provides space for complex configuration. Follows Chrome extension conventions.

### Decision: Error Handling Strategy

**Approach:** Graceful degradation with comprehensive logging:
- Network errors: Log to console, re-enable button, continue captures
- HTTP errors (4xx/5xx): Log response details, show error feedback
- Timeout: Stop request after 30s (sync) or 5min (async), log timeout message
- Permission denied: Clear error message, disable POST until permission granted

**Never block captures:** All POST failures re-enable Yoink button immediately.

**Alternatives Considered:**
1. **Retry logic** - Deferred: Can add later if needed
2. **Offline queue** - Deferred: Can add later as enhancement
3. **Silent failures** - Rejected: Users need visibility into integration issues

**Rationale:** Partial functionality (console logging) is better than complete failure. Users can debug issues via console logs.

## Risks / Trade-offs

**Risk:** Service worker lifecycle interrupts polling
- **Mitigation:** Persist request state to local storage, resume on restart
- **Trade-off:** Complexity of state management vs reliability

**Risk:** Chrome storage quota exceeded with many concurrent requests
- **Mitigation:** Limit to 10 concurrent requests, clean up completed requests immediately
- **Trade-off:** Request limit vs unlimited concurrency

**Risk:** User configures malicious endpoint
- **Mitigation:** Permission prompts alert user to domain access, no auto-granted permissions
- **Trade-off:** Extra permission step vs security

**Risk:** Polling overwhelms user's backend
- **Mitigation:** Configurable polling interval (default 2-5s), exponential backoff possible
- **Trade-off:** Slower updates vs server load

## Migration Plan

**Phase 1: Synchronous POST (P1-P2)**
1. Create settings UI with endpoint configuration
2. Implement config service with chrome.storage.sync
3. Add POST logic to Yoink button handler
4. Implement permission management
5. Add response logging to console

**Phase 2: Asynchronous Polling (P3)**
1. Create RequestTracker service
2. Detect async response pattern (requestId + status)
3. Implement polling loop in service worker
4. Add state persistence for browser restarts
5. Handle concurrent request tracking

**Rollback:** If critical issues arise, fallback to console-only mode by clearing endpoint configuration.

## Open Questions

None - all architectural questions resolved in design phase.
