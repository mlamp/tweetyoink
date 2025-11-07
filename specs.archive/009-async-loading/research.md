# Technical Research: Async Loading Indicators

**Feature**: 009-async-loading
**Date**: 2025-11-03
**Research Phase**: Phase 0

## Overview

This document captures technical research for implementing Smart Hybrid loading indicators with radial fill progress in the TweetYoink Chrome extension.

## Key Technical Decisions

### Decision 1: SVG Radial Progress Implementation

**What was chosen**: SVG `<circle>` with `stroke-dasharray` and `stroke-dashoffset` for radial fill animation

**Rationale**:
- **Performance**: GPU-accelerated CSS animations, no JavaScript recalculation needed for visual updates
- **Smooth Animation**: CSS transitions handle interpolation automatically at 60fps
- **Minimal DOM Changes**: Single `stroke-dashoffset` property update per progress change
- **Browser Support**: Supported in all modern browsers (Chrome 1+, no polyfills needed)
- **Scalability**: SVG scales perfectly for any button size without quality loss
- **Maintenance**: Standard SVG technique, well-documented, no custom libraries

**Alternatives considered**:
1. **Canvas radial fill**
   - Rejected: Requires continuous redrawing, higher CPU usage, no CSS animation support
   - Would need `requestAnimationFrame` loop for smooth animations
2. **CSS conic-gradient**
   - Rejected: Poor browser support for animated gradients, complex mask calculations
   - Harder to control fill direction and easing
3. **Multiple SVG arc segments**
   - Rejected: Complex path calculations, more DOM elements, harder to animate smoothly
4. **Inline CSS clip-path**
   - Rejected: Limited animation support, browser inconsistencies

**Implementation approach**:
```typescript
// Radial progress circle with 0-100% fill
const progressCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
const radius = 8; // Half of 16px for 20px icon (with 2px margin)
const circumference = 2 * Math.PI * radius; // ~50.27

progressCircle.setAttribute('r', radius.toString());
progressCircle.setAttribute('cx', '10');  // Center of 20px icon
progressCircle.setAttribute('cy', '10');
progressCircle.setAttribute('stroke', '#1D9BF0');  // Twitter blue
progressCircle.setAttribute('stroke-width', '2');
progressCircle.setAttribute('fill', 'none');
progressCircle.setAttribute('stroke-dasharray', circumference.toString());
progressCircle.setAttribute('stroke-dashoffset', circumference.toString()); // Start at 0%
progressCircle.setAttribute('transform', 'rotate(-90 10 10)'); // Start at 12 o'clock
progressCircle.style.transition = 'stroke-dashoffset 200ms ease-out';

// Update progress (0.0-1.0)
function setProgress(progress: number) {
  const offset = circumference * (1 - progress);
  progressCircle.setAttribute('stroke-dashoffset', offset.toString());
}
```

---

### Decision 2: Progress Calculation Strategy

**What was chosen**: Three-tier adaptive progress calculation with fallback hierarchy

**Rationale**:
- **Flexibility**: Supports any server implementation (full progress, estimated, or none)
- **User Experience**: Always shows some feedback, never a static/frozen state
- **Future-Proof**: Works with current servers, ready for enhanced servers
- **Realistic Expectations**: Visual cues distinguish real vs estimated progress

**Implementation tiers**:

**Tier 1: Real Progress (from `progress` field)**
```typescript
interface AsyncResponse {
  status: 'processing';
  progress?: number;  // 0.0-1.0 from server
}

// Direct mapping
const displayProgress = Math.max(0, Math.min(1, response.progress));
```

**Tier 2: Estimated Progress (from `estimatedDuration`)**
```typescript
interface AsyncResponse {
  status: 'processing';
  estimatedDuration?: number;  // seconds
}

// Calculate elapsed time
const elapsed = (Date.now() - startTime) / 1000;  // Convert to seconds
const estimatedProgress = Math.min(0.95, elapsed / response.estimatedDuration);

// Cap at 95% to avoid "stuck at 100%" perception
// Switch to pulse-only if exceeded
if (estimatedProgress >= 0.95) {
  mode = 'pulse-only';
}
```

**Tier 3: Indeterminate (no progress data)**
```typescript
// Pulse animation only
// No radial fill
// Steady 1s pulse interval
```

**Pulse Speed Modulation** (for estimated progress):
```typescript
// Faster pulse as completion approaches (creates sense of urgency)
const basePulseSpeed = 1000; // 1s
const progressFactor = estimatedProgress; // 0-1
const pulseSpeed = basePulseSpeed * (1 - (progressFactor * 0.5)); // 1s → 0.5s
```

---

### Decision 3: State Management Approach

**What was chosen**: Local component state with event-driven updates (no global state library)

**Rationale**:
- **Simplicity**: Loading state is ephemeral per button, no cross-component sharing needed
- **Performance**: No Redux/MobX overhead for simple local state
- **Existing Pattern**: Matches current button state management (`disableButton`, `enableButton`)
- **Independence**: Each button tracks own loading state, supports multiple concurrent operations

**State structure**:
```typescript
interface LoadingState {
  isLoading: boolean;
  mode: 'real' | 'estimated' | 'indeterminate';
  progress: number;  // 0-1
  startTime: number;  // Date.now()
  estimatedDuration?: number;  // seconds
  requestId?: string;  // For async tracking
}

// Stored as WeakMap keyed by button element
const buttonLoadingStates = new WeakMap<HTMLButtonElement, LoadingState>();
```

**Update trigger points**:
1. **Button click**: Initialize loading state
2. **POST response**: Update mode based on sync/async
3. **Poll response**: Update progress/estimatedDuration
4. **Completion**: Clear loading state, restore button
5. **Error**: Clear loading state, show error state

---

### Decision 4: Animation Performance Optimization

**What was chosen**: CSS-driven animations with minimal JavaScript

**Rationale**:
- **GPU Acceleration**: CSS `transform` and `opacity` animations run on compositor thread
- **60fps Target**: Browser handles frame timing, no jank from JavaScript
- **Battery Efficient**: Compositor animations don't wake main thread
- **Smooth Degradation**: Browser automatically throttles animations on low-power devices

**Optimization techniques**:

**Use CSS transitions (not JavaScript intervals)**:
```css
.yoink-progress-circle {
  transition: stroke-dashoffset 200ms ease-out;
}

.yoink-icon-pulse {
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(0.98);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.02);
    opacity: 0.8;
  }
}
```

**Avoid layout thrashing**:
```typescript
// BAD: Forces layout recalculation
button.offsetHeight; // Read
button.style.transform = 'scale(1.02)'; // Write
button.offsetHeight; // Read (thrash!)

// GOOD: Batch reads, then writes
const height = button.offsetHeight; // Read
requestAnimationFrame(() => {
  button.style.transform = 'scale(1.02)'; // Write
});
```

**Use `will-change` for animated properties**:
```css
.yoink-button-loading {
  will-change: opacity, transform;
}

.yoink-progress-circle {
  will-change: stroke-dashoffset;
}
```

---

### Decision 5: Accessibility Implementation

**What was chosen**: ARIA live regions with dynamic progress announcements

**Rationale**:
- **Screen Reader Support**: Announces loading state changes without visual cues
- **Progress Updates**: Periodic announcements (every 25% for real progress)
- **Non-Intrusive**: Polite mode doesn't interrupt current screen reader output
- **Standards Compliant**: Follows WCAG 2.1 guidelines for dynamic content

**Implementation**:
```typescript
// Add ARIA live region (hidden visually, read by screen readers)
const ariaLive = document.createElement('div');
ariaLive.setAttribute('role', 'status');
ariaLive.setAttribute('aria-live', 'polite');
ariaLive.setAttribute('aria-atomic', 'true');
ariaLive.style.position = 'absolute';
ariaLive.style.left = '-10000px';
ariaLive.style.width = '1px';
ariaLive.style.height = '1px';
ariaLive.style.overflow = 'hidden';
document.body.appendChild(ariaLive);

// Update announcements
function announceProgress(progress: number, mode: string) {
  let message = '';

  if (mode === 'real') {
    const percent = Math.round(progress * 100);
    // Only announce every 25%
    if (percent % 25 === 0) {
      message = `Loading ${percent} percent complete`;
    }
  } else if (mode === 'estimated') {
    message = `Loading, estimated progress ${Math.round(progress * 100)} percent`;
  } else {
    message = `Loading in progress`;
  }

  if (message) {
    ariaLive.textContent = message;
  }
}

// Button ARIA attributes
button.setAttribute('aria-busy', 'true');
button.setAttribute('aria-label', 'Yoink this tweet, loading');

// On completion
button.setAttribute('aria-busy', 'false');
button.setAttribute('aria-label', 'Yoink this tweet');
ariaLive.textContent = 'Loading complete';
```

---

## Technology Stack Confirmation

**Language**: TypeScript 5.x (strict mode) ✅
**Build Tool**: Vite 5.x with @crxjs/vite-plugin ✅
**Platform**: Chrome Extension Manifest V3 ✅
**Animation**: CSS3 transitions + SVG stroke animations ✅
**Testing**: Manual testing (no automated tests requested for this feature)

**New Dependencies**: None
**Modified Files**: `src/ui/yoink-button.ts`, `src/ui/icons.ts`, `src/content-script.ts`

---

## Integration Points

### 1. Existing Button State Management

**Current implementation** (`src/ui/yoink-button.ts:78-96`):
- `disableButton()`: Sets disabled, opacity 0.5, cursor not-allowed
- `enableButton()`: Restores enabled, opacity 1, cursor pointer
- `showButtonError()`: Red color flash, timeout restoration

**Integration approach**:
- Add `showButtonLoading(button, loadingState)` function
- Add `updateButtonProgress(button, progress, mode)` function
- Extend `enableButton()` to clear loading visuals
- Loading state includes both disabled + progress visuals

### 2. Content Script Click Handler

**Current flow** (`src/content-script.ts:75-130`):
```typescript
async function handleYoinkClick(button) {
  disableButton(button);  // STEP 1

  const result = extractTweetData();  // STEP 2
  if (!isExtractionSuccess(result)) {
    showButtonError(button);
    setTimeout(() => enableButton(button), ERROR_DISPLAY_DURATION_MS);
    return;
  }

  const response = await postTweetData(result.data);  // STEP 3

  if (isAsyncResponse(response)) {
    // Polling starts in service worker
    // Button stays disabled until async completion
  }

  enableButton(button);  // STEP 4
}
```

**Updated flow with loading indicators**:
```typescript
async function handleYoinkClick(button) {
  showButtonLoading(button, { mode: 'indeterminate' });  // NEW: Show pulse

  const result = extractTweetData();
  if (!isExtractionSuccess(result)) {
    hideButtonLoading(button);
    showButtonError(button);
    setTimeout(() => enableButton(button), ERROR_DISPLAY_DURATION_MS);
    return;
  }

  const response = await postTweetData(result.data);

  if (isAsyncResponse(response)) {
    // NEW: Update loading state with server data
    updateButtonProgress(button, {
      mode: response.estimatedDuration ? 'estimated' : 'indeterminate',
      estimatedDuration: response.estimatedDuration,
      requestId: response.requestId
    });
    // Polling will continue updating progress
  } else {
    // Sync response
    showCheckmark(button);  // NEW: Brief success flash
    setTimeout(() => {
      hideButtonLoading(button);
      enableButton(button);
    }, 200);
  }
}
```

### 3. Polling Service Updates

**Current polling** (`src/services/polling-service.ts:65-164`):
- Polls every 5s with backoff
- Checks `data.status` for completion
- Notifies tabs via `ASYNC_COMPLETED` message

**Integration updates**:
- Parse `data.progress` and `data.estimatedDuration` from poll responses
- Broadcast progress updates to content script
- Content script updates button visual state

**New message type**:
```typescript
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'ASYNC_PROGRESS_UPDATE') {
    const button = findButtonForRequest(message.requestId);
    if (button) {
      updateButtonProgress(button, {
        progress: message.progress,
        mode: message.progress ? 'real' : 'estimated'
      });
    }
  }
});
```

---

## Performance Considerations

**Animation Budget**:
- Target: 60fps (16.67ms per frame)
- CSS animations: <1ms per frame (compositor thread)
- JavaScript updates: <5ms per update (progress value changes)
- Total budget: Well under 16.67ms ✅

**Memory**:
- SVG elements: ~2KB per button
- Loading state: ~200 bytes per button
- ARIA live region: 1KB (single shared element)
- Total: <3KB overhead per active loading operation ✅

**Battery Impact**:
- Compositor animations: Minimal (hardware accelerated)
- No JavaScript intervals (use CSS animations)
- Progress updates: Only on poll responses (every 5s)
- Impact: Negligible ✅

---

## Risks and Mitigations

**Risk 1**: SVG rendering performance on low-end devices
- **Mitigation**: Simple circular progress (not complex paths), GPU acceleration
- **Fallback**: If frame rate drops, disable pulse animation (keep radial fill only)

**Risk 2**: Progress calculation inaccuracy with `estimatedDuration`
- **Mitigation**: Cap at 95%, switch to pulse-only if exceeded
- **User expectation**: Visual cue (lower opacity) indicates estimation

**Risk 3**: Memory leak from WeakMap not cleaning up
- **Mitigation**: WeakMap automatically releases when button removed from DOM
- **Validation**: Manual testing with navigation across tweets

**Risk 4**: ARIA announcements too frequent (screen reader spam)
- **Mitigation**: Throttle to 25% intervals, use polite mode
- **Testing**: Validate with NVDA/JAWS screen readers

---

## Testing Strategy

**Manual Testing Scenarios**:

1. **Sync Response** (immediate server response)
   - Verify pulse animation appears immediately
   - Verify checkmark flash on completion
   - Verify button re-enables after 200ms

2. **Async with Progress** (server provides `progress` field)
   - Verify radial fill maps to progress percentage
   - Verify smooth transitions between progress values
   - Verify checkmark on completion

3. **Async with Estimated Duration** (server provides `estimatedDuration` only)
   - Verify radial fill progresses based on elapsed time
   - Verify cap at 95% if duration exceeded
   - Verify pulse speed increases as completion approaches

4. **Async Indeterminate** (no progress data)
   - Verify steady pulse animation (no radial fill)
   - Verify button remains disabled
   - Verify eventual completion or timeout

5. **Error Scenarios**
   - Network error: Verify loading clears, error state shows
   - Invalid progress data: Verify clamping to 0-1 range
   - Rapid button clicks: Verify subsequent clicks ignored

6. **Accessibility**
   - Screen reader announces loading state
   - Progress percentage announced at 25% intervals
   - Completion announced

**Browser Compatibility**:
- Chrome 120+ (latest stable)
- Edge 120+ (Chromium-based)
- No Firefox/Safari support needed (Chrome extension)

---

## Open Questions / Resolved

All technical uncertainties have been resolved through this research phase. No remaining NEEDS CLARIFICATION markers.

---

## References

- **MDN: SVG stroke-dasharray**: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-dasharray
- **CSS Triggers**: https://csstriggers.com/ (for performance analysis)
- **ARIA Live Regions**: https://www.w3.org/WAI/WCAG21/Techniques/aria/ARIA19
- **Twitter/X Design System**: Analysis of existing Twitter loading patterns
