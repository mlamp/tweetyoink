# Feature Specification: Async Loading Indicators

**Feature Branch**: `009-async-loading`
**Created**: 2025-11-03
**Status**: Draft
**Input**: User description: "I want to improve the async experience, so what I'm thinking is that when pressing Yoink button, currently it goes disabled, which is good, but the experience could be enhanced, I want some kind of loader, you can decide would it be in the center screen or we could replace the yoink button with a loader, you can suggest some options and we can then clarify."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Immediate Visual Feedback on Yoink (Priority: P1)

When a user clicks the Yoink button, they see immediate visual feedback that the system is processing their request, eliminating uncertainty about whether their click was registered.

**Why this priority**: Core UX improvement that affects every Yoink interaction. Without loading feedback, users may double-click or think the extension is broken, especially during async processing which can take 30+ seconds.

**Independent Test**: Can be fully tested by clicking any Yoink button and verifying loading indicator appears immediately and delivers clear "processing" feedback to users.

**Acceptance Scenarios**:

1. **Given** user is viewing a tweet with a Yoink button, **When** user clicks the Yoink button, **Then** loading indicator appears within 100ms
2. **Given** user clicked Yoink button, **When** extraction and POST request are in progress, **Then** loading indicator remains visible throughout the entire operation
3. **Given** loading indicator is showing, **When** user hovers over or tries to interact with the button, **Then** cursor shows "not-allowed" and button remains non-interactive

---

### User Story 2 - Loading State During Async Processing (Priority: P2)

When the server returns an async response, users see a loading indicator that persists while the extension polls for results, providing transparency about the ongoing background work.

**Why this priority**: Essential for async/polling scenarios (5+ seconds). Users need to know their request is still being processed and hasn't been forgotten.

**Independent Test**: Can be fully tested using async test server, clicking Yoink, and verifying loading persists during polling phase until completion.

**Acceptance Scenarios**:

1. **Given** server responds with async pending status, **When** extension begins polling, **Then** loading indicator remains visible with appropriate messaging
2. **Given** async request is being polled, **When** user navigates to other tweets or scrolls page, **Then** loading indicator remains accessible/visible (e.g., persists in fixed position or updates original button)
3. **Given** async polling is in progress, **When** polling completes successfully, **Then** loading indicator is replaced with success state and overlay appears

---

### User Story 3 - Loading Completion and Error States (Priority: P3)

When processing completes (success or error), users see clear visual feedback and the button returns to its ready state, enabling them to perform another Yoink if desired.

**Why this priority**: Completes the feedback loop and handles edge cases. Lower priority because button re-enabling already exists, this just enhances the visual transition.

**Independent Test**: Can be fully tested by triggering both successful and failed Yoink operations and verifying smooth state transitions.

**Acceptance Scenarios**:

1. **Given** loading indicator is showing, **When** server responds with completed status, **Then** loading indicator smoothly transitions out and button returns to ready state
2. **Given** loading indicator is showing, **When** request fails (network error, server error, timeout), **Then** loading indicator is replaced with error state briefly before returning to ready
3. **Given** async request completed, **When** overlay is displayed, **Then** button is re-enabled and ready for next interaction

---

### Edge Cases

- What happens when user clicks Yoink multiple times rapidly before loading indicator appears?
  - First click should disable button and show loader; subsequent clicks should be ignored (button already disabled)

- How does loading indicator behave if user navigates away during async processing?
  - Loading state is lost (acceptable, follows Twitter's action button pattern)
  - Button returns to default state on new page
  - Async request continues polling in background (service worker handles completion)

- What happens when polling times out after 5 minutes?
  - Loading indicator should transition to error state, then button re-enables

- How does loading indicator interact with existing button states (hover, focus)?
  - Loading state should override hover/focus effects; button should be non-interactive

- What happens if extension loses network connectivity during polling?
  - Loading indicator should eventually timeout and show error state per existing polling timeout logic

- What happens if server provides invalid progress data (e.g., progress > 1.0 or negative)?
  - Clamp progress to valid range (0.0-1.0)
  - Log warning to console for debugging
  - Continue with clamped value

- What happens if estimated progress exceeds 100% (operation takes longer than estimatedDuration)?
  - Cap visual progress at 95% and switch to pulse-only mode
  - Indicates "almost done but taking longer than expected"

- What happens if server switches between progress data types during polling?
  - Use the most recent data type provided
  - Smoothly transition between visual modes (radial fill ↔ pulse-only)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a visual loading indicator within 100ms of Yoink button click
- **FR-002**: Loading indicator MUST remain visible throughout entire extraction, POST request, and polling phases
- **FR-003**: Loading indicator MUST prevent user interaction with button during loading (button disabled state)
- **FR-004**: System MUST smoothly transition loading indicator to completion state (success or error) when processing finishes
- **FR-005**: Loading indicator MUST be visually consistent with Twitter/X design language (colors, animations, sizing)
- **FR-006**: System MUST support loading indicators for both synchronous (immediate) and asynchronous (polling) server responses
- **FR-007**: Loading indicator MUST use Smart Hybrid approach with radial fill progress that adapts to available server data (progress field, estimatedDuration, or fallback pulse)
- **FR-008**: System MUST maintain existing button accessibility attributes (aria-label, aria-disabled) during loading states
- **FR-009**: Loading indicator MUST be visible to screen reader users with appropriate ARIA live region announcements
- **FR-010**: System MUST restore button to ready state after loading completes or times out
- **FR-011**: System MUST display radial fill progress when server response includes `progress` field (0.0-1.0 range)
- **FR-012**: System MUST calculate and display estimated progress when server response includes `estimatedDuration` field but no `progress` field
- **FR-013**: System MUST display pulsing animation without radial fill when no progress data is available (fallback mode)
- **FR-014**: System MUST show checkmark overlay for 200ms upon successful completion before returning button to ready state
- **FR-015**: System MUST update progress indicator in real-time during polling (every poll response updates visual state)

### Key Entities

- **Loading State**: Represents current processing status (idle, loading, success, error) of a Yoink operation
  - Tracks: operation phase (extraction, POST, polling), start time, associated tweet ID, progress data source
  - Progress modes: real (from server `progress` field), estimated (calculated from `estimatedDuration`), indeterminate (no data)
  - Transitions: idle → loading → (success | error) → idle

- **Progress Data**: Information used to calculate and display loading progress
  - Sources: server `progress` field (0.0-1.0), server `estimatedDuration` (seconds), or none (fallback)
  - Calculated fields: elapsed time, estimated progress percentage, pulse speed
  - Updates: Received from each poll response in async mode

- **Visual Indicator**: Radial fill and pulse animation within button
  - Attributes: fill percentage (0-100%), pulse interval (0.5s-1s), opacity (60%-100%), display mode (radial/pulse-only)
  - Relationship: Associated with specific Yoink button, updates based on Loading State and Progress Data

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users see loading feedback within 100ms of clicking Yoink button in 100% of interactions
- **SC-002**: Loading indicator is visible for entire duration of operations lasting >1 second
- **SC-003**: User confidence in extension operation increases (measured by reduction in duplicate clicks or page reloads during processing)
- **SC-004**: Loading indicator animates smoothly at 60fps without janky frames
- **SC-005**: Zero JavaScript errors related to loading state management or visual transitions

### Smart Hybrid Loading Design (Selected Approach)

The loading indicator uses a **Smart Hybrid** approach that adapts to whatever progress data the server provides, ensuring optimal user experience across all scenarios.

**Visual Implementation**: Radial fill progress within the circular Yoink button

**How it works across different scenarios**:

**Scenario 1: Server provides `progress` field (0.0-1.0)**
- Yoink icon remains visible but dimmed
- Radial fill (clockwise from 12 o'clock) directly maps to progress percentage
- Gentle pulse overlay (1s interval) indicates "still alive"
- Example: 0.65 progress = 65% of circle filled in Twitter blue

**Scenario 2: Server provides `estimatedDuration` only**
- Calculate estimated progress: `elapsed time / estimatedDuration`
- Show radial fill based on calculated estimate
- Pulse faster as estimated completion approaches (1s → 0.5s at 90%)
- Visual cue that this is estimated (slightly lower opacity than true progress)

**Scenario 3: No progress data (sync or basic async)**
- Show pulsing icon with gentle scale animation (98% → 102%)
- Pulse interval: 1s (steady rhythm)
- No radial fill (indicates unknown duration)
- Icon color: Twitter blue dimmed to 60% opacity

**Completion state**:
- Brief checkmark overlay (200ms flash)
- Smooth fade transition back to normal button state
- Button re-enables for next interaction

**Visual characteristics**:
- Radial fill color: Twitter blue (#1D9BF0)
- Fill direction: Clockwise from top (12 o'clock position)
- Pulse animation: Subtle scale (98% ↔ 102%) + opacity (60% ↔ 80%)
- Smooth transitions: All state changes use 200ms ease-out
- Matches circular button shape (34.75px diameter)

## Assumptions

- **Design Consistency**: Loading indicators should match Twitter/X's existing design patterns (colors, animations, timing)
- **Animation Performance**: Modern browsers support CSS animations, SVG radial fills, and transitions at 60fps without performance degradation
- **Accessibility**: Screen readers will announce loading state changes via ARIA live regions (polite mode) with progress percentage when available
- **No Persistent State**: Loading state is ephemeral per page session; navigating away resets state (no need to persist in chrome.storage)
- **Single Active Request**: One Yoink operation per button at a time; concurrent requests on different tweets are independent
- **Network Reliability**: Existing timeout and error handling in polling service is sufficient; loading indicator simply reflects these states visually
- **Mobile Responsiveness**: Loading indicators will scale appropriately for mobile Twitter/X interface without additional responsive design work
- **Progress Data Optional**: Most servers won't initially provide `progress` or `estimatedDuration` fields; fallback pulse mode is the default expected behavior
- **SVG Support**: All modern browsers support SVG for radial fill implementation (no need for legacy fallbacks)
- **Time Calculation**: Browser's `Date.now()` is sufficient for elapsed time calculation; no need for high-precision timers

## Dependencies

- **Feature 002** (Post View Yoink): Existing Yoink button infrastructure and click handling
- **Feature 003** (Config Endpoint): Existing polling service and async request handling
- **Feature 004** (Response Overlay): Overlay display system that shows after loading completes

## Out of Scope

- **Progress Bars**: Showing granular progress (e.g., "60% complete") - server doesn't provide this data
- **Cancellation**: Ability to cancel in-flight Yoink operation
- **Queue Management**: Displaying multiple concurrent Yoink operations across different tweets
- **Loading Analytics**: Tracking loading duration metrics or user behavior during loading
- **Retry Mechanism**: Automatic retry on failure (user must manually click Yoink again)
