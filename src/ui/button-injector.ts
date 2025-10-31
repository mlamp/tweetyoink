import { logger } from '../utils/logger';

/**
 * Button injection logic with MutationObserver
 * Feature: 002-post-view-yoink
 * Based on: specs/002-post-view-yoink/research.md
 *
 * Strategy:
 * 1. Observe DOM for new tweet article elements
 * 2. Find "More" button (primary) or Grok button (fallback) as anchor
 * 3. Traverse up to find action bar container
 * 4. Inject Yoink button as first child (leftmost position)
 * 5. Mark processed tweets with data attribute for efficient skipping
 */

import { createYoinkButton } from './yoink-button';
import { MUTATION_OBSERVER_THROTTLE_MS } from './constants';

/**
 * Data attribute used to mark tweets that have been processed
 * This allows efficient DOM queries to skip already-processed tweets
 */
const PROCESSED_MARKER = 'data-tweetyoink-processed';

/**
 * Throttle state
 */
let throttleTimeout: number | null = null;
let pendingMutations: MutationRecord[] = [];

/**
 * Initializes the button injector with MutationObserver and interval-based retry
 * @param onYoinkClick - Callback function when Yoink button is clicked
 */
export function initializeButtonInjector(
  onYoinkClick: (tweetElement: Element, button: HTMLButtonElement) => void
): void {
  logger.log('[TweetYoink] Initializing button injector');

  // Initial processing with delay to allow Twitter to render
  setTimeout(() => {
    processExistingTweets(onYoinkClick);
  }, 500);

  // Set up interval-based retry to catch late-rendering tweets
  // Using data attribute markers ensures minimal performance impact
  setInterval(() => {
    processExistingTweets(onYoinkClick);
  }, 2000);

  // Set up MutationObserver for dynamically loaded tweets
  const observer = new MutationObserver((mutations) => {
    // Accumulate mutations for throttled processing
    pendingMutations.push(...mutations);

    if (throttleTimeout !== null) {
      return; // Already scheduled
    }

    throttleTimeout = window.setTimeout(() => {
      processPendingMutations(onYoinkClick);
      pendingMutations = [];
      throttleTimeout = null;
    }, MUTATION_OBSERVER_THROTTLE_MS);
  });

  // Observe the main timeline container
  const targetContainer = document.body;
  observer.observe(targetContainer, {
    childList: true,    // Watch for child additions/removals
    subtree: true,      // Watch entire subtree (REQUIRED for dynamic tweets)
    attributes: false,  // Exclude attributes for performance
  });

  logger.log('[TweetYoink] MutationObserver initialized');
}

/**
 * Processes existing tweets on page load
 * Uses data attribute to efficiently skip already-processed tweets
 */
function processExistingTweets(
  onYoinkClick: (tweetElement: Element, button: HTMLButtonElement) => void
): void {
  // Query only unprocessed tweets using NOT selector for efficiency
  const unprocessedTweets = document.querySelectorAll(`article[role="article"]:not([${PROCESSED_MARKER}])`);

  if (unprocessedTweets.length > 0) {
    logger.log(`[TweetYoink] Found ${unprocessedTweets.length} unprocessed tweets`);

    unprocessedTweets.forEach((article) => {
      injectYoinkButton(article, onYoinkClick);
    });
  }
}

/**
 * Processes accumulated mutations in throttled batch
 */
function processPendingMutations(
  onYoinkClick: (tweetElement: Element, button: HTMLButtonElement) => void
): void {
  const newTweets = new Set<Element>();

  for (const mutation of pendingMutations) {
    mutation.addedNodes.forEach((node) => {
      if (!(node instanceof Element)) return;

      // Check if node itself is a tweet article
      if (node.matches('article[role="article"]')) {
        newTweets.add(node);
      }

      // Check for tweet articles within added node
      const articles = node.querySelectorAll('article[role="article"]');
      articles.forEach((article) => {
        newTweets.add(article);
      });
    });
  }

  if (newTweets.size > 0) {
    logger.log(`[TweetYoink] Processing ${newTweets.size} new tweets`);
    for (const article of newTweets) {
      injectYoinkButton(article, onYoinkClick);
    }
  }
}

/**
 * Injects Yoink button into a tweet article element
 * @param tweetArticle - The tweet article element
 * @param onYoinkClick - Callback function when button is clicked
 */
export function injectYoinkButton(
  tweetArticle: Element,
  onYoinkClick: (tweetElement: Element, button: HTMLButtonElement) => void
): void {
  // Skip if already processed (check data attribute)
  if (tweetArticle.hasAttribute(PROCESSED_MARKER)) {
    return;
  }

  // Mark as processed immediately to prevent duplicate attempts during same cycle
  tweetArticle.setAttribute(PROCESSED_MARKER, 'true');

  // Find anchor button: "More" button (primary) or Grok button (fallback)
  const anchorButton = findAnchorButton(tweetArticle);
  if (!anchorButton) {
    logger.debug('[TweetYoink] No anchor button found for tweet', tweetArticle);
    // Remove marker so we can retry later when button renders
    tweetArticle.removeAttribute(PROCESSED_MARKER);
    return;
  }

  // Traverse up to find action bar container
  const actionBar = findActionBarContainer(anchorButton);
  if (!actionBar) {
    logger.debug('[TweetYoink] No action bar container found', anchorButton);
    // Remove marker so we can retry later
    tweetArticle.removeAttribute(PROCESSED_MARKER);
    return;
  }

  // Create Yoink button
  const yoinkButton = createYoinkButton();

  // Attach click handler
  yoinkButton.addEventListener('click', (event) => {
    event.stopPropagation(); // Prevent tweet navigation
    event.preventDefault();
    onYoinkClick(tweetArticle, yoinkButton);
  });

  // Inject as first child (leftmost position)
  if (actionBar.firstChild) {
    actionBar.insertBefore(yoinkButton, actionBar.firstChild);
  } else {
    actionBar.appendChild(yoinkButton);
  }

  logger.log('[TweetYoink] Button injected successfully');
  // Marker stays on element to prevent future processing
}

/**
 * Finds the anchor button for positioning
 * Priority: "More" button (three dots) → Grok button
 * @param tweetArticle - The tweet article element
 * @returns Anchor button element or null
 */
function findAnchorButton(tweetArticle: Element): Element | null {
  // Primary: "More" button (three dots menu)
  // Selector from spec clarifications: [aria-label="More"][role="button"]
  const moreButton = tweetArticle.querySelector('[aria-label="More"][role="button"]');
  if (moreButton) {
    return moreButton;
  }

  // Fallback: Grok button
  // Note: Grok button selector may vary - using aria-label pattern
  const grokButton = tweetArticle.querySelector('[aria-label*="Grok"][role="button"]');
  if (grokButton) {
    return grokButton;
  }

  return null;
}

/**
 * Traverses up from anchor button to find action bar container
 * Action bar is the container holding all action buttons (reply, retweet, like, etc.)
 * @param anchorButton - The anchor button element
 * @returns Action bar container element or null
 */
function findActionBarContainer(anchorButton: Element): Element | null {
  // Traverse up to find the container with role="group" (typical action bar container)
  let current: Element | null = anchorButton;

  for (let i = 0; i < 5; i++) {
    // Max 5 levels up
    current = current.parentElement;
    if (!current) break;

    // Look for container with multiple button children (action bar pattern)
    const buttonChildren = current.querySelectorAll('[role="button"]');
    if (buttonChildren.length >= 3) {
      // Likely the action bar (has reply, retweet, like, etc.)
      return current;
    }

    // Also check for role="group"
    if (current.getAttribute('role') === 'group') {
      return current;
    }
  }

  // Fallback: use parent element of anchor button
  return anchorButton.parentElement;
}

/**
 * Cleanup function to disconnect observer (for testing)
 */
export function cleanupButtonInjector(): void {
  if (throttleTimeout !== null) {
    clearTimeout(throttleTimeout);
    throttleTimeout = null;
  }
  pendingMutations = [];
  logger.log('[TweetYoink] Button injector cleaned up');
}
