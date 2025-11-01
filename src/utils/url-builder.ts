import { logger } from './logger';

/**
 * URL Builder Utilities for Twitter/X URLs
 * Feature: 006-add-tweet-urls
 *
 * Provides defensive URL construction with validation
 */

/**
 * Build tweet permalink URL from handle and tweet ID
 *
 * @param handle - Twitter handle (without @)
 * @param tweetId - Tweet ID (numeric string)
 * @returns Full tweet URL or empty string if inputs invalid
 */
export function buildTweetUrl(handle: string | null, tweetId: string | null): string {
  if (!handle || !tweetId) {
    logger.debug('[UrlBuilder] Cannot build tweet URL: missing handle or tweetId');
    return '';
  }

  // Validate handle format (1-15 alphanumeric + underscore)
  if (!/^[A-Za-z0-9_]{1,15}$/.test(handle)) {
    logger.warn('[UrlBuilder] Invalid handle format:', handle);
    return '';
  }

  // Validate tweet ID format (numeric)
  if (!/^\d+$/.test(tweetId)) {
    logger.warn('[UrlBuilder] Invalid tweet ID format:', tweetId);
    return '';
  }

  return `https://x.com/${handle}/status/${tweetId}`;
}

/**
 * Build author profile URL from handle
 *
 * @param handle - Twitter handle (without @)
 * @returns Full profile URL or empty string if handle invalid
 */
export function buildProfileUrl(handle: string | null): string {
  if (!handle) {
    logger.debug('[UrlBuilder] Cannot build profile URL: missing handle');
    return '';
  }

  // Validate handle format (1-15 alphanumeric + underscore)
  if (!/^[A-Za-z0-9_]{1,15}$/.test(handle)) {
    logger.warn('[UrlBuilder] Invalid handle format:', handle);
    return '';
  }

  return `https://x.com/${handle}`;
}

/**
 * Validate Twitter/X URL format
 *
 * @param url - URL to validate
 * @returns True if valid Twitter/X URL format
 */
export function validateTwitterUrl(url: string): boolean {
  // Match tweet permalink or profile URL
  const tweetUrlPattern = /^https:\/\/x\.com\/[A-Za-z0-9_]{1,15}\/status\/\d+$/;
  const profileUrlPattern = /^https:\/\/x\.com\/[A-Za-z0-9_]{1,15}$/;

  return tweetUrlPattern.test(url) || profileUrlPattern.test(url);
}

/**
 * Extract handle from tweet URL
 *
 * @param tweetUrl - Full tweet URL
 * @returns Handle or null if extraction fails
 */
export function extractHandleFromTweetUrl(tweetUrl: string): string | null {
  const match = tweetUrl.match(/^https:\/\/x\.com\/([A-Za-z0-9_]{1,15})\/status\/\d+$/);
  return match ? match[1] : null;
}

/**
 * Extract tweet ID from tweet URL
 *
 * @param tweetUrl - Full tweet URL
 * @returns Tweet ID or null if extraction fails
 */
export function extractTweetIdFromUrl(tweetUrl: string): string | null {
  const match = tweetUrl.match(/^https:\/\/x\.com\/[A-Za-z0-9_]{1,15}\/status\/(\d+)$/);
  return match ? match[1] : null;
}
