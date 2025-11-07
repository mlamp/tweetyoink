# Technical Research: Configuration Settings & POST Endpoint

**Feature**: 003-config-endpoint
**Date**: 2025-10-28
**Status**: Complete

## Research Overview

This document consolidates technical research for implementing extension configuration, POST endpoint functionality, and async polling in a Chrome Extension Manifest V3 environment.

## 1. Chrome Permissions Strategy

### Decision: Optional Host Permissions with Runtime Requests

**Rationale**:
- More secure than blanket permissions
- Users trust extensions that request minimal permissions
- Allows dynamic endpoint configuration without republishing
- Chrome's permission prompts are clear and user-friendly

**Implementation Pattern**:
```typescript
// manifest.json
{
  "optional_host_permissions": ["https://*/*", "http://*/*"]
}

// Request permission when user configures endpoint
async function requestEndpointPermission(url: string): Promise<boolean> {
  const parsedUrl = new URL(url);
  const origin = `${parsedUrl.protocol}//${parsedUrl.hostname}/*`;

  return await chrome.permissions.request({ origins: [origin] });
}
```

**Alternatives Considered**:
- `host_permissions` (static): Rejected - too broad, reduces user trust
- Backend proxy: Rejected - adds complexity, defeats purpose of user-configurable endpoint

### Permissions Persistence

**Finding**: Permissions persist across browser restarts and extension updates, but historical bugs (Issue 310815) suggest defensive checking on startup.

**Best Practice**:
```typescript
chrome.runtime.onStartup.addListener(async () => {
  const config = await getConfig();
  if (config.endpointUrl) {
    const hasPermission = await chrome.permissions.contains({
      origins: [new URL(config.endpointUrl).origin + '/*']
    });

    if (!hasPermission) {
      await chrome.storage.local.set({ permissionsLost: true });
    }
  }
});
```

## 2. Storage Architecture

### Decision: Hybrid Storage Strategy

**chrome.storage.sync** for user preferences:
- Endpoint URL
- Polling endpoint pattern
- Auto-capture settings
- Limit: 100KB total, 8KB per item

**chrome.storage.local** for operational data:
- Custom headers (may include long auth tokens)
- Active polling requests tracker
- Permission flags
- Limit: 5.2MB (unlimited with permission)

**chrome.storage.session** for sensitive temporary data:
- API keys during active session
- Cleared on browser close
- 1MB limit

**Rationale**:
- Sync storage enables cross-device settings
- Local storage handles larger data and faster writes
- Session storage for security-sensitive ephemeral data

**Implementation Pattern**:
```typescript
interface StorageSchema {
  sync: {
    endpointUrl: string;
    pollingEndpointPattern: string;
    pollingIntervalSeconds: number;
  };
  local: {
    customHeaders: Array<{key: string; value: string}>;
    activeRequests: RequestTracker[];
    permissionsLost: boolean;
  };
  session: {
    apiKey?: string;
  };
}

async function getConfig(): Promise<Config> {
  const [sync, local, session] = await Promise.all([
    chrome.storage.sync.get(defaultSyncConfig),
    chrome.storage.local.get(defaultLocalConfig),
    chrome.storage.session.get(['apiKey'])
  ]);

  return { ...sync, ...local, ...session };
}
```

### Sensitive Data Handling

**Decision**: Use chrome.storage.session for API keys

**Rationale**:
- chrome.storage is NOT encrypted at rest
- Session storage cleared on browser close provides reasonable security
- Encryption adds complexity without significant security gain for extension use case
- User can secure their device with OS-level encryption

**Alternative**: If user needs persistent API key, use Web Crypto API with user password:
```typescript
// Only if explicitly requested by user
async function storeEncryptedApiKey(apiKey: string, userPassword: string) {
  const encrypted = await encryptWithPassword(apiKey, userPassword);
  await chrome.storage.local.set({ encryptedApiKey: encrypted });
}
```

## 3. Service Worker Lifecycle Management

### Decision: chrome.alarms for Polling with Storage-Backed State

**Key Constraints**:
- Service workers terminate after ~30 seconds idle
- Global variables lost on termination
- chrome.alarms minimum interval: 30 seconds
- Alarms MAY be cleared on restart (check on startup)

**Implementation Pattern**:
```typescript
const POLLING_ALARM = 'tweetyoink-polling-check';

async function startPolling(intervalSeconds: number) {
  await chrome.alarms.create(POLLING_ALARM, {
    delayInMinutes: Math.max(intervalSeconds / 60, 0.5),
    periodInMinutes: Math.max(intervalSeconds / 60, 0.5)
  });

  await chrome.storage.local.set({
    pollingActive: true,
    pollingStarted: Date.now()
  });
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === POLLING_ALARM) {
    await checkPendingRequests();
  }
});

chrome.runtime.onStartup.addListener(async () => {
  const alarm = await chrome.alarms.get(POLLING_ALARM);
  const { pollingActive, pollingIntervalSeconds } = await chrome.storage.local.get({
    pollingActive: false,
    pollingIntervalSeconds: 5
  });

  if (pollingActive && !alarm) {
    console.log('[Polling] Recreating lost alarm');
    await startPolling(pollingIntervalSeconds);
  }
});
```

**Rationale**:
- Alarms survive service worker termination
- Storage provides durable state
- Check on startup handles browser restart
- No need for long-running service worker

**Alternatives Considered**:
- setTimeout: Rejected - lost on service worker termination
- Native messaging: Rejected - overkill for simple polling

### Polling State Persistence

**Decision**: Store active requests in chrome.storage.local

```typescript
interface PollableRequest {
  requestId: string;
  tweetData: TweetData;
  startTime: number;
  lastPollTime: number;
  pollCount: number;
  status: 'pending' | 'polling' | 'completed' | 'failed' | 'timeout';
}

async function trackRequest(request: PollableRequest) {
  const { activeRequests = [] } = await chrome.storage.local.get('activeRequests');
  activeRequests.push(request);
  await chrome.storage.local.set({ activeRequests });
}

async function updateRequestStatus(requestId: string, updates: Partial<PollableRequest>) {
  const { activeRequests = [] } = await chrome.storage.local.get('activeRequests');
  const index = activeRequests.findIndex(r => r.requestId === requestId);

  if (index >= 0) {
    activeRequests[index] = { ...activeRequests[index], ...updates };
    await chrome.storage.local.set({ activeRequests });
  }
}
```

**Rationale**:
- Survives service worker and browser restarts
- Enables polling resume after crashes
- Simple query/update patterns
- chrome.storage.local has sufficient capacity

## 4. HTTP Request Handling

### Decision: Service Worker for POST, AbortSignal for Timeout

**Pattern**:
```typescript
async function postToEndpoint(
  url: string,
  data: unknown,
  headers: Record<string, string> = {},
  timeoutMs = 30000
): Promise<Response> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(timeoutMs)
    });

    if (!response.ok) {
      throw new HttpError(response.status, response.statusText);
    }

    return response;
  } catch (error) {
    if (error.name === 'TimeoutError') {
      throw new TimeoutError(`Request timed out after ${timeoutMs}ms`);
    }
    if (error.name === 'TypeError') {
      throw new NetworkError('Network request failed - check connection');
    }
    throw error;
  }
}
```

**Rationale**:
- Service workers bypass CORS (with proper permissions)
- AbortSignal.timeout is native, performant, well-supported
- Typed errors enable specific user feedback
- 30-second timeout balances responsiveness with server processing time

**Alternatives Considered**:
- Content script + message passing: Rejected - adds unnecessary complexity
- Manual AbortController: Rejected - AbortSignal.timeout is simpler
- Longer timeout: Rejected - async polling handles long operations

### Error Handling Strategy

**Decision**: Typed error classes with retry logic for transient failures

```typescript
class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(`HTTP ${status}: ${message}`);
    this.name = 'HttpError';
  }
}

class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

async function postWithRetry(url: string, data: unknown, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await postToEndpoint(url, data);
    } catch (error) {
      if (error instanceof HttpError && error.status < 500) {
        throw error; // Don't retry client errors
      }

      if (attempt < maxRetries && (error instanceof NetworkError || error instanceof TimeoutError)) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      throw error;
    }
  }
}
```

**Rationale**:
- Typed errors enable specific user feedback
- Retry transient errors (network, timeout, 5xx)
- Don't retry permanent errors (4xx)
- Exponential backoff prevents thundering herd

## 5. Options Page Architecture

### Decision: options_ui with open_in_tab: false

**Configuration**:
```json
{
  "options_ui": {
    "page": "options.html",
    "open_in_tab": false
  }
}
```

**Rationale**:
- Embedded experience feels integrated
- Less disruptive to user workflow
- Consistent with modern extension UX
- Can always open chrome://extensions for full tab if needed

**Layout**:
```
options.html (UI structure)
  ├── Endpoint Configuration section
  │   ├── URL input with validation
  │   ├── Polling endpoint pattern input
  │   └── Test connection button
  ├── Permission Management section
  │   ├── Permission status indicator
  │   └── Grant permission button
  ├── Custom Headers section (P3)
  │   └── Key-value pairs interface
  └── Save/Reset buttons
```

### Options ↔ Service Worker Communication

**Decision**: Hybrid approach using chrome.runtime.sendMessage + chrome.storage.onChanged

**For immediate operations** (test connection):
```typescript
// options.ts
const response = await chrome.runtime.sendMessage({
  type: 'TEST_ENDPOINT',
  url: endpointUrl
});

// service-worker.ts
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'TEST_ENDPOINT') {
    testEndpoint(msg.url)
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open
  }
});
```

**For configuration updates** (storage events):
```typescript
// options.ts - Save triggers storage event
await chrome.storage.sync.set({ endpointUrl, pollingInterval });

// service-worker.ts - Reacts to storage changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.endpointUrl) {
    console.log('Endpoint changed, requesting new permissions');
    // Service worker can't show permission prompt directly
    // Flag for next user interaction
  }

  if (area === 'sync' && changes.pollingInterval) {
    // Recreate alarm with new interval
    recreatePollingAlarm(changes.pollingInterval.newValue);
  }
});
```

**Rationale**:
- Message passing for request/response patterns
- Storage events for declarative state sync
- Avoids polling or complex state management
- Works even if service worker terminated

## 6. Async Response Contract

### Decision: Standardized Response Format

**Synchronous Response** (immediate):
```json
{
  "status": "completed",
  "result": {
    "processed": true,
    "analysisScore": 0.85
  }
}
```

**Async Response** (polling required):
```json
{
  "status": "pending",
  "requestId": "req_abc123",
  "estimatedDuration": 120
}
```

**Polling Status Response**:
```json
{
  "status": "processing",
  "progress": 0.45,
  "message": "Analyzing sentiment..."
}
```

**Completion Response**:
```json
{
  "status": "completed",
  "result": {
    "analysisScore": 0.85,
    "categories": ["technology", "ai"]
  }
}
```

**Error Response**:
```json
{
  "status": "failed",
  "error": {
    "code": "ANALYSIS_TIMEOUT",
    "message": "LLM processing exceeded time limit"
  }
}
```

### Polling Endpoint Pattern

**Decision**: Configurable with sensible default

Default: `{endpoint}/status/{requestId}`

Example:
- POST endpoint: `https://api.example.com/tweets`
- Status endpoint: `https://api.example.com/status/req_abc123`

**Implementation**:
```typescript
function buildStatusUrl(pollingPattern: string, requestId: string): string {
  // Pattern: "/status/{requestId}" or "/tweets/{requestId}/status"
  return pollingPattern.replace('{requestId}', requestId);
}

// User can configure full pattern in settings
interface Config {
  endpointUrl: string;
  pollingEndpointPattern: string; // Default: "/status/{requestId}"
}
```

**Rationale**:
- Flexible for different backend architectures
- Standard RESTful pattern as default
- Single configuration covers most use cases

### Polling Intervals and Timeouts

**Decision**: Progressive backoff with maximum duration

```typescript
const POLLING_CONFIG = {
  initialIntervalMs: 2000,     // 2 seconds
  maxIntervalMs: 10000,        // 10 seconds
  backoffMultiplier: 1.5,      // 50% increase each attempt
  maxDurationMs: 300000,       // 5 minutes
};

async function pollRequest(requestId: string) {
  const startTime = Date.now();
  let intervalMs = POLLING_CONFIG.initialIntervalMs;

  while (Date.now() - startTime < POLLING_CONFIG.maxDurationMs) {
    await new Promise(resolve => setTimeout(resolve, intervalMs));

    const status = await checkStatus(requestId);

    if (status.status === 'completed' || status.status === 'failed') {
      return status;
    }

    // Progressive backoff
    intervalMs = Math.min(
      intervalMs * POLLING_CONFIG.backoffMultiplier,
      POLLING_CONFIG.maxIntervalMs
    );
  }

  throw new TimeoutError('Polling exceeded maximum duration');
}
```

**Rationale**:
- Aggressive initial polling for fast responses
- Back off to reduce server load
- 5-minute maximum reasonable for LLM processing
- Progressive backoff balances responsiveness and efficiency

## Summary of Technical Decisions

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| **Permissions** | Optional host permissions with runtime requests | User trust, flexibility, security |
| **Storage** | Hybrid: sync for preferences, local for operational data, session for sensitive | Cross-device sync + capacity + security |
| **Polling** | chrome.alarms + chrome.storage.local state | Survives service worker termination |
| **HTTP** | Service worker + AbortSignal.timeout | CORS bypass, native timeout, simple |
| **Options UI** | options_ui embedded + message passing + storage events | Integrated UX, event-driven updates |
| **Async Protocol** | Status field + requestId pattern | Standard RESTful, flexible backends |
| **Polling Strategy** | Progressive backoff, 5-minute max | Balance responsiveness and efficiency |
| **Error Handling** | Typed errors + retry transient failures | Specific user feedback, resilience |

All decisions align with Chrome Extension Manifest V3 best practices and 2025 web standards.
