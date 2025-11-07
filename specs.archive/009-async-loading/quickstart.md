# Quickstart: Async Loading Indicators

**Feature**: 009-async-loading
**For**: Developers implementing or testing the Smart Hybrid loading indicator system
**Est. Reading Time**: 10 minutes

## Overview

This feature adds visual progress indicators to Yoink buttons, showing users real-time feedback during tweet extraction and server processing. The "Smart Hybrid" approach adapts to whatever progress data the server provides.

## What You'll Build

**User-Facing Features**:
1. **Immediate Feedback**: Pulsing animation appears within 100ms of button click
2. **Real Progress**: Radial fill shows actual progress when server provides it
3. **Estimated Progress**: Calculated progress from `estimatedDuration` field
4. **Fallback Pulse**: Steady pulse when no progress data available
5. **Completion Flash**: Brief checkmark animation on success

**Visual Example**:
```
[Button States]

Idle:        [○]  (Normal Yoink icon)
Pulse Only:  [◐]  (Pulsing icon, no fill)
50% Fill:    [◕]  (Half circle filled, clockwise from top)
95% Fill:    [●]  (Almost complete)
Success:     [✓]  (Brief checkmark, 200ms)
```

## Architecture Overview

### File Structure

```
src/ui/
├── yoink-button.ts          # MODIFY: Add loading functions
├── icons.ts                 # MODIFY: Add progress circle SVG
└── loading-indicator.ts     # NEW: Progress calculation logic

src/content-script.ts        # MODIFY: Update click handler
src/services/polling-service.ts  # MODIFY: Broadcast progress updates
```

### Key Components

**1. Loading State Manager** (`loading-indicator.ts`)
- Tracks loading state per button (WeakMap)
- Calculates progress (real/estimated/indeterminate)
- Updates visual indicator

**2. Progress Visual** (`icons.ts`)
- SVG circle with stroke-dasharray animation
- Pulse animation (CSS keyframes)
- Checkmark overlay for completion

**3. Integration Points** (`content-script.ts`, `polling-service.ts`)
- Initialize loading on button click
- Update progress from poll responses
- Clear loading on completion/error

---

## Quick Integration Guide

### Step 1: Initialize Loading on Button Click

**Location**: `src/content-script.ts` → `handleYoinkClick()`

```typescript
import { showButtonLoading, hideButtonLoading } from './ui/loading-indicator';

async function handleYoinkClick(tweetElement: Element, button: HTMLButtonElement) {
  // OLD: disableButton(button);
  // NEW:
  showButtonLoading(button, { mode: 'indeterminate' });

  // ... extraction logic ...

  const response = await postTweetData(result.data);

  if (isAsyncResponse(response)) {
    // NEW: Update with server progress data
    updateButtonProgress(button, {
      requestId: response.requestId,
      estimatedDuration: response.estimatedDuration,
      progress: response.progress
    });
  } else {
    // Sync response - show success
    showCheckmark(button);
    setTimeout(() => hideButtonLoading(button), 200);
  }
}
```

### Step 2: Add Progress Updates from Polling

**Location**: `src/services/polling-service.ts` → `pollRequest()`

```typescript
// After receiving poll response
if (data.status === 'processing') {
  // NEW: Broadcast progress to content script
  chrome.tabs.sendMessage(tab.id, {
    type: 'ASYNC_PROGRESS_UPDATE',
    requestId: requestId,
    progress: data.progress,
    estimatedDuration: data.estimatedDuration
  });
}
```

**Location**: `src/content-script.ts` → message listener

```typescript
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'ASYNC_PROGRESS_UPDATE') {
    const button = findButtonForRequest(message.requestId);
    if (button) {
      updateButtonProgress(button, {
        progress: message.progress,
        estimatedDuration: message.estimatedDuration
      });
    }
  }
});
```

### Step 3: Create Progress Visual

**Location**: `src/ui/icons.ts` → New function

```typescript
export function createProgressCircle(): SVGCircleElement {
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  const radius = 8;
  const circumference = 2 * Math.PI * radius;

  circle.setAttribute('r', radius.toString());
  circle.setAttribute('cx', '10');
  circle.setAttribute('cy', '10');
  circle.setAttribute('stroke', '#1D9BF0');  // Twitter blue
  circle.setAttribute('stroke-width', '2');
  circle.setAttribute('fill', 'none');
  circle.setAttribute('stroke-dasharray', circumference.toString());
  circle.setAttribute('stroke-dashoffset', circumference.toString());
  circle.setAttribute('transform', 'rotate(-90 10 10)');
  circle.style.transition = 'stroke-dashoffset 200ms ease-out';

  return circle;
}

export function updateProgressCircle(circle: SVGCircleElement, progress: number) {
  const radius = 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);
  circle.setAttribute('stroke-dashoffset', offset.toString());
}
```

---

## Testing Scenarios

### Scenario 1: Sync Response (Immediate)

**Setup**: Use test server with sync response
```bash
npm run server  # Regular sync server
```

**Steps**:
1. Click Yoink button on any tweet
2. Verify pulse animation appears immediately
3. Verify button stays disabled
4. Verify checkmark flash after ~500ms
5. Verify button re-enables

**Expected Timing**:
- Pulse appears: <100ms
- Extraction: ~50ms
- POST request: ~100ms
- Checkmark: 200ms
- Total: ~450ms

### Scenario 2: Async with Progress

**Setup**: Mock server that returns `progress` field
```typescript
// test-server/async-server.ts
{
  status: 'processing',
  progress: 0.65,  // 65% complete
  requestId: 'req_123'
}
```

**Steps**:
1. Click Yoink button
2. Verify radial fill appears and shows 65%
3. Wait for next poll (5s)
4. Verify fill updates to new progress value
5. Verify completion shows checkmark

**Expected Visual**:
- Initial: Pulse only (0%)
- First poll: Radial fill at 65%
- Second poll: Radial fill at 80%
- Completion: Checkmark + re-enable

### Scenario 3: Async with Estimated Duration

**Setup**: Server returns `estimatedDuration: 30` (30 seconds)

**Steps**:
1. Click Yoink button at T=0
2. Verify radial fill grows gradually
3. At T=15s, verify ~50% fill
4. At T=30s, verify ~95% fill (capped)
5. If exceeds 30s, verify switches to pulse-only

**Expected Behavior**:
- Progress calculated: `elapsed / estimatedDuration`
- Visual opacity: 0.8 (indicates estimation)
- Pulse speed: Increases from 1s to 0.5s
- Cap at 95% to avoid "stuck at 100%"

### Scenario 4: Async Indeterminate

**Setup**: Server returns no `progress` or `estimatedDuration`

**Steps**:
1. Click Yoink button
2. Verify steady pulse (no radial fill)
3. Wait through several polls
4. Verify pulse continues unchanged
5. Verify eventual completion

**Expected Behavior**:
- No radial fill
- Steady 1s pulse interval
- Icon opacity: 0.6
- Button disabled throughout

---

## Common Integration Pitfalls

### Pitfall 1: Not Clearing Loading State on Error

**Problem**: Button stays in loading state after error
```typescript
// ❌ BAD
try {
  await postTweetData(data);
} catch (error) {
  showButtonError(button);
  // Forgot to clear loading!
}
```

**Solution**: Always clear loading in finally block
```typescript
// ✅ GOOD
try {
  await postTweetData(data);
} catch (error) {
  showButtonError(button);
} finally {
  hideButtonLoading(button);
}
```

### Pitfall 2: Progress Value Not Clamped

**Problem**: Invalid progress breaks visual
```typescript
// ❌ BAD
const progress = response.progress;  // Could be 1.5 or -0.2!
updateProgressCircle(circle, progress);
```

**Solution**: Always clamp to [0, 1]
```typescript
// ✅ GOOD
const progress = Math.max(0, Math.min(1, response.progress ?? 0));
updateProgressCircle(circle, progress);
```

### Pitfall 3: Missing WeakMap Cleanup

**Problem**: Memory leak from orphaned states
```typescript
// ❌ BAD
const buttonStates = new Map<HTMLButtonElement, LoadingState>();
// Never cleans up when button removed!
```

**Solution**: Use WeakMap for automatic cleanup
```typescript
// ✅ GOOD
const buttonStates = new WeakMap<HTMLButtonElement, LoadingState>();
// Automatically cleaned when button garbage collected
```

---

## Performance Checklist

- [ ] Progress updates use CSS transitions (not JavaScript animation)
- [ ] SVG circle has `will-change: stroke-dashoffset`
- [ ] Pulse animation defined in CSS (not JavaScript intervals)
- [ ] Loading state uses WeakMap (not Map or object)
- [ ] Progress calculations done only on server response (not on interval)
- [ ] No layout thrashing (batch DOM reads, then writes)

---

## Accessibility Checklist

- [ ] Button has `aria-busy="true"` during loading
- [ ] ARIA live region announces loading state
- [ ] Progress percentage announced at 25% intervals
- [ ] Completion announced to screen readers
- [ ] Button label updated: "Yoink this tweet, loading..."

---

## Debug Tips

### Logging Progress Updates

```typescript
function updateProgress(button: HTMLButtonElement, data: ProgressData) {
  logger.log('[Loading] Progress update:', {
    mode: data.mode,
    progress: data.progress,
    estimatedDuration: data.estimatedDuration,
    elapsed: Date.now() - state.startTime
  });
}
```

### Inspecting SVG Circle

```typescript
// In console
const circle = document.querySelector('.yoink-progress-circle');
console.log('Circumference:', circle.getAttribute('stroke-dasharray'));
console.log('Offset:', circle.getAttribute('stroke-dashoffset'));
console.log('Progress:', 1 - (offset / circumference));
```

### Simulating Slow Server

```typescript
// In test-server/async-server.ts
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

app.post('/', async (req, res) => {
  await delay(30000);  // 30 second delay
  res.json({ status: 'completed', result: [...] });
});
```

---

## Next Steps

After implementing:

1. **Manual Testing**: Test all 4 scenarios (sync, async with progress, estimated, indeterminate)
2. **Browser Testing**: Verify in latest Chrome/Edge
3. **Accessibility**: Test with NVDA/JAWS screen readers
4. **Performance**: Check 60fps in Chrome DevTools Performance tab
5. **Edge Cases**: Test rapid clicks, navigation during loading, timeout scenarios

**Estimated Implementation Time**: 4-6 hours

**Files to Modify**: 4 files
**New Files**: 1 file
**Lines of Code**: ~400 LOC

---

## Reference Materials

- **Spec**: `specs/009-async-loading/spec.md` - User requirements
- **Research**: `specs/009-async-loading/research.md` - Technical decisions
- **Data Model**: `specs/009-async-loading/data-model.md` - State management
- **Plan**: `specs/009-async-loading/plan.md` - Implementation roadmap

**Questions?** Check the research.md for detailed technical rationale, or refer to data-model.md for state management patterns.
