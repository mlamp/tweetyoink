# Data Model: Async Loading Indicators

**Feature**: 009-async-loading
**Date**: 2025-11-03
**Phase**: 1 (Design & Contracts)

## Overview

This document defines the data structures and state management for the Smart Hybrid loading indicator system.

## Entities

### 1. LoadingState

**Purpose**: Tracks the current loading status for a specific Yoink button operation

**Lifecycle**: Created on button click → Updated during processing → Destroyed on completion/error

**Storage**: WeakMap keyed by button element (automatic cleanup when button removed from DOM)

```typescript
interface LoadingState {
  /** Current loading status */
  status: 'idle' | 'loading' | 'success' | 'error';

  /** Progress calculation mode */
  mode: 'real' | 'estimated' | 'indeterminate';

  /** Current progress value (0.0-1.0) */
  progress: number;

  /** When loading started (milliseconds since epoch) */
  startTime: number;

  /** Server-provided estimated duration in seconds (optional) */
  estimatedDuration?: number;

  /** Request ID for async tracking (optional) */
  requestId?: string;

  /** Associated tweet ID for correlation */
  tweetId?: string;
}
```

**Initial State** (on button click):
```typescript
{
  status: 'loading',
  mode: 'indeterminate',
  progress: 0,
  startTime: Date.now()
}
```

**State Transitions**:
```
idle → loading (button click)
loading → loading (progress updates during polling)
loading → success (server returns completed)
loading → error (network error, timeout, server error)
success → idle (after 200ms checkmark display)
error → idle (after error display duration)
```

**Validation Rules**:
- `progress` MUST be clamped to [0, 1] range
- `mode` MUST be 'real' only if server provides `progress` field
- `mode` MUST be 'estimated' only if server provides `estimatedDuration` field
- `startTime` MUST be valid timestamp (Date.now() format)

---

### 2. ProgressData

**Purpose**: Parsed progress information from server responses

**Lifecycle**: Created from poll response → Used to update LoadingState → Discarded

**Source**: Extracted from `PostResponse` (async mode)

```typescript
interface ProgressData {
  /** Server-provided progress (0.0-1.0) or null */
  progress: number | null;

  /** Server-provided estimated duration in seconds or null */
  estimatedDuration: number | null;

  /** Response status */
  status: 'pending' | 'processing' | 'completed' | 'failed';

  /** Optional status message */
  message?: string;
}
```

**Extraction Logic**:
```typescript
function extractProgressData(response: PostResponse): ProgressData {
  if (response.status === 'completed' || response.status === 'failed') {
    return {
      progress: null,
      estimatedDuration: null,
      status: response.status
    };
  }

  // Async response (pending or processing)
  const asyncResponse = response as AsyncResponse;

  return {
    progress: asyncResponse.progress ?? null,
    estimatedDuration: asyncResponse.estimatedDuration ?? null,
    status: asyncResponse.status,
    message: asyncResponse.message
  };
}
```

**Validation Rules**:
- `progress` MUST be null or [0, 1]
- `estimatedDuration` MUST be null or positive number (seconds)
- Invalid values MUST be logged and replaced with null (fallback to indeterminate)

---

### 3. VisualState

**Purpose**: Describes the visual appearance of the loading indicator

**Lifecycle**: Calculated from LoadingState → Applied to DOM → Recalculated on updates

**Does not persist**: Derived from LoadingState on each render

```typescript
interface VisualState {
  /** Display radial fill progress */
  showRadialFill: boolean;

  /** Fill percentage (0-100) for radial progress */
  fillPercent: number;

  /** Show pulsing animation */
  showPulse: boolean;

  /** Pulse animation speed in milliseconds */
  pulseSpeed: number;

  /** Icon opacity (0.0-1.0) */
  opacity: number;

  /** Display mode indicator */
  displayMode: 'progress' | 'estimated' | 'pulse-only';
}
```

**Calculation Logic**:
```typescript
function calculateVisualState(loadingState: LoadingState): VisualState {
  const { mode, progress, startTime, estimatedDuration } = loadingState;

  // Real progress mode
  if (mode === 'real') {
    return {
      showRadialFill: true,
      fillPercent: Math.round(progress * 100),
      showPulse: true,
      pulseSpeed: 1000,  // Steady 1s pulse
      opacity: 1.0,  // Full opacity for real progress
      displayMode: 'progress'
    };
  }

  // Estimated progress mode
  if (mode === 'estimated' && estimatedDuration) {
    const elapsed = (Date.now() - startTime) / 1000;
    const estimatedProgress = Math.min(0.95, elapsed / estimatedDuration);

    // If exceeded estimate, switch to pulse-only
    if (estimatedProgress >= 0.95) {
      return {
        showRadialFill: false,
        fillPercent: 0,
        showPulse: true,
        pulseSpeed: 500,  // Faster pulse to indicate "almost done"
        opacity: 0.6,
        displayMode: 'pulse-only'
      };
    }

    // Calculate pulse speed (faster as completion approaches)
    const pulseSpeed = 1000 * (1 - (estimatedProgress * 0.5)); // 1s → 0.5s

    return {
      showRadialFill: true,
      fillPercent: Math.round(estimatedProgress * 100),
      showPulse: true,
      pulseSpeed,
      opacity: 0.8,  // Slightly lower to indicate estimation
      displayMode: 'estimated'
    };
  }

  // Indeterminate mode (no progress data)
  return {
    showRadialFill: false,
    fillPercent: 0,
    showPulse: true,
    pulseSpeed: 1000,  // Steady pulse
    opacity: 0.6,
    displayMode: 'pulse-only'
  };
}
```

---

## State Management

### Storage Strategy

**Component-Local State** (No global state library needed)

```typescript
// WeakMap for automatic cleanup when buttons removed from DOM
const buttonLoadingStates = new WeakMap<HTMLButtonElement, LoadingState>();

// Get/Set operations
function getLoadingState(button: HTMLButtonElement): LoadingState | null {
  return buttonLoadingStates.get(button) ?? null;
}

function setLoadingState(button: HTMLButtonElement, state: LoadingState): void {
  buttonLoadingStates.set(button, state);
}

function clearLoadingState(button: HTMLButtonElement): void {
  buttonLoadingStates.delete(button);
}
```

**Rationale for WeakMap**:
- ✅ Automatic garbage collection when button removed
- ✅ No memory leaks from orphaned state
- ✅ Fast O(1) lookups
- ✅ No need for manual cleanup tracking

---

### Update Flow

**Sequence Diagram**:
```
User Click → Initialize Loading State
    ↓
Extract Tweet Data (still loading)
    ↓
POST to Server
    ↓
Response Type?
    ├─ Sync (completed) → Show Checkmark → Clear State
    └─ Async (pending/processing)
        ↓
        Update Mode (real/estimated/indeterminate)
        ↓
        Start Polling
        ↓
        Each Poll Response → Update Progress → Re-render
        ↓
        Completion → Show Checkmark → Clear State
```

**Code Flow**:
```typescript
// 1. Button Click
function handleYoinkClick(button: HTMLButtonElement) {
  const initialState: LoadingState = {
    status: 'loading',
    mode: 'indeterminate',
    progress: 0,
    startTime: Date.now()
  };
  setLoadingState(button, initialState);
  renderLoadingIndicator(button, initialState);
}

// 2. Server Response
function handleServerResponse(button: HTMLButtonElement, response: PostResponse) {
  const state = getLoadingState(button);
  if (!state) return;

  if (response.status === 'completed') {
    // Sync response
    state.status = 'success';
    renderSuccessState(button);
    setTimeout(() => clearLoadingState(button), 200);
  } else {
    // Async response - update mode
    const progressData = extractProgressData(response);
    state.mode = determineMode(progressData);
    state.estimatedDuration = progressData.estimatedDuration ?? undefined;
    state.requestId = (response as AsyncResponse).requestId;
    setLoadingState(button, state);
    renderLoadingIndicator(button, state);
  }
}

// 3. Poll Update (async mode)
function handlePollUpdate(requestId: string, response: PostResponse) {
  const button = findButtonForRequest(requestId);
  if (!button) return;

  const state = getLoadingState(button);
  if (!state) return;

  if (response.status === 'completed') {
    state.status = 'success';
    renderSuccessState(button);
    setTimeout(() => clearLoadingState(button), 200);
  } else {
    // Update progress
    const progressData = extractProgressData(response);
    state.progress = progressData.progress ?? calculateEstimatedProgress(state);
    setLoadingState(button, state);
    renderLoadingIndicator(button, state);
  }
}
```

---

## Relationships

### LoadingState → VisualState
- **Type**: Transformation (1:1)
- **Direction**: LoadingState → VisualState (one-way)
- **Calculation**: `calculateVisualState(loadingState)` (derived state)

### Button Element → LoadingState
- **Type**: Association (1:1)
- **Direction**: Button → LoadingState
- **Storage**: WeakMap
- **Cardinality**: One button has at most one loading state

### RequestID → Button Element
- **Type**: Association (1:1 during polling)
- **Direction**: Bidirectional (need to find button from requestId)
- **Storage**: Map<string, HTMLButtonElement> (cleaned up on completion)

---

## Data Flow Diagram

```
┌─────────────────┐
│  User Action    │
│  (Button Click) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ LoadingState    │ ◄──── Initial: { mode: 'indeterminate', progress: 0 }
│ (Created)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Server Response │
└────────┬────────┘
         │
         ├─ Sync Response
         │      ↓
         │  ┌─────────────────┐
         │  │ Success State   │
         │  └─────────────────┘
         │
         └─ Async Response
                ↓
         ┌─────────────────┐
         │ ProgressData    │ ◄──── Extract from response
         │ (Parsed)        │
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │ LoadingState    │ ◄──── Update mode & progress
         │ (Updated)       │
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │ Poll Response   │ ◄──── Every 5s (with backoff)
         └────────┬────────┘
                  │
                  ├─ Status: processing → Update progress → Loop
                  │
                  └─ Status: completed → Success State → Clear
```

---

## Validation & Error Handling

### Progress Value Validation

```typescript
function clampProgress(value: number | null | undefined): number {
  if (value == null || isNaN(value)) {
    logger.warn('[LoadingState] Invalid progress value, defaulting to 0:', value);
    return 0;
  }

  if (value < 0) {
    logger.warn('[LoadingState] Progress < 0, clamping to 0:', value);
    return 0;
  }

  if (value > 1) {
    logger.warn('[LoadingState] Progress > 1, clamping to 1:', value);
    return 1;
  }

  return value;
}
```

### Estimated Duration Validation

```typescript
function validateEstimatedDuration(value: number | null | undefined): number | null {
  if (value == null) return null;

  if (isNaN(value) || value <= 0) {
    logger.warn('[LoadingState] Invalid estimatedDuration, ignoring:', value);
    return null;
  }

  // Reasonable upper bound (30 minutes)
  if (value > 1800) {
    logger.warn('[LoadingState] estimatedDuration > 30min, capping:', value);
    return 1800;
  }

  return value;
}
```

### State Consistency Checks

```typescript
function validateLoadingState(state: LoadingState): boolean {
  // Progress must be in valid range
  if (state.progress < 0 || state.progress > 1) {
    logger.error('[LoadingState] Invalid progress range:', state.progress);
    return false;
  }

  // Real mode requires progress data (shouldn't be 0 unless just started)
  if (state.mode === 'real' && state.progress === 0 && Date.now() - state.startTime > 1000) {
    logger.warn('[LoadingState] Real mode with 0 progress after 1s, may be stuck');
  }

  // Estimated mode requires estimatedDuration
  if (state.mode === 'estimated' && !state.estimatedDuration) {
    logger.error('[LoadingState] Estimated mode without estimatedDuration');
    return false;
  }

  return true;
}
```

---

## Performance Considerations

**Memory Footprint per Button**:
- LoadingState: ~200 bytes
- VisualState: ~100 bytes (derived, not stored)
- SVG elements: ~2KB
- **Total**: ~2.5KB per active loading operation

**Maximum Concurrent Operations**: 10 buttons (Twitter timeline typically shows 5-10 tweets)
**Peak Memory**: ~25KB (negligible)

**State Update Frequency**:
- User interaction: ~1 per second (button clicks)
- Poll updates: Every 5 seconds (with backoff)
- Visual updates: On demand (no polling of state)
- **Impact**: Minimal, well within performance budget

---

## Summary

The data model uses three core entities:
1. **LoadingState**: Persistent state for active operations
2. **ProgressData**: Ephemeral parsed server data
3. **VisualState**: Derived visual representation

State management uses component-local WeakMaps (no global state), with automatic cleanup and efficient updates.
