import { logger } from '../utils/logger';
import { SelectorFallbackChain } from './selector-fallback-chain';
import { authorProfileUrlSelector } from './selectors';

/**
 * Author Profile URL Extraction Module
 * Feature: 006-add-tweet-urls
 *
 * Extracts author profile URL from tweet article element
 */

/**
 * Extract author profile URL from tweet article element
 *
 * @param tweetArticle - The tweet article element
 * @returns Profile URL string or null if extraction failed
 */
export function extractAuthorProfileUrl(tweetArticle: Element): string | null {
  logger.debug('[AuthorUrlExtractor] Extracting author profile URL');

  const result = SelectorFallbackChain.extract<string>(
    authorProfileUrlSelector,
    tweetArticle
  );

  if (result.value) {
    logger.debug('[AuthorUrlExtractor] Successfully extracted profile URL:', result.value);
    return result.value;
  }

  logger.debug('[AuthorUrlExtractor] Failed to extract profile URL');
  return null;
}
