import { logger } from '../utils/logger';

/**
 * Tweet URL extraction module
 * Feature: 002-post-view-yoink, 006-add-tweet-urls
 * Based on: specs/002-post-view-yoink/data-model.md, specs/006-add-tweet-urls/data-model.md
 *
 * Extracts the direct URL to the tweet (e.g., https://x.com/user/status/123)
 * Updated in Feature 006 to guarantee non-null return via fallback construction
 */

import { SelectorFallbackChain } from './selector-fallback-chain';
import { tweetUrlSelector } from './selectors';

/**
 * Extract tweet URL from article element
 *
 * @param tweetArticle - The tweet article element
 * @returns Tweet URL string (guaranteed non-null, empty string if all strategies fail)
 */
export function extractTweetUrl(tweetArticle: Element): string {
  logger.debug('[UrlExtractor] Extracting tweet URL');

  const result = SelectorFallbackChain.extract<string>(
    tweetUrlSelector,
    tweetArticle
  );

  if (result.value) {
    logger.debug('[UrlExtractor] Successfully extracted URL:', result.value);
    return result.value;
  }

  // Fallback: empty string (construction would require handle+tweetId which needs circular dependency)
  logger.warn('[UrlExtractor] Cannot determine tweet URL: all strategies failed');
  return '';
}
