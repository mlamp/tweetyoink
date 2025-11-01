import { logger } from './utils/logger';

/**
 * TweetYoink Service Worker
 * Feature: 003-config-endpoint
 * Handles alarms for polling async requests and test connections
 */

import { pollRequest, getActivePolls, startPolling } from './services/polling-service';
import type { TweetData } from './types/tweet-data';
import type { PostResponse } from './types/config';
import { getConfig, getCustomHeaders } from './services/config-service';

logger.log('[TweetYoink Service Worker] Initialized');

chrome.runtime.onInstalled.addListener(() => {
  logger.log('[TweetYoink Service Worker] Extension installed/updated');

  // Restore alarms for any active polls
  restoreActivePolls();
});

// Handle alarms for polling
chrome.alarms.onAlarm.addListener(async (alarm) => {
  // Check if this is a polling alarm
  if (alarm.name.startsWith('poll_')) {
    const requestId = alarm.name.replace('poll_', '');
    logger.log('[TweetYoink Service Worker] Alarm fired for:', requestId);

    await pollRequest(requestId);
  }
});

// Handle messages from extension pages
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'TEST_ENDPOINT') {
    testEndpoint(message.url).then(sendResponse);
    return true; // Keep message channel open for async response
  }

  if (message.type === 'POST_TWEET_DATA') {
    postTweetDataFromWorker(message.tweetData).then(sendResponse);
    return true; // Keep message channel open for async response
  }

  return false;
});

/**
 * Test connection to endpoint
 */
async function testEndpoint(url: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate URL
    if (!url) {
      return { success: false, error: 'No URL provided' };
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return { success: false, error: 'Invalid URL format' };
    }

    // Check permission
    const origin = `${parsedUrl.protocol}//${parsedUrl.hostname}/*`;
    const hasPermission = await chrome.permissions.contains({ origins: [origin] });

    if (!hasPermission) {
      return {
        success: false,
        error: `Permission not granted for ${parsedUrl.hostname}. Click "Grant Permission" first.`,
      };
    }

    // Send test request
    const testData: Partial<TweetData> = {
      text: 'Test connection from TweetYoink extension',
      author: {
        handle: 'test',
        displayName: 'Test User',
        isVerified: false,
        profileImageUrl: null,
        profileUrl: 'https://x.com/test',
      },
      timestamp: new Date().toISOString(),
      metrics: {
        replyCount: 0,
        retweetCount: 0,
        likeCount: 0,
        bookmarkCount: 0,
        viewCount: 0,
      },
      media: [],
      linkCard: null,
      tweetType: {
        isRetweet: false,
        isQuote: false,
        isReply: false,
      },
      parent: null,
      metadata: {
        confidence: 1.0,
        capturedAt: new Date().toISOString(),
        extractionTier: 'primary',
        warnings: [],
        duration: 0,
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
      signal: AbortSignal.timeout(10000), // 10 second timeout for test
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Server returned ${response.status}: ${response.statusText}`,
      };
    }

    // Try to parse response (verify it's valid JSON)
    await response.json().catch(() => null);

    return {
      success: true,
      error: undefined,
    };
  } catch (error: any) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return {
        success: false,
        error: 'Request timed out after 10 seconds. Check if server is running.',
      };
    }

    if (error.name === 'TypeError') {
      return {
        success: false,
        error: 'Network error. Make sure the server is running and accessible.',
      };
    }

    return {
      success: false,
      error: error.message || 'Unknown error occurred',
    };
  }
}

/**
 * POST tweet data to configured endpoint
 * This runs in service worker context where chrome.permissions API is available
 */
async function postTweetDataFromWorker(
  tweetData: TweetData
): Promise<{ success: boolean; data?: PostResponse; error?: string; errorType?: string; status?: number }> {
  try {
    const config = await getConfig();

    if (!config.endpointUrl) {
      return {
        success: false,
        error: 'No endpoint URL configured. Please configure an endpoint in extension options.',
        errorType: 'ConfigError',
      };
    }

    // Check permission
    const url = new URL(config.endpointUrl);
    const origin = `${url.protocol}//${url.hostname}/*`;

    logger.log('[TweetYoink SW] Checking permission for:', origin);
    const hasPermission = await chrome.permissions.contains({ origins: [origin] });
    logger.log('[TweetYoink SW] Permission granted:', hasPermission);

    if (!hasPermission) {
      return {
        success: false,
        error: `Permission not granted for ${url.hostname}. Open extension options and click "Grant Permission".`,
        errorType: 'PermissionError',
      };
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

    // Log headers (mask sensitive ones)
    const logHeaders = { ...headers };
    for (const header of customHeaders.headers) {
      if (header.sensitive && header.enabled) {
        logHeaders[header.key] = '***REDACTED***';
      }
    }

    logger.log('[TweetYoink SW] POSTing to:', config.endpointUrl);
    logger.log('[TweetYoink SW] Request headers:', logHeaders);
    logger.log('[TweetYoink SW] Tweet data:', tweetData);

    // Make POST request
    const response = await fetch(config.endpointUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(tweetData),
      signal: AbortSignal.timeout(config.postTimeoutSeconds * 1000),
    });

    logger.log('[TweetYoink SW] Response status:', response.status);

    // Log response headers
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    logger.log('[TweetYoink SW] Response headers:', responseHeaders);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      return {
        success: false,
        error: errorText || response.statusText,
        errorType: 'HttpError',
        status: response.status,
      };
    }

    const responseData: PostResponse = await response.json();
    logger.log('[TweetYoink SW] Response data:', responseData);

    // If response is async, start polling automatically
    if ('requestId' in responseData && (responseData.status === 'pending' || responseData.status === 'processing')) {
      const tweetIdentifier = `${tweetData.author.handle || 'unknown'}_${tweetData.timestamp || Date.now()}`;
      logger.log('[TweetYoink SW] Starting polling for:', responseData.requestId);
      await startPolling(responseData.requestId, tweetIdentifier);
    }

    return {
      success: true,
      data: responseData,
    };
  } catch (error: any) {
    logger.error('[TweetYoink SW] POST error:', error);

    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return {
        success: false,
        error: `Request timed out after ${(await getConfig()).postTimeoutSeconds} seconds`,
        errorType: 'TimeoutError',
      };
    }

    if (error.name === 'TypeError') {
      return {
        success: false,
        error: 'Network request failed - check internet connection',
        errorType: 'NetworkError',
      };
    }

    return {
      success: false,
      error: error.message || 'Unknown error occurred',
      errorType: 'Error',
    };
  }
}

/**
 * Restore alarms for active polls after service worker restart
 */
async function restoreActivePolls(): Promise<void> {
  const activePolls = await getActivePolls();

  if (activePolls.length === 0) {
    return;
  }

  logger.log(`[TweetYoink Service Worker] Restoring ${activePolls.length} active polls`);

  for (const poll of activePolls) {
    const now = Date.now();

    // Calculate next poll time based on last poll + interval
    const nextPollTime = poll.lastPollTime + poll.currentIntervalMs;

    // If next poll time has passed, schedule immediately
    const when = nextPollTime > now ? nextPollTime : now + 1000;

    await chrome.alarms.create(`poll_${poll.requestId}`, { when });
  }
}
