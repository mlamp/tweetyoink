/**
 * Polling service for async request status checking
 * Feature: 003-config-endpoint (P3)
 */

import type { PostResponse, PollableRequest } from '../types/config';
import { getConfig, getCustomHeaders } from './config-service';

const STORAGE_KEY = 'tweetyoink_active_polls';
const POLLING_URL_CACHE_KEY = 'tweetyoink_polling_urls';

/**
 * Start polling for an async request
 */
export async function startPolling(requestId: string, tweetId: string): Promise<void> {
  const config = await getConfig();

  if (!config.enablePolling) {
    console.log('[TweetYoink] Polling disabled in config');
    return;
  }

  if (!config.endpointUrl) {
    console.error('[TweetYoink] Cannot poll: no endpoint URL configured');
    return;
  }

  // Build polling URL by appending /status to endpoint
  const pollingUrl = buildPollingUrl(config.endpointUrl);

  // Create pollable request entry
  const now = Date.now();
  const request: PollableRequest = {
    requestId,
    tweetId,
    startTime: now,
    lastPollTime: now,
    pollCount: 0,
    currentIntervalMs: config.pollingIntervalSeconds * 1000,
    status: 'pending',
  };

  // Save to storage
  await addActivePoll(request);

  // Save polling URL separately (not in PollableRequest type)
  await savePollingUrl(requestId, pollingUrl);

  // Set alarm for first poll
  const nextPollTime = now + request.currentIntervalMs;
  await chrome.alarms.create(`poll_${requestId}`, {
    when: nextPollTime,
  });

  console.log('[TweetYoink] Polling started for request:', requestId);
  console.log('[TweetYoink] Polling URL:', pollingUrl);
}

/**
 * Poll a specific request by ID
 */
export async function pollRequest(requestId: string): Promise<void> {
  const request = await getActivePoll(requestId);

  if (!request) {
    console.warn('[TweetYoink] No active poll found for:', requestId);
    return;
  }

  const config = await getConfig();
  const maxDuration = config.pollingMaxDurationSeconds * 1000;
  const elapsed = Date.now() - request.startTime;

  // Check if max duration exceeded
  if (elapsed > maxDuration) {
    console.error('[TweetYoink] Polling timeout exceeded for:', requestId);
    await removeActivePoll(requestId);
    return;
  }

  // Get polling URL
  const pollingUrl = await getPollingUrl(requestId);
  if (!pollingUrl) {
    console.error('[TweetYoink] No polling URL found for:', requestId);
    await removeActivePoll(requestId);
    return;
  }

  try {
    // Get custom headers
    const customHeaders = await getCustomHeaders();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add custom headers (same as initial POST request)
    for (const header of customHeaders.headers) {
      if (header.enabled) {
        headers[header.key] = header.value;
      }
    }

    // Make polling request
    console.log(`[TweetYoink] Polling (attempt ${request.pollCount + 1}):`, pollingUrl);

    const response = await fetch(pollingUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ requestId }),
      signal: AbortSignal.timeout(config.postTimeoutSeconds * 1000),
    });

    if (!response.ok) {
      console.error(`[TweetYoink] Poll failed with status ${response.status}`);
      await updatePollStatus(requestId, 'failed');
      await scheduleNextPoll(requestId, request.pollCount + 1);
      return;
    }

    const data: PostResponse = await response.json();

    // Handle response based on status
    if (data.status === 'completed') {
      console.log('[TweetYoink] ✅ Async request completed:', requestId);
      console.log('[TweetYoink] Server response:', JSON.stringify(data.result, null, 2));

      // Notify all tabs about completion
      notifyTabsAboutCompletion(requestId, data.result);

      await removeActivePoll(requestId);
      return;
    }

    if (data.status === 'failed' || data.status === 'error') {
      console.error('[TweetYoink] Async request failed:', data.error);
      await removeActivePoll(requestId);
      return;
    }

    if (data.status === 'pending' || data.status === 'processing') {
      console.log(`[TweetYoink] Request still ${data.status}...`);
      // Map 'processing' to 'polling' for our RequestStatus type
      await updatePollStatus(requestId, data.status === 'processing' ? 'polling' : 'pending');
      await scheduleNextPoll(requestId, request.pollCount + 1);
      return;
    }

  } catch (error: any) {
    if (error.name === 'TimeoutError') {
      console.error('[TweetYoink] Poll request timeout');
    } else if (error.name === 'TypeError') {
      console.error('[TweetYoink] Network error during poll');
    } else {
      console.error('[TweetYoink] Poll error:', error);
    }

    // Schedule retry
    await scheduleNextPoll(requestId, request.pollCount + 1);
  }
}

/**
 * Build polling URL from endpoint URL
 * If endpoint is http://localhost:3000/ -> polling is http://localhost:3000/status
 * If endpoint is http://localhost:3000/some/path -> polling is http://localhost:3000/some/path/status
 */
function buildPollingUrl(baseUrl: string): string {
  // Remove trailing slash from base URL
  const url = baseUrl.replace(/\/$/, '');

  // Append /status to the endpoint path
  return `${url}/status`;
}

/**
 * Schedule next poll with progressive backoff
 */
async function scheduleNextPoll(requestId: string, pollCount: number): Promise<void> {
  const config = await getConfig();
  const now = Date.now();

  // Progressive backoff: start at config interval, increase by 1.5x each time, max 60s
  const baseInterval = config.pollingIntervalSeconds;
  const backoffMultiplier = Math.pow(1.5, Math.min(pollCount, 5)); // Cap at 5x backoff
  const intervalSeconds = Math.min(baseInterval * backoffMultiplier, 60);
  const intervalMs = intervalSeconds * 1000;

  const nextPollTime = now + intervalMs;

  // Update request
  await updatePollCount(requestId, pollCount, intervalMs, now);

  // Set alarm
  await chrome.alarms.create(`poll_${requestId}`, {
    when: nextPollTime,
  });

  console.log(`[TweetYoink] Next poll in ${intervalSeconds.toFixed(1)}s (attempt ${pollCount + 1})`);
}

/**
 * Get all active polls
 */
export async function getActivePolls(): Promise<PollableRequest[]> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return result[STORAGE_KEY] || [];
}

/**
 * Get specific active poll
 */
async function getActivePoll(requestId: string): Promise<PollableRequest | null> {
  const polls = await getActivePolls();
  return polls.find(p => p.requestId === requestId) || null;
}

/**
 * Add new active poll
 */
async function addActivePoll(request: PollableRequest): Promise<void> {
  const polls = await getActivePolls();
  polls.push(request);
  await chrome.storage.local.set({ [STORAGE_KEY]: polls });
}

/**
 * Remove active poll
 */
async function removeActivePoll(requestId: string): Promise<void> {
  const polls = await getActivePolls();
  const filtered = polls.filter(p => p.requestId !== requestId);
  await chrome.storage.local.set({ [STORAGE_KEY]: filtered });

  // Remove polling URL
  await removePollingUrl(requestId);

  // Cancel alarm
  await chrome.alarms.clear(`poll_${requestId}`);
}

/**
 * Update poll status
 */
async function updatePollStatus(requestId: string, status: PollableRequest['status']): Promise<void> {
  const polls = await getActivePolls();
  const request = polls.find(p => p.requestId === requestId);

  if (request) {
    request.status = status;
    await chrome.storage.local.set({ [STORAGE_KEY]: polls });
  }
}

/**
 * Update poll count, interval, and last poll time
 */
async function updatePollCount(requestId: string, pollCount: number, intervalMs: number, lastPollTime: number): Promise<void> {
  const polls = await getActivePolls();
  const request = polls.find(p => p.requestId === requestId);

  if (request) {
    request.pollCount = pollCount;
    request.currentIntervalMs = intervalMs;
    request.lastPollTime = lastPollTime;
    await chrome.storage.local.set({ [STORAGE_KEY]: polls });
  }
}

/**
 * Save polling URL for a request
 */
async function savePollingUrl(requestId: string, url: string): Promise<void> {
  const result = await chrome.storage.local.get(POLLING_URL_CACHE_KEY);
  const cache = result[POLLING_URL_CACHE_KEY] || {};
  cache[requestId] = url;
  await chrome.storage.local.set({ [POLLING_URL_CACHE_KEY]: cache });
}

/**
 * Get polling URL for a request
 */
async function getPollingUrl(requestId: string): Promise<string | null> {
  const result = await chrome.storage.local.get(POLLING_URL_CACHE_KEY);
  const cache = result[POLLING_URL_CACHE_KEY] || {};
  return cache[requestId] || null;
}

/**
 * Remove polling URL for a request
 */
async function removePollingUrl(requestId: string): Promise<void> {
  const result = await chrome.storage.local.get(POLLING_URL_CACHE_KEY);
  const cache = result[POLLING_URL_CACHE_KEY] || {};
  delete cache[requestId];
  await chrome.storage.local.set({ [POLLING_URL_CACHE_KEY]: cache });
}

/**
 * Notify all tabs about async request completion
 * This sends a message to content scripts in all tabs
 */
async function notifyTabsAboutCompletion(requestId: string, result: unknown): Promise<void> {
  try {
    // Query all tabs (to send message to content scripts)
    const tabs = await chrome.tabs.query({});

    // Send message to each tab's content script
    for (const tab of tabs) {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'ASYNC_COMPLETED',
          requestId,
          result,
        }).catch(() => {
          // Ignore errors - tab might not have content script
        });
      }
    }
  } catch (error) {
    console.error('[TweetYoink] Failed to notify tabs:', error);
  }
}
