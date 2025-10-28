# Data Model: Configuration Settings & POST Endpoint

**Feature**: 003-config-endpoint
**Date**: 2025-10-28
**Status**: Complete

## Overview

This document defines the data structures for extension configuration, HTTP request tracking, and async polling state. All entities are persisted in Chrome storage APIs and follow TypeScript strict mode requirements.

## Entity Definitions

### 1. ExtensionConfig

**Purpose**: User-configurable settings for POST endpoint integration

**Storage**: `chrome.storage.sync` (synced across devices)

**Fields**:

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `endpointUrl` | `string` | Yes | `''` | POST endpoint URL for tweet data |
| `pollingEndpointPattern` | `string` | Yes | `'/status/{requestId}'` | URL pattern for polling status, {requestId} replaced at runtime |
| `pollingIntervalSeconds` | `number` | Yes | `5` | Initial polling interval in seconds (minimum 2) |
| `pollingMaxDurationSeconds` | `number` | Yes | `300` | Maximum polling duration (5 minutes default) |
| `postTimeoutSeconds` | `number` | Yes | `30` | Synchronous POST request timeout |
| `enablePolling` | `boolean` | Yes | `true` | Whether to enable async polling for pending responses |

**Validation Rules**:
- `endpointUrl`: Must be valid HTTP/HTTPS URL or empty string
- `pollingIntervalSeconds`: Must be ≥ 2 seconds
- `pollingMaxDurationSeconds`: Must be ≥ 60 seconds
- `postTimeoutSeconds`: Must be ≥ 5 and ≤ 120 seconds

**TypeScript Interface**:
```typescript
export interface ExtensionConfig {
  endpointUrl: string;
  pollingEndpointPattern: string;
  pollingIntervalSeconds: number;
  pollingMaxDurationSeconds: number;
  postTimeoutSeconds: number;
  enablePolling: boolean;
}

export const DEFAULT_CONFIG: ExtensionConfig = {
  endpointUrl: '',
  pollingEndpointPattern: '/status/{requestId}',
  pollingIntervalSeconds: 5,
  pollingMaxDurationSeconds: 300,
  postTimeoutSeconds: 30,
  enablePolling: true,
};
```

---

### 2. CustomHeaders

**Purpose**: User-defined HTTP headers for authentication and custom metadata

**Storage**: `chrome.storage.local` (may exceed sync storage limits)

**Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `headers` | `Array<HeaderEntry>` | Yes | List of custom headers to include in requests |

**HeaderEntry**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `key` | `string` | Yes | Header name (e.g., "Authorization", "X-API-Key") |
| `value` | `string` | Yes | Header value |
| `enabled` | `boolean` | Yes | Whether this header is active |
| `sensitive` | `boolean` | Yes | If true, value is masked in logs |

**Validation Rules**:
- `key`: Must be valid HTTP header name (alphanumeric + hyphens)
- `value`: Non-empty string
- `sensitive`: Automatically set to true for keys matching: Authorization, API-Key, X-API-Key, Bearer

**TypeScript Interface**:
```typescript
export interface HeaderEntry {
  key: string;
  value: string;
  enabled: boolean;
  sensitive: boolean;
}

export interface CustomHeaders {
  headers: HeaderEntry[];
}

export const SENSITIVE_HEADER_PATTERNS = [
  /^authorization$/i,
  /^api-key$/i,
  /^x-api-key$/i,
  /^bearer$/i,
];

export function isSensitiveHeader(key: string): boolean {
  return SENSITIVE_HEADER_PATTERNS.some(pattern => pattern.test(key));
}
```

---

### 3. PollableRequest

**Purpose**: Track async requests that require status polling

**Storage**: `chrome.storage.local` (operational data)

**Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `requestId` | `string` | Yes | Server-provided unique identifier for async request |
| `tweetId` | `string` | Yes | Tweet ID or internal identifier from extraction |
| `startTime` | `number` | Yes | Timestamp when request was initiated (milliseconds since epoch) |
| `lastPollTime` | `number` | Yes | Timestamp of most recent poll attempt |
| `pollCount` | `number` | Yes | Number of poll attempts made |
| `currentIntervalMs` | `number` | Yes | Current polling interval in milliseconds (increases with backoff) |
| `status` | `RequestStatus` | Yes | Current status of the request |
| `progress` | `number` | No | Server-reported progress (0.0 to 1.0) |
| `message` | `string` | No | Server-reported status message |
| `result` | `unknown` | No | Final result data (populated when status = 'completed') |
| `error` | `ErrorDetails` | No | Error information (populated when status = 'failed') |

**RequestStatus** (enum):
- `'pending'`: Initial state, waiting to start polling
- `'polling'`: Actively polling for status updates
- `'completed'`: Successfully completed
- `'failed'`: Request failed with error
- `'timeout'`: Exceeded maximum polling duration

**ErrorDetails**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | `string` | Yes | Error code from server or client |
| `message` | `string` | Yes | Human-readable error message |

**State Transitions**:
```
pending → polling → completed
        → polling → failed
        → polling → timeout
```

**TypeScript Interface**:
```typescript
export type RequestStatus = 'pending' | 'polling' | 'completed' | 'failed' | 'timeout';

export interface ErrorDetails {
  code: string;
  message: string;
}

export interface PollableRequest {
  requestId: string;
  tweetId: string;
  startTime: number;
  lastPollTime: number;
  pollCount: number;
  currentIntervalMs: number;
  status: RequestStatus;
  progress?: number;
  message?: string;
  result?: unknown;
  error?: ErrorDetails;
}

export function createPollableRequest(
  requestId: string,
  tweetId: string,
  initialIntervalMs: number
): PollableRequest {
  const now = Date.now();
  return {
    requestId,
    tweetId,
    startTime: now,
    lastPollTime: now,
    pollCount: 0,
    currentIntervalMs: initialIntervalMs,
    status: 'pending',
  };
}
```

---

### 4. PostResponse

**Purpose**: Standardized response format from POST endpoint

**Source**: Server HTTP response

**Discriminated Union** based on `status` field:

**Synchronous Response** (immediate completion):
```typescript
export interface SynchronousResponse {
  status: 'completed';
  result: unknown; // Server-defined result data
}
```

**Async Response** (polling required):
```typescript
export interface AsyncResponse {
  status: 'pending' | 'processing';
  requestId: string; // Required for polling
  estimatedDuration?: number; // Optional: estimated seconds to completion
  message?: string; // Optional: status message
}
```

**Error Response**:
```typescript
export interface ErrorResponse {
  status: 'failed' | 'error';
  error: {
    code: string;
    message: string;
  };
}
```

**Combined Type**:
```typescript
export type PostResponse = SynchronousResponse | AsyncResponse | ErrorResponse;

export function isAsyncResponse(response: PostResponse): response is AsyncResponse {
  return (response.status === 'pending' || response.status === 'processing') &&
         'requestId' in response;
}

export function isSynchronousResponse(response: PostResponse): response is SynchronousResponse {
  return response.status === 'completed';
}

export function isErrorResponse(response: PostResponse): response is ErrorResponse {
  return response.status === 'failed' || response.status === 'error';
}
```

---

### 5. PollingStatusResponse

**Purpose**: Response format from status polling endpoint

**Source**: Server HTTP response to GET {endpoint}/status/{requestId}

**Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | `'processing' \| 'completed' \| 'failed'` | Yes | Current request status |
| `progress` | `number` | No | Progress percentage (0.0 to 1.0) |
| `message` | `string` | No | Status message (e.g., "Analyzing sentiment...") |
| `result` | `unknown` | No | Final result (present when status = 'completed') |
| `error` | `ErrorDetails` | No | Error information (present when status = 'failed') |

**TypeScript Interface**:
```typescript
export type PollingStatus = 'processing' | 'completed' | 'failed';

export interface PollingStatusResponse {
  status: PollingStatus;
  progress?: number;
  message?: string;
  result?: unknown;
  error?: ErrorDetails;
}
```

---

### 6. PermissionState

**Purpose**: Track granted host permissions

**Storage**: Derived from `chrome.permissions.contains()`, not persisted

**Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `origin` | `string` | Origin URL (e.g., "https://api.example.com/*") |
| `granted` | `boolean` | Whether permission is currently granted |
| `grantedAt` | `number` | Timestamp when permission was granted (milliseconds) |

**TypeScript Interface**:
```typescript
export interface PermissionState {
  origin: string;
  granted: boolean;
  grantedAt: number;
}

export async function checkPermission(url: string): Promise<PermissionState> {
  const origin = new URL(url).origin + '/*';
  const granted = await chrome.permissions.contains({ origins: [origin] });

  return {
    origin,
    granted,
    grantedAt: granted ? Date.now() : 0,
  };
}
```

---

## Storage Schema

### chrome.storage.sync

**Key**: `tweetyoink-config`
**Value**: `ExtensionConfig`
**Size**: ~150 bytes (well under 8KB limit)

### chrome.storage.local

**Key**: `tweetyoink-custom-headers`
**Value**: `CustomHeaders`
**Size**: ~50 bytes per header (under 5.2MB limit)

**Key**: `tweetyoink-active-requests`
**Value**: `PollableRequest[]`
**Size**: ~500 bytes per request × max 10 concurrent = ~5KB (under 5.2MB limit)

**Key**: `tweetyoink-permissions-lost`
**Value**: `boolean`
**Size**: ~10 bytes

### chrome.storage.session (optional, P3)

**Key**: `tweetyoink-api-key`
**Value**: `string`
**Size**: Variable (under 1MB limit)

---

## Relationships

```
ExtensionConfig
    ↓ (used by)
POST Request ───→ PostResponse
    ↓ (if async)
PollableRequest ←─ (creates)
    ↓ (polls)
PollingStatusResponse
    ↓ (updates)
PollableRequest.status → 'completed' | 'failed' | 'timeout'

CustomHeaders
    ↓ (applied to)
POST Request

PermissionState
    ↓ (required for)
POST Request (if origin not yet granted)
```

---

## Data Flow

1. **Configuration**:
   - User enters `endpointUrl` in options page
   - Saved to `chrome.storage.sync`
   - Permission prompt shown if domain not yet granted
   - `PermissionState` checked before POST

2. **POST Request**:
   - User clicks Yoink button
   - Tweet data extracted
   - Config loaded from `chrome.storage.sync`
   - Headers loaded from `chrome.storage.local`
   - POST sent with timeout
   - Response parsed as `PostResponse`

3. **Synchronous Flow**:
   - `PostResponse.status === 'completed'`
   - Result logged to console
   - Done

4. **Async Flow**:
   - `PostResponse.status === 'pending'`
   - Create `PollableRequest` from `requestId`
   - Save to `chrome.storage.local['tweetyoink-active-requests']`
   - Setup `chrome.alarms` for periodic polling
   - Poll status endpoint
   - Parse `PollingStatusResponse`
   - Update `PollableRequest` in storage
   - Repeat until `status === 'completed' | 'failed'` or timeout
   - Remove from `active-requests`

---

## Validation Functions

```typescript
export function validateConfig(config: Partial<ExtensionConfig>): string[] {
  const errors: string[] = [];

  if (config.endpointUrl !== undefined && config.endpointUrl !== '') {
    try {
      const url = new URL(config.endpointUrl);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        errors.push('Endpoint URL must use HTTP or HTTPS protocol');
      }
    } catch {
      errors.push('Endpoint URL is not a valid URL');
    }
  }

  if (config.pollingIntervalSeconds !== undefined) {
    if (config.pollingIntervalSeconds < 2) {
      errors.push('Polling interval must be at least 2 seconds');
    }
  }

  if (config.pollingMaxDurationSeconds !== undefined) {
    if (config.pollingMaxDurationSeconds < 60) {
      errors.push('Polling max duration must be at least 60 seconds');
    }
  }

  if (config.postTimeoutSeconds !== undefined) {
    if (config.postTimeoutSeconds < 5 || config.postTimeoutSeconds > 120) {
      errors.push('POST timeout must be between 5 and 120 seconds');
    }
  }

  return errors;
}

export function validateHeaderEntry(entry: Partial<HeaderEntry>): string[] {
  const errors: string[] = [];

  if (!entry.key || entry.key.trim() === '') {
    errors.push('Header key cannot be empty');
  } else if (!/^[A-Za-z0-9-]+$/.test(entry.key)) {
    errors.push('Header key must contain only alphanumeric characters and hyphens');
  }

  if (!entry.value || entry.value.trim() === '') {
    errors.push('Header value cannot be empty');
  }

  return errors;
}
```

---

## Implementation Notes

1. **Type Safety**: All interfaces exported from `src/types/config.ts`
2. **Storage Keys**: Prefixed with `tweetyoink-` to avoid collisions
3. **Migration**: If storage schema changes, version field should be added for migration logic
4. **Size Limits**: All entities well within Chrome storage limits
5. **Concurrency**: `PollableRequest[]` allows multiple concurrent async requests
6. **Cleanup**: Completed/failed/timeout requests should be removed after logging to prevent storage bloat

---

## Example Usage

```typescript
import type { ExtensionConfig, PollableRequest, PostResponse } from '@/types/config';
import { DEFAULT_CONFIG, isAsyncResponse } from '@/types/config';

// Load configuration
const config = await chrome.storage.sync.get('tweetyoink-config') as { 'tweetyoink-config': ExtensionConfig };
const activeConfig = config['tweetyoink-config'] || DEFAULT_CONFIG;

// POST tweet data
const response = await fetch(activeConfig.endpointUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(tweetData),
  signal: AbortSignal.timeout(activeConfig.postTimeoutSeconds * 1000)
});

const postResponse: PostResponse = await response.json();

// Handle async response
if (isAsyncResponse(postResponse)) {
  const pollableRequest = createPollableRequest(
    postResponse.requestId,
    tweetData.id,
    activeConfig.pollingIntervalSeconds * 1000
  );

  // Save to storage
  const { 'tweetyoink-active-requests': activeRequests = [] } = await chrome.storage.local.get('tweetyoink-active-requests');
  activeRequests.push(pollableRequest);
  await chrome.storage.local.set({ 'tweetyoink-active-requests': activeRequests });

  // Setup polling alarm
  await chrome.alarms.create(`poll-${postResponse.requestId}`, {
    delayInMinutes: activeConfig.pollingIntervalSeconds / 60
  });
}
```
