/**
 * Tweet text content extractor
 * Feature: 002-post-view-yoink
 * Based on: specs/002-post-view-yoink/data-model.md
 */

import { SelectorFallbackChain } from './selector-fallback-chain';
import { tweetTextSelector } from './selectors';

/**
 * Extracts tweet text content from article element
 * @param tweetArticle - The tweet article element
 * @returns Extracted text or null
 */
export function extractTweetText(tweetArticle: Element): string | null {
  const result = SelectorFallbackChain.extract<string>(
    tweetTextSelector,
    tweetArticle
  );

  return result.value;
}
