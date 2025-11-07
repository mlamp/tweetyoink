# Response Display Capability

## Purpose

This capability enables users to see server processing results displayed in an overlay on the Twitter/X page, supporting text, images, and debug information with loading states for async operations.

## Requirements

### Requirement: Overlay Display on Response

The system SHALL display an overlay on the Twitter/X page when server returns a completed response with displayable content.

#### Scenario: Show overlay on synchronous response
- **WHEN** user clicks Yoink and server returns immediate text response
- **THEN** overlay appears with the text content displayed

#### Scenario: Show overlay on async completion
- **WHEN** server completes async processing and returns final response
- **THEN** overlay appears with the content displayed

#### Scenario: Overlay positioning near tweet
- **WHEN** overlay appears
- **THEN** it is positioned near the original tweet context to maintain user spatial awareness

### Requirement: Response Content Parsing

The system MUST parse server response looking for array structures containing content items.

#### Scenario: Parse content array
- **WHEN** server returns response with content array
- **THEN** system extracts each content item for rendering

### Requirement: Text Content Rendering

The system SHALL render content items where type equals "text" by displaying the content field value.

#### Scenario: Display text content item
- **WHEN** content array includes item with type "text"
- **THEN** content value is rendered as text in overlay

#### Scenario: Display multiple text items
- **WHEN** server returns array with 3 text items
- **THEN** all 3 items are visible in the order received

### Requirement: Title Support for Content Items

The system MUST support optional title field on all content item types and display title as header above content when present.

#### Scenario: Display content with title
- **WHEN** server returns text item with title "Sentiment Analysis"
- **THEN** title appears as header above the content text

#### Scenario: Backward compatibility without title
- **WHEN** server returns content item without title field
- **THEN** content displays normally without title header

#### Scenario: Distinct title styling
- **WHEN** title is displayed
- **THEN** title text is visually distinct from content (bold, different color, or larger font)

### Requirement: Image Content Rendering

The system SHALL render content items where type equals "image" by displaying the image from the content URL.

#### Scenario: Display image content
- **WHEN** content array includes item with type "image"
- **THEN** image is rendered in overlay using content field as image URL

#### Scenario: Image with title
- **WHEN** server returns image item with title "Profile Analysis"
- **THEN** title appears above the image

### Requirement: Debug Content Type Support

The system MUST support content type "debug" alongside existing types (text, image).

#### Scenario: Recognize debug content type
- **WHEN** server returns content item with type "debug"
- **THEN** system processes it as debug content requiring JSON formatting

### Requirement: Debug Content Formatting

Debug items SHALL render content as formatted JSON with 2-space indentation and monospaced font.

#### Scenario: Format debug JSON with indentation
- **WHEN** debug item contains JSON object content
- **THEN** JSON is formatted with 2-space indentation and monospaced font

#### Scenario: Format nested JSON structures
- **WHEN** debug item contains nested JSON objects and arrays
- **THEN** all nested structures are properly indented and readable

#### Scenario: Debug with title
- **WHEN** debug item includes title "Request Metadata"
- **THEN** title appears above the formatted JSON block

#### Scenario: Scrollable debug content
- **WHEN** debug JSON contains 100+ lines
- **THEN** content is scrollable while maintaining fixed-width formatting

### Requirement: Debug Content Detection

The system SHALL detect debug content by checking metadata.is_debug flag for backward compatibility.

#### Scenario: Detect via metadata flag
- **WHEN** content item has type "text" but metadata.is_debug is true
- **THEN** system renders it as debug content with JSON formatting

### Requirement: Development Mode Debug Display

Debug information SHALL only be displayed when running in development mode.

#### Scenario: Show debug in development
- **WHEN** extension runs in development mode and server returns debug content
- **THEN** debug information is displayed in overlay

#### Scenario: Hide debug in production
- **WHEN** extension runs in production mode and server returns debug content
- **THEN** debug content is ignored and not displayed

### Requirement: Debug Section Positioning

Debug content MUST be rendered at the end of overlay content (after all analysis text).

#### Scenario: Debug appears after other content
- **WHEN** response contains mix of text and debug items
- **THEN** debug items appear after all non-debug content

### Requirement: Multiple Content Items Display

The system SHALL display multiple content items sequentially (vertically stacked) when response array contains multiple entries.

#### Scenario: Stack multiple items vertically
- **WHEN** response contains multiple content items
- **THEN** items are displayed vertically stacked in order

#### Scenario: Handle scrollable content
- **WHEN** content exceeds viewport height
- **THEN** overlay becomes scrollable

### Requirement: Content Type Filtering

The system MUST skip or ignore content items with unrecognized types, only rendering items with supported types.

#### Scenario: Skip unsupported types
- **WHEN** server returns array with mix of supported and unsupported types
- **THEN** only supported types (text, image, debug) are rendered

### Requirement: Overlay Dismissal

The system SHALL provide ways for users to dismiss the overlay (close button, click outside, Escape key).

#### Scenario: Close via close button
- **WHEN** user clicks close button on overlay
- **THEN** overlay is dismissed

#### Scenario: Close via Escape key
- **WHEN** user presses Escape key while overlay is visible
- **THEN** overlay is dismissed

#### Scenario: Close via click outside
- **WHEN** user clicks outside overlay area
- **THEN** overlay is dismissed

### Requirement: Overlay Stability on Scroll

Overlay MUST remain visible and stable while user scrolls the Twitter/X page.

#### Scenario: Maintain visibility during scroll
- **WHEN** user scrolls Twitter timeline with overlay open
- **THEN** overlay remains visible and readable

### Requirement: Empty Response Handling

The system SHALL display appropriate message when response contains no displayable content items.

#### Scenario: Show message for empty results
- **WHEN** server returns empty result array
- **THEN** user sees "No results available" message in overlay

#### Scenario: Show message for no displayable content
- **WHEN** server returns result without recognizable content types
- **THEN** user sees "No displayable content" message

### Requirement: Overlay Visual Distinction

Overlay styling MUST be visually distinct from Twitter/X UI to clearly indicate it's extension content.

#### Scenario: Distinct visual appearance
- **WHEN** overlay appears over Twitter page
- **THEN** styling clearly distinguishes it as extension-generated content

### Requirement: Overlay Cleanup on Navigation

The system MUST clean up overlay when user navigates away from current tweet or page.

#### Scenario: Remove overlay on navigation
- **WHEN** user navigates to different page
- **THEN** overlay is removed and cleaned up

### Requirement: Immediate Loading Feedback

The system SHALL display a visual loading indicator within 100ms of Yoink button click.

#### Scenario: Loading indicator appears immediately
- **WHEN** user clicks Yoink button
- **THEN** loading indicator appears within 100ms

#### Scenario: Cursor shows not-allowed during loading
- **WHEN** loading indicator is showing and user hovers over button
- **THEN** cursor shows "not-allowed" and button remains non-interactive

### Requirement: Loading State Persistence

Loading indicator MUST remain visible throughout entire extraction, POST request, and polling phases.

#### Scenario: Loading persists during POST
- **WHEN** extraction and POST request are in progress
- **THEN** loading indicator remains visible throughout entire operation

#### Scenario: Loading persists during async polling
- **WHEN** server responds with async pending status and extension begins polling
- **THEN** loading indicator remains visible with appropriate messaging

### Requirement: Loading State Prevention

Loading indicator MUST prevent user interaction with button during loading (button disabled state).

#### Scenario: Button disabled during loading
- **WHEN** loading indicator is showing
- **THEN** Yoink button is disabled and non-interactive

### Requirement: Loading Completion Transitions

The system MUST smoothly transition loading indicator to completion state (success or error) when processing finishes.

#### Scenario: Transition on success
- **WHEN** server responds with completed status
- **THEN** loading indicator smoothly transitions out and button returns to ready state

#### Scenario: Transition on error
- **WHEN** request fails (network error, server error, timeout)
- **THEN** loading indicator is replaced with error state briefly before returning to ready

#### Scenario: Button re-enabled after completion
- **WHEN** async request completes and overlay is displayed
- **THEN** button is re-enabled and ready for next interaction

### Requirement: Loading Indicator Design Consistency

Loading indicator MUST be visually consistent with Twitter/X design language (colors, animations, sizing).

#### Scenario: Match Twitter design system
- **WHEN** loading indicator is displayed
- **THEN** colors, animations, and sizing match Twitter/X native UI patterns

### Requirement: Adaptive Progress Display

Loading indicator MUST use adaptive radial fill progress that responds to available server data (progress field, estimatedDuration, or fallback pulse).

#### Scenario: Use server-provided progress
- **WHEN** server response includes progress field
- **THEN** loading indicator displays radial fill matching progress value

#### Scenario: Use estimated progress from duration
- **WHEN** server provides estimatedDuration but no progress field
- **THEN** loading indicator calculates progress based on elapsed time vs estimated duration

#### Scenario: Fallback to pulse animation
- **WHEN** server provides neither progress nor estimatedDuration
- **THEN** loading indicator uses pulse-only animation without progress fill

#### Scenario: Clamp invalid progress values
- **WHEN** server provides invalid progress (negative or > 1.0)
- **THEN** progress is clamped to valid range (0.0-1.0) and warning logged to console

### Requirement: JSON Error Handling

The system MUST handle JSON serialization errors gracefully in debug content.

#### Scenario: Handle malformed JSON
- **WHEN** debug content is not valid JSON-serializable
- **THEN** display error message instead of content without crashing overlay

### Requirement: Title Text Sanitization

The system MUST sanitize title text to prevent XSS attacks (same as existing content rendering).

#### Scenario: Sanitize title for security
- **WHEN** title text is rendered
- **THEN** text is sanitized to prevent XSS injection

### Requirement: Viewport Responsiveness

The system SHALL support overlay display on viewport widths from 320px (mobile) to 3840px (4K desktop).

#### Scenario: Responsive on narrow mobile
- **WHEN** viewport width is 320px
- **THEN** overlay adjusts layout to remain readable

#### Scenario: Responsive on wide desktop
- **WHEN** viewport width is 3840px
- **THEN** overlay maintains appropriate sizing and positioning

### Requirement: Performance with Many Items

The system SHALL correctly display responses containing up to 20 content items without performance degradation.

#### Scenario: Render 20 items efficiently
- **WHEN** response contains 20 content items
- **THEN** all items render without performance issues
