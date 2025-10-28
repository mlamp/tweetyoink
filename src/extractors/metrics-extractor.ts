/**
 * Engagement metrics extractor
 * Feature: 002-post-view-yoink
 * Based on: specs/002-post-view-yoink/data-model.md
 */

import { SelectorFallbackChain } from './selector-fallback-chain';
import {
  replyCountSelector,
  retweetCountSelector,
  likeCountSelector,
  bookmarkCountSelector,
  viewCountSelector,
} from './selectors';
import { parseMetricCount } from './confidence';
import type { MetricsData } from '../types/tweet-data';

/**
 * Extracts engagement metrics from tweet article element
 * @param tweetArticle - The tweet article element
 * @returns MetricsData object with reply, retweet, like, bookmark, and view counts
 */
export function extractMetrics(tweetArticle: Element): MetricsData {
  // Extract reply count
  const replyResult = SelectorFallbackChain.extract<string>(
    replyCountSelector,
    tweetArticle
  );

  // Extract retweet count
  const retweetResult = SelectorFallbackChain.extract<string>(
    retweetCountSelector,
    tweetArticle
  );

  // Extract like count
  const likeResult = SelectorFallbackChain.extract<string>(
    likeCountSelector,
    tweetArticle
  );

  // Extract bookmark count
  const bookmarkResult = SelectorFallbackChain.extract<string>(
    bookmarkCountSelector,
    tweetArticle
  );

  // Extract view count
  const viewResult = SelectorFallbackChain.extract<string>(
    viewCountSelector,
    tweetArticle
  );

  return {
    replyCount: parseMetricCount(replyResult.value),
    retweetCount: parseMetricCount(retweetResult.value),
    likeCount: parseMetricCount(likeResult.value),
    bookmarkCount: parseMetricCount(bookmarkResult.value),
    viewCount: parseMetricCount(viewResult.value),
  };
}
