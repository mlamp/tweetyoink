/**
 * Tweet timestamp extractor
 * Feature: 002-post-view-yoink
 * Based on: specs/002-post-view-yoink/data-model.md
 */

import { SelectorFallbackChain } from './selector-fallback-chain';
import { timestampSelector } from './selectors';

/**
 * Extracts tweet timestamp from article element
 * @param tweetArticle - The tweet article element
 * @returns ISO 8601 timestamp string or null
 */
export function extractTimestamp(tweetArticle: Element): string | null {
  const result = SelectorFallbackChain.extract<string>(
    timestampSelector,
    tweetArticle
  );

  return result.value;
}
