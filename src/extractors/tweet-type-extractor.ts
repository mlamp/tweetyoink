/**
 * Tweet type detection extractor
 * Feature: 002-post-view-yoink
 * Based on: specs/002-post-view-yoink/data-model.md
 *
 * Detects if a tweet is a retweet, quote, or reply
 */

import type { TweetTypeFlags } from '../types/tweet-data';

/**
 * Extracts tweet type flags from tweet article element
 * @param tweetArticle - The tweet article element
 * @returns TweetTypeFlags object with isRetweet, isQuote, isReply
 */
export function extractTweetType(tweetArticle: Element): TweetTypeFlags {
  // Detect quote tweet: Look for "Quote" label and nested tweet structure
  const isQuote = detectQuoteTweet(tweetArticle);

  // Detect retweet: Look for retweet indicator text
  const isRetweet = detectRetweet(tweetArticle);

  // Detect reply: Look for reply indicator or "Replying to" text
  const isReply = detectReply(tweetArticle);

  return {
    isQuote,
    isRetweet,
    isReply,
  };
}

/**
 * Detects if tweet is a quote tweet
 * Quote tweets have:
 * - A "Quote" label element
 * - A nested tweet structure with role="link" container
 * - A nested User-Name data-testid inside the quote
 */
function detectQuoteTweet(tweetArticle: Element): boolean {
  // Look for "Quote" label text
  const quoteLabel = Array.from(tweetArticle.querySelectorAll('span')).find(
    (span) => span.textContent?.trim() === 'Quote'
  );

  if (!quoteLabel) {
    return false;
  }

  // Verify there's a nested tweet structure
  // Quote tweets have a nested article-like structure with User-Name testid
  const nestedUserName = tweetArticle.querySelector(
    '[role="link"] [data-testid="User-Name"]'
  );

  return nestedUserName !== null;
}

/**
 * Detects if tweet is a retweet
 * Retweets typically have "Retweeted" or retweet icon at the top
 */
function detectRetweet(tweetArticle: Element): boolean {
  // Look for retweet indicator text patterns
  const retweetIndicators = [
    'retweeted',
    'reposted',
    'You reposted',
    'You retweeted',
  ];

  const allText = tweetArticle.textContent?.toLowerCase() || '';

  for (const indicator of retweetIndicators) {
    if (allText.includes(indicator.toLowerCase())) {
      // Additional validation: check if it's not just the button text
      const spans = Array.from(tweetArticle.querySelectorAll('span'));
      const hasRetweetIndicator = spans.some((span) => {
        const text = span.textContent?.toLowerCase() || '';
        return text.includes(indicator.toLowerCase()) && text.length < 50;
      });

      if (hasRetweetIndicator) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Detects if tweet is a reply
 * Replies have "Replying to @username" text
 */
function detectReply(tweetArticle: Element): boolean {
  // Look for "Replying to" text pattern
  const spans = Array.from(tweetArticle.querySelectorAll('span'));

  const hasReplyingTo = spans.some((span) => {
    const text = span.textContent?.toLowerCase() || '';
    return text.includes('replying to');
  });

  return hasReplyingTo;
}

/**
 * Extracts the nested quoted tweet element from a quote tweet
 * @param tweetArticle - The tweet article element
 * @returns The nested tweet container element or null
 */
export function extractQuotedTweetElement(tweetArticle: Element): Element | null {
  // Quote tweets have a nested structure inside a role="link" container
  // Look for the container that has:
  // 1. role="link" and tabindex="0"
  // 2. Contains User-Name testid (the quoted tweet's author)
  // 3. Contains tweetText testid (the quoted tweet's text)

  const linkContainers = tweetArticle.querySelectorAll('[role="link"][tabindex="0"]');

  // Search through all link containers
  for (let i = 0; i < linkContainers.length; i++) {
    const container = linkContainers[i];
    const hasUserName = container.querySelector('[data-testid="User-Name"]');
    const hasTweetText = container.querySelector('[data-testid="tweetText"]');

    if (hasUserName && hasTweetText) {
      return container;
    }
  }

  return null;
}
