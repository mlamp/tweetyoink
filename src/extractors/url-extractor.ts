import { logger } from '../utils/logger';

/**
 * Tweet URL extraction module
 * Feature: 002-post-view-yoink
 * Based on: specs/002-post-view-yoink/data-model.md
 *
 * Extracts the direct URL to the tweet (e.g., https://x.com/user/status/123)
 */

import { SelectorFallbackChain } from './selector-fallback-chain';
import { tweetUrlSelector } from './selectors';

/**
 * Extract tweet URL from article element
 *
 * @param tweetArticle - The tweet article element
 * @returns Tweet URL string or null if extraction failed
 */
export function extractTweetUrl(tweetArticle: Element): string | null {
  logger.debug('[UrlExtractor] Extracting tweet URL');

  const result = SelectorFallbackChain.extract<string>(
    tweetUrlSelector,
    tweetArticle
  );

  if (result.value) {
    logger.debug('[UrlExtractor] Successfully extracted URL:', result.value);
    return result.value;
  }

  logger.debug('[UrlExtractor] Failed to extract URL');
  return null;
}
