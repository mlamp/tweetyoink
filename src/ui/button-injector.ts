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
 * 5. Track processed tweets with WeakSet (automatic garbage collection)
 */

import { createYoinkButton } from './yoink-button';
import { MUTATION_OBSERVER_THROTTLE_MS } from './constants';

/**
 * Tracks processed tweet elements to prevent duplicate button injection
 * WeakSet allows automatic garbage collection when tweets are removed from DOM
 */
const processedTweets = new WeakSet<Element>();

/**
 * Throttle state
 */
let throttleTimeout: number | null = null;
let pendingMutations: MutationRecord[] = [];

/**
 * Initializes the button injector with MutationObserver
 * @param onYoinkClick - Callback function when Yoink button is clicked
 */
export function initializeButtonInjector(
  onYoinkClick: (tweetElement: Element, button: HTMLButtonElement) => void
): void {
  console.log('[TweetYoink] Initializing button injector');

  // Process existing tweets on page load
  processExistingTweets(onYoinkClick);

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

  console.log('[TweetYoink] MutationObserver initialized');
}

/**
 * Processes existing tweets on page load
 */
function processExistingTweets(
  onYoinkClick: (tweetElement: Element, button: HTMLButtonElement) => void
): void {
  const tweetArticles = document.querySelectorAll('article[role="article"]');
  console.log(`[TweetYoink] Found ${tweetArticles.length} existing tweets`);

  tweetArticles.forEach((article) => {
    injectYoinkButton(article, onYoinkClick);
  });
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
    console.log(`[TweetYoink] Processing ${newTweets.size} new tweets`);
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
  // Skip if already processed
  if (processedTweets.has(tweetArticle)) {
    return;
  }

  // Mark as processed immediately to prevent duplicate attempts
  processedTweets.add(tweetArticle);

  // Find anchor button: "More" button (primary) or Grok button (fallback)
  const anchorButton = findAnchorButton(tweetArticle);
  if (!anchorButton) {
    console.warn('[TweetYoink] No anchor button found for tweet', tweetArticle);
    return;
  }

  // Traverse up to find action bar container
  const actionBar = findActionBarContainer(anchorButton);
  if (!actionBar) {
    console.warn('[TweetYoink] No action bar container found', anchorButton);
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

  console.log('[TweetYoink] Button injected successfully');
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
  console.log('[TweetYoink] Button injector cleaned up');
}
