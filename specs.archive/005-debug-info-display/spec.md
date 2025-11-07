# Feature Specification: Debug Metadata Display in Overlay UI

**Feature Branch**: `005-debug-info-display`
**Created**: 2025-10-31
**Status**: Draft
**Input**: User description: "I want to possibly dump debug information into the UI, it could draw it differently. Server response includes debug blocks with structured analysis, execution metrics, orchestrator decisions, and request metadata formatted as JSON when running in development environment."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Debug Information During Development (Priority: P1)

As a developer working on TweetYoink, I want to see detailed debug information about server responses directly in the overlay UI so that I can understand what the analysis agent returned, how it made decisions, and diagnose issues without checking server logs.

**Why this priority**: This is the core MVP functionality - developers need visibility into server-side analysis during development. Without this, debugging requires switching between browser and server logs, significantly slowing down development.

**Independent Test**: Can be fully tested by triggering a tweet analysis in development mode and verifying that debug information appears in the overlay. Delivers immediate value by exposing previously hidden server metadata.

**Acceptance Scenarios**:

1. **Given** I'm running the extension in development mode and the server returns a response with debug block, **When** I click "Yoink" on a tweet, **Then** the overlay displays the debug information in a visually distinct section
2. **Given** the overlay is showing debug information, **When** I view the debug section, **Then** I can see orchestrator decisions, agent analyses, execution metrics, and request metadata
3. **Given** debug information contains nested JSON data, **When** I view it in the overlay, **Then** the JSON is formatted in a readable way (not raw JSON string)

---

### User Story 2 - Expand/Collapse Debug Sections (Priority: P2)

As a developer, I want to expand and collapse different sections of debug information so that I can focus on specific parts of the metadata without being overwhelmed by the full dump.

**Why this priority**: Once debug info is visible (P1), the next pain point is information overload. Debug responses can be 18KB+ of JSON, so collapsible sections improve usability.

**Independent Test**: Can be tested by rendering a debug block and clicking expand/collapse controls. Delivers value by making large debug outputs manageable.

**Acceptance Scenarios**:

1. **Given** the overlay displays debug information, **When** I click on a section header (e.g., "Orchestrator Decisions"), **Then** that section expands to show its contents
2. **Given** a debug section is expanded, **When** I click the section header again, **Then** the section collapses to hide its contents
3. **Given** the overlay opens with debug information, **When** the overlay renders, **Then** all debug sections start in a collapsed state (to avoid overwhelming the user)

---

### User Story 3 - No Debug Display in Production (Priority: P3)

As a user of the TweetYoink extension in production, I want the overlay to show only analysis results without any debug information so that the UI remains clean and focused on content.

**Why this priority**: Important for production UX, but less critical than P1/P2 since development mode is the primary use case for debug display. This ensures the feature doesn't leak into production.

**Independent Test**: Can be tested by running the extension in production mode and verifying no debug blocks appear. Delivers value by keeping production UI clean.

**Acceptance Scenarios**:

1. **Given** I'm running the extension in production mode, **When** I analyze a tweet, **Then** the overlay shows only text analysis results without any debug sections
2. **Given** the server returns a debug block in production (edge case), **When** the overlay renders, **Then** the debug block is ignored and not displayed

---

### Edge Cases

- What happens when the debug JSON is malformed or contains circular references?
- How does the overlay handle debug blocks larger than 50KB?
- What if the debug block is missing expected fields (e.g., no `orchestrator_decisions`)?
- How does the UI differentiate between regular text content and debug content?
- What happens if multiple debug blocks are returned in a single response?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Extension MUST detect debug blocks in server responses by checking the `metadata.is_debug` flag
- **FR-002**: Extension MUST render debug blocks differently from regular text content blocks (distinct visual styling)
- **FR-003**: Extension MUST parse JSON content from debug blocks and display it in a formatted, readable way
- **FR-004**: Extension MUST display debug information only when running in development mode
- **FR-005**: Extension MUST handle malformed JSON in debug blocks gracefully without crashing the overlay
- **FR-006**: Extension MUST show the following debug data sections when available:
  - Orchestrator decisions (needs_fact_check, needs_deeper_research, high_bias_detected, propaganda_likely, reasons)
  - Agent analyses (agent name, model, section, structured_analysis)
  - Execution metrics (processing_time_ms, tokens, temperature, model)
  - Request metadata (author, URL, has_media, media_count, text_length)
- **FR-007**: Extension MUST support expanding and collapsing individual debug sections
- **FR-008**: Extension MUST start with all debug sections in a collapsed state by default
- **FR-009**: Extension MUST clearly label debug information to distinguish it from analysis results
- **FR-010**: Extension MUST render debug blocks at the end of the overlay content (after all analysis text)

### Key Entities

- **Debug Block**: A special content item returned by the server containing metadata about the analysis process. Contains:
  - `type`: Always "text"
  - `content`: JSON string with debug data
  - `metadata.is_debug`: Boolean flag set to `true`
  - `metadata.title`: Optional title (e.g., "Debug Information")

- **Debug Data Structure**: The parsed JSON content from a debug block, containing:
  - `orchestrator_decisions`: Object with decision flags and reasoning
  - `agent_analyses`: Array of agent execution details
  - `execution_metrics`: Array of performance metrics per agent
  - `request_metadata`: Object with tweet information

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developers can view complete debug information (all 4 sections: orchestrator decisions, agent analyses, execution metrics, request metadata) in the overlay without checking server logs
- **SC-002**: Debug blocks render within 100ms of receiving server response (no noticeable delay)
- **SC-003**: Extension correctly identifies and displays debug blocks in 100% of development mode requests that include them
- **SC-004**: Production mode displays zero debug blocks regardless of server response content
- **SC-005**: Developers can collapse/expand any debug section in under 1 second (instant UI response)
- **SC-006**: Extension handles debug blocks up to 100KB without performance degradation or UI freezing
- **SC-007**: Malformed JSON in debug blocks results in a user-friendly error message (not a crash) in 100% of cases

## Scope & Constraints

### In Scope

- Rendering debug blocks in overlay UI
- Expanding/collapsing debug sections
- Environment-based visibility (dev vs prod)
- JSON parsing and formatting
- Error handling for malformed JSON

### Out of Scope

- Modifying server-side debug block generation (already implemented)
- Filtering or searching debug content
- Exporting debug information to files
- Comparing debug output across multiple tweets
- Syntax highlighting for JSON content (basic formatting is sufficient)

## Assumptions

- Server already implements debug block generation with `is_debug` flag
- Debug blocks follow the documented JSON structure (orchestrator_decisions, agent_analyses, execution_metrics, request_metadata)
- Development vs production mode can be determined by environment configuration or server response
- Overlay infrastructure (from Feature 004) supports rendering custom content types
- JSON.parse() is sufficient for parsing debug content (no need for specialized JSON libraries)
