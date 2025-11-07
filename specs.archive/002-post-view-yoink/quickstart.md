# Quickstart Guide: Post View Yoink

**Feature**: 002-post-view-yoink
**Created**: 2025-10-24
**Audience**: Developers implementing or testing the tweet capture feature

## Overview

This guide walks you through setting up, testing, and developing the Post View Yoink feature. You'll learn how to:
- Install and load the extension in Chrome
- Test button injection and tweet capture
- Run automated tests
- Develop new extractors with hot reload

**Time to first capture**: ~5 minutes

---

## Prerequisites

Ensure you have the following installed:

- **Node.js 20.x** or higher ([download](https://nodejs.org/))
- **npm 10.x** or higher (comes with Node.js)
- **Google Chrome** (latest version recommended)
- **Chrome Developer Mode enabled**

**Verify installation**:
```bash
node --version  # Should show v20.x.x or higher
npm --version   # Should show 10.x.x or higher
```

---

## Installation

### 1. Clone and Install Dependencies

```bash
# Navigate to project root
cd /Users/margus/_DEV/_CHROME/tweetyoink

# Install dependencies (if not already done)
npm install

# Verify installation
npm run type-check  # Should complete with no errors
```

**Expected output**: TypeScript compilation succeeds, no errors.

### 2. Build the Extension

```bash
# Production build
npm run build

# OR watch mode for development (auto-rebuild on file changes)
npm run watch
```

**Build artifacts**: Created in `dist/` directory

**Build time**: ~63ms (from 001-initial-setup baseline)

---

## Loading Extension in Chrome

### 1. Open Chrome Extensions Page

Navigate to: `chrome://extensions`

Or: **Menu → Extensions → Manage Extensions**

### 2. Enable Developer Mode

Toggle the **Developer mode** switch in the top-right corner.

### 3. Load Unpacked Extension

1. Click **Load unpacked**
2. Navigate to your project's `dist/` folder
3. Select the `dist/` directory (not individual files)
4. Click **Select**

**Expected result**: TweetYoink extension appears in the extensions list with no errors.

### 4. Verify Extension Loaded

Check that:
- Extension shows **No errors** status
- Extension icon appears in Chrome toolbar (optional)
- Extension is **Enabled** (toggle switch on)

---

## Testing Button Injection

### 1. Navigate to X/Twitter

Open one of these URLs:
- `https://x.com` (homepage/timeline)
- `https://twitter.com` (redirect to x.com)
- Any individual tweet URL

### 2. Locate Yoink Buttons

**Expected behavior** (within 500ms of page load):
- Each tweet in the timeline displays a **Yoink button**
- Button appears as the **first (leftmost) item** in the action bar
- Button displays as **icon-only** (no text label)
- Hovering shows tooltip: **"Yoink this tweet"**

**Visual appearance**:
- Default color: Gray (`rgb(113, 118, 123)`)
- Hover color: Blue (`rgb(29, 155, 240)`)
- Circular hover background (10% blue opacity)
- Size: ~20px icon in 34.75px button

### 3. Verify Button Positioning

Check that Yoink button appears:
- ✅ Before Reply, Retweet, Like, Bookmark, Share buttons
- ✅ Before Grok button (if present)
- ✅ In the same horizontal row as other action buttons
- ✅ With consistent spacing and alignment

**Troubleshooting**:
- **No buttons appear**: Check browser console for errors, verify extension is enabled
- **Buttons appear in wrong position**: Check for DOM changes (X/Twitter updates), review selector logic
- **Duplicate buttons**: MutationObserver debouncing issue, check WeakSet tracking

---

## Triggering Tweet Capture

### 1. Open Browser Console

- **Windows/Linux**: `Ctrl + Shift + J`
- **Mac**: `Cmd + Option + J`

Or: **Right-click → Inspect → Console tab**

### 2. Click Yoink Button

Click the Yoink button on any tweet.

**Expected behavior**:
- Button becomes **disabled** during extraction (~50ms)
- Console logs appear with structured JSON
- Button re-enables after completion

### 3. Inspect Console Output

**Expected JSON structure**:
```json
{
  "text": "Tweet text content here...",
  "author": {
    "handle": "username",
    "displayName": "Display Name",
    "isVerified": true,
    "profileImageUrl": "https://..."
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
  "linkCard": { ... },
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

**Validation checks**:
- ✅ `text` is not null (unless deleted tweet)
- ✅ `author.handle` matches tweet author
- ✅ `timestamp` is valid ISO 8601
- ✅ `metrics` object exists (counts may be null)
- ✅ `metadata.confidence` is 0.0-1.0 range
- ✅ `metadata.extractionTier` is "primary", "secondary", or "tertiary"

### 4. Test Different Tweet Types

Capture the following to verify extraction coverage:

| Tweet Type | What to Verify |
|------------|----------------|
| **Text-only tweet** | `text`, `author`, `metrics` populated |
| **Tweet with image** | `media` array contains image URL + alt text |
| **Tweet with video** | `media` contains video URL + thumbnail |
| **Tweet with link card** | `linkCard` object populated with URL, title, domain |
| **Retweet** | `tweetType.isRetweet = true`, distinguish retweeter from original author |
| **Quote tweet** | `tweetType.isQuote = true`, `parent` contains quoted tweet data |
| **Reply** | `tweetType.isReply = true`, `parent` contains replied-to tweet |

---

## Running Automated Tests

### 1. Run Smoke Tests

```bash
npm run test
```

**Expected output**:
```
 ✓ tests/smoke/manifest.test.ts (2)
 ✓ tests/smoke/build.test.ts (5)
 ✓ tests/smoke/extraction.test.ts (8)

 Test Files  3 passed (3)
      Tests  15 passed (15)
   Duration  120ms
```

### 2. Test Against Fixture HTML

The test suite includes `tests/smoke/extraction.test.ts` which validates extractors against `tests/fixtures/x-tweet-sample.html`.

**Test coverage**:
- Primary selector extraction (data-testid)
- Fallback to secondary selectors (aria-label)
- Fallback to tertiary selectors (structural)
- Confidence score calculation
- Null handling for missing fields
- Nested JSON structure validation

### 3. Watch Mode for Development

```bash
npm run test:watch
```

**Behavior**: Tests re-run automatically on file changes (extractors, types, test files).

---

## Development Workflow

### 1. Start Watch Mode

```bash
npm run watch
```

**Behavior**:
- Watches `src/` directory for changes
- Auto-rebuilds extension on save (~200ms incremental builds)
- Preserves console.log statements (not stripped in dev mode)

### 2. Reload Extension in Chrome

After code changes:
1. Go to `chrome://extensions`
2. Click **Reload** icon on TweetYoink extension

**Hot reload not supported**: Manual reload required after each build.

### 3. Iterative Development Cycle

**Recommended workflow** (avg 30 seconds per iteration):
1. Edit extractor code in `src/extractors/`
2. Save file → Vite auto-rebuilds (~200ms)
3. Reload extension in Chrome (~2 seconds)
4. Refresh X/Twitter page (~2 seconds)
5. Click Yoink → inspect console output

**Faster iteration**: Use `tests/smoke/extraction.test.ts` for unit testing extractors without manual Chrome reload.

### 4. Type Checking During Development

```bash
# Run type checker without building
npm run type-check
```

**Best practice**: Run before committing to catch type errors early.

---

## Common Issues & Solutions

### Extension Doesn't Load

**Symptom**: Error on `chrome://extensions` after loading unpacked.

**Solution**:
1. Check manifest.json exists in `dist/`
2. Verify `npm run build` completed successfully
3. Ensure `dist/` directory selected (not `src/`)
4. Check browser console for specific error messages

### Buttons Don't Appear

**Symptom**: No Yoink buttons visible on X/Twitter timeline.

**Possible causes**:
- Content script not injecting → Check `dist/content-script.js` exists
- MutationObserver not firing → Check browser console for errors
- Selector mismatch → Verify "More" button selector: `[aria-label="More"][role="button"]`

**Debug steps**:
1. Open console on X/Twitter page
2. Check for initialization logs: `[TweetYoink] Content script loaded`
3. Manually test selector: `document.querySelector('[aria-label="More"]')`
4. Inspect MutationObserver logs (if debug logging enabled)

### Extraction Returns Null Fields

**Symptom**: Console output shows many `null` values for expected data.

**Possible causes**:
- X/Twitter DOM structure changed → Selectors outdated
- Fallback selectors not configured → Only primary tier attempted
- Tweet deleted/unavailable → Expected behavior (partial data)

**Debug steps**:
1. Inspect `metadata.extractionTier` → Should be "primary" for healthy extraction
2. Check `metadata.warnings` array → Lists failed field extractions
3. Manually test selectors in console: `document.querySelector('[data-testid="tweetText"]')`
4. Compare live DOM to `tests/fixtures/x-tweet-sample.html`

### Performance Degradation

**Symptom**: Buttons appear slowly (>500ms) or page becomes sluggish.

**Possible causes**:
- MutationObserver callback not throttled → Too many injections
- Memory leak → WeakMap not used for button tracking
- Excessive logging → Console.log in hot path

**Debug steps**:
1. Check `metadata.duration` in console output → Should be <50ms per extraction
2. Monitor memory in Chrome DevTools → Should not grow unbounded
3. Profile performance: `chrome://extensions` → TweetYoink → **Inspect views: service worker**

---

## Next Steps

### Implementing New Extractors

See **[data-model.md](./data-model.md)** for entity definitions and validation rules.

**Template for new extractor**:
```typescript
// src/extractors/new-field-extractor.ts
import { SelectorConfig } from '../types/tweet-data';

export const newFieldSelector: SelectorConfig = {
  primary: {
    selector: '[data-testid="newField"]',
    type: 'css',
    extractor: (el) => el.textContent?.trim() || null,
    confidence: 0.95
  },
  secondary: {
    selector: '[aria-label*="New Field"]',
    type: 'css',
    extractor: (el) => el.getAttribute('aria-label') || null,
    confidence: 0.75
  },
  tertiary: null // Optional fallback
};

export function extractNewField(tweetElement: Element): string | null {
  // Implementation using SelectorFallbackChain from research.md
}
```

### Adding Test Cases

See **[tests/smoke/extraction.test.ts](../../tests/smoke/extraction.test.ts)** for examples.

**Template**:
```typescript
it('should extract new field using primary selector', () => {
  const result = extractNewField(fixtureElement);
  expect(result).not.toBeNull();
  expect(result).toMatch(/expected pattern/);
});
```

### Contributing

Before submitting changes:
1. ✅ `npm run type-check` passes
2. ✅ `npm run test` passes (all smoke tests green)
3. ✅ Manual testing on live X/Twitter (capture 5+ different tweet types)
4. ✅ No console errors in browser or build logs

---

## Resources

- **Feature Spec**: [spec.md](./spec.md) - Requirements and user stories
- **Implementation Plan**: [plan.md](./plan.md) - Technical architecture and research
- **Data Model**: [data-model.md](./data-model.md) - TypeScript interfaces and validation rules
- **Research**: [research.md](./research.md) - Selector patterns, icon design, performance optimization
- **Test Fixtures**: [tests/fixtures/README.md](../../tests/fixtures/README.md) - Anonymized tweet HTML

---

## Support

**Issues**: Report bugs or request features via GitHub Issues
**Questions**: Check research.md for technical patterns and best practices
**Updates**: Monitor `specs/002-post-view-yoink/` for documentation changes
