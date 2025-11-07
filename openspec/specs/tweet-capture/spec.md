# Tweet Capture Capability

## Purpose

This capability enables users to extract structured data from tweets on Twitter/X by clicking an injected "Yoink" button.

## Requirements

### Requirement: Button Injection and Positioning

The system SHALL inject a "Yoink" button as the first (leftmost) item in the tweet action bar on every tweet article element.

#### Scenario: Button appears on timeline tweets
- **WHEN** user loads their Twitter/X timeline
- **THEN** each tweet displays a Yoink button as the first button in the action bar within 500ms

#### Scenario: Button persists on scroll
- **WHEN** user scrolls past a tweet and returns to it
- **THEN** the Yoink button remains in the same position without duplicate buttons

#### Scenario: Button appears on dynamically loaded tweets
- **WHEN** new tweets load via infinite scroll
- **THEN** Yoink buttons are injected automatically as tweets enter the viewport

#### Scenario: Button appears on single tweet view
- **WHEN** user navigates to a single tweet permalink page
- **THEN** the Yoink button appears on the focused tweet

### Requirement: Button Visual Design

The Yoink button MUST display as icon-only with tooltip on hover, matching Twitter/X's action button visual design.

#### Scenario: Button matches Twitter design language
- **WHEN** Yoink button is visible next to Twitter action buttons
- **THEN** button uses same icon size, color scheme, and hover states as native buttons

#### Scenario: Tooltip provides context
- **WHEN** user hovers over the Yoink button
- **THEN** tooltip displays "Yoink this tweet"

### Requirement: Button Positioning Strategy

The system MUST detect the "More" menu button (primary) or Grok button (fallback) location, traverse up to find the action bar container, and inject the Yoink button as the first child element.

#### Scenario: Uses More menu as primary anchor
- **WHEN** tweet has a "More" menu button (three dots)
- **THEN** system uses it as anchor point for action bar detection

#### Scenario: Falls back to Grok button
- **WHEN** "More" menu button is not found on a tweet
- **THEN** system uses Grok button as anchor point for action bar detection

### Requirement: Tweet Text Extraction

The system SHALL extract tweet text content preserving all formatting, special characters, emojis, and Unicode.

#### Scenario: Extract standard text tweet
- **WHEN** user captures a text-only tweet
- **THEN** output includes complete tweet text with formatting preserved

#### Scenario: Preserve special characters
- **WHEN** tweet contains emojis, RTL text, or special Unicode characters
- **THEN** extraction preserves all characters without encoding issues

### Requirement: Author Information Extraction

The system SHALL extract author information including handle, display name, verification status, profile image URL, and profile URL.

#### Scenario: Extract complete author data
- **WHEN** user captures any tweet
- **THEN** output includes author handle, display name, verification status, profile image URL, and profile URL

#### Scenario: Extract author profile URL
- **WHEN** tweet author data is extracted
- **THEN** profileUrl field contains full profile URL as `https://x.com/{handle}`

#### Scenario: Construct profile URL from handle
- **WHEN** profile URL cannot be extracted from DOM
- **THEN** system constructs URL as `https://x.com/{handle}` using author handle

### Requirement: Temporal Data Extraction

The system MUST extract timestamps in ISO 8601 format for consistent parsing.

#### Scenario: Extract tweet timestamp
- **WHEN** user captures a tweet
- **THEN** output includes timestamp in ISO 8601 format

### Requirement: Engagement Metrics Extraction

The system SHALL extract all available engagement metrics including reply count, retweet count, like count, bookmark count, and view count.

#### Scenario: Extract all metrics
- **WHEN** user captures a tweet
- **THEN** output includes reply count, retweet count, like count, bookmark count, and view count in metrics object

#### Scenario: Handle missing metrics gracefully
- **WHEN** some engagement metrics are unavailable
- **THEN** extraction completes with null values for missing metrics and warnings logged

### Requirement: Media Extraction

The system MUST extract media URLs for images, videos, and GIFs when present, including alt text and metadata.

#### Scenario: Extract image attachments
- **WHEN** user captures a tweet with images
- **THEN** output includes array of image URLs with alt text and dimensions

#### Scenario: Extract video metadata
- **WHEN** user captures a tweet with video
- **THEN** output includes video URL, thumbnail URL, and duration metadata

#### Scenario: Handle missing media gracefully
- **WHEN** media fails to load or is deleted
- **THEN** extraction completes with media URLs marked as unavailable but other data captured successfully

### Requirement: Link Card Extraction

The system SHALL extract link card data including URL, title, description, and preview image when present.

#### Scenario: Extract link card metadata
- **WHEN** user captures a tweet with link preview
- **THEN** output includes link URL, preview title, preview description, and preview image

#### Scenario: Handle missing link cards
- **WHEN** tweet has no link card
- **THEN** linkCard field is null without errors

### Requirement: Retweet Detection

The system MUST detect retweets and extract both retweeter and original author information.

#### Scenario: Identify and extract retweet data
- **WHEN** user captures a retweet
- **THEN** output distinguishes between retweeter and original author with both sets of author data

### Requirement: Quote Tweet Detection

The system SHALL detect quoted tweets and extract both quote text and original tweet data.

#### Scenario: Extract quote and parent tweet
- **WHEN** user captures a quote tweet
- **THEN** output includes both quote text and complete original quoted tweet data as nested TweetData object

### Requirement: Tweet Permalink Extraction

The system MUST extract and include tweet permalink URL following format `https://x.com/{username}/status/{tweetId}`.

#### Scenario: Extract tweet permalink from DOM
- **WHEN** user captures any tweet
- **THEN** url field contains full tweet permalink

#### Scenario: Navigate to original tweet
- **WHEN** analyst clicks on the tweet URL from captured data
- **THEN** link navigates directly to original tweet on Twitter/X

#### Scenario: Construct permalink from metadata
- **WHEN** tweet URL cannot be extracted from DOM
- **THEN** system constructs valid URL from author handle and tweet ID

### Requirement: Defensive Extraction with Fallbacks

The system MUST implement fallback extraction methods using tiered selectors (data-testid primary, element structure secondary, final fallback tertiary).

#### Scenario: Primary selector succeeds
- **WHEN** primary data-testid selector finds target element
- **THEN** extraction uses primary method with confidence score 1.0

#### Scenario: Fallback to secondary selectors
- **WHEN** primary selector fails but secondary selector succeeds
- **THEN** extraction uses fallback with confidence score 0.5 and warning logged

#### Scenario: All selectors fail for field
- **WHEN** all selector tiers fail for a specific field
- **THEN** field is marked as null, error logged, but extraction of other fields continues

### Requirement: Extraction Resilience

Extraction functions MUST return null for missing fields rather than throwing errors, allowing partial data capture.

#### Scenario: Graceful degradation on partial failure
- **WHEN** extraction of 1-2 non-critical fields fails
- **THEN** system completes capture with null values for failed fields and warnings logged

#### Scenario: No JavaScript errors during extraction
- **WHEN** any extraction error occurs
- **THEN** error is caught and logged gracefully without throwing exceptions

### Requirement: Console Output Format

The system SHALL log extracted data to console as nested JSON with grouped related fields (author object, metrics object, media array) and extraction metadata.

#### Scenario: Structured console output
- **WHEN** user captures a tweet
- **THEN** console displays properly indented JSON with nested objects for author, metrics, media, and metadata

#### Scenario: Include extraction metadata
- **WHEN** tweet data is logged to console
- **THEN** output includes confidence score, capture timestamp, and extraction tier used

### Requirement: Confidence Scoring

The system MUST include a confidence score in the output indicating extraction quality (1.0 = all primary selectors succeeded, 0.5 = fallbacks used, 0.0 = critical fields missing).

#### Scenario: Perfect extraction confidence
- **WHEN** all fields extracted via primary selectors
- **THEN** confidence score is 1.0

#### Scenario: Degraded extraction confidence
- **WHEN** fallback selectors used for some fields
- **THEN** confidence score reflects degradation (0.5 for secondary, lower for tertiary)

#### Scenario: Failed extraction confidence
- **WHEN** critical fields cannot be extracted
- **THEN** confidence score is 0.0

### Requirement: Button Interaction Handling

The system MUST disable the Yoink button during extraction and re-enable after completion or error.

#### Scenario: Prevent duplicate captures
- **WHEN** user clicks Yoink button
- **THEN** button is disabled immediately to prevent multiple rapid clicks

#### Scenario: Re-enable after completion
- **WHEN** extraction completes successfully or with error
- **THEN** button is re-enabled for next capture

#### Scenario: Prevent event bubbling
- **WHEN** user clicks Yoink button
- **THEN** click event does not bubble to trigger tweet navigation

### Requirement: Selector Failure Telemetry

The system SHALL log selector failures with specific paths for debugging and monitoring.

#### Scenario: Log failed selector paths
- **WHEN** any selector fails during extraction
- **THEN** system logs specific selector path that failed with contextual information

### Requirement: Tweet Context Traversal

The system MUST traverse from anchor button upward to find the root tweet article element for full context.

#### Scenario: Find tweet article from button
- **WHEN** system injects Yoink button using anchor detection
- **THEN** traversal successfully locates root tweet article element containing all tweet data

### Requirement: Multi-Session Performance

The system SHALL support capturing 50+ tweets in a single browsing session without performance degradation.

#### Scenario: No memory leaks
- **WHEN** user captures 50+ tweets in one session
- **THEN** extension maintains consistent performance with no memory leaks or slowdown

### Requirement: Tweet Type Coverage

The system MUST handle button injection for all tweet types including standalone, replies, retweets, and quotes.

#### Scenario: Button appears on all tweet types
- **WHEN** timeline displays mix of standalone, reply, retweet, and quote tweets
- **THEN** Yoink button appears correctly positioned on each tweet type
