# Feature Specification: Add Tweet and Author URLs to Data Schema

**Feature Branch**: `006-add-tweet-urls`
**Created**: 2025-11-01
**Status**: Draft
**Input**: User description: "Add author profile URLs and tweet permalink URLs to TweetData schema"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Link to Original Tweet for Verification (Priority: P1)

As a backend analyst reviewing captured tweet data, I want direct access to the original tweet URL so that I can quickly verify the tweet content, check for updates, and view the full conversation context without manually searching Twitter.

**Why this priority**: This is the most critical enhancement - having a direct link to the source tweet is fundamental for verification, fact-checking, and maintaining data provenance. Without it, analysts must manually search for tweets or reconstruct URLs, which is error-prone and time-consuming.

**Independent Test**: Can be fully tested by capturing a tweet and verifying that the JSON contains a valid `url` field pointing to the tweet's permalink. Delivers immediate value by enabling one-click verification of any captured tweet.

**Acceptance Scenarios**:

1. **Given** I capture a regular tweet, **When** I examine the extracted data, **Then** the `url` field contains the full tweet permalink (e.g., `https://x.com/username/status/1234567890`)
2. **Given** I click on the tweet URL in the data, **When** the link opens, **Then** it navigates directly to the original tweet on Twitter/X
3. **Given** the tweet URL cannot be extracted from the DOM, **When** extraction completes, **Then** the system constructs a valid URL from available tweet metadata

---

### User Story 2 - Access Author Profiles for Context Analysis (Priority: P2)

As a backend analyst, I want direct links to tweet authors' profiles so that I can quickly assess the author's credibility, posting history, follower count, and other contextual information that helps evaluate the tweet's significance.

**Why this priority**: Author context is important for analysis but secondary to having the tweet itself. This enables efficient research workflows by providing direct access to author profiles without manual URL construction.

**Independent Test**: Can be tested by capturing tweets from various authors and verifying that each author object includes a valid `profileUrl`. Delivers value by streamlining author research and credibility assessment.

**Acceptance Scenarios**:

1. **Given** I capture a tweet, **When** I examine the author data, **Then** the `profileUrl` field contains the full profile URL (e.g., `https://x.com/username`)
2. **Given** I capture a quote tweet, **When** I examine the parent tweet data, **Then** the parent author also has a `profileUrl` field
3. **Given** the profile URL cannot be extracted from the DOM, **When** extraction completes, **Then** the system constructs the URL as `https://x.com/{handle}`

---

### User Story 3 - Enable Automated Link Generation in Reports (Priority: P3)

As a backend system generating analysis reports, I want structured URL fields in the data schema so that I can automatically create clickable links in reports, emails, and dashboards without parsing or reconstructing URLs from fragments.

**Why this priority**: This is a quality-of-life improvement that benefits automated reporting systems. While valuable, it's less critical than the core functionality of providing URLs for human analysts.

**Independent Test**: Can be tested by consuming the API data in a reporting template and verifying that URL fields render as valid hyperlinks. Delivers value by reducing custom URL construction logic in downstream systems.

**Acceptance Scenarios**:

1. **Given** a reporting system consumes captured tweet data, **When** it processes the `url` field, **Then** the field contains a complete, well-formed URL requiring no additional processing
2. **Given** a report template includes author mentions, **When** it uses the `profileUrl` field, **Then** the author name renders as a clickable link to their profile
3. **Given** the data includes nested tweets (quotes/retweets), **When** the report renders, **Then** all author and tweet URLs are present and valid

---

### Edge Cases

- What happens when the tweet URL cannot be extracted from the DOM (deleted tweets, private accounts, extraction failures)?
- How does the system handle author profile URLs when the handle contains special characters or encoding issues?
- What happens for retweets where the parent tweet data is incomplete or missing?
- How should the system construct URLs for tweets with very old ID formats or archived content?
- What happens if the Twitter/X URL structure changes in the future?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Extension MUST extract and include tweet permalink URL in the `url` field of TweetData schema
- **FR-002**: Extension MUST extract and include author profile URL in the `profileUrl` field of all Author objects (main tweet and parent tweets)
- **FR-003**: Tweet URLs MUST follow the format `https://x.com/{username}/status/{tweetId}`
- **FR-004**: Author profile URLs MUST follow the format `https://x.com/{handle}`
- **FR-005**: Extension MUST construct tweet URL from available metadata (author handle, tweet ID) if direct DOM extraction fails
- **FR-006**: Extension MUST construct author profile URL from handle as `https://x.com/{handle}` if direct DOM extraction fails
- **FR-007**: Both `url` and `profileUrl` fields MUST be required (non-nullable) in the schema
- **FR-008**: Extension MUST update the API contract to include `url` as a required field in TweetData schema
- **FR-009**: Extension MUST update the API contract to include `profileUrl` as a required field in Author schema
- **FR-010**: Extension MUST apply the `profileUrl` field to all Author objects, including those in parent tweet data (quotes, retweets)
- **FR-011**: Extension MUST validate that constructed URLs follow the expected format before including them in the data
- **FR-012**: Server backends consuming the data MUST expect `url` and `profileUrl` as required fields in all tweet captures

### Key Entities

- **TweetData Enhancement**: Core tweet data structure extended with:
  - `url`: Required string field containing tweet permalink (e.g., `https://x.com/username/status/1234567890`)
  - Provides direct link to original tweet for verification and reference
  - Extracted from DOM or constructed from author handle + tweet ID

- **Author Enhancement**: Author entity extended with:
  - `profileUrl`: Required string field containing full profile URL (e.g., `https://x.com/username`)
  - Applied to all Author objects (main tweet and parent tweets)
  - Extracted from DOM or constructed from handle as `https://x.com/{handle}`

- **URL Construction Fallback**: Defensive extraction strategy:
  - Primary: Extract URL directly from DOM elements (most reliable)
  - Fallback: Construct URL from known data (handle, tweet ID) using standard Twitter/X URL patterns
  - Ensures required fields are always populated even if DOM extraction fails

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of captured tweets include valid `url` field containing tweet permalink
- **SC-002**: 100% of Author objects (main and parent tweets) include valid `profileUrl` field
- **SC-003**: URL construction fallback successfully generates valid URLs in 100% of cases where direct extraction fails
- **SC-004**: Analysts can navigate from captured data to original tweet in one click (no URL construction required)
- **SC-005**: Backend systems can generate hyperlinks from URL fields without additional processing or validation
- **SC-006**: API contract accurately reflects new required fields, preventing integration issues with consuming services
- **SC-007**: All existing tweet captures remain compatible after migration (legacy data can be backfilled if needed)

## Scope & Constraints

### In Scope

- Adding `url` field to TweetData schema
- Adding `profileUrl` field to Author schema
- Updating API contract documentation
- DOM extraction logic for tweet and author URLs
- URL construction fallback logic
- TypeScript type definitions for new fields
- Validation of URL format and structure

### Out of Scope

- Backfilling existing captured data with URLs (can be handled separately)
- URL shortening or customization
- Deep linking to specific parts of tweets (replies, media, etc.)
- Tracking URL changes or redirects over time
- Validating that URLs are still active/accessible
- Supporting alternative Twitter domains (e.g., twitter.com vs x.com - will standardize on x.com)

## Assumptions

- Twitter/X URL structure remains stable (`https://x.com/{handle}/status/{id}` for tweets, `https://x.com/{handle}` for profiles)
- Tweet IDs are available in the DOM or can be reliably extracted
- Author handles are available and valid (already required in current schema)
- Backend systems can handle the schema migration (new required fields)
- Existing validation and testing infrastructure can be extended to cover URL fields
- URLs constructed from handles and IDs will remain valid for reasonable time periods

## Dependencies

- Existing tweet extraction logic (Feature 002-post-view-yoink)
- API contract definitions (Feature 003-config-endpoint)
- TypeScript type system and strict mode compilation
- DOM extraction infrastructure and fallback mechanisms
