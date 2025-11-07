# Data Model: Post View Yoink

**Feature**: 002-post-view-yoink
**Created**: 2025-10-24
**Status**: Phase 1 Design

## Overview

This document defines the TypeScript interfaces and types for tweet extraction, button state management, and selector configuration. All entities support defensive extraction with null handling and confidence scoring.

## Core Entities

### TweetData

Primary data structure representing extracted tweet information with nested objects for logical grouping.

```typescript
interface TweetData {
  // Tweet content
  text: string | null;

  // Author information
  author: AuthorData;

  // Temporal data
  timestamp: string | null; // ISO 8601 format or null

  // Engagement metrics
  metrics: MetricsData;

  // Media content
  media: MediaData[];

  // Link preview
  linkCard: LinkCardData | null;

  // Tweet classification
  tweetType: TweetTypeFlags;

  // Parent/quoted tweet (recursive)
  parent: TweetData | null;

  // Extraction quality metadata
  metadata: ExtractionMetadata;
}
```

**Validation Rules**:
- `text`: Required for confidence > 0.5, max length 4000 characters
- `author.handle`: Required for confidence > 0.7, must match pattern `^[A-Za-z0-9_]{1,15}$`
- `timestamp`: Must be valid ISO 8601 or null
- `metrics`: Object must always exist, individual counts can be null
- `metadata.confidence`: Range 0.0 to 1.0 inclusive

**State Transitions**: Immutable after extraction (create new object for updates)

---

### AuthorData

Nested object within TweetData containing author profile information.

```typescript
interface AuthorData {
  handle: string | null;          // Username without @ (e.g., "TestUser123")
  displayName: string | null;     // Full display name (e.g., "Test User Account")
  isVerified: boolean;            // True if verified badge present
  profileImageUrl: string | null; // Avatar image URL
}
```

**Validation Rules**:
- `handle`: Must not include @ prefix, alphanumeric + underscore only
- `displayName`: Max length 50 characters, Unicode supported
- `isVerified`: Defaults to false if extraction fails
- `profileImageUrl`: Must be valid URL or null

---

### MetricsData

Nested object within TweetData containing engagement counts.

```typescript
interface MetricsData {
  replyCount: number | null;
  retweetCount: number | null;
  likeCount: number | null;
  bookmarkCount: number | null;
  viewCount: number | null;
}
```

**Validation Rules**:
- All counts: >= 0 or null (negative values coerced to null)
- Missing metrics: Set to null instead of 0 to distinguish "no data" from "zero engagement"
- Large numbers: Support millions+ (formatted with K/M suffixes in X/Twitter, extract raw number)

---

### MediaData

Array element representing a single media attachment (image, video, GIF).

```typescript
interface MediaData {
  type: 'image' | 'video' | 'gif';
  url: string;                  // Primary media URL (may be blob: URL)
  thumbnailUrl: string | null;  // Thumbnail for videos (may be blob: URL)
  altText: string | null;       // Accessibility alt text
  width: number | null;         // Native width in pixels
  height: number | null;        // Native height in pixels
}
```

**Validation Rules**:
- `type`: Must be one of three literal types
- `url`: Required (non-null), must be valid URL (http://, https://, or blob:)
- `thumbnailUrl`: Required for type='video', optional for others (http://, https://, or blob:)
- `altText`: Preserve exactly as provided (don't generate if missing)
- `width`/`height`: Extract from DOM attributes if available

**Chrome Extension Reality**:
- Media captured from Twitter's DOM often uses `blob:` URLs (e.g., `blob:https://x.com/abc-123`)
- Blob URLs are browser-generated temporary references to media data in memory
- Servers receiving this data should be aware that blob: URLs cannot be fetched server-side
- For server processing, consider extracting base64 data or requesting alt URLs

---

### LinkCardData

Nested object within TweetData representing link preview card.

```typescript
interface LinkCardData {
  url: string;              // Destination URL
  title: string | null;     // Card title
  description: string | null; // Card description
  imageUrl: string | null;  // Card preview image
  domain: string | null;    // Display domain (e.g., "whitehouse.gov")
}
```

**Validation Rules**:
- `url`: Required (if LinkCardData exists), must be valid URL
- `title`: Max length 200 characters
- `description`: Max length 500 characters
- Entire object is `null` if no link card detected (not empty object)

---

### TweetTypeFlags

Nested object within TweetData indicating tweet classification.

```typescript
interface TweetTypeFlags {
  isRetweet: boolean;
  isQuote: boolean;
  isReply: boolean;
}
```

**Validation Rules**:
- All flags default to `false` if extraction fails
- Flags are not mutually exclusive (a quoted retweet is possible)
- If `isQuote` or `isReply` is true, `parent` field should be populated

---

### ExtractionMetadata

Nested object within TweetData tracking extraction quality and provenance.

```typescript
interface ExtractionMetadata {
  confidence: number;           // 0.0 to 1.0
  capturedAt: string;           // ISO 8601 timestamp of capture
  extractionTier: ExtractionTier; // Which selector tier succeeded
  warnings: string[];           // List of non-fatal issues
  duration: number;             // Extraction time in milliseconds
}
```

**Validation Rules**:
- `confidence`: Calculated based on selector tiers used and field success rates
- `capturedAt`: Generated at extraction time, not from tweet timestamp
- `extractionTier`: Enum tracking primary/secondary/tertiary usage
- `warnings`: Empty array if no issues, append messages for partial failures
- `duration`: Extraction performance metric for monitoring

---

### ExtractionResult

Wrapper containing TweetData plus extraction outcome metadata.

```typescript
interface ExtractionResult {
  success: boolean;
  data: TweetData | null;
  error: ExtractionError | null;
}

interface ExtractionError {
  code: string;              // Error code (e.g., "SELECTOR_FAILURE")
  message: string;           // Human-readable error
  failedFields: string[];    // List of fields that failed extraction
  context: Record<string, unknown>; // Additional debug info
}
```

**State Transitions**:
- Success path: `success=true`, `data` populated, `error=null`
- Partial success: `success=true`, `data` populated with nulls, `error` contains warnings
- Complete failure: `success=false`, `data=null`, `error` describes failure

---

## Selector Configuration

### SelectorConfig

Defines the three-tier fallback selector strategy for each field.

```typescript
interface SelectorConfig {
  primary: SelectorStrategy;
  secondary: SelectorStrategy | null;
  tertiary: SelectorStrategy | null;
}

interface SelectorStrategy {
  selector: string;                // CSS selector or XPath
  type: 'css' | 'xpath' | 'text';  // Selector type
  extractor: (element: Element) => string | null; // Extraction function
  validator?: (value: string) => boolean; // Optional validation
  confidence: number;              // Base confidence score (0.0-1.0)
}
```

**Validation Rules**:
- At least `primary` must be defined (secondary/tertiary optional)
- `confidence` values: primary ≥ 0.90, secondary 0.60-0.85, tertiary 0.40-0.60
- `extractor` must handle null/undefined gracefully

**Selector Priority**:
1. Primary: data-testid attributes (confidence 0.95-1.0)
2. Secondary: aria-label + role (confidence 0.70-0.85)
3. Tertiary: structural patterns (confidence 0.40-0.60)

---

## Button State Management

### ButtonState

Tracks lifecycle of injected Yoink button for a specific tweet.

```typescript
interface ButtonState {
  tweetId: string;              // Unique identifier for tweet
  status: ButtonStatus;
  element: HTMLButtonElement | null;
  injectedAt: number;           // Performance.now() timestamp
  lastInteraction: number | null; // Last click timestamp
}

type ButtonStatus =
  | 'not-injected'
  | 'injecting'
  | 'ready'
  | 'capturing'
  | 'error';
```

**State Transitions**:
```
not-injected → injecting → ready
                ↓
              error → ready (retry)

ready → capturing → ready (success)
              ↓
            error → ready (failure)
```

**Validation Rules**:
- `tweetId`: Must be unique per tweet, extracted from DOM or URL
- `status`: Must follow state transition rules (no skipping states)
- `element`: Non-null when status is 'ready', 'capturing', or 'error'
- `injectedAt`: Used for performance monitoring (target < 500ms)

---

## Confidence Score Calculation

### Algorithm

```typescript
function calculateConfidence(result: FieldExtractionResult[]): number {
  const weights = {
    text: 0.30,        // Critical field
    author: 0.25,      // Critical field
    timestamp: 0.15,
    metrics: 0.10,
    media: 0.10,
    linkCard: 0.05,
    tweetType: 0.05
  };

  let totalScore = 0;

  for (const field of result) {
    const weight = weights[field.name];
    const tierMultiplier = field.tier === 'primary' ? 1.0
                         : field.tier === 'secondary' ? 0.75
                         : 0.50; // tertiary

    const fieldScore = field.extracted
      ? weight * tierMultiplier
      : 0;

    totalScore += fieldScore;
  }

  return Math.max(0, Math.min(1, totalScore));
}
```

**Thresholds**:
- **≥ 0.90**: Excellent quality (all primary selectors)
- **0.70-0.89**: Good quality (some secondary selectors)
- **0.50-0.69**: Acceptable quality (some tertiary selectors)
- **< 0.50**: Poor quality (many failures or critical fields missing)

---

## Type Guards

Utility functions for runtime type checking:

```typescript
function isTweetData(value: unknown): value is TweetData {
  return (
    typeof value === 'object' &&
    value !== null &&
    'text' in value &&
    'author' in value &&
    'metadata' in value
  );
}

function isExtractionSuccess(result: ExtractionResult): result is ExtractionResult & { data: TweetData } {
  return result.success && result.data !== null;
}
```

---

## Implementation Notes

### Memory Management

- Use `WeakMap<HTMLElement, ButtonState>` for button tracking (automatic garbage collection)
- Dispose of large `TweetData` objects after console logging (no retention)
- Clear `warnings` arrays after logging to prevent memory accumulation

### Null Handling Strategy

All extractors follow this pattern:
```typescript
function extractField(element: Element): string | null {
  try {
    const value = element.querySelector(selector)?.textContent?.trim();
    return value || null; // Coerce empty string to null
  } catch (error) {
    logWarning('Extraction failed', { selector, error });
    return null; // Never throw
  }
}
```

### TypeScript Strict Mode Compliance

- All interfaces use explicit `| null` for nullable fields
- No `any` types (use `unknown` for dynamic data, then type guard)
- Discriminated unions for `ExtractionResult` (success boolean discriminator)
- Exhaustive `switch` on `ButtonStatus` enum

---

## Testing Validation

### Unit Test Requirements

1. **TweetData validation**:
   - Confidence score ranges
   - Handle format validation
   - Timestamp ISO 8601 parsing
   - Nested object null handling

2. **Selector fallback chain**:
   - Primary → secondary → tertiary progression
   - Null return on complete failure
   - Confidence score adjustment per tier

3. **Button state transitions**:
   - Valid transitions only
   - No stuck states (always reachable 'ready')
   - Error recovery paths

### Integration Test Requirements

1. Test against `tests/fixtures/x-tweet-sample.html`:
   - Extract all fields using primary selectors
   - Verify nested structure matches TweetData interface
   - Confidence score should be 0.95+ for fixture

2. Simulate selector failures:
   - Remove `data-testid` attributes → fallback to secondary
   - Remove ARIA labels → fallback to tertiary
   - Verify confidence score drops appropriately

---

## Appendix: Example JSON Output

```json
{
  "text": "Democrat Shutdown Jeopardizes America's Skies",
  "author": {
    "handle": "TestUser123",
    "displayName": "Test User Account",
    "isVerified": true,
    "profileImageUrl": "https://pbs.twimg.com/profile_images/placeholder/avatar_placeholder.jpg"
  },
  "timestamp": "2025-10-23T16:34:09.000Z",
  "metrics": {
    "replyCount": 48,
    "retweetCount": 152,
    "likeCount": 553,
    "bookmarkCount": 9,
    "viewCount": 29900
  },
  "media": [],
  "linkCard": {
    "url": "https://t.co/xYHSw5Tm00",
    "title": "Democrat Shutdown Jeopardizes America's Skies",
    "description": null,
    "imageUrl": "https://pbs.twimg.com/card_img/1981050662210150400/oKLIYfJv?format=jpg&name=medium",
    "domain": "whitehouse.gov"
  },
  "tweetType": {
    "isRetweet": false,
    "isQuote": false,
    "isReply": false
  },
  "parent": null,
  "metadata": {
    "confidence": 0.98,
    "capturedAt": "2025-10-24T10:15:30.123Z",
    "extractionTier": "primary",
    "warnings": [],
    "duration": 45
  }
}
```
