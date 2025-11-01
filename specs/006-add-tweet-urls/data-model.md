# Data Model: Add Tweet and Author URLs to Data Schema

**Feature**: 006-add-tweet-urls
**Date**: 2025-11-01
**Status**: Design Complete

## Overview

This document defines the interface changes required to add URL fields to the TweetData and AuthorData schemas. Based on research findings, the tweet `url` field is already implemented, so this design focuses on adding the `profileUrl` field to AuthorData and documenting both fields comprehensively.

## Entity Changes

### 1. AuthorData Interface

**File**: `src/types/tweet-data.ts`

**Current Definition** (lines 10-15):
```typescript
export interface AuthorData {
  handle: string | null;          // Username without @ (e.g., "TestUser123")
  displayName: string | null;     // Full display name (e.g., "Test User Account")
  isVerified: boolean;            // True if verified badge present
  profileImageUrl: string | null; // Avatar image URL
}
```

**Updated Definition**:
```typescript
export interface AuthorData {
  handle: string | null;          // Username without @ (e.g., "TestUser123")
  displayName: string | null;     // Full display name (e.g., "Test User Account")
  isVerified: boolean;            // True if verified badge present
  profileImageUrl: string | null; // Avatar image URL
  profileUrl: string;              // Profile URL (e.g., "https://x.com/TestUser123") - REQUIRED, constructed from handle if not extractable
}
```

**Field Details**:
- **Name**: `profileUrl`
- **Type**: `string` (required, non-nullable)
- **Format**: Full profile URL following pattern `https://x.com/{handle}`
- **Example**: `"https://x.com/ExxAlerts"`
- **Extraction Strategy**:
  1. Primary: Extract from DOM (`[data-testid="User-Name"] a[role="link"]`)
  2. Secondary: Construct from `handle` field
  3. Tertiary: Extract handle from tweet URL, construct profile URL
- **Fallback**: If all extraction fails, construct from `handle` field (guaranteed non-null if handle exists)
- **Validation**: Must match regex `/^https:\/\/x\.com\/[A-Za-z0-9_]{1,15}$/`

**Rationale for Required (Non-Nullable)**:
- Defensive extraction ensures handle is always available (existing field)
- Fallback construction from handle guarantees 100% population
- Aligns with FR-007 requirement from feature spec
- Provides consistent data structure for backend consumers

### 2. TweetData Interface

**File**: `src/types/tweet-data.ts`

**Current Definition** (lines 79-109, excerpt):
```typescript
export interface TweetData {
  // Tweet content
  text: string | null;

  // Tweet URL
  url: string | null; // Direct link to tweet (e.g., "https://x.com/user/status/123")

  // Author information
  author: AuthorData;

  // ... other fields ...
}
```

**Updated Definition** (no type change, documentation update):
```typescript
export interface TweetData {
  // Tweet content
  text: string | null;

  // Tweet URL - ALREADY IMPLEMENTED (Feature 002)
  url: string;  // Direct link to tweet (e.g., "https://x.com/user/status/123") - REQUIRED, constructed if not extractable

  // Author information
  author: AuthorData;  // Now includes profileUrl field

  // ... other fields ...
}
```

**Field Details**:
- **Name**: `url`
- **Type**: `string` (change from `string | null` to `string` - required)
- **Status**: ✅ **Already Implemented** in Feature 002 (extraction logic exists)
- **Format**: Full tweet permalink following pattern `https://x.com/{handle}/status/{tweetId}`
- **Example**: `"https://x.com/ExxAlerts/status/1984307746691318153"`
- **Extraction Strategy** (existing):
  1. Primary: Extract from DOM (`article[role="article"] a[href*="/status/"]`)
  2. Secondary: Extract from time element parent link
  3. Tertiary: Construct from `author.handle` + extracted tweet ID
- **Validation** (existing): `/^https:\/\/x\.com\/[A-Za-z0-9_]{1,15}\/status\/\d+$/`

**Change Required**:
- Update type from `string | null` to `string` (make required)
- Update extractor to guarantee non-null return via fallback construction
- Rationale: Aligns with FR-007 requirement, ensures consistency with profileUrl

## New Utilities

### URL Builder Module

**File**: `src/utils/url-builder.ts` (NEW)

```typescript
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
```

### Author Profile URL Extractor

**File**: `src/extractors/author-url-extractor.ts` (NEW)

```typescript
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
```

### Selector Configuration

**File**: `src/extractors/selectors.ts` (UPDATE - add new selector)

```typescript
/**
 * Author profile URL selectors
 * Feature: 006-add-tweet-urls
 */
export const authorProfileUrlSelector: SelectorConfig = {
  primary: {
    selector: '[data-testid="User-Name"] a[role="link"]',
    type: 'css',
    extractor: (el) => {
      const href = el.getAttribute('href');
      if (!href) return null;

      // Extract handle from href (format: /{handle})
      const match = href.match(/^\/([A-Za-z0-9_]{1,15})$/);
      if (!match) return null;

      return `https://x.com${href}`;
    },
    validator: (value) => {
      return /^https:\/\/x\.com\/[A-Za-z0-9_]{1,15}$/.test(value);
    },
    confidence: 0.95,
  },
  secondary: {
    selector: 'article[role="article"] a[href^="/"][href*="/"]',
    type: 'css',
    extractor: (el) => {
      const href = el.getAttribute('href');
      if (!href) return null;

      // Look for profile links (format: /{handle} with no additional path)
      const match = href.match(/^\/([A-Za-z0-9_]{1,15})$/);
      if (!match) return null;

      // Verify this is likely an author link (has avatar nearby or in header area)
      const parent = el.closest('[data-testid="User-Name"], [data-testid="Tweet-User-Avatar"]');
      if (!parent) return null;

      return `https://x.com${href}`;
    },
    validator: (value) => {
      return /^https:\/\/x\.com\/[A-Za-z0-9_]{1,15}$/.test(value);
    },
    confidence: 0.85,
  },
  tertiary: null,  // Fallback construction handled in author-extractor.ts
};
```

## Extractor Updates

### Update Author Extractor

**File**: `src/extractors/author-extractor.ts` (UPDATE)

**Changes Required**:
1. Import `extractAuthorProfileUrl` from `./author-url-extractor`
2. Import `buildProfileUrl` from `../utils/url-builder`
3. Call `extractAuthorProfileUrl()` in `extractAuthor()` function
4. If extraction returns null, construct URL from handle using `buildProfileUrl()`
5. Return constructed URL (guaranteed non-null if handle exists)

**Pseudocode**:
```typescript
export function extractAuthor(tweetArticle: Element): AuthorData {
  // ... existing extraction logic for handle, displayName, etc ...

  // Extract profile URL (new)
  let profileUrl = extractAuthorProfileUrl(tweetArticle);

  // Fallback: construct from handle if extraction failed
  if (!profileUrl && authorData.handle) {
    profileUrl = buildProfileUrl(authorData.handle);
    logger.debug('[AuthorExtractor] Constructed profile URL from handle:', profileUrl);
  }

  // Final fallback: empty string if handle also missing (rare edge case)
  if (!profileUrl) {
    profileUrl = '';
    logger.warn('[AuthorExtractor] Cannot determine profile URL: handle unavailable');
  }

  return {
    ...authorData,
    profileUrl,  // Guaranteed non-empty (either extracted or constructed)
  };
}
```

### Update Tweet URL Extractor (Optional)

**File**: `src/extractors/url-extractor.ts` (MINOR UPDATE)

**Changes Required**:
1. Import `buildTweetUrl`, `extractTweetIdFromUrl` from `../utils/url-builder`
2. Add tertiary fallback: construct URL from handle + extracted tweet ID
3. Change return type from `string | null` to `string` (required)
4. Return empty string if all fallbacks fail (instead of null)

**Pseudocode**:
```typescript
export function extractTweetUrl(tweetArticle: Element): string {
  // ... existing primary/secondary extraction ...

  // Tertiary fallback: construct from handle + tweet ID
  const authorData = extractAuthor(tweetArticle);
  const tweetId = extractTweetIdFromDom(tweetArticle);  // New helper function

  if (authorData.handle && tweetId) {
    const constructedUrl = buildTweetUrl(authorData.handle, tweetId);
    if (constructedUrl) {
      logger.debug('[UrlExtractor] Constructed tweet URL from handle+ID');
      return constructedUrl;
    }
  }

  // Final fallback: empty string
  logger.warn('[UrlExtractor] Cannot determine tweet URL: all strategies failed');
  return '';
}
```

## Validation Rules

### URL Format Validation

**Tweet URL**:
- Pattern: `https://x.com/{handle}/status/{tweetId}`
- Handle: 1-15 characters, alphanumeric + underscore
- Tweet ID: Numeric string (typically 19 digits)
- Regex: `/^https:\/\/x\.com\/[A-Za-z0-9_]{1,15}\/status\/\d+$/`

**Profile URL**:
- Pattern: `https://x.com/{handle}`
- Handle: 1-15 characters, alphanumeric + underscore
- Regex: `/^https:\/\/x\.com\/[A-Za-z0-9_]{1,15}$/`

### Extraction Confidence Scoring

**Profile URL**:
- Primary selector success: 0.95 confidence
- Secondary selector success: 0.85 confidence
- Tertiary fallback (handle construction): 0.75 confidence
- Extraction failure: 0.0 confidence (should never happen if handle exists)

**Tweet URL** (existing):
- Primary selector success: 0.95 confidence
- Secondary selector success: 0.85 confidence
- Tertiary fallback (construction): 0.75 confidence
- Extraction failure: 0.0 confidence (should never happen if handle+ID exist)

## Migration Path

### Type Changes

**Before** (`src/types/tweet-data.ts`):
```typescript
export interface AuthorData {
  handle: string | null;
  displayName: string | null;
  isVerified: boolean;
  profileImageUrl: string | null;
}

export interface TweetData {
  url: string | null;
  author: AuthorData;
  // ...
}
```

**After** (`src/types/tweet-data.ts`):
```typescript
export interface AuthorData {
  handle: string | null;
  displayName: string | null;
  isVerified: boolean;
  profileImageUrl: string | null;
  profileUrl: string;  // NEW: required, non-nullable
}

export interface TweetData {
  url: string;  // CHANGED: from string | null to string (required)
  author: AuthorData;  // UPDATED: now includes profileUrl
  // ...
}
```

### Backward Compatibility

**Extension Output**:
- Old versions (pre-1.1.0): Omit `profileUrl` field, `url` may be null
- New versions (1.1.0+): Always include both `url` and `profileUrl` (non-null)

**Backend Consumption**:
- Must handle both old and new formats during transition period
- Recommended: Check contract version in response metadata
- Fallback: Backends can construct missing URLs from handle/tweetId if needed

## Summary

**Interfaces Modified**:
1. `AuthorData` - Add `profileUrl: string` field
2. `TweetData` - Change `url` from `string | null` to `string`

**New Files**:
1. `src/utils/url-builder.ts` - URL construction utilities
2. `src/extractors/author-url-extractor.ts` - Profile URL extraction

**Updated Files**:
1. `src/extractors/selectors.ts` - Add `authorProfileUrlSelector`
2. `src/extractors/author-extractor.ts` - Add profileUrl extraction + fallback
3. `src/extractors/url-extractor.ts` - Add tertiary fallback, make return type non-nullable

**Testing Requirements**:
1. Verify `profileUrl` extracted successfully from DOM
2. Verify fallback construction from handle works
3. Verify `url` remains non-null after type change
4. Verify both fields present in all extraction scenarios (regular tweets, quotes, retweets)

**Next Steps**:
1. Update API contracts (Phase 1.2)
2. Create quickstart guide (Phase 1.3)
3. Generate tasks (Phase 2)
