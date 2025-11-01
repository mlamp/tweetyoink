# Research: Add Tweet and Author URLs to Data Schema

**Feature**: 006-add-tweet-urls
**Date**: 2025-11-01
**Status**: Complete

## Executive Summary

Research reveals that **tweet URL extraction is already implemented** in the codebase (`src/extractors/url-extractor.ts`). The `TweetData` interface already includes the `url` field. This feature primarily needs to:

1. Add `profileUrl` field to `AuthorData` interface
2. Implement author profile URL extraction logic
3. Update API contracts to reflect both fields as required
4. Ensure fallback URL construction for both fields

## Research Findings

### 1. DOM Selector Discovery

#### Tweet URL Extraction (ALREADY IMPLEMENTED)

**Status**: ✅ COMPLETE

**Existing Implementation** (`src/extractors/url-extractor.ts`):
- **Primary Selector**: `article[role="article"] a[href*="/status/"]`
  - Extracts href attribute from any link containing `/status/`
  - Pattern matches: `/({handle})/status/({tweetId})`
  - Constructs full URL: `https://x.com{href}`
  - Confidence: 0.95

- **Secondary Selector**: `time[datetime]`
  - Navigates up from time element to find parent link (up to 5 levels)
  - Searches for `<a>` tag with href containing `/status/`
  - Constructs full URL: `https://x.com{href}`
  - Confidence: 0.85

- **Validation**: `/^https:\/\/x\.com\/[A-Za-z0-9_]{1,15}\/status\/\d+/`
  - Ensures handle is 1-15 alphanumeric/underscore characters
  - Ensures tweet ID is numeric
  - Enforces x.com domain (not twitter.com)

**Current Coverage**: Tweet URL extraction is fully functional with defensive fallback strategy.

#### Author Profile URL Extraction (NEEDS IMPLEMENTATION)

**Status**: ⚠️ TO DO

**Proposed Approach** (based on existing author extraction patterns):

**Primary Selector** (similar to existing author extraction):
```typescript
selector: '[data-testid="User-Name"] a[role="link"]'
extractor: (el) => {
  const href = el.getAttribute('href');
  if (!href) return null;

  // Extract handle from href (format: /{handle})
  const match = href.match(/^\/([A-Za-z0-9_]{1,15})$/);
  if (!match) return null;

  return `https://x.com${href}`;
}
validator: (value) => /^https:\/\/x\.com\/[A-Za-z0-9_]{1,15}$/.test(value)
confidence: 0.95
```

**Secondary Selector** (fallback to handle-based construction):
```typescript
selector: 'article[role="article"]'
extractor: (el) => {
  // Use existing extractAuthor function to get handle
  const authorData = extractAuthor(el);
  if (!authorData || !authorData.handle) return null;

  return `https://x.com/${authorData.handle}`;
}
validator: (value) => /^https:\/\/x\.com\/[A-Za-z0-9_]{1,15}$/.test(value)
confidence: 0.85
```

**Tertiary Selector** (construct from tweet URL):
```typescript
selector: 'article[role="article"]'
extractor: (el) => {
  // Extract handle from tweet URL
  const tweetUrl = extractTweetUrl(el);
  if (!tweetUrl) return null;

  const match = tweetUrl.match(/https:\/\/x\.com\/([A-Za-z0-9_]{1,15})\/status\//);
  if (!match) return null;

  return `https://x.com/${match[1]}`;
}
validator: (value) => /^https:\/\/x\.com\/[A-Za-z0-9_]{1,15}$/.test(value)
confidence: 0.75
```

### 2. URL Construction Patterns

#### Tweet Permalink Format

**Pattern**: `https://x.com/{handle}/status/{tweetId}`

**Components**:
- `{handle}`: Twitter username (1-15 characters, alphanumeric + underscore)
- `{tweetId}`: Numeric tweet identifier (19-digit snowflake ID)

**Example**: `https://x.com/ExxAlerts/status/1984307746691318153`

**Validation Regex**: `/^https:\/\/x\.com\/[A-Za-z0-9_]{1,15}\/status\/\d+$/`

#### Author Profile URL Format

**Pattern**: `https://x.com/{handle}`

**Components**:
- `{handle}`: Twitter username (1-15 characters, alphanumeric + underscore)

**Example**: `https://x.com/ExxAlerts`

**Validation Regex**: `/^https:\/\/x\.com\/[A-Za-z0-9_]{1,15}$/`

#### Domain Standardization

**Decision**: Standardize on `x.com` (not `twitter.com`)
**Rationale**:
- X.com is the current canonical domain (as of 2023)
- Twitter.com redirects to x.com
- All existing extraction code uses x.com
- Consistency across codebase

#### Special Characters in Handles

**Allowed Characters**: `A-Z`, `a-z`, `0-9`, `_` (underscore)
**Length Constraint**: 1-15 characters
**Not Allowed**: Spaces, hyphens, special symbols, emoji

**Validation Strategy**:
- Validate handle against `[A-Za-z0-9_]{1,15}` before URL construction
- If handle fails validation, log warning and return null
- No URL encoding needed (all valid handles are URL-safe)

### 3. Edge Case Handling

#### Edge Case Matrix

| Scenario | Tweet URL Handling | Author Profile URL Handling |
|----------|-------------------|----------------------------|
| **Tweet ID unavailable** | Return null (cannot construct without ID) | Fallback to handle-based construction |
| **Handle unavailable** | Return null (cannot construct without handle) | Return null (no fallback available) |
| **Deleted/private tweet** | URL still valid (may 404 but format correct) | URL still valid (may redirect/404) |
| **Very old tweet IDs** | Supported (regex accepts any numeric ID) | N/A (handle-based, no ID dependency) |
| **Quote/retweet parent** | Recursive extraction (extract from parent element) | Recursive extraction (same as main tweet) |
| **Invalid characters in handle** | Validation fails → return null | Validation fails → return null |
| **URL structure change** | Selector fallback chain mitigates | Fallback to handle construction mitigates |

#### Fallback Strategy

**Tweet URL**:
1. **Primary**: Extract from DOM link elements
2. **Secondary**: Extract from time element parent link
3. **Tertiary**: Construct from `author.handle` + extracted tweet ID
4. **Final Fallback**: Return null (cannot construct without handle/ID)

**Author Profile URL**:
1. **Primary**: Extract from User-Name link element
2. **Secondary**: Construct from extracted `author.handle`
3. **Tertiary**: Extract handle from tweet URL, construct profile URL
4. **Final Fallback**: Return null (cannot construct without handle)

#### Error Logging

**Tweet URL Extraction Failure**:
```typescript
logger.warn('[UrlExtractor] All fallback strategies failed for tweet URL');
logger.debug('[UrlExtractor] Context:', { handle, tweetId, extractionAttempts });
```

**Author URL Extraction Failure**:
```typescript
logger.warn('[AuthorExtractor] All fallback strategies failed for author profile URL');
logger.debug('[AuthorExtractor] Context:', { handle, domElementFound, extractionAttempts });
```

### 4. Migration Impact Analysis

#### Breaking Change Assessment

**Impact**: ⚠️ **HIGH - Breaking Change**

**Reason**: Adding **required** fields to existing interfaces

**Affected Components**:
1. **TypeScript Interfaces**: `TweetData`, `AuthorData`
2. **API Contract**: `specs/003-config-endpoint/contracts/async-response-api.yaml`
3. **Backend Consumers**: Any server parsing captured tweet data
4. **Existing Data**: Historical tweets without URL fields

#### Migration Strategy

**Option 1: Hard Cutover (Recommended)**
- Update contract version: `1.0.0` → `1.1.0` (MINOR bump)
- Mark fields as required in new version
- Update all extraction code to guarantee non-null values
- Backend servers must handle both old and new versions during transition

**Option 2: Graceful Deprecation (Not Recommended)**
- Make fields optional (`profileUrl?: string`) temporarily
- Add deprecation warning in contract
- Require backends to handle null values
- **Rejected**: Violates feature requirement (FR-007: both fields MUST be required)

**Selected Strategy**: **Option 1 (Hard Cutover)**

**Rationale**:
- Feature spec explicitly requires non-nullable fields (FR-007)
- Fallback construction ensures 100% field population
- MINOR version bump signals non-breaking semantics (additive change)
- Backend servers can validate schema version and adapt

#### Rollout Plan

1. **Phase 1: Contract Update** (this feature)
   - Increment contract version to 1.1.0
   - Add `url` and `profileUrl` as required fields
   - Document migration notes in version history

2. **Phase 2: Extension Implementation** (this feature)
   - Update TypeScript interfaces
   - Implement author profile URL extraction
   - Verify tweet URL continues to work (already implemented)
   - Test fallback construction for both fields

3. **Phase 3: Backend Adaptation** (external, post-release)
   - Backend servers update schema parsers to expect new fields
   - Add version detection logic to handle both 1.0.0 and 1.1.0
   - Validate that all incoming data includes URL fields

4. **Phase 4: Backfill Existing Data** (optional, external)
   - Historical tweet data can be backfilled by:
     - Extracting handle from existing author data → construct profileUrl
     - Extracting tweet ID (if available) + handle → construct url
   - Not required for this feature (out of scope per spec)

#### Backward Compatibility Notes

**Extension Side**:
- Always emits URL fields (guaranteed by fallback construction)
- Old extension versions (pre-1.1.0) will omit URL fields
- New extension versions (1.1.0+) always include URL fields

**Backend Side**:
- Must accept both old format (no URL fields) and new format (with URL fields)
- Recommended: Check contract version in metadata
- Graceful degradation: Backends can construct URLs themselves if missing

## Implementation Recommendations

### High Priority

1. **Add `profileUrl` to `AuthorData` interface** (required)
   - Location: `src/types/tweet-data.ts`
   - Type: `profileUrl: string;` (non-nullable)

2. **Create `author-url-extractor.ts`** (new file)
   - Implement 3-tier fallback selector strategy
   - Use existing `SelectorFallbackChain` pattern
   - Export `extractAuthorProfileUrl(tweetArticle: Element): string | null`

3. **Update `author-extractor.ts`** (modification)
   - Call `extractAuthorProfileUrl()` in `extractAuthor()` function
   - Fallback to handle-based construction if extraction returns null
   - Guarantee non-null return value (FR-007 requirement)

4. **Update API contract** (critical)
   - File: `specs/003-config-endpoint/contracts/async-response-api.yaml`
   - Add `profileUrl` to Author schema (required field)
   - Verify `url` is in TweetData schema (should already exist)
   - Increment version to 1.1.0
   - Update version history with migration notes

### Medium Priority

5. **Create URL builder utilities** (optional but recommended)
   - File: `src/utils/url-builder.ts` (new)
   - Functions:
     - `buildTweetUrl(handle: string, tweetId: string): string`
     - `buildProfileUrl(handle: string): string`
     - `validateTwitterUrl(url: string): boolean`
   - Used by fallback strategies in extractors

6. **Add validation logging** (quality of life)
   - Log URL construction fallbacks at `logger.debug()` level
   - Log validation failures at `logger.warn()` level
   - Include context (handle, tweetId, extraction tier) in logs

### Low Priority

7. **Update test fixtures** (if tests exist)
   - Add `profileUrl` to mock author data
   - Verify `url` field present in mock tweet data
   - Add test cases for URL construction fallbacks

## Conclusion

**Readiness**: ✅ Ready for Phase 1 (Design & Contracts)

**Key Findings**:
- Tweet URL extraction is already fully implemented and functional
- Author profile URL extraction needs implementation (new feature)
- Both fields can be guaranteed non-null via fallback construction
- Breaking change requires contract version bump and migration strategy

**Next Steps**:
1. Create `data-model.md` with interface changes
2. Update API contracts with version increment
3. Create `quickstart.md` developer guide
4. Proceed to task generation phase

**Risks**: None identified - straightforward implementation with clear fallback strategies
