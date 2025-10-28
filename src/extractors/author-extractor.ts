/**
 * Author metadata extractor
 * Feature: 002-post-view-yoink
 * Based on: specs/002-post-view-yoink/data-model.md
 */

import { SelectorFallbackChain } from './selector-fallback-chain';
import {
  authorHandleSelector,
  authorDisplayNameSelector,
  authorVerifiedSelector,
  authorProfileImageSelector,
} from './selectors';
import type { AuthorData } from '../types/tweet-data';

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

  return {
    handle: handleResult.value,
    displayName: displayNameResult.value,
    isVerified: verifiedResult.value === 'true',
    profileImageUrl: profileImageResult.value,
  };
}
