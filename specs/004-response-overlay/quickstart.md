# Quickstart Guide: Server Response Overlay

**Feature**: 004-response-overlay
**Audience**: Developers implementing or testing the overlay feature
**Prerequisites**: TweetYoink extension installed, test server running

## Overview

This guide shows how to test the server response overlay feature. You'll learn how to configure test servers to return content items and verify the overlay displays correctly.

## Quick Start (5 Minutes)

### 1. Update Test Server

Modify `test-server/server.ts` to return content items:

```typescript
// In handleTweetsPost function, replace the sync response with:

sendJson(res, 200, {
  status: 'completed',
  result: [
    {
      type: 'text',
      content: 'Sentiment Analysis: Positive (95% confidence)'
    },
    {
      type: 'text',
      content: 'Detected Topics: technology, AI, innovation'
    },
    {
      type: 'text',
      content: 'Predicted Engagement: 500+ likes estimated'
    }
  ]
});
```

### 2. Start Test Server

```bash
npm run server
```

### 3. Configure Extension

1. Open Chrome and navigate to `chrome://extensions`
2. Find TweetYoink extension
3. Click "Options"
4. Set endpoint URL: `http://localhost:3000/`
5. Grant localhost permission
6. Save configuration

### 4. Test Overlay

1. Go to https://twitter.com (or x.com)
2. Find any tweet
3. Click the "Yoink" button
4. **Expected**: Overlay appears with 3 text items
5. **Test dismissal**:
   - Press ESC key → Overlay closes
   - Click outside overlay → Overlay closes
   - Click close button (×) → Overlay closes

**✅ Success**: You should see the overlay with all 3 items displayed!

## Testing Scenarios

### Scenario 1: Single Text Item

**Purpose**: Test MVP functionality (P1)

**Server Response**:
```json
{
  "status": "completed",
  "result": [
    {
      "type": "text",
      "content": "This is a single text item"
    }
  ]
}
```

**Expected Behavior**:
- Overlay appears
- Single item displayed
- Dismissible via ESC/click outside

### Scenario 2: Multiple Items (P2)

**Purpose**: Test vertical stacking of multiple content items

**Server Response**:
```json
{
  "status": "completed",
  "result": [
    { "type": "text", "content": "Item 1: First analysis result" },
    { "type": "text", "content": "Item 2: Second analysis result" },
    { "type": "text", "content": "Item 3: Third analysis result" },
    { "type": "text", "content": "Item 4: Fourth analysis result" },
    { "type": "text", "content": "Item 5: Fifth analysis result" }
  ]
}
```

**Expected Behavior**:
- Overlay appears
- All 5 items visible in order
- Scrollable if content exceeds viewport height

### Scenario 3: Mixed Content Types (P2)

**Purpose**: Test graceful skipping of unsupported types

**Server Response**:
```json
{
  "status": "completed",
  "result": [
    { "type": "text", "content": "This text should appear" },
    { "type": "image", "content": "https://example.com/image.png" },
    { "type": "text", "content": "This text should also appear" },
    { "type": "link", "content": "https://example.com" },
    { "type": "unknown", "content": "This is skipped" }
  ]
}
```

**Expected Behavior**:
- Overlay appears
- Only 2 text items displayed
- Non-text items gracefully skipped (no errors)

### Scenario 4: Empty Result Array (P3)

**Purpose**: Test empty response handling

**Server Response**:
```json
{
  "status": "completed",
  "result": []
}
```

**Expected Behavior**:
- Overlay appears (or console message)
- Shows "No results available" message
- Dismissible

### Scenario 5: No Displayable Content (P3)

**Purpose**: Test when all items are non-text

**Server Response**:
```json
{
  "status": "completed",
  "result": [
    { "type": "image", "content": "https://example.com/1.png" },
    { "type": "image", "content": "https://example.com/2.png" }
  ]
}
```

**Expected Behavior**:
- Overlay appears (or console message)
- Shows "No displayable content" message
- Dismissible

### Scenario 6: Long Content (Edge Case)

**Purpose**: Test overflow handling

**Server Response**:
```json
{
  "status": "completed",
  "result": [
    {
      "type": "text",
      "content": "Lorem ipsum dolor sit amet... [10,000 characters]"
    }
  ]
}
```

**Expected Behavior**:
- Overlay appears
- Content is scrollable
- No performance issues

### Scenario 7: Many Items (Edge Case)

**Purpose**: Test performance with large arrays

**Server Response**:
```json
{
  "status": "completed",
  "result": [
    { "type": "text", "content": "Item 1" },
    { "type": "text", "content": "Item 2" },
    ... // 50 items total
    { "type": "text", "content": "Item 50" }
  ]
}
```

**Expected Behavior**:
- Overlay appears within 200ms (SC-001)
- All 50 items rendered
- Scrollable
- No lag during scrolling

## Async Response Testing

### Setup Async Server

Use the existing async server:

```bash
npm run server:async
```

Configure extension to use: `http://localhost:3000/`

### Async Test Scenario

**Initial Response**:
```json
{
  "status": "pending",
  "requestId": "req_1698576000_abc123",
  "estimatedDuration": 30
}
```

**Status Checks** (every 5 seconds):
```json
{
  "status": "processing",
  "message": "Analyzing tweet..."
}
```

**Final Response** (after 30 seconds):
```json
{
  "status": "completed",
  "result": [
    { "type": "text", "content": "Async analysis complete!" },
    { "type": "text", "content": "Processing time: 30 seconds" }
  ]
}
```

**Expected Behavior**:
1. User clicks Yoink → Button shows loading state
2. Extension polls /status every 5 seconds
3. After 30 seconds → Overlay appears with results
4. User can dismiss overlay normally

## Debugging Tips

### Overlay Not Appearing

**Check Console**:
```javascript
// Open browser console (F12)
// Look for TweetYoink logs
```

**Common Issues**:
1. Server returning legacy format (non-array result)
   - Fix: Wrap result in array
2. All items have non-text type
   - Fix: Include at least one `type="text"` item
3. JavaScript error in overlay code
   - Fix: Check console for error message

### Styling Issues

**Overlay Not Centered**:
- Check browser zoom (should be 100%)
- Check for CSS conflicts (Twitter updates)

**Content Cut Off**:
- Check `max-height` in overlay.css
- Ensure scrolling is enabled

**Wrong Z-Index**:
- Twitter may have changed their z-index values
- Increase `zIndex` in overlay config

### Performance Issues

**Slow Rendering (>200ms)**:
- Check number of items (<20 recommended)
- Check content length per item
- Profile with Chrome DevTools Performance tab

**Scroll Lag**:
- Ensure using CSS `overflow-y: auto` (not custom scroll)
- Check for heavy DOM manipulations in console

## Testing Checklist

Before marking feature complete, verify:

- [ ] Single text item displays correctly
- [ ] Multiple text items display in order
- [ ] Non-text items are gracefully skipped
- [ ] Empty result shows appropriate message
- [ ] ESC key dismisses overlay
- [ ] Click outside dismisses overlay
- [ ] Close button dismisses overlay
- [ ] Overlay appears within 200ms (SC-001)
- [ ] Stable during scrolling (SC-002)
- [ ] Works on mobile viewport (320px)
- [ ] Works on desktop viewport (1920px)
- [ ] Async responses trigger overlay correctly
- [ ] Multiple Yoink clicks replace previous overlay
- [ ] Navigation away cleans up overlay

## Modifying Test Server for Custom Tests

### Add Metadata

```typescript
{
  type: 'text',
  content: 'Analysis result',
  metadata: {
    title: 'Sentiment Analysis',
    timestamp: new Date().toISOString(),
    confidence: 0.95
  }
}
```

**Note**: Metadata is currently ignored by renderer but available for future use.

### Simulate Delays

```typescript
// Add artificial delay to test loading states
setTimeout(() => {
  sendJson(res, 200, { ...response });
}, 2000); // 2 second delay
```

### Test Error Conditions

```typescript
// Return error to test error handling
sendJson(res, 500, {
  status: 'error',
  error: {
    code: 'PROCESSING_FAILED',
    message: 'Tweet analysis failed'
  }
});
```

## Next Steps

After successful testing:

1. **Code Review**: Verify implementation matches spec
2. **Type Check**: Run `npm run type-check`
3. **Build**: Run `npm run build`
4. **Manual Testing**: Test on actual Twitter/X with various tweets
5. **Documentation**: Update CLAUDE.md with overlay architecture
6. **PR**: Create pull request for review

## Need Help?

- **Issue Tracker**: https://github.com/yourusername/tweetyoink/issues
- **Spec Reference**: `specs/004-response-overlay/spec.md`
- **Data Model**: `specs/004-response-overlay/data-model.md`
- **API Contract**: `specs/004-response-overlay/contracts/response-format.yaml`
