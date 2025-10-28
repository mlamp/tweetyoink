# Feature Specification: Configuration Settings & POST Endpoint

**Feature Branch**: `003-config-endpoint`
**Created**: 2025-10-28
**Status**: Draft
**Input**: User description: "extension-config I'd like to add extension configuration view, where I can specify URL where the gathered JSON would be POSTed, I know there might be security concern, as extensions have to specify to where they are POSTing if I'm right? If not, then all good, what I want to archive is to define URL / endpoint where the post goes and the return from the post should be logged into console."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configure POST Endpoint URL (Priority: P1)

Users need to configure where captured tweet data should be sent so they can integrate TweetYoink with their own systems, APIs, or data processing pipelines.

**Why this priority**: This is the core functionality - without the ability to configure the endpoint, users cannot integrate TweetYoink with their systems. This is the foundation for all other configuration features.

**Independent Test**: Can be fully tested by opening the extension settings, entering a URL, saving it, and verifying the URL is persisted when reopening settings. Delivers immediate value by allowing users to specify their integration endpoint.

**Acceptance Scenarios**:

1. **Given** user opens extension settings page, **When** user enters a valid URL in the endpoint field, **Then** the URL is saved and persisted across browser sessions
2. **Given** user has configured an endpoint URL, **When** user reopens the settings page, **Then** the previously saved URL is displayed in the input field
3. **Given** user enters an invalid URL format, **When** user attempts to save, **Then** user sees validation error message indicating correct URL format required
4. **Given** user has no endpoint configured, **When** user clicks Yoink button, **Then** captured data is only logged to console with a notice that no endpoint is configured

---

### User Story 2 - POST Captured Tweet Data (Priority: P2)

When users capture tweet data, the extension should automatically POST the JSON payload to their configured endpoint, enabling automated data collection and processing workflows.

**Why this priority**: Once users can configure an endpoint (P1), the next critical step is actually sending data to it. This completes the integration workflow and delivers the main user value.

**Independent Test**: Can be tested by configuring an endpoint, capturing a tweet, and verifying the POST request is sent with correct JSON payload. Delivers value by enabling automated data collection without P3 features.

**Acceptance Scenarios**:

1. **Given** user has configured a valid endpoint URL, **When** user clicks Yoink button on a tweet, **Then** tweet JSON data is POSTed to the configured endpoint
2. **Given** POST request succeeds (2xx response), **When** response is received, **Then** response body is logged to browser console with success indicator
3. **Given** POST request fails (4xx/5xx response or network error), **When** error occurs, **Then** error details are logged to console and user sees error feedback on button
4. **Given** POST is in progress, **When** waiting for response, **Then** Yoink button shows loading state to indicate operation in progress
5. **Given** endpoint is configured, **When** POST completes (success or failure), **Then** captured data is also logged to console for debugging purposes

---

### User Story 3 - Manage Endpoint Security & Headers (Priority: P3)

Users need to configure authentication headers and other request options to securely POST data to protected endpoints.

**Why this priority**: While important for production use, basic POST functionality (P1-P2) works for testing and open endpoints. Authentication can be added after core flow is validated.

**Independent Test**: Can be tested by adding authentication headers in settings and verifying they're included in POST requests. Delivers value by enabling secure API integrations.

**Acceptance Scenarios**:

1. **Given** user opens settings page, **When** user adds custom headers (e.g., Authorization, API-Key), **Then** headers are included in all POST requests
2. **Given** user configures multiple headers, **When** user saves settings, **Then** all headers are persisted and sent with requests
3. **Given** user removes a header, **When** user saves settings, **Then** that header is no longer included in subsequent requests

---

### User Story 4 - Long-Running Async Processing (Priority: P3)

For endpoints that perform time-consuming operations (LLM processing, data analysis, etc.), users need the extension to handle async responses where the server returns a request ID and the extension polls for completion.

**Why this priority**: Core functionality (P1-P2) handles synchronous responses. Async processing is valuable for advanced integrations but not required for basic usage. Can be implemented after core POST flow is stable.

**Independent Test**: Can be tested by configuring an endpoint that returns a request ID in the initial response, and verifying the extension polls a status endpoint until completion. Delivers value by enabling long-running server-side processing.

**Acceptance Scenarios**:

1. **Given** endpoint returns response with `requestId` field and status "pending", **When** extension receives this response, **Then** extension begins polling the status endpoint with the request ID
2. **Given** extension is polling for request status, **When** status endpoint returns "completed" or "failed", **Then** polling stops and final result is logged to console
3. **Given** polling is in progress, **When** maximum polling duration is reached (e.g., 5 minutes), **Then** polling stops with timeout message logged to console
4. **Given** multiple Yoink captures trigger async requests, **When** polling for multiple requests simultaneously, **Then** each request is tracked independently without interference

---

### Edge Cases

- What happens when endpoint URL becomes unreachable during operation? (timeout handling, retry behavior)
- How does system handle very large tweet payloads (videos, long threads)? (request size limits)
- What if user changes endpoint URL while requests are in flight? (cancel pending requests, use new URL for subsequent captures)
- How does system handle slow endpoint responses? (timeout after 30 seconds for synchronous responses)
- What if endpoint returns non-standard response format? (log raw response regardless of content-type)
- What happens when user has no internet connection? (fail gracefully, clear error message)
- How does system handle CORS issues with the endpoint? (Chrome extensions bypass CORS, but document this behavior)
- What if server returns request ID but status endpoint is never reachable? (timeout polling after maximum duration)
- How does system handle multiple concurrent async requests? (track each independently, don't block UI)
- What happens if user closes browser while polling is active? (extension should resume polling on restart if request is still pending)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Extension MUST provide a settings/configuration page accessible from extension popup or toolbar
- **FR-002**: Settings page MUST allow users to input and save a POST endpoint URL
- **FR-003**: System MUST validate URL format before saving (must be valid HTTP/HTTPS URL)
- **FR-004**: System MUST persist endpoint configuration using browser extension storage API
- **FR-005**: When Yoink button is clicked and endpoint is configured, system MUST POST captured tweet JSON to the configured endpoint
- **FR-006**: POST request MUST include Content-Type: application/json header
- **FR-007**: System MUST log complete HTTP response (status code, headers, body) to browser console
- **FR-008**: System MUST log POST errors (network failures, HTTP errors) to browser console with descriptive messages
- **FR-009**: System MUST continue logging captured data to console regardless of POST success/failure
- **FR-010**: System MUST provide visual feedback during POST operation (loading state on button)
- **FR-011**: System MUST use `chrome.permissions.request()` API to request host permission for user-configured endpoint domain before sending first request
- **FR-012**: When user configures new endpoint with different domain, system MUST prompt for permission to access that domain
- **FR-013**: Settings page MUST allow users to clear/remove configured endpoint URL
- **FR-014**: System MUST handle synchronous POST timeout after 30 seconds
- **FR-015**: Settings page MAY allow users to configure custom HTTP headers (authentication tokens, API keys, etc.)
- **FR-016**: System MUST NOT log sensitive header values (Authorization, API-Key, etc.) to console in plain text
- **FR-017**: When endpoint response includes `requestId` field and status "pending" or "processing", system MUST initiate polling for request completion
- **FR-018**: Polling MUST check status endpoint at reasonable intervals (e.g., every 2-5 seconds) without overwhelming the server
- **FR-019**: Polling MUST stop when status becomes "completed", "failed", or "error", and log final result to console
- **FR-020**: Polling MUST timeout after maximum duration (e.g., 5 minutes) to prevent infinite polling
- **FR-021**: System MUST track multiple concurrent async requests independently without blocking UI or interfering with each other
- **FR-022**: Settings page MUST allow users to configure status polling endpoint URL (defaults to same as POST endpoint with `/status/{requestId}` pattern)
- **FR-023**: System MUST persist active polling requests and resume polling after browser restart if requests are still pending

### Key Entities

- **Extension Configuration**: Stores user preferences including endpoint URL, status polling endpoint URL, custom headers, and polling settings. Persisted in browser extension storage.
- **POST Request**: HTTP request containing captured tweet data as JSON payload, sent to user-configured endpoint with appropriate headers.
- **Synchronous Response**: Immediate server response containing final processed data, logged directly to console.
- **Async Response**: Server response containing request ID and status indicator (pending/processing), triggers polling flow.
- **Polling Request**: HTTP GET request to status endpoint with request ID to check completion status.
- **Request Tracker**: Internal tracking of active async requests, including request ID, start time, polling interval, and current status. Persisted to survive browser restarts.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can configure endpoint URL and save settings in under 30 seconds
- **SC-002**: Synchronous POST requests complete within 30 seconds or timeout with clear error message
- **SC-003**: 100% of POST responses (success and failure) are logged to browser console with complete details
- **SC-004**: Users can verify integration success by checking console logs without additional debugging tools
- **SC-005**: Configuration persists across browser restarts and extension reloads without data loss
- **SC-006**: POST failures do not block the Yoink button - users can continue capturing tweets even if endpoint is unavailable
- **SC-007**: Async requests poll for completion without blocking UI - users can continue capturing tweets while polling is active
- **SC-008**: Polling completes within 5 minutes maximum or times out with descriptive message
- **SC-009**: Users receive clear console feedback showing polling progress and final results for async requests
- **SC-010**: Extension handles at least 10 concurrent async requests without performance degradation or interference
- **SC-011**: Permission prompts appear only once per domain and are remembered across sessions
