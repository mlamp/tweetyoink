/**
 * TweetYoink Content Script
 * Feature: 002-post-view-yoink, 003-config-endpoint
 * Runs on Twitter/X pages to inject Yoink buttons and extract tweet data
 */

import { initializeButtonInjector } from './ui/button-injector';
import { disableButton, enableButton, showButtonError } from './ui/yoink-button';
import { extractTweetData } from './extractors/tweet-extractor';
import { isExtractionSuccess } from './types/tweet-data';
import { ERROR_DISPLAY_DURATION_MS } from './ui/constants';
import { postTweetData, HttpError, TimeoutError, NetworkError, ConfigError } from './services/post-service';
import { isAsyncResponse } from './types/config';

// Check if we're on Twitter or X domain
const currentDomain = window.location.hostname;
const isTwitter = currentDomain === 'twitter.com' || currentDomain === 'x.com';

if (!isTwitter) {
  console.warn('[TweetYoink] Not on Twitter/X domain:', currentDomain);
} else {
  console.log('[TweetYoink] Content script loaded on', window.location.href);

  // Initialize after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
}

/**
 * Initializes the TweetYoink extension
 */
function initialize(): void {
  console.log('[TweetYoink] Initializing...');

  // Start button injector with click handler
  initializeButtonInjector(handleYoinkClick);

  // Listen for async completion messages from service worker
  chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
    if (message.type === 'ASYNC_COMPLETED') {
      console.log('[TweetYoink] ✅ Async request completed:', message.requestId);
      console.log('[TweetYoink] Server response:', JSON.stringify(message.result, null, 2));
    }
  });
}

/**
 * Handles Yoink button click event
 * @param tweetElement - The tweet article element
 * @param button - The clicked Yoink button
 */
async function handleYoinkClick(tweetElement: Element, button: HTMLButtonElement): Promise<void> {
  console.log('[TweetYoink] Yoink button clicked');

  // Disable button during extraction and POST
  disableButton(button);

  try {
    // Extract tweet data
    const result = extractTweetData(tweetElement);

    if (!isExtractionSuccess(result)) {
      // Log error
      console.error('[TweetYoink] Extraction failed:', result.error);

      // Show error feedback
      showButtonError(button);

      // Re-enable button after error state
      setTimeout(() => enableButton(button), ERROR_DISPLAY_DURATION_MS);
      return;
    }

    // Log extracted data to console with nice formatting
    console.log('[TweetYoink] Tweet captured:', JSON.stringify(result.data, null, 2));

    // POST tweet data to configured endpoint
    try {
      const response = await postTweetData(result.data);

      if (isAsyncResponse(response)) {
        // Async response - polling will be handled automatically by service worker
        console.log('[TweetYoink] Async request initiated:', response.requestId);
        if (response.estimatedDuration) {
          console.log(`[TweetYoink] Estimated duration: ${response.estimatedDuration}s`);
        }
        console.log('[TweetYoink] Service worker will poll for results automatically');
      } else if (response.status === 'completed') {
        // Synchronous success
        console.log('[TweetYoink] Server response:', response.result);
      } else if (response.status === 'failed' || response.status === 'error') {
        // Server returned error
        console.error('[TweetYoink] Server error:', response.error);
        showButtonError(button);
        setTimeout(() => enableButton(button), ERROR_DISPLAY_DURATION_MS);
        return;
      }

      // Show success feedback (re-enable button)
      enableButton(button);

    } catch (error) {
      if (error instanceof ConfigError) {
        // No endpoint configured - just log locally (this is valid behavior)
        console.log('[TweetYoink] No endpoint configured - tweet data logged to console only');
        enableButton(button);
        return;
      } else if (error instanceof HttpError) {
        console.error(`[TweetYoink] HTTP error: ${error.message}`);
      } else if (error instanceof TimeoutError) {
        console.error(`[TweetYoink] Request timeout: ${error.message}`);
      } else if (error instanceof NetworkError) {
        console.error(`[TweetYoink] Network error: ${error.message}`);
      } else {
        console.error('[TweetYoink] POST error:', error);
      }

      // Show error feedback for POST failures
      showButtonError(button);
      setTimeout(() => enableButton(button), ERROR_DISPLAY_DURATION_MS);
    }

  } catch (error) {
    console.error('[TweetYoink] Unexpected error:', error);
    showButtonError(button);
    setTimeout(() => enableButton(button), ERROR_DISPLAY_DURATION_MS);
  }
}
