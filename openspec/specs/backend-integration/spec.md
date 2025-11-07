# Backend Integration Capability

## Purpose

This capability enables users to configure a backend endpoint where captured tweet data is sent for processing, with support for both synchronous and asynchronous response handling.

## Requirements

### Requirement: Settings Page Access

The system SHALL provide a settings/configuration page accessible from the extension popup or toolbar.

#### Scenario: Access settings from popup
- **WHEN** user clicks on extension icon in toolbar
- **THEN** popup provides access to settings/configuration page

### Requirement: Endpoint URL Configuration

The settings page SHALL allow users to input, save, and persist a POST endpoint URL.

#### Scenario: Save endpoint URL
- **WHEN** user enters a valid URL in the endpoint field and saves
- **THEN** URL is persisted using browser extension storage API

#### Scenario: Restore saved URL
- **WHEN** user reopens the settings page after saving an endpoint
- **THEN** previously saved URL is displayed in the input field

#### Scenario: Clear endpoint URL
- **WHEN** user clears or removes the configured endpoint URL
- **THEN** endpoint is removed from storage and subsequent captures use console-only mode

### Requirement: URL Format Validation

The system MUST validate URL format before saving, requiring valid HTTP or HTTPS URLs.

#### Scenario: Reject invalid URL format
- **WHEN** user enters an invalid URL format and attempts to save
- **THEN** validation error message indicates correct URL format required and URL is not saved

#### Scenario: Accept valid HTTPS URL
- **WHEN** user enters valid HTTPS URL
- **THEN** validation passes and URL is saved successfully

### Requirement: POST Tweet Data to Endpoint

When Yoink button is clicked and endpoint is configured, the system SHALL POST captured tweet JSON to the configured endpoint.

#### Scenario: POST on capture with configured endpoint
- **WHEN** user clicks Yoink button and endpoint is configured
- **THEN** tweet JSON data is POSTed to configured endpoint with Content-Type application/json header

#### Scenario: Console-only mode when no endpoint
- **WHEN** user clicks Yoink button with no endpoint configured
- **THEN** captured data is logged to console with notice that no endpoint is configured

### Requirement: HTTP Request Headers

POST requests MUST include Content-Type application/json header and any user-configured custom headers.

#### Scenario: Include JSON content type
- **WHEN** system POSTs tweet data
- **THEN** Content-Type application/json header is included

#### Scenario: Include custom authentication headers
- **WHEN** user has configured custom headers (Authorization, API-Key)
- **THEN** all configured headers are included in POST requests

#### Scenario: Persist multiple headers
- **WHEN** user configures multiple custom headers and saves
- **THEN** all headers are persisted and sent with subsequent requests

### Requirement: Response Logging

The system SHALL log complete HTTP response (status code, headers, body) to browser console.

#### Scenario: Log successful response
- **WHEN** POST request succeeds with 2xx status code
- **THEN** response body is logged to console with success indicator

#### Scenario: Log failed response
- **WHEN** POST request fails with 4xx/5xx status or network error
- **THEN** error details are logged to console with descriptive messages

#### Scenario: Log regardless of POST outcome
- **WHEN** POST completes (success or failure)
- **THEN** captured data is also logged to console for debugging purposes

### Requirement: Visual Feedback During POST

The system MUST provide visual feedback during POST operation with loading state on button.

#### Scenario: Show loading state during POST
- **WHEN** POST is in progress after clicking Yoink
- **THEN** Yoink button shows loading state indicating operation in progress

#### Scenario: Restore button state after completion
- **WHEN** POST completes (success or failure)
- **THEN** button state is restored to normal

### Requirement: Domain Permission Management

The system SHALL use chrome.permissions.request() API to request host permission for user-configured endpoint domain before sending first request.

#### Scenario: Prompt for new domain permission
- **WHEN** user configures endpoint with new domain for first time
- **THEN** system prompts for permission to access that domain

#### Scenario: Remember domain permission
- **WHEN** user has granted permission for a domain
- **THEN** permission persists across sessions without re-prompting

### Requirement: Synchronous Request Timeout

The system MUST handle synchronous POST timeout after 30 seconds.

#### Scenario: Timeout long-running requests
- **WHEN** POST request takes longer than 30 seconds without response
- **THEN** request times out with clear error message logged to console

### Requirement: Sensitive Data Protection

The system MUST NOT log sensitive header values (Authorization, API-Key) to console in plain text.

#### Scenario: Redact sensitive headers in logs
- **WHEN** system logs request details containing sensitive headers
- **THEN** header values are redacted or masked in console output

### Requirement: Asynchronous Response Detection

When endpoint response includes requestId field and status "pending" or "processing", the system SHALL initiate polling for request completion.

#### Scenario: Detect async response pattern
- **WHEN** endpoint returns response with requestId and status "pending"
- **THEN** system begins polling status endpoint with the request ID

#### Scenario: Handle synchronous response pattern
- **WHEN** endpoint returns final data without requestId
- **THEN** response is logged immediately without polling

### Requirement: Status Polling Intervals

Polling MUST check status endpoint at reasonable intervals without overwhelming the server.

#### Scenario: Poll at configured intervals
- **WHEN** system is polling for request completion
- **THEN** status endpoint is checked every 2-5 seconds (configurable)

#### Scenario: Avoid server overload
- **WHEN** multiple requests are being polled
- **THEN** polling intervals prevent excessive server load

### Requirement: Polling Completion Conditions

Polling SHALL stop when status becomes "completed", "failed", or "error", and log final result to console.

#### Scenario: Stop polling on completion
- **WHEN** status endpoint returns status "completed"
- **THEN** polling stops and final result is logged to console

#### Scenario: Stop polling on failure
- **WHEN** status endpoint returns status "failed" or "error"
- **THEN** polling stops and error details are logged to console

### Requirement: Polling Timeout

Polling MUST timeout after maximum duration (5 minutes) to prevent infinite polling.

#### Scenario: Timeout after maximum duration
- **WHEN** polling duration reaches 5 minutes without completion
- **THEN** polling stops with timeout message logged to console

### Requirement: Concurrent Async Request Tracking

The system SHALL track multiple concurrent async requests independently without blocking UI or interfering with each other.

#### Scenario: Handle multiple concurrent requests
- **WHEN** user captures multiple tweets triggering async requests
- **THEN** each request is tracked independently with separate polling

#### Scenario: No UI blocking during polling
- **WHEN** async polling is in progress
- **THEN** users can continue capturing tweets without waiting for completion

#### Scenario: Support at least 10 concurrent requests
- **WHEN** 10 or more async requests are being polled simultaneously
- **THEN** system handles all requests without performance degradation

### Requirement: Polling Endpoint Configuration

The settings page SHALL allow users to configure status polling endpoint URL with default pattern.

#### Scenario: Use default polling pattern
- **WHEN** user configures POST endpoint but not polling endpoint
- **THEN** system defaults to POST endpoint with `/status/{requestId}` pattern

#### Scenario: Override polling endpoint
- **WHEN** user configures custom status polling endpoint URL
- **THEN** system uses custom URL for status checks

### Requirement: Polling Persistence Across Restarts

The system SHALL persist active polling requests and resume polling after browser restart if requests are still pending.

#### Scenario: Resume polling after browser restart
- **WHEN** browser restarts with active async requests pending
- **THEN** system resumes polling for those requests from persisted state

#### Scenario: Clean up completed requests
- **WHEN** polling completes (success or timeout)
- **THEN** request is removed from persistent storage

### Requirement: Configuration Persistence

Configuration MUST persist across browser restarts and extension reloads without data loss.

#### Scenario: Preserve settings across restarts
- **WHEN** browser restarts after user saves settings
- **THEN** all settings (endpoint URL, headers, polling config) are preserved

### Requirement: Non-Blocking Capture on POST Failure

POST failures SHALL NOT block the Yoink button - users can continue capturing tweets even if endpoint is unavailable.

#### Scenario: Continue captures after POST failure
- **WHEN** POST request fails due to network error or server error
- **THEN** Yoink button is re-enabled and user can capture additional tweets

#### Scenario: Graceful degradation to console-only
- **WHEN** endpoint is unreachable
- **THEN** system logs error but continues logging data to console
