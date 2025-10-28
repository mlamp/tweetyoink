# Feature Specification: Post View Yoink

**Feature Branch**: `002-post-view-yoink`
**Created**: 2025-10-24
**Status**: Draft
**Input**: User description: "Let's implement post view yoinking, there's tests/fixtures/x-tweet-sample.html file and also the README.md file to pinpoint how the layout/html currently looks like and where to extract the data, considering what information I previously gave, make a good plan how to gather the data and currently is fine if extension is just console.log'ing it out. Also, I'm thinking to add some button inside this: /html/body/div[1]/div/div/div[2]/main/div/div/div/div[1]/div/section/div/div/div[1]/div/div/article/div/div/div[2]/div[2]/div/div[1]/div[2]/div - Or maybe it's easier to detect where Grok's button is and then traverse higher to select the whole post/etc. I feel that it would be better for the button to detect where Grok's button is and then traverse higher to select the whole post/etc."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Manual Tweet Capture (Priority: P1)

A user is browsing X/Twitter and encounters a tweet they want to capture. They click a "Yoink" button that appears adjacent to the "More" menu (three dots) on the tweet. The extension extracts all relevant tweet data and displays it in the console for verification.

**Why this priority**: This is the core MVP functionality - the ability to capture a single tweet on demand. Without this, no other features can exist. It delivers immediate value by proving the extraction mechanism works.

**Independent Test**: Can be fully tested by navigating to any tweet on X/Twitter, clicking the Yoink button, and verifying that structured tweet data appears in the browser console. Success means the button appears, responds to clicks, and extracts data correctly.

**Acceptance Scenarios**:

1. **Given** a user is viewing a tweet on X/Twitter, **When** they hover near the tweet actions area, **Then** a "Yoink" button appears adjacent to the "More" menu button (three dots)
2. **Given** the Yoink button is visible, **When** the user clicks it, **Then** the extension extracts the tweet data and logs it to the console
3. **Given** the tweet has been captured, **When** the user checks the console, **Then** they see structured JSON containing tweet text, author info, timestamp, and engagement metrics
4. **Given** a tweet with media attachments, **When** the user clicks Yoink, **Then** the console output includes media URLs and types
5. **Given** a tweet with a link card, **When** the user clicks Yoink, **Then** the console output includes the link card URL and title

---

### User Story 2 - Button Injection & Positioning (Priority: P1)

The extension intelligently detects the "More" menu button (three dots) location on each tweet and injects a custom "Yoink" button as the first item (leftmost position) in the same action bar, before any existing buttons including Grok. If the "More" button is not found, it falls back to using the Grok button as anchor. The button styling matches X/Twitter's design language and remains stable as the user scrolls through their feed.

**Why this priority**: Button injection is critical infrastructure for user interaction. Without reliable button placement, users cannot trigger captures. This must work consistently across different tweet types (standalone, replies, retweets, quotes).

**Independent Test**: Can be tested by scrolling through an X/Twitter feed and verifying that Yoink buttons appear on every tweet as the first (leftmost) button in the action bar. Success means buttons appear within 500ms of tweet visibility and don't shift position during scrolling.

**Acceptance Scenarios**:

1. **Given** the user loads their X/Twitter timeline, **When** tweets render on screen, **Then** each tweet displays a Yoink button as the first (leftmost) button in the action bar within 500ms
2. **Given** a tweet is in the viewport, **When** the user scrolls past it and returns, **Then** the Yoink button remains in the same position (no duplicate buttons)
3. **Given** different tweet types (standalone, reply, retweet, quote), **When** they render, **Then** the Yoink button appears in the correct action bar for each type
4. **Given** the user navigates to a single tweet view, **When** the page loads, **Then** the Yoink button appears on the focused tweet
5. **Given** new tweets load dynamically (infinite scroll), **When** they enter the viewport, **Then** Yoink buttons are injected automatically

---

### User Story 3 - Data Extraction Coverage (Priority: P2)

The extension extracts comprehensive tweet data including text content, author profile information, engagement metrics, timestamps, media references, and link previews. Extraction is defensive and handles edge cases like deleted media, missing metrics, or truncated text.

**Why this priority**: While button injection (P1) enables user interaction, comprehensive data extraction delivers the actual value. This can be implemented incrementally - starting with basic fields (text, author) and expanding to media, metrics, and metadata. The feature remains useful even with partial extraction.

**Independent Test**: Can be tested by capturing tweets with various content types (text-only, with images, with videos, with polls, with link cards) and verifying the console output includes all expected fields. Success means 95%+ of common tweet elements are extracted correctly.

**Acceptance Scenarios**:

1. **Given** a text-only tweet, **When** captured, **Then** the output includes tweet text, author handle, display name, timestamp, and basic metrics (replies, retweets, likes, views)
2. **Given** a tweet with image attachments, **When** captured, **Then** the output includes image URLs and alt text (if available)
3. **Given** a tweet with a video, **When** captured, **Then** the output includes video URL, thumbnail URL, and duration metadata
4. **Given** a tweet with a link card, **When** captured, **Then** the output includes link URL, preview title, and preview description
5. **Given** a tweet with missing or incomplete data (e.g., deleted media), **When** captured, **Then** the extraction completes successfully with null values for missing fields and warnings logged for failed extractions, with confidence score reflecting the data quality
6. **Given** a retweet, **When** captured, **Then** the output distinguishes between the retweeter and original author
7. **Given** a quoted tweet, **When** captured, **Then** the output includes both the quote text and the original quoted tweet data

---

### User Story 4 - Selector Resilience (Priority: P3)

The extension uses defensive DOM extraction with fallback selectors. When X/Twitter updates their DOM structure, the extension automatically falls back to secondary selectors and logs warnings for monitoring. Users experience uninterrupted service even when primary selectors fail.

**Why this priority**: This is a quality-of-life feature that prevents user-facing failures when X/Twitter updates their UI. While important for long-term stability, it's not required for the initial MVP. The extension can launch with primary selectors only and add fallbacks based on real-world selector breakage patterns.

**Independent Test**: Can be tested by manually breaking primary selectors in the test fixture HTML and verifying that extraction still succeeds using fallback selectors. Success means extraction degrades gracefully (lower confidence scores) rather than failing completely.

**Acceptance Scenarios**:

1. **Given** a tweet with modified DOM structure (primary `data-testid` removed), **When** captured, **Then** the extraction falls back to secondary selectors and logs a warning
2. **Given** multiple selector tiers fail, **When** the final fallback succeeds, **Then** the output includes a confidence score indicating degraded extraction quality
3. **Given** all selectors fail for a specific field, **When** captured, **Then** the field is marked as null with an error logged (but extraction of other fields continues)
4. **Given** selector failures occur, **When** logged to console, **Then** the logs include specific selector paths that failed for debugging

---

### Edge Cases

- What happens when a tweet is deleted while the user is viewing it?
  - The Yoink button should remain clickable, but extraction may return partial data (e.g., cached text visible in DOM but metrics/media gone)

- What happens when the user clicks Yoink multiple times rapidly?
  - The button should be disabled during extraction to prevent duplicate captures, then re-enabled after completion or error

- What happens when X/Twitter's DOM structure changes significantly (e.g., class name overhaul)?
  - Fallback selectors activate, confidence scores drop, telemetry logs the failure, and extraction continues with degraded accuracy

- What happens when a tweet contains special characters, emojis, or RTL text?
  - Text extraction preserves all Unicode characters without encoding issues

- What happens when media fails to load (network error, deleted content)?
  - Extraction completes with media URLs marked as unavailable (null or empty array), but other data is captured successfully

- What happens when the user has JavaScript disabled or uses a browser without extension support?
  - The Yoink button does not appear (extension cannot inject), no error is shown to the user

- What happens when the tweet is in a modal/overlay (e.g., lightbox view)?
  - The button injection logic detects the modal context and injects the button in the modal's action bar

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Extension MUST inject a "Yoink" button as the first (leftmost) item in the tweet action bar on every tweet article element
- **FR-002**: Extension MUST detect the "More" menu button (primary) or Grok button (fallback) location, traverse up to find the action bar container, and inject the Yoink button as the first child element
- **FR-003**: Extension MUST detect dynamically loaded tweets and inject buttons automatically
- **FR-004**: Yoink button MUST display as icon-only (no text label) with tooltip on hover, matching X/Twitter's action button visual design (icon size, color scheme, hover states)
- **FR-005**: Extension MUST extract tweet text content
- **FR-006**: Extension MUST extract author information including handle, display name, and verification status
- **FR-007**: Extension MUST extract timestamp with standardized format
- **FR-008**: Extension MUST extract engagement metrics including reply count, retweet count, like count, bookmark count, and view count
- **FR-009**: Extension MUST extract media URLs for images, videos, and GIFs when present
- **FR-010**: Extension MUST extract link card data including URL, title, and description when present
- **FR-011**: Extension MUST detect retweets and extract both retweeter and original author information
- **FR-012**: Extension MUST detect quoted tweets and extract both quote text and original tweet data
- **FR-013**: Extension MUST log extracted data to console as nested JSON with grouped related fields (author object, metrics object, media array) and extraction metadata, with proper indentation
- **FR-014**: Extension MUST include a confidence score in the output indicating extraction quality (1.0 = all primary selectors succeeded, 0.5 = fallbacks used, 0.0 = critical fields missing)
- **FR-015**: Extraction functions MUST return null for missing fields rather than throwing errors, allowing partial data capture with warnings logged for failed fields
- **FR-016**: Extension MUST disable the Yoink button during extraction and re-enable after completion or error
- **FR-017**: Extension MUST traverse from anchor button ("More" menu or Grok fallback) upward to find the root tweet article element for full context
- **FR-018**: Extension MUST implement fallback extraction methods for critical fields when primary extraction fails
- **FR-019**: Extension MUST log selector failures with specific paths for debugging and monitoring
- **FR-020**: Yoink button click handler MUST prevent event bubbling to avoid triggering tweet navigation

### Key Entities

- **TweetData**: Represents the complete extracted information from a single tweet, structured as nested JSON objects:
  - **text**: Main tweet text content (preserving formatting and special characters)
  - **author**: Object containing handle, display name, verification status, profile image URL
  - **timestamp**: ISO 8601 format for consistent parsing
  - **metrics**: Object containing reply count, retweet count, like count, bookmark count, view count
  - **media**: Array of objects with image/video/GIF URLs and metadata (alt text, dimensions, type)
  - **linkCard**: Object with URL, title, description, preview image (null if no link card present)
  - **tweetType**: Object with boolean flags (isRetweet, isQuote, isReply)
  - **parent**: Nested TweetData object for quoted or replied-to tweet (null if standalone)
  - **metadata**: Object containing confidence score, capture timestamp, extraction tier used

- **ExtractionMethod**: Represents the hierarchy of extraction strategies for defensive data capture
  - Primary extraction (highest reliability, highest confidence score)
  - Secondary extraction (fallback when primary fails, medium confidence)
  - Tertiary extraction (last resort, lowest confidence)
  - Each tier has an associated confidence score indicating reliability

- **YoinkButton**: Represents the injected UI control
  - Icon-only visual presentation (no text label)
  - Tooltip on hover displaying "Yoink this tweet"
  - Interactive states (default, hover, active, disabled)
  - Visual appearance matching X/Twitter's action button design language
  - Action trigger for tweet capture
  - Positioned as first (leftmost) item in tweet action bar

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can capture a tweet by clicking the Yoink button and see structured data in the console within 1 second
- **SC-002**: Yoink buttons appear on 95%+ of tweets in a typical timeline (handles various tweet types: standalone, replies, retweets, quotes)
- **SC-003**: Button injection completes within 500ms of a tweet becoming visible in the viewport
- **SC-004**: Text extraction accuracy is 100% for standard tweets (text, emojis, special characters preserved)
- **SC-005**: Media URL extraction succeeds for 90%+ of tweets with images, videos, or GIFs (accounts for deleted media)
- **SC-006**: Engagement metrics extraction (replies, retweets, likes, views) succeeds for 95%+ of tweets
- **SC-007**: Link card extraction succeeds for 85%+ of tweets with link previews (accounts for missing metadata)
- **SC-008**: Extraction completes successfully even when 1-2 non-critical fields are missing (graceful degradation)
- **SC-009**: No JavaScript errors thrown during extraction (all errors caught and logged gracefully)
- **SC-010**: Confidence scores accurately reflect extraction quality (1.0 = perfect, 0.5 = degraded, 0.0 = failed)
- **SC-011**: Fallback selectors activate automatically when primary selectors fail, maintaining 70%+ extraction success rate
- **SC-012**: Users can capture 50+ tweets in a single browsing session without performance degradation (no memory leaks or slowdown)

## Clarifications

### Session 2025-10-24

- Q: Should the Yoink button use the "More" button (three dots menu) or Grok button as the anchor point for positioning? → A: Use the "More" button as primary anchor with Grok button as fallback if More button is not found
- Q: Where should the Yoink button be positioned relative to the "More" button and other action buttons? → A: First item from left, even before Grok if present
- Q: What format should the console output use for captured tweet data? → A: Nested JSON grouping related fields (author object, metrics object, media array, etc.) with metadata
- Q: Should the Yoink button display as icon-only, icon with text label, or text-only? → A: Icon with tooltip on hover (no text label) - matches existing X/Twitter action buttons pattern
- Q: How should the extension handle extraction failures for individual fields? → A: Log partial data with warnings for failed fields - confidence score reflects missing data

## Assumptions

- X/Twitter's DOM structure for tweets follows consistent patterns documented in test fixtures
- The "More" menu button (three dots) is consistently present on tweets, with Grok button as reliable fallback for button placement via traversal
- Users have the browser console open or know how to access it to view captured data (developer-focused MVP)
- Tweets are rendered client-side dynamically
- The extension will only run on X/Twitter domains
- Initial implementation targets logged output to console; backend integration is a future enhancement
- Users are comfortable with seeing structured data output in the console (no pretty UI for MVP)
- Button injection will use embedded icons to avoid additional resource loading
- Performance target of 500ms button injection is acceptable for user experience (buttons may not appear instantly but should feel responsive)
