# Quickstart Guide: Add Tweet and Author URLs

**Feature**: 006-add-tweet-urls
**Date**: 2025-11-01
**For**: Developers implementing URL field additions

## Overview

This feature adds two URL fields to the TweetData schema:
1. **Tweet URL** (`url`): Direct permalink to the tweet
2. **Author Profile URL** (`profileUrl`): Link to the author's profile

**Key Points**:
- Tweet URL extraction is already implemented (Feature 002)
- Author profile URL extraction needs implementation
- Both fields are required (non-nullable) with fallback construction
- Defensive extraction ensures 100% field population

## What's Changing

### TypeScript Interfaces

**AuthorData** (`src/types/tweet-data.ts`):
```typescript
export interface AuthorData {
  handle: string | null;
  displayName: string | null;
  isVerified: boolean;
  profileImageUrl: string | null;
  profileUrl: string;  // NEW: required field
}
```

**TweetData** (`src/types/tweet-data.ts`):
```typescript
export interface TweetData {
  text: string | null;
  url: string;  // CHANGED: from string | null to string (required)
  author: AuthorData;  // Now includes profileUrl
  // ... other fields
}
```

### New Files to Create

1. **`src/utils/url-builder.ts`**: URL construction utilities
2. **`src/extractors/author-url-extractor.ts`**: Profile URL extraction logic

### Files to Update

1. **`src/types/tweet-data.ts`**: Add `profileUrl` to AuthorData, make `url` required
2. **`src/extractors/selectors.ts`**: Add `authorProfileUrlSelector`
3. **`src/extractors/author-extractor.ts`**: Add profile URL extraction
4. **`src/extractors/url-extractor.ts`**: Make return type non-nullable

## Implementation Steps

### Step 1: Update TypeScript Interfaces

**File**: `src/types/tweet-data.ts`

```typescript
// Line ~14 - Add profileUrl to AuthorData
export interface AuthorData {
  handle: string | null;
  displayName: string | null;
  isVerified: boolean;
  profileImageUrl: string | null;
  profileUrl: string;  // ADD THIS LINE
}

// Line ~84 - Change url from string | null to string
export interface TweetData {
  text: string | null;
  url: string;  // CHANGE: remove | null
  author: AuthorData;
  // ...
}
```

### Step 2: Create URL Builder Utilities

**File**: `src/utils/url-builder.ts` (new file)

See [`data-model.md`](./data-model.md#new-utilities) for full implementation.

**Key Functions**:
- `buildTweetUrl(handle, tweetId)` - Construct tweet permalink
- `buildProfileUrl(handle)` - Construct author profile URL
- `validateTwitterUrl(url)` - Validate URL format

### Step 3: Create Author URL Extractor

**File**: `src/extractors/author-url-extractor.ts` (new file)

```typescript
import { logger } from '../utils/logger';
import { SelectorFallbackChain } from './selector-fallback-chain';
import { authorProfileUrlSelector } from './selectors';

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

### Step 4: Add Selector Configuration

**File**: `src/extractors/selectors.ts`

Add this selector after existing selectors:

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

      const match = href.match(/^\/([A-Za-z0-9_]{1,15})$/);
      if (!match) return null;

      return `https://x.com${href}`;
    },
    validator: (value) => /^https:\/\/x\.com\/[A-Za-z0-9_]{1,15}$/.test(value),
    confidence: 0.95,
  },
  secondary: {
    selector: 'article[role="article"] a[href^="/"][href*="/"]',
    type: 'css',
    extractor: (el) => {
      const href = el.getAttribute('href');
      if (!href) return null;

      const match = href.match(/^\/([A-Za-z0-9_]{1,15})$/);
      if (!match) return null;

      const parent = el.closest('[data-testid="User-Name"], [data-testid="Tweet-User-Avatar"]');
      if (!parent) return null;

      return `https://x.com${href}`;
    },
    validator: (value) => /^https:\/\/x\.com\/[A-Za-z0-9_]{1,15}$/.test(value),
    confidence: 0.85,
  },
  tertiary: null,
};
```

### Step 5: Update Author Extractor

**File**: `src/extractors/author-extractor.ts`

```typescript
// Add imports at top
import { extractAuthorProfileUrl } from './author-url-extractor';
import { buildProfileUrl } from '../utils/url-builder';

// In extractAuthor() function, before return statement:
export function extractAuthor(tweetArticle: Element): AuthorData {
  // ... existing extraction logic ...

  // Extract profile URL (new)
  let profileUrl = extractAuthorProfileUrl(tweetArticle);

  // Fallback: construct from handle if extraction failed
  if (!profileUrl && handle) {
    profileUrl = buildProfileUrl(handle);
    logger.debug('[AuthorExtractor] Constructed profile URL from handle:', profileUrl);
  }

  // Final fallback: empty string if handle unavailable
  if (!profileUrl) {
    profileUrl = '';
    logger.warn('[AuthorExtractor] Cannot determine profile URL: handle unavailable');
  }

  return {
    handle,
    displayName,
    isVerified,
    profileImageUrl,
    profileUrl,  // Add this field
  };
}
```

### Step 6: Update Tweet URL Extractor (Optional)

**File**: `src/extractors/url-extractor.ts`

Change return type and add final fallback:

```typescript
// Change return type from string | null to string
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

  // Fallback: empty string instead of null
  logger.warn('[UrlExtractor] Cannot determine tweet URL: all strategies failed');
  return '';
}
```

## Testing Your Implementation

### 1. Type Checking

```bash
npm run type-check
```

**Expected**: Zero TypeScript errors

**Common Issues**:
- "Property 'profileUrl' is missing in type 'AuthorData'" → Add profileUrl to interface
- "Type 'string | null' is not assignable to type 'string'" → Update url field type

### 2. Manual Testing

#### Test Case 1: Regular Tweet
1. Build extension: `npm run build:dev`
2. Reload extension in Chrome
3. Navigate to Twitter/X
4. Click Yoink on a regular tweet
5. Check console output:
   ```json
   {
     "url": "https://x.com/username/status/1234567890",
     "author": {
       "handle": "username",
       "profileUrl": "https://x.com/username"
     }
   }
   ```

#### Test Case 2: Quote Tweet
1. Click Yoink on a quote tweet
2. Verify both main and parent authors have `profileUrl`:
   ```json
   {
     "author": {
       "profileUrl": "https://x.com/mainuser"
     },
     "parent": {
       "author": {
         "profileUrl": "https://x.com/quoteduser"
       }
     }
   }
   ```

#### Test Case 3: Fallback Construction
1. Open DevTools → Elements tab
2. Find and delete the User-Name link element
3. Click Yoink
4. Verify profileUrl still present (constructed from handle):
   ```
   [AuthorExtractor] Constructed profile URL from handle: https://x.com/username
   ```

### 3. URL Validation

Test each captured tweet:
1. Copy `url` value from console
2. Paste in browser address bar
3. Verify it navigates to the original tweet

Test each author:
1. Copy `profileUrl` value
2. Paste in browser
3. Verify it navigates to author's profile

## Common Patterns

### Accessing URLs in Code

```typescript
// Tweet URL
const tweetUrl: string = tweetData.url;

// Author profile URL
const authorProfileUrl: string = tweetData.author.profileUrl;

// Parent tweet author (quote tweets)
const parentAuthorUrl: string | undefined = tweetData.parent?.author.profileUrl;
```

### Constructing URLs Manually

```typescript
import { buildTweetUrl, buildProfileUrl } from '../utils/url-builder';

// Build tweet URL
const url = buildTweetUrl('ExxAlerts', '1984307746691318153');
// Returns: "https://x.com/ExxAlerts/status/1984307746691318153"

// Build profile URL
const profileUrl = buildProfileUrl('ExxAlerts');
// Returns: "https://x.com/ExxAlerts"
```

### Validating URLs

```typescript
import { validateTwitterUrl } from '../utils/url-builder';

const isValid = validateTwitterUrl('https://x.com/user/status/123');
// Returns: true (valid tweet permalink)

const isValid2 = validateTwitterUrl('https://x.com/user');
// Returns: true (valid profile URL)

const isValid3 = validateTwitterUrl('https://example.com');
// Returns: false (not a Twitter/X URL)
```

## Troubleshooting

### Issue: TypeScript Error "Property 'profileUrl' does not exist on type 'AuthorData'"

**Solution**: Update `AuthorData` interface in `src/types/tweet-data.ts`:
```typescript
export interface AuthorData {
  // ... existing fields
  profileUrl: string;  // Add this
}
```

### Issue: URL Field is Empty String

**Symptoms**: `tweetData.url === ""` or `author.profileUrl === ""`

**Diagnosis**:
1. Check console for extraction warnings:
   ```
   [UrlExtractor] Failed to extract URL
   [AuthorExtractor] Cannot determine profile URL: handle unavailable
   ```

2. Check if handle/tweetId extraction succeeded:
   ```typescript
   console.log('Handle:', tweetData.author.handle);
   console.log('URL:', tweetData.url);
   ```

**Solution**:
- If handle is null → Handle extraction is broken (separate issue)
- If handle exists but URL empty → Check fallback construction logic

### Issue: URL Format Invalid (Missing x.com)

**Symptoms**: URL is `/username/status/123` instead of `https://x.com/username/status/123`

**Solution**: Ensure URL builder prepends domain:
```typescript
return `https://x.com${href}`;  // Correct
// NOT: return href;  // Wrong
```

### Issue: Parent Tweet Missing profileUrl

**Symptoms**: Quote tweet parent has no `profileUrl` field

**Diagnosis**: Check if author extraction is recursive:
```typescript
if (tweetType.isQuote) {
  const quotedTweetData = extractTweetData(quotedTweetElement);  // Should include profileUrl
}
```

**Solution**: Ensure `extractAuthor()` is called for parent tweets

## Next Steps

After implementation:
1. Run `/speckit.tasks` to generate task breakdown
2. Follow tasks in dependency order
3. Test each task completion before moving to next
4. Commit changes with both TypeScript and contract updates together

## Resources

- **Feature Spec**: [`spec.md`](./spec.md)
- **Implementation Plan**: [`plan.md`](./plan.md)
- **Data Model**: [`data-model.md`](./data-model.md)
- **Research**: [`research.md`](./research.md)
- **API Contract**: [`../../003-config-endpoint/contracts/async-response-api.yaml`](../../003-config-endpoint/contracts/async-response-api.yaml)
