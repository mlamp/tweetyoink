/**
 * TweetYoink Content Script
 * Feature: 002-post-view-yoink
 * Runs on Twitter/X pages to inject Yoink buttons and extract tweet data
 */

import { initializeButtonInjector } from './ui/button-injector';
import { disableButton, enableButton, showButtonError } from './ui/yoink-button';
import { extractTweetData } from './extractors/tweet-extractor';
import { isExtractionSuccess } from './types/tweet-data';
import { ERROR_DISPLAY_DURATION_MS } from './ui/constants';

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
}

/**
 * Handles Yoink button click event
 * @param tweetElement - The tweet article element
 * @param button - The clicked Yoink button
 */
function handleYoinkClick(tweetElement: Element, button: HTMLButtonElement): void {
  console.log('[TweetYoink] Yoink button clicked');

  // Disable button during extraction
  disableButton(button);

  try {
    // Extract tweet data
    const result = extractTweetData(tweetElement);

    if (isExtractionSuccess(result)) {
      // Log extracted data to console with nice formatting
      console.log('[TweetYoink] Tweet captured:', JSON.stringify(result.data, null, 2));

      // Show success feedback (re-enable button)
      enableButton(button);
    } else {
      // Log error
      console.error('[TweetYoink] Extraction failed:', result.error);

      // Show error feedback
      showButtonError(button);

      // Re-enable button after error state
      setTimeout(() => enableButton(button), ERROR_DISPLAY_DURATION_MS);
    }
  } catch (error) {
    console.error('[TweetYoink] Unexpected error:', error);
    showButtonError(button);
    setTimeout(() => enableButton(button), ERROR_DISPLAY_DURATION_MS);
  }
}
