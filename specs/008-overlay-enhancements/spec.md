# Feature Specification: Overlay Title Support and Debug JSON Type

**Feature Branch**: `008-overlay-enhancements`
**Created**: 2025-11-01
**Status**: Draft
**Input**: User description: "It would be good to review the server response and overlay case. I would like to have structure for text and even image to accept 'title' attribute, so when drawing the overlay, title would be there before content. Also, I would like to introduce new type (next to text, image), 'debug', which would have the 'content' part as JSON (object) and the overlay would draw it as same as text block, but it should be nicely formatted like 2 spaced, you know like normal json in the editor, but it should be monospaced and nicely formatted in layout block, still can have the title as well."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Content Items with Titles (Priority: P1)

After receiving a server response, users see each content item displayed with an optional title header, allowing them to quickly understand what each piece of information represents without reading the entire content.

**Why this priority**: Core enhancement that improves readability and user comprehension for all existing content types (text, image). Without titles, users must infer meaning from content alone, which is less efficient and can be ambiguous.

**Independent Test**: Can be fully tested by configuring test server to return text responses with title fields, clicking Yoink, and verifying titles appear above content blocks in the overlay.

**Acceptance Scenarios**:

1. **Given** server returns text item with title "Sentiment Analysis", **When** overlay displays, **Then** title appears as a header above the content text
2. **Given** server returns text item without title field, **When** overlay displays, **Then** content displays normally without title header (backward compatible)
3. **Given** server returns multiple items with different titles, **When** overlay displays, **Then** each item shows its own distinct title above its content
4. **Given** server returns image item with title "Profile Analysis", **When** overlay displays image, **Then** title appears above the image

---

### User Story 2 - View Debug JSON Data (Priority: P2)

When server returns debug or structured data, users see a nicely formatted JSON block in the overlay with monospaced font and proper indentation, making technical data readable and easy to inspect.

**Why this priority**: Enables developers and power users to inspect raw response data, debug server issues, and understand detailed processing results. Essential for development and troubleshooting but not required for basic end-user functionality.

**Independent Test**: Can be tested independently by configuring test server to return content items with `type="debug"` and JSON object content, then verifying proper formatting in overlay.

**Acceptance Scenarios**:

1. **Given** server returns debug item with JSON object content, **When** overlay displays, **Then** JSON is formatted with 2-space indentation and monospaced font
2. **Given** debug item contains nested JSON objects and arrays, **When** overlay displays, **Then** all nested structures are properly indented and readable
3. **Given** debug item includes title "Request Metadata", **When** overlay displays, **Then** title appears above the formatted JSON block
4. **Given** debug JSON contains 100+ lines, **When** overlay displays, **Then** content is scrollable while maintaining fixed-width formatting

---

### User Story 3 - Mix Titled and Untitled Content (Priority: P3)

When server returns a mix of content items (some with titles, some without, different types), users see a cohesive overlay display that handles all variations gracefully without layout issues.

**Why this priority**: Edge case handling and polish. Ensures backward compatibility and graceful degradation but not critical for core functionality.

**Independent Test**: Can be tested by configuring test server to return mixed array with titled text, untitled text, debug items, and images, then verifying all render correctly.

**Acceptance Scenarios**:

1. **Given** server returns array with 2 titled items and 2 untitled items, **When** overlay displays, **Then** titled items show headers and untitled items appear normally
2. **Given** server returns mix of text, debug, and image items with various title configurations, **When** overlay displays, **Then** all items render in order with appropriate formatting
3. **Given** title string is empty (""), **When** overlay displays, **Then** no title header appears (treated as missing)
4. **Given** title contains special characters and emojis, **When** overlay displays, **Then** title renders correctly with proper character encoding

---

### Edge Cases

- What happens when title text exceeds 100 characters?
- How does overlay handle debug content with circular JSON references or invalid JSON?
- What happens if content contains 50+ nested JSON levels?
- How does monospaced debug formatting appear on narrow mobile viewports (320px)?
- What happens when title contains newline characters or HTML tags?
- How does overlay handle debug items with extremely large JSON (>50KB)?
- What happens when debug content is a JSON primitive (string, number, boolean) instead of object/array?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support optional `title` field on all ResponseContentItem types (text, image, debug)
- **FR-002**: System MUST display title as a header above content when title field is present and non-empty
- **FR-003**: System MUST maintain backward compatibility - items without title field continue to work as before
- **FR-004**: System MUST support new content type `"debug"` alongside existing types (text, image)
- **FR-005**: Debug items MUST accept `content` as JSON object (not string) containing structured data to display
- **FR-006**: System MUST render debug content as formatted JSON with 2-space indentation
- **FR-007**: Debug content MUST use monospaced font family (e.g., Consolas, Monaco, Courier New)
- **FR-008**: System MUST preserve JSON structure including nested objects, arrays, and all data types (strings, numbers, booleans, null)
- **FR-009**: System MUST handle JSON serialization errors gracefully - if content is not valid JSON-serializable, display error message
- **FR-010**: Title text MUST be visually distinct from content (e.g., bold, different color, larger font)
- **FR-011**: System MUST sanitize title text to prevent XSS attacks (same as existing content rendering)
- **FR-012**: Debug formatting MUST maintain readability when content is scrollable (fixed-width layout)
- **FR-013**: System MUST handle missing or empty title fields without errors or layout issues
- **FR-014**: System MUST support debug items with title field just like text and image items

### Key Entities *(include if feature involves data)*

- **ResponseContentItem** (enhanced): Individual content piece returned by server, now supporting:
  - `type`: Content type identifier (existing: "text", "image"; new: "debug")
  - `content`: Content payload - interpretation depends on type:
    - type="text": string (existing)
    - type="image": URL string (existing)
    - type="debug": JSON object or array (new)
  - `title`: Optional title text to display above content (new field, applies to all types)
  - `metadata`: Optional metadata (existing)

- **Debug Content**: Specialized content type for technical/structured data:
  - Contains JSON-serializable data (objects, arrays, primitives)
  - Rendered with syntax highlighting (implicit via monospace + formatting)
  - Supports same title feature as other content types

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can distinguish different content sections by title at a glance (measured by time to locate specific content - target <2 seconds)
- **SC-002**: Debug JSON formatting renders with proper indentation for objects up to 20 levels deep without performance degradation
- **SC-003**: Titles render consistently across all viewport sizes from 320px (mobile) to 3840px (4K desktop)
- **SC-004**: Debug content with 1000+ lines of JSON remains readable and scrollable without layout breaks
- **SC-005**: Backward compatibility maintained - existing server responses without title field work without errors (100% compatibility)
- **SC-006**: Debug JSON formatting matches standard code editor formatting (2-space indent, consistent bracket alignment)
- **SC-007**: Users can read debug JSON content without horizontal scrolling on viewports ≥768px wide
