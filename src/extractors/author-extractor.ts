/**
 * Author metadata extractor
 * Feature: 002-post-view-yoink, 006-add-tweet-urls
 * Based on: specs/002-post-view-yoink/data-model.md, specs/006-add-tweet-urls/data-model.md
 */

import { logger } from '../utils/logger';
import { SelectorFallbackChain } from './selector-fallback-chain';
import {
  authorHandleSelector,
  authorDisplayNameSelector,
  authorVerifiedSelector,
  authorProfileImageSelector,
} from './selectors';
import type { AuthorData } from '../types/tweet-data';
import { extractAuthorProfileUrl } from './author-url-extractor';
import { buildProfileUrl } from '../utils/url-builder';

/**
 * Extracts author metadata from tweet article element
 * @param tweetArticle - The tweet article element
 * @returns AuthorData object with handle, displayName, isVerified, profileImageUrl
 */
export function extractAuthor(tweetArticle: Element): AuthorData {
  // Extract handle
  const handleResult = SelectorFallbackChain.extract<string>(
    authorHandleSelector,
    tweetArticle
  );

  // Extract display name
  const displayNameResult = SelectorFallbackChain.extract<string>(
    authorDisplayNameSelector,
    tweetArticle
  );

  // Extract verification status
  const verifiedResult = SelectorFallbackChain.extract<string>(
    authorVerifiedSelector,
    tweetArticle
  );

  // Extract profile image URL
  const profileImageResult = SelectorFallbackChain.extract<string>(
    authorProfileImageSelector,
    tweetArticle
  );

  // Extract profile URL (Feature 006)
  let profileUrl = extractAuthorProfileUrl(tweetArticle);

  // Fallback: construct from handle if extraction failed
  if (!profileUrl && handleResult.value) {
    profileUrl = buildProfileUrl(handleResult.value);
    logger.debug('[AuthorExtractor] Constructed profile URL from handle:', profileUrl);
  }

  // Final fallback: empty string if handle also unavailable (rare edge case)
  if (!profileUrl) {
    profileUrl = '';
    logger.warn('[AuthorExtractor] Cannot determine profile URL: handle unavailable');
  }

  return {
    handle: handleResult.value,
    displayName: displayNameResult.value,
    isVerified: verifiedResult.value === 'true',
    profileImageUrl: profileImageResult.value,
    profileUrl,
  };
}
