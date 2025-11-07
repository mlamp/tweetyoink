# Developer Quickstart: Configuration Settings & POST Endpoint

**Feature**: 003-config-endpoint
**Target Audience**: Developers implementing this feature
**Prerequisites**: 002-post-view-yoink feature completed and working

## Overview

This guide helps you implement the configuration UI and POST endpoint integration for TweetYoink. By the end, users will be able to configure a custom endpoint, grant permissions, and have captured tweet data automatically POSTed with support for async processing.

**Estimated Implementation Time**: 6-8 hours for P1-P2, +4 hours for P3 (headers + async polling)

---

## Architecture Overview

```
┌─────────────────┐
│  Options Page   │  User configures endpoint URL
│  (options.html) │  Grants domain permissions
└────────┬────────┘
         │ Saves to chrome.storage.sync
         ↓
┌─────────────────┐
│ Config Service  │  Manages settings CRUD
│ (config-service)│  Validates configuration
└────────┬────────┘
         │ Loads config
         ↓
┌─────────────────┐         ┌──────────────┐
│ Content Script  │────────→│ POST Service │
│ (Yoink button)  │         │ HTTP requests│
└─────────────────┘         └──────┬───────┘
                                   │
                         ┌─────────┴──────────┐
                         ↓                    ↓
                ┌────────────────┐   ┌────────────────┐
                │ Synchronous    │   │ Async Response │
                │ Response       │   │ (requestId)    │
                │ → Console log  │   └───────┬────────┘
                └────────────────┘           │
                                             ↓
                                   ┌────────────────┐
                                   │ Polling Service│
                                   │ chrome.alarms  │
                                   │ Status checks  │
                                   └────────────────┘
```

---

## Phase 1: Setup & Types (P1)

### Step 1.1: Create Type Definitions

**File**: `src/types/config.ts`

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

export interface HeaderEntry {
  key: string;
  value: string;
  enabled: boolean;
  sensitive: boolean;
}

export interface CustomHeaders {
  headers: HeaderEntry[];
}

export type RequestStatus = 'pending' | 'polling' | 'completed' | 'failed' | 'timeout';

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
  error?: { code: string; message: string };
}

export type PostResponse =
  | { status: 'completed'; result: unknown }
  | { status: 'pending' | 'processing'; requestId: string; estimatedDuration?: number; message?: string }
  | { status: 'failed' | 'error'; error: { code: string; message: string } };

export function isAsyncResponse(response: PostResponse): response is Extract<PostResponse, { requestId: string }> {
  return 'requestId' in response && (response.status === 'pending' || response.status === 'processing');
}
```

### Step 1.2: Update manifest.json

**File**: `public/manifest.json`

```json
{
  "manifest_version": 3,
  "name": "TweetYoink",
  "version": "0.2.0",

  "options_ui": {
    "page": "options.html",
    "open_in_tab": false
  },

  "permissions": [
    "storage",
    "alarms"
  ],

  "optional_host_permissions": [
    "https://*/*",
    "http://*/*"
  ]
}
```

**Testing**: Run `npm run build` and verify manifest includes options_ui.

---

## Phase 2: Config Service (P1)

### Step 2.1: Implement Config Service

**File**: `src/services/config-service.ts`

```typescript
import type { ExtensionConfig, CustomHeaders } from '../types/config';
import { DEFAULT_CONFIG } from '../types/config';

const CONFIG_KEY = 'tweetyoink-config';
const HEADERS_KEY = 'tweetyoink-custom-headers';

export async function getConfig(): Promise<ExtensionConfig> {
  const result = await chrome.storage.sync.get(CONFIG_KEY);
  return result[CONFIG_KEY] || DEFAULT_CONFIG;
}

export async function saveConfig(config: Partial<ExtensionConfig>): Promise<void> {
  const current = await getConfig();
  const updated = { ...current, ...config };

  // Validate
  const errors = validateConfig(updated);
  if (errors.length > 0) {
    throw new Error(`Invalid configuration: ${errors.join(', ')}`);
  }

  await chrome.storage.sync.set({ [CONFIG_KEY]: updated });
}

export async function getCustomHeaders(): Promise<CustomHeaders> {
  const result = await chrome.storage.local.get(HEADERS_KEY);
  return result[HEADERS_KEY] || { headers: [] };
}

export async function saveCustomHeaders(headers: CustomHeaders): Promise<void> {
  await chrome.storage.local.set({ [HEADERS_KEY]: headers });
}

export function validateConfig(config: ExtensionConfig): string[] {
  const errors: string[] = [];

  if (config.endpointUrl && config.endpointUrl !== '') {
    try {
      const url = new URL(config.endpointUrl);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        errors.push('Endpoint URL must use HTTP or HTTPS');
      }
    } catch {
      errors.push('Invalid endpoint URL format');
    }
  }

  if (config.pollingIntervalSeconds < 2) {
    errors.push('Polling interval must be at least 2 seconds');
  }

  if (config.postTimeoutSeconds < 5 || config.postTimeoutSeconds > 120) {
    errors.push('POST timeout must be between 5 and 120 seconds');
  }

  return errors;
}

// Listen for config changes
export function watchConfigChanges(callback: (config: ExtensionConfig) => void): void {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes[CONFIG_KEY]) {
      callback(changes[CONFIG_KEY].newValue);
    }
  });
}
```

**Testing**:
```typescript
// In browser console
const config = await getConfig();
console.log('Config:', config);

await saveConfig({ endpointUrl: 'https://api.example.com/tweets' });
console.log('Saved!');
```

---

## Phase 3: Options Page UI (P1)

### Step 3.1: Create Options HTML

**File**: `src/options/options.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TweetYoink Options</title>
  <link rel="stylesheet" href="./options.css">
</head>
<body>
  <div class="container">
    <h1>TweetYoink Options</h1>

    <section class="section">
      <h2>Endpoint Configuration</h2>
      <div class="form-group">
        <label for="endpoint-url">POST Endpoint URL</label>
        <input
          type="url"
          id="endpoint-url"
          placeholder="https://your-backend.com/api/tweets"
        >
        <small>URL where captured tweet data will be POSTed</small>
      </div>

      <div class="form-group">
        <label for="post-timeout">Request Timeout (seconds)</label>
        <input
          type="number"
          id="post-timeout"
          min="5"
          max="120"
          value="30"
        >
      </div>
    </section>

    <section class="section">
      <h2>Permissions</h2>
      <p>Grant permission to POST data to your endpoint domain:</p>
      <button id="grant-permission" class="button">Grant Permission</button>
      <span id="permission-status"></span>
    </section>

    <section class="section">
      <h2>Async Polling (Optional)</h2>
      <div class="form-group">
        <label>
          <input type="checkbox" id="enable-polling" checked>
          Enable async polling for long-running operations
        </label>
      </div>

      <div class="form-group">
        <label for="polling-interval">Polling Interval (seconds)</label>
        <input
          type="number"
          id="polling-interval"
          min="2"
          max="60"
          value="5"
        >
      </div>

      <div class="form-group">
        <label for="polling-pattern">Status Endpoint Pattern</label>
        <input
          type="text"
          id="polling-pattern"
          value="/status/{requestId}"
          placeholder="/status/{requestId}"
        >
        <small>Use {requestId} as placeholder for the request ID</small>
      </div>
    </section>

    <div class="actions">
      <button id="save-config" class="button button-primary">Save Configuration</button>
      <button id="test-connection" class="button">Test Connection</button>
    </div>

    <div id="status-message" class="status-message"></div>
  </div>

  <script type="module" src="./options.ts"></script>
</body>
</html>
```

### Step 3.2: Style Options Page

**File**: `src/options/options.css`

```css
:root {
  --primary-color: #1a73e8;
  --success-color: #0f9d58;
  --error-color: #d93025;
  --border-color: #dadce0;
  --bg-gray: #f8f9fa;
}

* {
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  margin: 0;
  padding: 20px;
  background: #fff;
  color: #202124;
  line-height: 1.6;
}

.container {
  max-width: 600px;
  margin: 0 auto;
}

h1 {
  font-size: 28px;
  font-weight: 400;
  margin: 0 0 24px 0;
}

h2 {
  font-size: 18px;
  font-weight: 500;
  margin: 0 0 16px 0;
}

.section {
  background: var(--bg-gray);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group:last-child {
  margin-bottom: 0;
}

label {
  display: block;
  font-weight: 500;
  margin-bottom: 6px;
  font-size: 14px;
}

input[type="text"],
input[type="url"],
input[type="number"] {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
}

input[type="text"]:focus,
input[type="url"]:focus,
input[type="number"]:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.1);
}

input[type="checkbox"] {
  margin-right: 8px;
}

small {
  display: block;
  color: #5f6368;
  font-size: 12px;
  margin-top: 4px;
}

.button {
  padding: 10px 20px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: #fff;
  color: #202124;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.button:hover {
  background: var(--bg-gray);
}

.button-primary {
  background: var(--primary-color);
  color: #fff;
  border-color: var(--primary-color);
}

.button-primary:hover {
  background: #1765cc;
  border-color: #1765cc;
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.status-message {
  margin-top: 16px;
  padding: 12px;
  border-radius: 4px;
  font-size: 14px;
  display: none;
}

.status-message.success {
  display: block;
  background: rgba(15, 157, 88, 0.1);
  color: var(--success-color);
  border: 1px solid var(--success-color);
}

.status-message.error {
  display: block;
  background: rgba(217, 48, 37, 0.1);
  color: var(--error-color);
  border: 1px solid var(--error-color);
}

#permission-status {
  margin-left: 12px;
  font-weight: 500;
}

#permission-status.granted {
  color: var(--success-color);
}

#permission-status.denied {
  color: var(--error-color);
}
```

### Step 3.3: Implement Options Logic

**File**: `src/options/options.ts`

```typescript
import { getConfig, saveConfig } from '../services/config-service';
import type { ExtensionConfig } from '../types/config';

// Load saved configuration
async function loadOptions() {
  const config = await getConfig();

  (document.getElementById('endpoint-url') as HTMLInputElement).value = config.endpointUrl;
  (document.getElementById('post-timeout') as HTMLInputElement).value = config.postTimeoutSeconds.toString();
  (document.getElementById('enable-polling') as HTMLInputElement).checked = config.enablePolling;
  (document.getElementById('polling-interval') as HTMLInputElement).value = config.pollingIntervalSeconds.toString();
  (document.getElementById('polling-pattern') as HTMLInputElement).value = config.pollingEndpointPattern;

  await updatePermissionStatus();
}

// Save configuration
async function handleSave() {
  const endpointUrl = (document.getElementById('endpoint-url') as HTMLInputElement).value.trim();
  const postTimeoutSeconds = parseInt((document.getElementById('post-timeout') as HTMLInputElement).value);
  const enablePolling = (document.getElementById('enable-polling') as HTMLInputElement).checked;
  const pollingIntervalSeconds = parseInt((document.getElementById('polling-interval') as HTMLInputElement).value);
  const pollingEndpointPattern = (document.getElementById('polling-pattern') as HTMLInputElement).value.trim();

  try {
    await saveConfig({
      endpointUrl,
      postTimeoutSeconds,
      enablePolling,
      pollingIntervalSeconds,
      pollingEndpointPattern,
    });

    showStatus('Configuration saved successfully!', 'success');

    // Request permission if endpoint URL changed
    if (endpointUrl) {
      await requestPermissionForEndpoint(endpointUrl);
    }
  } catch (error) {
    showStatus(`Error: ${error.message}`, 'error');
  }
}

// Request host permission
async function requestPermissionForEndpoint(url: string) {
  try {
    const parsedUrl = new URL(url);
    const origin = `${parsedUrl.protocol}//${parsedUrl.hostname}/*`;

    const granted = await chrome.permissions.request({ origins: [origin] });

    if (granted) {
      showStatus('Permission granted for endpoint domain', 'success');
    } else {
      showStatus('Permission denied - extension cannot POST to this domain', 'error');
    }

    await updatePermissionStatus();
  } catch (error) {
    showStatus(`Invalid URL: ${error.message}`, 'error');
  }
}

// Update permission status display
async function updatePermissionStatus() {
  const endpointUrl = (document.getElementById('endpoint-url') as HTMLInputElement).value.trim();
  const statusEl = document.getElementById('permission-status')!;

  if (!endpointUrl) {
    statusEl.textContent = '';
    statusEl.className = '';
    return;
  }

  try {
    const parsedUrl = new URL(endpointUrl);
    const origin = `${parsedUrl.protocol}//${parsedUrl.hostname}/*`;

    const hasPermission = await chrome.permissions.contains({ origins: [origin] });

    if (hasPermission) {
      statusEl.textContent = '✓ Permission granted';
      statusEl.className = 'granted';
    } else {
      statusEl.textContent = '✗ Permission required';
      statusEl.className = 'denied';
    }
  } catch {
    statusEl.textContent = '';
    statusEl.className = '';
  }
}

// Test connection to endpoint
async function testConnection() {
  const endpointUrl = (document.getElementById('endpoint-url') as HTMLInputElement).value.trim();

  if (!endpointUrl) {
    showStatus('Please enter an endpoint URL first', 'error');
    return;
  }

  const button = document.getElementById('test-connection') as HTMLButtonElement;
  button.disabled = true;
  button.textContent = 'Testing...';

  try {
    // Send test message to service worker
    const response = await chrome.runtime.sendMessage({
      type: 'TEST_ENDPOINT',
      url: endpointUrl
    });

    if (response.success) {
      showStatus('Connection successful!', 'success');
    } else {
      showStatus(`Connection failed: ${response.error}`, 'error');
    }
  } catch (error) {
    showStatus(`Test failed: ${error.message}`, 'error');
  } finally {
    button.disabled = false;
    button.textContent = 'Test Connection';
  }
}

// Show status message
function showStatus(message: string, type: 'success' | 'error') {
  const statusEl = document.getElementById('status-message')!;
  statusEl.textContent = message;
  statusEl.className = `status-message ${type}`;

  setTimeout(() => {
    statusEl.className = 'status-message';
  }, 5000);
}

// Event listeners
document.getElementById('save-config')!.addEventListener('click', handleSave);
document.getElementById('test-connection')!.addEventListener('click', testConnection);
document.getElementById('grant-permission')!.addEventListener('click', async () => {
  const url = (document.getElementById('endpoint-url') as HTMLInputElement).value.trim();
  if (url) {
    await requestPermissionForEndpoint(url);
  } else {
    showStatus('Please enter an endpoint URL first', 'error');
  }
});

// Update permission status when URL changes
document.getElementById('endpoint-url')!.addEventListener('input', updatePermissionStatus);

// Load options on page load
document.addEventListener('DOMContentLoaded', loadOptions);
```

**Testing**:
1. Run `npm run build`
2. Load extension in Chrome
3. Right-click extension icon → Options
4. Enter a test URL
5. Click "Grant Permission" - should see Chrome permission prompt
6. Click "Save Configuration" - should see success message

---

## Phase 4: POST Service (P2)

### Step 4.1: Implement POST Service

**File**: `src/services/post-service.ts`

```typescript
import type { PostResponse, ExtensionConfig, CustomHeaders } from '../types/config';
import { getConfig, getCustomHeaders } from './config-service';
import type { TweetData } from '../types/tweet-data';

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(`HTTP ${status}: ${message}`);
    this.name = 'HttpError';
  }
}

export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export async function postTweetData(tweetData: TweetData): Promise<PostResponse> {
  const config = await getConfig();

  if (!config.endpointUrl) {
    throw new Error('No endpoint URL configured');
  }

  // Check permission
  const hasPermission = await checkPermission(config.endpointUrl);
  if (!hasPermission) {
    throw new Error('Permission not granted for endpoint domain');
  }

  // Get custom headers
  const customHeaders = await getCustomHeaders();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add custom headers
  for (const header of customHeaders.headers) {
    if (header.enabled) {
      headers[header.key] = header.value;
    }
  }

  // Make POST request
  console.log('[TweetYoink] POSTing to:', config.endpointUrl);
  console.log('[TweetYoink] Tweet data:', tweetData);

  try {
    const response = await fetch(config.endpointUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(tweetData),
      signal: AbortSignal.timeout(config.postTimeoutSeconds * 1000)
    });

    console.log('[TweetYoink] Response status:', response.status);
    console.log('[TweetYoink] Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new HttpError(response.status, errorText || response.statusText);
    }

    const responseData: PostResponse = await response.json();
    console.log('[TweetYoink] Response data:', responseData);

    return responseData;

  } catch (error: any) {
    if (error.name === 'TimeoutError') {
      const timeoutError = new TimeoutError(`Request timed out after ${config.postTimeoutSeconds} seconds`);
      console.error('[TweetYoink] Timeout:', timeoutError.message);
      throw timeoutError;
    }

    if (error.name === 'TypeError') {
      const networkError = new NetworkError('Network request failed - check internet connection');
      console.error('[TweetYoink] Network error:', networkError.message);
      throw networkError;
    }

    console.error('[TweetYoink] POST error:', error);
    throw error;
  }
}

async function checkPermission(url: string): Promise<boolean> {
  try {
    const parsedUrl = new URL(url);
    const origin = `${parsedUrl.protocol}//${parsedUrl.hostname}/*`;
    return await chrome.permissions.contains({ origins: [origin] });
  } catch {
    return false;
  }
}
```

**Testing**:
```typescript
// Mock tweet data for testing
const mockTweetData = {
  text: "Test tweet",
  author: { handle: "test", displayName: "Test User", isVerified: false },
  timestamp: new Date().toISOString(),
  // ... rest of TweetData structure
};

try {
  const response = await postTweetData(mockTweetData);
  console.log('Success:', response);
} catch (error) {
  console.error('Error:', error.message);
}
```

---

## Phase 5: Integration with Yoink Button (P2)

### Step 5.1: Update Content Script

**File**: `src/content-script.ts`

Add POST functionality to existing Yoink button handler:

```typescript
import { extractTweetData } from './extractors/tweet-extractor';
import { isExtractionSuccess } from './types/tweet-data';
import { postTweetData, HttpError, TimeoutError, NetworkError } from './services/post-service';
import { isAsyncResponse } from './types/config';
import { disableButton, enableButton, showButtonError } from './ui/yoink-button';

async function handleYoinkClick(tweetElement: Element, button: HTMLButtonElement): Promise<void> {
  console.log('[TweetYoink] Yoink button clicked');

  disableButton(button);

  try {
    // Extract tweet data (existing functionality)
    const result = extractTweetData(tweetElement);

    if (!isExtractionSuccess(result)) {
      console.error('[TweetYoink] Extraction failed:', result.error);
      showButtonError(button);
      setTimeout(() => enableButton(button), 2000);
      return;
    }

    const tweetData = result.data;
    console.log('[TweetYoink] Tweet captured:', JSON.stringify(tweetData, null, 2));

    // POST to configured endpoint
    try {
      const response = await postTweetData(tweetData);

      // Handle async response
      if (isAsyncResponse(response)) {
        console.log('[TweetYoink] Async request initiated:', response.requestId);
        console.log('[TweetYoink] Estimated duration:', response.estimatedDuration, 'seconds');
        if (response.message) {
          console.log('[TweetYoink] Status:', response.message);
        }

        // TODO: Implement polling service (Phase 6)
        // For now, just log and enable button
        enableButton(button);
        return;
      }

      // Synchronous response
      console.log('[TweetYoink] ✓ POST successful:', response.result);
      enableButton(button);

    } catch (postError) {
      console.error('[TweetYoink] POST failed:', postError);

      // Show specific error feedback
      if (postError instanceof TimeoutError) {
        console.error('[TweetYoink] Request timed out');
      } else if (postError instanceof NetworkError) {
        console.error('[TweetYoink] Network error - check connection');
      } else if (postError instanceof HttpError) {
        console.error(`[TweetYoink] Server error: HTTP ${postError.status}`);
      } else if (postError.message.includes('No endpoint')) {
        console.warn('[TweetYoink] No endpoint configured');
      }

      showButtonError(button);
      setTimeout(() => enableButton(button), 2000);
    }

  } catch (error) {
    console.error('[TweetYoink] Unexpected error:', error);
    showButtonError(button);
    setTimeout(() => enableButton(button), 2000);
  }
}
```

**Testing**:
1. Build extension: `npm run build`
2. Reload extension
3. Navigate to a tweet
4. Configure endpoint in options
5. Click Yoink button
6. Check console for POST logs

---

## Phase 6: Polling Service (P3 - Optional)

### Step 6.1: Implement Polling Service

**File**: `src/services/polling-service.ts`

```typescript
import type { PollableRequest, PollingStatusResponse } from '../types/config';
import { getConfig } from './config-service';

const ACTIVE_REQUESTS_KEY = 'tweetyoink-active-requests';
const POLLING_ALARM_PREFIX = 'tweetyoink-poll-';

export async function startPolling(requestId: string, tweetId: string): Promise<void> {
  const config = await getConfig();

  if (!config.enablePolling) {
    console.log('[Polling] Polling disabled in config');
    return;
  }

  const request: PollableRequest = {
    requestId,
    tweetId,
    startTime: Date.now(),
    lastPollTime: Date.now(),
    pollCount: 0,
    currentIntervalMs: config.pollingIntervalSeconds * 1000,
    status: 'pending',
  };

  // Save to storage
  await addActiveRequest(request);

  // Create alarm for polling
  await chrome.alarms.create(`${POLLING_ALARM_PREFIX}${requestId}`, {
    delayInMinutes: config.pollingIntervalSeconds / 60,
  });

  console.log(`[Polling] Started polling for request ${requestId}`);
}

export async function checkStatus(requestId: string): Promise<void> {
  const config = await getConfig();
  const requests = await getActiveRequests();
  const request = requests.find(r => r.requestId === requestId);

  if (!request) {
    console.warn(`[Polling] Request ${requestId} not found`);
    return;
  }

  // Check timeout
  const elapsed = Date.now() - request.startTime;
  if (elapsed > config.pollingMaxDurationSeconds * 1000) {
    console.log(`[Polling] Request ${requestId} timed out after ${elapsed}ms`);
    await updateRequestStatus(requestId, { status: 'timeout' });
    await chrome.alarms.clear(`${POLLING_ALARM_PREFIX}${requestId}`);
    return;
  }

  // Build status URL
  const statusUrl = config.endpointUrl + config.pollingEndpointPattern.replace('{requestId}', requestId);

  try {
    console.log(`[Polling] Checking status: ${statusUrl}`);

    const response = await fetch(statusUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(10000) // 10 second timeout for status checks
    });

    if (!response.ok) {
      console.error(`[Polling] Status check failed: HTTP ${response.status}`);
      return; // Continue polling
    }

    const statusData: PollingStatusResponse = await response.json();
    console.log(`[Polling] Status:`, statusData);

    // Update request
    await updateRequestStatus(requestId, {
      lastPollTime: Date.now(),
      pollCount: request.pollCount + 1,
      status: statusData.status === 'processing' ? 'polling' : statusData.status,
      progress: statusData.progress,
      message: statusData.message,
      result: statusData.result,
      error: statusData.error,
    });

    // Stop polling if completed or failed
    if (statusData.status === 'completed' || statusData.status === 'failed') {
      console.log(`[Polling] Request ${requestId} ${statusData.status}`);
      await chrome.alarms.clear(`${POLLING_ALARM_PREFIX}${requestId}`);

      if (statusData.status === 'completed') {
        console.log(`[Polling] ✓ Final result:`, statusData.result);
      } else {
        console.error(`[Polling] ✗ Error:`, statusData.error);
      }

      // Clean up after logging
      setTimeout(() => removeCompletedRequest(requestId), 60000); // Remove after 1 minute
    } else {
      // Schedule next poll with backoff
      const nextInterval = Math.min(request.currentIntervalMs * 1.5, 10000);
      await updateRequestStatus(requestId, { currentIntervalMs: nextInterval });

      await chrome.alarms.create(`${POLLING_ALARM_PREFIX}${requestId}`, {
        delayInMinutes: nextInterval / 60000,
      });
    }

  } catch (error) {
    console.error(`[Polling] Status check error:`, error);
    // Continue polling on error
  }
}

// Storage helpers
async function getActiveRequests(): Promise<PollableRequest[]> {
  const result = await chrome.storage.local.get(ACTIVE_REQUESTS_KEY);
  return result[ACTIVE_REQUESTS_KEY] || [];
}

async function addActiveRequest(request: PollableRequest): Promise<void> {
  const requests = await getActiveRequests();
  requests.push(request);
  await chrome.storage.local.set({ [ACTIVE_REQUESTS_KEY]: requests });
}

async function updateRequestStatus(requestId: string, updates: Partial<PollableRequest>): Promise<void> {
  const requests = await getActiveRequests();
  const index = requests.findIndex(r => r.requestId === requestId);

  if (index >= 0) {
    requests[index] = { ...requests[index], ...updates };
    await chrome.storage.local.set({ [ACTIVE_REQUESTS_KEY]: requests });
  }
}

async function removeCompletedRequest(requestId: string): Promise<void> {
  const requests = await getActiveRequests();
  const filtered = requests.filter(r => r.requestId !== requestId);
  await chrome.storage.local.set({ [ACTIVE_REQUESTS_KEY]: filtered });
}

// Setup alarm listener (in service worker or background context)
export function setupPollingAlarmListener(): void {
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name.startsWith(POLLING_ALARM_PREFIX)) {
      const requestId = alarm.name.substring(POLLING_ALARM_PREFIX.length);
      checkStatus(requestId);
    }
  });
}
```

### Step 6.2: Integrate Polling in Content Script

Update `handleYoinkClick` to start polling for async responses:

```typescript
// In handleYoinkClick function, replace TODO comment:
if (isAsyncResponse(response)) {
  console.log('[TweetYoink] Async request initiated:', response.requestId);

  // Start polling
  await startPolling(response.requestId, tweetData.id || 'unknown');

  enableButton(button);
  return;
}
```

### Step 6.3: Setup Polling on Extension Startup

**File**: `src/service-worker.ts` (create if doesn't exist)

```typescript
import { setupPollingAlarmListener } from './services/polling-service';

// Setup alarm listener
setupPollingAlarmListener();

// Resume polling for any active requests after restart
chrome.runtime.onStartup.addListener(async () => {
  console.log('[TweetYoink] Extension started, checking for active polls');

  const { 'tweetyoink-active-requests': requests = [] } = await chrome.storage.local.get('tweetyoink-active-requests');

  for (const request of requests) {
    if (request.status === 'pending' || request.status === 'polling') {
      console.log(`[TweetYoink] Resuming polling for request ${request.requestId}`);
      // Recreate alarm
      await chrome.alarms.create(`tweetyoink-poll-${request.requestId}`, {
        delayInMinutes: 0.5 // Check immediately
      });
    }
  }
});
```

**Testing**:
1. Configure endpoint that returns async response
2. Click Yoink button
3. Check console for polling logs every few seconds
4. Verify polling stops when status becomes 'completed'

---

## Final Checklist

**P1 (Required)**:
- [ ] Config types defined in `src/types/config.ts`
- [ ] Config service with get/save/validate functions
- [ ] Options page UI (HTML + CSS)
- [ ] Options page logic (load/save/validate)
- [ ] Permission request flow working
- [ ] manifest.json updated with options_ui and optional_host_permissions

**P2 (Required)**:
- [ ] POST service implemented
- [ ] Error handling (HttpError, TimeoutError, NetworkError)
- [ ] Integration with existing Yoink button
- [ ] Console logging for all requests/responses
- [ ] Permission check before POST

**P3 (Optional)**:
- [ ] Custom headers support
- [ ] Polling service implemented
- [ ] Service worker with alarm listener
- [ ] Polling state persistence
- [ ] Resume polling after browser restart

**Testing**:
- [ ] Extension builds without errors
- [ ] Options page accessible and functional
- [ ] Permission prompts work correctly
- [ ] POST requests sent successfully
- [ ] Async polling works end-to-end
- [ ] Error states handled gracefully

---

## Common Issues & Solutions

**Issue**: Permission prompt doesn't appear
- **Solution**: Make sure permission request is triggered by user gesture (button click)

**Issue**: POST fails with CORS error
- **Solution**: Verify `host_permissions` or `optional_host_permissions` in manifest.json

**Issue**: Polling doesn't resume after restart
- **Solution**: Check `chrome.runtime.onStartup` listener in service worker

**Issue**: Chrome storage quota exceeded
- **Solution**: Clean up old completed requests from `activeRequests` array

---

## Next Steps

After completing this feature:
1. Test with real backend endpoint
2. Monitor console logs for any errors
3. Gather user feedback on polling intervals
4. Consider adding retry logic for failed POSTs
5. Add telemetry for tracking POST success rates

For questions or issues, refer to:
- [Chrome Extension Storage API docs](https://developer.chrome.com/docs/extensions/reference/storage/)
- [Chrome Extension Permissions docs](https://developer.chrome.com/docs/extensions/mv3/declare_permissions/)
- [Fetch API timeout patterns](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout)
