# Feature Specification: Server Response Overlay Display

**Feature Branch**: `004-response-overlay`
**Created**: 2025-10-29
**Status**: Draft
**Input**: User description: "I want to introduce drawing a overlay/popover to the content/twitter page after the response from server. I kind of like something like when there's JSON array with type = text, and content is text, it'll render popover (if there's a lightweight design system, like shadcn or similar, you can pick yourself what fits well), it'll render the text into it, if there's more array elements, those will be generated down"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Text Response in Overlay (Priority: P1)

After clicking the Yoink button on a tweet, users see the server's text response displayed in an attractive overlay on the Twitter/X page, allowing them to read the processed information without leaving the context of the tweet.

**Why this priority**: Core functionality - users need to see the results of their actions. Without this, the async processing results remain invisible to users, making the entire feature pointless.

**Independent Test**: Can be fully tested by configuring a test server that returns a simple text response, clicking Yoink, and verifying the overlay appears with the text content.

**Acceptance Scenarios**:

1. **Given** a tweet with Yoink button and configured endpoint, **When** user clicks Yoink and server returns synchronous text response, **Then** overlay appears immediately with the text content displayed
2. **Given** a tweet with Yoink button and async endpoint, **When** server completes processing and returns text response, **Then** overlay appears with the text content displayed
3. **Given** overlay is visible with content, **When** user clicks outside the overlay or presses Escape key, **Then** overlay closes and user returns to normal Twitter browsing

---

### User Story 2 - View Multiple Response Items (Priority: P2)

When the server returns multiple content items (array of responses), users see each item displayed sequentially in the overlay, allowing them to review all processed information at once.

**Why this priority**: Extends the basic functionality to handle realistic server responses that often contain multiple pieces of information (e.g., tweet analysis with sentiment, keywords, and summary).

**Independent Test**: Can be tested independently by configuring a test server that returns an array with multiple text items, clicking Yoink, and verifying all items appear in the overlay in order.

**Acceptance Scenarios**:

1. **Given** server returns array with 3 text items, **When** overlay displays, **Then** all 3 items are visible in the order received
2. **Given** server returns mixed array with text and other types, **When** overlay displays, **Then** text items are rendered and non-text items are gracefully skipped
3. **Given** overlay displays multiple items, **When** content exceeds viewport height, **Then** overlay becomes scrollable

---

### User Story 3 - Handle Empty or Error Responses (Priority: P3)

When server returns an empty response or processing fails, users see appropriate feedback in the overlay instead of a blank or confusing display.

**Why this priority**: Error handling and edge cases improve user experience but aren't required for core functionality.

**Independent Test**: Can be tested by configuring test server to return empty responses or error states and verifying appropriate messages appear.

**Acceptance Scenarios**:

1. **Given** server returns empty result array, **When** overlay displays, **Then** user sees "No results available" message
2. **Given** server returns error status, **When** overlay would display, **Then** error message appears instead of overlay (existing error handling continues to work)
3. **Given** server returns result without recognizable content, **When** overlay displays, **Then** user sees "No displayable content" message

---

### Edge Cases

- What happens when server returns extremely long text (>10,000 characters)?
- How does overlay handle special characters, emojis, and Unicode content in text?
- What happens if user clicks Yoink on another tweet while overlay is still open?
- How does overlay behave when user scrolls the Twitter timeline while it's visible?
- What happens when result array contains 50+ items?
- How does overlay appear on mobile/narrow viewports?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display an overlay on the Twitter/X page when server returns a completed response with displayable content
- **FR-002**: System MUST parse server response looking for array structures containing content items
- **FR-003**: System MUST render content items where `type = "text"` by displaying the `content` field value
- **FR-004**: System MUST display multiple content items sequentially (vertically stacked) when response array contains multiple entries
- **FR-005**: System MUST provide a way for users to dismiss the overlay (close button, click outside, Escape key)
- **FR-006**: Overlay MUST appear positioned near the original tweet context to maintain user spatial awareness
- **FR-007**: System MUST handle overlay display for both synchronous responses (immediate) and asynchronous responses (after polling completes)
- **FR-008**: System MUST skip or ignore content items with unrecognized types, only rendering items with `type = "text"`
- **FR-009**: Overlay MUST remain visible and stable while user scrolls the Twitter/X page
- **FR-010**: System MUST display appropriate message when response contains no displayable content items
- **FR-011**: Overlay styling MUST be visually distinct from Twitter/X UI to clearly indicate it's extension content
- **FR-012**: System MUST clean up overlay when user navigates away from the current tweet or page

### Key Entities *(include if feature involves data)*

- **Response Content Item**: Individual piece of content returned by server, containing:
  - `type`: Content type identifier (e.g., "text", "image", "link")
  - `content`: The actual content data to display
  - Optional metadata (title, timestamp, etc.)

- **Overlay State**: Manages overlay visibility and content:
  - Currently displayed content items
  - Associated tweet reference
  - Visibility status (open/closed)
  - Positioning information relative to source tweet

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view server response content within 200ms of response completion
- **SC-002**: Overlay remains stable and readable while user scrolls at normal speeds (up to 1000px/sec)
- **SC-003**: Users can dismiss overlay within 1 second using any of the provided close methods
- **SC-004**: Overlay correctly displays responses containing up to 20 content items without performance degradation
- **SC-005**: 95% of users successfully view response content on first attempt after clicking Yoink button
- **SC-006**: Overlay rendering works correctly on viewport widths from 320px (mobile) to 3840px (4K desktop)
